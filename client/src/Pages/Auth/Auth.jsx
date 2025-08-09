import { React, useState, useRef, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import useToast from '../../hooks/useToast';
import "./Auth.css";
import icon from '../../assets/icon.png';
import Aboutauth from './Aboutauth';
import ResetPassword from './ResetPassword';
import OtpHandler from '../../Components/OtpHandler/OtpHandler';
import { signup, login, verifyLoginOtp } from '../../Action/Auth';

const Auth = () => {
  const { successToast, errorToast, warningToast } = useToast();
  const [authMode, setAuthMode] = useState('login');
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showOtp, setShowOtp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const emailInputRef = useRef(null);

  useEffect(() => {
    if (authMode === 'reset' && emailInputRef.current) {
      setTimeout(() => {
        emailInputRef.current.focus();
      }, 100);
    }
  }, [authMode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (authMode === 'signup') {
        if (!name || !email || !password) {
          warningToast("Please fill all fields");
          setIsLoading(false);
          return;
        }

        const result = await dispatch(signup({ name, email, password }, navigate));
        if (!result?.success) {
          errorToast(result?.message || "Signup failed");
        } else {
          successToast("Signup successful!");
        }
      } else {
        const result = await dispatch(login({ email, password }, navigate));

        if (result?.otpRequired) {
          setShowOtp(true);
        } else if (!result?.success) {
          errorToast(result?.message || "Login failed");
        } else {
          successToast("Login successful!");
        }
      }
    } catch (error) {
      console.error("Authentication error:", error);
      errorToast("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyLoginOtp = async (otp) => {
    setIsLoading(true);
    try {
      const result = await dispatch(verifyLoginOtp({ email, otp }, navigate));
      if (!result?.success) {
        errorToast(result?.message || "OTP verification failed");
        return false;
      }
      successToast("OTP verified successfully!");
      return true;
    } catch (error) {
      console.error("OTP verification error:", error);
      errorToast("Something went wrong during verification. Please try again.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwitch = () => {
    setAuthMode(authMode === 'login' ? 'signup' : 'login');
    setShowOtp(false);
    setName("");
    setEmail("");
    setPassword("");
    setShowPassword(false);
  };

  const handleForgotPassword = async () => {
    if (!email) {
      warningToast("Please enter your email first");
      if (emailInputRef.current) {
        setTimeout(() => {
          emailInputRef.current.focus();
        }, 100);
      }
      return;
    }

    setAuthMode('reset');
  };

  const renderAuthForm = () => (
    <>
      {authMode === 'login' && (
        <img src={icon} alt="icon" className='login-logo' />
      )}

      <form onSubmit={handleSubmit}>
        {authMode === 'signup' && (
          <label htmlFor="name">
            <div className="signup-heading">
              <h1>Create your account</h1>
              <p>By clicking "Sign up", you agree to our terms of service and acknowledge you have read our privacy policy.</p>
            </div>
            <h4>Display Name</h4>
            <input
              type="text"
              id='name'
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
            />
          </label>
        )}

        <label htmlFor="email">
          <h4>Email</h4>
          <input
            type="email"
            id='email'
            ref={emailInputRef}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
          />
        </label>

        <label htmlFor="password">
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <h4>Password</h4>
            {authMode === 'login' && (
              <p
                className="forgot-password-btn"
                onClick={handleForgotPassword}
              >
                Forgot Password?
              </p>
            )}
          </div>
          <div className="password-container">
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
            <button
              type="button"
              className="toggle-password-visibility"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoading}
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
        </label>

        <button
          type='submit'
          className='auth-btn'
          disabled={isLoading || !email || !password || (authMode === 'signup' && !name)}
        >
          {isLoading
            ? 'Processing...'
            : authMode === 'signup'
              ? "Sign up"
              : "Log in"
          }
        </button>
      </form>

      <p>
        {authMode === 'signup'
          ? "Already have an account?"
          : "Don't have an account?"}

        <button
          type='button'
          className='handle-switch-btn'
          onClick={handleSwitch}
          disabled={isLoading}
        >
          {authMode === 'signup' ? "Log in" : "Sign up"}
        </button>
      </p>
    </>
  );

  return (
    <section className="auth-section">
      {authMode === 'signup' && !showOtp && <Aboutauth />}

      <div className="auth-container-2">
        {authMode === 'reset' ? (
          <ResetPassword
            email={email}
            onBack={() => setAuthMode('login')}
          />
        ) : showOtp ? (
          <OtpHandler
            email={email}
            purpose="browserVerification"
            onVerify={handleVerifyLoginOtp}
            onClose={() => setShowOtp(false)}
            headerText="Verify Your Login"
            description="For security, we've sent a 6-digit code to"
            buttonText="Verify & Login"
            autoSend={false}
          />
        ) : (
          renderAuthForm()
        )}
      </div>
    </section>
  );
};

export default Auth;