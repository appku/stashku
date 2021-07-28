import crypto from 'crypto';

/**
 * Randomization is a static class (module) that provides helpful functions for generating
 * unique and random values.
 * @exports Randomization
 */
const Randomization = {

    /**
     * Returns a whole random number in-between or at "min" and "max" values.
     * @param {Number} [min=Number.MIN_SAFE_INTEGER] - The minimum value that can be generated.
     * @param {Number} [max=Number.MAX_SAFE_INTEGER] - The maximum value that can be generated.
     * @returns {Number}
     */
    number: function(min, max) {
        if (min === null || typeof min === 'undefined') {
            min = Number.MIN_SAFE_INTEGER;
        }
        if (max === null || typeof max === 'undefined') {
            max = Number.MAX_SAFE_INTEGER - 1;
        }
        let n = Math.round(Math.random() * (max + 1 - min) + min);
        n = n > max ? max : n;
        n = n < min ? min : n;
        return n;
    },

    /**
     * Returns a floating-point (contains decimals) random number in-between or at "min" and "max" values.
     * @param {Number} [min=Number.MIN_SAFE_INTEGER] - The minimum value that can be generated.
     * @param {Number} [max=Number.MAX_SAFE_INTEGER] - The maximum value that can be generated.
     * @returns {Number}
     */
    float: function(min, max) {
        if (min === null || typeof min === 'undefined') {
            min = Number.MIN_SAFE_INTEGER;
        }
        if (max === null || typeof max === 'undefined') {
            max = Number.MAX_SAFE_INTEGER - 1;
        }
        let n = Math.random() * (max + 1 - min) + min;
        n = n > max ? max : n;
        n = n < min ? min : n;
        return n;
    },

    /**
     * Generates a random RFC4122 unique identification string.
     * @returns {String}
     */
    uuidv4: function() {
        return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
            (c ^ crypto.randomBytes(1)[0] & 15 >> c / 4).toString(16)
        );
    }

};

export default Randomization;