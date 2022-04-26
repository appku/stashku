///<reference path="./modeling.d.js" />
import pluralize from 'pluralize';
import RESTError from '../rest-error.js';
import Strings from '../utilities/strings.js';
import ModelValidationError from './model-validation-error.js';

const commonValidators = {
    /**
     * Ensures that a model property value is defined and non-`null`.
     * @throws `ModelValidationError` when the value is `null` or `undefined`.
     * @param {String} property - The name of the property being transformed.
     * @param {*} value - The value of the property being transformed.
     * @param {String} method - The method of the request being processed, either: "get", "post", "put", "patch", "delete", or "options".
     * @param {String} id - The request processing identifier. This is unique to each request processed through a stashku instance.
     */
    required: (property, value, method, id) => {
        if (typeof value === 'undefined' || value === null) {
            throw new ModelValidationError(property, `A value for the "${property}" property is required, it must be defined and non-null.`);
        }
    },
    /**
     * Ensures that a model property value is *truthy*.
     * @throws `ModelValidationError` when the value is not *truthy*.
     * @param {String} property - The name of the property being transformed.
     * @param {*} value - The value of the property being transformed.
     * @param {String} method - The method of the request being processed, either: "get", "post", "put", "patch", "delete", or "options".
     * @param {String} id - The request processing identifier. This is unique to each request processed through a stashku instance.
     */
    truthy: (property, value, method, id) => {
        if (value) {
            throw new ModelValidationError(property, `A truthy value for the "${property}" property must be set, the current value is "${value}".`);
        }
    },
};

/**
 * A utility class for working with StashKu-compatible model objects.
 */
class ModelUtility {

    /**
     * A common set of validators that can be used within model property definitions.
     * @see ModelProperty#validate
     */
    static get validators() {
        return commonValidators;
    }

    /**
     * Returns `true` if the model type object provided appears to be a class or constructor function, otherwise a
     * `false` value is returned.
     * @param {Modeling.AnyModel} modelType - The model "class" or constructor function to be checked.
     * @returns {Boolean}
     */
    static isValidType(modelType) {
        return !!(modelType && modelType.constructor && modelType.prototype);
    }

    /**
     * Validates that the given objects only contain properties found in the specified model type.
     * @throws Error if any of the specified objects do not match the specified model type.
     * @param {Modeling.AnyModel} modelType - The model "class" or constructor function to be checked.
     * @param {...Object} objects - The objects to evaluate.
     * @returns {Boolean} Returns `true` when all specified object's have only properties defined in the model type. If
     * any objects have properties not defined in the model type, a `false` value is returned.
     */
    static isModelType(modelType, ...objects) {
        if (objects && objects.length && ModelUtility.isValidType(modelType)) {
            let mapping = ModelUtility.map(modelType);
            //look for any properties on the object that are *not* in the specified keys.
            for (let i = 0, ilen = objects.length; i < ilen; i++) {
                if (objects[i] !== null && typeof objects[i] !== 'undefined') {
                    let oKeys = Object.keys(objects[i]);
                    for (let ok of oKeys) {
                        if (mapping.has(ok) === false) {
                            return false;
                        }
                    }
                }
            }
        }
        return true;
    }

    /**
     * Attempts to format a generically formatted property name to a JavaScript camelCase property name format.
     * @param {String} dirtyPropName - The property name value to be formatted.
     * @returns {String}
     */
    static formatPropName(dirtyPropName) {
        return Strings.camelify(dirtyPropName);
    }

    /**
     * Attempts to format a generic resource name into a model class name in PascalCase format.
     * The resource name is always suffixed with the word "Model".
     * @param {String} dirtyResourceName - The resource name value to be formatted.
     * @returns {String}
     */
    static formatModelName(dirtyResourceName) {
        return Strings.camelify(pluralize.singular(dirtyResourceName), true) + 'Model'; maxInterval
    }

