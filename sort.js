
export default class Sort {
    constructor(property, dir) {

        /**
         * @type {String}
         */
        this.property = property || null;

        /**
         * @type {String}
         */
        this.dir = dir || Sort.DIR.ASC;
    }

    /**
     * Returns a string representation of the sort property and direction. If the property is missing, then a blank
     * string is returned.
     * @returns {String}
     */
    toString() {
        if (this.property && this.dir) {
            return `${this.property} ${this.dir}`;
        } else if (this.property) {
            return `${this.property}`;
        }
        return '';
    }

    /**
     * Creates a new `Sort` instance that indicates an ascending sort order for the given property.
     * @param {String} property - The property to be sorted.
     * @returns {Sort}
     */
    static asc(property) {
        return new Sort(property, Sort.DIR.ASC);
    }

    /**
     * Creates a new `Sort` instance that indicates an descending sort order for the given property.
     * @param {String} property - The property to be sorted.
     * @returns {Sort}
     */
    static desc(property) {
        return new Sort(property, Sort.DIR.DESC);
    }

    /**
     * Returns a new `Sort` instance from a string representation of a sorted property.
     * @example
     * let myOrderBy = Sort.fromString('FirstName desc');
     * //is equivalent to
     * let myOrderBy = new Sort('FirstName', 'desc');
     * @param {String} input - The string to deconstruct.
     * @returns {Sort} Returns a `Sort` instance when an input is given. If the input is `null`, `undefined`, or
     * falsey, then `null` is returned.
     */
    static fromString(input) {
        if (input) {
            let s = new Sort();
            let m = /(.+)\s+(asc|desc)(?:ending)?$/gi.exec(input);
            if (m) {
                s.property = m[1];
                s.dir = /asc/i.test(m[2]) ? Sort.DIR.ASC : Sort.DIR.DESC;
            } else {
                s.property = input;
            }
            return s;
        }
        return null;
    }
}

Sort.DIR = {
    ASC: 'asc',
    DESC: 'desc'
};