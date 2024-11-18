import { Request, Response } from "express";
import pool from "../db";

export const search = async (req: Request, res: Response) => {
  const { searchTerm } = req.query;

  if (typeof searchTerm !== "string" || searchTerm.trim() === "") {
    return res.status(400).json({ error: "Invalid search term" });
  }

  try {
    const queryText = `
    SELECT * FROM music_blogs
    WHERE title ILIKE $1
    OR artist ILIKE $1
    OR featured_artists ILIKE $1
    OR album ILIKE $1
    OR genre ILIKE $1
  `;
    const values = [`%${searchTerm}%`];

    const result = await pool.query(queryText, values);
    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "No music found matching your search." });
    }

    res.json({ result: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error retrieving your search results" });
  }
};

export const aboutBlog = async (req: Request, res: Response) => {
  const { id } = req.body;
  try {
    const result = await pool.query("SELECT * FROM music_blogs WHERE id = $1", [
      id,
    ]);
    const musicblog = result.rows[0];

    if (musicblog) {
      return res.status(200).json({ musicblog });
    } else {
      console.log("not found");
    }
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const upload = async (req: Request, res: Response) => {
  const {
    title,
    artist,
    type,
    blogTitle,
    cover,
    duration,
    featuredArtists,
    album,
    genre,
    releaseDate,
    plays,
    description,
    highlights,
    latest,
    trending,
    musicFilePath,
  } = req.body;

  if (
    !title ||
    !artist ||
    !cover ||
    !blogTitle ||
    !type ||
    !genre ||
    !description
  ) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const existingResult = await pool.query(
      `SELECT * FROM music_blogs 
       WHERE title = $1 AND artist = $2 AND type = $3 AND blog_title = $4 
       AND cover = $5 AND genre = $6 AND description = $7`,
      [title, artist, type, blogTitle, cover, genre, description]
    );

    if (existingResult.rows.length > 0) {
      return res
        .status(409)
        .json({ error: "A MusicBlog with these details already exists" });
    }

    const insertResult = await pool.query(
      `INSERT INTO music_blogs 
         (title, artist, type, blog_title, cover, duration, featured_artists, album, genre, 
          release_date, plays, description, highlights, latest, trending, music_file_path) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) 
         RETURNING *`,
      [
        title,
        artist,
        type,
        blogTitle,
        cover,
        duration,
        featuredArtists,
        album,
        genre,
        releaseDate || new Date(),
        plays || 0,
        description,
        highlights,
        latest !== undefined ? latest : true,
        trending || false,
        musicFilePath,
      ]
    );

    const musicblog = insertResult.rows[0];

    return res
      .status(200)
      .json({ message: "MusicBlog uploaded successfully", musicblog });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to upload the MusicBlog" });
  }
};

export const latestMusicBlogs = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      "SELECT * FROM music_blogs WHERE latest = true"
    );
    const latestMusicBlog = result.rows;
    if (!latestMusicBlog) {
      return res.status(404).json({ error: "Blogs not found" });
    }
    return res.status(200).json(latestMusicBlog);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Failed to fetch the latest music." });
  }
};

// app.post("/update", async (req: Request, res: Response) => {
//   try {
//     await MusicBlog.updateMany(
//       { highlights: { $exists: false } },
//       { $set: { highlights: ["Rema's", "March Am"] } }
//     );
//     const blogs = await MusicBlog.find();
//     res.json({ blogs });
//   } catch (error) {
//     console.error("Error updating MusicBlogs:", error);
//   } finally {
//     mongoose.connection.close();
//   }
// });
