import Response from '../response.js';

/**
 * Class that is responsible for exporting the `Response` to an StashKu `OptionsRequest`.
 */
class OptionsExporter {
    /**
     * Creates an instance of the `OptionsExporter` class.
     * @param {Response} response - The response to an `OptionsRequest`.
     */
    constructor(response) {

        /**
         * @type {Response}
         */
        this.response = response;
    }

}

export default OptionsExporter;