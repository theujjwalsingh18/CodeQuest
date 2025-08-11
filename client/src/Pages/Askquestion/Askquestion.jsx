import { React, useState, useEffect, useRef } from 'react';
import './Askquestion.css';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from "react-redux";
import { askquestion } from '../../Action/question';
import useToast from '../../hooks/useToast'
import { FaTimes } from 'react-icons/fa';
import { MdCloudUpload } from 'react-icons/md';
import OtpHandler from '../../Components/OtpHandler/OtpHandler';
import { getTimeInfo } from '../../api';

const Askquestion = () => {
  const { successToast, errorToast, infoToast } = useToast();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.currentuserreducer);
  const [questiontitle, setquestiontitle] = useState("");
  const [questionbody, setquestionbody] = useState("");
  const [questiontags, setquestiontags] = useState("");
  const [video, setVideo] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isVideoAllowed, setIsVideoAllowed] = useState(false);
  const [isVideoVerified, setIsVideoVerified] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [emailVerificationRequired, setEmailVerificationRequired] = useState(false);
  const [currentTime, setCurrentTime] = useState("--:--:--");
  const [isCheckingTime, setIsCheckingTime] = useState(true);
  const progressRef = useRef(null);

  const isWithinVideoHours = (timeStr) => {
    if (!timeStr || timeStr === "--:--:--") return false;

    try {
      const [hoursStr] = timeStr.split(':');
      const hours = parseInt(hoursStr, 10);
      return hours >= 1 && hours < 23; // 2PM - 7PM
    } catch (error) {
      console.error('Error parsing time:', error);
      return false;
    }
  };

  const fetchTimeInfo = async () => {
    try {
      setIsCheckingTime(true);
      const { data } = await getTimeInfo();
      setCurrentTime(data.currentTime || "--:--:--");
      setIsVideoAllowed(isWithinVideoHours(data.currentTime));
    } catch (error) {
      console.error('Failed to fetch time info:', error);
      setCurrentTime("--:--:--");
    } finally {
      setIsCheckingTime(false);
    }
  };

  useEffect(() => {
    fetchTimeInfo();
    const interval = setInterval(fetchTimeInfo, 2 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isVideoAllowed && video) {
      setVideo(null);
      infoToast("Video upload window closed. Video removed.");
    }
  }, [isVideoAllowed, video]);

  const startVerification = async () => {
    if (!user) {
      errorToast("Please login to verify for video upload");
      return;
    }
    setShowVerificationModal(true);
  };

  const handleVerifySuccess = () => {
    setIsVideoVerified(true);
    setEmailVerificationRequired(false);
    setShowVerificationModal(false);
    successToast("Email verified! You can now upload video");
  };

  const handleDailyLimitExceeded = (errorMessage) => {
    errorToast(errorMessage);
    setShowVerificationModal(false);
  };

  const simulateProgress = () => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 5) + 1;
      if (progress >= 100) {
        clearInterval(interval);
        setUploadProgress(100);
        setUploadStatus("Finalizing...");
        return;
      }
      setUploadProgress(progress);
    }, 200);
    progressRef.current = interval;
  };

  const handlesubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      errorToast("Login to ask a question");
      return;
    }

    if (!questionbody || !questiontitle || !questiontags) {
      errorToast("Please enter all required fields");
      return;
    }

    const tagsArray = questiontags.split(" ").filter(tag => tag.trim() !== "");
    if (tagsArray.length === 0) {
      infoToast("Please enter at least one tag");
      return;
    }

    if (video && video.size > 50 * 1024 * 1024) {
      errorToast("Video file exceeds 50MB limit");
      return;
    }

    setIsUploading(true);

    if (video) {
      setUploadStatus("Preparing upload...");
      setUploadProgress(0);

      if (progressRef.current) {
        clearInterval(progressRef.current);
      }
      simulateProgress();
    }

    try {
      const progressHandler = video ? (progressEvent) => {
        if (progressEvent.lengthComputable) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percentCompleted);
          setUploadStatus("Uploading video...");
        }
      } : undefined;

      if (video) {
        setTimeout(() => {
          setUploadStatus("Uploading question...");
        }, 1000);
      }

      await dispatch(askquestion({
        questiontitle,
        questionbody,
        questiontags: tagsArray,
        userposted: user.result.name,
        video
      }, navigate, progressHandler));

      if (video) {
        setUploadStatus("Saving question...");
        setUploadProgress(100);
      }

      setTimeout(() => {
        successToast("Question posted successfully!");
        resetForm();
      }, 1000);
    } catch (err) {
      console.error(err);
      errorToast(err.message || "Failed to post question");
      resetProgress();
    }
  };

  const resetForm = () => {
    setquestiontitle("");
    setquestionbody("");
    setquestiontags("");
    setVideo(null);
    setIsUploading(false);
    setUploadProgress(0);
    setUploadStatus("");
    setIsVideoVerified(false);
    if (progressRef.current) {
      clearInterval(progressRef.current);
    }
  };

  const resetProgress = () => {
    setIsUploading(false);
    setUploadProgress(0);
    setUploadStatus("");
    if (progressRef.current) {
      clearInterval(progressRef.current);
    }
  };

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (!file) {
      setVideo(null);
      return;
    }

    if (!isVideoVerified) {
      setEmailVerificationRequired(true);
      infoToast("Email verification required for video upload");
      e.target.value = "";
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      errorToast("Video file exceeds 50MB limit");
      e.target.value = "";
      return;
    }

    setVideo(file);
    infoToast("Video selected. Ready for upload!");
  };

  const handleenter = (e) => {
    if (e.code === 'Enter') {
      setquestionbody(questionbody + "\n");
    }
  };

  const removeVideo = () => {
    setVideo(null);
    infoToast("Video removed");
  };

  const getProgressColor = () => {
    const hue = Math.round((uploadProgress * 120) / 100);
    return `hsl(${hue}, 100%, 45%)`;
  };

  return (
    <div className="ask-question">
      {showVerificationModal && (
        <OtpHandler
          email={user?.result?.email}
          purpose="videoVerification"
          onVerify={handleVerifySuccess}
          onClose={() => setShowVerificationModal(false)}
          headerText="Verify Your Email for Video Upload"
          description="We've sent a 6-digit code to"
          buttonText="Verify & Upload Video"
          onDailyLimitExceeded={handleDailyLimitExceeded}
          autoSend={true}
        />
      )}

      <div className="ask-ques-container">
        <h1>Ask a public Question</h1>

        <form onSubmit={handlesubmit}>
          <div className="ask-form-container">
            <label htmlFor="ask-ques-title">
              <h4>Title</h4>
              <p>Be specific and imagine you're asking a question to another person</p>
              <input
                type="text"
                id="ask-ques-title"
                value={questiontitle}
                onChange={(e) => setquestiontitle(e.target.value)}
                placeholder='e.g. Is there an R function for finding the index of an element in a vector?'
                required
                disabled={isUploading}
              />
            </label>

            <label htmlFor="ask-ques-body">
              <h4>Body</h4>
              <p>Include all the information someone would need to answer your question</p>
              <textarea
                id="ask-ques-body"
                value={questionbody}
                onChange={(e) => setquestionbody(e.target.value)}
                cols="30"
                rows="10"
                onKeyDown={handleenter}
                required
                disabled={isUploading}
              ></textarea>
            </label>

            <label htmlFor="ask-ques-tags">
              <h4>Tags</h4>
              <p>Add up to 5 tags to describe what your question is about</p>
              <input
                type="text"
                id='ask-ques-tags'
                value={questiontags}
                onChange={(e) => setquestiontags(e.target.value)}
                placeholder='e.g. python javascript css js react'
                required
                disabled={isUploading}
              />
            </label>

            <div className="video-upload-section">
              <h4>Attach Video (optional)</h4>

              {isVideoAllowed ? (
                <>
                  <p>Max size: <strong>50MB</strong>.
                    <br />Max duration: <strong>2 minutes</strong>.
                    <br />
                    Allowed between <strong>2PM-7PM</strong> only.</p>

                  <div className="verification-status">
                    <span>Verification: </span>
                    {isVideoVerified ? (
                      <span className="verified">✓ Verified</span>
                    ) : (
                      <span className="not-verified">Not Verified</span>
                    )}
                  </div>

                  {emailVerificationRequired && !isVideoVerified && (
                    <div className="verification-required">
                      <p>Email verification required to upload videos</p>
                    </div>
                  )}

                  {!isVideoVerified ? (
                    <div className="verification-prompt">
                      <p>You need to verify your email to upload video</p>
                      <button
                        type="button"
                        className="verify-btn"
                        onClick={startVerification}
                        disabled={isUploading}
                      >
                        Verify Email
                      </button>
                    </div>
                  ) : (
                    !video ? (
                      <div className="video-upload-area">
                        <label className="video-upload-label">
                          <MdCloudUpload className="upload-icon" />
                          <span>Click to select video</span>
                          <input
                            type="file"
                            accept="video/*"
                            onChange={handleVideoChange}
                            className="video-upload-input"
                            disabled={isUploading}
                          />
                        </label>
                      </div>
                    ) : (
                      <div className="video-info-card">
                        <div className="video-info-header">
                          <span>Selected Video:</span>
                          <button
                            type="button"
                            className="remove-video-btn"
                            onClick={removeVideo}
                            disabled={isUploading}
                          >
                            <FaTimes />
                          </button>
                        </div>
                        <div className="video-details">
                          <div className="video-name">{video.name}</div>
                          <div className="video-size">Size: {(video.size / (1024 * 1024)).toFixed(2)}MB</div>
                        </div>
                      </div>
                    )
                  )}
                </>
              ) : (
                <div className="video-disabled-notice">
                  {isCheckingTime ? (
                    <p>⏳ Checking video upload availability...</p>
                  ) : (
                    <>
                      <p>⏱️ Video uploads are only available between 2 PM and 7 PM</p>
                      <p className="small-note">
                        You can still post text questions anytime. Videos help explain complex issues,
                        but we limit uploads to maintain server performance during peak hours.
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className='submit-btn'
              disabled={isUploading}
            >
              {isUploading ? (
                <span className="uploading-text">
                  <span className="spinner"></span> Posting Question...
                </span>
              ) : (
                "Post Your Question"
              )}
            </button>
          </div>
        </form>
      </div>
      {isUploading && video && (
        <div className="progress-bar-container">
          <div className="progress-bar-header">
            <span>{uploadStatus}</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="progress-bar-track">
            <div
              className="progress-bar-fill"
              style={{
                width: `${uploadProgress}%`,
                background: getProgressColor()
              }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Askquestion;