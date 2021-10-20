import pluralize from 'pluralize';

/**
 * @typedef AnyModelType
 * @property {import('./model-configuration.js').default} [$stashku]
 */

/**
 * A utility class for working with StashKu-compatible model objects.
 */
export default class ModelUtility {

    /**
     * Returns `true` if the model type object provided appears to be a class or constructor function, otherwise a
     * `false` value is returned.
     * @param {AnyModelType} modelType - The model "class" or constructor function to be checked.
     * @returns {Boolean}
     */
    static isValidType(modelType) {
        return !!(modelType && modelType.constructor && modelType.prototype);
    }

    /**
     * Validates that the given objects only contain properties found in the specified model type.
     * @throws Error if any of the specified objects do not match the specified model type.
     * @param {AnyModelType} modelType - The model "class" or constructor function to be checked.
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
     * Returns a property name mapping between stored objects and model objects. StashKu model types must have static
     * properties named after the instance properties to be mapped. The value of those properties should be the name 
     * used in the stored object, or a definition of the mapping including the name and any additional metadata.
     * @param {AnyModelType} modelType - The model "class" or constructor function.
     * @returns {Map.<String, { name: String }>}
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
     * @param {AnyModelType} modelType - The model "class" or constructor function.
     * @param {String} [action] - The name of the action that should override the default value if it is explicitly
     * specified. If it is not found, but an `all` or `'*'` property is found, it is used instead.
     * @returns {String}
     */
    static resource(modelType, action) {
        if (ModelUtility.isValidType(modelType)) {
            if (modelType.$stashku && modelType.$stashku.resource) {
                let resource = modelType.$stashku.resource;
                let resType = typeof resource;
                if (resType === 'string') {
                    return resource;
                } else if (resType === 'function') {
                    return resource(action); //resource is a function, call it and pass the action.
                } else if (resType === 'object') {
                    let hasAction = (typeof resource[action] !== 'undefined');
                    if (hasAction === false) {
                        //action not present, so lookf for a default fallback.
                        if (typeof resource['all'] !== 'undefined') {
                            action = 'all';
                        } else if (typeof resource['*'] !== 'undefined') {
                            action = '*';
                        } else {
                            return null;
                        }
                    }
                    //looks like a custom object with the action.
                    resType = typeof resource[action];
                    if (resType === 'string') {
                        return resource[action];
                    } else if (resType === 'function') {
                        return resource[action](action);
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
     * Returns the "primary key" property names as specified in the model's `$stashku.pk` property.
     * @param {AnyModelType} modelType - The model "class" or constructor function.
     * @returns {Array.<String>}
     */
    static pk(modelType) {
        let primaryKeys = [];
        if (ModelUtility.isValidType(modelType)) {
            let mapping = ModelUtility.map(modelType);
            for (let [k, v] of mapping) {
                if (v && v.pk) {
                    if (v.target) {
                        primaryKeys.push(v.target);
                    } else {
                        primaryKeys.push(k);
                    }
                }
            }
        }
        return primaryKeys;
    }

    /**
     * Runs a model's request or response override callbacks, if any have been defined. If no overrides have been
     * defined this call will do nothing.
     * @param {AnyModelType} modelType - The model "class" or constructor function.
     * @param {*} req - The active restful request.
     * @param {*} [res] - The active response (if any).
     */
    static override(modelType, req, res) {
        if (ModelUtility.isValidType(modelType) && req) {
            if (modelType.$stashku && modelType.$stashku.override) {
                if (res && modelType.$stashku.override.response) {
                    modelType.$stashku.override.response.call(modelType, req, res);
                } else if (modelType.$stashku.override.request) {
                    modelType.$stashku.override.request.call(modelType, req);
                }
            }
        }
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
     * @yields {<Constructor.<T>}
     * @generator
     */
    static * model(modelType, ...objects) {
        if (ModelUtility.isValidType(modelType)) {
            let mapping = ModelUtility.map(modelType);
            for (let obj of objects) {
                if (obj) {
                    let model = new modelType();
                    for (let [k, v] of mapping) {
                        if (typeof obj[v.target] !== undefined) {
                            model[k] = obj[v.target];
                        }
                        if (v && v.transform) { //run a transform if present.
                            model[k] = v.transform.call(modelType, model[k], 'model', obj);
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
     * @yields {<Constructor.<T>}
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
                            record[v.target] = v.transform.call(modelType, record[v.target], 'unmodel', model);
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