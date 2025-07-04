import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import moment from 'moment';
import { useSelector } from 'react-redux';
import Avatar from '../../Components/Avatar/Avatar';
import Leftsidebar from '../../Components/Leftsidebar/Leftsidebar'
import EditProfileForm from './EditProfile';
import LocationSection from './LocationSection';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPen } from '@fortawesome/free-solid-svg-icons';
import './UserProfile.css';

const UserProfile = ({ slidein }) => {
  const { id } = useParams();
  const [Switch, setswitch] = useState(false);

  const users = useSelector((state) => state.usersreducer);
  const currentprofile = users.filter((user) => user._id === id)[0];
  const currentuser = useSelector((state) => state.currentuserreducer);
  
  const isCurrentUser = currentuser?.result?._id === id;

  if (!currentprofile) {
    return <div>User not found</div>;
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
                marginTop= "30px"
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
          <>
          {Switch ? (
            <EditProfileForm 
              currentuser={currentuser} 
              setswitch={setswitch} 
            />
          ) : (
            <div className="profile-content">
              <LocationSection isCurrentUser={isCurrentUser} />
            </div>
          )}
          </>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;