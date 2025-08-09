import * as api from "../api";

export const fetchallusers = () => async (dispatch) => {
  try {
    const { data } = await api.getallusers();
    dispatch({ type: "FETCH_USERS", payload: data });
  } catch (error) {
    console.log(error);
  }
};

export const updateprofile = (id, updatedata) => async (dispatch) => {
  try {
    const { data } = await api.updateprofile(id, updatedata);

    dispatch({ type: "UPDATE_CURRENT_USER", payload: data });

    const currentProfile = JSON.parse(localStorage.getItem("Profile"));

    if (currentProfile && currentProfile.result && currentProfile.result._id === data._id) {
      const updatedProfile = { ...currentProfile, result: data };
      localStorage.setItem("Profile", JSON.stringify(updatedProfile));
    }

  } catch (error) {
    console.log(error);
    if (error.response && error.response.data.message) {
      alert(`Error updating profile: ${error.response.data.message}`);
    } else {
      alert("Failed to update profile");
    }
  }
};

const usersReducer = (state = [], action) => {
  switch (action.type) {
    case "FETCH_USERS":
      return action.payload;
    case "UPDATE_CURRENT_USER":
      return state.map(user => 
        user._id === action.payload._id ? action.payload : user
      );
    case "UPDATE_USER":
      return state.map(user => 
        user._id === action.payload._id ? {...user, ...action.payload} : user
      );
    default:
      return state;
  }
};

export default usersReducer;