import mongoose from "mongoose"
import User from '../models/auth.js';

export const getallUsers = async (req, res) => {
    try {
        const allUsers = await User.find();
        console.log('Users found:', allUsers);
        const alluserdetails = allUsers.map((user) => ({
            _id: user._id,
            name: user.name,
            about: user.about,
            tags: user.tags,
            joinedon: user.joinedon,
        }));
        res.status(200).json(alluserdetails);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateprofile = async (req, res) => {
    const { id: _id } = req.params;
    const { name, about, tags} = req.body;

    if (!mongoose.Types.ObjectId.isValid(_id)) {
        return res.status(404).send("User unavailable");
    }

    try {
        const updatedProfile = await User.findByIdAndUpdate(_id, {
            $set: { 
                name, 
                about, 
                tags
            },
        }, { new: true });
        res.status(200).json(updatedProfile);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};