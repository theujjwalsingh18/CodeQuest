import React from 'react'
import './Leftsidebar.css'
import { NavLink } from 'react-router-dom'

const LeftSideBar = ({ slidein, handleslidein }) => {
  const slideinstyle = {
    transform: "translateX(0%)",
  };
  
  const slideoutstyle = {
    transform: "translateX(-100%)",
  }
  
  const handleNavClick = () => {
    if (window.innerWidth <= 768 && typeof handleslidein === 'function') {
      handleslidein(true);
    }
  }
  
  return (
    <div className="left-sidebar" style={slidein ? slideinstyle : slideoutstyle}>
      <nav className='side-nav'>
        <div className="nav-btnn" onClick={handleNavClick}>
          <NavLink to='/' className="side-nav-links" activeclassname='active'>
            <svg className="svg-icon iconHome" aria-hidden="true" width="18" heigh="18" viewBox='0 0 18 18'>
              <path d="M15 10v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5H0l9-9 9 9zm-8 1v6h4v-6z"></path>
            </svg>
            <p style={{ paddingLeft: '10px' }}>Home</p>
          </NavLink>
        </div>
        <div className="side-nav-div">
          <div>
            <p style={{ justifyContent: "center" }}>PUBLIC</p>
          </div>
          <div className='nav-btnn' onClick={handleNavClick}>
            <NavLink to='/Question' className='side-nav-links' activeclassname='active'>
              <svg className="svg-icon iconQuestion" aria-hidden="true" width="18" heigh="18" viewBox='0 0 18 18'>
                <path d="m4 15-3 3V4c0-1.1.9-2 2-2h12c1.09 0 2 .91 2 2v9c0 1.09-.91 2-2 2zm7.75-3.97c.72-.83.98-1.86.98-2.94 0-1.65-.7-3.22-2.3-3.83a4.4 4.4 0 0 0-3.02 0 3.8 3.8 0 0 0-2.32 3.83q0 1.93 1.03 3a3.8 3.8 0 0 0 2.85 1.07q.94 0 1.71-.34.97.66 1.06.7.34.2.7.3l.59-1.13a5 5 0 0 1-1.28-.66m-1.27-.9a5 5 0 0 0-1.5-.8l-.45.9q.5.18.98.5-.3.1-.65.11-.92 0-1.52-.68c-.86-1-.86-3.12 0-4.11.8-.9 2.35-.9 3.15 0 .9 1.01.86 3.03-.01 4.08"></path>
              </svg>
              <p style={{ paddingLeft: '10px' }}>Questions</p>
            </NavLink>
          </div>
          <div className='nav-btnn' onClick={handleNavClick}>
            <NavLink to='/Tags' className='side-nav-links' activeclassname='active' style={{ paddingLeft: "0px 10px" }}>
              <svg className="svg-icon iconTags" aria-hidden="true" width="18" heigh="18" viewBox='0 0 18 18'>
                <path d="M9.83 3a2 2 0 0 0-1.42.59l-6 6a2 2 0 0 0 0 2.82L6.6 16.6a2 2 0 0 0 2.82 0l6-6A2 2 0 0 0 16 9.17V5a2 2 0 0 0-2-2zM12 9a2 2 0 1 1 0-4 2 2 0 0 1 0 4"></path>
              </svg>
              <p style={{ paddingLeft: '10px' }} >Tags</p>
            </NavLink>
          </div>
          <div className='nav-btnn' onClick={handleNavClick}>
            <NavLink to='/Users' className='side-nav-links' activeclassname='active' style={{ paddingLeft: "0px 20px" }}>
              <svg className="svg-icon iconUsers" aria-hidden="true" width="18" heigh="18" viewBox='0 0 18 18'>
                <path d="M17 14c0 .44-.45 1-1 1H9a1 1 0 0 1-1-1H2c-.54 0-1-.56-1-1 0-2.63 3-4 3-4s.23-.4 0-1c-.84-.62-1.06-.59-1-3s1.37-3 2.5-3 2.44.58 2.5 3-.16 2.38-1 3c-.23.59 0 1 0 1s1.55.71 2.42 2.09c.78-.72 1.58-1.1 1.58-1.1s.23-.4 0-1c-.84-.61-1.06-.58-1-3s1.37-3 2.5-3 2.44.59 2.5 3c.05 2.42-.16 2.39-1 3-.23.6 0 1 0 1s3 1.38 3 4"></path>
              </svg>
              <p style={{ paddingLeft: '10px' }}>Users</p>
            </NavLink>
          </div>
        </div>
      </nav>
    </div>
  )
}

export default LeftSideBar