var express = require('express');
var router = express.Router();
const axios = require('axios-https-proxy-fix')
const { v4: uuidv4 } = require('uuid');

const { ChatCompletion } = require("@baiducloud/qianfan");
const { setEnvVariable } = require("@baiducloud/qianfan");

// 引入数据库操作模块
const { saveConversation, getUserConversations, getConversationById,
    addMessageToConversation, deleteConversation, updateConversationName } = require('./db');
/**使用安全认证AK/SK鉴权，通过环境变量初始化；替换下列示例中参数，
 * 安全认证Access Key替换your_iam_ak，Secret Key替换your_iam_sk，
 * 如何获取请查看https://cloud.baidu.com/doc/Reference/s/9jwvz2egb
 * */
setEnvVariable('QIANFAN_ACCESS_KEY','');
setEnvVariable('QIANFAN_SECRET_KEY','');

const client = new  ChatCompletion({
    version: 'v2',
    // appid: 'XXX'
});

/* 获取千帆大模型消息 */
router.post('/getQianFanMessage', async function (req, res, next) {

    try {
        const userMessage = req.body.content;
        const userId = req.body.userId;
        let conversationId = req.body.conversationId;  // 从请求体中获取 conversationId

        let historyRecords = [];
        let newDialog = false;

        // 如果没有传递 conversationId，表示是新对话
        if (!conversationId) {
            newDialog = true;
            conversationId = uuidv4();  // 生成新的 conversationId

            // 保存新对话，并返回新的 conversationId 给前端
            await saveConversation(conversationId, userId, userMessage,  { role: 'user', content: userMessage, timestamp: new Date() });

            // 返回新的 conversationId 作为响应头
            res.setHeader('X-Dialog-ID', conversationId);  // 设置自定义响应头，以这种方式将对话id传给前端
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            res.setHeader('Transfer-Encoding', 'chunked');
            /**
             * 刷新响应头，确保立即发送，暂时注释掉，否则如果千帆请求发生错误，会导致前端有两个状态码，
             * 第一次200，第二次500，前端捕获到200后就处理不了后面的错误了
             * */
            // res.flushHeaders();

            // 继续处理大模型请求
            historyRecords = {}; // 新对话初始化为空
            await handleModelRequest(conversationId, userMessage, historyRecords, res);

        } else {
            // 保存模型的响应到历史记录
            await addMessageToConversation(conversationId, {
                role: 'user',
                content: userMessage,
                timestamp: new Date(), // 使用当前时间
            });
            // 已有对话，查询历史记录
            historyRecords = await getConversationById(conversationId);
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            res.setHeader('Transfer-Encoding', 'chunked');
            await handleModelRequest(conversationId, userMessage, historyRecords, res);
        }

    } catch (error) {
        console.error('请求失败:', error);
        res.status(500).send({ message: '服务器错误', error: error.message });
    }

});

