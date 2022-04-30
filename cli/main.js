#!/usr/bin/env node
/* eslint-disable no-console */
import fairu from '@appku/fairu';
import StashKu, { Response, RESTError } from '../stashku.js';
import { Command, Option } from 'commander/esm.mjs';
import { createRequire } from 'module';
import dotenv from 'dotenv';
import RequestProcessor from './processors/request-processor.js';

/**
 * @typedef MainState
 * @property {{stashKu:String, stashKuLog: String, stashKuCLI:String}} versions
 * @property {CommandLineOptions} opts
 * @property {*} args
 */

/**
 * @typedef CommandLineOptions
 * @property {String} [log="error"]
 * @property {String} [env]
 * @property {Boolean} [quiet=false]
 * @property {Boolean} [verbose=false]
 * @property {String} [format="json"]
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
            .option('-q, --quiet', 'Do not output status information to the console.')
            .option('-v, --verbose', 'Output extra details & logs about the command being executed.')
            .addOption(new Option('--format <format>', 'Defines the format of the resulting data when converted to a string.').default('json').choices(['json', 'yaml', 'toml']))
            .option('--test', 'Use the in-memory engine preloaded with a "themes" resource for testing.')
            .showSuggestionAfterError()
            .showHelpAfterError();
        this.cmd
            .command('get <resource|requestFile>').description('Runs a GET request on the target resource, or from a request definition file, and then optionally saves the results to file.')
            .option('-w, --where <filter>', 'Specify a StashKu compatable filter string to utilize as a where-clause for the get query.')
            .option('-s, --skip <skip>', 'Skip over a number of records.', parseInt)
            .option('-t, --take <take>', 'Take only the first number of records.', parseInt)
            .option('-p, --prop, --property <properties...>', 'Retrieve only the specified properties.')
            .option('-d, --distinct', 'Retrieve only distinct (unique) results.')
            .option('-c, --count', 'Retrieve the count of records only (no data records).')
            .option('-sb, --sort-by <sorts>', 'List of properties to sort by. You can specify a direction after each property name (e.g. "-sb {FirstName} desc, {LastName} asc").')
            .option('--save <filepath>', 'Saves the GET request to file. You can re-use these request files in place of the resource (see: <requestFile>).')
            .option('-O, --output <outputpath>', 'Saves the engine response to the specified file.')
            .action(this.request.bind(this));
        this.cmd
            .command('options <resource|requestFile>').description('Runs an OPTIONS request to export a resource\'s model type. You can optionally specify an --export (-x) option to generate JavaScript model files into a target directory.')
            .option('-x, --export <exportpath>', 'Generates a base and extending JavaScript classes around the resulting OPTIONS response and writes them to a folder. If the extending class is already present, it is not overwritten, however, the base class is always written to a base/ subdirectory.')
            .option('-f, --force', 'Forces the overwrite of the extending JavaScript class file when using the --export (-x) option.')
            .option('--dry-run', 'Perform a dry-run of an export. Instead of writing files or creating directories directories, the generated files will be written to the console.')
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
                throw new Error(`The target .env file "${envFilePath}" is a directory.`);
            } else {
                dotenv.config({ path: envFilePath });
            }
            if (!this.state.opts.quiet && this.state.opts.verbose) {
                console.debug(`Loaded .env from "${envFilePath}" OK.`);
            }
        } else {
            if (!this.state.opts.quiet && this.state.opts.verbose) {
                console.debug(`The target .env file "${envFilePath}" was not found.`);
            }
        }
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
            if (!this.state.opts.quiet && this.state.opts.verbose) {
                console.debug(`Starting the "${processor.constructor.name}" with options:`, processor.options);
            }
            await processor.start();
            if (!this.state.opts.quiet && this.state.opts.verbose) {
                console.log('Done.');
            }
        } catch (err) {
            console.error(err.message);
            process.exit(1);
        }
    }

}

export default new Main();