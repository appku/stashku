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
/* istanbul ignore next */
const lazyLoadGlobalFetch = async () => {
    if (!globalFetch) {
        if (IS_BROWSER) {
            globalFetch = window.fetch; // eslint-disable-line no-undef
        } else if (fetch) { // eslint-disable-line no-undef
            globalFetch = fetch; // eslint-disable-line no-undef
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
 * @property {Boolean} [trailingSlash=false] - Sets whether a slash will be added at the end of the generated URI.
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
            path: null,
            modelResourceTarget: 'plural.slug',
            trailingSlash: false
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
            path: null,
            modelResourceTarget: 'plural.slug',
            trailingSlash: false
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
            if (typeof process.env.STASHKU_FETCH_TRAILING_SLASH === 'string') {
                defaults.trailingSlash = !!process.env.STASHKU_FETCH_TRAILING_SLASH.match(/^[tTyY1]/);
            }
        }
        defaults = Object.assign(defaults, config);
        if (defaults.modelResourceTarget && ['name', 'slug', 'plural.name', 'plural.slug'].indexOf(defaults.modelResourceTarget) < 0) {
            throw new Error('Invalid "modelResourceTarget" configuration value. The value must be "name", "slug", "plural.name", or "plural.slug".');
        }
        this.config = defaults;
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
        if (resource === null || typeof resource === 'undefined') {
            resource = '';
        }
        if (resource.$stashku) {
            switch (this.config.modelResourceTarget) {
                case 'name': resource = resource.$stashku.name; break;
                case 'slug': resource = resource.$stashku.slug; break;
                case 'plural.name': resource = resource.$stashku?.plural?.name; break;
                default:
                    resource = resource.$stashku?.plural?.slug;
                    break;
            }
            if (resource === null || typeof resource === 'undefined') {
                throw new Error(`The model did not define a resource value under "$stashku.${this.config.modelResourceTarget}.`);
            }
        }
        let uri = [this.config.root, this.config.path, resource].filter(v => typeof v === 'string').map(function (i) {
            return i.replace(/(^\/|\/$)/g, '');
        }).join('/');
        if (this.config.trailingSlash && uri.endsWith('/') === false && uri.indexOf('?') < 0) {
            uri += '/';
        } else if (this.config.trailingSlash !== true && uri.endsWith('/')) {
            uri = uri.substring(0, uri.length - 1);
        }
        if (uri.startsWith('/') === false && !this.config.root && !uri.match(/^.+\/\/+/)) {
            uri = '/' + uri;
        }
        return uri;
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
        if (!str || str.length === 0) {
            return null;
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
            method: 'get',
            cache: 'no-cache'
        }, this.config.fetch, settings);
        let targetURI = this._uri(resource);
        if (data) {
            if (settings.method === 'get') {
                let params = this._paramSerialize(data);
                if (params) {
                    targetURI += '?' + this._paramSerialize(data);
                }
            } else {
                if (!settings.headers) {
                    settings.headers = {};
                }
                settings.headers['Content-Type'] = 'application/json';
                settings.body = JSON.stringify(data);
            }
        }
        await lazyLoadGlobalFetch();
        return globalFetch(targetURI, settings);
    }

    /**
     * @inheritdoc
     * @returns {Promise.<Array.<String>>}
     */
    async resources() {
        let res = await this._fetch('resources');
        let results = await res.json();
        return results.data;
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
        //make the request, wrap errors in RESTError
        try {
            let payload = request.toJSON();
            if (request.metadata.from === payload.from) { //when the request from and the uri resource are the same, there's no need to send the from parameter.
                delete payload.from;
            }
            let res = await this._fetch(request.metadata.from, payload);
            if (res.ok === false) {
                throw new RESTError(res.status, `Error from fetched resource ("${this._uri(request.metadata.from)}") in "${request.method}" request: ${res.statusText}`);
            }
            return await res.json();
        } catch (err) {
            throw new RESTError(500, err.message, err);
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
            //make the request, wrap errors in RESTError
            try {
                let res = await this._fetch(request.metadata.to, request, { method: request.method });
                if (res.ok === false) {
                    throw new RESTError(res.status, `Error from fetched resource ("${this._uri(request.metadata.to)}") in "${request.method}" request: ${res.statusText}`);
                }
                return await res.json();
            } catch (err) {
                throw new RESTError(500, err.message, err);
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
        //process
        let meta = request.metadata;
        if (meta.objects && meta.objects.length) {
            //make the request, wrap errors in RESTError
            try {
                let res = await this._fetch(request.metadata.to, request, { method: request.method });
                if (res.ok === false) {
                    throw new RESTError(res.status, `Error from fetched resource ("${this._uri(request.metadata.to)}") in "${request.method}" request: ${res.statusText}`);
                }
                return await res.json();
            } catch (err) {
                throw new RESTError(500, `Critical error attempting to process fetch for resource ("${this._uri(request.metadata.to)}") in "${request.method}" request: ${err.message}`, err);
            }
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
        //process
        let meta = request.metadata;
        if (meta.template) {
            //make the request, wrap errors in RESTError
            try {
                let res = await this._fetch(request.metadata.to, request, { method: request.method });
                if (res.ok === false) {
                    throw new RESTError(res.status, `Error from fetched resource ("${this._uri(request.metadata.to)}") in "${request.method}" request: ${res.statusText}`);
                }
                return await res.json();
            } catch (err) {
                throw new RESTError(500, err.message, err);
            }
        }
        return Response.empty();
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
        //validate
        await super.delete(request);
        //process
        let meta = request.metadata;
        if (meta.all || (meta.where && Filter.isEmpty(meta.where) === false)) {
            //make the request, wrap errors in RESTError
            try {
                let res = await this._fetch(request.metadata.to, request, { method: request.method });
                if (res.ok === false) {
                    throw new RESTError(res.status, `Error from fetched resource ("${this._uri(request.metadata.from)}") in "${request.method}" request: ${res.statusText}`);
                }
                return await res.json();
            } catch (err) {
                throw new RESTError(500, err.message, err);
            }
        }
        return Response.empty();
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
        //process
        let meta = request.metadata;
        if (meta.objects && meta.objects.length) {
            //make the request, wrap errors in RESTError
            try {
                let res = await this._fetch(request.metadata.to, request, { method: request.method });
                if (res.ok === false) {
                    throw new RESTError(res.status, `Error from fetched resource ("${this._uri(request.metadata.from)}") in "${request.method}" request: ${res.statusText}`);
                }
                return await res.json();
            } catch (err) {
                throw new RESTError(500, err.message, err);
            }
        }
        return Response.empty();
    }

}

export default FetchEngine;