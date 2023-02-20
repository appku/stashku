import DeleteRequest from './requests/delete-request.js';
import GetRequest from './requests/get-request.js';
import OptionsRequest from './requests/options-request.js';
import PatchRequest from './requests/patch-request.js';
import PostRequest from './requests/post-request.js';
import PutRequest from './requests/put-request.js';
import Response from './response.js';
import RESTError from './rest-error.js';
import Filter from './filter.js';
import Logger from './logger.js';
import Sort from './sort.js';
import ModelGenerator from './modeling/model-generator.js';
import ModelUtility from './modeling/model-utility.js';
import StringUtility from './utilities/string-utility.js';
import BaseEngine from './engines/base-engine.js';
import MemoryEngine from './engines/memory-engine.js';
import FetchEngine from './engines/fetch-engine.js';

const SUPPORTED_METHODS = ['all', '*', 'get', 'post', 'put', 'patch', 'delete', 'options'];
const SUPPORTED_STATES = ['log', 'request', 'response', 'done'];
const IS_BROWSER = !(typeof process !== 'undefined' && process.version);
let HttpRequestLoader = null; //see .requestFromObject

/**
 * @callback StashKuMiddlewareCallback
 * @param {StashKu} stashku - The StashKu instance making the middleware call.
 * @param {BaseEngine} engine - The storage engine instance that is processing the request.
 * @param {String} method - The name of the request method being carried out, typically "get", "post", "put", "patch",
 * "delete", "options".
 * @param {GetRequest|PostRequest|PutRequest|PatchRequest|DeleteRequest|OptionsRequest} request - The request object being specified.
 * @param {Response} response - The response object (`null` if not prepared yet).
 * @param {String} state 
 * The name of the state of where in the RESTful process the callback is being made, either:
 *  - "request": Indicates the callback was made before the request has handed off to the engine.
 *  - "response": Indicates the callback was made after the engine's response has been returned.
 *  - "done": Indicates the callback was made after the engine has completed the response and the action is about to
 * complete (StashKu hands off the storage engine response to the caller).
 */

/**
 * @callback StashKuMiddlewareLogCallback
 * @param {StashKu} stashku - The StashKu instance making the middleware call.
 * @param {BaseEngine} engine - The storage engine instance that is currently loaded.
 * @param {String} severity - The severity level of the log message, either "error", "warn", "info", or "debug".
 * @param {Array} args - The log message arguments, this can be a mix of types.
 */

/**
 * @typedef StashKuMiddleware
 * @property {String} [name] - An optional name for the middleware that is used for logging purposes.
 * @property {Array.<String>} [states] - The name(s) of the states to target, either "all"/"*", "log", "request", 
 * "response", or "done".
 * @property {Array.<String>} [methods] - The name(s) of the methods to target, either "all"/"*", "get", "post", "put",
 * "patch" or "delete".
 * @property {StashKuMiddlewareCallback|StashKuMiddlewareLogCallback} callback - The callback to be called when being processed.
 */

/**
 * @typedef StashKuModelConfiguration
 * @property {Boolean} [header=false] - Instructs StashKu to add a header `model` with the value of the `$stashku`
 * definition to all modelled RESTful requests. Certain engines, such as `fetch` may offer advanced features that
 * leverage model information in their operation.
 */

/**
 * @typedef StashKuConfiguration
 * @property {String|BaseEngine} engine - The name or instance of the StashKu engine to use.
 * @property {Array.<StashKuMiddleware|StashKuMiddlewareCallback|StashKuMiddlewareLogCallback>} middleware
 * @property {StashKuModelConfiguration} model - Configuration describing how StashKu works with models.
 * @property {Array.<String>} resources - Optional array of resource names that are allowed through this instance of
 * StashKu. Any request asking for a resource not found in this array will throw an error.
 */

/**
 * The StashKu class provides the ability to work with a variety of storage mediums through a single, standardized,
 * RESTful interface, working much like HTTP - using a request and a response.
 * 
 * StashKu supports middleware which can be configured to pre- and post-process requests and responses.
 * @template M
 * @template I
 */
