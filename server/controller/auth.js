import User from "../models/user.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from 'crypto';
import sgMail from '@sendgrid/mail';
import dotenv from 'dotenv';
import { getDeviceInfo } from '../middleware/deviceInfo.js';
dotenv.config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const SENDER_EMAIL = 'CodeQuest <no-reply@em9763.theujjwalsingh.tech>';
const SUPPORT_EMAIL = 'theujjwalsinghh@gmail.com';

const getCurrentDate = () => {
  const now = new Date();
  return new Date(now.getTime() - (now.getTimezoneOffset() * 60000))
    .toISOString()
    .split('T')[0];
};

export const signup = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }
    const existinguser = await User.findOne({ email });
    if (existinguser) {
      return res.status(409).json({ message: "User already exist" });
    }
    const hashedpassword = await bcrypt.hash(password, 12);
    const newuser = await User.create({
      name,
      email,
      password: hashedpassword
    });
    const token = jwt.sign({
      email: newuser.email, id: newuser._id
    }, process.env.JWT_SECRET, { expiresIn: "1h" }
    )
    res.status(200).json({ result: newuser, token });
  } catch (error) {
    console.error(error);
    res.status(500).json("something went wrong...");
  }
}

export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const device = getDeviceInfo(req);
  
    if (device.deviceType === 'mobile') {
      const curtime = device.currentTime;
      const hours = curtime.split(":")[0]
      if (hours < 1 || hours >= 23) { // 10 - 13
        return res.status(403).json({ 
          message: 'Mobile access allowed only between 10:00 AM - 1:00 PM UTC' 
        });
      }
    }

    const existinguser = await User.findOne({ email });
    if (!existinguser) {
      return res.status(404).json({ message: "User doesn't exist" });
    }
   
    const ispasswordcrct = await bcrypt.compare(password, existinguser.password); 
    if (!ispasswordcrct) {
      return res.status(400).json({ message: "Invalid password" });
    }
    if (device.browser === 'Chrome' || device.browser === 'Mobile Chrome') {
      const otp = crypto.randomInt(100000, 999999).toString();
      const otpExpiry = new Date(Date.now() + 5 * 60000);
      
      existinguser.loginOtp = otp;
      existinguser.loginOtpExpiry = otpExpiry;
      await existinguser.save();

      // Send OTP email
      const emailTemplate = {
        subject: `Your Login Verification OTP`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f78409; border-radius: 8px;">
            <h2 style="color: #f78409; text-align: center;">Login Verification</h2>
            <p>We detected a login attempt from Chrome browser for your account: <strong>${email}</strong>.</p>
            <p>For security, please enter this OTP:</p>
            
            <div style="background: #f8f9fa; padding: 20px; text-align: center; margin: 25px 0; border-radius: 8px; border: 2px dashed #f78409;">
              <h1 style="margin: 0; letter-spacing: 3px; color: #2c3e50;">${otp}</h1>
            </div>
            
            <p style="font-size: 14px; color: #7f8c8d;">
              <strong>This verification code is valid for 5 minutes.</strong><br>
              If you didn't request this, please ignore this email or contact support.
            </p>
            
            <div style="border-top: 1px solid #eee; padding-top: 20px; text-align: center; color: #95a5a6; font-size: 13px;">
              <p>Best regards,<br>Team CodeQuest</p>
              <p style="margin-top: 10px;">Need help? Contact us at ${SUPPORT_EMAIL}</p>
            </div>
          </div>
        `
      };

      const msg = {
        to: email,
        from: SENDER_EMAIL,
        subject: emailTemplate.subject,
        html: emailTemplate.html
      };

      await sgMail.send(msg);
      
      return res.status(200).json({ 
        otpRequired: true,
        message: "OTP sent for Chrome verification" 
      });
    }else {
      const token = jwt.sign(
        { email: existinguser.email, id: existinguser._id },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );
      
      existinguser.loginHistory.push(device);
      await existinguser.save();
      
      res.status(200).json({ result: existinguser, token });
    }
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Something went wrong..." });
  }
}

export const verifyLoginOtp = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const device = getDeviceInfo(req);
    const user = await User.findOne({ 
      email, 
      loginOtp: otp,
      loginOtpExpiry: { $gt: Date.now() } 
    });

    if (!user) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid OTP or expired. Please request a new OTP." 
      });
    }

    user.loginOtp = undefined;
    user.loginOtpExpiry = undefined;
    user.loginHistory.push(device);
    await user.save();

    const token = jwt.sign(
      { email: user.email, id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(200).json({ result: user, token });
  } catch (error) {
    console.error("OTP Verification Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

export const sendOtp = async (req, res) => {
  const { email, purpose = 'passwordReset' } = req.body;

  if (!email || typeof email !== 'string') {
    return res.status(400).json({ success: false, message: "Email is required" });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ success: false, message: "Invalid email format" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    if (purpose === 'passwordReset') {
      const today = getCurrentDate();
      if (user.lastResetDate === today && user.resetAttempted) {
        console.log(`User already requested password today on ${email}`);
        
        return res.status(429).json({
          success: false,
          message: "Only one password reset attempt allowed per day. Please try again tomorrow."
        });
      }
    }

    const now = new Date();
    const lastOtpField = purpose === 'passwordReset' ? 'lastResetOtpSent' : 'lastVideoOtpSent';
    const lastOtpSent = user[lastOtpField];
    
    if (lastOtpSent && (now - lastOtpSent) < 60000) {
      return res.status(429).json({
        success: false,
        message: "Please wait before requesting a new OTP"
      });
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpiry = new Date(Date.now() + 5 * 60000);

    if (purpose === 'passwordReset') {
      user.resetOtp = otp;
      user.resetOtpExpiry = otpExpiry;
      user.lastResetOtpSent = now;
    } else if (purpose === 'videoVerification') {
      user.videoOtp = otp;
      user.videoOtpExpiry = otpExpiry;
      user.lastVideoOtpSent = now;
    }

    await user.save();

    let emailTemplate;
    if (purpose === 'passwordReset') {
      emailTemplate = {
        subject: `Your Password Reset OTP`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f78409; border-radius: 8px;">
            <h2 style="color: #f78409; text-align: center;">Password Reset Request</h2>
            <p>We received a request to reset your password for account: <strong>${email}</strong></p>
            
            <div style="background: #f8f9fa; padding: 20px; text-align: center; margin: 25px 0; border-radius: 8px; border: 2px dashed #f78409;">
              <h1 style="margin: 0; letter-spacing: 3px; color: #2c3e50;">${otp}</h1>
            </div>
            
            <p style="font-size: 14px; color: #7f8c8d;">
              <strong>This OTP is valid for 5 minutes.</strong><br>
              If you didn't request this, please ignore this email or contact support.
            </p>
            
            <div style="border-top: 1px solid #eee; padding-top: 20px; text-align: center; color: #95a5a6; font-size: 13px;">
              <p>Best regards,<br>Team CodeQuest</p>
              <p style="margin-top: 10px;">Need help? Contact us at ${SUPPORT_EMAIL}</p>
            </div>
          </div>
        `
      };
    } else if (purpose === 'videoVerification') {
      emailTemplate = {
        subject: "Video Verification Code",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f78409; border-radius: 8px;">
            <h2 style="color: #f78409; text-align: center;">Video Upload Verification</h2>
            <p>To upload a video with your question, please verify your email: <strong>${email}</strong></p>
            
            <div style="background: #f8f9fa; padding: 20px; text-align: center; margin: 25px 0; border-radius: 8px; border: 2px dashed #f78409;">
              <h1 style="margin: 0; letter-spacing: 3px; color: #2c3e50;">${otp}</h1>
            </div>
            
            <p style="font-size: 14px; color: #7f8c8d;">
              <strong>This verification code is valid for 5 minutes.</strong><br>
              If you didn't request this, please ignore this email or contact support.
            </p>
            
            <div style="border-top: 1px solid #eee; padding-top: 20px; text-align: center; color: #95a5a6; font-size: 13px;">
              <p>Best regards,<br>Team CodeQuest</p>
              <p style="margin-top: 10px;">Need help? Contact us at ${SUPPORT_EMAIL}</p>
            </div>
          </div>
        `
      };
    }

    const msg = {
      to: email,
      from: SENDER_EMAIL,
      subject: emailTemplate.subject,
      html: emailTemplate.html
    };

    await sgMail.send(msg);
    console.log(`Mail sent successfully to: ${email}`);
    
    res.status(200).json({
      success: true,
      message: "OTP sent successfully",
      purpose
    });
  } catch (error) {
    console.error("SendGrid error:", error.response?.body || error.message);
    res.status(500).json({ success: false, message: "Failed to send OTP email" });
  }
};


export const verifyOtp = async (req, res) => {
  try {
    const { email, otp, purpose = 'passwordReset' } = req.body;
    if (typeof email !== 'string' || typeof otp !== 'string') {
      return res.status(400).json({ success: false, message: "Invalid input format" });
    }

    let user;
    if (purpose === 'passwordReset') {
      user = await User.findOne({
        email,
        resetOtp: otp,
        resetOtpExpiry: { $gt: Date.now() }
      });
    } else if (purpose === 'videoVerification') {
      user = await User.findOne({
        email,
        videoOtp: otp,
        videoOtpExpiry: { $gt: Date.now() }
      });
    } else {
      return res.status(400).json({ success: false, message: "Invalid verification purpose" });
    }

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP or expired. Please request a new OTP."
      });
    }

    if (purpose === 'passwordReset') {
      user.resetOtp = undefined;
      user.resetOtpExpiry = undefined;
    } else if (purpose === 'videoVerification') {
      user.videoOtp = undefined;
      user.videoOtpExpiry = undefined;
    }
    
    await user.save();

    res.status(200).json({ success: true, message: "OTP verified successfully" });
  } catch (error) {
    console.error("OTP Verification Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

export const updatePassword = async (req, res) => {
  const { email, newPassword } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    const user = await User.findOneAndUpdate({ email }, {
      password: hashedPassword,
      resetOtp: undefined,
      resetOtpExpiry: undefined,
      resetAttempted: true,
      lastResetDate: getCurrentDate()
    }, { new: true });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    console.error("Password update error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};