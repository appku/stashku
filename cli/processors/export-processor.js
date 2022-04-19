/* eslint-disable no-console */
import BaseProcessor from './base-processor.js';
import dot from 'dot';
import StashKu, { OptionsRequest, ModelUtility } from '../../stashku.js';
import fairu from '@appku/fairu';
import path from 'path';

const __dirname = (
    process.platform === 'win32' ?
        path.dirname(decodeURI(new URL(import.meta.url).pathname)).substring(1) :
        path.dirname(decodeURI(new URL(import.meta.url).pathname))
);

dot.templateSettings.strip = false;
dot.log = false; //disable console output
const dots = dot.process({ path: path.resolve(__dirname + '/../templates') });

/**
 * Runs a standard RESTful StashKu OPTIONS request using command line options to create a model type definition
 * that can be exported to a directory with a base-class and extending class file (if not already present).
 */
export default class ExportProcessor extends BaseProcessor {
    // eslint-disable-next-line valid-jsdoc
    /**
     * Runs a standard RESTful StashKu OPTIONS request using command line options to create a model type definition
     * that can be exported to a directory with a base-class and extending class file (if not already present).
     * @param {import('../main.js').ExportCommandLineOptions} options - The command line options of the request.
     */
    constructor(options) {
        super(options);

        /**
         * @type {import('../main.js').ExportCommandLineOptions}
         */
        this.options = options;
    }

    /**
     * @inheritdoc
     */
    async start() {
        if (this.options.cli.test) {
            this.stash = new StashKu({ engine: 'memory' });
            this.stash.engine.data.set('themes', fairu.including('./test/cli/data-themes.json').parse().readSync()[0].data);
        }
        console.debug(`Running OPTIONS request on "${this.stash.engine.name}" engine from the "${this.options.resource}" resource.`);
        let res = await this.stash.options(o => o.from(this.options.resource));
        console.debug(`Total returned: ${res.returned}`);
        if (res.returned > 0) {
            for (let mt of res.data) {
                console.debug(`Exporting model type "${mt.name}".`);
                let blueprint = {
                    name: mt.name,
                    timestamp: new Date(),
                    resource: this.options.resource,
                    mapping: ModelUtility.map(mt),
                    makeJSDefinition: this.makeJSDefinition,
                    makePropertyJSDoc: this.makePropertyJSDoc,
                    makeJSDefault: this.makeJSDefault
                };
                let baseModelContent = dots['base-model'](blueprint);
                // let extModelContent = dots.model(this);
                console.log(baseModelContent);
                // console.log(extModelContent);
            }
        }
    }

    makeJSDefinition(definition, indentSpaces, indentFirstLine = false) {
        //TODO
    }

    makePropertyJSDoc(property, definition, indentSpaces, indentFirstLine = false) {
        let indent = ' '.repeat(indentSpaces);
        let output = (indentFirstLine ? indent + '/**' : '/**');
        if (definition.precision) {
            output += (output ? '\n' + indent : '') + ` * The precision (max. amount of numbers) is ${definition.precision}.`;
        }
        if (typeof definition.scale !== 'undefined' && definition.scale !== null) {
            output += (output ? '\n' + indent : '') + ` * The number of decimal places is set to ${definition.scale}.`;
        }
        if (typeof definition.length !== 'undefined' && definition.length !== null) {
            output += (output ? '\n' + indent : '') + ` * Maximum length in data storage: ${definition.length}.`;
        }
        if (definition.pk === true) {
            output += (output ? '\n' + indent : '') + ' * This is a primary-key property (it helps uniquely identify a model).';
        }
        if (definition.omitnull === true) {
            output += (output ? '\n' + indent : '') + ' * The value for this property will be omitted when `null` or `undefined`.';
        }
        //determine type
        output += (output ? '\n' + indent : '') + ` * @type {${definition.type}}`;
        //determine default
        if (definition.default) {
            output += (output ? '\n' + indent : '') + ` * @default ${this.makeJSDefault(definition)}`;
        }
        return `${output}\n${indent} */`;
    }

    /**
     * Returns the computed JavaScript value string for a property definition's default value.
     * @param {*} definition - The StashKu property definition.
     * @returns {String}
     */
    makeJSDefault(definition) {
        console.log(definition);
        if (typeof definition.default !== 'undefined') {
            //handle special JS values
            if (definition.default === null) {
                return 'null';
            } else if (isFinite(definition.default) === false) {
                return 'Infinity';
            } else if (isNaN(definition.default)) {
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
        } else if (definition.required) {
            switch (definition.type) {
                case 'Boolean': return 'false';
                case 'Number': return '0';
                case 'String': return '\'\'';
                case 'Date': return 'new Date()';
                case 'Buffer': return 'Buffer.alloc(0)';
            }
        }
    }

    /**
     * Exports a model or model type to folder or file.
     * 
     * When exporting a *model*, it will be written with all keys and values into JSON (default), YAML, or TOML,
     * depending on the file extension used. If a directory is given, the model will be exported using the primary 
     * key(s) as a file name (*.json). If no primary keys are defined, it will be exported using a random file name.
     * 
     * When exporting a *model type*, the `exportPath` must be a new or existing directory path, the model type will 
     * be written as JavaScript base and inherited class file when a file is targetted. If the inherited class 
     * file already exists, it will not be altered.
     * 
     * @throws Error if the `m` argument is missing.
     * @throws Error when passing a model and specifying an invalid "format" argument value.
     * @param {*} m - The model or model type to export.
     * @param {String} exportPath - The file or folder to write the model or model type to.
     * @param {String} [format=json] - Optional format for models being written when specifying a target directory. 
     * Can be `json`, `yaml`, or `toml`.
     * @returns {Array.<String>} Returns the file path(s) of the file(s) written or checked. When a model type is
     * given, the file at index `0` will be the inheriting model class, and the file at index `1` will be the
     * base model class.
     */
    // async export(m, exportPath, format) {
    //     let filePaths = [];
    //     if (!exportPath) {
    //         throw new RESTError(500, 'The "exportPath" argument is required.');
    //     }
    //     if (m) {
    //         let pathInfo = await Files.including(exportPath).nullify().stat();
    //         if (m.$stashku || m.constructor.name === 'Function') {
    //             //model type

    //         } else {
    //             //model
    //             if ((pathInfo.stat && pathInfo.stat.isDir) || exportPath.endsWith(Files.sep)) { //directory
    //                 let pks = ModelUtility.pk(m.constructor);
    //                 let fileName;
    //                 format = format ? format : 'json';
    //                 if (format && !format.match(/json|toml|yaml/)) {
    //                     throw new RESTError(500, `Invalid "format" argument: expected "json", "yaml", or "toml", but found "${format}".`);
    //                 }
    //                 if (pks && pks.length) {
    //                     fileName = `${pks.reduce((pv, cv) => m[cv], '')}.${format}`;
    //                 } else {
    //                     fileName = `${Randomization.uuidv4()}.${format}`;
    //                 }
    //                 exportPath = Files.join(exportPath, fileName);
    //             }
    //             await Files.including(exportPath).ensure().stringify().write(m);
    //             filePaths.push(Files.resolve(exportPath));
    //         }
    //     } else {
    //         throw new RESTError(500, 'The first argument (model or model-type) is required.');
    //     }
    //     return filePaths;
    // }
}