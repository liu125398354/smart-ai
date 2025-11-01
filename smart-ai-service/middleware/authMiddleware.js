const jwt = require('jsonwebtoken');
const { User } = require('../models/db');

// JWT 密钥（在生产环境中应该使用环境变量）
const JWT_SECRET = process.env.JWT_SECRET || 'smart-ai-secret-key';

// 统一认证中间件
const authenticateToken = async (req, res, next) => {
  try {
    // 从请求头中获取token
    const authHeader = req.header('Authorization');
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: '访问被拒绝，缺少访问令牌' 
      });
    }

    // 验证token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // 查找用户
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: '无效的访问令牌' 
      });
    }

    // 将用户信息添加到请求对象中
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({ 
        success: false, 
        message: '无效的访问令牌' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(403).json({ 
        success: false, 
        message: '访问令牌已过期' 
      });
    }

    console.error('认证错误:', error);
    return res.status(500).json({ 
      success: false, 
      message: '服务器内部错误' 
    });
  }
};

// 为某些路由提供可选认证中间件
const optionalAuthenticateToken = async (req, res, next) => {
  try {
    // 从请求头中获取token
    const authHeader = req.header('Authorization');
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return next();
    }

    // 验证token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // 查找用户
    const user = await User.findById(decoded.userId);
    if (!user) {
      return next();
    }

    // 将用户信息添加到请求对象中
    req.user = user;
    next();
  } catch (error) {
    // 即使token无效也继续执行
    next();
  }
};

module.exports = { authenticateToken, optionalAuthenticateToken };