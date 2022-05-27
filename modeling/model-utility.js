///<reference path="./modeling.d.js" />
import StringUtility from '../utilities/string-utility.js';
import RESTError from '../rest-error.js';

/**
 * A utility class for working with StashKu-compatible model objects.
 */
class ModelUtility {

    /**
     * Returns `true` if the model type object provided appears to be a class or constructor function, otherwise a
     * `false` value is returned.
     * @param {Modeling.AnyModelType} modelType - The model "class" or constructor function to be checked.
     * @returns {Boolean}
     */
    static isValidType(modelType) {
        return !!(modelType && modelType.constructor && modelType.prototype);
    }

    /**
     * Returns a map of modelled properties (keys) and their definitions (values). The value is a property definition
     * that details how the modelled property maps to the underlying storage, including the actual storage `target`.
     * @param {Modeling.AnyModelType} modelType - The model "class" or constructor function.
     * @returns {Map.<String, Modeling.PropertyDefinition>}
     */
    static map(modelType) {
        let propMap = new Map();
        if (ModelUtility.isValidType(modelType)) {
            while (modelType) {
                let descriptors = Object.getOwnPropertyDescriptors(modelType);
                //get static "get" property names that are readable and writable or plain values.
                for (let prop in descriptors) {
                    if (prop !== '$stashku' && prop !== 'prototype' && prop != '__proto' && prop != 'toJSON') {
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
                            if (propDefinition && propMap.has(prop) === false) {
                                propMap.set(prop, propDefinition);
                            }
                        }
                    }
                }
                let proto = Object.getPrototypeOf(modelType);
                if (proto && proto.name && proto.prototype !== undefined) {
                    modelType = proto;
                } else {
                    modelType = null;
                }
            }
        }
        return propMap;
    }

    /**
     * Takes a model type and generates an object with the same properties used to define the model - all
     * property definitions and the `$stashku` configuration. If the `$stashku` property is not found it is generated
     * with a `resource` property and derived value.
     * @throws 500 `RESTError` if the "modelType" argument is missing or not a supported StashKu model type object.
     * @param {Modeling.AnyModelType} modelType - The model "class" or constructor function.
     * @returns {*}
     */
    static schema(modelType) {
        if (ModelUtility.isValidType(modelType) === false) {
            throw new RESTError(500, 'The "modelType" argument is required and must be a supported StashKu model type object.');
        }
        let schema = {};
        let mapping = ModelUtility.map(modelType);
        for (let [p, pDef] of mapping) {
            schema[p] = pDef;
        }
        if (typeof modelType.$stashku === 'object') {
            schema.$stashku = modelType.$stashku;
        } else {
            schema.$stashku = { resource: ModelUtility.resource(modelType) };
        }
        return schema;
    }

    /**
     * Returns the StashKu resource name for the given model, if specified. Optionally checks for a specific action
     * name configuration and uses it if specified. If the resource is a function, it is called with and the return
     * value is returned as the resource name.
     * 
     * If a `resource` static property is not available on the model's `$stashku` property, the model constructor
     * name is used instead.
     * @param {Modeling.AnyModelType} modelType - The model "class" or constructor function.
     * @param {String} [method] - The name of the method that should override the default value if it is explicitly
     * specified. If it is not found, but an `all` or `'*'` property is found, it is used instead.
     * @param {String} [resourceProp="resource"] - The resource property used from the model type to set the resource on
     * this request.
     * @returns {String}
     */
    static resource(modelType, method, resourceProp = 'resource') {
        if (ModelUtility.isValidType(modelType)) {
            if (modelType.$stashku && modelType.$stashku.resource) {
                let resource = modelType.$stashku.resource;
                switch (resourceProp) {
                    case 'name': resource = modelType.$stashku.name; break;
                    case 'slug': resource = modelType.$stashku.slug; break;
                    case 'plural.name': resource = modelType.$stashku.plural.name; break;
                    case 'plural.slug': resource = modelType.$stashku.plural.slug; break;
                }
                let resType = typeof resource;
                if (resType === 'string') {
                    return resource;
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
                    }
                }
                //fallback to null if resource is present but no valid match
            } else {
                //no resource property, so default to the class/constructor name pluralized
                return StringUtility.plural(modelType.name) || null;
            }
        }
        return null;
    }

    /**
     * Returns the "primary key" property names as specified on a model configuration type.
     * @param {Modeling.AnyModelType} modelType - The model "class" or constructor function.
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
     * @template T
     * @typedef {new(...args: Array) | new(...args: Array) => T} Constructor
     **/

    /**
     * Use a given model type to to convert the given storage object(s) into a model (instance) of the specified model 
     * type. If a property is not mapped in the model, the property (and value) will *not* be assigned to the model.
     * 
     * This method is called by StashKu after a response is returned by the underlying engine (and a model is being
     * used) but before it is handed back to the caller.
     * @throws 500 `RESTError` if the "modelType" argument is missing or not a supported StashKu model type object.
     * @throws 500 `RESTError` if the "method" argument is missing or not a string.
     * @template T
     * @param {T} modelType - The model "class" or constructor function.
     * @param {String} method - The method of the request being processed, typically: "get", "post", "put", "patch",
     * "delete", or "options".
     * @param  {...any} objects - The raw objects to be transmuted into a model.
     * @yields {Constructor.<T>}
     * @generator
     */
    static * model(modelType, method, ...objects) {
        if (ModelUtility.isValidType(modelType) === false) {
            throw new RESTError(500, 'The "modelType" argument is required and must be a supported StashKu model type object.');
        } else if (!method || typeof method !== 'string') {
            throw new RESTError(500, 'The "method" argument is required and must be a string.');
        }
        let mapping = ModelUtility.map(modelType);
        for (let obj of objects) {
            if (obj) {
                if (obj instanceof modelType) {
                    yield obj; //nothing to do, already modelType
                } else {
                    let model = new modelType();
                    for (let [k, v] of mapping) {
                        if (typeof obj[v.target] !== 'undefined') {
                            model[k] = obj[v.target];
                            //handle type conversion for objects that may have come from JSON
                            let valueType = typeof model[k];
                            if (v.type === 'Date' && (valueType === 'string' || valueType === 'number')) {
                                model[k] = new Date(model[k]);
                            } else if (v.type === 'Boolean') {
                                if (valueType === 'string') {
                                    model[k] = /^[tTyY1]/.test(model[k]);
                                } else if (valueType === 'number') {
                                    model[k] = (model[k] !== 0);
                                }
                            } else if (v.type === 'Number' && valueType === 'string') {
                                model[k] = parseFloat(model[k]);
                            }
                        } else if (typeof v.default === 'undefined') {
                            //not given by input object, and no default defined- nuke property from model instance.
                            delete model[k];
                        }
                        if (v.transform) { //run a transform if present.
                            model[k] = v.transform.call(modelType, k, model[k], obj, method, 'model');
                        }
                        if (v.omit && typeof model[k] !== 'undefined') { //omit the property if warranted
                            let omitted = (v.omit === true);
                            if (typeof v.omit === 'function') {
                                omitted = v.omit.call(modelType, k, model[k], obj, method, 'model');
                            } else if (v.omit === null && model[k] === null) {
                                omitted = true;
                            } else if (typeof v.omit === 'object') {
                                if (v.omit[method] === true) {
                                    omitted = true;
                                } else if (typeof v.omit[method] === 'function') {
                                    omitted = v.omit[method].call(modelType, k, model[k], obj, method, 'model');
                                } else if (v.omit[method] === null && model[k] === null) {
                                    omitted = true;
                                } else if (v.omit.all === true && v.omit[method] !== false) {
                                    omitted = true;
                                }
                            }
                            if (omitted === true) {
                                delete model[k];
                            }
                        }
                    }
                    yield model;
                }
            } else {
                yield null;
            }
        }
    }

    /**
     * Use a specified model type to revert models back to a regular (untyped) object.
     * 
     * Certain StashKu requests will call this automatically before the request is sent to the underlying engine.    
     * A PATCH request will attempt to unmodel it's template.    
     * A PUT & POST request will attempt to unmodel it's objects.
     * @throws 500 `RESTError` if the "modelType" argument is missing or not a supported StashKu model type object.
     * @throws 500 `RESTError` if the "method" argument is missing or not a string.
     * @template T
     * @param {T} modelType - The model "class" or constructor function.
     * @param {String} method - The method of the request being processed, typically: "get", "post", "put", "patch",
     * "delete", or "options".
     * @param  {...Constructor.<T>} models - The modeled objects to be transformed back into a storage object.
     * @yields {Constructor.<T>}
     * @generator
     */
    static * unmodel(modelType, method, ...models) {
        if (ModelUtility.isValidType(modelType) === false) {
            throw new RESTError(500, 'The "modelType" argument is required and must be a supported StashKu model type object.');
        } else if (!method || typeof method !== 'string') {
            throw new RESTError(500, 'The "method" argument is required and must be a string.');
        }
        let mapping = ModelUtility.map(modelType);
        for (let model of models) {
            if (model) {
                if (model instanceof modelType) {
                    let record = {};
                    for (let [k, v] of mapping) {
                        if (typeof model[k] !== 'undefined') { //only set a value if the property value is defined.
                            record[v.target] = model[k];
                        }
                        if (v && v.transform) { //run a transform if present.
                            record[v.target] = v.transform.call(modelType, v.target, record[v.target], model, method, 'unmodel');
                        }
                        if (v && v.omit) { //omit the property if warranted
                            let omitted = (v.omit === true);
                            if (typeof v.omit === 'function') {
                                omitted = v.omit.call(modelType, k, model[k], model, method, 'model');
                            } else if (v.omit === null && model[k] === null) {
                                omitted = true;
                            } else if (typeof v.omit === 'object') {
                                if (v.omit[method] === true) {
                                    omitted = true;
                                } else if (typeof v.omit[method] === 'function') {
                                    omitted = v.omit[method].call(modelType, k, model[k], model, method, 'model');
                                } else if (v.omit[method] === null && model[k] === null) {
                                    omitted = true;
                                } else if (v.omit.all === true && v.omit[method] !== false) {
                                    omitted = true;
                                }
                            }
                            if (omitted === true) {
                                delete record[v.target];
                            }
                        }
                    }
                    yield record;
                } else {
                    yield model; //nothing to do, already not a modelType.
                }
            } else {
                yield null;
            }
        }
    }

}

export default ModelUtility;