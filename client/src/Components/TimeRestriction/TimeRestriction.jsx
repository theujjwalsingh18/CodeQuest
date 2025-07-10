import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { isMobile } from 'react-device-detect';
import './TimeRestriction.css';

const TimeRestriction = ({ children }) => {
  const [showRestriction, setShowRestriction] = useState(false);
  const [countdown, setCountdown] = useState('');
  const [timezone, setTimezone] = useState('Local Time');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const calculateCountdown = (now) => {
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const currentMinutes = hours * 60 + minutes;
      
      const startMinutes = 10 * 60; // 10:00 AM
      const endMinutes = 13 * 60;   // 1:00 PM
      
      let targetTime;
      
      if (currentMinutes < startMinutes) {
        targetTime = new Date(now);
        targetTime.setHours(10, 0, 0, 0);
      } else if (currentMinutes >= endMinutes) {
        targetTime = new Date(now);
        targetTime.setDate(targetTime.getDate() + 1);
        targetTime.setHours(10, 0, 0, 0);
      }
      
      if (targetTime) {
        const diff = targetTime - now;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      }
      
      return '';
    };

    const checkAccess = () => {
      const apiRestricted = localStorage.getItem('mobileRestricted') === 'true';
      
      if (isMobile || apiRestricted) {
        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const currentMinutes = hours * 60 + minutes;
        
        const startMinutes = 10 * 60;
        const endMinutes = 13 * 60;
        
        const shouldRestrict = currentMinutes < startMinutes || currentMinutes >= endMinutes;
        setShowRestriction(shouldRestrict || apiRestricted);
        
        if ((shouldRestrict || apiRestricted) && location.pathname !== '/') {
          navigate('/', { replace: true });
        }
        const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (detectedTimezone) {
          setTimezone(detectedTimezone.split('/').pop().replace(/_/g, ' '));
        }
        
        setCountdown(calculateCountdown(now));
      } else {
        setShowRestriction(false);
      }
    };

    checkAccess();
    const interval = setInterval(checkAccess, 1000);
    
    return () => clearInterval(interval);
  }, [navigate, location]);

  useEffect(() => {
    if (!showRestriction) {
      localStorage.removeItem('mobileRestricted');
    }
  }, [showRestriction]);

  if (showRestriction) {
    const now = new Date();
    const localTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    return (
      <div className="time-restriction-container">
        <div className="time-restriction-card">
          <div className="bg-circle top-right"></div>
          <div className="bg-circle bottom-left"></div>
          <div className="time-restriction-content">
            <div className="icon-container">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            
            <h2 className="title">Access Restricted</h2>
            <p className="subtitle">
              Mobile access is limited to specific hours in your local time
            </p>
            
            <div className="info-box">
              <div className="info-row">
                <span className="info-label">Allowed Hours:</span>
                <span className="info-value">10:00 AM - 1:00 PM</span>
              </div>
              
              <div className="info-row">
                <span className="info-label">Your Timezone:</span>
                <span className="info-value">{timezone}</span>
              </div>
              
              <div className="info-row">
                <span className="info-label">Current Time:</span>
                <span className="info-value">{localTime}</span>
              </div>
            </div>
            
            {countdown && (
              <div className="countdown-section">
                <p className="countdown-label">Access will be available in:</p>
                <div className="countdown-timer">
                  {countdown.split(':').map((unit, index) => (
                    <div key={index} className="countdown-unit">
                      <div className="countdown-number">{unit}</div>
                      <span className="countdown-label-unit">
                        {['Hours', 'Minutes', 'Seconds'][index]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <p className="note">
              Please use a desktop computer for full access outside these hours
            </p>
            
            <button 
              className="refresh-button"
              onClick={() => window.location.reload()}
            >
              Check Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

export default TimeRestriction;