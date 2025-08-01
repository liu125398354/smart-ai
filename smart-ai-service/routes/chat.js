var express = require('express');
var router = express.Router();
const axios = require('axios-https-proxy-fix')
const { v4: uuidv4 } = require('uuid');
const { Configuration, OpenAIApi } = require("openai");
const tunnel = require('tunnel')
const { IncomingMessage } = require('http');
const apiKey = ""
/* 获取openai消息 */
router.post('/getMessage', async function (req, res, next) {
  res.setHeader('Content-type', 'application/octet-stream')

  let result = await axios.post('https://smart.liunannan.xyz/v1/chat/completions', {
    model: 'gpt-3.5-turbo',
    messages: [{
      role: 'user',
      content: req.body.content
    }],
    stream: true
  }, {
    // proxy: {
    //   host: '127.0.0.1',
    //   port: '10809'
    // },
    headers: {
      Authorization: `Bearer ${apiKey}`
    },
    timeout: 60000,
    responseType: "stream",
    // onDownloadProgress({ event }) {
    //   console.log('进度事件---->', event.target);
    // }
  })
  let data = result.data
  // const stream = data as IncomingMessage
  data.on('data', (chunk) => {
    const payloads = chunk.toString().split("\n\n");
    for (const payload of payloads) {
      if (payload.includes('[DONE]')) return;
      if (payload.startsWith("data:")) {
        const data = JSON.parse(payload.replace("data: ", ""));
        try {
          const chunk = data.choices[0].delta?.content;
          if (chunk) {
            res.write(chunk)
          }
        } catch (error) {
          console.log(`Error with JSON.parse and ${payload}.\n${error}`);
        }
      }
    }
  });

  data.on('end', () => {
    res.end()
  });
  // console.log("11111111111---->", data)
  // res.write(JSON.stringify(data))
  // let data = result.data.choices[0].message
  // res.json({
  //   code: 0,
  //   message: {
  //     id: uuidv4(),
  //     role: "assistant",
  //     content: data.content,
  //     createTime: new Date().getTime(),
  //     userId: req.body.userId
  //   }
  // })
  // printChatGptMessage(req.body.content)
});

module.exports = router;
