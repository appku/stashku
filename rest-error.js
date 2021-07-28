import { STATUS_CODES } from 'http';

const validErrorCodes = Object.keys(STATUS_CODES)
    .filter(sc => sc >= 400)
    .map(sc => parseInt(sc));

/**
 * A RESTful error that can be used for actions processing requests and responses.
 */
export default class RESTError extends Error {
    /**
     * Creates a new RESTful error with a HTTP-compliant status code.
     * @param {Number} [code] - A standard HTTP-compliant status code.
     * @param {String} [message] - The error message.
     */
    constructor(code, message) {
        super(message);
        //soft validate
        if (code < 400 || code >= 600 || validErrorCodes.indexOf(code) < 0) {
            // eslint-disable-next-line no-console
            console.warn(`Invalid RESTful response code "${code}". The code should be an HTTP-complient status code in the 4xx or 5xx block.`);
        }

        /**
         * @type {Number}
         */
        this.code = code;

        Error.captureStackTrace(this, RESTError);
    }
}