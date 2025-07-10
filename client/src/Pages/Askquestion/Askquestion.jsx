import { React, useState, useEffect, useRef } from 'react';
import './Askquestion.css';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from "react-redux";
import { askquestion } from '../../Action/question';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaTimes } from 'react-icons/fa';
import { MdCloudUpload } from 'react-icons/md';
import OtpHandler from '../../Components/OtpHandler/OtpHandler';

const calculateUploadTime = (fileSize) => {
  const uploadSpeed = 0.625;
  const sizeInMB = fileSize / (1024 * 1024);
  return Math.max(5, Math.min(30, Math.round(sizeInMB / uploadSpeed)));
};

const Askquestion = () => {
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
  const [estimatedTime, setEstimatedTime] = useState(null);
  const [isVideoAllowed, setIsVideoAllowed] = useState(false);
  const [isVideoVerified, setIsVideoVerified] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [emailVerificationRequired, setEmailVerificationRequired] = useState(false);
  const [checkingVideo, setCheckingVideo] = useState(false);

  const progressRef = useRef({
    interval: null,
    timer: null,
    startTime: null,
    uploadDuration: 0,
    processingDuration: 0,
    savingDuration: 0
  });

  useEffect(() => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const currentTime = hours + minutes / 60;

    // 14:00 (2 PM) to 19:00 (7 PM)
    const isAllowed = currentTime >= 1 && currentTime < 19;
    setIsVideoAllowed(isAllowed);

    if (!isAllowed && video) {
      setVideo(null);
      showInfo("Video upload window closed. Video removed.");
    }
  }, [video]);

  const startVerification = async () => {
    if (!user) {
      showError("Please login to verify for video upload");
      return;
    }
    setShowVerificationModal(true);
  };

  const handleVerifySuccess = () => {
    setIsVideoVerified(true);
    setEmailVerificationRequired(false);
    setShowVerificationModal(false);
    showSuccess("Email verified! You can now upload videos");
  };

  const handleDailyLimitExceeded = (errorMessage) => {
    showError(errorMessage);
    setShowVerificationModal(false);
  };

  const handlesubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      showError("Login to ask a question");
      return;
    }

    if (!questionbody || !questiontitle || !questiontags) {
      showError("Please enter all required fields");
      return;
    }

    const tagsArray = questiontags.split(" ").filter(tag => tag.trim() !== "");
    if (tagsArray.length === 0) {
      showError("Please enter at least one tag");
      return;
    }

    if (video) {
      if (video.size > 50 * 1024 * 1024) {
        showError("Video file exceeds 50MB limit");
        return;
      }

      const allowedTypes = ["video/mp4", "video/webm", "video/ogg",];
      if (!allowedTypes.includes(video.type)) {
        showError("Only MP4, WebM, and OGG videos are allowed");
        return;
      }
    }

    setIsUploading(true);
    setUploadStatus("Preparing upload...");
    setUploadProgress(0);
    setEstimatedTime(null);

    progressRef.current.startTime = Date.now();
    progressRef.current.uploadDuration = video ? calculateUploadTime(video.size) : 0;
    progressRef.current.processingDuration = video ? 3 : 0;
    progressRef.current.savingDuration = 2;
    const totalDuration =
      progressRef.current.uploadDuration +
      progressRef.current.processingDuration +
      progressRef.current.savingDuration;

    setEstimatedTime(totalDuration);

    try {
      const progressHandler = (progressEvent) => {
        if (progressEvent.lengthComputable) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          if (percentCompleted > uploadProgress) {
            setUploadProgress(percentCompleted);
          }
        }
      };

      simulateProgress();

      await dispatch(askquestion({
        questiontitle,
        questionbody,
        questiontags: tagsArray,
        userposted: user.result.name,
        video
      }, navigate, progressHandler));

      setUploadStatus("Finalizing...");
      setUploadProgress(100);
      setTimeout(() => {
        showSuccess("Question posted successfully!");
        resetForm();
      }, 1000);
    } catch (err) {
      console.error(err);
      showError(err.message || "Failed to post question");
      resetProgress();
    }
  };

  const simulateProgress = () => {
    if (progressRef.current.interval) {
      clearInterval(progressRef.current.interval);
    }

    const startTime = Date.now();
    const totalDuration =
      progressRef.current.uploadDuration +
      progressRef.current.processingDuration +
      progressRef.current.savingDuration;

    progressRef.current.interval = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      const remaining = Math.max(0, totalDuration - elapsed);
      setEstimatedTime(Math.round(remaining));

      let progress = 0;
      let status = "Preparing...";

      if (elapsed < progressRef.current.uploadDuration) {
        progress = (elapsed / progressRef.current.uploadDuration) * 70;
        status = "Uploading video...";
      } else if (elapsed < progressRef.current.uploadDuration + progressRef.current.processingDuration) {
        const processingElapsed = elapsed - progressRef.current.uploadDuration;
        progress = 70 + (processingElapsed / progressRef.current.processingDuration) * 20;
        status = "Processing video...";
      } else {
        const savingElapsed = elapsed - progressRef.current.uploadDuration - progressRef.current.processingDuration;
        progress = 90 + (savingElapsed / progressRef.current.savingDuration) * 10;
        status = "Saving question...";
        if (progress > 99) progress = 99;
      }

      setUploadProgress(Math.min(99, Math.floor(progress)));
      setUploadStatus(status);
    }, 500);
  };

  const resetForm = () => {
    setquestiontitle("");
    setquestionbody("");
    setquestiontags("");
    setVideo(null);
    setIsUploading(false);
    setUploadProgress(0);
    setUploadStatus("");
    setEstimatedTime(null);
    setIsVideoVerified(false);
    clearInterval(progressRef.current.interval);
  };

  const resetProgress = () => {
    setIsUploading(false);
    setUploadProgress(0);
    setUploadStatus("");
    setEstimatedTime(null);
    clearInterval(progressRef.current.interval);
  };

  useEffect(() => {
    return () => {
      if (progressRef.current.interval) {
        clearInterval(progressRef.current.interval);
      }
    };
  }, []);

  const showError = (message) => {
    toast.error(message, {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
  };

  const showSuccess = (message) => {
    toast.success(message, {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
  };

  const showInfo = (message) => {
    toast.info(message, {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
  };

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (!file) {
      setVideo(null);
      return;
    }

    if (!isVideoVerified) {
      setEmailVerificationRequired(true);
      showInfo("Email verification required for video upload");
      e.target.value = "";
      return;
    }

    const allowedTypes = ["video/mp4", "video/webm", "video/ogg",];
    if (!allowedTypes.includes(file.type)) {
      showError("Only MP4, WebM, and OGG videos are allowed");
      e.target.value = "";
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      showError("Video file exceeds 50MB limit");
      e.target.value = "";
      return;
    }

    setCheckingVideo(true);
    const videoElement = document.createElement('video');
    videoElement.preload = 'metadata';

    videoElement.onloadedmetadata = () => {
      window.URL.revokeObjectURL(videoElement.src);
      const duration = videoElement.duration;
      if (duration > 120) { 
        setCheckingVideo(false);
        showError("Video exceeds 2 minute limit");
        e.target.value = "";
      } else {
        setVideo(file);
        setCheckingVideo(false);
        showInfo("Video selected. Ready for upload!");
      }
    };

    videoElement.onerror = () => {
      window.URL.revokeObjectURL(videoElement.src);
      setCheckingVideo(false);
      showError("Invalid video file. Could not load metadata.");
      e.target.value = "";
    };

    videoElement.src = URL.createObjectURL(file);
  };

  const handleenter = (e) => {
    if (e.code === 'Enter') {
      setquestionbody(questionbody + "\n");
    }
  };

  const removeVideo = () => {
    setVideo(null);
    showInfo("Video removed");
  };

  const getProgressColor = () => {
    if (uploadProgress < 40) return "#ff9800";
    if (uploadProgress < 80) return "#2196f3";
    return "#4caf50";
  };

  return (
    <div className="ask-question">
      <ToastContainer />
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
                    Allowed between 2PM-7PM only.</p>

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
                      <p>You need to verify your email to upload videos</p>
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
                          {checkingVideo ? (
                            <div className="video-checking">
                              <span className="spinner"></span> Checking video...
                            </div>
                          ) : (
                            <>
                              <MdCloudUpload className="upload-icon" />
                              <span>Click to select video</span>
                            </>
                          )}
                          <input
                            type="file"
                            accept=".mp4,.webm,.ogg,video/mp4,video/webm,video/ogg"
                            onChange={handleVideoChange}
                            className="video-upload-input"
                            disabled={isUploading || checkingVideo}
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
                          {isUploading && (
                            <div className="upload-time-estimate">
                              Estimated upload time: {calculateUploadTime(video.size)} seconds
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  )}
                </>
              ) : (
                <div className="video-disabled-notice">
                  <p>⏱️ Video uploads are only available between 2 PM and 7 PM</p>
                  <p className="small-note">
                    You can still post text questions anytime. Videos help explain complex issues,
                    but we limit uploads to maintain server performance during peak hours.
                  </p>
                </div>
              )}

              {isUploading && (
                <div className="upload-progress-container">
                  <div className="upload-status">
                    {uploadStatus}
                    {estimatedTime !== null && (
                      <span className="estimated-time">
                        (approx. {estimatedTime}s remaining)
                      </span>
                    )}
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${uploadProgress}%`,
                        backgroundColor: getProgressColor()
                      }}
                    >
                      {uploadProgress}%
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className='submit-btn'
              disabled={isUploading || checkingVideo}
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
    </div>
  );
};

export default Askquestion;