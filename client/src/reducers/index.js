import {combineReducers} from "redux"
import authreducer from "./auth"
import currentuserreducer from "./currentuserreducer";
import usersreducer from "./users";
import questionreducer from "./questionreducer";

export default combineReducers({
    authreducer,
    currentuserreducer,
    usersreducer,
    questionreducer,
});