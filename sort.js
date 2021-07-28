
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

    static asc(property) {
        return new Sort(property, Sort.DIR.ASC);
    }

    static desc(property) {
        return new Sort(property, Sort.DIR.DESC);
    }
}

Sort.DIR = {
    ASC: 'asc',
    DESC: 'desc'
};