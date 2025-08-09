const usersreducer = (states = [], action) => {
    switch (action.type) {
        case "FETCH_USERS":
            return action.payload;
        case "UPDATE_CURRENT_USER":
        case "UPDATE_USER":
            let userFoundAndUpdated = false;
            const updatedUsersArray = states.map((user) => {
                if (user._id === action.payload._id) {
                    userFoundAndUpdated = true;
                    const updatedUser = { ...user, ...action.payload };
                    return updatedUser;
                }
                return user;
            });
            if (!userFoundAndUpdated) {
                console.warn(`USERS_REDUCER: User with ID ${action.payload._id} not found in current state.`);
            }
            return updatedUsersArray;
        case "UPDATE_USER_STATS":
            return states.map(user => 
                user._id === action.payload.userId
                    ? { ...user, ...action.payload.stats }
                    : user
            );
        default:
            return states;
    }
};
export default usersreducer;