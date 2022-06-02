import DeleteRequest from '../requests/delete-request.js';
import GetRequest from '../requests/get-request.js';
import OptionsRequest from '../requests/options-request.js';
import PatchRequest from '../requests/patch-request.js';
import PostRequest from '../requests/post-request.js';
import PutRequest from '../requests/put-request.js';
import Response from '../response.js';
import RESTError from '../rest-error.js';
import Filter from '../filter.js';
import Logger from '../logger.js';
import ModelGenerator from '../modeling/model-generator.js';
import BaseEngine from './base-engine.js';
import Sort from '../sort.js';

const IS_BROWSER = (typeof window !== 'undefined');

/**
 * Compares two objects.
 * @param {*} source - Object to compare.
 * @param {*} target - Another object to compare.
 * @returns {Boolean}
 * @ignore
 */
const objectEqual = (source, target) => {
    if (source === target) {
        return true;
    }
    for (let key in source) {
        if (source[key] !== target[key]) return false;
    }
    return true;
};

/**
 * @typedef MemoryEngineConfiguration
 * @property {Boolean} caseSensitive - Controls whether all resource names are stored in lower-case, and tracked
 * case-insensitively or not. By default this is unset in the configuration which will default to `false` internally
 * and allow it to be overridden by request headers. If set explicitly, the request header's `caseSensitive` flag 
 * will be ignored.
 * @property {Number} limit - Limits the maximum number of objects that can be stored in the memory engine per resource
 * name. If this limit is reached, POST requests will throw an error.
 */

/**
 * @typedef MemoryRequestHeader
 * @property {Boolean} caseSensitive - Instructs the memory storage engine to search for a resource by its lower-case
 * name (`false`) or regular-case (`true`). This will be ignored if the same flag (`caseSensitive`) is set on the 
 * memory storage configuration.
 */

/**
 * This StashKu engine is built-in and provides an in-memory data store with support for all StashKu RESTful actions
 * and operations. 
 */
class MemoryEngine extends BaseEngine {
    /**
     * Creates a new `MemoryEngine` instance.
     */
    constructor() {
        super('memory');

        /**
         * @type {Map.<String, Array>}
         */
        this.data = new Map();

        /**
         * @type {MemoryEngineConfiguration}
         */
        this.config = {
            caseSensitive: null,
            limit: 0
        };
    }

    /**
     * @inheritdoc
     * @param {MemoryEngineConfiguration} config - The configuration object for the storage engine.
     */
    configure(config) {
        super.configure(config);
        let defaults = {
            caseSensitive: null,
            limit: 0
        };
        if (IS_BROWSER === false || (typeof process !== 'undefined' && typeof process.env === 'object')) {
            let limit = parseInt(process.env.STASHKU_MEMORY_LIMIT);
            if (limit) {
                defaults.limit = limit;
            }
            if (typeof process.env.STASHKU_MEMORY_CASE_SENSITIVE === 'string') {
                defaults.caseSensitive = !!process.env.STASHKU_MEMORY_CASE_SENSITIVE.match(/^[tTyY1]/);
            }
        }
        this.config = Object.assign(defaults, config);
    }

    /**
     * @inheritdoc
     * @returns {Promise.<Array.<String>>}
     */
    async resources() {
        return Array.from(this.data.keys());
    }

    /**
     * Finds and adjusts the resource name of the given request with consideration to the case-sensitivity setting
     * on the storage engine or per-request.
     * @param {GetRequest | PatchRequest | PostRequest | PutRequest | OptionsRequest} request - The request to extract
     * the resource (target) name from.
     * @returns {String}
     * @protected
     */
    resourceOf(request) {
        let meta = request.metadata;
        let target = meta.from || meta.to;
        let caseSensitive = null;
        if (meta.headers && meta.headers.has('caseSensitive')) {
            caseSensitive = meta.headers.get('caseSensitive');
        }
        if (typeof this.config.caseSensitive !== 'undefined' && this.config.caseSensitive !== null) {
            caseSensitive = this.config.caseSensitive;
        }
        return caseSensitive ? target : target?.toLowerCase();
    }

