const validErrorCodes = [100, 101, 102, 103, 200, 201, 202, 203, 204, 205, 206, 207, 208, 226, 300, 301, 302, 303, 304, 305, 307, 308, 400, 401, 402, 403, 404, 405, 406, 407, 408, 409, 410, 411, 412, 413, 414, 415, 416, 417, 418, 421, 422, 423, 424, 425, 426, 428, 429, 431, 451, 500, 501, 502, 503, 504, 505, 506, 507, 508, 509, 510, 511]

/**
 * A RESTful error that can be used for actions processing requests and responses.
 */
class RESTError extends Error {
    /**
     * Creates a new RESTful error with a HTTP-compliant status code.
     * @param {Number} [code] - A standard HTTP-compliant status code.
     * @param {String} [message] - The error message.
     * @param {Error} [innerError] - An inner error that was thrown.
     */
    constructor(code, message, innerError) {
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

        /**
         * @type {*}
         */
        this.data = undefined;

        /**
         * @type {Error}
         */
        this.innerError = innerError;

        Error.captureStackTrace(this, RESTError);
        if (innerError && innerError.stack) {
            this.stack += `\nEngine ${innerError.stack}`;
        }
    }
}

export default RESTError;