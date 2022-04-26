
/**
 * @namespace Modeling
 */

/**
 * @typedef Modeling.AnyModel
 * @property {import('./model-configuration.js').default} [$stashku]
 */

/**
 * @callback Modeling.ModelPropertyValidationCallback
 * @param {String} property - The name of the property being transformed.
 * @param {*} value - The value of the property being transformed.
 * @param {String} method - The method of the request being processed, either: "get", "post", "put", "patch", "delete", or "options".
 * @param {String} [id] - The request processing identifier. This is unique to each request processed through a stashku instance.
 */

/**
 * @callback Modeling.ModelPropertyOmitCallback
 * @param {String} property - The name of the property being transformed.
 * @param {*} value - The value of the property being transformed.
 * @param {String} method - The method of the request being processed, either: "get", "post", "put", "patch", "delete", or "options".
 * @param {String} [id] - The request processing identifier. This is unique to each request processed through a stashku instance.
 * @returns {Boolean}
 */

/**
 * @callback Modeling.ModelPropertyTransformCallback
 * @param {String} property - The name of the property being transformed.
 * @param {*} value - The value of the property being transformed.
 * @param {*} rawObject - The source object being modelled or unmodelled.
 * @param {String} step - Either "model" or "unmodel", depending on whether the transformation is occuring during modelling or unmodelling.
 */

/**
 * @typedef Modeling.PropertyDefinition
 * @property {String} target - The target resource property/column/field for this model's property.
 * @property {String} [type] - The JavaScript type intended for the property value.
 * @property {*} [default] - The default value for this models property. This is used when a model type is generated and set in the model constructor.
 * @property {Boolean|ModelPropertyOmitCallback} [omit=false] - If true, the property is ignored (not included) when null or undefined from processing in a request.
 * @property {Boolean} [pk=false] - Indicates the property is a primary-key identifier for the model.
 * @property {ModelPropertyTransformCallback} [transform] - A callback that allows for values to be transformed whenever objects are turned into a model, or the model is "unmodelled" into a regular object.
 * @property {ModelPropertyValidationCallback|Array.<ModelPropertyValidationCallback>} [validate] - A function that validates the property value. Upon failure of a validation condition, the function should throw an error.
 */

/**
 * Defines the resource name used for a model on specific request actions. If a specific action is `undefined` the 
 * `all` property value will be used, otherwise the target resource will not be set automatically for the model under
 * a request of the `undefined` action.
 * @typedef Modeling.ModelConfigurationResource
 * @property {String} [all] - The default resource name to use if an explicit action resource is not specified in this object.
 * @property {String} [get] - The resource name to use explicitly for GET requests. 
 * @property {String} [post] - The resource name to use explicitly for POST requests. 
 * @property {String} [put] - The resource name to use explicitly for PUT requests. 
 * @property {String} [patch] - The resource name to use explicitly for PATCH requests. 
 * @property {String} [delete] - The resource name to use explicitly for DELETE requests. 
 */

/**
 * The StashKu resource (name) that contains objects like this model.
 * 
 * Defines the resource name used for a model on specific request actions. If a specific action is `undefined` the 
 * `all` property value will be used, otherwise the target resource will not be set automatically for the model under
 * a request of the `undefined` action.
 * @typedef Modeling.ModelConfiguration
 * @property {Modeling.ModelConfigurationResource|String} resource
 */