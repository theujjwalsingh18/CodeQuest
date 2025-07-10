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
    if (!ip || ip === '127.0.0.1') {
      return {
        location: 'Unknown',
        timezone: null
      };
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

  return {
    browser: browser.name || 'Unknown browser',
    os: os.name || 'Unknown OS',
    deviceType,
    ip: ip || 'N/A',
    location,
    timezone
  };
};