    /**
     * Returns a property name mapping between stored objects and model objects. StashKu model types must have static
     * properties named after the instance properties to be mapped. The value of those properties should be the name 
     * used in the stored object, or a definition of the mapping including the name and any additional metadata.
     * @param {Modeling.AnyModel} modelType - The model "class" or constructor function.
     * @returns {Map.<String, Modeling.PropertyDefinition>}
     * 
     * @example
     * // If you had a row of data in a StashKu accessible database table with a column named 
     * // "Person_First_Name", but you wanted to have it mapped to a model's "firstName" property - the model type
     * // would declare:
     * static get firstName() { 
     *     return 'Person_First_Name';
     * }
     */
    static map(modelType) {
        let propMap = new Map();
        if (ModelUtility.isValidType(modelType)) {
            let descriptors = Object.getOwnPropertyDescriptors(modelType);
            //get static "get" property names that are readable and writable or plain values.
            for (let prop in descriptors) {
                if (prop !== '$stashku' && prop !== 'prototype' && prop != '__proto') {
                    let desc = descriptors[prop];
                    if (desc.enumerable || desc.get) {
                        let propDefinition = null;
                        let input = modelType[prop];
                        let inputType = typeof input;
                        if (inputType === 'function') {
                            input = input(modelType, prop);
                            inputType = typeof input;
                        }
                        if (inputType === 'string') {
                            propDefinition = { target: input };
                        } else if (inputType === 'object') {
                            propDefinition = input;
                            if (!propDefinition.target) {
                                //ensure a name is set on the definition object
                                propDefinition.target = prop;
                            }
                        }
                        if (propDefinition) {
                            propMap.set(prop, propDefinition);
                        }
                    }
                }
            }
        }
        return propMap;
    }

    /**
     * Returns the StashKu resource name for the given model, if specified. Optionally checks for a specific action
     * name configuration and uses it if specified. If the resource is a function, it is called with and the return
     * value is returned as the resource name.
     * 
     * If a `resource` static property is not available on the model's `$stashku` property, the model constructor
     * name is used instead.
     * @param {Modeling.AnyModel} modelType - The model "class" or constructor function.
     * @param {String} [method] - The name of the method that should override the default value if it is explicitly
     * specified. If it is not found, but an `all` or `'*'` property is found, it is used instead.
     * @returns {String}
     */
    static resource(modelType, method) {
        if (ModelUtility.isValidType(modelType)) {
            if (modelType.$stashku && modelType.$stashku.resource) {
                let resource = modelType.$stashku.resource;
                let resType = typeof resource;
                if (resType === 'string') {
                    return resource;
                } else if (resType === 'function') {
                    return resource(method); //resource is a function, call it and pass the action.
                } else if (resType === 'object') {
                    let hasAction = (typeof resource[method] !== 'undefined');
                    if (hasAction === false) {
                        //action not present, so lookf for a default fallback.
                        if (typeof resource['all'] !== 'undefined') {
                            method = 'all';
                        } else if (typeof resource['*'] !== 'undefined') {
                            method = '*';
                        } else {
                            return null;
                        }
                    }
                    //looks like a custom object with the action.
                    resType = typeof resource[method];
                    if (resType === 'string') {
                        return resource[method];
                    } else if (resType === 'function') {
                        return resource[method](method);
                    }
                }
                //fallback to null if resource is present but no valid match
            } else {
                //no resource property, so default to the class/constructor name pluralized
                return pluralize.plural(modelType.name) || null;
            }
        }
        return null;
    }

    /**
     * Returns the "primary key" property names as specified on a model configuration type.
     * @param {Modeling.AnyModel} modelType - The model "class" or constructor function.
     * @returns {Array.<String>}
     */
    static pk(modelType) {
        let primaryKeys = [];
        if (ModelUtility.isValidType(modelType)) {
            let mapping = ModelUtility.map(modelType);
            for (let [_, v] of mapping) {
                if (v && v.pk) {
                    primaryKeys.push(v.target);
                }
            }
        }
        return primaryKeys;
    }

