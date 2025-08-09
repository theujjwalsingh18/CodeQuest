const currentuserreducer = (state = null, action) => {
    switch (action.type) {
        case "FETCH_CURRENT_USER":
            return action.payload;
        case "UPDATE_CURRENT_USER":
            const newCurrentUserState = {
                ...state,
                result: {
                    ...state.result,
                    ...action.payload
                }
            };
            return newCurrentUserState;
        case "UPDATE_USER":
            if (state?.result?._id === action.payload._id) {
                const updatedStateForCurrentUserViaUpdateUser = {
                    ...state,
                    result: {
                        ...state.result,
                        ...action.payload
                    }
                };
                return updatedStateForCurrentUserViaUpdateUser;
            }
            return state;
        case "UPDATE_USER_STATS":
            if (state?.result?._id === action.payload.userId) {
                return {
                    ...state,
                    result: {
                        ...state.result,
                        ...action.payload.stats
                    }
                };
            }
            return state;
        case "LOGOUT":
            console.log("LOGOUT - Clearing state.");
            return null;
        default:
            return state;
    }
};
export default currentuserreducer;