class StashKu {
    /**
     * Creates a new StashKu instance using the provided configuration settings (which override defaults).
     * @param {StashKu | StashKuConfiguration} [config] - The configuration settings which override defaults.
     */
    constructor(config) {
        /**
         * The currently active storage engine, or the promise to load it.
         * All operations will await the engine if it is a promise.
         * @type {BaseEngine|Promise.<BaseEngine>}
         */
        this.engine = null;

        /**
         * Holds onto the last loaded configuration.    
         * If you wish to change the configuration, you should use the `configure` function.
         * @type {StashKuConfiguration}
         */
        this.config = null;

        /**
         * Middleware functions that execute before sending requests or returning responses.
         * @type {Array.<StashKuMiddleware>}
         */
        this.middleware = [];

        /**
         * Counter of all requests handled by this instance (or parent instance in the case of a proxy) of stashku.
         */
        this.stats = {
            requests: {
                total: 0,
                get: 0,
                put: 0,
                post: 0,
                patch: 0,
                delete: 0,
                options: 0
            }
        };

        /**
         * @type {Logger}
         */
        this.log = null;

        if (config && config.proxy && config.proxy.model && config.proxy.parent) {
            //this instance is being crafted for a call to the `.model` function and is meant to act as
            //a proxy to a parent StashKu class.
            if ((config.proxy.parent instanceof StashKu) === false) {
                throw new RESTError(500, 'StashKu cannot initialize a proxy instance from a non-StashKu parent instance.');
            }
            this.log = config.proxy.parent.log;
            this.engine = config.proxy.parent.engine;
            this.middleware = config.proxy.parent.middleware;
            this.stats = config.proxy.parent.stats;
            this.resources = config.proxy.parent.resources;
            //shallow-clone configuration, set proxy
            this.config = Object.assign({}, config.proxy.parent.config, { proxy: config.proxy }, { model: config.proxy.parent.config.model });
        } else {
            this.log = new Logger(this.middlerun.bind(this));
            //apply standard configuration
            this.configure(config ?? null);
        }
    }

    /**
     * Adds the specified middleware to the StashKu instance.
     * @param {StashKuMiddleware|StashKuMiddlewareCallback|StashKuMiddlewareLogCallback} middleware - The middleware to use.
     * @returns {StashKu}
     */
    use(middleware) {
        if (typeof middleware === 'function') {
            //config specifies a single middleware function.
            this.middleware.push({
                callback: middleware
            });
            this.log.debug(`Unnamed middleware loaded at position ${this.middleware.length - 1}.`);
        } else if (middleware.callback) {
            if (middleware.states) {
                if (typeof middleware.states === 'string') {
                    middleware.states = [middleware.states]; //convert to array
                } else if (Array.isArray(middleware.states) === false) {
                    throw new RESTError(500, 'The middleware specified contains invalid states. The states specified must be a string or array of strings.');
                }
                if (middleware.states.every(m => typeof m === 'string') === false) {
                    throw new RESTError(500, 'The middleware specified contains invalid states. All state values specified must be strings.');
                } else if (middleware.states.every(m => SUPPORTED_STATES.indexOf(m) >= 0) === false) {
                    throw new RESTError(500, `The middleware specified contains invalid states. Only "${SUPPORTED_STATES.join('", "')}" states are allowed.`);
                }
            }
            if (middleware.methods) {
                if (typeof middleware.methods === 'string') {
                    middleware.methods = [middleware.methods]; //convert to array
                } else if (Array.isArray(middleware.methods) === false) {
                    throw new RESTError(500, 'The middleware specified contains invalid methods. The methods specified must be a string or array of strings.');
                }
                if (middleware.methods.every(m => typeof m === 'string') === false) {
                    throw new RESTError(500, 'The middleware specified contains invalid methods. All method values specified must be strings.');
                } else if (middleware.methods.every(m => SUPPORTED_METHODS.indexOf(m) >= 0) === false) {
                    throw new RESTError(500, `The middleware specified contains invalid methods. Only "${SUPPORTED_METHODS.join('", "')}" methods are allowed.`);
                }
            }
            this.middleware.push(middleware);
            if (middleware.name) {
                this.log.debug(`"${middleware.name}" middleware loaded at position ${this.middleware.length - 1}.`);
            } else {
                this.log.debug(`Unnamed middleware loaded at position ${this.middleware.length - 1}.`);
            }
        }
        return this;
    }

