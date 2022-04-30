/* eslint-disable no-console */
///<reference path="../modeling/modeling.d.js" />
import dot from 'dot';
import StashKu from '../stashku.js';
import OptionsRequest from '../requests/options-request.js';
import ModelUtility from '../modeling/model-utility.js';
import fairu, { Util as FairuUtil } from '@appku/fairu';
import strings from '../utilities/strings.js';
import Response from '../response.js';
import path from 'path';

const __dirname = (
    process.platform === 'win32' ?
        path.dirname(decodeURI(new URL(import.meta.url).pathname)).substring(1) :
        path.dirname(decodeURI(new URL(import.meta.url).pathname))
);

dot.templateSettings.strip = false;
dot.log = false; //disable console output
const dots = dot.process({ path: path.resolve(__dirname, './templates') });

/**
 * Class that is responsible for exporting the `Response` to an StashKu `OptionsRequest`.
 */
class OptionsExporter {
    /**
     * Creates an instance of the `OptionsExporter` class.
     */
    constructor() { }

    /**
     * 
     * @param {Response} optionsResponse - The response to an `OptionsRequest`.
     * @param {{dirPath: String, overwrite: Boolean}} [outputConfig] - Configuration options for writing results to
     *   a directory.
     * @returns {Map.<String, {base: String, extending: String}>}
     */
    async export(optionsResponse, outputConfig) {
        let mapping = new Map();
        if (optionsResponse.returned > 0) {
            for (let mt of optionsResponse.data) {
                let blueprint = {
                    name: mt.name,
                    slug: strings.slugify(mt.name, '-', true, true),
                    config: mt.$stashku,
                    timestamp: new Date(),
                    resource: mt.$stashku.resource,
                    mapping: ModelUtility.map(mt),
                    makeJSDefinition: this.makeJSDefinition,
                    makePropertyJSDoc: this.makePropertyJSDoc,
                    makeJSDefault: this.makeJSDefault,
                    makeJSConfiguration: this.makeJSConfiguration,
                    makeJSFunctionOrArrayFunctions: this.makeJSFunctionOrArrayFunctions
                };
                let baseModelContent = dots['base-model'](blueprint);
                let extModelContent = dots.model(blueprint);
                mapping.set(mt.$stashku.resource, {
                    base: baseModelContent,
                    extending: extModelContent
                });
                // if (this.options.dryRun) {
                //     console.log(baseModelContent);
                //     console.log(extModelContent);
                // }
            }
        }
        return mapping;
    }

    /**
     * Creates a string representation of the property definition object.
     * @param {Modeling.PropertyDefinition} definition - The property definition object.
     * @param {Number} indentLevel - The level of indent applied to contents (4-spaces per level).
     * @param {Boolean} indentFirstLine - Enable or disable indenting the first line of the returned string.
     * @returns {String}
     */
    makeJSDefinition(definition, indentLevel = 0, indentFirstLine = false) {
        let indent = '    ';
        let indentRoot = indent.repeat(indentLevel);
        let output = (indentFirstLine ? indentRoot : '') + '{';
        if (definition && definition.target) {
            output += `\n${indentRoot}${indent}target: '${definition.target}'`;
            if (definition.type) {
                output += `,\n${indentRoot}${indent}type: '${definition.type}'`;
            }
            if (typeof definition.default !== 'undefined') {
                output += `,\n${indentRoot}${indent}default: ${this.makeJSDefault(definition)}`;
            }
            // if (definition.precision) {
            //     output += `${indent}    precision: ${definition.precision}\n`;
            // }
            // if (definition.radix) {
            //     output += `${indent}    radix: ${definition.radix}\n`;
            // }
            // if (definition.charLength) {
            //     output += `${indent}    charLength: ${definition.charLength}\n`;
            // }
            if (definition.omit) {
                if (typeof definition.omit === 'boolean') {
                    output += `,\n${indentRoot}${indent}omit: ${definition.omit}`;
                } else if (Array.isArray(definition.omit)) {
                    output += `,\n${indentRoot}${indent}omit: ${this.makeJSFunctionOrArrayFunctions(definition.omit, indentLevel + 1, false)}`;
                }
            }
            if (definition.pk) {
                output += `,\n${indentRoot}${indent}pk: ${definition.pk}`;
            }
            if (definition.transform) {
                output += `,\n${indentRoot}${indent}transform: ${this.makeJSFunctionOrArrayFunctions(definition.transform, indentLevel + 1, false)}`;
            }
            if (definition.validate) {
                output += `,\n${indentRoot}${indent}validate: ${this.makeJSFunctionOrArrayFunctions(definition.validate, indentLevel + 1, false)}`;
            }
            output += '\n' + indentRoot;
        }
        return output + '}';
    }

