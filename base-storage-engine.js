import GetRequest from './requests/get-request.js';
import PostRequest from './requests/post-request.js';
import PutRequest from './requests/put-request.js';
import PatchRequest from './requests/patch-request.js';
import DeleteRequest from './requests/delete-request.js';
import OptionsRequest from './requests/options-request.js';
import Filter from './filter.js';
import RESTError from './rest-error.js';
import Logger from './logger.js';
import Objects from './utilities/objects.js';

/**
 * @typedef
 */

/**
 * This abstract base class defines the structure of a StashKu-compatible storage engine. All StashKu storage engines
 * must extend this class.    
 * 
 * The implementing engine should implement it's own `shema`, `get`, `post`, `put`, `patch`, and `delete` functions when
 * supported. If the RESTful function is not supported it should not be overriden so that this base class can throw
 * a 501 "Not supported" error.
 * @abstract
 */
class BaseStorageEngine {
    /**
     * Instantiates a new `BaseStorageEngine`.
     * @param {String} name - The name of this storage engine. 
     */
    constructor(name) {
        if (new.target === BaseStorageEngine) {
            throw new Error('BaseApp is an abstract class and should not be initiated alone.');
        } else if (!name) {
            throw new Error('The "name" argument is required.');
        } else if (typeof name !== 'string') {
            throw new Error('The "name" argument must be a string.');
        }

        /**
         * The name of this StashKu engine. This name is used in debugging and log output.
         * @type {String}
         */
        this.name = name;

        /**
         * The configuration object for the storage engine.
         * @type {*}
         */
        this.config = null;

        /**
         * @type {Logger}
         */
        this.log = null;

    }

    /**
     * Standardized method to clean up resources within a storage engine. This is called from the StashKu instance when
     * an engine is replaced or removed, or the instance is destroyed.
     * @abstract
     */
    async destroy() { }

    /**
     * Sets the storage engine configuration property. This function is called automatically by StashKu when the engine
     * is initialized or when the configuration source has been changed.
     * @param {*} config - The configuration object for the storage engine.
     * @param {Logger} [logger] - Optional `Logger` instance to set on the engine. This is usually assigned to the
     * same instance as the StashKu parent.
     * @abstract
     */
    configure(config, logger) {
        this.config = config;
        if (logger) {
            this.log = logger;
        } else if (logger === null) {
            this.log = null;
        }
    }

    /**
     * Returns an array of strings naming the resources available in the storage medium accessible by the engine.
     * @returns {Array.<String>}
     * @abstract
     */
    async resources() {
        if (!Objects.getPrototype(this, BaseStorageEngine) || this.resources === BaseStorageEngine.prototype.resources) {
            throw new RESTError(501, `The "resources" function is not supported on the StashKu "${this.name}" storage engine.`);
        } 
    }

    /**
     * Run a GET `request` and returns objects from storage that match the GET `request` criteria.
     * 
     * @throws A 501 REST error if not overriden and supported by the storage engine.
     * @throws A 400 REST error if the request is missing or not a `GetRequest`.
     * @throws A 400 REST error if the request missing required metadata.
     * @throws A 400 REST error if the request metadata is missing a required "from" value.
     * @param {GetRequest} request - The GET request to send to the storage engine.
     * @returns {Promise.<Response>} Returns the data objects from storage matching request criteria.
     * @abstract
     */
    async get(request) {
        if (!Objects.getPrototype(this, BaseStorageEngine) || this.get === BaseStorageEngine.prototype.get) {
            throw new RESTError(501, `The GET action is not supported on the StashKu "${this.name}" storage engine.`);
        } else {
            //perform request validations
            if (!request || (request instanceof GetRequest) === false) {
                throw new RESTError(400, 'The "request" argument is required and must be a GetRequest.');
            } else if (!request.metadata) {
                throw new RESTError(400, 'The "request" argument is incomplete and missing required metadata.');
            } else if (!request.metadata.from) {
                throw new RESTError(400, 'The request is missing a required "from" value.');
            }
        }
    }