    /**
     * Configures this StashKu instance with the specified configuration. If a `null` value is passed, the
     * configuration is cleared and reset to the default.
     * 
     * When the `config` parameter is undefined (not specified), this function can be awaited. This will await the 
     * import and load of the configured StashKu engine. If the engine is already loaded, the function will return.
     * @throws Error if the configured storage engine name (`config.engine`) is not registered with StashKu.
     * @param {StashKuConfiguration} [config] - The configuration settings which override defaults.
     * @returns {StashKu}
     */
    configure(config) {
        if (typeof config === 'undefined') {
            if (this.engine && this.engine.then) {
                return this.engine.then((v) => this);
            } else {
                return this;
            }
        }
        this.log.debug('Configuring StashKu...');
        //assign defaults
        let engineDefault = 'memory';
        let modelDefault = {
            header: false
        };
        if (typeof process !== 'undefined' && typeof process.env === 'object') {
            engineDefault = process.env.STASHKU_ENGINE ?? (IS_BROWSER ? 'fetch' : 'memory');
            if (typeof process.env.STASHKU_MODEL_HEADER === 'string') {
                modelDefault.header = !!process.env.STASHKU_MODEL_HEADER.match(/^[tTyY1]/);
            }
        } else {
            engineDefault = (IS_BROWSER ? 'fetch' : 'memory');
        }
        this.config = Object.assign({
            engine: engineDefault,
            middleware: [],
            resources: []
        }, config, { model: Object.assign(modelDefault, config?.model) });
        this.log.debug('Configuration=', this.config);
        //load engine
        if (this.config.engine === 'memory') {
            this.engine = new MemoryEngine();
            this.engine.configure(this.config.memory, this.log);
        } else if (this.config.engine === 'fetch') {
            this.engine = new FetchEngine();
            this.engine.configure(this.config.fetch, this.log);
        } else if (typeof this.config.engine === 'string' && IS_BROWSER === false) {
            let enginePackageName = this.config.engine;
            //set import package as variable, so compilers like esbuild ignore the import
            let pkg = './node/package-loader.js';
            this.engine = import(/* webpackIgnore: true */pkg)
                .then(loader => loader.default(enginePackageName))
                .then(m => {
                    this.engine = new m.default();
                    this.engine.configure(this.config[this.config.engine], this.log);
                    return this.engine;
                });
        } else if (this.config.engine instanceof BaseEngine) {
            this.engine = this.config.engine;
        }
        //load middleware
        if (Array.isArray(this.config.middleware)) {
            //array of possible middleware functions and objects
            for (let mw of this.config.middleware) {
                this.use(mw);
            }
        } else if (typeof this.config.middleware === 'function') {
            //config specifies a single middleware function.
            this.middleware.push({
                callback: this.config.middleware
            });
        }
        this.log.debug('Done configuring StashKu.');
        return this;
    }

    /**
     * Runs configured middleware callbacks matching the current state and request method.
     * @param {String} state 
     * The name of the state of where in the RESTful process the callback is being made, either:
     *  - "request": Indicates the callback was made before the request has handed off to the engine.
     *  - "response": Indicates the callback was made before the engine's response has been considered.
     *  - "done": Indicates the callback was made after the engine has completed the response and the action is about to
     * complete (StashKu hands off the storage engine response to the caller).
     * @param {GetRequest|PostRequest|PutRequest|PatchRequest|DeleteRequest|OptionsRequest} request - The request object being specified.
     * @param {Promise.<Response>} response - The response object (`null` if not prepared yet).
     */
    async middlerun(state, request, response) {
        if (SUPPORTED_STATES.indexOf(state) < 0) {
            throw new Error(`The "state" argument specified contain an invalid value. Only "${SUPPORTED_STATES.join('", "')}" states are allowed.`);
        }
        if (this.middleware && this.middleware.length) {
            for (let x = 0; x < this.middleware.length; x++) {
                let mw = this.middleware[x];
                if (mw.callback) {
                    let stateAllowed = (!mw.states || mw.states.length === 0 || mw.states.indexOf(state) >= 0);
                    let methodAllowed = (
                        state === 'log'
                        || !mw.methods
                        || mw.methods.indexOf('*') >= 0
                        || mw.methods.indexOf('all') >= 0
                        || mw.methods.indexOf(request.method) >= 0
                    );
                    if (stateAllowed && methodAllowed) {
                        if (state === 'log') {
                            //under the "log" state...
                            //request = severity string
                            //response = args array
                            await mw.callback(this, this.engine, request, response);
                        } else {
                            if (mw.name) {
                                this.log.debug(`Calling middleware ${x + 1} of ${this.middleware.length} "${mw.name}".`);
                            } else {
                                this.log.debug(`Calling middleware ${x + 1} of ${this.middleware.length}.`);
                            }
                            await mw.callback(this, this.engine, request.method, request, response, state);
                            this.log.debug(`Completed middleware call ${x + 1} of ${this.middleware.length}.`);
                        }
                    }
                }
            }
        }
    }

