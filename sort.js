
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
            return `{${this.property}} ${this.dir.toUpperCase()}`;
        } else if (this.property) {
            return `{${this.property}}`;
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
     * Returns a new `Sort` instance (or array of `Sort` instances from a string representation. If no
     * sorts are defined, a `null` is returned.
     * @example
     * let myOrderBy = Sort.parse('FirstName desc'); //returns a single Sort
     * @example
     * let mySorts = Sort.parse('FirstName, LastName desc'); //returns array of Sort
     * @param {String} input - The string to deconstruct.
     * @returns {Sort|Array.<Sort>} A single `Sort` instance when only one Sort is specifiedy, otherwise
     * an array of `Sort` instances is returned (in order).
     */
    static parse(input) {
        if (input && typeof input === 'string') {
            let sorts = [];
            let openSort = null;
            let tokens = Sort._tokenize(input);
            for (let i = 0; i < tokens.length; i++) {
                let t = tokens[i];
                if (!openSort && t.type === 'property') {
                    openSort = new Sort(t.value);
                } else if (openSort && t.type === 'order') {
                    openSort.dir = t.value;
                } else if (openSort && t.type === 'separator') {
                    sorts.push(openSort);
                    openSort = null;
                }
            }
            if (openSort) {
                sorts.push(openSort);
            }
            if (sorts.length === 1) {
                return sorts[0];
            } else if (sorts.length > 1) {
                return sorts;
            }
        }
        return null;
    }

    /**
     * @typedef SortToken
     * @property {String} type
     * @property {String} value
     */

    /**
     * Tokenizes a string containing 0 or more property sorts.
     * @param {String} input - the input Sort string.
     * @returns {Array.<SortToken>}
     * @private
     */
    static _tokenize(input) {
        let tokens = [];
        let openToken = null;
        for (let i = 0; i < input.length; i++) {
            if (openToken?.type === 'property') {
                if (input[i - 1] !== '\\' && input[i] === '}') {
                    tokens.push(openToken);
                    openToken = null;
                } else {
                    if (input[i - 1] === '\\' && input[i] === '}') {
                        openToken.value = openToken.value.substr(0, openToken.value.length - 1) + '}';
                    } else if (input[i - 1] === '\\' && input[i] === '{') {
                        openToken.value = openToken.value.substr(0, openToken.value.length - 1) + '{';
                    } else {
                        openToken.value += input[i];
                    }
                }
            } else if (/asc/i.test(input.substr(i, 3))) {
                tokens.push({
                    type: 'order',
                    value: Sort.DIR.ASC
                });
                i += 2;
            } else if (/desc/i.test(input.substr(i, 4))) {
                tokens.push({
                    type: 'order',
                    value: Sort.DIR.DESC
                });
                i += 3;
            } else if (input[i] === ',') {
                tokens.push({
                    type: 'separator'
                });
            } else if (input[i - 1] !== '\\' && input[i] === '{') {
                openToken = {
                    type: 'property',
                    value: ''
                };
            } else if (/\s/.test(input[i]) === false) {
                throw new SyntaxError(`Failed to tokenize sort string, unknown value at position ${i} was found (are you surrounding property names with braces "{...}"?).`);
            }
        }
        //validate

        return tokens;
    }
}

Sort.DIR = {
    ASC: 'asc',
    DESC: 'desc'
};