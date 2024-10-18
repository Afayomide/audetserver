import { Request, Response } from "express";
import pool from "../db";


export const postComment = async (req: Request, res: Response) => {
  const id = req.user.userId;

  try {
    const userResult = await pool.query('SELECT username FROM users WHERE id = $1', [id]);
    const user = userResult.rows[0];
    if (!user) {
      res.json({ message: "user not found" });
    }

    var { text } = req.body;
    var musicBlogId = req.params.musicBlogId;

    var musicBlogResult = await pool.query('SELECT * FROM music_blogs WHERE id = $1', [musicBlogId]);
    const musicblog = musicBlogResult.rows[0]
    if (!musicblog){
            return res.status(404).json({ message: "Review not found" });
    }

 
    const insertResult = await pool.query(
        "INSERT INTO comments (text, username, musicblogid) VALUES ($1, $2, $3) RETURNING *",
        [text, user?.username, musicBlogId]
      );
  
      const comment = insertResult.rows[0];

    return res.status(201).json(comment);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error });
  }
};

export const getComment = async (req: Request, res: Response) => {
  try {
    var musicBlogId = req.params.musicBlogId;

    var result = await pool.query("SELECT * FROM comments WHERE musicBlogId = $1", [musicBlogId]); 
    const comments = result.rows
    return res.status(200).json(comments);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error });
  }
};

// export const deleteComment = async (req: Request, res: Response) => {
//   try {
//     await Comment.deleteMany();
//   } catch {}
// };
