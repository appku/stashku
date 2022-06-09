///<reference path="../modeling/modeling.d.js" />
import Filter from '../filter.js';
import Sort from '../sort.js';
import ModelUtility from '../modeling/model-utility.js';

/**
 * This class defines a StashKu GET request that instructs StashKu to retrieve objects from storage.
 */
class GetRequest {
    /**
     * Creates a new `PostRequest` instance. A GET request instructs StashKu to retrieve objects from storage.
     * @param  {...String} [properties] - Spread of field names (aka: columns) to get from data storage.
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
     * @param {Modeling.AnyModelType} modelType - The model "class" or constructor function.
     * @param {Boolean} [overwrite = false] - Optional flag that, when `true`, overwrites request settings and values
     * with the model's (where applicable).
     * @param {Boolean} [header=false] - Optional flag that, when `true`, adds a `model` header to the request with
     * the model type's `$stashku` definition.
     * @returns {GetRequest}
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
            if (overwrite === true || !this.metadata.properties || this.metadata.properties.length === 0) {
                let targets = [];
                for (let v of ModelUtility.map(modelType).values()) {
                    targets.push(v.target);
                }
                this.properties(...targets);
            }
            ModelUtility.unmodelFilters(modelType, this.metadata.where);
            ModelUtility.unmodelSorts(modelType, ...this.metadata.sorts);
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
     * Adds properties to the GET request. If the property is already present, it is ignored.    
     * If a `null` value is passed, all properties are cleared from the request.
     * @param  {...String|Modeling.PropertyDefinition} [properties] - Spread of property names (aka: columns) to get from data storage.
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
                let prop = f;
                if (f.target && typeof f.target === 'string') {
                    prop = f.target;
                }
                if (typeof prop !== 'string') {
                    throw new Error('Invalid "properties" argument. The array contains a non-string value.');
                }
                if (this.metadata.properties.some(v => v === prop) == false) {
                    this.metadata.properties.push(prop);
                }
            }
        }
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
     * @returns {GetRequest}
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
            let optionalReturn = conditions(this.metadata.where, originalFilter);
            if (optionalReturn) {
                this.metadata.where = optionalReturn;
            }
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
                    if ((s instanceof Sort) === false) {
                        if (stype === 'string') {
                            if (s.match(/{.+}/)) {
                                s = Sort.parse(s);
                            } else {
                                s = Sort.asc(s);
                            }
                        } else if (s.property) {
                            s = new Sort(s.property, s.dir);
                        } else if (s.field) {
                            s = new Sort(s.field, s.dir);
                        } else {
                            throw new Error('The "sorts" argument contains an invalid value. Values must be a string, Sort, null, or undefined.');
                        }
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
        if (name !== null && typeof name !== 'string') {
            throw new Error('Invalid "name" argument. The value must be a string or null.');
        }
        this.metadata.from = name;
        return this;
    }

    /**
     * Indicates the request wishes to skip over the specified number of objects in storage.
     * @param {Number|String} count - The number of models to skip over. Optionally, if the string `"all"` is provided,
     * then the `skip` and `take` values will be cleared.
     * @returns {GetRequest}
     */
    skip(count) {
        if (typeof count === 'undefined') {
            return this;
        } else if (count === null) {
            count = 0;
        } else if (count === 'all') {
            count = 0;
            this.metadata.take = 0;
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
     * @param {Number|String} count - The number of models to take. Optionally, if the string `"all"` is provided, then
     * the `skip` and `take` values will be cleared.
     * @returns {GetRequest}
     */
    take(count) {
        if (typeof count === 'undefined') {
            return this;
        } else if (count === null) {
            count = 0;
        } else if (count === 'all') {
            count = 0;
            this.metadata.skip = 0;
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
     * @returns {GetRequest}
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
        if (this.metadata.count) {
            metaClone.count = this.metadata.count;
        }
        if (this.metadata.skip) {
            metaClone.skip = this.metadata.skip;
        }
        if (this.metadata.take) {
            metaClone.take = this.metadata.take;
        }
        if (this.metadata.distinct) {
            metaClone.distinct = this.metadata.distinct;
        }
        if (this.metadata.properties && this.metadata.properties.length) {
            metaClone.properties = this.metadata.properties;
        }
        if (this.metadata.sorts && this.metadata.sorts.length) {
            metaClone.sorts = this.metadata.sorts;
        }
        if (this.metadata.where && Filter.isEmpty(this.metadata.where) === false) {
            metaClone.where = JSON.stringify(this.metadata.where.toJSON());
        }
        return metaClone;
    }

}

const STANDARD_METADATA = ['properties', 'where', 'sorts', 'from', 'skip', 'take', 'distinct', 'count', 'model', 'headers'];

export default GetRequest;