/**
 * @Author: Liunannan
 * @Date: 2025/10/30 14:34
 * @Description:
 */
const { Conversation } = require('../models/db');
// 保存对话数据
async function saveConversation(conversationId, userId, conversationName, messages) {
    const newConversation = new Conversation({
        conversation_id: conversationId,
        user_id: userId,
        conversation_name: conversationName || 'New Chat', // 如果没有提供对话名称，则使用默认值
        messages: messages || [], // 将消息数组存入
    });

    try {
        const savedConversation = await newConversation.save();
        // console.log('Conversation saved:', savedConversation);
        return savedConversation; // 返回保存的记录
    } catch (error) {
        console.error('Error saving conversation:', error);
        throw error; // 抛出错误，方便上层调用捕获
    }
}

// 获取某个用户的对话历史，不包括 messages 字段
async function getUserConversations(userId) {
    try {
        // 使用 select 排除 messages 字段
        const conversations = await Conversation.find({ user_id: userId })
            .select('-messages')  // 排除 messages 字段
            .sort({ 'created_at': -1 });

        // console.log('User conversations:', conversations);
        return conversations; // 返回查询的对话记录
    } catch (error) {
        console.error('Error retrieving conversations:', error);
        throw error; // 抛出错误
    }
}

// 获取某个用户的所有对话详细信息（包含 messages）
async function getChatMessagesByUser(userId) {
    try {
        // 查找该用户的所有对话
        const conversations = await Conversation.find({ user_id: userId })
            .sort({ created_at: -1 }); // 按创建时间倒序排列

        // 格式化返回数据
        const result = conversations.map(conv => ({
            conversationId: conv.conversation_id,
            conversationName: conv.conversation_name,
            userId: conv.user_id,
            messages: conv.messages.map(msg => ({
                role: msg.role,
                content: msg.content,
                createTime: msg.timestamp ? msg.timestamp.getTime() : null // 转换为时间戳（毫秒）
            }))
        }));

        return result;

    } catch (error) {
        console.error('Error retrieving conversations with messages:', error);
        throw error;
    }
}


// 获取某个对话的历史
async function getConversationById(conversationId) {
    try {
        const conversation = await Conversation.findOne({ conversation_id: conversationId });
        // console.log('Conversation history:', conversation);
        return conversation; // 返回查询的对话记录
    } catch (error) {
        console.error('Error retrieving conversation:', error);
        throw error;
    }
}

// 向现有对话追加消息
async function addMessageToConversation(conversationId, newMessage) {
    try {
        const updatedConversation = await Conversation.findOneAndUpdate(
            { conversation_id: conversationId },
            { $push: { messages: newMessage } }, // 使用 $push 操作符追加消息
            { new: true } // 返回更新后的文档
        );

        if (!updatedConversation) {
            throw new Error('Conversation not found');
        }

        // console.log('Message added to conversation:', updatedConversation);
        return updatedConversation;
    } catch (error) {
        console.error('Error adding message to conversation:', error);
        throw error;
    }
}

// 删除指定用户和对话ID的对话信息
const deleteConversation = async (userId, conversationId) => {
    try {
        const result = await Conversation.deleteOne({
            user_id: userId,
            conversation_id: conversationId
        })

        if (result.deletedCount > 0) {
            console.log('对话删除成功')
        } else {
            console.log('未找到对应的对话')
            // 可以抛出异常以便在接口中捕获并返回
            throw new Error('未找到对应的对话')
        }
    } catch (error) {
        console.error('删除对话时出错:', error)
        throw error // 将错误抛出，供上层接口捕获
    }
}

// 根据用户id和对话ID修改相应的对话名称
const updateConversationName = async (userId, conversationId, newName) => {
    try {
        // 查找对应的对话并更新对话名称
        const result = await Conversation.updateOne(
            { user_id: userId, conversation_id: conversationId }, // 查询条件
            { $set: { conversation_name: newName, updated_at: Date.now() } } // 更新字段
        )

        if (result.modifiedCount > 0) {
            console.log('对话名称修改成功')
        } else {
            console.log('未找到对应的对话或对话名称未发生变化')
            // 可以抛出异常以便在接口中捕获并返回
            throw new Error('未找到对应的对话或对话名称未发生变化')
        }
    } catch (error) {
        console.error('修改对话名称时出错:', error)
        throw error // 将错误抛出，供上层接口捕获
    }
}

module.exports = {
    saveConversation,
    getUserConversations,
    getChatMessagesByUser,
    getConversationById,
    addMessageToConversation,
    deleteConversation,
    updateConversationName
};
