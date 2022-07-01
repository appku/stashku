import RESTError from '../rest-error.js';
import ModelUtility from './model-utility.js';
import StringUtility from '../utilities/string-utility.js';

/**
 * A utility class for working with StashKu-compatible model objects.
 */
class ModelGenerator {

    /**
     * Attempts to format a generically formatted property name to a JavaScript camelCase property name format.
     * @param {String} dirtyPropName - The property name value to be formatted.
     * @returns {String}
     */
    static formatPropName(dirtyPropName) {
        return StringUtility.camelify(dirtyPropName);
    }

    /**
     * Attempts to format a generic resource name into a model class name in PascalCase format.
     * The resource name is always suffixed with the word "Model".
     * 
     * This function leverages the `STASHKU_MODEL_NAME_REMOVE` environmental setting, which allows you to configure
     * one or more regular expressions that are removed from a generated model's class name (derived from a resource
     * name). By default the configured expressions will strip "dbo.", "etl.", and "rpt." prefixes from resource names.
     * @param {String} dirtyResourceName - The resource name value to be formatted.
     * @param {String} [suffix="Model"] - A suffix attached to the model name. Defaults to "Model".
     * @returns {String}
     */
    static formatModelName(dirtyResourceName, suffix = 'Model') {
        let removes = ['/^\\[?dbo\\]?./i', '/^\\[?etl\\]?./i', '/^\\[?rpt\\]?./i'];
        if (typeof process !== 'undefined' && typeof process.env === 'object') {
            if (process.env.STASHKU_MODEL_NAME_REMOVE) {
                removes = JSON.parse(process.env.STASHKU_MODEL_NAME_REMOVE);
            }
        }
        if (removes && Array.isArray(removes)) {
            for (let rStr of removes) {
                let reg = StringUtility.toRegExp(rStr);
                dirtyResourceName = dirtyResourceName.replace(reg, '');
            }
        }
        dirtyResourceName = dirtyResourceName.replace(/[[\]{}]/g, '');
        return StringUtility.camelify(StringUtility.singular(dirtyResourceName), true) + (suffix ?? '');
    }

    /**
     * Generates a model type class dynamically utilizing the given properties and configuration.
     * 
     * @throws 500 `RESTError` if the "typeName" argument is missing.
     * @throws 500 `RESTError` if the "properties" argument is missing.
     * @throws 500 `RESTError` if the "properties" argument is not a Map instance.
     * @param {String} resource - The name of the target resource.
     * @param {Map.<String, Modeling.PropertyDefinition>} properties - The map of all properties definable for the model.
     * @param {Modeling.Configuration} [configuration] - The $stashku model configuration.
     * @param {String} [className] - Optional argument to utilize a specific class name instead of generating one 
     * from the resource name.
     * @returns {Modeling.AnyModelType}
     */
    static generateModelType(resource, properties, configuration, className) {
        if (!resource) {
            throw new RESTError(500, 'The "resource" argument is required.');
        } else if (!properties) {
            throw new RESTError(500, 'The "properties" argument is required.');
        } else if ((properties instanceof Map) === false) {
            throw new RESTError(500, 'The "properties" argument must be of type Map.');
        }
        let sortedProperties = new Map();
        //presort
        properties = new Map([...properties.entries()].sort());
        //pascal-case keys
        for (let [k, v] of properties) {
            let formattedKey = StringUtility.camelify(k, true);
            if (formattedKey != k && sortedProperties.has(formattedKey) === false) {
                sortedProperties.set(formattedKey, v);
            } else {
                sortedProperties.set(k, v);
            }
        }
        //sort final
        sortedProperties = new Map([...sortedProperties.entries()].sort());
        //create model type closure
        let mtConstructor = function () {
            for (let [k, v] of sortedProperties) {
                let typeOfValue = typeof v;
                if (v === null || typeOfValue === 'undefined') {
                    this[k] = undefined;
                } else if (typeOfValue === 'object') {
                    this[k] = typeof v.default !== 'undefined' ? v.default : null;
                }
            }
        };
        let mt = class DynamicModel {
            constructor() { mtConstructor.call(this); }
            validate() {
                //build initial results using all static keys
                let validationResults = {};
                for (let k of Object.keys(this.constructor)) {
                    let inputType = typeof this.constructor[k];
                    if (/^([$_].+|prototype|name)$/.test(k) === false  && (inputType === 'string' || inputType === 'object')) {
                        validationResults[k] = null;
                    }
                }
                //run validations
                let validations = this.constructor?.$stashku?.validations;
                if (typeof validations === 'object') {
                    for (let k in validations) {
                        let v = validations[k];
                        let res = null;
                        if (Array.isArray(v)) {
                            for (let func of v) {
                                res = func.call(this, this, k, this[k]);
                                if (res) {
                                    break;
                                }
                            }
                        } else {
                            res = v.call(this, this, k, this[k]);
                        }
                        validationResults[k] = res ?? null; //ensure null instead of undefined
                    }
                }
                return validationResults;
            }
        };
        if (!className) {
            className = ModelGenerator.formatModelName(resource);
        }
        Object.defineProperty(mt, 'name', { value: className });
        //add json stringification support
        let toSchema = ModelUtility.schema;
        mt.toJSON = (function () {
            return toSchema(this);
        }).bind(mt);
        //add static properties
        for (let [k, v] of sortedProperties) {
            if (v === null || typeof v === 'undefined') {
                mt[k] = {};
            } else {
                mt[k] = v;
            }
        }
        //add $stashku configuration static property
        if (!configuration) {
            mt.$stashku = {};
        } else {
            mt.$stashku = configuration;
        }
        //add helper names to configration if missing
        if (!mt.$stashku.resource) {
            mt.$stashku.resource = resource;
        }
        if (!mt.$stashku.validations) {
            mt.$stashku.validations = {};
        }
        if (!mt.$stashku.name) {
            mt.$stashku.name = ModelGenerator.formatModelName(resource, '');
        }
        if (!mt.$stashku.slug) {
            mt.$stashku.slug = StringUtility.slugify(mt.$stashku.name, '-', true, true);
        }
        if (!mt.$stashku.plural) {
            mt.$stashku.plural = {};
        }
        if (!mt.$stashku.plural.name) {
            mt.$stashku.plural.name = StringUtility.camelify(StringUtility.plural(mt.$stashku.name), true);
        }
        if (!mt.$stashku.plural.slug) {
            mt.$stashku.plural.slug = StringUtility.slugify(mt.$stashku.plural.name, '-', true, true);
        }
        return mt;
    }

}

export default ModelGenerator;
