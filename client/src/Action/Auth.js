import * as api from '../api';
import { setcurrentuser } from './currentuser';
import { fetchallusers } from './users';
export const signup = (authdata, naviagte) => async (dispatch) => {
  try {
    const { data } = await api.signup(authdata);
    dispatch({ type: "AUTH", data })
    dispatch(setcurrentuser(JSON.parse(localStorage.getItem("Profile"))));
    dispatch(fetchallusers())
    naviagte("/")
  } catch (error) {
    console.log(error)
  }
}
export const login = (authdata, naviagte) => async (dispatch) => {
  try {
    const { data } = await api.login(authdata);
    dispatch({ type: "AUTH", data })
    dispatch(setcurrentuser(JSON.parse(localStorage.getItem("Profile"))));
    naviagte("/")
  } catch (error) {
    alert(`Invalid login credentials.\nError : ${error.code}`)
    console.log(error.message)
  }
}

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