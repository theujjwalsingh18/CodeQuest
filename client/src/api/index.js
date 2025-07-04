import axios from "axios";

const API=axios.create({
    // baseURL: "http://localhost:5000/"
    baseURL: "https://stackify-ic2p.onrender.com"
});

API.interceptors.request.use((req)=>{
    if(localStorage.getItem("Profile")){
        req.headers.Authorization=`Bearer ${
            JSON.parse(localStorage.getItem("Profile")).token
        }`;
    }
    return req;
})


export const login=(authdata)=>API.post("user/login",authdata);
export const signup = (authdata) => API.post("user/signup", authdata);

export const sendOtp = (payload) => API.post("/auth/send-otp", payload);
export const verifyOtp = (payload) => API.post("/auth/verify-otp", payload);
export const updatePassword = (payload) => API.post("/auth/update-password", payload);

export const getallusers=()=> API.get("/user/getallusers");
export const updateprofile=(id,updatedata)=>API.patch(`user/update/${id}`,updatedata)


// export const postquestion=(questiondata)=>API.post("/questions/Ask",questiondata);
export const postquestion = (formData) => API.post('/questions/Ask', formData, {
    headers: {
        'Content-Type': 'multipart/form-data'
    }
});
export const getallquestions=()=>API.get("/questions/get");
export const deletequestion=(id)=>API.delete(`/questions/delete/${id}`);
export const votequestion=(id,value)=>API.patch(`/questions/vote/${id}`,{value});


export const postanswer=(id,noofanswers,answerbody,useranswered,userid)=>API.patch(`/answer/post/${id}`,{noofanswers,answerbody,useranswered,userid});
export const deleteanswer=(id,answerid,noofanswers)=>API.patch(`/answer/delete/${id}`,{answerid,noofanswers});