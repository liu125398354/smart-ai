const express = require('express');
const router = express.Router();
const axios = require('axios');
const jwt = require('jsonwebtoken');
const { User } = require('../models/db');
const crypto = require('crypto');

// JWT 密钥（在生产环境中应该使用环境变量）
const JWT_SECRET = process.env.JWT_SECRET || 'smart-ai-secret-key';

// 用户注册
router.post('/register', async (req, res) => {
  try {
    let { username, password, email } = req.body;
    
    // 对前端传来的SHA256密码再进行bcrypt加密存储
    // 这里我们直接使用前端传来的哈希值作为密码明文，让bcrypt再次加密
    
    // 检查用户是否已存在
    const existingUser = await User.findOne({ 
      $or: [{ username }, { email }] 
    });

    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: '用户名或邮箱已存在' 
      });
    }

    // 创建新用户
    const user = new User({ username, password, email });
    await user.save();

    // 生成 JWT token
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: '注册成功',
      data: {
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email
        }
      }
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器内部错误' 
    });
  }
});

// 用户登录
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // 查找用户
    const user = await User.findOne({ 
      $or: [{ username }, { email: username }] 
    });

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: '用户名或密码错误' 
      });
    }

    // 验证密码
    const isValidPassword = await user.validatePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ 
        success: false, 
        message: '用户名或密码错误' 
      });
    }

    // 生成 JWT token
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: '登录成功',
      data: {
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email
        }
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器内部错误' 
    });
  }
});

// 微信登录
router.post('/wxlogin', async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ success: false, message: 'code不能为空' });

  try {
    // 调用微信接口换取 openid
    const wxRes = await axios.get('https://api.weixin.qq.com/sns/jscode2session', {
      params: {
        appid: process.env.WX_APPID,
        secret: process.env.WX_APPSECRET,
        js_code: code,
        grant_type: 'authorization_code'
      }
    });

    const { openid } = wxRes.data;
    if (!openid) return res.status(500).json({ success: false, message: '微信登录失败' });

    // 查找是否已有用户
    let user = await User.findOne({ wechatOpenId: openid });

    if (!user) {
      // 新用户，创建账号
      user = new User({
        username: `wx_${openid.substring(0,6)}`,
        wechatOpenId: openid
      });
      await user.save();
    }

    // 生成 JWT token
    const token = jwt.sign(
        { userId: user._id, username: user.username },
        JWT_SECRET,
        { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: '微信登录成功',
      data: {
        token,
        user: {
          id: user._id,
          username: user.username
        }
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: '微信登录失败' });
  }
});


module.exports = router;