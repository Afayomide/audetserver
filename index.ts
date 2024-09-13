const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const mongoose = require("mongoose")
const bcrypt = require('bcrypt')
const commentRouter = require("./routes/comment")
const resetPasswordRouter = require("./routes/reset-password")
import MusicBlog  from "./models/musicBlog";
import Album from "./models/album";
import User from "./models/user";
const cookieParser = require('cookie-parser');
import { verifyToken } from "./verifyToken";


const app = express();
const port = 4000;
const dburl = process.env.MONGO_URL || ""
const corsOption = {
  origin: ['http://localhost:3000', 'https://audet.vercel.app'],
  credentials: true,
};

app.use(cors(corsOption));
app.use(cookieParser());
app.use(bodyParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.raw());
app.use(bodyParser.text());
app.use('/comment', commentRouter)
app.use('/',resetPasswordRouter)

app.use(express.json());

async function connectToMongo(dburl: string) {
    const retryAttempts = 3;
    const connectTimeoutMS = 20000;
  
    for (let attempt = 1; attempt <= retryAttempts; attempt++) {
      try {            
        console.log("connecting to Database")
        await mongoose.connect(dburl, {
          useNewUrlParser: true,
          useUnifiedTopology: true,
          connectTimeoutMS,
        });
        console.log('Connected to Database');
        return;
      } catch (error: any) {
        console.error(`Connection attempt ${attempt} failed:`, error.message);
  
        await new Promise((resolve) =>
          setTimeout(resolve, Math.min(attempt * 2000, 10000))
        );
      }
    }
  
    throw new Error('Failed to connect to MongoDB Atlas after retries');
  }

  connectToMongo(dburl)
  .then(() => {
    console.log('connection succesful');
  })
  .catch((error) => {
    console.error('Fatal error:', error.message);
  });




  app.get('/checkAuth', verifyToken, async (req:any, res:any) => {
    try {
      const user = await User.findById(req.user.userId).select('-password'); // Exclude password field
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json({ user });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
      res.json({error})
    }
  });

  app.post('/login', async (req:any, res:any) => {
    const { email, password } = req.body;
    console.log(req.body)
  
    try {
      const user = await User.findOne({ email });
  
      if (!user || !bcrypt.compareSync(password, user.password)) {
        return res.json({ success: false, message: 'Invalid email or password' });
      }
  
      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '4d' });
      // res.json({ success: true, token, user });
      res.cookie('token', token, {
        httpOnly: true,   
        secure: false,  
        // sameSite: 'Strict',  
        maxAge: 24 * 60 * 60 * 1000 
      });
      res.json({success: true, user});

      console.log(user._id)
    } catch (error:any) {
      console.error('Error:', error.message);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  app.post('/signup', async (req: any, res: any) => {
    const { fullname, username, email, password } = req.body;
  
    if (!username || !password || !fullname || !email) {
      return res.json({ success: false, message: 'All fields are required' }); // Use return to prevent further execution
    }
  
    try {
      const existingUser = await User.findOne({ username });
  
      if (existingUser) {
        return res.json({ success: false, message: 'Username already exists' }); // Use return to prevent further execution
      }
  
      const saltRounds = 10;
      const hashedPassword = bcrypt.hashSync(password, saltRounds);
      
      const newUser = new User({
        fullname,
        username,
        email,
        password: hashedPassword,
      });
  
      await newUser.save();
      return res.json({ success: true });
    } catch (error: any) {
      console.error('Error:', error.message);
      return res.json({ success: false, message: 'Internal server error' });
    }
  });

  app.post('/logout', (req: any, res: any) => {
    // Clear the token cookie by setting its expiration date to the past
    res.cookie('token', '', {
      httpOnly: true,
      // secure: process.env.NODE_ENV === 'production', // Set to true in production for HTTPS
      sameSite: 'Strict',
      maxAge: 0 // Immediately expire the cookie
    });
  
    return res.status(200).json({ success: true, message: 'Logged out successfully' });
  });



  app.get("/latestMusicBlogs", async (req: any, res: any) => {
    try {
      const latestMusicBlog = await MusicBlog.find({ latest: true }).limit(10);
      if (!latestMusicBlog) {
        return res.status(404).json({ error: 'Progress not found' });
      }
     return  res.status(200).json(latestMusicBlog);
    } catch (error) {     
      console.log(error)
     return res.status(500).json({ error: "Failed to fetch the latest music." });
    }
  });

  app.get("/latestalbum", async (req: any, res: any) => {
    try {
      const latestAlbum = await Album.find({ latest: true }).limit(10);
      if (!latestAlbum) {
        return res.status(404).json({ error: 'Progress not found' });
      }
     return  res.status(200).json(latestAlbum);
    } catch (error) {
     return res.status(500).json({ error: "Failed to fetch the latest music." });
    }
  });

  app.put("/upload", async (req:any, res:any)=>{
    const {title, artist,type,blogTitle , cover,duration,featuredArtists, album, genre, releaseDate, plays, description, latest, trending, musicFilePath} = req.body
    console.log(req.body)

      // Validate required fields
  if (!title || !artist || !cover || !blogTitle || !type ||!duration || !genre || !description || !musicFilePath) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {

      const existingMusicBlog = await MusicBlog.findOne({
        title,
        artist,
        type,
        featuredArtists,
        cover,
        blogTitle,
        duration,
        album, 
        genre,
        releaseDate,
        description,
        musicFilePath, 
      });

      if (existingMusicBlog) {
          return res.status(409).json({ error: 'A MusicBlog with these details already exists' });
      }

    const musicblog = new MusicBlog({
      title,
      artist,
      type,
      featuredArtists,
      cover,
      duration,
      blogTitle,
      album, 
      genre,
      releaseDate: releaseDate || Date.now(),
      plays: plays || 0, 
      description,
      latest: latest !== undefined ? latest : true, 
      trending: trending || false, 
      musicFilePath, 
    });

    await musicblog.save(); 

    return res.status(200).json({ message: 'MusicBlog uploaded successfully', musicblog });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to upload the MusicBlog' });
  }
  })


  app.get('/search', async (req: any, res: any) => {
    const { searchTerm } = req.query;
    console.log(req.query, req.params)
  
    if (typeof searchTerm !== 'string' || searchTerm.trim() === '') {
      return res.status(400).json({ error: 'Invalid search term' });
    }
  
    try {
      console.log(`this is ${searchTerm}`);
      const searchOptions = {
        $or: [
          { title: { $regex: searchTerm, $options: 'i' } },
          { artist: { $regex: searchTerm, $options: 'i' } },
          {featuredArtists: {$regex: searchTerm, $options: 'i'}},
          { album: { $regex: searchTerm, $options: 'i' } },
          { genre: { $regex: searchTerm, $options: 'i' } },
        ],
      };
  
      const result = await MusicBlog.find(searchOptions);
  
      if (result.length === 0) {
        return res.status(404).json({ error: 'No music found matching your search.' });
      }
  
      res.json({ result });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error retrieving your search results' });
    }
  });

  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });

  app.post('/aboutBlog', async(req:any,res:any)=>{
    const {id} = req.body;
    try{
      const musicblog = await MusicBlog.findById(id)
      console.log(musicblog)
      if(musicblog) {
        return res.status(200).json({musicblog})
      }
    }
    catch(error){
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  })


  app.post('/update', async (req:any, res:any)=> {
    try {
      // Update all existing MusicBlogs to have type: 'MusicBlog' if it doesn't exist
      await MusicBlog.updateMany(
        { blogTitle: { $exists: false } }, // Find all documents where 'type' does not exist
        { $set: { blogTitle: "Check Out Rema's New MusicBlog" } }    // Set 'type' to 'MusicBlog'
      );
      
      console.log('All existing MusicBlogs updated with type: blogTitle');
    } catch (error) {
      console.error('Error updating MusicBlogs:', error);
    } finally {
      mongoose.connection.close(); // Close the connection when done
    }
  })

  
  