    /**
     * @override
     * @throws 404 Error when the requested resource is has not been stored in memory.
     * @param {GetRequest} request - The GET request to send to the storage engine.
     * @returns {Promise.<Response>} Returns the data objects from storage matching request criteria.
     */
    async get(request) {
        //validate
        await super.get(request);
        let meta = request.metadata;
        let from = this.resourceOf(request);
        if (this.data.has(from) === false) {
            throw new RESTError(404, `The requested resource "${meta.from}" was not found.`);
        }
        //find objects
        let matches = this.data.get(from);
        if (meta.where && Filter.isEmpty(meta.where) === false) {
            matches = matches.filter(v => meta.where.test(v));
        }
        //ensure we have a new array with new object references (shallow copy).
        matches = matches.map(v => Object.assign({}, v));
        //apply distinct
        if (meta.distinct) {
            matches = matches.reduce((pv, cu, i, arr) => {
                let exists = pv.some((v) => objectEqual(cu, v));
                if (!exists) {
                    pv.push(cu);
                }
                return pv;
            }, []);
        }
        //perform sorts (no need to run if just counting)
        if (!meta.count && meta.sorts && meta.sorts.length) {
            const fieldSorter = (sorts) => (a, b) => sorts.map(s => {
                let dir = 1;
                if (s.dir === Sort.DIR.DESC) {
                    dir = -1;
                }
                return a[s.property] > b[s.property] ? dir : a[s.property] < b[s.property] ? -(dir) : 0;
            }).reduce((p, n) => p ? p : n, 0);
            matches.sort(fieldSorter(meta.sorts));
        }
        //apply paging
        let total = matches.length; //save the total before reducing
        if (meta.skip && meta.skip > 0) {
            matches.splice(0, meta.skip);
        }
        if (meta.take && meta.take > 0) {
            matches = matches.slice(0, meta.take);
        }
        //handle count-only requests
        if (meta.count) {
            let res = new Response(null, total, 0, matches.length);
            return res;
        } else {
            //apply property limitations (if any)
            if (meta.properties && meta.properties.length) {
                for (let m of matches) {
                    //delete any keys not in specified properties
                    Object.keys(m)
                        .filter(k => meta.properties.indexOf(k) < 0)
                        .map(k => delete m[k]);
                }
            }
            return new Response(matches, total, 0, matches.length);
        }
    }

    /**
     * @override
     * @description
     * This will create the resource in memory if it does not already exist.
     * @param {PostRequest} request - The POST request to send to the storage engine.
     * @returns {Promise.<Response>} Returns the data objects from storage that were created with the request criteria.
     */
    async post(request) {
        //validate
        await super.post(request);
        //process
        let meta = request.metadata;
        if (meta.objects && meta.objects.length) {
            let to = this.resourceOf(request);
            if (this.data.has(to) === false) {
                this.data.set(to, []);
            }
            let resource = this.data.get(to);
            let storageClones = meta.objects.map(v => Object.assign({}, v));
            let responseClones = meta.objects.map(v => Object.assign({}, v));
            if (this.config && this.config.limit && resource.length + storageClones.length > this.config.limit) {
                throw new RESTError(400, `Cannot add additional objects to storage. The limit of ${this.config.limit} objects would be exceeded.`);
            }
            resource.push(...storageClones);
            if (meta.count) {
                return new Response(null, responseClones.length, responseClones.length, responseClones.length);
            } else {
                return new Response(responseClones, responseClones.length, responseClones.length, responseClones.length);
            }
        }
        return Response.empty();
    }

