import Question from "../models/Question.js";
import User from "../models/user.js";
import mongoose from "mongoose";
import cloudinary from '../config/cloudinary.js';
import stream  from "stream";
const deleteWithRetry = async (publicId, attempts = 0) => {
    const maxAttempts = 5;

    try {
        console.log(`Deleting ${publicId} (attempt ${attempts + 1})`);
        await cloudinary.uploader.destroy(publicId, {
            resource_type: 'video',
            invalidate: true
        });
        console.log("Cloudinary asset deleted successfully");
    } catch (deleteError) {
        console.error(`Delete failed (attempt ${attempts + 1}):`, deleteError);

        if (attempts < maxAttempts - 1) {
            await new Promise(resolve => setTimeout(resolve, 2000 * Math.pow(2, attempts)));
            return deleteWithRetry(publicId, attempts + 1);
        }

        console.error("Permanent deletion failure. Manual cleanup needed for:", publicId);
    }
};

export const Askquestion = async (req, res) => {
  try {
    const { questiontitle, questionbody, questiontags, userposted } = req.body;
    const userid = req.userid;
    const videoFile = req.files?.video;

    const now = new Date();
    const hours = now.getHours();
    // 14 - 19
    if (videoFile && (hours < 14 || hours >= 19)) {
      return res.status(403).json({
        message: "Video uploads only allowed between 2 PM and 7 PM"
      });
    }

    let videoUrl = '';
    let publicId = '';

    if (videoFile) {
      if (videoFile.size > 50 * 1024 * 1024) {
        return res.status(400).json({
          message: "Video exceeds 50 MB limit"
        });
      }

      try {
        const bufferStream = new stream.PassThrough();
        bufferStream.end(videoFile.data);

        const uploadResult = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              resource_type: "video",
              chunk_size: 10 * 1024 * 1024,
              timeout: 600000,
              eager: [{ streaming_profile: "hd", format: "m3u8" }],
              eager_async: true
            },
            (error, result) => error ? reject(error) : resolve(result)
          );

          bufferStream.pipe(uploadStream);
        });

        if (uploadResult.duration > 120) {
          await deleteWithRetry(uploadResult.public_id);
          return res.status(400).json({
            message: "Video exceeds 2 minute limit"
          });
        }

        videoUrl = uploadResult.secure_url;
        publicId = uploadResult.public_id;
      } catch (uploadError) {
        console.error("Video upload error:", uploadError);
        return res.status(500).json({
          message: "Video processing failed: " + uploadError.message
        });
      }
    }

    const postquestion = new Question({
      questiontitle,
      questionbody,
      questiontags: JSON.parse(questiontags),
      videoUrl,
      publicId,
      userposted,
      userid
    });

    const savedQuestion = await postquestion.save();
    await User.findByIdAndUpdate(userid, { $inc: { questionCount: 1 } });
    res.status(200).json(savedQuestion);
  } catch (error) {
    console.error("Error in Askquestion controller:", error);
    res.status(500).json({
      message: "Couldn't post a new question",
      error: error.message
    });
  }
};

export const getallquestion = async (req, res) => {
  try {
    const questionlist = await Question.find().sort({ askedon: -1 });
    res.status(200).json(questionlist)
  } catch (error) {
    console.log(error)
    res.status(404).json({ message: error.message });
    return
  }
};

export const deletequestion = async (req, res) => {
  const { id: _id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(404).send("question unavailable...");
  }
  try {
    const question = await Question.findById(_id);

    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    if (question.publicId) {
      await cloudinary.uploader.destroy(question.publicId, {
        resource_type: "video"
      });
    }

    const updatedUser = await User.findByIdAndUpdate(question.userid, {
      $inc: {
        questionCount: -1,
      }
    }, { new: true, select: '_id points name email' });

    await Question.findByIdAndDelete(_id);
    res.status(200).json({
      message: "Successfully deleted question",
      updatedUser: {
        _id: updatedUser._id,
        points: updatedUser.points,
        name: updatedUser.name,
        email: updatedUser.email
      }
    });
  } catch (error) {
    console.error("Error in deletequestion:", error);
    res.status(500).json({ message: error.message });
  }
};

export const votequestion = async (req, res) => {
  const { id: _id } = req.params;
  const { value } = req.body;
  const userid = req.userid;

  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(404).send("question unavailable...");
  }

  try {
    const question = await Question.findById(_id);
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    if (question.userid.toString() === userid) {
      return res.status(403).json({ message: "You cannot vote on your own question" });
    }

    const userIdStr = String(userid);
    const hasUpvoted = question.upvote.includes(userIdStr);
    const hasDownvoted = question.downvote.includes(userIdStr);

    if (value === "upvote") {
      if (hasUpvoted) {
        question.upvote = question.upvote.filter(id => id !== userIdStr);
      } else {
        if (hasDownvoted) {
          question.downvote = question.downvote.filter(id => id !== userIdStr);
        }
        question.upvote.push(userIdStr);
      }
    } else if (value === "downvote") {
      if (hasDownvoted) {
        question.downvote = question.downvote.filter(id => id !== userIdStr);
      } else {
        if (hasUpvoted) {
          question.upvote = question.upvote.filter(id => id !== userIdStr);
        }
        question.downvote.push(userIdStr);
      }
    }

    await Question.findByIdAndUpdate(_id, {
      upvote: question.upvote,
      downvote: question.downvote
    });

    res.status(200).json({ message: "voted successfully.." });
  } catch (error) {
    console.error("Vote error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};