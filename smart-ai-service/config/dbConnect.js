/**
 * @Author: Liunannan
 * @Date: 2025/10/30 14:23
 * @Description:数据库连接
 */
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/chat_history';

async function connectDB() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('MongoDB 已连接');

        // 监听连接状态
        mongoose.connection.on('connected', () => {
            console.log('MongoDB 连接状态: connected');
        });

        mongoose.connection.on('error', (err) => {
            console.error('MongoDB 连接出错:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.warn('MongoDB 已断开连接');
        });

        // 捕获 Node 进程退出，关闭 MongoDB 连接
        process.on('SIGINT', async () => {
            await mongoose.connection.close();
            console.log('MongoDB 连接已关闭，应用退出');
            process.exit(0);
        });

        return mongoose.connection;
    } catch (err) {
        console.error('MongoDB 连接失败:', err);
        process.exit(1); // 连接失败直接退出进程
    }
}

module.exports = connectDB;
