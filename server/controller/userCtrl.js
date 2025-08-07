import mongoose from "mongoose"
import User from "../models/user.js";

export const getallUsers = async (req, res) => {
  try {
    const allUsers = await User.find();
    const alluserdetails = allUsers.map((user) => ({
      _id: user._id,
      name: user.name,
      about: user.about,
      tags: user.tags,
      joinedon: user.joinedon,
      questionCount: user.questionCount,
      answerCount: user.answerCount,
      points: user.points
    }));
    res.status(200).json(alluserdetails);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateprofile = async (req, res) => {
  const { id: _id } = req.params;
  const { name, about, tags } = req.body;

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

export const getLoginHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const requestingUserId = req.userid;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    if (requestingUserId !== userId) {
      return res.status(403).json({ message: "Unauthorized access" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const history = user.loginHistory.sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    ).slice(0, 10);

    res.status(200).json(history);
  } catch (err) {
    console.error("Login history error:", err);
    res.status(500).json({ message: "Server error" });
  }
}