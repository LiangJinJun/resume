const {username, password, host, port} = require("./config_test");
module.exports = Object.freeze({
  servers: [
    {
      publicPath: "dist", // 项目打包之后的文件夹名称，一般都是dist文件夹，如果你的项目打包成别的文件夹名称，填写打包之后文件夹名称即可
      name: "测试环境", // 部署环境的名称
      username, // 部署服务器的账号
      password, // 部署服务器的密码，如果重要，可以不写在当前配置文件中
      host, //服务器ip
      port, //端口
      path: "home/liangjinjun/resume", //前端代码在服务器下的路径
      script: "build", //打包命令
    },
  ],
});