const express = require("express")
const bcrypt = require("bcrypt")
import crypto from 'crypto';
const  nodemailer = require('nodemailer');
import User from '../models/user'; // Update with your User model path
// import { validationResult } from 'express-validator'; // Optional for validation

const router = express.Router();

// Setup Nodemailer transport (configure with your email service provider)
const transporter = nodemailer.createTransport({
  service: 'Gmail', // Use your email service
  auth: {
    user: process.env.EMAIL_USER, // Your email address
    pass: process.env.EMAIL_PASS, // Your email password
  },
});

router.post('/forgot-password', async (req: any, res: any) => {
  const { email } = req.body;
  
  
  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'No account found with that email address.' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 3600000); // Token expires in 1 hour

    await user.save();

    // Send reset email
    const resetURL = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
    const mailOptions = {
      to: email,
      from: process.env.EMAIL_USER,
      subject: 'Password Reset Request',
      text: `You are receiving this email because you (or someone else) have requested a password reset for your account.\n\n
             Please click on the following link, or paste it into your browser, to complete the process:\n\n
             ${resetURL}\n\n
             If you did not request this, please ignore this email and your password will remain unchanged.`,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: 'Password reset link sent to your email address.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/reset-password', async (req: any, res: any) => {
    const { token, password } = req.body;
    console.log(req.body)
  
    try {
      const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() }, 
      });
  
      if (!user) {
        return res.status(400).json({ message: 'Password reset token is invalid or has expired.' });
      }
  
      const saltRounds = 10;
      const hashedPassword = bcrypt.hashSync(password, saltRounds);

      user.password = hashedPassword;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
  
      await user.save();
  
      res.status(200).json({ message: 'Password has been successfully updated.' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  

module.exports = router