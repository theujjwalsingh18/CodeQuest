import mongoose from "mongoose";
import Question from "../models/Question.js";
import User from "../models/user.js";

export const postanswer = async (req, res) => {
    const { id: _id } = req.params;
    const { noofanswers, answerbody, useranswered, userid } = req.body;

    if (!mongoose.Types.ObjectId.isValid(_id)) {
        return res.status(404).send("question unavailable...");
    }

    try {
        const updatequestion = await Question.findByIdAndUpdate(_id, {
            $addToSet: { answer: [{ answerbody, useranswered, userid }] },
            $inc: { noofanswers: 1 }
        }, { new: true });
        
        const updatedUser = await User.findByIdAndUpdate(userid, {
            $inc: {
                answerCount: 1,
                points: 5
            }
        }, { new: true, select: '_id points name email' });

        res.status(200).json({
            question: updatequestion,
            updatedUser: {
                _id: updatedUser._id,
                points: updatedUser.points,
                name: updatedUser.name,
                email: updatedUser.email
            }
        });
    } catch (error) {
        console.error("Error in postanswer:", error);
        res.status(500).json({ message: "Error in uploading answer" });
    }
}

export const deleteanswer = async (req, res) => {
    const { id: _id } = req.params;
    const { answerid } = req.body;

    if (!mongoose.Types.ObjectId.isValid(_id) || !mongoose.Types.ObjectId.isValid(answerid)) {
        return res.status(404).send("ID unavailable...");
    }

    try {
        const question = await Question.findById(_id);
        if (!question) {
            return res.status(404).json({ message: "Question not found" });
        }

        const answer = question.answer.find(a => a._id.toString() === answerid);

        if (!answer) {
            return res.status(404).send("Answer not found");
        }
        
        const basePoints = 5;
        const bonusPoints = 5 * Math.floor(answer.upvote.length / 5);
        const pointsToDeduct = basePoints + bonusPoints;

        await Question.findByIdAndUpdate(_id, {
            $pull: { answer: { _id: answerid } },
            $inc: { noofanswers: -1 }
        });

        const updatedUser = await User.findByIdAndUpdate(answer.userid, {
            $inc: {
                answerCount: -1,
                points: -pointsToDeduct
            }
        }, { new: true, select: '_id points name email' });
        
        res.status(200).json({
            message: "Successfully deleted answer",
            updatedUser: {
                _id: updatedUser._id,
                points: updatedUser.points,
                name: updatedUser.name,
                email: updatedUser.email
            }
        });
    } catch (error) {
        console.error("Error in deleteanswer:", error);
        res.status(500).json({ message: "Error in deleting answer" });
    }
}

export const voteanswer = async (req, res) => {
    const { id: _id, answerid, value } = req.body;
    const userid = req.userid;

    if (!mongoose.Types.ObjectId.isValid(_id) || !mongoose.Types.ObjectId.isValid(answerid)) {
        return res.status(404).send("ID unavailable...");
    }

    try {
        const question = await Question.findById(_id);
        if (!question) {
            return res.status(404).json({ message: "Question not found" });
        }

        const answer = question.answer.id(answerid);

        if (!answer) {
            return res.status(404).json({ message: "Answer not found" });
        }

        if (answer.userid.toString() === userid) {
            return res.status(403).json({ message: "You cannot vote on your own answer" });
        }

        const userIdStr = String(userid);
        const answerAuthorId = answer.userid;

        const oldUpvoteCount = answer.upvote.length;
        const oldDownvoteCount = answer.downvote.length;
        const oldNetScore = oldUpvoteCount - oldDownvoteCount;

        const hasUpvoted = answer.upvote.includes(userIdStr);
        const hasDownvoted = answer.downvote.includes(userIdStr);

        if (value === "upvote") {
            if (hasUpvoted) {
                answer.upvote = answer.upvote.filter(id => id !== userIdStr);
            } else {
                if (hasDownvoted) {
                    answer.downvote = answer.downvote.filter(id => id !== userIdStr);
                }
                answer.upvote.push(userIdStr);
            }
        } else if (value === "downvote") {
            if (hasDownvoted) {
                answer.downvote = answer.downvote.filter(id => id !== userIdStr);
            } else {
                if (hasUpvoted) {
                    answer.upvote = answer.upvote.filter(id => id !== userIdStr);
                }
                answer.downvote.push(userIdStr);
            }
        }

        await question.save();
        const newUpvoteCount = answer.upvote.length;
        const newDownvoteCount = answer.downvote.length;
        const newNetScore = newUpvoteCount - newDownvoteCount;

        const oldMilestones = Math.floor(oldNetScore / 5);
        const newMilestones = Math.floor(newNetScore / 5);
        const pointChangeForAuthor = 5 * (newMilestones - oldMilestones);

        let updatedUser = null;
        if (pointChangeForAuthor !== 0) {
            updatedUser = await User.findByIdAndUpdate(answerAuthorId,
                { $inc: { points: pointChangeForAuthor } },
                { new: true, select: '_id points name email' }
            );
        } else {
            updatedUser = await User.findById(answerAuthorId, '_id points name email');
        }

        res.status(200).json({
            message: "Voted successfully",
            updatedUser: updatedUser ? {
                _id: updatedUser._id,
                points: updatedUser.points,
                name: updatedUser.name,
                email: updatedUser.email
            } : null
        });

    } catch (error) {
        console.error("Error in voteanswer:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};