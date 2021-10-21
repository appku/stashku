import PatchRequest from './patch-request.js';
import ModelUtility from '../modeling/model-utility.js';

/**
 * This class defines a StashKu PUT request that instructs StashKu to update existing objects in storage.
 */
export default class PutRequest {
    /**
     * Creates a new `PutRequest` instance. A PUT request instructs StashKu to update existing objects in storage.
     * @param {Array.<String>} [pk] - The property name(s) that are used to uniquely identify each object.
     * @param  {...String} [objects] - Spread of objects to create in update in storage.
     */
    constructor(pk, ...objects) {

        this.metadata = {
            /** @type {Array.<String>} */
            pk: [],
            /** @type {Array} */
            objects: [],
            /** @type {String} */
            to: null,
            /** @type {Boolean} */
            count: false,
            /** @type {*} */
            model: null,
            /** @type {Object} */
            headers: {}
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
     * @param {*} modelType - The model "class" or constructor function.
     * @returns {PutRequest}
     * @private
     */
    model(modelType) {
        if (modelType !== null && ModelUtility.isValidType(modelType) === false) {
            throw new Error('Invalid "modelType" argument. The value must be null, a class, or a constructor object');
        }
        this.metadata.model = modelType;
        if (modelType) {
            if (this.metadata.to === null) {
                this.to(ModelUtility.resource(modelType, this.method));
            }
            if (!this.metadata.pk || !this.metadata.pk.length) {
                this.pk(...ModelUtility.pk(modelType));
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
     * Defines the primary key property name(s) used to uniquely identify each object defined in the request and storage
     * resource.    
     * If a `null` value is passed, all PKs are cleared from the request.
     * @param  {...String|Array.<String>} primaryKeys - Spread of property names used to uniquely identify each object.
     * @returns {PutRequest}
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
                if (k !== null && typeof k !== 'string') {
                    throw new Error('Invalid "primaryKeys" argument. The array contains a non-string value.');
                }
                if (k && this.metadata.pk.indexOf(k) < 0) {
                    this.metadata.pk.push(k);
                }
            }
        }
        return this;
    }

    /**
     * Adds objects to the PUT request. If any object has already been added to the request, it is skipped.    
     * If a single `null` value is passed, all objects are cleared from the request.
     * @param  {...any} [objects] - Spread of objects to update in data storage, as matched by `pk` property
     * values.
     * @returns {PutRequest}
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
     * @returns {PutRequest}
     */
    to(name) {
        if (name === null) {
            this.metadata.to = null;
            return this;
        } else if (typeof name !== 'string') {
            throw new Error('Invalid "name" argument. The value must be a string or null.');
        }
        this.metadata.to = name;
        return this;
    }

    /**
     * Clears all configured metadata on the request, resetting it to a default state.
     * @returns {PutRequest}
     */
    clear() {
        if (!this.metadata) {
            this.metadata = {};
        }
        this.metadata.pk = [];
        this.metadata.objects = [];
        this.metadata.to = null;
        this.metadata.headers = {};
        return this;
    }

    /**
     * Merges custom engine-specific request settings into the request metadata. Setting a `null` will remove all
     * non-standard metadata properties. You may not set standard metadata with this method, use the appropriate method calls.
     * @throws Error when a standardized request metadata property name is specified.
     * @param {*} metadata - An object with properties and values to set as request metadata for engine-specific functionality.
     * @returns {PutRequest}
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

const STANDARD_METADATA = ['pk', 'objects', 'to', 'count', 'model'];