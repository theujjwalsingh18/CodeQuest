import { React, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import "./Auth.css";
import icon from '../../assets/icon.png';
import Aboutauth from './Aboutauth';
import ResetPassword from './ResetPassword';
import { signup, login } from '../../Action/Auth';

const Auth = () => {
  const [authMode, setAuthMode] = useState('login');
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const showToast = (message, type = 'error') => {
    toast[type](message, {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      showToast("Please enter both email and password");
      return;
    }

    try {
      if (authMode === 'signup') {
        if (!name) {
          showToast("Please enter your name to continue");
          return;
        }
        const result = await dispatch(signup({ name, email, password }, navigate));
        if (!result?.success) {
          showToast(result?.message || "Signup failed");
        }
      } else {
        const result = await dispatch(login({ email, password }, navigate));
        
        if (!result?.success) {
          showToast(result?.message);
        }
      }
    } catch (error) {
      showToast("Something went wrong");
    }
  };

  const handleSwitch = () => {
    setAuthMode(authMode === 'login' ? 'signup' : 'login');
    setName("");
    setEmail("");
    setPassword("");
  };

  const handleForgotPassword = async () => {
    if (!email) {
      showToast("Please enter your email first");
      return;
    }
    
    setAuthMode('reset');
  };

  return (
    <section className="auth-section">
      <ToastContainer />

      {authMode === 'signup' && <Aboutauth />}
      <div className="auth-container-2">
        {authMode === 'reset' ? (
          <ResetPassword
            email={email}
            onBack={() => setAuthMode('login')}
          />
        ) : (
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
                  />
                </label>
              )}

              <label htmlFor="email">
                <h4>Email</h4>
                <input
                  type="email"
                  id='email'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>

              <button type='submit' className='auth-btn'>
                {authMode === 'signup' ? "Sign up" : "Log in"}
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
              >
                {authMode === 'signup' ? "Log in" : "Sign up"}
              </button>
            </p>
          </>
        )}
      </div>
    </section>
  );
};

export default Auth;