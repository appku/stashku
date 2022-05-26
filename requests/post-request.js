import ModelUtility from '../modeling/model-utility.js';

/**
 * This class defines a StashKu POST request that instructs StashKu to create a new object in storage.
 */
class PostRequest {
    /**
     * Creates a new `PostRequest` instance. A POST request instructs StashKu to create a new object in storage.
     * @param  {...String} [objects] - Spread of objects to create in data storage.
     */
    constructor(...objects) {

        this.metadata = {
            /** @type {Array} */
            objects: [],
            /** @type {String} */
            to: null,
            /** @type {Boolean} */
            count: false,
            /** @type {Map.<String, *>} */
            headers: null
        };

        this.objects(...objects);
    }

    /**
     * @type {String}
     */
    get method() {
        return 'post';
    }

    /**
     * Applies a StahKu-compatible model's metadata & configuration *not already defined* to this request.
     * 
     * If a `null` value is passed, the model is removed - but metadata on the request will remain.
     * @throws Error when the `modelType` argument is not `null`, a class, or a constructor object.
     * @param {Modeling.AnyModelType} modelType - The model "class" or constructor function.
     * @param {Boolean} [overwrite = false] - Optional flag that, when `true`, overwrites request settings and values
     * with the model's (where applicable).
     * @returns {PostRequest}
     * @private
     */
    model(modelType, overwrite = false) {
        if (modelType !== null && ModelUtility.isValidType(modelType) === false) {
            throw new Error('Invalid "modelType" argument. The value must be null, a class, or a constructor object');
        }
        if (modelType) {
            if (overwrite === true || !this.metadata.to) {
                this.to(ModelUtility.resource(modelType, this.method));
            }
            if (this.metadata.objects) {
                this.metadata.objects = Array.from(ModelUtility.unmodel(modelType, this.method, ...this.metadata.objects));
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
     * @returns {PostRequest}
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
     * Adds objects to the POST request. If any object has already been added to the request, it is skipped.    
     * If a single `null` value is passed, all objects are cleared from the request.
     * @param  {...any} [objects] - Spread of objects to create in data storage.
     * @returns {PostRequest}
     */
    objects(...objects) {
        if (Array.isArray(this.metadata.objects) === false) {
            this.metadata.objects = [];
        }
        if (!objects || (objects.length === 1 && objects[0] === null)) {
            this.metadata.objects.length = 0;
        } else {
            objects = objects.flat(Infinity);
            for (let o of objects) {
                let ttype = typeof o;
                if (o !== null && ttype !== 'undefined') {
                    if (ttype !== 'object') {
                        throw new Error('Invalid "objects" argument. Values must be an object.');
                    } else {
                        this.metadata.objects.push(o);
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
     * @returns {PostRequest}
     */
    to(name) {
        if (name !== null && typeof name !== 'string') {
            throw new Error('Invalid "name" argument. The value must be a string or null.');
        }
        this.metadata.to = name;
        return this;
    }

    /**
     * Clears all configured metadata on the request, resetting it to a default state.
     * @returns {PostRequest}
     */
    clear() {
        if (!this.metadata) {
            this.metadata = {};
        }
        this.metadata.objects = [];
        this.metadata.to = null;
        this.metadata.headers = null;
        return this;
    }

    /**
     * Sets or clears headers on the request that can be used to set engine-specific options for the request.
     * If a `null` value is passed, the headers are cleared.
     * @throws Error when the dictionary argument uses a non-string key.
     * @throws Error when the dictionary argument is not an object, null, or a Map.
     * @param {Object | Map.<String, *>} dictionary - A map or object defining the headers and values.
     * @returns {PostRequest}
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
        let metaClone = { to: this.metadata.to };
        if (this.metadata.headers) {
            metaClone.headers = Object.fromEntries(this.metadata.headers);
        }
        if (this.metadata.count) {
            metaClone.count = this.metadata.count;
        }
        if (this.metadata.objects && this.metadata.objects.length) {
            metaClone.objects = this.metadata.objects;
        }
        return metaClone;
    }

}

const STANDARD_METADATA = ['objects', 'to', 'count', 'model', 'headers'];

export default PostRequest;