    /**
     * Run a POST `request` and creates (then returns) objects in storage.
     * 
     * @throws A 501 REST error if not overriden and supported by the storage engine.
     * @throws A 400 REST error if the request is missing or not a `PostRequest`.
     * @throws A 400 REST error if the request missing required metadata.
     * @throws A 400 REST error if the request metadata is missing a required "to" value.
     * @param {PostRequest} request - The POST request to send to the storage engine.
     * @returns {Promise.<Response>} Returns the data objects from storage that were created with the request criteria.
     * @abstract
     */
    async post(request) {
        if (!Objects.getPrototype(this, BaseStorageEngine) || this.post === BaseStorageEngine.prototype.post) {
            throw new RESTError(501, `The POST action is not supported on the StashKu "${this.name}" storage engine.`);
        } else {
            //perform request validations
            if (!request || (request instanceof PostRequest) === false) {
                throw new RESTError(400, 'The "request" argument is required and must be a PostRequest.');
            } else if (!request.metadata) {
                throw new RESTError(400, 'The "request" argument is incomplete and missing required metadata.');
            } else if (!request.metadata.to) {
                throw new RESTError(400, 'The request is missing a required "to" value.');
            }
        }
    }

    /**
     * Run a PUT `request` and updates (then returns) objects in storage.
     * 
     * @throws A 501 REST error if not overriden and supported by the storage engine.
     * @throws A 400 REST error if the request is missing or not a `PutRequest`.
     * @throws A 400 REST error if the request missing required metadata.
     * @throws A 400 REST error if the request metadata is missing a required "to" value.
     * @throws A 400 REST error if the request metadata is missing at least one "pk" value.
     * @param {PutRequest} request - The PUT request to send to the storage engine.
     * @returns {Promise.<Response>} Returns the data objects from storage that were updated with the request criteria. This 
     * *__may not__* exactly match the objects requested to be updated, as some may have been deleted from storage or
     * some may not match the key criteria.
     * @abstract
     */
    async put(request) {
        if (!Objects.getPrototype(this, BaseStorageEngine) || this.put === BaseStorageEngine.prototype.put) {
            throw new RESTError(501, `The PUT action is not supported on the StashKu "${this.name}" storage engine.`);
        } else {
            //perform request validations
            if (!request || (request instanceof PutRequest) === false) {
                throw new RESTError(400, 'The "request" argument is required and must be a PutRequest.');
            } else if (!request.metadata) {
                throw new RESTError(400, 'The "request" argument is incomplete and missing required metadata.');
            } else if (!request.metadata.to) {
                throw new RESTError(400, 'The request is missing a required "to" value.');
            } else if (!request.metadata.pk || request.metadata.pk.length === 0) {
                throw new RESTError(400, 'The request is missing at least one "primary key" (PK) property name.');
            }
        }
    }
    /**
     * Run a PATCH `request` and updates all objects in storage matching the PATCH `request` criteria. A count of the
     * number of objects affected is returned.
     * 
     * @throws A 501 REST error if not overriden and supported by the storage engine.
     * @throws A 400 REST error if the request is missing or not a `PatchRequest`.
     * @throws A 400 REST error if the request missing required metadata.
     * @throws A 400 REST error if the request metadata is missing a required "to" value.
     * @throws A 400 REST error if the request metadata is missing a "template" object.
     * @throws A 400 REST error if the request metadata is missing "where" conditions to match objects in storage and
     * is not enabled to affect all objects.
     * @param {PatchRequest} request - The PATCH request to send to the storage engine.
     * @returns {Promise.<Response>} Returns a response with the total number of the objects affected in storage. No data
     * objects are typically returned with this request.
     * @abstract
     */
    async patch(request) {
        if (!Objects.getPrototype(this, BaseStorageEngine) || this.patch === BaseStorageEngine.prototype.patch) {
            throw new RESTError(501, `The PATCH action is not supported on the StashKu "${this.name}" storage engine.`);
        } else {
            //perform request validations
            if (!request || (request instanceof PatchRequest) === false) {
                throw new RESTError(400, 'The "request" argument is required and must be a PatchRequest.');
            } else if (!request.metadata) {
                throw new RESTError(400, 'The "request" argument is incomplete and missing required metadata.');
            } else if (!request.metadata.to) {
                throw new RESTError(400, 'The request is missing a required "to" value.');
            } else if (!request.metadata.template) {
                throw new RESTError(400, 'The request is missing at a defined "template" object.');
            } else if (!request.metadata.all && (!request.metadata.where || Filter.isEmpty(request.metadata.where))) {
                throw new RESTError(400, 'The request is missing "where" conditions to match objects in storage. If the intention is to affect all objects, the "all" flag must be enabled.');
            }
        }
    }

