
/**
 * @callback LoggerCallback
 * @param {String} state - Always a "log" string.
 * @param {String} severity - The severity level of the log message, either "error", "warn", "info", or "debug".
 * @param {Array} args - The log message arguments, this can be a mix of types.
 */

/**
 * A logging interface class that exposes friendly log methods that pass information to a configured callback.
 */
export default class Logger {
    /**
     * Creates a new `Logger` instance.
     * @param {LoggerCallback} callback - The logging callback asynchronously called when a log method call is made.
     */
    constructor(callback) {

        /** @type {LoggerCallback} */
        this.callback = callback || null;
    }

    /**
     * Writes a debug-severity log message. This is the lowest severity.
     * @param  {...any} args - Any object values to be logged.
     */
    async debug(...args) {
        if (this.callback) {
            await this.callback('log', 'debug', args);
        }
    }

    /**
     * Writes an information-severity log message. This is the second-to-lowest severity.
     * @param  {...any} args - Any object values to be logged.
     */
    async info(...args) {
        if (this.callback) {
            await this.callback('log', 'info', args);
        }
    }

    /**
     * Writes a warning-severity log message. This is the second-to-highest severity.
     * @param  {...any} args - Any object values to be logged.
     */
    async warn(...args) {
        if (this.callback) {
            await this.callback('log', 'warn', args);
        }
    }

    /**
     * Writes a error-severity log message. This is the highest severity.
     * @param  {...any} args - Any object values to be logged.
     */
    async error(...args) {
        if (this.callback) {
            await this.callback('log', 'error', args);
        }
    }

}