#!/usr/bin/env node
/* eslint-disable no-console */
import fairu from '@appku/fairu';
import StashKu, { Response, RESTError } from '../stashku.js';
import { Command, Option } from 'commander/esm.mjs';
import { createRequire } from 'module';
import dotenv from 'dotenv';
import RequestProcessor from './processors/request-processor.js';
import ExportProcessor from './processors/export-processor.js';

/**
 * @typedef MainState
 * @property {{stashKu:String, stashKuLog: String, stashKuCLI:String}} versions
 */

/**
 * @typedef CommandLineOptions
 * @property {String} [log="error"]
 * @property {String} [env]
 * @property {Boolean} [test=false]
 */

/**
 * @typedef GetCommandLineOptions
 * @property {CommandLineOptions} cli
 * @property {String} [method="get"]
 * @property {String} resource
 * @property {String} filePath
 * @property {String} [where]
 * @property {Number} [skip]
 * @property {Number} [take]
 * @property {Array.<String>} [prop]
 * @property {Boolean} [distinct=false]
 * @property {Boolean} [count=false]
 * @property {Array.<String>} [sortBy]
 * @property {String} [format="json"]
 * @property {Boolean} [quiet=false]
 * @property {String} [saveRequest]
 * @property {String} [loadRequest]
 */

/**
 * @typedef ExportCommandLineOptions
 * @property {CommandLineOptions} cli
 * @property {String} [method="export"]
 * @property {String} resource
 * @property {String} dirPath
 * @property {Boolean} [force]
 * @property {Boolean} [dryRun]
 */

class Main {
    /**
     * Constructs the `Main` class and initializes the command line parsing and execution.
     */
    constructor() {

        /**
         * @type {Command}
         */
        this.cmd = null;

        /**
         * @type {MainState}
         */
        this.state = null;

        this.initialize(); //configure stashku cli
        this.cmd.parse(); //process CLI
    }

    /**
     * Sets up the inital state of the CLI (Main) - configures the command-line options and commands and
     * binds to the handlers.
     * @private
     */
    initialize() {
        //init 
        this.cmd = new Command();
        this.state = {
            args: Array.from(process.argv)
        };
        //discover state
        let require = createRequire(import.meta.url);
        let packages = fairu.including(
            './package.json', //stashku
            fairu.join(fairu.dirname(require.resolve('@appku/fairu')), 'package.json') //stashku-log
        ).nullify().parse().readSync();
        this.state.versions = {
            stashKu: packages[0].data?.version || '[Error Reading Version]',
            fairu: packages[1].data?.version || '[Error Reading Version]'
        };
        //setup CLI
        this.cmd
            .version(`StashKu: v-${this.state.versions.stashKu}\nFairu: v-${this.state.versions.fairu}\n`)
            .option('-e, --env <filepath>', 'Specify a .env file to load. This .env will be loaded instead of any .env in the current working directory.')
            .option('--test', 'Use the in-memory engine preloaded with a "themes" resource for testing.')
            .showSuggestionAfterError()
            .showHelpAfterError();
        this.cmd
            .command('export <resource> <dirpath>').description('Exports a resource\'s model type via an OPTIONS request to a target modelling directory. This creates files for a base model class in an "generated" subfolder and an extending class (if it does not already exist or the `-f` argument is present). You can then import these classes directly into your package for use with StashKu and the engine of your choice.')
            .option('-f, --force', 'Forcibly overwrite the extending model class, if present.')
            .option('--dry-run', 'Perform a dry-run of an export. Will not write files or create directories. Note: Output is logged under "debug" severity (see `-l` argument)')
            .action(this.export.bind(this));
        this.cmd
            .command('get <resource|requestFile>').description('Runs a GET request on the target resource, or from a request definition file, and then optionally saves the results to file.')
            .option('-w, --where <filter>', 'Specify a StashKu compatable filter string to utilize as a where-clause for the get query.')
            .option('-s, --skip <skip>', 'Skip over a number of records.', parseInt)
            .option('-t, --take <take>', 'Take only the first number of records.', parseInt)
            .option('-p, --prop, --property <properties...>', 'Retrieve only the specified properties.')
            .option('-d, --distinct', 'Retrieve only distinct (unique) results.')
            .option('-c, --count', 'Retrieve the count of records only (no data records).')
            .option('-sb, --sort-by <sorts>', 'List of properties to sort by. You can specify a direction after each property name (e.g. "-sb {FirstName} desc, {LastName} asc").')
            .addOption(new Option('--format <format>', 'Defines the format of the resulting data when converted to a string.').default('json').choices(['json', 'yaml', 'toml']))
            .option('-q, --quiet', 'Do not output the query or data result to the console.')
            .option('--save <filepath>', 'Saves the GET request to file. You can re-use these request files in place of the resource (see: <requestFile>).')
            .option('-O, --output <outputpath>', 'Saves the engine response to the specified file.')
            .action(this.request.bind(this));
    }

    /**
     * Configures the state of Main based on the environment and command-line options. This should be called before
     * starting a processor to carry out work.
     * @protected
     */
    async configure() {
        this.state.opts = this.cmd.opts();
        let envFilePath = fairu.join(process.cwd(), '.env');
        if (this.state.opts.env) {
            envFilePath = this.state.opts.env;
        }
        let envStat = await fairu.including(envFilePath).nullify().stat();
        if (envStat !== null && envStat[0].stat) {
            if (envStat[0].stat.isDirectory()) {
                throw new Error(`Target .env file "${envFilePath}" is a directory.`);
            } else {
                dotenv.config({ path: envFilePath });
            }
            console.debug(`Loaded .env from "${envFilePath}".`);
        } else {
            console.warn(`Target .env file "${envFilePath}" was not found.`);
        }
    }

    /**
     * Runs a StashKu RESTful OPTIONS request and generates a model type base-class and extending class and writes the
     * definitions to the specified directory.
     * @param {String} resource - The name of the target resource in the StashKu resource.
     * @param {String} dirPath - The writable directory that will retain extending models and base-class files.
     * @param {ExportCommandLineOptions} options - The CLI options specified in object format.
     * @param {*} command - The CLI command that is being run.
     */
    async export(resource, dirPath, options, command) {
        let workerOptions = Object.assign({}, options);
        workerOptions.method = command.name();
        workerOptions.resource = resource;
        workerOptions.dirPath = dirPath;
        workerOptions.cli = this.cmd.opts();
        await this.process(new ExportProcessor(workerOptions));
    }

    /**
     * Runs a StashKu RESTful GET request and outputs the results to file or console.
     * @param {String} resource - The name of the target resource in the StashKu resource.
     * @param {GetCommandLineOptions} [options] - The CLI options specified in object format.
     * @param {*} command - The CLI command that is being run.
     */
    async request(resource, options, command) {
        let workerOptions = Object.assign({}, options);
        workerOptions.method = command.name();
        workerOptions.resource = resource;
        workerOptions.cli = this.cmd.opts();
        await this.process(new RequestProcessor(workerOptions));
    }

    /**
     * Starts a processor after ensuring the configuration has been loaded.
     * @param {BaseProcessor} processor - The processor to start.
     */
    async process(processor) {
        try {
            //load environment
            await this.configure();
            //start worker
            console.log(`Starting the "${processor.options.method}" command...`);
            console.debug(`Starting ${processor.options.method} processor with options:`, processor.options);
            await processor.start();
            console.log('Done.');
        } catch (err) {
            console.error(err.message);
        }
    }

}

export default new Main();