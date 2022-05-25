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
let globalFetch = null;
const lazyLoadGlobalFetch = async () => {
    if (globalFetch) {
        if (IS_BROWSER) {
            globalFetch = window.fetch;
        } else {
            globalFetch = await import('node-fetch').default;
        }
    }
};

/**
 * @typedef FetchEngineConfiguration
 * @property {String} [root] - The root URI of each fetch request. If specified, will be prefixed to each resource.
 * @property {String} [path="/api"] - The path to the URI endpoint. This is prefixed before each resource, but after 
 * the `root` (if specified).
 * @property {String} [modelResourceTarget="plural.slug"] - Optional configuration that instructs the engine which model
 * `$stashku` property to use for the resource name. Can be `"name"`, `"slug"`, `"plural.name"`, or `"plural.slug"`
 * (default).
 * @property {RequestInit} [fetch] - Optional fetch defaults to apply before request-specific configuration is set.
 */

/**
 * @typedef {FetchEngineConfiguration} FetchRequestHeader
 */

/**
 * This StashKu engine is built-in and provides an engine to make requests to HTTP endpoints using `fetch`. Requests 
 * correspond to their HTTP request method.
 */
class FetchEngine extends BaseEngine {
    /**
     * Creates a new `MemoryStorageEngine` instance.
     */
    constructor() {
        super('fetch');

        /**
         * @type {Map.<String, Array>}
         */
        this.data = new Map();

        /**
         * @type {MemoryStorageEngineConfiguration}
         */
        this.config = {
            root: null,
            path: '/api',
            modelResourceTarget: 'plural.slug'
        };
    }

    /**
     * @inheritdoc
     * @param {MemoryStorageEngineConfiguration} config - The configuration object for the storage engine.
     */
    configure(config) {
        super.configure(config);
        let defaults = {
            root: null,
            path: '/api',
            modelResourceTarget: 'plural.slug'
        };
        if (IS_BROWSER === false) {
            if (typeof process.env.STASHKU_FETCH_ROOT === 'string') {
                defaults.root = process.env.STASHKU_FETCH_ROOT;
            }
            if (typeof process.env.STASHKU_FETCH_PATH === 'string') {
                defaults.path = process.env.STASHKU_FETCH_PATH;
            }
            if (typeof process.env.STASHKU_FETCH_MODEL_RESOURCE_TARGET === 'string') {
                defaults.modelResourceTarget = process.env.STASHKU_FETCH_MODEL_RESOURCE_TARGET;
            }
        }
        this.config = Object.assign(defaults, config);
    }

    /**
     * Builds the full target URI for the fetch request based on engine settings.
     * The resource may be the literal resource target (string) or a model type.
     * 
     * @throws Error if the resource value is null or undefined.
     * @throws Error if a model type was specified but it is missing the resource value under the configured 
     * resource target.
     * @param {String|Modeling.AnyModelType} resource - The resource name (or model type).
     * @returns {String}
     * @private
     */
    _uri(resource) {
        if (resource !== null && typeof resource !== 'undefined') {
            if (resource.$stashku) {
                switch (this.config.modelResourceTarget) {
                    case 'name': resource = resource.$stashku.name; break;
                    case 'slug': resource = resource.$stashku.slug; break;
                    case 'plural.name': resource = resource.$stashku?.plural?.slug; break;
                    default:
                        resource = resource.$stashku?.plural?.slug;
                        break;
                }
                if (resource === null || typeof resource !== 'undefined') {
                    throw new Error(`The model did not define a resource value under "$stashku.${this.config.modelResourceTarget}.`);
                }
            }
            return [this.config.root, this.config.path, resource].map(function (i) {
                return i.replace(/(^\/|\/$)/, '');
            }).join('/');
        }
        throw new Error('The "resource" argument is required.');
    }

    /**
     * Serializes the given object into a query paramater (URL) string.
     * @param {*} obj - the object
     * @param {*} prefix - the prefix
     * @returns {String}
     * @private
     */
    _paramSerialize(obj, prefix) {
        let str = [], p;
        for (p in obj) {
            if (typeof obj[p] !== 'undefined') {
                let k = prefix ? prefix + '[' + p + ']' : p,
                    v = obj[p];
                if (v !== null && typeof v === 'object') {
                    if (v instanceof Date) {
                        str.push(encodeURIComponent(k) + '=' + encodeURIComponent(v.toISOString()));
                    } else {
                        str.push(this._paramSerialize(v, k));
                    }
                } else {
                    str.push(encodeURIComponent(k) + '=' + encodeURIComponent(v));
                }
            }
        }
        return str.join('&');
    }

    /**
     * Makes a fetch call to a remote endpoint and returns the response.
     * @param {String|Modeling.AnyModelType} resource - The resource name (or model type).
     * @param {*} data - The data to be sent.
     * @param {RequestInit} settings - The `fetch` settings to apply.
     * @returns {Promise.<globalThis.Response>}
     * @private
     */
    async _fetch(resource, data, settings) {
        settings = Object.assign({
            method: 'GET',
            cache: 'no-cache'
        }, this.config.fetch, settings);
        let targetURI = this._uri(resource);
        if (data) {
            if (settings.method === 'GET') {
                targetURI += '?' + this._paramSerialize(data);
            } else {
                settings.headers['Content-Type'] = 'application/json';
                settings.body = JSON.stringify(data);
            }
        }
        await lazyLoadGlobalFetch();
        return globalFetch(targetURI, settings);
    }

    /**
     * @inheritdoc
     * @returns {Array.<String>}
     */
    async resources() {
        return this._fetch('resources');
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
        //todo
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
            //todo
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
            //todo
        }
        return Response.empty();
    }
    /**
     * @override
     * @throws 404 Error when the requested resource is has not been stored in memory.
     * @param {PatchRequest} request - The PATCH request to send to the storage engine.
     * @returns {Promise.<Response>} Returns a response with the total number of the objects affected in storage. No data
     * objects are typically returned with this request.
     */
    async patch(request) {
        //validate
        await super.patch(request);
        let meta = request.metadata;
        let to = this.resourceOf(request);
        if (this.data.has(to) === false) {
            throw new RESTError(404, `The requested resource "${meta.to}" was not found.`);
        }
        //todo
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
        //todo
    }

    /**
     * @override
     * @throws 404 Error when the requested resource is has not been stored in memory.
     * @param {OptionsRequest} request - The OPTIONS request to send to the storage engine.
     * @returns {Promise.<Response>} Returns a response with a single data object- the dynamically created model configuration.
     */
    async options(request) {
        //validate
        await super.options(request);
        let meta = request.metadata;
        //todo
    }

}

export default FetchEngine;