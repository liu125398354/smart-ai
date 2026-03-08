/**
 * @Author: Liunannan
 * @Date: 2026/3/6 16:03
 * @Description:修改头像和昵称
 */

const express = require("express")
const multer = require("multer")
const path = require("path")
const fs = require("fs")
const { User } = require("../models/db")

const router = express.Router()

// 上传目录
const uploadDir = path.join(__dirname, "../uploads")

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true })
}

// 允许的图片类型
const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"]

// multer 存储配置
const storage = multer.diskStorage({

    destination(req, file, cb) {
        cb(null, uploadDir)
    },

    filename(req, file, cb) {
        const ext = path.extname(file.originalname)
        const userId = req.user?._id || "temp"
        const fileName = `${userId}_${Date.now()}${ext}`
        cb(null, fileName)
    }
})

// 文件过滤（限制图片类型）
function fileFilter(req, file, cb) {

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true)
    } else {
        cb(new Error("只允许上传图片文件"), false)
    }

}

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 2 * 1024 * 1024 // 最大 2MB
    }
})

// 上传头像接口
router.post("/upload-avatar", upload.single("file"), async (req, res) => {

    try {
        const userId = req.user._id
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "未检测到上传文件"
            })
        }
        console.log("上传文件大小:", req.file.size)
        // 查询旧头像
        const user = await User.findById(userId)
        const oldAvatar = user?.avatar
        const avatarUrl = `http://localhost:3000/uploads/${req.file.filename}`

        // 更新数据库
        await User.findByIdAndUpdate(userId, {
            avatar: avatarUrl
        })

        // 删除旧头像
        if (oldAvatar && oldAvatar.includes("/uploads/")) {
            const oldFileName = oldAvatar.split("/uploads/")[1]
            const oldFilePath = path.join(uploadDir, oldFileName)
            if (fs.existsSync(oldFilePath)) {
                fs.unlink(oldFilePath, (err) => {
                    if (err) {
                        console.log("旧头像删除失败:", err.message)
                    }
                })
            }
        }
        res.json({
            success: true,
            data: {
                avatar: avatarUrl
            }
        })
    } catch (error) {
        console.error("头像上传失败:", error)
        res.status(500).json({
            success: false,
            message: error.message || "头像上传失败"
        })
    }

})

router.post('/update-nickname', async (req,res)=>{

    const { nickname } = req.body
    const userId = req.user.userId

    await User.findByIdAndUpdate(userId,{
        nickname: nickname
    })

    res.json({
        success:true
    })

})

module.exports = router