    /**
     * Handles the `request` and ensures it is resolved to a response object, even when defined as a callback.
     * 
     * @throws Error if the "request" argument is not a callback function or request-like instance.
     * @throws Error if the engine module fails to load.
     * @throws Error if the engine is `null`.
     * @param {GetRequest|PostRequest|PutRequest|PatchRequest|DeleteRequest|OptionsRequest} request - The request to ensure.
     * @param {*} requestType - The expected request instance type.
     * @returns {Promise.<Response>} Returns the data objects from storage matching request criteria.
     * @private
     */
    async _handle(request, requestType) {
        //validate arguments
        if (!requestType) {
            throw new Error('A "requestType" parameter argument is required.');
        }
        //build request
        let reqModel = this.config?.proxy?.model;
        if (IS_BROWSER === false && request.url && request.httpVersion) { //looks like we want to process a StashKu request from an HTTP request.
            request = await StashKu.requestFromObject(request, reqModel);
        } else if (typeof request === 'function') {
            //process callback
            let tmp = new requestType();
            request(tmp, reqModel);
            request = tmp;
        }
        //validate
        if ((request instanceof requestType) === false) {
            throw new Error(`The "request" argument must be a callback function or ${requestType.name} instance.`);
        } else if (!this.engine) {
            throw new Error('A StashKu storage engine has not been loaded. An engine must be configured before operations are allowed.');
        }
        //adjust the request by model, if present
        if (reqModel) {
            request.model(reqModel, false, this.config?.model?.header);
        }
        //access restrictions
        if (this.config.resources && this.config.resources.length) {
            let resource = request.metadata.from || request.metadata.to;
            if (this.config.resources.indexOf(resource) < 0) {
                throw new RESTError(403, 'Forbidden.');
            }
        }
        //pre-process request
        let response = null;
        this.stats.requests[request.method]++;
        this.stats.requests.total++;
        let reqID = this.stats.requests.total.toString().padStart(16, '0');
        this.log.debug(`[${reqID}] Processing "${request.method}" request.`);
        try {
            this.engine = await this.engine; //resolve if a promise.
        } catch (err) {
            throw new RESTError(500, `The StashKu storage engine "${this.config.engine}" could not be loaded. ${err.toString()}`);
        }
        this.log.debug(`[${reqID}] Running "${request.method}" request middleware.`);
        await this.middlerun('request', request, response);
        if (this.engine[request.method]) {
            try {
                //make the request and get the response
                this.log.debug(`[${reqID}] Sending "${request.method}" request to engine "${this.engine.name}".`);
                response = await this.engine[request.method](request);
                this.log.debug(`[${reqID}] Received response for "${request.method}" request from engine "${this.engine.name}".`);
                if (reqModel) {
                    //convert data
                    this.log.debug(`[${reqID}] Modelling response data.`);
                    if (response.data && response.data.length) {
                        let counter = 0;
                        for (let m of ModelUtility.model(reqModel, request.method, ...response.data)) {
                            response.data[counter] = m;
                            counter++;
                        }
                    }
                }
                this.log.debug(`[${reqID}] Running middleware for response.`);
                await this.middlerun('response', request, response);
            } catch (err) {
                if ((err instanceof RESTError) === false) {
                    throw new RESTError(500, `A StashKu internal error occurred while using storage engine "${this.engine.name}".`, err);
                }
                throw err;
            }
        } else {
            throw new RESTError(501, `The StashKu storage engine "${this.engine.name}" does not know how to handle the method "${request.method}".`);
        }
        //validate engine response
        if (!response) {
            throw new RESTError(403, `The StashKu storage engine "${this.engine.name}" did not return a response.`);
        } else if ((response instanceof Response) === false) {
            throw new RESTError(500, `The StashKu storage engine "${this.engine.name}" returned an invalid response.`);
        }
        this.log.debug(`[${reqID}] Returning "${request.method}" response with total value of ${response ? response.total : '(null)'}.`);
        return response;
    }

