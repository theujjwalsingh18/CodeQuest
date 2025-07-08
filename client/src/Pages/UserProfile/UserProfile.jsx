import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import moment from 'moment';
import { useSelector, useDispatch } from 'react-redux';
import Avatar from '../../Components/Avatar/Avatar';
import Leftsidebar from '../../Components/Leftsidebar/Leftsidebar';
import EditProfileForm from './EditProfile';
import LocationSection from './LocationSection';
import LoginHistory from './LoginHistory';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPen } from '@fortawesome/free-solid-svg-icons';
import './UserProfile.css';
import { getLoginHistory } from '../../Action/Auth';

const UserProfile = ({ slidein }) => {
  const { id } = useParams();
  const [Switch, setswitch] = useState(false);
  const [loginHistory, setLoginHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [error, setError] = useState(null);
  const dispatch = useDispatch();

  const users = useSelector((state) => state.usersreducer);
  const currentprofile = users.filter((user) => user._id === id)[0];
  const currentuser = useSelector((state) => state.currentuserreducer);

  const isCurrentUser = currentuser?.result?._id === id;

  useEffect(() => {
    let isMounted = true;

    if (isCurrentUser && id) {
      const fetchHistory = async () => {
        try {
          setLoadingHistory(true);
          const result = await dispatch(getLoginHistory(id));

          if (isMounted) {
            if (result?.success) {
              setLoginHistory(result.data);
            } else {
              setError(result?.message || 'Failed to load login history');
            }
          }
        } catch (err) {
          if (isMounted) setError('Error fetching login history');
        } finally {
          if (isMounted) setLoadingHistory(false);
        }
      };

      fetchHistory();
    }

    return () => { isMounted = false };
  }, [id, isCurrentUser, dispatch]);

  if (!currentprofile) {
    return <div className="user-not-found">User not found</div>;
  }

  return (
    <div className="home-container-1">
      <Leftsidebar slidein={slidein} />
      <div className="home-container-2">
        <div className="profile-container">
          <div className="profile-header">
            <div className="avatar">
              <Avatar
                backgroundColor="purple"
                color="white"
                fontSize="50px"
                px="40px"
                py="30px"
                borderRadius="50%"
                marginTop="30px"
              >
                {currentprofile.name.charAt(0).toUpperCase()}
              </Avatar>
            </div>

            <div className="profile-info">
              <h1>{currentprofile.name}</h1>
              <div className="joined-date">
                <i className="fas fa-calendar-alt"></i>
                <span>Joined{" "} {moment(currentprofile?.joinedon).fromNow()}</span>
              </div>

              <div className="tags">
                {currentprofile.tags?.map((tag, index) => (
                  <div key={index} className="tag">{tag}</div>
                ))}
              </div>

              <div className="bio">
                {currentprofile.about || "No bio available"}
              </div>
            </div>

            {isCurrentUser && (
              <button
                className="edit-profile-btn"
                type='button'
                onClick={() => setswitch(true)}
              >
                <FontAwesomeIcon icon={faPen} /> Edit Profile
              </button>
            )}
          </div>

          {Switch ? (
            <EditProfileForm
              currentuser={currentuser}
              setswitch={setswitch}
            />
          ) : (
            <div className="profile-content">
              <LocationSection isCurrentUser={isCurrentUser} />
              {isCurrentUser && (
                <LoginHistory
                  loginHistory={loginHistory}
                  loadingHistory={loadingHistory}
                  error={error}
                  onRetry={() => window.location.reload()}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;