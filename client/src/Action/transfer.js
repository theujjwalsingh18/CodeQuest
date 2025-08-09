import * as api from "../api";
import { setcurrentuser } from "./currentuser";

export const transferPoints = (transferData) => async (dispatch) => {
    try {
        const { data } = await api.transferPoints(
            transferData.recipientId,
            transferData.amount
        );

        if (data.success) {
            const currentProfile = JSON.parse(localStorage.getItem("Profile"));

            if (currentProfile && currentProfile.result && currentProfile.result._id === data.updatedSender._id) {
                const updatedProfileResult = { ...currentProfile.result, points: data.updatedSender.points };
                const updatedProfile = { ...currentProfile, result: updatedProfileResult };
                localStorage.setItem("Profile", JSON.stringify(updatedProfile));
                dispatch(setcurrentuser(updatedProfile));
            }

            dispatch({
                type: "UPDATE_USER",
                payload: data.updatedSender
            });

            dispatch({
                type: "UPDATE_USER",
                payload: data.updatedRecipient
            });

            return { success: true, message: data.message };
        }
        return { success: false, message: data.message };
    } catch (error) {
        return {
            success: false,
            message: error.response?.data?.message || 'Transfer failed'
        };
    }
};

export const fetchTransactions = () => async (dispatch) => {
    try {
        const { data } = await api.getTransactionHistory();
        dispatch({ type: "FETCH_TRANSACTIONS", payload: data });
        return { success: true, data: data };
    } catch (error) {
        return { success: false, message: error.response?.data?.message || 'Failed to fetch transactions' };
    }
};