    /**
     * This method safely cleans up resources and should be called after the use of the StashKu instance is complete,
     * such as just before application exit.
     */
    async destroy() {
        if (this.engine && this.engine.destroy) {
            await this.engine.destroy();
        }
    }

    /**
     * @template T
     * @typedef {new(...args: Array) | new(...args: Array) => T} Constructor
     **/

    /**
     * Attaches a model to StashKu operations through a new returned (proxy) StashKu instance. The model is attached
     * only to the returned proxying instance. This allows the use of the model within the request callback methods
     * as the second argument (`model`), and the resulting `Response` data to be instances of the model.
     * 
     * @example
     * let sk = new StashKu();
     * ...
     * //the model object will be exposed as the "m" argument in the callback.
     * await sk.model(PersonModel).get((r, m) => r...);
     * await sk.model(PersonModel).post((r, m) => r...);
     * await sk.model(PersonModel).put((r, m) => r...);
     * await sk.model(PersonModel).patch((r, m) => r...);
     * await sk.model(PersonModel).delete((r, m) => r...);
     * 
     * @throws Error if the `modelType` argument missing or falsey.
     * @throws Error if the `modelType` argument is not a class or constructor function.
     * @template MT
     * @param {MT} modelType - The model "class" or constructor function.
     * @returns {StashKu.<MT, InstanceType.<MT>>}
     */
    model(modelType) {
        let parent = this;
        if (!modelType) {
            throw new RESTError(500, 'The "modelType" argument is required.');
        }
        if (!modelType.constructor || !modelType.prototype) {
            throw new RESTError(500, 'The "modelType" argument is invalid and must be a class or constructor function.');
        }
        if (this.config && this.config.proxy && this.config.proxy.parent) { //prevent parent daisy-chaining
            parent = this.config.proxy.parent;
        }
        return new StashKu({
            proxy: {
                parent,
                model: modelType
            }
        });
    }

    /**
     * @callback GetRequestCallback
     * @param {GetRequest} request
     * @param {M} [model]
     */

    /**
     * Run a GET `request` through StashKu using the configured storage engine.    
     * This operation returns objects from storage that match the GET `request` criteria.    
     * 
     * @example
     * let sk = new StashKu();
     * ...
     * await sk.get(r => r
     *     .properties('FirstName', 'LastName')
     *     .from('Contacts')
     *     .where(f => f.and('FirstName', f.OP.STARTSWITH, 'Rob'))
     *     .sort('LastName')
     * );
     * 
     * @throws Error if the storage engine fails to return a response.
     * @throws Error if the storage engine returns an invalid response object.
     * @param {GetRequest | GetRequestCallback} [request] - The GET request to send to the storage engine.
     * @returns {Promise.<Response.<I>>} Returns the data objects from storage matching request criteria.
     */
    async get(request) {
        return await this._handle(request ?? new GetRequest(), GetRequest);
    }

    /**
     * @callback PostRequestCallback
     * @param {PostRequest} request
     * @param {M} [model]
     */

    /**
     * Run a POST `request` to create objects in a target resource using the StashKu configured storage engine.
     * This operation returns an array of the objects that were created.
     * 
     * @example
     * let sk = new StashKu();
     * ...
     * let person1 = { FirstName: 'Robert', LastName: 'Yolo' };
     * let person2 = { FirstName: 'Suzy', LastName: 'CraftyMine' };
     * await sk.post(r => r
     *     .objects(person1, person2)
     *     .to('Contacts')
     * );
     * 
     * @throws Error if the storage engine fails to return a response.
     * @throws Error if the storage engine returns an invalid response object.
     * @param {PostRequest | PostRequestCallback} request - The POST request to send to the storage engine.
     * @returns {Promise.<Response.<I>>} Returns the data objects from storage that were created with the request criteria.
     */
    async post(request) {
        return await this._handle(request, PostRequest);
    }

    /**
     * @callback PutRequestCallback
     * @param {PutRequest} request
     * @param {M} [model]
     */