    /**
     * Creates a string representation of the property definition object.
     * @param {String} property - The property name.
     * @param {Modeling.PropertyDefinition} definition - The property definition object.
     * @param {Number} indentLevel - The level of indent applied to contents (4-spaces per level).
     * @param {Boolean} indentFirstLine - Enable or disable indenting the first line of the returned string.
     * @returns {String}
     */
    makePropertyJSDoc(property, definition, indentLevel, indentFirstLine = false) {
        let indent = '    ';
        let indentRoot = indent.repeat(indentLevel);
        let output = (indentFirstLine ? indentRoot + '/**' : '/**');
        if (definition.precision) {
            output += (output ? '\n' + indentRoot : '') + ` * The precision (max. amount of numbers) is ${definition.precision}.`;
        }
        if (typeof definition.scale !== 'undefined' && definition.scale !== null) {
            output += (output ? '\n' + indentRoot : '') + ` * The number of decimal places is set to ${definition.scale}.`;
        }
        if (typeof definition.length !== 'undefined' && definition.length !== null) {
            output += (output ? '\n' + indentRoot : '') + ` * Maximum length in data storage: ${definition.length}.`;
        }
        if (definition.pk === true) {
            output += (output ? '\n' + indentRoot : '') + ' * This is a primary-key property (it helps uniquely identify a model).';
        }
        //determine type
        output += (output ? '\n' + indentRoot : '') + ` * @type {${definition.type}}`;
        //determine default
        if (definition.default) {
            output += (output ? '\n' + indentRoot : '') + ` * @default ${this.makeJSDefault(definition)}`;
        }
        return `${output}\n${indentRoot} */`;
    }

    /**
     * Returns the computed JavaScript value string for a property definition's default value.
     * @param {*} definition - The StashKu property definition.
     * @param {String} className - The name of the model class.
     * @param {String} propertyName - The name of the property we are creating a default value for.
     * @returns {String}
     */
    makeJSDefault(definition, className, propertyName) {
        if (typeof definition.default !== 'undefined') {
            //handle special JS values
            if (definition.default === null) {
                return 'null';
            } else if (definition.default === Infinity) {
                return 'Infinity';
                // eslint-disable-next-line use-isnan
            } else if (definition.default === NaN) {
                return 'NaN';
            }
            //output JS representation by type.
            if (definition.type === 'Boolean' || definition.type === 'Number') {
                return definition.default.toString();
            } else if (definition.type === 'String') {
                return `'${definition.default}'`;
            } else if (definition.type === 'Date') {
                return `new Date('${definition.default.toISOString()}')`;
            } else if (definition.type === 'Buffer') {
                if (definition.default.byteLength) {
                    return `Buffer.from('${definition.default.toString('base64')}', 'base64')`;
                } else {
                    return 'Buffer.alloc(0)';
                }
            }
        } else {
            return 'null';
        }
    }

    /**
     * Outputs a string of JavaScript that describes a model `$stashku` property.
     * @param {Modeling.Configuration} config - The `$stashku` definition object.
     * @param {Number} indentLevel - The level of indent applied to contents (4-spaces per level).
     * @param {Boolean} indentFirstLine - Enable or disable indenting the first line of the returned string.
     * @returns {String}
     */
    makeJSConfiguration(config, indentLevel, indentFirstLine = false) {
        let indent = '    ';
        let indentRoot = indent.repeat(indentLevel);
        if (config && config.resource) {
            let output = (indentFirstLine ? indentRoot : '') + '{';
            output += `\n${indentRoot}${indent}resource: '${config.resource}'`;
            if (config.name) {
                output += `\n${indentRoot}${indent}name: '${config.name}'`;
            }
            if (config.slug) {
                output += `\n${indentRoot}${indent}slug: '${config.slug}'`;
            }
            if (config.plural) {
                output += `\n${indentRoot}${indent}plural: {`;
                if (config.plural.name) {
                    output += `\n${indentRoot}${indent}${indent}name: '${config.plural.name}'`;
                }
                if (config.plural.slug) {
                    output += `\n${indentRoot}${indent}${indent}name: '${config.plural.slug}'`;
                }
                output += `\n${indentRoot}${indent}}`;
            }
            return output + '\n' + indentRoot + '}';
        }
        return '{}';
    }

    /**
     * Outputs a string of JavaScript defining a function or array of functions.
     * @param {Array.<Function>|Function} func - The property definition object.
     * @param {Number} indentLevel - The level of indent applied to contents (4-spaces per level).
     * @param {Boolean} indentFirstLine - Enable or disable indenting the first line of the returned string.
     * @returns {String}
     */
    makeJSFunctionOrArrayFunctions(func, indentLevel, indentFirstLine = false) {
        let indent = '   ';
        let indentRoot = indent.repeat(indentLevel);
        if (Array.isArray(func)) {
            let output = (indentFirstLine ? indentRoot : '') + '{\n';
            return output + indent + '}';
        } else if (typeof obj === 'function') {
            let output = func.toString();
            return output;
        }
        return 'null';
    }

}

export default OptionsExporter;