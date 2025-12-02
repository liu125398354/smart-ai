const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// 定义消息 Schema
const messageSchema = new mongoose.Schema({
    role: { type: String, enum: ['user', 'assistant'], required: true }, // 角色字段，用户或助手
    content: { type: String, required: true }, // 消息内容
    isChart: { type: Boolean, default: false }, // 是否为图表
    chartPayload: { type: Object, default: null }, // 图表数据
    timestamp: { type: Date, required: true }, // 消息时间戳
});

// 定义对话历史 Schema
const conversationSchema = new mongoose.Schema({
    conversation_id: { type: String, required: true, unique: true }, // 对话ID
    user_id: { type: String, required: true }, // 用户ID
    conversation_name: { type: String, default: 'New Chat' }, // 对话名称，默认为 "New Chat"
    messages: [messageSchema], // 消息数组，采用嵌套的 messageSchema
    created_at: { type: Date, default: Date.now },  // 对话创建时间
    updated_at: { type: Date, default: Date.now },  // 对话最后更新时间
});

// 转换字段名为驼峰格式
conversationSchema.set('toJSON', {
    transform: (doc, ret) => {
        // 遍历每个字段并进行转换
        for (const key in ret) {
            if (ret.hasOwnProperty(key)) {
                // // 排除 _id 字段，不做转换
                // if (key === '_id') continue;
                // 只转换下划线命名的字段，转换为驼峰命名
                const newKey = key.replace(/_([a-z])/g, (match, p1) => p1.toUpperCase());
                if (newKey !== key) {
                    ret[newKey] = ret[key]; // 赋值新键名
                    delete ret[key]; // 删除旧键名
                }
            }
        }
        return ret;
    }
});

// 创建 Conversation 模型
const Conversation = mongoose.model('Conversation', conversationSchema);

// 定义用户 Schema
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: false }, // 微信登录可为空
    email: { type: String, required: false, unique: true }, // 微信用户可为空
    wechatOpenId: { type: String, unique: true, sparse: true }, // 新增微信 openid
    created_at: { type: Date, default: Date.now }
});

// 添加密码加密的中间件
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (err) {
        next(err);
    }
});

// 添加验证密码的方法
userSchema.methods.validatePassword = async function(password) {
    return bcrypt.compare(password, this.password);
};

// 创建 User 模型
const User = mongoose.model('User', userSchema);

module.exports = { Conversation, User }
