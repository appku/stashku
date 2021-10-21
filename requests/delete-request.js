import Filter from '../filter.js';
import ModelUtility from '../modeling/model-utility.js';

/**
 * This class defines a StashKu DELETE request that instructs StashKu to delete objects matching the specified criteria.
 */
export default class DeleteRequest {
    /**
     * Creates a new `DeleteRequest` instance. A DELETE request instructs StashKu to delete objects from storage that
     * match the specified criteria.
     */
    constructor() {
        this.metadata = {
            /** @type {Boolean} */
            all: false,
            /** @type {Filter} */
            where: null,
            /** @type {String} */
            from: null,
            /** @type {Boolean} */
            count: false,
            /** @type {Object} */
            headers: {}
        };
    }

    /**
     * @type {String}
     */
    get method() {
        return 'delete';
    }

    /**
     * Applies a StahKu-compatible model's metadata & configuration *not already defined* to this request.
     * 
     * If a `null` value is passed, the model is removed - but metadata on the request will remain.
     * @throws Error when the `modelType` argument is not `null`, a class, or a constructor object.
     * @param {*} modelType - The model "class" or constructor function.
     * @returns {DeleteRequest}
     * @private
     */
    model(modelType) {
        if (modelType !== null && ModelUtility.isValidType(modelType) === false) {
            throw new Error('Invalid "modelType" argument. The value must be null, a class, or a constructor object');
        }
        this.metadata.model = modelType;
        if (modelType) {
            if (this.metadata.from === null) {
                this.from(ModelUtility.resource(modelType, this.method));
            }
        }
        return this;
    }

    /**
     * Requests that the response return count numbers (total, affected, returned, etc.) but not objects.
     * 
     * This will result in a `Response` with an empty `data` array and may result in faster query execution if you
     * only need the resulting numbers.
     * 
     * Calling this function without an argument *enables* the flag.
     * @param {Boolean} [enabled=true] - A `true` enables the count-only result. A `false` disables it.
     * @returns {GetRequest}
     */
    count(enabled) {
        if (typeof enabled === 'undefined') {
            this.metadata.count = true;
        } else {
            this.metadata.count = !!enabled;
        }
        return this;
    }

    /**
     * Enables the deletion of all objects in data storage if no `where` conditions are specified. If conditions are
     * specified, this setting will be ignored.
     * 
     * Caling this method without an argument will set the request to *enable* the update of all objects.
     * @param {Boolean} enabled - Enable or disable the deletion of all records.
     * @returns {DeleteRequest}
     */
    all(enabled) {
        if (arguments.length === 0) {
            enabled = true;
        }
        this.metadata.all = !!enabled;
        return this;
    }

    /**
     * @callback ConditionCallback
     * @param {Filter} f
     */

    /**
     * Creates a set of conditions on the request to match specific objects in storage.    
     * Any existing where conditions will be overwritten.    
     * If a `null` value is passed, the where conditions are cleared.
     * @throws Error if the "conditions" argument must be null or a Filter instance.
     * @param {Filter|ConditionCallback} conditions - The conditions to be used to filter out results.
     * @returns {DeleteRequest}
     */
    where(conditions) {
        if (conditions === null) {
            this.metadata.where = null;
            return this;
        } else if (conditions instanceof Filter) {
            this.metadata.where = conditions;
        } else if (typeof conditions === 'function') {
            this.metadata.where = new Filter();
            conditions(this.metadata.where);
        } else {
            throw new Error('The "conditions" argument must be null, a callback, or a Filter instance.');
        }
        return this;
    }

    /**
     * Sets the target resource name for the request, optionally specifying an alias for use with specifying properties
     * across joins.
     * 
     * @throws Error if the "name" argument value is not a string or null.
     * @param {String} name - The name of the target resource in data storage.
     * @returns {DeleteRequest}
     */
    from(name) {
        if (name === null) {
            this.metadata.from = null;
            return this;
        } else if (typeof name !== 'string') {
            throw new Error('Invalid "name" argument. The value must be a string or null.');
        }
        this.metadata.from = name;
        return this;
    }

    /**
     * Clears all configured metadata on the request, resetting it to a default state.
     * @returns {DeleteRequest}
     */
    clear() {
        if (!this.metadata) {
            this.metadata = {};
        }
        this.metadata.all = false;
        this.metadata.where = null;
        this.metadata.from = null;
        this.metadata.headers = {};
        return this;
    }

    /**
     * Merges custom engine-specific request settings into the request metadata. Setting a `null` will remove all
     * non-standard metadata properties. You may not set standard metadata with this method, use the appropriate method calls.
     * @throws Error when a standardized request metadata property name is specified.
     * @param {*} metadata - An object with properties and values to set as request metadata for engine-specific functionality.
     * @returns {DeleteRequest}
     * @deprecated Use new `headers` function for engine-specific options per-request.
     */
    meta(metadata) {
        if (metadata === null) {
            //clear non-standard metadata
            for (let k of Object.keys(this.metadata)) {
                if (STANDARD_METADATA.indexOf(k) < 0) {
                    delete this.metadata[k];
                }
            }
        } else {
            for (let k of Object.keys(metadata)) {
                if (STANDARD_METADATA.indexOf(k) >= 0) {
                    throw new Error(`The metadata property "${k}" is in use by a standard request method. Use the method to set this metadata should be used instead.`);
                }
            }
            this.metadata = Object.assign(this.metadata, metadata);
        }
        return this;
    }

}

const STANDARD_METADATA = ['all', 'where', 'from'];