import Filter from '../filter.js';
import Sort from '../sort.js';
import ModelUtility from '../modeling/model-utility.js';

/**
 * This class defines a StashKu GET request that instructs StashKu to retrieve objects from storage.
 */
export default class GetRequest {
    /**
     * Creates a new `PostRequest` instance. A GET request instructs StashKu to retrieve objects from storage.
     * @param  {...String} [properties] - Spread of property names (aka: columns) to get from data storage.
     */
    constructor(...properties) {
        this.metadata = {
            /** @type {Array.<String>} */
            properties: [],
            /** @type {Filter} */
            where: null,
            /** @type {Array.<Sort>} */
            sorts: [],
            /** @type {String} */
            from: null,
            /** @type {Number} */
            take: 0,
            /** @type {Number} */
            skip: 0,
            /** @type {Boolean} */
            distinct: false,
            /** @type {Boolean} */
            count: false,
            /** @type {*} */
            model: null,
            /** @type {Map.<String, *>} */
            headers: null
        };
        this.properties(...properties);
    }

    /**
     * @type {String}
     */
    get method() {
        return 'get';
    }

    /**
     * Applies a StahKu-compatible model's metadata & configuration *not already defined* to this request.
     * 
     * If a `null` value is passed, the model is removed - but metadata on the request will remain.
     * @throws Error when the `modelType` argument is not `null`, a class, or a constructor object.
     * @param {*} modelType - The model "class" or constructor function.
     * @returns {GetRequest}
     * @private
     */
    model(modelType) {
        if (modelType !== null && ModelUtility.isValidType(modelType) === false) {
            throw new Error('Invalid "modelType" argument. The value must be null, a class, or a constructor object');
        }
        this.metadata.model = modelType;
        if (modelType) {
            this.from(ModelUtility.resource(modelType, this.method));
            this.properties(...ModelUtility.map(modelType).keys());
        }
        return this;
    }

    /**
     * Requests that the retrieved results be distinct among the selected (or all) properties.    
     * Calling this function without an argument *enables* the flag.
     * @param {Boolean} [enabled=true] - A `true` enables the distinct results. A `false` disables it.
     * @returns {GetRequest}
     */
    distinct(enabled) {
        if (typeof enabled === 'undefined') {
            this.metadata.distinct = true;
        } else {
            this.metadata.distinct = !!enabled;
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
     * Adds properties in the GET request. If the property is already present, it is ignored.    
     * If a `null` value is passed, all properties are cleared from the request.
     * @param  {...String} [properties] - Spread of property names (aka: columns) to get from data storage.
     * @returns {GetRequest}
     */
    properties(...properties) {
        if (Array.isArray(this.metadata.properties) === false) {
            this.metadata.properties = [];
        }
        if (!properties || (properties.length === 1 && properties[0] === null)) {
            this.metadata.properties = [];
        } else {
            for (let f of properties) {
                if (f !== null && typeof f !== 'string') {
                    throw new Error('Invalid "properties" argument. The array contains a non-string value.');
                }
                if (f && this.metadata.properties.some(v => v === f) == false) {
                    this.metadata.properties.push(f);
                }
            }
        }
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
     * @returns {GetRequest}
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
     * Adds sort criteria to the GET request. If the sort is already present, it is updated.    
     * If a `null` value is passed, all sorts are removed.
     * 
     * @throws Error if the any `sorts` argument value is not a string, Sort, null, or undefined.
     * @throws Error if the any `sorts` argument property is a blank string.
     * @param  {...Sort} [sorts] - Spread of sorts which describe the order of results.
     * @returns {GetRequest}
     */
    sort(...sorts) {
        if (Array.isArray(this.metadata.sorts) === false) {
            this.metadata.sorts = [];
        }
        if (!sorts || (sorts.length === 1 && sorts[0] === null)) {
            this.metadata.sorts = [];
        } else {
            sorts = sorts.flat();
            for (let s of sorts) {
                let stype = typeof s;
                if (s !== null && stype !== 'undefined') {
                    if (stype === 'string') {
                        s = Sort.asc(s);
                    } else if (s.field) {
                        s = new Sort(s.field, s.dir);
                    } else if ((s instanceof Sort) === false) {
                        throw new Error('The "sorts" argument contains an invalid value. Values must be a string, Sort, null, or undefined.');
                    }
                    if (s.property) {
                        let existingIndex = this.metadata.sorts.findIndex(v => v.property.toLowerCase() === s.property.toLowerCase());
                        if (existingIndex >= 0) {
                            //remove existing from the array to it's order is reset when it is re-added.
                            this.metadata.sorts.splice(existingIndex, 1);
                        }
                        this.metadata.sorts.push(s);
                    }
                }
            }
        }
        return this;
    }

    /**
     * Sets the target resource name for the request, optionally specifying an alias for use with specifying properties
     * across joins.
     * 
     * @throws Error if the "name" argument value is not a string or null.
     * @param {String} name - The name of the target resource in data storage.
     * @returns {GetRequest}
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
     * Indicates the request wishes to skip over the specified number of objects in storage.
     * @param {Number} count - The number of models to skip over.
     * @returns {GetRequest}
     */
    skip(count) {
        if (typeof count === 'undefined') {
            return this;
        } else if (count === null) {
            count = 0;
        } else if (isNaN(count) || count < 0) {
            throw new Error('The "count" argument is invalid. The value must be a number.');
        }
        this.metadata.skip = parseInt(count) || 0;
        return this;
    }

    /**
     * Indicates only one object should be returned. This is equivalent to calling `take(1)`.
     * @returns {GetRequest}
     */
    one() {
        return this.take(1);
    }

    /**
     * Hints that the request wishes to retrieve only the specified number of objects from storage.
     * @param {Number} count - The number of models to take.
     * @returns {GetRequest}
     */
    take(count) {
        if (typeof count === 'undefined') {
            return this;
        } else if (count === null) {
            count = 0;
        } else if (isNaN(count) || count < 0) {
            throw new Error('The "count" argument is invalid. The value must be a number.');
        }
        this.metadata.take = parseInt(count) || 0;
        return this;
    }

    /**
     * Clears all configured metadata on the request, resetting it to a default state.
     * @returns {GetRequest}
     */
    clear() {
        if (!this.metadata) {
            this.metadata = {};
        }
        this.metadata.properties = [];
        this.metadata.where = null;
        this.metadata.sorts = [];
        this.metadata.from = null;
        this.metadata.skip = 0;
        this.metadata.take = 0;
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
     * Merges custom engine-specific request settings into the request metadata. Setting a `null` will remove all
     * non-standard metadata properties. You may not set standard metadata with this method, use the appropriate method calls.
     * @throws Error when a standardized request metadata property name is specified.
     * @param {*} metadata - An object with properties and values to set as request metadata for engine-specific functionality.
     * @returns {GetRequest}
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

const STANDARD_METADATA = ['properties', 'where', 'sorts', 'from', 'skip', 'take'];