    /**
     * Run a PUT `request` to update objects in the target resource using the StashKu configured storage engine.
     * This operation will respond with the objects updated.
     * 
     * @example
     * let sk = new StashKu();
     * ...
     * let person1 = { ID: 1, FirstName: 'Robert', LastName: 'Yolo' };
     * let person2 = { ID: 2, FirstName: 'Suzy', LastName: 'CraftyMine' };
     * await sk.put(r => r
     *     .objects(person1, person2)
     *     .pk('ID')
     *     .to('Contacts')
     * );
     * 
     * @throws Error if the storage engine fails to return a response.
     * @throws Error if the storage engine returns an invalid response object.
     * @param {PutRequest | PutRequestCallback} request - The PUT request to send to the storage engine.
     * @returns {Promise.<Response.<I>>} Returns the data objects from storage that were updated with the request criteria. This 
     * *__may not__* exactly match the objects requested to be updated, as some may have been deleted from storage or
     * some may not match the key criteria.
     */
    async put(request) {
        return await this._handle(request, PutRequest);
    }

    /**
     * @callback PatchRequestCallback
     * @param {PatchRequest} request
     * @param {M} [model]
     */

    /**
     * Run a PATCH `request` to update any matching objects with the specified template properties and values.
     * This operation will respond with the objects updated.
     * 
     * @example
     * let sk = new StashKu();
     * ...
     * await sk.patch(r => r
     *     .template({
     *         walking: true,
     *         date_walked: new Date()
     *     })
     *     .to('Runners')
     *     .where(f => f.and('Gender', f.OP.EQUALS, 'Female'))
     * );
     * @throws Error if the storage engine fails to return a response.
     * @throws Error if the storage engine returns an invalid response object.
     * @param {PatchRequest | PatchRequestCallback} request - The PATCH request to send to the storage engine.
     * @returns {Promise.<Response.<I>>} Returns a response with the total number of the objects affected in storage. No data
     * objects are typically returned with this request.
     */
    async patch(request) {
        return await this._handle(request, PatchRequest);
    }

    /**
     * @callback DeleteRequestCallback
     * @param {DeleteRequest} request
     * @param {M} [model]
     */

    /**
     * Run a DELETE `request` to delete any matching objects with the specified template properties and values.
     * This operation will respond with the objects deleted.
     * 
     * @example
     * let sk = new StashKu();
     * ...
     * await sk.patch(r => r
     *     .from('Runners')
     *     .where(f => f.and('Gender', f.OP.EQUALS, 'Female'))
     * );
     * @throws Error if the "request" argument is not a callback function or `DeleteRequest` instance.
     * @param {DeleteRequest | DeleteRequestCallback} request - The DELETE request to send to the storage engine.
     * @returns {Promise.<Response.<I>>} Returns the data objects from storage that were deleted with the request criteria.
     */
    async delete(request) {
        return await this._handle(request, DeleteRequest);
    }

    /**
     * @callback OptionsRequestCallback
     * @param {OptionsRequest} request
     * @param {M} [model]
     */

    /**
     * Run an OPTIONS `request` which returns a dynamically constructed model type which defines how StashKu can 
     * interact with the target (`from`) resource. 
     * @example
     * let sk = new StashKu();
     * ...
     * await sk.options(r => r
     *     .from('Runners')
     * );
     * @throws Error if the "request" argument is not a callback function or `OptionsRequest` instance.
     * @param {OptionsRequest | OptionsRequestCallback} request - The OPTIONS request to send to the storage engine.
     * @returns {Promise.<Response.<I>>} Returns a response with a single data object- the dynamically created model 
     * configuration.
     */
    async options(request) {
        return await this._handle(request ?? new OptionsRequest(), OptionsRequest);
    }

