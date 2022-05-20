
/**
 * @namespace Modeling
 */

/**
 * @typedef Modeling.AnyModelType
 * @property {Modeling.Configuration} [$stashku]
 */

/**
 * Defines the string value used for a specific request method. If a specific method is `undefined` the 
 * `all` property value will be used as a fallback.
 * @typedef Modeling.StringByRequestMethod
 * @property {String} [all] - The default value to use if an explicit request method is not specified on this object.
 * @property {String} [get] - The value to use explicitly for GET requests. 
 * @property {String} [post] - The value to use explicitly for POST requests. 
 * @property {String} [put] - The value to use explicitly for PUT requests. 
 * @property {String} [patch] - The value to use explicitly for PATCH requests. 
 * @property {String} [delete] - The value to use explicitly for DELETE requests. 
 * @property {String} [options] - The value to use explicitly for OPTIONS requests. 
 */

/**
 * Defines the boolean value used for a specific request method. If a specific method is `undefined` the 
 * `all` property value will be used as a fallback.
 * @typedef Modeling.BooleanByRequestMethod
 * @property {Boolean} [all] - The default value to use if an explicit request method is not specified on this object.
 * @property {Boolean} [get] - The value to use explicitly for GET requests. 
 * @property {Boolean} [post] - The value to use explicitly for POST requests. 
 * @property {Boolean} [put] - The value to use explicitly for PUT requests. 
 * @property {Boolean} [patch] - The value to use explicitly for PATCH requests. 
 * @property {Boolean} [delete] - The value to use explicitly for DELETE requests. 
 * @property {Boolean} [options] - The value to use explicitly for OPTIONS requests. 
 */

/**
 * @callback Modeling.PropertyTransformCallback
 * @param {String} property - The name of the property being transformed.
 * @param {*} value - The value of the property being transformed.
 * @param {*} model - The source object being modelled or unmodelled.
 * @param {String} method - The method of the request being processed, either: "get", "post", "put", "patch", "delete", or "options".
 * @param {String} step - Either "model" or "unmodel", depending on whether the transformation is occuring during modelling or unmodelling.
 */

/**
 * @callback Modeling.PropertyOmitCallback
 * @param {String} property - The name of the property being ommitted.
 * @param {*} value - The value of the property being ommitted.
 * @param {*} model - The source object being modelled or unmodelled.
 * @param {String} method - The method of the request being processed, either: "get", "post", "put", "patch", "delete", or "options".
 * @param {String} step - Either "model" or "unmodel", depending on whether the transformation is occuring during modelling or unmodelling.
 * @returns {Boolean}
 */

/**
 * @typedef Modeling.PropertyDefinition
 * @property {String} target - The target resource property/column/field for this model's property.
 * @property {String} [type] - The JavaScript type intended for the property value.
 * @property {*} [default] - The default value for this models property. This is used when a model type is generated and set in the model constructor.
 * @property {Boolean | Modeling.BooleanByRequestMethod | Modeling.PropertyOmitCallback} [omit=false] - If true, the property is ignored (not included) from processing in a request if the model instance value is null or undefined.
 * @property {Boolean} [pk=false] - Indicates the property is a primary-key identifier for the model.
 * @property {Modeling.PropertyTransformCallback} [transform] - A callback that allows for values to be transformed whenever objects are turned into a model, or the model is "unmodelled" into a regular object.
 * @property {Number} [precision] - The maximum amount of number places, including decimals that may be used. This property is not used by StashKu directly, but may be leveraged by certain engines.
 * @property {Number} [radix] - The number of decimal places. This property is not used by StashKu directly, but may be leveraged by certain engines.
 * @property {Number} [charLength] - The maximum amount of storable characters. This property is not used by StashKu directly, but may be leveraged by certain engines.
 */

/**
 * The StashKu resource (name) that contains objects like this model.
 * 
 * Defines the resource name used for a model on specific request actions. If a specific action is `undefined` the 
 * `all` property value will be used, otherwise the target resource will not be set automatically for the model under
 * a request of the `undefined` action.
 * @typedef Modeling.Configuration
 * @property {String | Modeling.StringByRequestMethod} resource - The resource name of the model.
 * @property {String} [slug] - An optionally stored, singular, lower-kebab-case slugified representation of this model's name.
 * @property {String} [name] - An optionally stored, singular, PascalCase version of this model's name.
 * @property {{slug: String, name: String}} [plural] - An optionally stored, plural form of the model's slug and name.
 */