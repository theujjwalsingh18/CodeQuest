import * as api from "../api";
import { setcurrentuser } from "./currentuser";
import { updateUserStats } from './userStats';

export const askquestion = (questiondata, navigate, onUploadProgress) => async (dispatch, getState) => {
    try {
        const formData = new FormData();
        formData.append('questiontitle', questiondata.questiontitle);
        formData.append('questionbody', questiondata.questionbody);
        formData.append('questiontags', JSON.stringify(questiondata.questiontags));
        formData.append('userposted', questiondata.userposted);
        if (questiondata.video) {
            formData.append('video', questiondata.video);
        }

        const config = {
            headers: {
                'Content-Type': 'multipart/form-data',
                Authorization: `Bearer ${localStorage.getItem('token')}`
            },
            onUploadProgress: (progressEvent) => {
                if (onUploadProgress && progressEvent.lengthComputable) {
                    const percentCompleted = Math.round(
                        (progressEvent.loaded * 100) / progressEvent.total
                    );
                    onUploadProgress({
                        loaded: progressEvent.loaded,
                        total: progressEvent.total,
                        percent: percentCompleted
                    });
                }
            }
        };

        console.log("Sending question to /questions/Ask");
        const { data } = await api.postquestion(formData, config);

        dispatch({ type: "POST_QUESTION", payload: data });
        dispatch(fetchallquestion());

        const userId = getState().currentuserreducer?.result?._id;
        if (userId) {
            const currentCount = getState().currentuserreducer?.result?.questionCount || 0;
            dispatch(updateUserStats(userId, {
                questionCount: currentCount + 1
            }));
        }

        navigate("/");
        return data;
    } catch (error) {
        console.log(error);
        let errorMessage = "Failed to post question";

        if (error.response) {
            if (error.request) {
                errorMessage = 'No response from server. Please check your network connection or try again later.';
            } else if (error.code === 'ERR_NETWORK') {
                errorMessage = "Network connection error. Please check your internet.";
            } else if (error.code === 'ECONNABORTED') {
                errorMessage = 'Request timed out. Please try again.';
            } else if (error.response.status === 400) {
                errorMessage = error.response.data.message || "Invalid request";
            } else if (error.response.status === 403) {
                errorMessage = "Video uploads only allowed between 2 PM and 7 PM";
            } else {
                errorMessage = error.response.data || errorMessage;
            }
        }

        throw new Error(errorMessage);
    }
};


export const fetchallquestion = () => async (dispatch) => {
    try {
        const { data } = await api.getallquestions();
        dispatch({ type: "FETCH_ALL_QUESTIONS", payload: data });
    } catch (error) {
        console.log(error);
    }
};

export const deletequestion = (id, navigate) => async (dispatch, getState) => {
    try {
        const userid = getState().currentuserreducer?.result?._id;
        const { data } = await api.deletequestion(id, userid);

        dispatch(fetchallquestion());
        navigate("/");

        if (userid) {
            const currentCount = getState().currentuserreducer?.result?.questionCount || 0;
            dispatch(updateUserStats(userid, {
                questionCount: Math.max(0, currentCount - 1)
            }));
        }

        if (data && data.updatedUsers) {
            data.updatedUsers.forEach(user => {
                dispatch({
                    type: "UPDATE_USER",
                    payload: user
                });

                const currentProfile = JSON.parse(localStorage.getItem("Profile"));
                if (currentProfile && currentProfile.result && currentProfile.result._id === user._id) {
                    const updatedProfileResult = { ...currentProfile.result, ...user };
                    const updatedProfile = { ...currentProfile, result: updatedProfileResult };
                    localStorage.setItem("Profile", JSON.stringify(updatedProfile));

                    if (getState().currentuserreducer?.result?._id === user._id) {
                        dispatch(setcurrentuser(updatedProfile));
                    }
                }
            });
        }

    } catch (error) {
        console.log(error);
        if (error.response && error.response.data.message) {
            alert(`Error deleting question: ${error.response.data.message}`);
        } else {
            alert("Failed to delete question");
        }
    }
};


