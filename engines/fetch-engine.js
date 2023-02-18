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

const IS_BROWSER = !(typeof process !== 'undefined' && process.version);
let GlobalFetch = null;
let GlobalFetchHeaders = null;
/* istanbul ignore next */
const lazyLoadGlobalFetch = async () => {
    if (!GlobalFetch) {
        if (IS_BROWSER) {
            GlobalFetch = window.fetch; // eslint-disable-line no-undef
            GlobalFetchHeaders = window.Headers; // eslint-disable-line no-undef
        } else if (typeof fetch !== 'undefined' && Headers) { // eslint-disable-line no-undef
            GlobalFetch = fetch; // eslint-disable-line no-undef
            GlobalFetchHeaders = Headers; // eslint-disable-line no-undef
        } else {
            let module = await import(/* webpackIgnore: true */'node-fetch');
            GlobalFetchHeaders = module.Headers;
            GlobalFetch = module.default;
        }
    }
};

/**
 * @typedef FetchEngine.ModelConfiguration
 * @property {String} [pathProperty="resource"] - Instructs StashKu which property from the `$stashku` object on
 * a model type to populate the resource (`to` or `from`) on a request. Can be `"name"`, `"slug"`, `"plural.name"`, 
 * `"plural.slug"`, or `"resource"` (default).
 * @property {Boolean} [header=false] - Determines whether the fetch request to the HTTP endpoint will include the
 * model header when `STASHKU_MODEL_HEADER` is enabled. By default this is disabled and the header `model` property
 * will *not* be sent. Setting this flag to `true` will forward the `model` header of the StashKu request.
 */

/**
 * @typedef FetchEngine.Configuration
 * @property {String} [root] - The root URI of each fetch request. If specified, will be prefixed to each resource.
 * @property {String} [path="/api"] - The path to the URI endpoint. This is prefixed before each resource, but after 
 * the `root` (if specified).
 * @property {Boolean} [trailingSlash=false] - Sets whether a slash will be added at the end of the generated URI.
 * @property {Boolean} [omitResource=false] - Omits `to` and `from` properties and values from the request payload
 * sent over fetch. This may help force endpoints to ensure the resource is determined on their end instead of by
 * the requestor.
 * @property {FetchEngine.ModelConfiguration} [model]
 * @property {RequestInit} [fetch] - Optional fetch defaults to apply before request-specific configuration is set.
 */

/**
 * This StashKu engine is built-in and provides an engine to make requests to HTTP endpoints using `fetch`. Requests 
 * correspond to their HTTP request method.
 */
class FetchEngine extends BaseEngine {
    /**
     * Creates a new `FetchEngine` instance.
     */
    constructor() {
        super('fetch');

        /**
         * @type {Map.<String, Array>}
         */
        this.data = new Map();

        /**
         * @type {FetchEngine.Configuration}
         */
        this.config = {
            root: null,
            path: null,
            trailingSlash: false,
            omitResource: false
        };
    }

    /**
     * @inheritdoc
     * @param {FetchEngine.Configuration} config - The configuration object for the storage engine.
     */
    configure(config) {
        super.configure(config);
        let defaults = {
            root: null,
            path: null,
            trailingSlash: false
        };
        let modelDefaults = {
            header: false,
            pathProperty: 'resource'
        };
        if (IS_BROWSER === false || (typeof process !== 'undefined' && typeof process.env === 'object')) {
            if (typeof process.env.STASHKU_FETCH_ROOT === 'string') {
                defaults.root = process.env.STASHKU_FETCH_ROOT;
            }
            if (typeof process.env.STASHKU_FETCH_PATH === 'string') {
                defaults.path = process.env.STASHKU_FETCH_PATH;
            }
            if (typeof process.env.STASHKU_FETCH_TRAILING_SLASH === 'string') {
                defaults.trailingSlash = !!process.env.STASHKU_FETCH_TRAILING_SLASH.match(/^[tTyY1]/);
            }
            if (typeof process.env.STASHKU_FETCH_OMIT_RESOURCE === 'string') {
                defaults.omitResource = !!process.env.STASHKU_FETCH_OMIT_RESOURCE.match(/^[tTyY1]/);
            }
            if (typeof process.env.STASHKU_FETCH_MODEL_HEADER === 'string') {
                modelDefaults.header = !!process.env.STASHKU_FETCH_MODEL_HEADER.match(/^[tTyY1]/);
            }
            if (typeof process.env.STASHKU_FETCH_MODEL_PATH_PROPERTY === 'string') {
                modelDefaults.pathProperty = process.env.STASHKU_FETCH_MODEL_PATH_PROPERTY;
            }
        }
        defaults = Object.assign(defaults, config);
        defaults.model = Object.assign({}, modelDefaults, defaults.model);
        //validate config
        if (this.config?.model?.pathProperty && ['resource', 'name', 'slug', 'plural.name', 'plural.slug'].indexOf(this.config.model.pathProperty) < 0) {
            throw new Error(`Invalid "model.pathProperty" configuration value "${this.config?.model?.pathProperty}". The value must be "resource", "name", "slug", "plural.name", or "plural.slug".`);
        }
        this.config = defaults;
    }

