var express = require('express');
var router = express.Router();
const { v4: uuidv4 } = require('uuid');

// 引入数据库操作模块
const { saveConversation, getUserConversations, getChatMessagesByUser, getConversationById,
    addMessageToConversation, deleteConversation, updateConversationName } = require('../services/conversationService');
/**
 * 千帆 v2 对话接口（OpenAI 兼容协议），使用 API Key 鉴权：
 * Header: Authorization: Bearer bce-v3/ALTAK-xxx/xxx
 * 说明：官方 JS SDK（@baiducloud/qianfan）仅支持 AK/SK 换取 IAM token，无法携带 API Key，
 * 因此这里直接请求 v2 的 /chat/completions 接口。
 * */
const QIANFAN_CHAT_URL = 'https://qianfan.baidubce.com/v2/chat/completions';


/* 获取千帆大模型消息 */
router.post('/getQianFanMessage', async function (req, res, next) {

    try {
        const userMessage = req.body.content;
        const userId = req.body.userId;
        const chartAgent = !!req.body.chartAgent; // 是否开启图表智能体
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
            await handleModelRequest(conversationId, userMessage, historyRecords, res, chartAgent);

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
            await handleModelRequest(conversationId, userMessage, historyRecords, res, chartAgent);
        }

    } catch (error) {
        console.error('请求失败:', error);
        res.status(500).send({ message: '服务器错误', error: error.message });
    }

});

// === 提取图表 JSON 的辅助函数 ===
function extractChartJson(text) {
    if (!text) return null
    try {
        const obj = JSON.parse(text)
        if (obj && obj.type && obj.options) return obj
    } catch (e) {}

    const match = text.match(/\{[\s\S]*\}/)
    if (match) {
        try {
            const obj = JSON.parse(match[0])
            if (obj && obj.type && obj.options) return obj
        } catch (e) {}
    }
    return null
}

// 读取千帆 v2 调用配置，缺失时直接报错，避免把非法模型名发到服务端
function getQianfanConfig() {
    const apiKey = (process.env.QIANFAN_API_KEY || '').trim();
    const model = (process.env.QIANFAN_MODEL || '').trim();

    if (!apiKey) {
        throw new Error('缺少环境变量 QIANFAN_API_KEY，请配置控制台创建的 API Key（形如 bce-v3/ALTAK-xxx/xxx）');
    }
    if (!model) {
        throw new Error('缺少环境变量 QIANFAN_MODEL，请配置千帆 v2 模型名（例如 deepseek-v3.2）');
    }
    return { apiKey, model };
}

// 以 API Key 方式请求千帆 v2 对话接口，返回流式响应体
async function requestChatStream(messages) {
    const { apiKey, model } = getQianfanConfig();

    const resp = await fetch(QIANFAN_CHAT_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'text/event-stream',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model,
            messages,
            stream: true,
        }),
    });

    if (!resp.ok) {
        const detail = await resp.text().catch(() => '');
        throw new Error(`千帆接口调用失败，status=${resp.status}，body=${detail}`);
    }
    return resp.body;
}

// 解析 SSE 流，逐个产出 data 中的 JSON 对象
async function* parseSseStream(stream) {
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    for await (const raw of stream) {
        buffer += decoder.decode(raw, { stream: true });

        let index;
        while ((index = buffer.indexOf('\n')) !== -1) {
            const line = buffer.slice(0, index).replace(/\r$/, '');
            buffer = buffer.slice(index + 1);

            if (!line.startsWith('data:')) continue;

            const payload = line.slice(5).trim();
            if (!payload || payload === '[DONE]') continue;

            try {
                yield JSON.parse(payload);
            } catch (e) {
                // 忽略无法解析的心跳/空数据
            }
        }
    }
}

// 处理向大模型发送请求
async function handleModelRequest(conversationId, userMessage, historyRecords, res, chartAgent) {
    try {
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
        if (chartAgent) {
            messages.unshift({
                role: 'system',
                content: '你具备两种能力：\n1) 图表专家：当且仅当用户的意图明确与“绘图/图表可视化”有关时，请直接输出 ECharts 配置的 JSON（不要包含任何解释或代码块标记），结构为 {type:"line|bar|pie|radar|scatter|heatmap|funnel|candlestick|gauge|tree|treemap|sunburst|sankey|graph|map|...", options:{...}}，尽可能给出完整的 ECharts 配置（含 xAxis/yAxis/legend/tooltip/series 等）。若为 3D 图（bar3D/scatter3D/surface 等），同样输出完整 options。\n2) 普通助理：如果用户的意图并非绘图相关，就按正常对话方式直接用自然语言回答。\n注意：不要返回“无法生成图表配置”之类的提示。当无法判定为绘图意图时，请给出正常的文字回答。'
            })
        }

        const stream = await requestChatStream(messages);

        let fullResponse = '';  // 用于存储完整的响应内容
        // 使用流式迭代将 chunk 内容逐步返回给前端
        for await (const data of parseSseStream(stream)) {
            // 流式过程中接口返回的错误
            if (data.error) {
                throw new Error(`千帆接口返回错误: ${JSON.stringify(data.error)}`);
            }
            const chunk = data.choices?.[0]?.delta?.content;

            // 累积响应内容，并逐步发送给前端
            if (chunk) {
                fullResponse += chunk;
                res.write(chunk);
            }
        }

        // 流结束时发送完成信号
        res.end();

        // === 尝试解析是否是图表类型 ===
        const chartPayload = extractChartJson(fullResponse)

        // 保存模型的响应到历史记录
        await addMessageToConversation(conversationId, {
            role: "assistant",
            content: chartPayload ? "" : fullResponse,
            chartPayload: chartPayload || null,
            isChart: !!chartPayload,
            timestamp: new Date(), // 使用当前时间
        });

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

router.post('/getChatMessagesByUser', async function (req, res) {
    try {
        const { userId } = req.body
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: '缺少参数 userId'
            })
        }
        // 调用数据库查询函数
        const chatMessages = await getChatMessagesByUser(userId)
        // 成功返回
        res.json({
            success: true,
            data: chatMessages
        });

    } catch (error) {
        console.error('获取用户聊天记录失败:', error)
        res.status(500).json({
            success: false,
            message: '服务器内部错误',
            error: error.message
        })
    }
})

router.post('/getChatMessagesByConversationId', async function (req, res) {
    try {
        const { conversationId } = req.body
        if (!conversationId) {
            return res.status(400).json({
                success: false,
                message: '缺少参数 conversationId'
            })
        }
        // 调用数据库查询函数
        const chatMessages = await getConversationById(conversationId)
        // 成功返回
        res.json({
            success: true,
            data: chatMessages
        });

    } catch (error) {
        console.error('获取用户聊天记录失败:', error)
        res.status(500).json({
            success: false,
            message: '服务器内部错误',
            error: error.message
        })
    }
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