    /**
     * Instructs StashKu to transform a HTTP request into a StashKu request and run it.
     * 
     * @throws Error when StashKu failed to transform the HTTP request into a valid StashKu request.
     * @throws Error when used on an unsupported platform (browser).
     * @param {Request} httpRequest - The HTTP request to be transformed and run.
     * @param {Modeling.AnyModelType} [modelType] - The model type StashKu can use to discover the proper resource
     * of a request. If this is specified, the resource will *always* be derived from the model's appropriate 
     * resource value. 
     * If your StashKu chain includes a model, that model will be used when this argument is not specified.
     * @returns {Promise.<Response.<I>>} Returns the data objects from storage matching HTTP request criteria.
     */
    async http(httpRequest, modelType) {
        if (IS_BROWSER === false) {
            //support someone handing off a pre-constructed request, just forward to the proper handler.
            if (httpRequest instanceof GetRequest) {
                return this.get(httpRequest);
            }
            if (httpRequest instanceof PostRequest) {
                return this.post(httpRequest);
            }
            if (httpRequest instanceof PutRequest) {
                return this.put(httpRequest);
            }
            if (httpRequest instanceof PatchRequest) {
                return this.patch(httpRequest);
            }
            if (httpRequest instanceof DeleteRequest) {
                return this.delete(httpRequest);
            }
            if (httpRequest instanceof OptionsRequest) {
                return this.options(httpRequest);
            }
            if (httpRequest.url && httpRequest.httpVersion) {
                let reqModel = modelType || this.config?.proxy?.model;
                let request = await StashKu.requestFromObject(httpRequest, reqModel);
                if (request) {
                    switch (request.method) {
                        case 'get': return this._handle(request, GetRequest);
                        case 'post': return this._handle(request, PostRequest);
                        case 'put': return this._handle(request, PutRequest);
                        case 'patch': return this._handle(request, PatchRequest);
                        case 'delete': return this._handle(request, DeleteRequest);
                        case 'options': return this._handle(request, OptionsRequest);
                    }
                }
            }
            throw new RESTError(400, 'Failed to process request.');
        }
        throw new RESTError(500, 'The "requestFromFile" function is not supported on this platform.');
    }

    /**
     * @callback ModelNameResolveCallback
     * @param {String} name - The model name defined.
     * @returns {*} Returns a model type constructor/class associated with the model name.
     */

    /**
     * Reads a request defintion from file and returns an instance of that request.
     * 
     * @throws Error when used on an unsupported platform (browser).
     * @param {fs.PathOrFileDescriptor} jsonFile - The file path to the JSON formatted file defining a single StashKu request.
     * @param {{encoding: String, flag: String} | String | fs.BufferEncodingOption} [fsOptions] - File encoding options.
     * @param {ModelNameResolveCallback} [modelNameResolver] - Callback function that resolves a model name into a model type (constructor/class).
     * @returns {Promise.<DeleteRequest | GetRequest | PatchRequest | PostRequest | PutRequest | OptionsRequest>}
     */
    static async requestFromFile(jsonFile, fsOptions, modelNameResolver) {
        if (IS_BROWSER === false) {
            //set import package as variable, so compilers like esbuild ignore the import
            let pkg = 'fs/promises';
            let f = await (await import(/* webpackIgnore: true */pkg)).default.readFile(jsonFile, fsOptions);
            let obj = JSON.parse(f);
            return StashKu.requestFromObject(obj, modelNameResolver);
        }
        throw new Error(500, 'The "requestFromFile" function is not supported on this platform.');
    }

    /**
     * Attempts to parse (convert) a StashKu request-like object (including http requests) into the specified request
     * type. If the request-like object does not appear to be parsable into the request type, a value of `null` is
     * returned unless the `requestType` is falsey.
     * 
     * @see `StashKu.requestFromObject`
     * @throws Error if the `requestType` is specified but not a `DeleteRequest`, `GetRequest`, `PatchRequest`,
     * `PostRequest`, `PutRequest`, or `OptionsRequest`.
     * @throws Error if the object is missing a method property.
     * @throws Error if the method property value is invalid.
     * @param {*} reqObj - The untyped request object.
     * @param {ModelNameResolveCallback | Modeling.AnyModelType} [modelNameResolver] - Callback function that resolves 
     * a model name into a model type (constructor/class). Optionally can be a model type.
     * @template RT
     * @param {RT} requestType - The request type. Must be any one of the following:
     * `DeleteRequest`, `GetRequest`, `PatchRequest`, `PostRequest`, `PutRequest`, `OptionsRequest`.
     * @returns {Promise.<InstanceType.<RT>>}
     */
    static async parseRequest(reqObj, modelNameResolver, requestType) {
        if (requestType
            && requestType !== DeleteRequest
            && requestType !== GetRequest
            && requestType !== PatchRequest
            && requestType !== PostRequest
            && requestType !== PutRequest
            && requestType !== OptionsRequest
        ) {
            throw new Error('Invalid or unsupported request type.');
        }
        let r = await StashKu.requestFromObject(reqObj, modelNameResolver);
        if (requestType && r instanceof requestType) {
            return r;
        } else if (!requestType) {
            return r;
        }
        return null;
    }

