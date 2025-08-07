import { UAParser } from 'ua-parser-js';
import geoip from 'geoip-lite';

export const getDeviceInfo = (req) => {
  const parser = new UAParser(req.headers['user-agent']);
  const { browser, os, device } = parser.getResult();

  let ip = req.headers['x-real-ip'] ||
    req.headers['x-forwarded-for'] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.connection.socket.remoteAddress;

  if (ip === '::1') ip = '127.0.0.1';
  if (ip && ip.includes('::ffff:')) {
    ip = ip.split(':').pop();
  }
  if (ip && ip.includes(',')) {
    ip = ip.split(',')[0].trim();
  }

  const getLocationInfo = (ip) => {
    if (!ip || ip === '127.0.0.1' || ip === '::1') {
      try {
        const serverTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        return {
          location: 'Local Development',
          timezone: serverTimezone
        };
      } catch {
        return {
          location: 'Local Development',
          timezone: 'UTC'
        };
      }
    }

    try {
      const geo = geoip.lookup(ip);
      if (!geo) return {
        location: 'Unknown location',
        timezone: null
      };

      return {
        location: `${geo.city || 'Unknown city'}, ${geo.country || 'Unknown country'}`,
        timezone: geo.timezone || null
      };
    } catch (error) {
      console.error('GeoIP lookup failed:', error);
      return {
        location: 'Unknown location',
        timezone: null
      };
    }
  };

  const { location, timezone } = getLocationInfo(ip);
  const deviceType = device.type ||
    (parser.getDevice().type ||
      (/mobile/i.test(req.headers['user-agent']) ? 'mobile' : 'desktop'));

  let currentTime;
  if (timezone) {
    try {
      const options = {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      };
      currentTime = new Date().toLocaleTimeString('en-US', options);
    } catch (error) {
      console.error('Time formatting failed:', error);
      currentTime = 'N/A';
    }
  } else {
    currentTime = 'N/A';
  }

  return {
    browser: browser.name || 'Unknown browser',
    os: os.name || 'Unknown OS',
    deviceType,
    ip: ip || 'N/A',
    location,
    timezone,
    currentTime
  };
};