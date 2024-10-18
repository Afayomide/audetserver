const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();
const commentRouter = require("./routes/comment");
const authRouter = require("./routes/auth");
const cookieParser = require("cookie-parser");
import pool from "./db";
import {
  aboutBlog,
  latestAlbum,
  latestMusicBlogs,
  search,
  upload,
} from "./controllers";

const app = express();
const port = 4000;
const corsOption = {
  origin: ["http://localhost:3000", "https://audet.vercel.app"],
  credentials: true,
};

app.use(cors(corsOption));
app.use(cookieParser());
app.use(bodyParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.raw());
app.use(bodyParser.text());
app.use("/comment", commentRouter);
app.use("/auth", authRouter);
app.use(express.json());

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

async function connectToPostgres() {
  const retryAttempts = 3;
  for (let attempt = 1; attempt <= retryAttempts; attempt++) {
    try {
      console.log("Connecting to PostgreSQL...");
      await pool.connect();
      console.log("Connected to PostgreSQL");
      return;
    } catch (error: any) {
      console.error("Failed to connect to PostgreSQL:", error.message);
      throw new Error("Failed to connect to PostgreSQL");
    }
  }
}

connectToPostgres()
  .then(() => {
    console.log("connection succesful");
  })
  .catch((error) => {
    console.error("Fatal error:", error.message);
  });

app.route("/latestMusicBlogs").get(latestMusicBlogs);

app.route("/latestalbum").get(latestAlbum);

app.route("/upload").put(upload);

app.route("/search").get(search);

app.route("/aboutBlog").post(aboutBlog);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
