import GetRequest from './requests/get-request.js';
import PostRequest from './requests/post-request.js';
import PutRequest from './requests/put-request.js';
import PatchRequest from './requests/patch-request.js';
import DeleteRequest from './requests/delete-request.js';
import OptionsRequest from './requests/options-request.js';
import BaseStorageEngine from './base-storage-engine.js';
import Filter from './filter.js';
import Sort from './sort.js';
import Response from './response.js';
import RESTError from './rest-error.js';
import MemoryStorageEngine from './memory-storage-engine.js';
import Logger from './logger.js';
import ModelConfiguration from './modeling/model-configuration.js';
import Files from './utilities/files.js';
import Randomization from './utilities/randomization.js';
import ModelUtility from './modeling/model-utility.js';

const SUPPORTED_METHODS = ['all', '*', 'get', 'post', 'put', 'patch', 'delete', 'options'];
const SUPPORTED_STATES = ['log', 'request', 'response', 'done'];

/**
 * @callback StashKuMiddlewareCallback
 * @param {StashKu} stashku - The StashKu instance making the middleware call.
 * @param {BaseStorageEngine} engine - The storage engine instance that is processing the request.
 * @param {String} method - The name of the request method being carried out, typically "get", "post", "put", "patch",
 * "delete", "options".
 * @param {GetRequest|PostRequest|PutRequest|PatchRequest|DeleteRequest} request - The request object being specified.
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
 * @param {BaseStorageEngine} engine - The storage engine instance that is currently loaded.
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
 * @typedef StashKuConfiguration
 * @property {String|BaseStorageEngine} engine - The name or instance of the StashKu engine to use.
 * @property {Array.<StashKuMiddleware|StashKuMiddlewareCallback|StashKuMiddlewareLogCallback>} middleware
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
         * @type {BaseStorageEngine|Promise.<BaseStorageEngine>}
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
            //shallow-clone configuration, set proxy
            this.config = Object.assign({}, config.proxy.parent.config, { proxy: config.proxy });
        } else {
            this.log = new Logger(this.middlerun.bind(this));
            //apply standard configuration
            this.configure(config);
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
     * @throws Error if the configured storage engine name (`config.engine`) is not registered with StashKu.
     * @param {StashKuConfiguration} [config] - The configuration settings which override defaults.
     * @returns {StashKu}
     */
    configure(config) {
        this.log.debug('Configuring StashKu...');
        //assign defaults
        this.config = Object.assign({
            engine: 'memory',
            middleware: []
        }, config);
        this.log.debug('Configuration=', this.config);
        //load engine
        if (this.config.engine === 'memory') {
            this.engine = new MemoryStorageEngine();
            this.engine.configure(this.config.memory, this.log);
        } else if (typeof this.config.engine === 'string') {
            let enginePackageName = this.config.engine;
            //check if the configured engine is the same name as the package in current directory (if any).
            let local = Files.including(Files.join(process.cwd(), 'package.json'))
                .nullify()
                .parse()
                .readSync();
            if (local[0].read && local[0].data && local[0].data.name === this.config.engine) {
                enginePackageName = process.cwd();
            }
            this.engine = import(enginePackageName)
                .then(m => {
                    this.engine = new m.default();
                    this.engine.configure(this.config[this.config.engine], this.log);
                });
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
     * @param {GetRequest|PostRequest|PutRequest|PatchRequest|DeleteRequest} request - The request object being specified.
     * @param {Response} response - The response object (`null` if not prepared yet).
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
     * @param {GetRequest|PostRequest|PutRequest|PatchRequest|DeleteRequest} request - The request to ensure.
     * @param {*} requestType - The expected request instance type.
     * @returns {Response} Returns the data objects from storage matching request criteria.
     * @private
     */
    async _handle(request, requestType) {
        //validate request
        if (!requestType) {
            throw new Error('A "requestType" parameter argument is required.');
        }
        if (typeof request === 'function') {
            //process callback
            let tmp = new requestType();
            if (this.config && this.config.proxy && this.config.proxy.model) {
                tmp.model(this.config.proxy.model);
            }
            request(tmp, tmp.metadata.model);
            request = tmp;
        } else if ((request instanceof requestType) === false) {
            throw new Error(`The "request" argument must be a callback function or ${requestType.name} instance.`);
        } else if (!this.engine) {
            throw new Error('A StashKu storage engine has not been loaded. An engine must be configured before operations are allowed.');
        } else if (this.config && this.config.proxy && this.config.proxy.model) {
            request.model(this.config.proxy.model);
        }
        //pre-process request
        let response = null;
        let reqID = Randomization.uuidv4();
        this.log.debug(`[${reqID}] Processing "${request.method}" request.`);
        try {
            await this.engine; //resolve if a promise.
        } catch (err) {
            throw new RESTError(500, `The StashKu storage engine "${this.config.engine}" could not be loaded. ${err.toString()}`);
        }
        if (request.metadata.model) {
            //run model override request callback
            ModelUtility.override(request.metadata.model, request, null);
        }
        await this.middlerun('request', request, response);
        if (this.engine[request.method]) {
            try {
                //make the request and get the response
                this.log.debug(`[${reqID}] Sending "${request.method}" request to engine "${this.engine.name}".`);
                response = await this.engine[request.method](request);
                if (request.metadata.model) {
                    //convert data
                    if (response.data && response.data.length) {
                        let counter = 0;
                        for (let m of ModelUtility.model(request.metadata.model, ...response.data)) {
                            response.data[counter] = m;
                            counter++;
                        }
                    }
                    //run model override response callback
                    ModelUtility.override(request.metadata.model, request, response);
                }
                await this.middlerun('response', request, response);
            } catch (err) {
                if ((err instanceof RESTError) === false) {
                    throw new RESTError(500, `StashKu error processing request: ${err.toString()}`);
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
     * @returns {Response.<I>} Returns the data objects from storage matching request criteria.
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
     * @returns {Response.<I>} Returns the data objects from storage that were created with the request criteria.
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
     *     .key('ID')
     *     .to('Contacts')
     * );
     * 
     * @throws Error if the storage engine fails to return a response.
     * @throws Error if the storage engine returns an invalid response object.
     * @param {PutRequest | PutRequestCallback} request - The PUT request to send to the storage engine.
     * @returns {Response.<I>} Returns the data objects from storage that were updated with the request criteria. This 
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
     * @returns {Response.<I>} Returns a response with the total number of the objects affected in storage. No data
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
     * @returns {Response.<I>} Returns the data objects from storage that were deleted with the request criteria.
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
     * @returns {Response.<I>} Returns a response with a single data object- the dynamically created model 
     * configuration.
     */
    async options(request) {
        return await this._handle(request ?? new OptionsRequest(), OptionsRequest);
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
    BaseStorageEngine,
    Response,
    RESTError,
    Filter,
    Sort,
    ModelConfiguration
};