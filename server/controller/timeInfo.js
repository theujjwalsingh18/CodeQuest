import { getDeviceInfo } from "../middleware/deviceInfo.js";
export const getDeviceTime = async (req, res) => {
    const device = getDeviceInfo(req);
    const getServerTimeInfo = (timezone) => {
        const now = new Date();
        let hours, minutes;

        if (timezone) {
            try {
                const formatter = new Intl.DateTimeFormat('en-US', {
                    timeZone: timezone,
                    hour: 'numeric',
                    minute: 'numeric',
                    hour12: false
                });

                const parts = formatter.formatToParts(now);
                for (const part of parts) {
                    if (part.type === 'hour') hours = parseInt(part.value, 10);
                    if (part.type === 'minute') minutes = parseInt(part.value, 10);
                }
            } catch (error) {
                console.error('Error formatting time:', error);
            }
        }
        if (hours === undefined || minutes === undefined) {
            hours = now.getHours();
            minutes = now.getMinutes();
        }

        return {
            hours,
            minutes,
            currentTime: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
        };
    };

    const timeInfo = getServerTimeInfo(device.timezone);

    res.json({
        timezone: device.timezone || 'UTC',
        location: device.location,
        currentTime: timeInfo.currentTime,
        isRestricted: device.deviceType === 'mobile' &&
            (timeInfo.hours < 10 || timeInfo.hours >= 13)
    });
};