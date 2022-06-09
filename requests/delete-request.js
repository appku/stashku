import Filter from '../filter.js';
import ModelUtility from '../modeling/model-utility.js';

/**
 * This class defines a StashKu DELETE request that instructs StashKu to delete objects matching the specified criteria.
 */
class DeleteRequest {
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
            /** @type {Map.<String, *>} */
            headers: null
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
     * @param {Modeling.AnyModelType} modelType - The model "class" or constructor function.
     * @param {Boolean} [overwrite = false] - Optional flag that, when `true`, overwrites request settings and values
     * with the model's (where applicable).
     * @param {Boolean} [header=false] - Optional flag that, when `true`, adds a `model` header to the request with
     * the model type's `$stashku` definition.
     * @returns {DeleteRequest}
     * @private
     */
    model(modelType, overwrite = false, header = false) {
        if (modelType !== null && ModelUtility.isValidType(modelType) === false) {
            throw new Error('Invalid "modelType" argument. The value must be null, a class, or a constructor object');
        }
        if (modelType) {
            if (overwrite === true || !this.metadata.from) {
                this.from(ModelUtility.resource(modelType, this.method));
            }
            if (header) {
                this.headers({ model: modelType.$stashku });
            }
            ModelUtility.unmodelFilters(modelType, this.metadata.where);
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
     * @param {Filter} orig
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
        } else if (typeof conditions === 'string') {
            this.metadata.where = Filter.parse(conditions);
        } else if (typeof conditions === 'function') {
            let originalFilter = this.metadata.where ?? new Filter();
            this.metadata.where = new Filter();
            conditions(this.metadata.where, originalFilter);
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
        if (name !== null && typeof name !== 'string') {
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
        this.metadata.headers = null;
        return this;
    }

    /**
     * Sets or clears headers on the request that can be used to set engine-specific options for the request.
     * If a `null` value is passed, the headers are cleared.
     * @throws Error when the dictionary argument uses a non-string key.
     * @throws Error when the dictionary argument is not an object, null, or a Map.
     * @param {Object | Map.<String, *>} dictionary - A map or object defining the headers and values.
     * @returns {DeleteRequest}
     */
    headers(dictionary) {
        if (!this.metadata.headers) {
            this.metadata.headers = new Map();
        }
        if (dictionary === null) {
            this.metadata.headers.clear();
        } else if (dictionary instanceof Map || typeof dictionary === 'object') {
            let iterable = dictionary;
            if ((dictionary instanceof Map) === false) {
                iterable = Object.entries(dictionary);
            }
            for (let [k, v] of iterable) {
                if (k !== null && typeof k !== 'undefined') {
                    if (typeof k !== 'string') {
                        throw new Error('An invalid non-string key value was provided in the "dictionary" argument. Only string-based keys may be used.');
                    }
                    if (v === null || typeof v === 'undefined') {
                        this.metadata.headers.delete(k);
                    } else {
                        this.metadata.headers.set(k, v);
                    }
                }
            }
        } else {
            throw new Error('The "dictionary" argument must be null, a Map, or an object.');
        }
        return this;
    }

    /**
     * Returns the metadata object to be utilized for stringifying into JSON.
     * @returns {*}
     * @protected
     */
    toJSON() {
        let metaClone = { from: this.metadata.from };
        if (this.metadata.headers) {
            metaClone.headers = Object.fromEntries(this.metadata.headers);
        }
        if (this.metadata.all) {
            metaClone.all = this.metadata.all;
        }
        if (this.metadata.count) {
            metaClone.count = this.metadata.count;
        }
        if (this.metadata.where && Filter.isEmpty(this.metadata.where) === false) {
            metaClone.where = this.metadata.where.toJSON();
        }
        return metaClone;
    }

}

const STANDARD_METADATA = ['all', 'where', 'from', 'count', 'headers'];

export default DeleteRequest;