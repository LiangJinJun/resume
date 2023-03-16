var myChart = echarts.init(document.getElementById('hello'));



option = {
    // title: {
    //     text: '某站点用户访问来源',
    //     subtext: '纯属虚构',
    //     left: 'center'
    // },
    tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b} : {c} ({d}%)'
    },
    // legend: {
    //     orient: 'vertical',
    //     left: 'left',
    //     data: ['直接访问', '邮件营销', '联盟广告', '视频广告', '搜索引擎']
    // },
    series: [{
        name: '访问来源',
        type: 'pie',
        radius: '38%',
        center: ['50%', '50%'],
        data: [{
                value: 880,
                name: 'Vue'
            },
            {
                value: 300,
                name: 'React'
            },
            {
                value: 850,
                name: 'UniApp'
            },
              {
                value: 830,
                name: '组件封装/复用性'
            },
            {
                value: 850,
                name: 'UI组件库'
            },

        ],
        emphasis: {
            itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
        }
    }]
};



// 使用刚指定的配置项和数据显示图表。
myChart.setOption(option);
