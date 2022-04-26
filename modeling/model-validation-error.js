
class ModelValidationError extends Error {
    constructor(property, message) {
        super(message || `The property "${property}" failed validation.`);

        /**
         * The model property that failed validation.
         * @type {String}
         */
        this.property = property;
    }
}

export default ModelValidationError;