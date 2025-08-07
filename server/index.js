import express from "express"
import mongoose from "mongoose"
import cors from "cors"
import dotenv from "dotenv"
import fileUpload from 'express-fileupload';
import userroutes from "./routes/user.js"
import authRoutes from "./routes/auth.js"
import questionroutes from "./routes/question.js"
import answerroutes from "./routes/answer.js"
import { getDeviceTime } from "./controller/timeInfo.js";
import mobileTimeRestriction from "./middleware/mobileTimeRestriction.js";

const app = express();
app.set('trust proxy', true);
dotenv.config();
app.use(express.json({ limit: '30mb', extended: true }));
app.use(express.urlencoded({ limit: '30mb', extended: true }));
app.use(cors());
app.use(fileUpload({
  useTempFiles: false,
  limits: { fileSize: 50 * 1024 * 1024 }
}));

app.use("/user", mobileTimeRestriction, userroutes);
app.use("/auth", mobileTimeRestriction, authRoutes)
app.use('/questions', mobileTimeRestriction, questionroutes)
app.use('/answer', mobileTimeRestriction, answerroutes);
app.get('/get-time', getDeviceTime)
app.get('/', (req, res) => {
  res.send("Stakify is running perfect")
})

const PORT = process.env.PORT || 5000
const database_url = process.env.MONGODB_URL

mongoose.connect(database_url)
  .then(() => app.listen(PORT, () => { console.log(`server running on port ${PORT}`) }))
  .catch((err) => console.log(err.message))


process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});