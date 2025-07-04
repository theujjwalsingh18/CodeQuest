import React from 'react'
import icon from '../../assets/logo.png'
import "./Auth.css"

const Aboutauth = () => {
  return (
    <div className="auth-container-1">
      <img src={icon} alt="icon" className='login-logo' />
      <h1>Join the Stackify community</h1>
      <p>Get unstuck — ask a question</p>
      <p>Unlock new privileges like voting and commenting</p>
      <p>Save your favorite tags, filters, and jobs</p>
      <p>Earn reputation and badges</p>
      <p style={{ fontSize: "13px", color: "#666767" }}>
        Collaborate and share knowledge with a private group for
      </p>
      <p style={{ fontSize: "13px", color: "#007ac6" }}>
        Get Stack Overflow for Teams free for up to 50 users.
      </p>
    </div>
  )
}

export default Aboutauth;