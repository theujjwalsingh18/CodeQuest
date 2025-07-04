import * as api from "../api"

export const askquestion = (questiondata, navigate, onUploadProgress) => async (dispatch) => {
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
        const { data } = await api.postquestion(formData);
        
        dispatch({ type: "POST_QUESTION", payload: data });
        dispatch(fetchallquestion());
        navigate("/");
        return data;
    } catch (error) {
        console.log(error);
        let errorMessage = "Failed to post question";
        
        if (error.response) {
            if (error.response.status === 403) {
                errorMessage = "Video uploads only allowed between 2 PM and 7 PM";
            } else if (error.response.status === 400) {
                errorMessage = error.response.data.message || "Invalid request";
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
        dispatch({ type: "FETCH_ALL_QUESTIONS", payload: data })
    } catch (error) {
        console.log(error)
    }
}

export const deletequestion = (id, navigate) => async (dispatch) => {
    try {
        await api.deletequestion(id);
        dispatch(fetchallquestion());
        navigate("/")
    } catch (error) {
        console.log(error)
    }
}

export const votequestion = (id, value) => async (dispatch) => {
    try {
        await api.votequestion(id, value);
        dispatch(fetchallquestion())
    } catch (error) {
        console.log(error)
    }
}

export const postanswer = (answerdata) => async (dispatch) => {
    try {
        const {id, noofanswers, answerbody, useranswered, userid} = answerdata;
        const {data} = await api.postanswer(id, noofanswers, answerbody, useranswered, userid);
        dispatch({type: "POST_ANSWER", payload: data});
        dispatch(fetchallquestion())
    } catch (error) {
        console.log(error)
    }
}

export const deleteanswer = (id, answerid, noofanswers) => async (dispatch) => {
    try {
        await api.deleteanswer(id, answerid, noofanswers);
        dispatch(fetchallquestion())
    } catch (error) {
        console.log(error)
    }
};