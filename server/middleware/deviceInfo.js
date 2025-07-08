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

  const getLocationFromIP = (ip) => {
    if (!ip || ip === '127.0.0.1') return 'Unknown';

    try {
      const geo = geoip.lookup(ip);
      if (!geo) return 'Unknown location';

      return `${geo.city || 'Unknown city'}, ${geo.country || 'Unknown country'}`;
    } catch (error) {
      console.error('GeoIP lookup failed:', error);
      return 'Unknown location';
    }
  };

  const location = getLocationFromIP(ip);

  const deviceType = device.type ||
    (parser.getDevice().type ||
      (/mobile/i.test(req.headers['user-agent']) ? 'mobile' : 'desktop'));

  return {
    browser: browser.name || 'Unknown browser',
    os: os.name || 'Unknown OS',
    deviceType,
    ip: ip || 'N/A',
    location
  };
};