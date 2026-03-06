/**
 * @Author: Liunannan
 * @Date: 2026/3/6 16:03
 * @Description:修改头像和昵称
 */

const express = require("express")
const multer = require("multer")
const path = require("path")
const { User } = require('../models/db');
const fs = require("fs");

const router = express.Router()

const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({

    destination(req, file, cb) {
        cb(null, "uploads/")
    },

    filename(req, file, cb) {

        const ext = path.extname(file.originalname)

        cb(null, Date.now() + ext)

    }

})

const upload = multer({ storage })


router.post('/upload-avatar', upload.single('file'), async (req,res)=>{

    console.log("req---->", req.user._id)
    const userId = req.user._id

    const avatarUrl = `http://localhost:3000/uploads/${req.file.filename}`

    await User.findByIdAndUpdate(userId,{
        avatar: avatarUrl
    })

    res.json({
        success:true,
        data:{
            avatar: avatarUrl
        }
    })

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