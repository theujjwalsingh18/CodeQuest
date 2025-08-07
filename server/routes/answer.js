import express from "express"
import { postanswer,deleteanswer, voteanswer } from "../controller/AnswersCtrl.js";
import auth from "../middleware/auth.js";
const router=express.Router();
router.patch("/post/:id",auth,postanswer);
router.patch("/delete/:id", auth, deleteanswer);
router.patch("/vote", auth, voteanswer);

export default router;