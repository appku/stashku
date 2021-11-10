import Filter from '../filter.js';
import ModelUtility from '../modeling/model-utility.js';
import Objects from '../utilities/objects.js';

/**
 * This class defines a StashKu OPTIONS request that instructs StashKu to gather the schema for models from a 
 * particular resource.
 */
export default class OptionsRequest {
    /**
     * Creates a new `OptionsRequest` instance. A OPTIONS request that instructs StashKu to gather the schema for
     * models from a particular resource.
     * @param {String} [from] - The target resource name for the OPTIONS request.
     */
    constructor(from) {
        
        this.metadata = {
            /** @type {String} */
            from: from || null,
            /** @type {Map.<String, *>} */
            headers: null
        };
    }

    /**
     * @type {String}
     */
    get method() {
        return 'options';
    }

    /**
     * Applies a StahKu-compatible model's metadata & configuration *not already defined* to this request.
     * 
     * If a `null` value is passed, the model is removed - but metadata on the request will remain.
     * @throws Error when the `modelType` argument is not `null`, a class, or a constructor object.
     * @param {*} modelType - The model "class" or constructor function.
     * @returns {OptionsRequest}
     * @private
     */
    model(modelType) {
        if (modelType !== null && ModelUtility.isValidType(modelType) === false) {
            throw new Error('Invalid "modelType" argument. The value must be null, a class, or a constructor object');
        }
        this.metadata.model = modelType;
        if (modelType !== null) {
            this.from(ModelUtility.resource(modelType, this.method));
        }
        return this;
    }

    /**
     * Sets the target resource name for the request, optionally specifying an alias for use with specifying properties
     * across joins.
     * 
     * @throws Error if the "name" argument value is not a string or null.
     * @param {String} name - The name of the target resource in data storage.
     * @returns {OptionsRequest}
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
     * @returns {OptionsRequest}
     */
    clear() {
        if (!this.metadata) {
            this.metadata = {};
        }
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
     * @returns {OptionsRequest}
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
     */
    toJSON() {
        let metaClone = Object.assign({}, this.metadata);
        if (this.metadata.headers) {
            metaClone.headers = Objects.fromEntries(this.metadata.headers);
        }
        metaClone.model = this.metadata?.model?.name;
        metaClone.method = this.method;
        return metaClone;
    }

}