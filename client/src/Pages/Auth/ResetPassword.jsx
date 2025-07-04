import React, { useState, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { updatePassword, sendOtp } from '../../Action/Auth';
import './Auth.css';
import OtpHandler from '../../Components/OtpHandler/OtpHandler';

const ResetPassword = ({ email, onBack }) => {
  const [step, setStep] = useState(0);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialOtpError, setInitialOtpError] = useState(null);
  const [sendingInitialOtp, setSendingInitialOtp] = useState(true);
  const initialOtpSent = useRef(false);
  const dispatch = useDispatch();

  useEffect(() => {
    const sendInitialOtp = async () => {
      try {
        setSendingInitialOtp(true);
        const result = await dispatch(sendOtp({ email, purpose: 'passwordReset' }));

        if (result?.success) {
          setInitialOtpError(null);
        } else {
          if (result?.status === 429 ||
            result?.message?.includes("Only one password reset attempt allowed per day")) {
            setInitialOtpError('daily_limit_exceeded');
          } else {
            toast.error(result?.message || 'Failed to send OTP');
            onBack();
          }
        }
      } catch (error) {
        toast.error('Failed to send OTP');
        onBack();
      } finally {
        setSendingInitialOtp(false);
        setStep(1);
      }
    };

    if (!initialOtpSent.current) {
      initialOtpSent.current = true;
      sendInitialOtp();
    }
  }, [email, dispatch, onBack]);

  useEffect(() => {
    if (newPassword.length === 0) {
      setPasswordStrength('');
      return;
    }

    let strength = 0;
    if (newPassword.length >= 8) strength++;
    if (/[A-Z]/.test(newPassword)) strength++;
    if (/[a-z]/.test(newPassword)) strength++;
    if (newPassword.length >= 12) strength++;

    setPasswordStrength(
      strength < 2 ? 'Weak' :
        strength < 4 ? 'Medium' : 'Strong'
    );
  }, [newPassword]);

  const showToast = (message, type = 'error') => {
    toast[type](message, {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
    });
  };

  const handleVerifyOtpSuccess = () => {
    setStep(2);
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      showToast("Passwords don't match");
      return;
    }
    if (newPassword.length < 8) {
      showToast("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    try {
      const result = await dispatch(updatePassword({ email, newPassword }));

      if (result?.success) {
        showToast("Password updated successfully! Redirecting to login...", 'success');
        setTimeout(() => onBack(), 2000);
      } else {
        showToast(result?.message || 'Password update failed');
      }
    } catch (error) {
      showToast('Password update failed');
    } finally {
      setLoading(false);
    }
  };

  const generateRandomPassword = () => {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';

    let password = '';
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];

    for (let i = 0; i < 10; i++) {
      const allChars = uppercase + lowercase;
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    password = password.split('').sort(() => 0.5 - Math.random()).join('');

    return password;
  };

  const handleGeneratePassword = () => {
    const newPass = generateRandomPassword();
    setNewPassword(newPass);
    setConfirmPassword(newPass);
    setPasswordStrength('Strong');
    showToast('Secure password generated!', 'success');
  };

  return (
    <div className="reset-password-container">
      <button onClick={onBack} className="go-back-btn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M15 6L9 12L15 18" stroke="#007ac6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Back to Login
      </button>

      {step === 0 && sendingInitialOtp && (
        <div className="otp-sending-overlay">
          <div className="spinner"></div>
          <p>Sending verification code...</p>
        </div>
      )}

      {step === 1 && (
        <OtpHandler
          email={email}
          purpose="passwordReset"
          onVerify={handleVerifyOtpSuccess}
          onClose={onBack}
          headerText="Verify Your Email"
          description="We've sent a 6-digit code to"
          buttonText="Verify OTP"
          initialError={initialOtpError}
          autoSend={false}
        />
      )}

      {step === 2 && (
        <form onSubmit={handleUpdatePassword} className="auth-form">
          <div className="password-header">
            <h2>Set New Password</h2>
            <p>Create a new password for your account</p>
          </div>

          <div className="password-generator-container">
            <button
              type="button"
              className="generate-password-btn"
              onClick={handleGeneratePassword}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z" />
              </svg>
              Generate Secure Password
            </button>
            <div className="password-tip">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z" />
              </svg>
              <span>Secure password containing uppercase and lowercase only</span>
            </div>
          </div>
          <div className="password-input-group">
            <label htmlFor="newPassword">
              New Password
              {passwordStrength && (
                <span className={`password-strength ${passwordStrength.toLowerCase()}`}>
                  Strength: {passwordStrength}
                </span>
              )}
            </label>
            <div className="password-input-container">
              <input
                type={showPassword ? "text" : "password"}
                id="newPassword"
                placeholder="At least 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
              />
              <button
                type="button"
                className="toggle-password-visibility"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7.028 7.028 0 0 0-2.79.588l.77.771A5.944 5.944 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.134 13.134 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755-.165.165-.337.328-.517.486l.708.709z" />
                    <path d="M11.297 9.176a3.5 3.5 0 0 0-4.474-4.474l.823.823a2.5 2.5 0 0 1 2.829 2.829l.822.822zm-2.943 1.299.822.822a3.5 3.5 0 0 1-4.474-4.474l.823.823a2.5 2.5 0 0 0 2.829 2.829z" />
                    <path d="M3.35 5.47c-.18.16-.353.322-.518.487A13.134 13.134 0 0 0 1.172 8l.195.288c.335.48.83 1.12 1.465 1.755C4.121 11.332 5.881 12.5 8 12.5c.716 0 1.39-.133 2.02-.36l.77.772A7.029 7.029 0 0 1 8 13.5C3 13.5 0 8 0 8s.939-1.721 2.641-3.238l.708.709zm10.296 8.884-12-12 .708-.708 12 12-.708.708z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z" />
                    <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="password-input-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className="password-input-container">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
              />
              <button
                type="button"
                className="toggle-password-visibility"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7.028 7.028 0 0 0-2.79.588l.77.771A5.944 5.944 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.134 13.134 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755-.165.165-.337.328-.517.486l.708.709z" />
                    <path d="M11.297 9.176a3.5 3.5 0 0 0-4.474-4.474l.823.823a2.5 2.5 0 0 1 2.829 2.829l.822.822zm-2.943 1.299.822.822a3.5 3.5 0 0 1-4.474-4.474l.823.823a2.5 2.5 0 0 0 2.829 2.829z" />
                    <path d="M3.35 5.47c-.18.16-.353.322-.518.487A13.134 13.134 0 0 0 1.172 8l.195.288c.335.48.83 1.12 1.465 1.755C4.121 11.332 5.881 12.5 8 12.5c.716 0 1.39-.133 2.02-.36l.77.772A7.029 7.029 0 0 1 8 13.5C3 13.5 0 8 0 8s.939-1.721 2.641-3.238l.708.709zm10.296 8.884-12-12 .708-.708 12 12-.708.708z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z" />
                    <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="auth-btn update-btn"
            disabled={loading}
          >
            {loading ? (
              <div className="spinner"></div>
            ) : (
              'Update Password'
            )}
          </button>
        </form>
      )}
    </div>
  );
};

export default ResetPassword;