    /**
     * @deprecated Please switch to `StashKu.parseRequest`. This function will be removed in a later version.
     * @description
     * Converts a StashKu request-like object (including http requests) into an instance of the appropriate StashKu 
     * request. This can be used in conjunction with `JSON.stringify(...)` and subsequently a `JSON.parse(...)` 
     * of a request.
     * 
     * If the object is `null` or `undefined`, a `null` value is returned.
     * @throws Error if the object is missing a method property.
     * @throws Error if the method property value is invalid.
     * @param {*} reqObj - The untyped request object.
     * @param {ModelNameResolveCallback | Modeling.AnyModelType} [modelNameResolver] - Callback function that resolves 
     * a model name into a model type (constructor/class). Optionally can be a model type.
     * @returns {Promise.<DeleteRequest | GetRequest | PatchRequest | PostRequest | PutRequest | OptionsRequest>} 
     */
    static async requestFromObject(reqObj, modelNameResolver) {
        if (reqObj) {
            //get a model type, if available
            let mt = null;
            if (typeof modelNameResolver === 'function' && reqObj.model && typeof reqObj.model === 'string') {
                mt = modelNameResolver(reqObj.model);
            } else if (ModelUtility.isValidType(modelNameResolver)) {
                mt = modelNameResolver;
            }
            //handle http.IncomingMessageg
            if (IS_BROWSER === false && reqObj.url && reqObj.httpVersion) {
                if (!HttpRequestLoader) {
                    //set import package as variable, so compilers like esbuild ignore the import
                    let pkg = './node/http-request-loader.js';
                    HttpRequestLoader = (await import(/* webpackIgnore: true */pkg)).default;
                }
                return await HttpRequestLoader(reqObj, mt);
            }
            if (!reqObj.method || /^delete|get|patch|post|put|options$/i.test(reqObj.method) === false) {
                throw new Error('The method property value of the object is missing or invalid. Expected a valid request method.');
            }
            //construct
            switch (reqObj.method.toLowerCase()) {
                case 'delete': return new DeleteRequest()
                    .headers(reqObj.headers)
                    .from(reqObj.from ?? null)
                    .all(reqObj.all ?? false)
                    .count(reqObj.count ?? false)
                    .where(Filter.fromObject(reqObj.where));
                case 'get': return new GetRequest()
                    .headers(reqObj.headers)
                    .from(reqObj.from ?? null)
                    .properties(...reqObj.properties)
                    .distinct(reqObj.distinct ?? false)
                    .count(reqObj.count ?? false)
                    .skip(reqObj.skip ?? null)
                    .take(reqObj.take ?? null)
                    .sort(...reqObj.sorts)
                    .where(Filter.fromObject(reqObj.where));
                case 'options': return new OptionsRequest()
                    .from(reqObj.from ?? null)
                    .headers(reqObj.headers);
                case 'patch': return new PatchRequest()
                    .headers(reqObj.headers)
                    .to(reqObj.to ?? null)
                    .template(reqObj.template ?? null)
                    .all(reqObj.all ?? false)
                    .count(reqObj.count ?? false)
                    .where(Filter.fromObject(reqObj.where));
                case 'post': return new PostRequest()
                    .headers(reqObj.headers)
                    .to(reqObj.to ?? null)
                    .count(reqObj.count ?? false)
                    .objects(reqObj.objects ?? null);
                case 'put': return new PutRequest()
                    .headers(reqObj.headers)
                    .to(reqObj.to ?? null)
                    .count(reqObj.count ?? false)
                    .pk(...reqObj.pk)
                    .objects(reqObj.objects ?? null);
            }
        }
        return null;
    }

}

export {
    StashKu as default,
    GetRequest,
    PostRequest,
    PutRequest,
    PatchRequest,
    DeleteRequest,
    OptionsRequest,
    BaseEngine,
    Response,
    RESTError,
    Filter,
    Sort,
    ModelGenerator,
    ModelUtility,
    StringUtility
};