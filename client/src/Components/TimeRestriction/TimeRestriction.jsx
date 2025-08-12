import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getTimeInfo } from '../../api';
import './TimeRestriction.css';

const TimeRestriction = ({ children }) => {
  const [serverRestricted, setServerRestricted] = useState(false);
  const [countdown, setCountdown] = useState('--:--:--');
  const [displayCurrentTime, setDisplayCurrentTime] = useState('--:--:--');
  const [timeInfo, setTimeInfo] = useState({
    timezone: 'Loading...',
    location: 'Loading...',
  });

  const navigate = useNavigate();
  const location = useLocation();
  const initialBackendSecondsRef = useRef(null);
  const initialClientTimeRef = useRef(null);

  const formatToAMPM = (timeStr) => {
    if (timeStr === '--:--:--') return '--:--:--';

    const [hours, minutes, seconds] = timeStr.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const adjustedHours = hours % 12 || 12;

    return `${adjustedHours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')} ${period}`;
  };

  const fetchTimeInfo = async () => {
    try {
      const { data } = await getTimeInfo();

      setTimeInfo({
        timezone: data.timezone || 'Unknown',
        location: data.location || 'Unknown location',
      });

      setServerRestricted(data.isRestricted);

      if (data.isRestricted && location.pathname !== '/') {
        navigate('/', { replace: true });
      }

      if (data.currentTime) {
        const [hours, minutes, seconds] = data.currentTime.split(':').map(Number);
        initialBackendSecondsRef.current = hours * 3600 + minutes * 60 + seconds;
        initialClientTimeRef.current = Date.now();

        const times = calculateTimes();
        setDisplayCurrentTime(times.currentTime);
        setCountdown(times.countdown);
      }
    } catch (error) {
      console.error('Failed to fetch time info:', error);
    }
  };

  const calculateTimes = () => {
    if (
      initialBackendSecondsRef.current === null ||
      initialClientTimeRef.current === null
    ) {
      return {
        currentTime: '--:--:--',
        countdown: '--:--:--',
        message: 'Calculating...',
      };
    }

    const now = Date.now();
    const elapsedSeconds = Math.floor(
      (now - initialClientTimeRef.current) / 1000
    );
    let currentSeconds =
      (initialBackendSecondsRef.current + elapsedSeconds) % 86400;

    if (currentSeconds < 0) currentSeconds += 86400;
    const hours = Math.floor(currentSeconds / 3600);
    const minutes = Math.floor((currentSeconds % 3600) / 60);
    const seconds = Math.floor(currentSeconds % 60);
    const currentTimeStr = `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    const startSeconds = 10 * 3600; // 10:00 AM
    const endSeconds = 13 * 3600; // 1:00 PM
    let targetSeconds;
    let message = 'Access will be available in:';

    if (currentSeconds < startSeconds) {
      targetSeconds = startSeconds;
    } else if (currentSeconds >= endSeconds) {
      targetSeconds = startSeconds + 86400;
      message = 'Access will resume tomorrow in:';
    } else {
      targetSeconds = endSeconds;
      message = 'Access ending in:';
    }

    let diffSeconds = targetSeconds - currentSeconds;
    if (diffSeconds < 0) diffSeconds = 0;

    const hrs = Math.floor(diffSeconds / 3600);
    const mins = Math.floor((diffSeconds % 3600) / 60);
    const secs = Math.floor(diffSeconds % 60);
    const countdownStr = `${hrs.toString().padStart(2, '0')}:${mins
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

    return {
      currentTime: currentTimeStr,
      countdown: countdownStr,
      message,
    };
  };

  useEffect(() => {
    fetchTimeInfo();
    const interval = setInterval(fetchTimeInfo, 10000);
    return () => clearInterval(interval);
  }, [navigate, location]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (
        initialBackendSecondsRef.current === null ||
        initialClientTimeRef.current === null
      ) {
        return;
      }

      const times = calculateTimes();
      setDisplayCurrentTime(times.currentTime);
      setCountdown(times.countdown);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (serverRestricted) {
    const displayTimezone = timeInfo.timezone
      ? timeInfo.timezone.split('/').pop().replace(/_/g, ' ')
      : 'Unknown';

    const displayTimeAMPM = formatToAMPM(displayCurrentTime);
    const { message } = calculateTimes();

    return (
      <div className="time-restriction-container">
        <div className="time-restriction-card">
          <div className="bg-circle top-right"></div>
          <div className="bg-circle bottom-left"></div>
          <div className="time-restriction-content">
            <div className="icon-container">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
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
                <span className="info-value">{displayTimezone}</span>
              </div>

              <div className="info-row">
                <span className="info-label">Current Time:</span>
                <span className="info-value">{displayTimeAMPM}</span>
              </div>
            </div>

            {countdown !== '--:--:--' && (
              <div className="countdown-section">
                <p className="countdown-label">{message}</p>
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
