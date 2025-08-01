var express = require('express');
const axios = require("axios-https-proxy-fix");
const {v4: uuidv4} = require("uuid");
var router = express.Router();

/* GET home page. */
router.post('/makePic', async function (req, res, next) {
  let result = await axios.post("http://127.0.0.1:7860/sdapi/v1/txt2img", req.body, {
    headers: {
      Authorization: 'Bearer YWRtaW46MTIzNDU2'
    }
  })
  res.json({
    code: 0,
    message: {
      id: uuidv4(),
      images: result.data.images,
      createTime: new Date().getTime(),
      userId: req.body.userId
    }
  })
});

router.get('/getProgress', async function (req, res, next) {
  let params = req.query
  let result = await axios.get(`http://127.0.0.1:7860/sdapi/v1/progress?task_id=${params.task_id}&skip_current_image=false`, {
    headers: {
      Authorization: 'Bearer YWRtaW46MTIzNDU2'
    }
  })
  res.json({
    code: 0,
    message: {
      progress: numMulti(result.data.progress.toFixed(2), 100),
      eta: result.data.eta_relative,
      currentImage: result.data.current_image,
      createTime: new Date().getTime()
    }
  })
});

router.get('/getCode', async function (req, res, next) {
  let html = `首先，你需要准备好数据，包括时间和温度两个维度。下面是一个示例数据：

\`\`\`javascript
var data = [
  { time: '2021-10-01', temperature: 25 },
  { time: '2021-10-02', temperature: 23 },
  { time: '2021-10-03', temperature: 20 },
  { time: '2021-10-04', temperature: 18 },
  { time: '2021-10-05', temperature: 19 },
  { time: '2021-10-06', temperature: 22 },
  { time: '2021-10-07', temperature: 24 }
];
\`\`\`

接下来，你需要使用 ECharts 创建一个容器来展示折线图。同时，你需要引入 ECharts 的 JavaScript 文件，具体可参考 ECharts 官方文档。

\`\`\`html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Temperature Chart</title>
  <script src="https://cdn.jsdelivr.net/npm/echarts@5.2.1/dist/echarts.min.js"></script>
</head>
<body>
  <div id="chart" style="width: 600px; height: 400px;"></div>

  <script>
    // 渲染折线图
    var chart = echarts.init(document.getElementById('chart'));

    // 数据
    var data = [
      { time: '2021-10-01', temperature: 25 },
      { time: '2021-10-02', temperature: 23 },
      { time: '2021-10-03', temperature: 20 },
      { time: '2021-10-04', temperature: 18 },
      { time: '2021-10-05', temperature: 19 },
      { time: '2021-10-06', temperature: 22 },
      { time: '2021-10-07', temperature: 24 }
    ];

    // x轴数据
    var xAxisData = data.map(item => item.time);

    // y轴数据
    var yAxisData = data.map(item => item.temperature);

    // 配置项
    var option = {
      title: {
        text: 'Temperature Chart'
      },
      xAxis: {
        data: xAxisData
      },
      yAxis: {},
      series: [{
        name: 'Temperature',
        type: 'line',
        data: yAxisData
      }]
    };

    // 使用配置项渲染图表
    chart.setOption(option);
  </script>
</body>
</html>
\`\`\`

通过上述代码，你便可以在网页上看到一个折线图，表示温度随时间的变化。其中 x 轴表示时间，y 轴表示温度。可以根据自己的实际需求，调整数据和配置项，来绘制更加符合你需求的折线图。`
  res.json({
    code: 0,
    message: html
  })
});
// 解决乘法精度问题
function numMulti(num1, num2) {
  let baseNum = 0;
  try {
    baseNum += num1.toString().split(".")[1].length;
  } catch (e) {
  }
  try {
    baseNum += num2.toString().split(".")[1].length;
  } catch (e) {
  }
  return Number(num1.toString().replace(".", "")) * Number(num2.toString().replace(".", "")) / Math.pow(10, baseNum);
}

module.exports = router;
