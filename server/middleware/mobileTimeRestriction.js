import { getDeviceInfo } from './deviceInfo.js';

const getLocalTime = (timezone) => {
  const now = new Date();
  
  if (timezone) {
    try {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hour: 'numeric',
        minute: 'numeric',
        hour12: false
      });
      
      const parts = formatter.formatToParts(now);
      let hours, minutes;
      
      for (const part of parts) {
        if (part.type === 'hour') hours = parseInt(part.value, 10);
        if (part.type === 'minute') minutes = parseInt(part.value, 10);
      }
      
      return { hours, minutes };
    } catch (error) {
      console.error(`Error getting time for timezone ${timezone}:`, error);
    }
  }

  return {
    hours: now.getHours(),
    minutes: now.getMinutes()
  };
};

const mobileTimeRestriction = (req, res, next) => {
  const device = getDeviceInfo(req);
  
  if (device.deviceType === 'mobile') {
    const { hours, minutes } = getLocalTime(device.timezone);
    const currentMinutes = hours * 60 + minutes;
    
    const startMinutes = 10 * 60;  // 10:00 AM (600 minutes)  
    const endMinutes = 23 * 60;    // 1:00 PM (780 minutes)  // 13 * 60 
    
    if (currentMinutes < startMinutes || currentMinutes >= endMinutes) {
      return res.status(403).json({
        error: "Mobile access allowed only between 10:00 AM and 1:00 PM in your local time"
      });
    }
  }
  
  next();
};

export default mobileTimeRestriction;