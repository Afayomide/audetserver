const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
import pool from "../db";
import crypto from "crypto";
import { Request, Response } from "express";

const sameSiteValue: "lax" | "strict" | "none" | undefined = 
    process.env.SAME_SITE === "lax" || 
    process.env.SAME_SITE === "strict" || 
    process.env.SAME_SITE === "none" 
    ? process.env.SAME_SITE 
    : undefined; 

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

export const checkAuth = async (req: Request, res: Response) => {
  const id = req.user.userId;
  try {
    const result = await pool.query("SELECT * FROM users WHERE id = $1", [id]); // Exclude password field
    const user = result.rows[0];
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    const user = result.rows[0];

    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.json({ success: false, message: "Invalid email or password" });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: "4d",
    });
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
        sameSite: sameSiteValue,
      maxAge: 4 * 24 * 60 * 60 * 1000,
    });
    const { password: _, ...userWithoutPassword } = user;
    res.json({ success: true, userWithoutPassword });
  } catch (error: any) {
    console.error("Error:", error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const signUp = async (req: Request, res: Response) => {
  const { fullname, username, email, password } = req.body;

  if (!username || !password || !fullname || !email) {
    return res.json({ success: false, message: "All fields are required" });
  }

  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    const existingUser = result.rows[0];

    if (existingUser) {
      return res.json({ success: false, message: "Username already exists" });
    }
    console.log("no user found");
    const saltRounds = 10;
    const hashedPassword = bcrypt.hashSync(password, saltRounds);

    const insertResult = await pool.query(
      "INSERT INTO users (fullname, username, email, password) VALUES ($1, $2, $3, $4) RETURNING *",
      [fullname, username, email, hashedPassword]
    );

    insertResult.rows[0];

    return res.json({ success: true });
  } catch (error: any) {
    console.error("Error:", error.message);
    return res.json({ success: false, message: "Internal server error" });
  }
};

export const logOut = (req: Request, res: Response) => {
  res.cookie("token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // Set to true in production for HTTPS
    sameSite: sameSiteValue,
    maxAge: 0,
  });

  return res
    .status(200)
    .json({ success: true, message: "Logged out successfully" });
};

export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;

  try {
    const userResult = await pool.query("SELCT * FROM users WHERE email = $1", [
      email,
    ]);

    const user = userResult.rows[0];

    if (!user) {
      return res
        .status(404)
        .json({ message: "No account found with that email address." });
    }

    const resetToken = crypto.randomBytes(20).toString("hex");
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 3600000); // Token expires in 1 hour

    await user.save();

    const resetURL = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
    const mailOptions = {
      to: email,
      from: process.env.EMAIL_USER,
      subject: "Password Reset Request",
      text: `You are receiving this email because you (or someone else) have requested a password reset for your account.\n\n
               Please click on the following link, or paste it into your browser, to complete the process:\n\n
               ${resetURL}\n\n
               If you did not request this, please ignore this email and your password will remain unchanged.`,
    };

    await transporter.sendMail(mailOptions);

    res
      .status(200)
      .json({ message: "Password reset link sent to your email address." });
  } catch (error) {
    console.error("this is", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const ResetPassword = async (req: Request, res: Response) => {
  const { token, password } = req.body;
  console.log(req.body);
  const currentTime = new Date();
  const query = `
    SELECT *
    FROM users
    WHERE reset_password_token = $1
    AND reset_password_expires > $2
  `;
  const values = [token, currentTime];

  try {
    const result = await pool.query(query, values);
    const user = result.rows[0];

    if (!user) {
      return res
        .status(400)
        .json({ message: "Password reset token is invalid or has expired." });
    }

    const saltRounds = 10;
    const hashedPassword = bcrypt.hashSync(password, saltRounds);

    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res
      .status(200)
      .json({ message: "Password has been successfully updated." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
