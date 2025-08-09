import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/"
});

API.interceptors.request.use((req) => {
  if (localStorage.getItem("Profile")) {
    req.headers.Authorization = `Bearer ${JSON.parse(localStorage.getItem("Profile")).token
      }`;
  }
  return req;
})

API.interceptors.response.use(
  response => response,
  error => Promise.reject(error)
);

export const getTimeInfo = () => API.get("/get-time");

export const login = (authdata) => API.post("user/login", authdata);
export const signup = (authdata) => API.post("user/signup", authdata);

export const sendOtp = (payload) => API.post("/auth/send-otp", payload);
export const verifyOtp = (payload) => API.post("/auth/verify-otp", payload);
export const verifyLoginOtp = (payload) => API.post("/auth/verify-login-otp", payload);
export const updatePassword = (payload) => API.post("/auth/update-password", payload);

export const getallusers = () => API.get("/user/getallusers");
export const getLoginHistory = (userId) => API.get(`/user/history/${userId}`);
export const updateprofile = (id, updatedata) => API.patch(`user/update/${id}`, updatedata)

export const postquestion = (formData, config) => API.post('/questions/Ask', formData, config);
export const getallquestions = () => API.get("/questions/get");
export const deletequestion = (id) => API.delete(`/questions/delete/${id}`);
export const votequestion = (id, value, userId) => API.patch(`/questions/vote/${id}`, { value, userId });
export const voteAnswer = (id, answerid, value, userId) => API.patch(`/answer/vote`, { id, answerid, value, userId });
export const transferPoints = (recipientId, amount) => API.post("/user/transfer", { recipientId, amount });
export const getTransactionHistory = () => API.get("/user/transactions");
export const postanswer = (id, noofanswers, answerbody, useranswered, userid) => API.patch(`/answer/post/${id}`, { noofanswers, answerbody, useranswered, userid });
export const deleteanswer = (id, answerid, userId) => API.patch(`/answer/delete/${id}`, { answerid, userId });