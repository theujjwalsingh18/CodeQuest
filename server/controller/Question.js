import Question from "../models/Question.js";
import mongoose from "mongoose";
import cloudinary from '../config/cloudinary.js';
import fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';
import ffprobeStatic from 'ffprobe-static';


ffmpeg.setFfprobePath(ffprobeStatic.path);

const getVideoDuration = (filePath) => {
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(filePath, (err, metadata) => {
            if (err) {
                console.error("FFprobe error:", err);
                return reject(err);
            }
            
            const duration = metadata.format.duration;
            if (typeof duration !== 'number') {
                return reject(new Error("Invalid duration format"));
            }
            
            resolve(duration);
        });
    });
};

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
        const { questiontitle, questionbody, questiontags } = req.body;
        const userid = req.userid;
        const videoFile = req.files?.video;

        console.log("Received question data:", {
            questiontitle,
            questionbody,
            questiontags,
            userid
        });

        const now = new Date();
        const hours = now.getHours();
        console.log(`Current time: ${now}, hours: ${hours}`);
        
        if (videoFile && (hours < 14 || hours >= 19)) {
            return res.status(403).json({ 
                message: "Video uploads only allowed between 2 PM and 7 PM" 
            });
        }

        let videoUrl = '';
        let publicId = '';

        if (videoFile) {
            console.log("Video file received:", {
                name: videoFile.name,
                size: videoFile.size,
                mimetype: videoFile.mimetype,
                tempFilePath: videoFile.tempFilePath
            });

            if (videoFile.size > 50 * 1024 * 1024) {
                return res.status(400).json({
                    message: "Video exceeds 50 MB limit"
                });
            }

            try {
                const duration = await getVideoDuration(videoFile.tempFilePath);
                console.log(`Video duration: ${duration} seconds`);
                
                if (duration > 120) {
                    console.log("Video exceeds 2 minute limit - aborting upload");
                    fs.unlinkSync(videoFile.tempFilePath);
                    return res.status(400).json({
                        message: "Video exceeds 2 minute limit"
                    });
                }
            } catch (durationError) {
                console.error("Duration check error:", durationError);
                fs.unlinkSync(videoFile.tempFilePath);
                return res.status(500).json({
                    message: "Failed to process video duration"
                });
            }

            // Upload to Cloudinary
            try {
                console.log("Uploading video to Cloudinary...");
                
                const result = await cloudinary.uploader.upload(videoFile.tempFilePath, {
                    resource_type: "video",
                    chunk_size: 50 * 1024 * 1024,
                    eager: [{ streaming_profile: "hd", format: "m3u8" }],
                    eager_async: true
                });

                console.log("Cloudinary upload result:", {
                    public_id: result.public_id,
                    duration: result.duration,
                    url: result.secure_url
                });

                // Secondary duration check (Cloudinary's metadata)
                if (result.duration > 120) {
                    console.log(`Cloudinary reports duration (${result.duration}s) exceeds limit`);
                    
                    // Attempt to delete with retries
                    await deleteWithRetry(result.public_id);
                    return res.status(400).json({
                        message: "Video exceeds 2 minute limit"
                    });
                }

                videoUrl = result.secure_url;
                publicId = result.public_id;
                
            } catch (uploadError) {
                console.error("Video upload error:", uploadError);
                return res.status(500).json({
                    message: "Video processing failed: " + uploadError.message
                });
            } finally {
                if (fs.existsSync(videoFile.tempFilePath)) {
                    fs.unlinkSync(videoFile.tempFilePath);
                    console.log("Temporary file deleted");
                }
            }
        }
        
        const postquestion = new Question({
            questiontitle,
            questionbody,
            questiontags: JSON.parse(questiontags),
            videoUrl,
            publicId,
            userposted: req.body.userposted,
            userid
        });

        console.log("Saving question to database");
        const savedQuestion = await postquestion.save();
        console.log("Question saved successfully:", savedQuestion._id);
        
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
        if (question.publicId) {
            await cloudinary.uploader.destroy(question.publicId, {
                resource_type: "video"
            });
        }
        await Question.findByIdAndDelete(_id);
        res.status(200).json({ message: "Successfully deleted..." });
    } catch (error) {
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
        const upindex = question.upvote.findIndex((id) => id === String(userid))
        const downindex = question.downvote.findIndex((id) => id === String(userid))
        if (value === "upvote") {
            if (downindex !== -1) {
                question.downvote = question.downvote.filter((id) => id !== String(userid))
            }
            if (upindex === -1) {
                question.upvote.push(userid);
            } else {
                question.upvote = question.upvote.filter((id) => id !== String(userid))
            }
        } else if (value === "downvote") {
            if (upindex !== -1) {
                question.upvote = question.upvote.filter((id) => id !== String(userid))
            }
            if (downindex === -1) {
                question.downvote.push(userid);
            } else {
                question.downvote = question.downvote.filter((id) => id !== String(userid))
            }
        }
        await Question.findByIdAndUpdate(_id, question);
        res.status(200).json({ message: "voted successfully.." })

    } catch (error) {
        res.status(404).json({ message: "id not found" });
        return
    }
};