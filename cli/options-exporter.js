/* eslint-disable no-console */
///<reference path="../modeling/modeling.d.js" />
import dot from 'dot';
import StashKu from '../stashku.js';
import OptionsRequest from '../requests/options-request.js';
import ModelUtility from '../modeling/model-utility.js';
import fairu, { Util as FairuUtil } from '@appku/fairu';
import Strings from '../utilities/strings.js';
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
                    slug: Strings.slugify(mt.name, '-', true, true),
                    config: mt.$stashku,
                    timestamp: new Date(),
                    resource: mt.$stashku.resource,
                    mapping: ModelUtility.map(mt),
                    toJavaScriptString: this.toJavaScriptString,
                    makePropertyJSDoc: this.makePropertyJSDoc,
                    toJavascriptPropertyDefaultReference: this.toJavascriptPropertyDefaultReference
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
     * Converts a supported StashKu model property value to a string representation. 
     * @param {*} value - The value to be converted to a string.
     * @param {Number} [indentLevel=0] - The level of indent applied to contents (4-spaces per level).
     * @param {Boolean} [indentFirstLine=false] - Enable or disable indenting the first line of the returned string.
     * @returns {String} 
     */
    toJavaScriptString(value, indentLevel = 0, indentFirstLine = false) {
        let indent = '    ';
        let indentRoot = indent.repeat(indentLevel);
        let valueType = typeof value;
        let output = (indentFirstLine ? indentRoot : '');
        let parents = arguments[3] || [];
        //prevent circular values by forcing a null result
        if (parents && value && parents.some(a => a === value)) {
            output += 'null';
        } else {
            parents.push(value);
            if (value && value.constructor === Object) {
                let keys = Object.keys(value);
                if (keys.length > 0) {
                    output += '{';
                    for (let ki = 0; ki < keys.length; ki++) {
                        output += `\n${indentRoot}${indent}${keys[ki]}: ${this.toJavaScriptString(value[keys[ki]], indentLevel + 1, false, parents)}`;
                        if (ki < keys.length - 1) {
                            output += ',';
                        }
                    }
                    output += `\n${indentRoot}}`;
                } else {
                    output += '{}';
                }
            } else if (Array.isArray(value)) {
                if (value.length > 0) {
                    output += '[';
                    for (let iv = 0; iv < value.length; iv++) {
                        output += `\n${this.toJavaScriptString(value[iv], indentLevel + 1, true, parents)}`;
                        if (iv < value.length - 1) {
                            output += ',';
                        }
                    }
                    output += `\n${indentRoot}]`;
                } else {
                    output += '[]';
                }
            } else if (valueType === 'undefined') {
                output += valueType;
            } else if (value === null) {
                output += 'null';
            } else if (value === NaN) { // eslint-disable-line use-isnan
                output += 'NaN';
            } else if (valueType === 'boolean' || valueType === 'number') {
                output += value.toString();
            } else if (valueType === 'string') {
                output += `'${value}'`;
            } else if (value instanceof Date) {
                output += `new Date('${value.toISOString()}')`;
            } else if (value instanceof Buffer) {
                if (value.byteLength) {
                    output += `Buffer.from('${value.toString('base64')}', 'base64')`;
                } else {
                    output += 'Buffer.alloc(0)';
                }
            } else if (valueType === 'function') {
                output += Strings.indent(value.toString(), 1, null, indentRoot);
            }
        }
        return output;
    }

    /**
     * Creates a string representation of the property definition object.
     * @param {String} property - The property name.
     * @param {Modeling.PropertyDefinition} definition - The property definition object.
     * @param {Number} [indentLevel=0] - The level of indent applied to contents (4-spaces per level).
     * @param {Boolean} [indentFirstLine=false] - Enable or disable indenting the first line of the returned string.
     * @returns {String}
     */
    makePropertyJSDoc(property, definition, indentLevel = 0, indentFirstLine = false) {
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
     * Creates a string representation of the property definition object.
     * @param {String} className - The name of the model class.
     * @param {String} propertyName - The name of the property we are creating a default value for.
     * @param {Modeling.PropertyDefinition} definition - The StashKu property definition.
     * @returns {String}
     */
    toJavascriptPropertyDefaultReference(className, propertyName, definition) {
        let defaultType = typeof definition.default;
        if (!className) {
            className = 'this.constructor';
        }
        if (defaultType === 'function') {
            return `${className}.${propertyName}.default()`;
        }
        return `${className}.${propertyName}.default ?? null`;
    }
}

export default OptionsExporter;