    /**
     * Generates a model type class dynamically utilizing the given properties and configuration.
     * 
     * @throws Error if the "typeName" argument is missing.
     * @throws Error if the "properties" argument is missing.
     * @throws Error if the "properties" argument is not a Map instance.
     * @param {String} resource - The name of the target resource.
     * @param {Map.<String, Modeling.PropertyDefinition>} properties - The map of all properties definable for the model.
     * @param {Modeling.ModelConfiguration} [configuration] - The $stashku model configuration.
     * @param {String} [className] - Optional argument to utilize a specific class name instead of generating one 
     * from the resource name.
     * @returns {*}
     */
    static generateModelType(resource, properties, configuration, className) {
        if (!resource) {
            throw new RESTError(500, 'The "resource" argument is required.');
        } else if (!properties) {
            throw new RESTError(500, 'The "properties" argument is required.');
        } else if ((properties instanceof Map) === false) {
            throw new RESTError(500, 'The "properties" argument must be of type Map.');
        }
        //create model type closure
        let mtConstructor = function () {
            for (let [k, v] of properties) {
                let typeOfValue = typeof v;
                if (v === null || typeOfValue === 'undefined') {
                    this[k] = null;
                } else if (typeOfValue === 'object') {
                    this[k] = typeof v.default !== 'undefined' ? v.default : null;
                }
            }
        };
        let mt = class DynamicModel {
            constructor() { mtConstructor.call(this); }
        };
        if (!className) {
            className = ModelUtility.formatModelName(resource);
        }
        Object.defineProperty(mt, 'name', { value: className });
        //add static properties
        if (!configuration) {
            mt.$stashku = { resource };
        } else {
            mt.$stashku = configuration;
        }
        for (let [k, v] of properties) {
            if (v === null || typeof v === 'undefined') {
                mt[k] = {};
            } else {
                mt[k] = v;
            }
        }
        return mt;
    }

    /**
     * @template T
     * @typedef {new(...args: Array) | new(...args: Array) => T} Constructor
     **/

    /**
     * Use a given model type to to convert the given storage object(s) into a model (instance) of the specified model 
     * type. If a property is not mapped in the model, it is not assigned to the model.
     * @template T
     * @param {T} modelType - The model "class" or constructor function.
     * @param  {...any} objects - The raw objects to be transmuted into a model.
     * @yields {Constructor.<T>}
     * @generator
     */
    static * model(modelType, ...objects) {
        if (ModelUtility.isValidType(modelType)) {
            let mapping = ModelUtility.map(modelType);
            for (let obj of objects) {
                if (obj) {
                    let model = new modelType();
                    for (let [k, v] of mapping) {
                        if (typeof obj[v.target] !== 'undefined') {
                            model[k] = obj[v.target];
                        }
                        if (v && v.transform) { //run a transform if present.
                            model[k] = v.transform.call(modelType, k, model[k], obj, 'model');
                        }
                        if (v && v.transform) { //run a transform if present.
                            model[k] = v.transform.call(modelType, k, model[k], obj, 'model');
                        }
                    }
                    yield model;
                } else {
                    yield null;
                }
            }
        }
    }

    /**
     * Use a given model type to to revert a model back to a raw storage object with properties reprsenting those
     * used in storage.
     * @template T
     * @param {T} modelType - The model "class" or constructor function.
     * @param  {...Constructor.<T>} models - The modeled objects to be transformed back into a storage object.
     * @yields {Constructor.<T>}
     * @generator
     */
    static * unmodel(modelType, ...models) {
        if (ModelUtility.isValidType(modelType)) {
            let mapping = ModelUtility.map(modelType);
            for (let model of models) {
                if (model) {
                    let record = {};
                    for (let [k, v] of mapping) {
                        record[v.target] = model[k];
                        if (v && v.transform) { //run a transform if present.
                            record[v.target] = v.transform.call(modelType, v.target, record[v.target], model, 'unmodel');
                        }
                    }
                    yield record;
                } else {
                    yield null;
                }
            }
        }
    }

}

export default ModelUtility;