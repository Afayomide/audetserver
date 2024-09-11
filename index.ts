const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();
const mongoose = require("mongoose")
const commentRouter = require("./routes/comment")
import MusicBlog  from "./models/musicBlog";
import Album from "./models/album";
import Comment from "./models/comment";


const app = express();
const port = 4000;
const dburl = process.env.MONGO_URL || ""

app.use(bodyParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.raw());
app.use(bodyParser.text());
app.use(cors());
app.use('/comment', commentRouter)


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

  
  