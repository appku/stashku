#!/usr/bin/env node
///<reference path="./cli.d.js" />
/* eslint-disable no-console */
import { Command, Option } from 'commander/esm.mjs';
import fairu from '@appku/fairu';
import path from 'path';
import dotenv from 'dotenv';
import RequestProcessor from './processors/request-processor.js';

const __dirname = (
    process.platform === 'win32' ?
        path.dirname(decodeURI(new URL(import.meta.url).pathname)).substring(1) :
        path.dirname(decodeURI(new URL(import.meta.url).pathname))
);

/**
 * @typedef MainState
 * @property {{stashKu:String, stashKuLog: String, stashKuCLI:String}} versions
 * @property {CLI.CommandLineOptions} opts
 * @property {*} args
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
        //get package.json
        let pkg = fairu.packageJSON(path.join(__dirname, '..'));
        //setup CLI
        this.cmd
            .version(`StashKu: v-${pkg.version}`)
            .option('-e, --env <filepath>', 'Specify a .env file to load. This .env will be loaded instead of any .env in the current working directory.')
            .option('-q, --quiet', 'Do not output status information to the console.')
            .option('-v, --verbose', 'Output extra details & logs about the command being executed.')
            .addOption(new Option('--format <format>', 'Defines the format of the resulting data when converted to a string.').default('json').choices(['json', 'yaml', 'toml']))
            .option('--test', 'Use the in-memory engine preloaded with a "themes" and "products" resources for testing.')
            .showSuggestionAfterError()
            .showHelpAfterError();
        this.cmd
            .command('get').description('Runs a GET request on the target resource, or from a request definition file, and then optionally saves the results to file.')
            .argument('<resource|requestFile>', 'The name of the resource being targetted in the request, or a path to a file containing a saved options request.')
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
            .command('options').description(
                'Runs an OPTIONS request to export a resource\'s model type. ' +
                'You can optionally specify an --export (-x) option to generate JavaScript model files into a target directory.\n\n' +
                'Example:\n' +
                'Run a "*" options request on the testing (in-memory engine) with verbose (-v) output and send generated classes to console (--dry-run).\n' +
                '> stashku -v --test options --dry-run "*"\n\n' +
                'Example:\n' +
                'Run a request on a specific resource and export to a "models" directory.\n' +
                '> stashku options dbo.Contacts -x ./models'
            )
            .argument('<resource|requestFile|"*">', 'The name of the resource being targetted in the request, or a path to a file containing a saved options request, or a value "*" (use quotes) to target all resources in the request.')
            .option('-f, --force', 'Forces the overwrite of the extending JavaScript class file when using the --export (-x) option.')
            .option('--dry-run', 'Perform a dry-run of an export. Instead of writing files or creating directories directories, the generated files will be written to the console.')
            .option('--save <filepath>', 'Saves the OPTIONS request to file. You can re-use these request files in place of the resource (see: <requestFile>).')
            .option('-O, --output <outputpath>', 'Saves the engine response to the specified file.')
            .option('-x, --export <exportPath>', 'Generates base and extending JavaScript classes around the resulting OPTIONS response and writes them to a folder. If the extending class is already present, it is not overwritten, however, the base class is always written to a base/ subdirectory.')
            .action(this.request.bind(this));
    }

    /**
     * Configures the state of Main based on the environment and command-line options. This should be called before
     * starting a processor to carry out work.
     * @protected
     */
    async configure() {
        this.state.opts = this.cmd.opts();
        let pathStates = await fairu.with(p => this.state.opts.env ?? p.join(process.cwd(), '.env'))
            .throw(false)
            .discover();
        if (pathStates.length && pathStates[0].stats) {
            if (pathStates[0].stats.isDirectory()) {
                throw new Error(`The target .env file "${pathStates[0].path}" is a directory.`);
            } else {
                dotenv.config({ path: pathStates[0].path });
            }
            if (!this.state.opts.quiet && this.state.opts.verbose) {
                console.debug(`Loaded .env from "${pathStates[0].path}" OK.`);
            }
        } else {
            if (!this.state.opts.quiet && this.state.opts.verbose) {
                console.debug(`The target .env file "${pathStates[0].path}" was not found.`);
            }
        }
    }

    /**
     * Runs a StashKu RESTful GET request and outputs the results to file or console.
     * @param {String} resource - The name of the target resource in the StashKu resource.
     * @param {CLI.GetCommandLineOptions | CLI.OptionsCommandLineOptions} [options] - The CLI options specified in object format.
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
            if (processor.stash) {
                await processor.stash.destroy();
            }
        } catch (err) {
            if (this.state.opts.verbose) {
                throw err;
            } else {
                console.error(err.message);
            }
            process.exit(1);
        }
    }

}

export default new Main();