import User from "../models/user.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from 'crypto';
import axios from "axios";
import { Resend } from "resend";
import { getDeviceInfo } from '../middleware/deviceInfo.js';
import dotenv from 'dotenv';
dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

const SENDER_EMAIL = 'CodeQuest <no-reply@theujjwalsingh.codes>';
const SUPPORT_EMAIL = "theujjwalsinghh@gmail.com";

const getCurrentDate = () => {
  const now = new Date();
  return new Date(now.getTime() - (now.getTimezoneOffset() * 60000))
    .toISOString()
    .split('T')[0];
};

async function sendEmailSMTP2GO(to, subject, html) {
  try {
    // Primary: SMTP2GO
    const response = await axios.post(
      "https://api.smtp2go.com/v3/email/send",
      {
        api_key: process.env.SMTP2GO_API_KEY,
        to: [to],
        sender: SENDER_EMAIL,
        subject,
        html_body: html,
      },
      { headers: { "Content-Type": "application/json" } }
    );

    console.log(`✅ Email sent via SMTP2GO to: ${to}`);
    return response.data;

  } catch (err) {
    console.error("❌ SMTP2GO API error:", err.response?.data || err.message);
    console.log("⚠️ Retrying with Resend...");
    try {
      // Fallback: Resend
      const data = await resend.emails.send({
        from: SENDER_EMAIL,
        to,
        subject,
        html,
      });

      console.log(`✅ Email sent via Resend fallback to: ${to}`);
      return data;
    } catch (fallbackErr) {
      console.error("❌ Resend API error:", fallbackErr.message);
      throw new Error("Both SMTP2GO and Resend failed to send email");
    }
  }
}

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
    const device = getDeviceInfo(req);
    const hashedpassword = await bcrypt.hash(password, 12);
    const newuser = await User.create({
      name,
      email,
      password: hashedpassword,
      loginHistory: [device]
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
      console.log(hours);

      if (hours < 10 || hours >= 13) { // 10 - 13
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

      await sendEmailSMTP2GO(email, emailTemplate.subject, emailTemplate.html);

      return res.status(200).json({
        otpRequired: true,
        message: "OTP sent for Chrome verification"
      });
    } else {
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

    const subject =
      purpose === "passwordReset"
        ? "Your Password Reset OTP"
        : "Video Verification Code";
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f78409; border-radius: 8px;">
        <h2 style="color: #f78409; text-align: center;">${purpose === "passwordReset"
        ? "Password Reset Request"
        : "Video Upload Verification"
      }</h2>
        <p>We received a request for your account: <strong>${email}</strong></p>
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
    `;

    await sendEmailSMTP2GO(email, subject, html);

    res.status(200).json({
      success: true,
      message: "OTP sent successfully",
      purpose,
    });
  } catch (error) {
    console.error("SMTP2GO error:", error.message);
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