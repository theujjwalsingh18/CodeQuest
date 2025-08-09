import mongoose from "mongoose";

const userSchema = mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  about: { type: String },
  tags: { type: [String] },
  joinedon: { type: Date, default: Date.now },
  points: { type: Number, default: 0 },
  questionCount: { type: Number, default: 0 },
  answerCount: { type: Number, default: 0 },
  loginHistory: [{
    timestamp: { type: Date, default: Date.now },
    browser: String,
    os: String,
    deviceType: String,
    ip: String,
    location: String
  }],
  resetOtp: String,
  resetOtpExpiry: Date,
  lastResetDate: { type: String },
  resetAttempted: { type: Boolean, default: false },
  videoOtp: String,
  videoOtpExpiry: Date,
  lastVideoOtpSent: Date,
  loginOtp: String,
  loginOtpExpiry: Date
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
export default User;