import GetRequest from '../requests/get-request.js';
import PostRequest from '../requests/post-request.js';
import PutRequest from '../requests/put-request.js';
import PatchRequest from '../requests/patch-request.js';
import DeleteRequest from '../requests/delete-request.js';
import Response from '../response.js';

/**
 * @callback ModelConfigurationResourceCallback
 * @param {String} action - The action request being processed, either: "get", "post", "put", "patch", or "delete".
 * @returns {String}
 */

/**
 * Defines the resource name used for a model on specific request actions. If a specific action is `undefined` the 
 * `all` property value will be used, otherwise the target resource will not be set automatically for the model under
 * a request of the `undefined` action.
 * @typedef ModelConfigurationResource
 * @property {ModelConfigurationResourceCallback & String} [all] - The default resource name to use if an explicit action resource is not specified in this object.
 * @property {ModelConfigurationResourceCallback & String} [get] - The resource name to use explicitly for GET requests. 
 * @property {ModelConfigurationResourceCallback & String} [post] - The resource name to use explicitly for POST requests. 
 * @property {ModelConfigurationResourceCallback & String} [put] - The resource name to use explicitly for PUT requests. 
 * @property {ModelConfigurationResourceCallback & String} [patch] - The resource name to use explicitly for PATCH requests. 
 * @property {ModelConfigurationResourceCallback & String} [delete] - The resource name to use explicitly for DELETE requests. 
 */

/**
 * @callback ModelConfigurationOverrideRequest
 * @param {GetRequest|PostRequest|PutRequest|PatchRequest|DeleteRequest} request - The request being made.
 */

/**
 * @callback ModelConfigurationOverrideResponse
 * @param {GetRequest|PostRequest|PutRequest|PatchRequest|DeleteRequest} request - The request that resulted in the given response.
 * @param {Response} response - The response object resulting from a request before it is handed back to the requestor.
 */

/**
 * Override callbacks for either when a request is about to be processed (`request`) or after a response has been
 * processed but not yet handed back to the requestor (`response`).
 * @typedef ModelConfigurationOverride
 * @property {ModelConfigurationOverrideRequest} request
 * @property {ModelConfigurationOverrideResponse} response
 */

/**
 * @callback ModelConfigurationMapCallback
 * @param {Map.<String, String>} mapping
 * @param {GetRequest|PostRequest|PutRequest|PatchRequest|DeleteRequest} request - The active request (if any).
 * @param {Response} response - The active response (if any).
 */

/**
 * Defines configuration rules for how a model should be processed by StashKu in a request & response.
 */
export default class ModelConfiguration {
    /**
     * Creates a new `ModelConfiguration` instance that defines rules for how a model should be processed by StashKu
     * in a request & response.
     * @param {ModelConfigurationResource|String} resource The StashKu resource (name).
     * @param  {...String} pk - The "primary key" (identifier) property name(s) that uniquely identify the model 
     * among others.
     */
    constructor(resource, ...pk) {

        /**
         * The StashKu resource (name) that contains objects like this model.
         * 
         * Defines the resource name used for a model on specific request actions. If a specific action is `undefined` the 
         * `all` property value will be used, otherwise the target resource will not be set automatically for the model under
         * a request of the `undefined` action.
         * @type {ModelConfigurationResource & String}
         */
        this.resource = resource || null;

        /**
         * The key property name(s) that uniquely identify the model among others.
         * @type {String|Array.<String>}
         */
        this.pk = pk;

        /**
         * Allows an override of requests and responses through callbacks for either when a *request* is about to be
         * processed (`request`) or after a *response* has been processed but not yet handed back to the requestor
         * (`response`).
         * @type {ModelConfigurationOverride}
         */
        this.override = null;

        /**
         * A mapping of property names from the model to the property (a.k.a. field, column, etc.) name in the
         * storage medium. If the map is not specified, the property names will be used verbatim.
         * 
         * - When a `Map` object the `key` is the model property name, and the `value` is the name in the storage 
         * medium.
         * - When an object is specified, it's properties and values are converted into a `Map`. The property names
         * should match properties on the model, with the values matching those in the storage medium.
         * - When a callback, the default `Map` of the model is passed in the `mapping` argument and can be modified.
         * @type {Map.<String, String>|{}|ModelConfigurationMapCallback}
         */
        this.map = null;
    }
}