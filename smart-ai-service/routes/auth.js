const express = require('express');
const router = express.Router();
const axios = require('axios');
const jwt = require('jsonwebtoken');
const { User } = require('../models/db');
const crypto = require('crypto');

// JWT 密钥（在生产环境中应该使用环境变量）
const JWT_SECRET = process.env.JWT_SECRET || 'smart-ai-secret-key';
const WX_APPID = process.env.WX_APPID
const WX_APPSECRET = process.env.WX_APPSECRET


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
        appid: WX_APPID,
        secret: WX_APPSECRET,
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
          username: user.username,
          avatar: user.avatar
        }
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: '微信登录失败' });
  }
});

/**
 * ===========================
 * access_token 内存缓存
 * ===========================
 */
let accessTokenCache = {
  token: null,
  expireAt: 0
}

async function getWxAccessToken() {
  const now = Date.now()

  // 未过期直接用
  if (accessTokenCache.token && accessTokenCache.expireAt > now) {
    return accessTokenCache.token
  }

  const res = await axios.get(
      'https://api.weixin.qq.com/cgi-bin/token',
      {
        params: {
          grant_type: 'client_credential',
          appid: WX_APPID,
          secret: WX_APPSECRET
        }
      }
  )

  const { access_token, expires_in } = res.data

  if (!access_token) {
    throw new Error('获取 access_token 失败')
  }

  // 提前5分钟过期
  accessTokenCache = {
    token: access_token,
    expireAt: now + (expires_in - 300) * 1000
  }

  return access_token
}

/**
 * ======================================
 * 微信手机号一键登录
 * ======================================
 */
router.post('/wx-phone-login', async (req, res) => {
  const { phoneCode, loginCode } = req.body

  if (!phoneCode || !loginCode) {
    return res.status(400).json({
      success: false,
      message: 'phoneCode 或 loginCode 缺失'
    })
  }

  try {
    /**
     * loginCode 换 openid
     */
    const sessionRes = await axios.get(
        'https://api.weixin.qq.com/sns/jscode2session',
        {
          params: {
            appid: WX_APPID,
            secret: WX_APPSECRET,
            js_code: loginCode,
            grant_type: 'authorization_code'
          }
        }
    )

    const { openid } = sessionRes.data

    if (!openid) {
      return res.status(500).json({
        success: false,
        message: '获取 openid 失败'
      })
    }

    /**
     * 获取 access_token（缓存）
     */
    const accessToken = await getWxAccessToken()

    /**
     * phoneCode 换手机号
     */
    const phoneRes = await axios.post(
        `https://api.weixin.qq.com/wxa/business/getuserphonenumber?access_token=${accessToken}`,
        {
          code: phoneCode
        }
    )

    const phone = phoneRes.data?.phone_info?.purePhoneNumber

    if (!phone) {
      return res.status(500).json({
        success: false,
        message: '获取手机号失败'
      })
    }

    /**
     * 查找用户（优先手机号，其次 openid）
     */
    let user = await User.findOne({ phone })

    if (!user) {
      user = await User.findOne({ wechatOpenId: openid })
    }

    /**
     * 不存在则创建
     */
    if (!user) {
      user = new User({
        username: `wx_${Date.now()}`,
        phone,
        wechatOpenId: openid
      })
    } else {
      // 已存在则补充绑定信息
      if (!user.phone) {
        user.phone = phone
      }
      if (!user.wechatOpenId) {
        user.wechatOpenId = openid
      }
    }

    await user.save()

    /**
     * 生成 JWT
     */
    const token = jwt.sign(
        {
          userId: user._id
        },
        JWT_SECRET,
        { expiresIn: '7d' }
    )

    return res.json({
      success: true,
      message: '登录成功',
      data: {
        token,
        user: {
          id: user._id,
          username: user.username,
          phone: user.phone
        }
      }
    })

  } catch (err) {
    console.error('微信手机号登录失败:', err)
    return res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
})

module.exports = router;