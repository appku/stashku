///<reference path="../modeling/modeling.d.js" />
import ModelUtility from '../modeling/model-utility.js';

/**
 * This class defines a StashKu PUT request that instructs StashKu to update existing objects in storage.
 * @template M
 */
class PutRequest {
    /**
     * Creates a new `PutRequest` instance. A PUT request instructs StashKu to update existing objects in storage.
     * @param {Array.<String>} [pk] - The property name(s) that are used to uniquely identify each object.
     * @param  {...M} [objects] - Spread of objects to create in update in storage.
     */
    constructor(pk, ...objects) {

        this.metadata = {
            /** @type {Array.<String>} */
            pk: [],
            /** @type {Array.<M>} */
            objects: [],
            /** @type {String} */
            to: null,
            /** @type {Boolean} */
            count: false,
            /** @type {Map.<String, *>} */
            headers: null
        };

        if (Array.isArray(pk)) {
            this.pk(...pk);
        }
        this.objects(...objects);
    }

    /**
     * @type {String}
     */
    get method() {
        return 'put';
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
     * @returns {PutRequest.<M>}
     * @private
     */
    model(modelType, overwrite = false, header = false) {
        if (modelType !== null && ModelUtility.isValidType(modelType) === false) {
            throw new Error('Invalid "modelType" argument. The value must be null, a class, or a constructor object');
        }
        if (modelType) {
            if (overwrite === true || !this.metadata.to) {
                this.to(ModelUtility.resource(modelType, this.method));
            }
            if (header) {
                this.headers({ model: modelType.$stashku });
            }
            if (overwrite === true || !this.metadata.pk || !this.metadata.pk?.length) {
                this
                    .pk(null)
                    .pk(...ModelUtility.pk(modelType));
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
     * @returns {PutRequest.<M>}
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
     * Defines the primary key property name(s) used to uniquely identify each object defined in the request and storage
     * resource.    
     * If a `null` value is passed, all PKs are cleared from the request.
     * @param  {...String|Array.<String | Modeling.PropertyDefinition>} primaryKeys - Spread of property names used to uniquely identify each object.
     * @returns {PutRequest.<M>}
     */
    pk(...primaryKeys) {
        if (Array.isArray(this.metadata.pk) === false) {
            this.metadata.pk = [];
        }
        if (!primaryKeys || (primaryKeys.length === 1 && primaryKeys[0] === null)) {
            this.metadata.pk = [];
        } else {
            primaryKeys = primaryKeys.flat();
            for (let k of primaryKeys) {
                let prop = k;
                if (k.target && typeof k.target === 'string') {
                    prop = k.target;
                }
                if (typeof prop !== 'string') {
                    throw new Error('Invalid "primaryKeys" argument. The array contains a non-string value.');
                }
                if (prop && this.metadata.pk.indexOf(prop) < 0) {
                    this.metadata.pk.push(prop);
                }
            }
        }
        return this;
    }

    /**
     * Adds objects to the PUT request. If any object has already been added to the request, it is skipped.    
     * If a single `null` value is passed, all objects are cleared from the request.
     * @param  {...M} [objects] - Spread of objects to update in data storage, as matched by `pk` property
     * values.
     * @returns {PutRequest.<M>}
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
                    } else if (this.metadata.objects.indexOf(o) < 0) {
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
     * @returns {PutRequest.<M>}
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
     * @returns {PutRequest.<M>}
     */
    clear() {
        if (!this.metadata) {
            this.metadata = {};
        }
        this.metadata.pk = [];
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
     * @returns {PutRequest.<M>}
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
        if (this.metadata.pk && this.metadata.pk.length) {
            metaClone.pk = this.metadata.pk;
        }
        return metaClone;
    }

}

const STANDARD_METADATA = ['pk', 'objects', 'to', 'count', 'model', 'headers'];

export default PutRequest;