// 处理向大模型发送请求
async function handleModelRequest(conversationId, userMessage, historyRecords, res) {
    try {
        /**
         * EventSource方式返回数据流
         * */
            // const resp = await client.chat({
            //     messages: [
            //         {
            //             role: 'user',
            //             content: req.query.content,
            //         },
            //     ],
            //     stream: true,
            // }, "ernie-3.5-8k");
            // res.setHeader('Content-Type', 'text/event-stream');  // 设置正确的 MIME 类型
            // res.setHeader('Cache-Control', 'no-cache');
            // res.setHeader('Connection', 'keep-alive');
            //
            // // 使用流式迭代将 chunk 内容逐步返回给前端
            // for await (const data of resp) {
            //     const chunk = data.choices[0].delta?.content;
            //     // 将每个 chunk 逐步发送给前端
            //     res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`); // SSE 格式
            //     // await new Promise(resolve => setTimeout(resolve, 1000)); // 添加延迟观察效果
            // }
            //
            // // 流结束时发送完成信号
            // res.end();

        let messages = [];

        // 历史记录
        if (Object.keys(historyRecords).length === 0) {
            // 添加当前消息
            messages.push({
                role: 'user',
                content: userMessage
            });
        } else {
            historyRecords.messages.forEach(message => {
                messages.push({
                    role: message.role,
                    content: message.content
                })
            })
            // console.log("lishi消息---", tempMessage, userMessage)
        }
        // console.log("最新的消息：---", messages)
        /**
         * 普通文字返回数据流
         * */
        const resp = await client.chat({
            messages: messages,
            stream: true,
        }, "deepseek-v3");

        let fullResponse = '';  // 用于存储完整的响应内容
        // 使用流式迭代将 chunk 内容逐步返回给前端
        for await (const data of resp) {
            const chunk = data.choices[0].delta?.content;

            // 累积响应内容
            if (chunk) {
                fullResponse += chunk;
            }
            // 将每个 chunk 逐步发送给前端
            // console.log('nnnode---', data.choices[0].delta);
            res.write(chunk);
            // await new Promise(resolve => setTimeout(resolve, 1000)); // 添加延迟观察效果
        }

        // 保存模型的响应到历史记录
        await addMessageToConversation(conversationId, {
            role: 'assistant',
            content: fullResponse,
            timestamp: new Date(), // 使用当前时间
        });

        // 流结束时发送完成信号
        res.end();

        /**
         * 模拟流数据的测试
         * */
        // res.setHeader('Content-Type', 'text/event-stream');  // 设置正确的 MIME 类型
        // res.setHeader('Cache-Control', 'no-cache');
        // res.setHeader('Connection', 'keep-alive');
        // let count = 0;
        // const interval = setInterval(() => {
        //     // 每隔 1 秒发送一个新的事件
        //     count++;
        //     res.write(`data: ${JSON.stringify({ text: count })}\n\n`); // 发送事件数据
        //     console.log(`Sending message----- ${count}`);
        //     if (count === 7) {  // 假设发送五次后结束流
        //         clearInterval(interval);
        //         res.write('event: close\n');
        //         res.write('data: Stream finished\n\n');
        //         res.end();  // 完成后关闭连接
        //     }
        // }, 1000); // 每隔 1 秒发送一次数据
        //
        // req.on('close', () => {
        //     console.log("close----close---")
        //     clearInterval(interval);
        //     res.end();
        // });
    } catch (error) {
        console.log(error)
        // 由于前面设置了按块传输，这里就不能以json格式返回给前端错误信息作为字符串传递
        res.status(500).write(`Internal Server Error: ${error}`)
        res.end()
    }
}

router.post('/getConversationsList', async function (req, res, next) {
    let conversationsData = await getUserConversations(req.body.userId)
    res.json(conversationsData)
})

router.post('/deleteConversations', async function (req, res, next) {
    const { userId, conversationId } = req.body

    // 检查参数有效性
    if (!userId || !conversationId) {
        return res.status(400).json({
            code: 1,
            message: '缺少必要的参数: userId 或 conversationId'
        })
    }

    try {
        // 调用删除对话方法
        await deleteConversation(userId, conversationId)
        res.json({
            code: 0,
            message: '删除对话成功'
        })
    } catch (error) {
        // 捕获删除过程中的错误并返回
        console.error('删除对话时出错:', error)
        res.status(500).json({
            code: 1,
            message: '删除对话失败，服务器发生错误'
        })
    }
})

router.post('/modifyConversationName', async function (req, res, next) {
    const { userId, conversationId, newName } = req.body

    // 检查参数有效性
    if (!userId || !conversationId || !newName) {
        return res.status(400).json({
            code: 1,
            message: '缺少必要的参数: userId conversationId 或 newName'
        })
    }

    try {
        // 调用修改对话方法
        await updateConversationName(userId, conversationId, newName)
        res.json({
            code: 0,
            message: '修改成功'
        })
    } catch (error) {
        // 捕获修改过程中的错误并返回
        console.error('修改名称时出错:', error)
        res.status(500).json({
            code: 1,
            message: '修改名称失败，服务器发生错误'
        })
    }
})

module.exports = router;
