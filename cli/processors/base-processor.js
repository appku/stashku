import StashKu from '../../stashku.js';

export default class BaseProcessor {
    constructor(options) {

        /**
         * @type {*}
         */
        this.options = options || null;

        /**
         * @type {StashKu}
         */
        this.stash = new StashKu();
    }

    /**
     * Starts the worker to perform actions using the loaded options.
     */
    async start() {
        throw new Error('Not implemented.');
    }
}