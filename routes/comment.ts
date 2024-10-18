const express = require("express");
const router = express.Router();
const cookieParser = require("cookie-parser");
router.use(cookieParser());
router.use(express.json());
import { getComment, postComment } from "../controllers/comment";
import { verifyToken } from "../verifyToken";
require("dotenv").config();

router.route("/:musicBlogId").post(verifyToken, postComment);

router.route("/:musicBlogId").get(getComment);

// router.route("/delete/remove").delete(deleteComment);

module.exports = router;
