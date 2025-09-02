import { config } from '../config.js';

class Logger {
    constructor() {
        this.level = config.LOGGING.level;
        this.enabled = config.LOGGING.enabled;
        this.format = config.LOGGING.format;
    }

    _shouldLog(level) {
        if (!this.enabled) return false;
        
        const levels = {
            'debug': 0,
            'info': 1,
            'warn': 2,
            'error': 3
        };
        
        return levels[level] >= levels[this.level];
    }

    _formatMessage(level, message, data = null) {
        const timestamp = new Date().toISOString();
        const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
        
        if (this.format === 'json') {
            return JSON.stringify({
                timestamp,
                level: level.toUpperCase(),
                message,
                data
            });
        }
        
        let formatted = `${prefix} ${message}`;
        if (data) {
            formatted += ` ${JSON.stringify(data)}`;
        }
        
        return formatted;
    }

    debug(message, data = null) {
        if (this._shouldLog('debug')) {
            console.error(this._formatMessage('debug', message, data));
        }
    }

    info(message, data = null) {
        if (this._shouldLog('info')) {
            console.error(this._formatMessage('info', message, data));
        }
    }

    warn(message, data = null) {
        if (this._shouldLog('warn')) {
            console.warn(this._formatMessage('warn', message, data));
        }
    }

    error(message, data = null) {
        if (this._shouldLog('error')) {
            console.error(this._formatMessage('error', message, data));
        }
    }
}

export const logger = new Logger();
