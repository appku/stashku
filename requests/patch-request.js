///<reference path="../modeling/modeling.d.js" />
import Filter from '../filter.js';
import ModelUtility from '../modeling/model-utility.js';

/**
 * This class defines a StashKu PATCH request that instructs StashKu to update objects from storage with the specified
 * properties and values.
 */
class PatchRequest {
    /**
     * Creates a new `PatchRequest` instance. A PATCH request instructs StashKu to update objects from storage with 
     * the specified properties and values.
     * @param  {*} [template] - A template object with properties and values to update in matching objects.
     */
    constructor(template) {

        this.metadata = {
            /** @type {Boolean} */
            all: false,
            /** @type {*} */
            template: null,
            /** @type {Filter} */
            where: null,
            /** @type {String} */
            to: null,
            /** @type {Boolean} */
            count: false,
            /** @type {Map.<String, *>} */
            headers: null
        };

        if (template) {
            this.template(template);
        }
    }

    /**
     * @type {String}
     */
    get method() {
        return 'patch';
    }

    /**
     * Applies a StahKu-compatible model's metadata & configuration *not already defined* to this request.
     * 
     * If a `null` value is passed, the model is removed - but metadata on the request will remain.
     * @throws Error when the `modelType` argument is not `null`, a class, or a constructor object.
     * @param {Modeling.AnyModelType} modelType - The model "class" or constructor function.
     * @param {Boolean} [overwrite = false] - Optional flag that, when `true`, overwrites request settings and values
     * with the model's (where applicable).
     * @param {String} [resourceProp="resource"] - The resource property used from the model type to set the resource on
     * this request.
     * @returns {PatchRequest}
     * @private
     */
    model(modelType, overwrite = false, resourceProp = 'resource') {
        if (modelType !== null && ModelUtility.isValidType(modelType) === false) {
            throw new Error('Invalid "modelType" argument. The value must be null, a class, or a constructor object');
        }
        if (modelType) {
            if (overwrite === true || !this.metadata.to) {
                this.to(ModelUtility.resource(modelType, this.method, resourceProp));
            }
            if (this.metadata.template) {
                for (let m of ModelUtility.unmodel(modelType, this.method, this.metadata.template)) {
                    this.metadata.template = m;
                }
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
     * Calling this function without an argument *enables* counting without data.
     * @param {Boolean} [enabled=true] - A `true` enables the count-only result. A `false` disables it.
     * @returns {PatchRequest}
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
     * Enables the update of all objects in data storage if no `where` conditions are specified. If conditions are
     * specified, this setting will be ignored.
     * 
     * Calling this method without an argument will set the request to *enable* the deletion of all objects.
     * @param {Boolean} [enabled=true] - Enable or disable the deletion of all records when no `where` filters have
     * been defined.
     * @returns {PatchRequest}
     */
    all(enabled) {
        if (arguments.length === 0) {
            enabled = true;
        }
        this.metadata.all = !!enabled;
        return this;
    }

    /**
     * Sets a template object with properties and values to update in objects matched by this PATCH request.
     * If a `null` value is passed, the template is removed and no updates will occur.
     * @param  {*} [template] - A template object with properties and values to update.
     * @returns {PatchRequest}
     */
    template(template) {
        let ttype = typeof template;
        if (ttype !== 'object' || Array.isArray(template)) {
            throw new Error('Invalid "template" argument. The template value must be null or an object.');
        }
        if (!template) {
            this.metadata.template = null;
        } else {
            this.metadata.template = template;
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
     * @returns {PatchRequest}
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
     * @returns {PatchRequest}
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
     * @returns {PatchRequest}
     */
    clear() {
        if (!this.metadata) {
            this.metadata = {};
        }
        this.metadata.template = null;
        this.metadata.where = null;
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
     * @returns {PatchRequest}
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
        if (this.metadata.template) {
            metaClone.template = this.metadata.template;
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

const STANDARD_METADATA = ['all', 'template', 'where', 'to', 'count', 'headers'];

export default PatchRequest;