// import axios from 'axios';
// import { getDeviceInfo } from "../middleware/deviceInfo.js";


// export const getDeviceTime = async (req, res) =>{
//   const device = getDeviceInfo(req);
//     res.json({
//       browser: device.browser,
//       os: device.os,
//       deviceType: device.deviceType,
//       ip: device.ip,
//       timezone: device.timezone,
//       location: device.location,
//       currentTime: device.currentTime,
//       isRestricted: device.deviceType === 'mobile' &&
//         (new Date(currentTime).getHours() < 10 || new Date(currentTime).getHours() >= 13)
//     });
// }

import { getDeviceInfo } from "../middleware/deviceInfo.js";

export const getDeviceTime = async (req, res) => {
  const device = getDeviceInfo(req);
  const { currentTime, deviceType } = device;

  let isRestricted = false;
  if (deviceType === 'mobile' && device.timezone) {
      try {
          const date = new Date();
          const hour = date.toLocaleString('en-US', { timeZone: device.timezone, hour: '2-digit', hour12: false });
          const currentHour = parseInt(hour, 10);
          
          if (currentHour < 10 || currentHour >= 13) {
              isRestricted = true;
          }
      } catch (error) {
          console.error("Error calculating restricted time:", error);
      }
  }

  res.json({
    browser: device.browser,
    os: device.os,
    deviceType: deviceType,
    ip: device.ip,
    timezone: device.timezone,
    location: device.location,
    currentTime: currentTime,
    isRestricted: isRestricted
  });
};