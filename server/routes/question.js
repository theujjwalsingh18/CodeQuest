import express from "express"
import { Askquestion,getallquestion,deletequestion,votequestion } from "../controller/Question.js"
import auth from "../middleware/auth.js"

const questionroutes=express.Router();

questionroutes.post('/Ask', auth, Askquestion);
questionroutes.get('/get',getallquestion);
questionroutes.delete("/delete/:id",auth,deletequestion);
questionroutes.patch("/vote/:id",auth,votequestion)


export default questionroutes;