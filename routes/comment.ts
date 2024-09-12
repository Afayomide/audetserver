const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken')
import Comment from "../models/comment";
import User from "../models/user";
import MusicBlog from "../models/musicBlog";
require('dotenv').config();
import { verifyToken } from "../verifyToken";
const cookieParser = require('cookie-parser')

router.use(cookieParser());  
router.use(express.json());


router.post('/:musicBlogId', verifyToken, async (req:any, res:any) => {
  const id = req.user.userId
  console.log(id)
    try {
      const user = await User.findById(id).select('-password');
      if(!user){
        res.json({message: "user not found"})
      }

      var { text } = req.body;
      var musicBlogId = req.params.musicBlogId;
  
      // Verify review exists
      var musicblog = await MusicBlog.findById(musicBlogId);
      if (!musicblog) return res.status(404).json({ message: 'Review not found' });
  
      // Create and save the comment
      var comment = new Comment({
        text,
        userName : user?.username,
        musicBlogId
      });
      await comment.save();
  
      return res.status(201).json(comment);
    } catch (error) {      
      console.error(error)
console.log(error)
      return res.status(500).json({ message: error });
    }
 
  });

  router.get('/:musicBlogId', async (req:any, res:any) => {
    try {
      var musicBlogId = req.params.musicBlogId;
  
      // Get comments for the specific review
      var comments = await Comment.find({ musicBlogId })//.populate('MusicBlog');
        console.log(comments)
      return res.status(200).json(comments);
    } catch (error) {
      console.error(error)
      return res.status(500).json({ message: error });
    }
  });
  
  router.delete('/delete/remove', async (req:any, res:any) =>{
    try {
      await Comment.deleteMany()
    }
    catch{

    }
  })

  module.exports = router;

  