export const votequestion = (id, value) => async (dispatch, getState) => {
    try {
        const userid = getState().currentuserreducer?.result?._id;
        await api.votequestion(id, value, userid);
        dispatch(fetchallquestion());
    } catch (error) {
        console.log(error);
        if (error.response && error.response.data.message) {
            alert(error.response.data.message);
        } else {
            alert("Failed to vote on question");
        }
    }
};

export const voteAnswer = (id, answerid, value) => async (dispatch, getState) => {
    try {
        const userid = getState().currentuserreducer?.result?._id;
        const { data } = await api.voteAnswer(id, answerid, value, userid);

        dispatch(fetchallquestion());

        if (data && data.updatedUser) {
            const currentProfile = JSON.parse(localStorage.getItem("Profile"));

            if (currentProfile && currentProfile.result && currentProfile.result._id === data.updatedUser._id) {
                const updatedProfileResult = { ...currentProfile.result, points: data.updatedUser.points };
                const updatedProfile = { ...currentProfile, result: updatedProfileResult };
                localStorage.setItem("Profile", JSON.stringify(updatedProfile));
                dispatch(setcurrentuser(updatedProfile));
            }

            dispatch({
                type: "UPDATE_USER",
                payload: data.updatedUser
            });
        }

    } catch (error) {
        console.log(error);
        if (error.response && error.response.data.message) {
            alert(error.response.data.message);
        } else {
            alert("Failed to vote on answer");
        }
    }
};

export const postanswer = (answerdata) => async (dispatch, getState) => {
    try {
        const { id, noofanswers, answerbody, useranswered, userid } = answerdata;
        const { data } = await api.postanswer(id, noofanswers, answerbody, useranswered, userid);

        dispatch({ type: "POST_ANSWER", payload: data.question });
        dispatch(fetchallquestion());

        if (userid) {
            const currentCount = getState().currentuserreducer?.result?.answerCount || 0;
            dispatch(updateUserStats(userid, {
                answerCount: currentCount + 1
            }));
        }

        if (data && data.updatedUser) {
            const currentProfile = JSON.parse(localStorage.getItem("Profile"));

            if (currentProfile && currentProfile.result && currentProfile.result._id === data.updatedUser._id) {
                const updatedProfileResult = { ...currentProfile.result, points: data.updatedUser.points };
                const updatedProfile = { ...currentProfile, result: updatedProfileResult };
                localStorage.setItem("Profile", JSON.stringify(updatedProfile));
                dispatch(setcurrentuser(updatedProfile));
            }

            dispatch({
                type: "UPDATE_USER",
                payload: data.updatedUser
            });
        }

    } catch (error) {
        console.log(error);
        if (error.response && error.response.data.message) {
            alert(`Error posting answer: ${error.response.data.message}`);
        } else {
            alert("Failed to post answer");
        }
    }
};

export const deleteanswer = (id, answerid) => async (dispatch, getState) => {
    try {
        const userid = getState().currentuserreducer?.result?._id;

        const { data } = await api.deleteanswer(id, answerid, userid);

        dispatch(fetchallquestion());

        if (userid) {
            const currentCount = getState().currentuserreducer?.result?.answerCount || 0;
            dispatch(updateUserStats(userid, {
                answerCount: Math.max(0, currentCount - 1)
            }));
        }

        if (data && data.updatedUser) {
            const currentProfile = JSON.parse(localStorage.getItem("Profile"));

            if (currentProfile && currentProfile.result && currentProfile.result._id === data.updatedUser._id) {
                const updatedProfileResult = { ...currentProfile.result, points: data.updatedUser.points };
                const updatedProfile = { ...currentProfile, result: updatedProfileResult };
                localStorage.setItem("Profile", JSON.stringify(updatedProfile));
                dispatch(setcurrentuser(updatedProfile));
            }
            dispatch({
                type: "UPDATE_USER",
                payload: data.updatedUser
            });
        }
    } catch (error) {
        console.log(error);
        if (error.response && error.response.data.message) {
            alert(error.response.data.message);
        }
    }
};