    /**
     * Serializes the given object into a query paramater (URL) string.
     * @param {*} obj - The object to be serialized
     * @param {String} [prefix] - When traversing an object, assign this prefix of the prior object key (recursive).
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
     * Builds the full target URI for the fetch request based on engine settings.
     * The resource may be the literal resource target (string) or a model type.
     * 
     * @throws Error if the resource value is null or undefined.
     * @throws Error if a model type was specified but it is missing the resource value under the configured 
     * resource target.
     * @param {String} resourcePath - The resource (path).
     * @returns {String}
     * @private
     */
    _uri(resourcePath) {
        if (resourcePath === null || typeof resourcePath === 'undefined') {
            resourcePath = '';
        }
        let uri = [this.config.root, this.config.path, resourcePath].filter(v => typeof v === 'string').map(function (i) {
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
     * Makes a fetch call to a remote endpoint and returns the response.
     * @param {String} resourcePath - The resource (path) to fetch.
     * @param {*} data - The data to be sent.
     * @param {RequestInit} settings - The `fetch` settings to apply.
     * @returns {Promise.<globalThis.Response>}
     * @private
     */
    async _fetch(resourcePath, data, settings) {
        await lazyLoadGlobalFetch();
        settings = Object.assign({
            method: 'GET',
            cache: 'no-cache',
            headers: new GlobalFetchHeaders({
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            })
        }, this.config.fetch, settings);
        let targetURI = this._uri(resourcePath);
        settings.method = settings.method.toUpperCase(); //always upper
        if (data) {
            if (settings.method === 'GET') {
                let params = this._paramSerialize(data);
                if (params) {
                    targetURI += '?' + this._paramSerialize(data);
                }
            } else {
                if (!settings.headers) {
                    settings.headers = {};
                }
                settings.body = JSON.stringify(data);
            }
        }
        let result = null;
        try {
            result = await GlobalFetch(targetURI, settings);
            //check for standard response errors, and throw.
            if (!result.ok) {
                let payload = await result.json();
                if (payload && typeof payload.code === 'number') {
                    let resError = new RESTError(payload.code, payload.message || `Failed to fetch URI "${targetURI}": ${result.status} ${result.statusText}`);
                    resError.data = payload.data;
                    throw resError;
                }
                throw new RESTError(result.status, `Failed to fetch URI "${targetURI}": ${result.status} ${result.statusText}`);
            }
        } catch (err) {
            if (err instanceof RESTError) {
                throw err;
            } else {
                throw new RESTError(500, `Failed run fetch for URI "${targetURI}": ${err.message}`, err);
            }
        }
        return result;
    }

    /**
     * Determines the resource path to use for the fetch request.
     * @param {DeleteRequest | GetRequest | PatchRequest | PostRequest | PutRequest | OptionsRequest} request - The 
     * StashKu request to extract the proper resource path from.
     * @returns {String}
     * @private
     */
    _getResourcePath(request) {
        let resource = null;
        if (this.config.model.pathProperty && request.metadata.headers) {
            let modelHeader = request.metadata.headers.get('model');
            if (modelHeader) {
                switch (this.config.model.pathProperty) {
                    case 'name': resource = modelHeader.name; break;
                    case 'slug': resource = modelHeader.slug; break;
                    case 'plural.name': resource = modelHeader.plural.name; break;
                    case 'plural.slug': resource = modelHeader.plural.slug; break;
                }
            }
        }
        if (!resource) {
            resource = request.metadata.from || request.metadata.to;
        }
        return resource;
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
     * @param {GetRequest} request - The GET request to send to the storage engine.
     * @returns {Promise.<Response>} Returns the data objects from storage matching request criteria.
     */
    async get(request) {
        //validate
        await super.get(request);
        //make the request, wrap errors in RESTError
        let payload = request.toJSON();
        let resourcePath = this._getResourcePath(request);
        if (!this.config?.model?.header && payload.headers) {
            delete payload.headers.model;
            if (Object.keys(payload.headers).length === 0) {
                delete payload.headers;
            }
        }
        if (this.config.omitResource) {
            delete payload.from;
        }
        let res = await this._fetch(resourcePath, payload);
        if (res.ok === false) {
            throw new RESTError(res.status, `Error from fetched resource ("${this._uri(resourcePath)}") in "${request.method}" request: ${res.statusText}`);
        }
        try {
            let payload = await res.json();
            return new Response(payload.data, payload.total, payload.affected, payload.returned, res.status);
        } catch (err) {
            throw new RESTError(500, `Error attempting to parse fetch response as JSON resource ("${this._uri(resourcePath)}") in "${request.method}" request: ${err.message}`, err);
        }
    }

    /**
     * @override
     * @param {PostRequest} request - The POST request to send to the storage engine.
     * @returns {Promise.<Response>} Returns the data objects from storage that were created with the request criteria.
     */
    async post(request) {
        //validate
        await super.post(request);
        //process
        if (request.metadata.objects && request.metadata.objects.length) {
            let payload = request.toJSON();
            let resourcePath = this._getResourcePath(request);
            if (!this.config?.model?.header && payload.headers) {
                delete payload.headers.model;
                if (Object.keys(payload.headers).length === 0) {
                    delete payload.headers;
                }
            }
            if (this.config.omitResource) {
                delete payload.to;
            }
            //make the request, wrap errors in RESTError
            let res = await this._fetch(resourcePath, payload, { method: request.method });
            if (res.ok === false) {
                throw new RESTError(res.status, `Error from fetched resource ("${this._uri(resourcePath)}") in "${request.method}" request: ${res.statusText}`);
            }
            try {
                let payload = await res.json();
                return new Response(payload.data, payload.total, payload.affected, payload.returned, res.status);
            } catch (err) {
                throw new RESTError(500, `Error attempting to parse fetch response as JSON resource ("${this._uri(resourcePath)}") in "${request.method}" request: ${err.message}`, err);
            }
        }
        return Response.empty();
    }

    /**
     * @override
     * @param {PutRequest} request - The PUT request to send to the storage engine.
     * @returns {Promise.<Response>} Returns the data objects from storage that were updated with the request criteria. This 
     * *__may not__* exactly match the objects requested to be updated, as some may have been deleted from storage or
     * some may not match the key criteria.
     */
    async put(request) {
        //validate
        await super.put(request);
        //process
        if (request.metadata.objects && request.metadata.objects.length) {
            let payload = request.toJSON();
            let resourcePath = this._getResourcePath(request);
            if (!this.config?.model?.header && payload.headers) {
                delete payload.headers.model;
                if (Object.keys(payload.headers).length === 0) {
                    delete payload.headers;
                }
            }
            if (this.config.omitResource) {
                delete payload.to;
            }
            //make the request, wrap errors in RESTError
            let res = await this._fetch(resourcePath, payload, { method: request.method });
            if (res.ok === false) {
                throw new RESTError(res.status, `Error from fetched resource ("${this._uri(resourcePath)}") in "${request.method}" request: ${res.statusText}`);
            }
            try {
                let payload = await res.json();
                return new Response(payload.data, payload.total, payload.affected, payload.returned, res.status);
            } catch (err) {
                throw new RESTError(500, `Error attempting to parse fetch response as JSON resource ("${this._uri(resourcePath)}") in "${request.method}" request: ${err.message}`, err);
            }
        }
        return Response.empty();
    }
    /**
     * @override
     * @param {PatchRequest} request - The PATCH request to send to the storage engine.
     * @returns {Promise.<Response>} Returns a response with the total number of the objects affected in storage. No
     * data objects are typically returned with this request.
     */
    async patch(request) {
        //validate
        await super.patch(request);
        //process
        if (request.metadata.template) {
            let payload = request.toJSON();
            let resourcePath = this._getResourcePath(request);
            if (!this.config?.model?.header && payload.headers) {
                delete payload.headers.model;
                if (Object.keys(payload.headers).length === 0) {
                    delete payload.headers;
                }
            }
            if (this.config.omitResource) {
                delete payload.to;
            }
            //make the request, wrap errors in RESTError
            let res = await this._fetch(resourcePath, payload, { method: request.method });
            if (res.ok === false) {
                throw new RESTError(res.status, `Error from fetched resource on path ("${this._uri(resourcePath)}") in "${request.method}" request: ${res.statusText}`);
            }
            try {
                let payload = await res.json();
                return new Response(payload.data, payload.total, payload.affected, payload.returned, res.status);
            } catch (err) {
                throw new RESTError(500, `Error attempting to parse fetch response as JSON resource ("${this._uri(resourcePath)}") in "${request.method}" request: ${err.message}`, err);
            }
        }
        return Response.empty();
    }

    /**
     * @override
     * @param {DeleteRequest} request - The DELETE request to send to the storage engine.
     * @returns {Promise.<Response>} Returns the data objects from storage that were deleted with the request criteria.
     */
    async delete(request) {
        //validate
        await super.delete(request);
        //process
        if (request.metadata.all || (request.metadata.where && Filter.isEmpty(request.metadata.where) === false)) {
            let payload = request.toJSON();
            let resourcePath = this._getResourcePath(request);
            if (!this.config?.model?.header && payload.headers) {
                delete payload.headers.model;
                if (Object.keys(payload.headers).length === 0) {
                    delete payload.headers;
                }
            }
            if (this.config.omitResource) {
                delete payload.from;
            }
            //make the request, wrap errors in RESTError
            let res = await this._fetch(resourcePath, payload, { method: request.method });
            if (res.ok === false) {
                throw new RESTError(res.status, `Error from fetched resource ("${this._uri(resourcePath)}") in "${request.method}" request: ${res.statusText}`);
            }
            try {
                let payload = await res.json();
                return new Response(payload.data, payload.total, payload.affected, payload.returned, res.status);
            } catch (err) {
                throw new RESTError(500, `Error attempting to parse fetch response as JSON resource ("${this._uri(resourcePath)}") in "${request.method}" request: ${err.message}`, err);
            }
        }
        return Response.empty();
    }

    /**
     * @override
     * @param {OptionsRequest} request - The OPTIONS request to send to the storage engine.
     * @returns {Promise.<Response>} Returns a response with a single data object- the dynamically created model
     * configuration.
     */
    async options(request) {
        //validate
        await super.options(request);
        //process
        let payload = request.toJSON();
        let resourcePath = this._getResourcePath(request);
        if (!this.config?.model?.header && payload.headers) {
            delete payload.headers.model;
            if (Object.keys(payload.headers).length === 0) {
                delete payload.headers;
            }
        }
        //make the request, wrap errors in RESTError
        let res = await this._fetch(resourcePath, payload, { method: request.method });
        if (res.ok === false) {
            throw new RESTError(res.status, `Error from fetched resource ("${this._uri(resourcePath)}") in "${request.method}" request: ${res.statusText}`);
        }
        try {
            let payload = await res.json();
            return new Response(payload.data, payload.total, payload.affected, payload.returned, res.status);
        } catch (err) {
            throw new RESTError(500, `Error attempting to parse fetch response as JSON resource ("${this._uri(resourcePath)}") in "${request.method}" request: ${err.message}`, err);
        }
    }

}

export default FetchEngine;