import { React, useState, useEffect, useRef, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { FaTimes } from 'react-icons/fa';
import { sendOtp, verifyOtp } from '../../Action/Auth';
import './OtpHandler.css';
import verificationImage from '../../assets/email-verification.png';
import errorMail from "../../assets/error_mail.png";

const OtpHandler = ({
  email,
  purpose,
  onVerify,
  onClose,
  headerText = "Let's get your email verified",
  description = "To keep your account secure we need to verify your email address. Enter the code we have sent",
  buttonText = "Verify",
  onDailyLimitExceeded,
  initialError = null,
  autoSend = false,
  onResend,
}) => {
  const [otp, setOtp] = useState('');
  const [message, setMessage] = useState('');
  const [resendTime, setResendTime] = useState(0);
  const [loading, setLoading] = useState(false);
  const [autoCloseCountdown, setAutoCloseCountdown] = useState(5);
  const [resendLoading, setResendLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [dailyLimitExceeded, setDailyLimitExceeded] = useState(
    initialError === 'daily_limit_exceeded'
  );
  const otpInputRef = useRef(null);
  const timerRef = useRef(null);
  const initialSendDone = useRef(false);
  const dispatch = useDispatch();

  useEffect(() => {
    if (initialError === 'daily_limit_exceeded') {
      setDailyLimitExceeded(true);
      setErrorMessage("You've already attempted a password reset today. Please try again tomorrow.");
    }
  }, [initialError]);

  const startResendTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    setResendTime(60);
    
    timerRef.current = setInterval(() => {
      setResendTime(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const sendOtpRequest = useCallback(async (isResend = false) => {
    setMessage('');
    setOtp('');
    setDailyLimitExceeded(false);

    try {
      const action = isResend ? setResendLoading : setLoading;
      action(true);
      
      if (purpose === 'browserVerification' && isResend && onResend) {
        const result = await onResend();
        if (result?.otpRequired) {
          setMessage('New OTP sent! Please check your email.');
          startResendTimer();
          if (otpInputRef.current) {
            otpInputRef.current.focus();
          }
          return true;
        }
        return false;
      }

      const result = await dispatch(sendOtp({ email, purpose }));

      if (result?.success) {
        setMessage(isResend ? 'OTP resent successfully!' : 'OTP sent successfully!');
        startResendTimer();
        if (otpInputRef.current) {
          otpInputRef.current.focus();
        }
        return true;
      } else {
        const errorMsg = result?.message || 'Failed to send OTP';
        if (result?.status === 429 ||
          errorMsg.includes("Only one password reset attempt allowed per day")) {
          setDailyLimitExceeded(true);
          setErrorMessage(errorMsg);
          if (onDailyLimitExceeded) {
            onDailyLimitExceeded(errorMsg);
          }
        } else {
          setMessage(errorMsg);
        }
        return false;
      }
    } catch (error) {
      setMessage('Failed to send OTP');
      return false;
    } finally {
      setResendLoading(false);
      setLoading(false);
    }
  }, [dispatch, email, purpose, onDailyLimitExceeded, onResend, startResendTimer]);

  useEffect(() => {
    if (autoSend && !initialSendDone.current && !dailyLimitExceeded) {
      initialSendDone.current = true;
      sendOtpRequest(false);
    }
  }, [autoSend, dailyLimitExceeded, sendOtpRequest]);

  useEffect(() => {
    let timer;
    if (dailyLimitExceeded) {
      setAutoCloseCountdown(5);
      timer = setInterval(() => {
        setAutoCloseCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            if (onClose) onClose();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [dailyLimitExceeded, onClose]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const handleOtpChange = (e) => {
    const value = e.target.value;
    if (/^\d{0,6}$/.test(value)) {
      setOtp(value);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();

    if (otp.length !== 6) {
      setMessage('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      let result;
      if (purpose === 'browserVerification') {
        const success = await onVerify(otp);
        if (success) return;
        setMessage('OTP verification failed');
      } else {
        result = await dispatch(verifyOtp({ email, otp, purpose }));
        if (result?.success) {
          onVerify();
        } else {
          setMessage(result?.message || 'Invalid OTP');
        }
      }
    } catch (error) {
      setMessage('OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = () => {
    if (resendTime > 0 || dailyLimitExceeded) return;
    sendOtpRequest(true);
  };

  if (dailyLimitExceeded) {
    return (
      <div className="otp-modal-backdrop">
        <div className="otp-modal-content">
          <div className="modal-close-btn-container">
            {onClose && (
              <button onClick={onClose} className="modal-close-btn">
                <FaTimes />
              </button>
            )}
          </div>

          <div className="otp-modal-grid">
            <div className="otp-modal-image-2">
              <img
                src={errorMail}
                alt="Email Error verification"
                className="verification-image"
              />
            </div>

            <div className="otp-modal-form-container">
              <div className="otp-modal-header">
                <h2>Daily Limit Reached</h2>
              </div>

              <div className="otp-modal-body">
                <p className="description">
                  {errorMessage || "You've exceeded the daily limit for OTP requests."}
                </p>
                <p className="auto-close-message">
                  This message will close automatically in {autoCloseCountdown} seconds...
                </p>

                <div className="resend-container">
                  <button
                    type="button"
                    onClick={onClose}
                    className="resend-enabled"
                  >
                    Close Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="otp-modal-backdrop">
      <div className="otp-modal-content">
        <div className="modal-close-btn-container">
          {onClose && (
            <button onClick={onClose} className="modal-close-btn">
              <FaTimes />
            </button>
          )}
        </div>

        <div className="otp-modal-grid">
          <div className="otp-modal-image">
            <img
              src={verificationImage}
              alt="Email verification"
              className="verification-image"
            />
          </div>

          <div className="otp-modal-form-container">
            <div className="otp-modal-header">
              <h2>{headerText}</h2>
            </div>

            <div className="otp-modal-body">
              <p className="description">{description} to <strong>{email}</strong> enter below.</p>

              <form onSubmit={handleVerify} className="otp-form">
                <div className="otp-input-container">
                  <input
                    type="text"
                    placeholder="Code"
                    value={otp}
                    onChange={handleOtpChange}
                    ref={otpInputRef}
                    className="otp-input"
                    inputMode="numeric"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="verify-btn"
                    disabled={loading || otp.length !== 6}
                  >
                    {loading ? <div className="spinner"></div> : buttonText}
                  </button>
                </div>

                {message && <p className={`otp-message ${message.includes('success') ? 'success' : 'error'}`}>{message}</p>}

                <div className="resend-container">
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendTime > 0 || resendLoading}
                    className={resendTime > 0 ? 'resend-disabled' : 'resend-enabled'}
                  >
                    {resendLoading ? 'Sending...' :
                      resendTime > 0 ? `Resend code in ${resendTime}s` : 'Resend code'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OtpHandler;