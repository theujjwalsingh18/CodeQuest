import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faClock,
    faDesktop,
    faMobileAlt,
    faTabletAlt,
    faMapLocationDot,
    faLock,
    faChevronDown
} from '@fortawesome/free-solid-svg-icons';
import moment from 'moment';

const LoginHistorySection = ({ loginHistory, loadingHistory, error, onRetry }) => {
    const getBrowserIcon = (browser) => {
        if (!browser) return 'globe';
        if (browser.includes('Chrome')) return 'chrome';
        if (browser.includes('Firefox')) return 'firefox';
        if (browser.includes('Safari')) return 'safari';
        if (browser.includes('Edge')) return 'edge';
        return 'globe';
    };

    const getOSIcon = (os) => {
        if (!os) return 'desktop';
        if (os.includes('Windows')) return 'windows';
        if (os.includes('Mac')) return 'apple';
        if (os.includes('Linux')) return 'linux';
        if (os.includes('Android')) return 'android';
        if (os.includes('iOS')) return 'apple';
        return 'desktop';
    };

    const formatLocation = (location) => {
        if (!location || location === 'Unknown') return 'Location unknown';
        return location;
    };

    return (
        <div className="login-history-section">
            <div className="section-header">
                <h2 className="section-title">
                    <FontAwesomeIcon icon={faClock} /> Login History
                    <br />
                    <span className="section-subtitle">Recent login activities on your account</span>
                </h2>
                {loginHistory.length > 0 && !loadingHistory && !error && (
                    <div className="history-count">
                        {loginHistory.length} entries
                    </div>
                )}
            </div>

            {loadingHistory ? (
                <div className="loading-history">
                    <div className="spinner"></div>
                    <p>Loading login history...</p>
                </div>
            ) : error ? (
                <div className="history-error">
                    <FontAwesomeIcon icon={faLock} />
                    <p>{error}</p>
                    <button
                        className="retry-btn"
                        onClick={onRetry}
                    >
                        Try Again
                    </button>
                </div>
            ) : loginHistory.length === 0 ? (
                <div className="no-history">
                    <FontAwesomeIcon icon={faClock} size="2x" />
                    <p>No login history available</p>
                </div>
            ) : (
                <>
                    <div className="history-container">
                        <div className="history-cards">
                            {loginHistory.map((entry, index) => (
                                <div key={index} className={`history-card ${entry.deviceType === 'mobile' ? 'mobile' : 'desktop'}`}>
                                    <div className="history-header">
                                        <div className="device-icon">
                                            <FontAwesomeIcon
                                                icon={entry.deviceType === 'mobile' ? faMobileAlt : (entry.deviceType === 'tablet' ? faTabletAlt : faDesktop)}
                                                className={entry.deviceType}
                                            />
                                        </div>
                                        <div className="history-time">
                                            {moment(entry.timestamp).format('MMM D, YYYY')}
                                            <span>{moment(entry.timestamp).format('h:mm A')}</span>
                                        </div>
                                        <div className="status-badge success">
                                            Successful
                                        </div>
                                    </div>

                                    <div className="history-details">
                                        <div className="detail-row">
                                            <div className="detail-item">
                                                <span className="detail-label">Browser:</span>
                                                <div className="detail-value">
                                                    <span className={`browser-icon ${getBrowserIcon(entry.browser)}`}></span>
                                                    {entry.browser || 'Unknown browser'}
                                                </div>
                                            </div>

                                            <div className="detail-item">
                                                <span className="detail-label">OS:</span>
                                                <div className="detail-value">
                                                    <span className={`os-icon ${getOSIcon(entry.os)}`}></span>
                                                    {entry.os || 'Unknown OS'}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="detail-row">
                                            <div className="detail-item">
                                                <span className="detail-label">Location:</span>
                                                <div className="detail-value">
                                                    <FontAwesomeIcon icon={faMapLocationDot} />
                                                    {formatLocation(entry.location)}
                                                </div>
                                            </div>

                                            <div className="detail-item">
                                                <span className="detail-label">IP Address:</span>
                                                <div className="detail-value">
                                                    <code>{entry.ip || 'N/A'}</code>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {loginHistory.length > 6 && (
                        <div className="scroll-indicator">
                            <FontAwesomeIcon icon={faChevronDown} />
                            <span>Scroll to see more</span>
                        </div>
                    )}

                    <div className="history-footer">
                        <p>
                            <FontAwesomeIcon icon={faLock} />
                            If you see any suspicious activity, please change your password immediately.
                        </p>
                    </div>
                </>
            )}
        </div>
    );
};

export default LoginHistorySection;