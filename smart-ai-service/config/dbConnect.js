/**
 * @Author: Liunannan
 * @Date: 2025/10/30 14:23
 * @Description:
 */
const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/chat_history';

async function connectDB() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log(`✅ MongoDB connected: ${MONGO_URI}`);
    } catch (error) {
        console.error('❌ MongoDB connection failed:', error.message);
        process.exit(1); // 连接失败则退出程序
    }
}

module.exports = connectDB

