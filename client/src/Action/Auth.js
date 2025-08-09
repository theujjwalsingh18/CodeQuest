import * as api from '../api';
import { setcurrentuser } from './currentuser';
import { fetchallusers } from './users';

export const signup = (authdata, navigate) => async (dispatch) => {
  try {
    const { data } = await api.signup(authdata);
    dispatch({ type: "AUTH", data });
    dispatch(setcurrentuser(JSON.parse(localStorage.getItem("Profile"))));
    dispatch(fetchallusers());
    navigate("/");
    return { success: true, message: "Account created successfully!" };
  } catch (error) {
    console.log(error);
    return { success: false, message: error.response?.data?.message || 'Signup failed' };
  }
};

export const login = (authdata, navigate) => async (dispatch) => {
  try {
    const { data } = await api.login(authdata);

    if (data.otpRequired) {
      return {
        otpRequired: true,
        email: authdata.email,
        message: data.message || 'OTP sent to your email'
      };
    }

    dispatch({ type: "AUTH", data });
    dispatch(setcurrentuser(JSON.parse(localStorage.getItem("Profile"))));
    navigate("/");
    return { success: true };
  } catch (error) {
    const errorMessage = error.response?.data?.message || 'Invalid login credentials';
    // alert(`Login failed: ${errorMessage}`);
    console.log(error);
    return { success: false, message: errorMessage };
  }
};

export const verifyLoginOtp = (otpData, navigate) => async (dispatch) => {
  try {
    const { email, otp } = otpData;
    const { data } = await api.verifyLoginOtp({ email, otp });

    dispatch({ type: "AUTH", data });
    dispatch(setcurrentuser(JSON.parse(localStorage.getItem("Profile"))));
    navigate("/");
    return { success: true };
  } catch (error) {
    const errorMessage = error.response?.data?.message || 'OTP verification failed';
    // alert(`Verification failed: ${errorMessage}`);
    console.error("OTP verification error:", error);
    return { success: false, message: errorMessage };
  }
};

export const sendOtp = (payload) => async (dispatch) => {
  try {
    const { email, purpose = 'passwordReset' } = payload;
    const { data } = await api.sendOtp({ email, purpose });
    return {
      success: true,
      data,
      message: data.message || 'OTP sent successfully'
    };
  } catch (error) {
    const errorMessage = error.response?.data?.message || 'Failed to send OTP';
    return { success: false, message: errorMessage };
  }
};

export const verifyOtp = (payload) => async (dispatch) => {
  try {
    const { email, otp, purpose = 'passwordReset' } = payload;
    const result = await api.verifyOtp({ email, otp, purpose });
    return {
      success: true,
      message: result.data?.message || 'OTP verified successfully'
    };
  } catch (error) {
    console.error("OTP verification error:", error);
    return {
      success: false,
      message: error.response?.data?.message || 'OTP verification failed'
    };
  }
};

export const updatePassword = (payload) => async (dispatch) => {
  try {
    const { data } = await api.updatePassword(payload);
    return {
      success: true,
      message: data.message || 'Password updated successfully'
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || 'Password update failed'
    };
  }
};

export const getLoginHistory = (userId) => async (dispatch) => {
  try {
    const { data } = await api.getLoginHistory(userId);
    return { success: true, data };
  } catch (error) {
    const errorMessage = error.response?.data?.message || 'Failed to fetch login history';
    return { success: false, message: errorMessage };
  }
};