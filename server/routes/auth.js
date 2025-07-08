import express from "express";
import { sendOtp, verifyOtp, verifyLoginOtp, updatePassword } from '../controller/auth.js';

const authRoutes  = express.Router();

authRoutes.post('/send-otp', sendOtp);
authRoutes.post('/verify-otp', verifyOtp);
authRoutes.post('/verify-login-otp', verifyLoginOtp);
authRoutes.post('/update-password', updatePassword);

export default authRoutes;