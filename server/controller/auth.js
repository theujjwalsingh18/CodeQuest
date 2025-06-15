import User from '../models/auth.js'
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
export const signup = async (req, res) => {
    const { name, email, password } = req.body;
    try {
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
        res.status(500).json("something went wrong...")
        return
    }
}

export const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const existinguser = await User.findOne({ email });
        if (!existinguser) {
            return res.status(404).json({ message: "User doesn't exists" })
        }
        const ispasswordcrct = await bcrypt.compare(password, existinguser.password);
        if (!ispasswordcrct) {
            res.status(400).json({ message: "Invalid credentials" });
            return
        }
        const token = jwt.sign({
            email: existinguser.email, id: existinguser._id
        }, process.env.JWT_SECRET, { expiresIn: "1h" }
        )

        res.status(200).json({ result: existinguser, token })
    } catch (error) {
        res.status(500).json("something went wrong...")
        return
    }
}