    /**
     * @override
     * @throws 404 Error when the requested resource is has not been stored in memory.
     * @param {PutRequest} request - The PUT request to send to the storage engine.
     * @returns {Promise.<Response>} Returns the data objects from storage that were updated with the request criteria. This 
     * *__could potentially not__* exactly match the objects requested to be updated, as some may have been deleted from storage or
     * some may not match the primary key criteria.
     */
    async put(request) {
        //validate
        await super.put(request);
        let meta = request.metadata;
        let to = this.resourceOf(request);
        if (this.data.has(to) === false) {
            throw new RESTError(404, `The requested resource "${meta.to}" was not found.`);
        }
        //process
        if (meta.objects && meta.objects.length) {
            let resource = this.data.get(to);
            let res = new Response();
            for (let o of meta.objects) {
                //find existing
                let record = resource.filter(r => meta.pk.every(k => r[k] === o[k]));
                if (record.length > 1) {
                    let values = meta.pk.map(k => o[k]);
                    throw new RESTError(409, `Multiple objects exist matching the specified primary keys ("${meta.pk.join('", "')}" with values "=${values.join('; =')}"). Only one to one matches are allowed.`);
                } else if (record.length === 1) {
                    //found a match, update and send in response...
                    Object.assign(record[0], o); //update record with properties/values from o.
                    res.data.push(Object.assign({}, record[0])); //store shallow clone in response so original is not affected.
                }
            }
            //send response
            res.total = res.data.length;
            res.affected = res.data.length;
            res.returned = res.data.length;
            if (meta.count) {
                res.data.length = 0;
            }
            return res;
        }
        return Response.empty();
    }
    /**
     * @override
     * @throws 404 Error when the requested resource is has not been stored in memory.
     * @param {PatchRequest} request - The PATCH request to send to the storage engine.
     * @returns {Promise.<Response>} Returns a response with the total number of the objects affected in storage. No
     * data objects are typically returned with this request.
     */
    async patch(request) {
        //validate
        await super.patch(request);
        let meta = request.metadata;
        let to = this.resourceOf(request);
        if (this.data.has(to) === false) {
            throw new RESTError(404, `The requested resource "${meta.to}" was not found.`);
        }
        //find objects
        let matches = this.data.get(to);
        if (meta.where && Filter.isEmpty(meta.where) === false) {
            matches = matches.filter(v => meta.where.test(v));
        }
        //perform update
        matches.map(m => Object.assign(m, meta.template));
        if (meta.count) {
            return new Response(null, matches.length, matches.length, matches.length);
        } else {
            let responseClones = matches.map(v => Object.assign({}, v));
            return new Response(responseClones, responseClones.length, responseClones.length, responseClones.length);
        }
    }

    /**
     * @override
     * @description
     * If the last item from memory is deleted, the resource is also deleted from memory (resulting in a 404 for the
     * resource until a new record is added under that resource name).
     * @throws 404 Error when the requested resource is has not been stored in memory.
     * @param {DeleteRequest} request - The DELETE request to send to the storage engine.
     * @returns {Promise.<Response>} Returns the data objects from storage that were deleted with the request criteria.
     */
    async delete(request) {
        await super.delete(request); //validate
        let meta = request.metadata;
        let from = this.resourceOf(request);
        if (this.data.has(from) === false) {
            throw new RESTError(404, `The requested resource "${meta.from}" was not found.`);
        }
        //find objects
        let matches = this.data.get(from);
        if (meta.where && Filter.isEmpty(meta.where) === false) {
            matches = matches.filter(v => meta.where.test(v));
        }
        //perform delete
        let storage = this.data.get(from);
        for (let m of matches) {
            let index = storage.findIndex(v => v === m);
            if (index >= 0) {
                storage.splice(index, 1);
            }
        }
        if (meta.count) {
            return new Response(null, matches.length, matches.length, matches.length);
        } else {
            return new Response(matches, matches.length, matches.length, matches.length);
        }
    }

    /**
     * @override
     * @throws 404 Error when the requested resource is has not been stored in memory.
     * @param {OptionsRequest} request - The OPTIONS request to send to the storage engine.
     * @returns {Promise.<Response>} Returns a response with a single data object- the dynamically created model
     * configuration.
     */
    async options(request) {
        //validate
        await super.options(request);
        let meta = request.metadata;
        let resources = [];
        let modelTypes = [];
        if (request.metadata.from === '*') {
            resources.push(...this.data.keys());
        } else {
            resources.push(this.resourceOf(request));
        }
        for (let from of resources) {
            if (this.data.has(from) === false) {
                throw new RESTError(404, `The requested resource "${meta.from}" was not found.`);
            }
            let properties = new Map();
            let matches = this.data.get(from);
            //find properties - evaluate all records in resource
            for (let m of matches) {
                let keys = Object.keys(m);
                for (let k of keys) {
                    //build definition
                    let def = properties.get(k);
                    if (properties.has(k) === false) {
                        def = {
                            target: k,
                            type: m[k]?.constructor?.name || null,
                        };
                        properties.set(k, def);
                    }
                    //keep trying to discover the type if a value has not been previously found.
                    if (typeof def.type === 'undefined' || def.type === null) {
                        def.type = m[k]?.constructor?.name || null;
                    }
                }
            }
            //generate model type and return
            let mt = ModelGenerator.generateModelType(from, properties, { resource: from });
            modelTypes.push(mt);
        }
        return new Response(modelTypes, modelTypes.length, 0, modelTypes.length);
    }

}

export default MemoryEngine;