    /**
     * Run a DELETE `request` and deletes all objects in storage matching the DELETE `request` criteria.
     * 
     * @throws A 501 REST error if not overriden and supported by the storage engine.
     * @throws A 400 REST error if the request is missing or not a `DeleteRequest`.
     * @throws A 400 REST error if the request missing required metadata.
     * @throws A 400 REST error if the request metadata is missing a required "from" value.
     * @throws A 400 REST error if the request metadata is missing "where" conditions to match objects in storage and
     * is not enabled to affect all objects.
     * @param {DeleteRequest} request - The DELETE request to send to the storage engine.
     * @returns {Promise.<Response>} Returns the data objects from storage that were deleted with the request criteria.
     * @abstract
     */
    async delete(request) {
        if (!Objects.getPrototype(this, BaseStorageEngine) || this.delete === BaseStorageEngine.prototype.delete) {
            throw new RESTError(501, `The DELETE action is not supported on the StashKu "${this.name}" storage engine.`);
        } else {
            //perform request validations
            if (!request || (request instanceof DeleteRequest) === false) {
                throw new RESTError(400, 'The "request" argument is required and must be a DeleteRequest.');
            } else if (!request.metadata) {
                throw new RESTError(400, 'The "request" argument is incomplete and missing required metadata.');
            } else if (!request.metadata.from) {
                throw new RESTError(400, 'The request is missing a required "from" value.');
            } else if (!request.metadata.all && (!request.metadata.where || Filter.isEmpty(request.metadata.where))) {
                throw new RESTError(400, 'The request is missing "where" conditions to match objects in storage and is not enabled to affect all objects.');
            }
        }
    }

    /**
     * Run an OPTIONS `request` which returns a dynamically constructed model type which defines how StashKu can 
     * interact with the target (`from`) resource. 
     * 
     * @throws A 501 REST error if not overriden and supported by the storage engine.
     * @throws A 400 REST error if the request is missing or not a `OptionsRequest`.
     * @throws A 400 REST error if the request missing required metadata.
     * @throws A 400 REST error if the request metadata is missing a required "from" value.
     * @throws A 400 REST error if the request metadata is missing "where" conditions to match objects in storage and
     * is not enabled to affect all objects.
     * @param {OptionsRequest} request - The OPTIONS request to send to the storage engine.
     * @returns {Promise.<Response>} Returns a response with a single data object- the dynamically created model configuration.
     * @abstract
     */
    async options(request) {
        if (!Objects.getPrototype(this, BaseStorageEngine) || this.options === BaseStorageEngine.prototype.options) {
            throw new RESTError(501, `The OPTIONS action is not supported on the StashKu "${this.name}" storage engine.`);
        } else {
            //perform request validations
            if (!request || (request instanceof OptionsRequest) === false) {
                throw new RESTError(400, 'The "request" argument is required and must be a OptionsRequest.');
            } else if (!request.metadata) {
                throw new RESTError(400, 'The "request" argument is incomplete and missing required metadata.');
            } else if (!request.metadata.from) {
                throw new RESTError(400, 'The request is missing a required "from" value.');
            } 
        }
    }

}

export default BaseStorageEngine;