import express from "express";
import { sendOtp, verifyOtp, updatePassword } from '../controller/auth.js';

const authRoutes  = express.Router();

authRoutes.post('/send-otp', sendOtp);
authRoutes.post('/verify-otp', verifyOtp);
authRoutes.post('/update-password', updatePassword);

export default authRoutes;