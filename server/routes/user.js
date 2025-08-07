import express from "express"
import auth from "../middleware/auth.js"
import { login, signup } from '../controller/auth.js'
import { getallUsers, updateprofile, getLoginHistory } from "../controller/userCtrl.js";
import { transferPoints, getTransactionHistory } from "../controller/transfer.js";

const userroutes = express.Router();

userroutes.post("/signup", signup);
userroutes.post("/login", login);

userroutes.get("/getallusers", getallUsers);
userroutes.get("/history/:userId", auth, getLoginHistory);
userroutes.patch("/update/:id", auth, updateprofile);
userroutes.get("/profile/:id", auth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: "User not found" });

        res.json({
            _id: user._id,
            name: user.name,
            points: user.points,
        });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

userroutes.post("/transfer", auth, transferPoints);
userroutes.get("/transactions", auth, getTransactionHistory);

export default userroutes;