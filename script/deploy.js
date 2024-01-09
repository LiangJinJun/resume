const path = require("path");
const fs = require("fs");
const chalk = require("chalk");
const ora = require("ora");
const NodeSSH = require("node-ssh").NodeSSH;
const shell = require("shelljs");
const inquirer = require("inquirer");
const compressing = require("compressing");
const CONFIG = require("script/cofig");

const SSH = new NodeSSH();
let config;

const defaultLog = (log) =>
  console.log(chalk.blue(`---------------- ${log} ----------------`));
const errorLog = (log) =>
  console.log(chalk.red(`---------------- ${log} ----------------`));
const successLog = (log) =>
  console.log(chalk.green(`---------------- ${log} ----------------`));


const compileDist = async () => {
    const loading = ora(defaultLog("项目开始打包")).start();
    shell.cd(path.resolve(__dirname, "../"));
    const res = await shell.exec(`yarn ${config.script}`); //执行shell 打包命令
    loading.clear();
    if (res.code === 0) {
        successLog("项目打包成功!");
    } else {
        errorLog("项目打包失败, 请重试!");
        process.exit(); //退出流程
    }
};

//压缩代码
const zipDist = async () => {
    defaultLog("项目开始压缩");
    try {
        const distDir = path.resolve(__dirname, `../${config.publicPath}`);
        const distZipPath = path.resolve(__dirname, `../${config.publicPath}.zip`);
        await compressing.zip.compressDir(distDir, distZipPath);
        successLog("压缩成功!");
    } catch (error) {
        errorLog(error);
        errorLog("压缩失败, 退出程序!");
        process.exit(); //退出流程
    }
};

//连接服务器
const connectSSH = async () => {
    const loading = ora(defaultLog("正在连接服务器")).start();
    try {
        await SSH.connect({
            host: config.host,
            username: config.username,
            password: config.password,
        });
        successLog("SSH连接成功!");
    } catch (error) {
        errorLog(error);
        console.log(error);
        errorLog("SSH连接失败!");
        process.exit(); //退出流程
    }
    loading.clear();
};

const runCommand = async (command) => {
    await SSH.exec(command, [], { cwd: config.path });
};

//备份、清空线上目标目录里的旧文件
const clearOldFile = async () => {
    const date = new Date().getDate();
    const mouth = new Date().getMonth();
    await runCommand(`mkdir -p ${config.publicPath}`);
    await runCommand(
        `cp -r ${config.publicPath} ${config.publicPath}_${mouth + 1}${date}`
    );
    await runCommand(`rm -rf ${config.publicPath}`);
};

const uploadZipBySSH = async () => {
    //连接ssh
    await connectSSH();
    await clearOldFile();
    const loading = ora(defaultLog("准备上传文件")).start();
    try {
        const distZipPath = path.resolve(__dirname, `../${config.publicPath}.zip`);
        await SSH.putFiles([
            { local: distZipPath, remote: config.path + `/${config.publicPath}.zip` },
        ]); //local 本地 ; remote 服务器 ;
        successLog("上传成功!");
        loading.text = "正在解压文件";
        await runCommand(`unzip ./${config.publicPath}.zip`); //解压
        await runCommand(`rm -rf ./${config.publicPath}.zip`);
        SSH.dispose(); //断开连接
    } catch (error) {
        errorLog(error);
        errorLog("上传失败!");
        process.exit(); //退出流程
    }
    loading.clear();
};

const clearZipDist = async () => {
    const distZipPath = path.resolve(__dirname, `../${config.publicPath}.zip`);
    fs.unlink(distZipPath, () => {});
};

const runUploadTask = async () => {
    //打包
    await compileDist();
    //压缩
    await zipDist();

    //连接服务器上传文件
    await uploadZipBySSH();

    await clearZipDist();

    successLog("部署成功!");
    process.exit();
};

const checkConfig = (conf) => {
    const checkArr = Object.entries(conf);
    checkArr.map((it) => {
        const key = it[0];
        if (key === "PATH" && conf[key] === "/") {
            //上传zip前会清空目标目录内所有文件
            errorLog("PATH 不能是服务器根目录!");
            process.exit(); //退出流程
        }
        if (!conf[key]) {
            errorLog(`配置项 ${key} 不能为空`);
            process.exit(); //退出流程
        }
    });
};

async function inputPwd() {
    const data = await inquirer.prompt([
        {
            type: "password",
            name: "password",
            message: "服务器密码",
        },
    ]);
    return data.password;
}

async function initInquirer() {
    const data = await inquirer.prompt([
        {
            type: "list",
            message: "请选择发布环境",
            name: "env",
            choices: CONFIG.servers.map((sever) => ({
                name: sever.name,
                value: sever.name,
            })),
        },
    ]);
    config = CONFIG.servers.find((server) => data.env === server.name);
    if (config) {
        if (!config.password) {
            config.password = await inputPwd();
        }
        checkConfig(config);
        await runUploadTask();
    } else {
        errorLog("未找到该环境");
    }
}

initInquirer();

