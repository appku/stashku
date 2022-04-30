/* eslint-disable no-console */
///<reference path="../cli.d.js" />
import BaseProcessor from './base-processor.js';
import StashKu, { GetRequest, OptionsRequest, Filter, Sort } from '../../stashku.js';
import ModelUtility from '../../modeling/model-utility.js';
import fairu, { Util as FairuUtil } from '@appku/fairu';
import OptionsExporter from '../options-exporter.js';

/**
 * Runs a standard RESTful StashKu GET request using command line options to define the request metadata. Callers can
 * optionally save output to file.
 */
class RequestProcessor extends BaseProcessor {
    // eslint-disable-next-line valid-jsdoc
    /**
     * Runs a standard RESTful StashKu request using command line options to define the request metadata. Callers can
     * optionally save output to file.
     * @param {CLI.GetCommandLineOptions | CLI.OptionsCommandLineOptions} options - The command line options of the request.
     */
    constructor(options) {
        super(options);

        /**
         * @type {CLI.GetCommandLineOptions | CLI.OptionsCommandLineOptions}
         */
        this.options = options;
    }

    /**
     * @inheritdoc
     */
    async start() {
        if (this.options.cli.test) {
            this.stash = new StashKu({ engine: 'memory' });
            this.stash.engine.data.set('products', fairu.including('./test/memory-storage-engine/data-products.json').parse().readSync()[0].data);
            this.stash.engine.data.set('themes', fairu.including('./test/memory-storage-engine/data-themes.json').parse().readSync()[0].data);
        }
        let reqFile = await fairu.including(this.options.resource)
            .nullify()
            .parse()
            .read();
        //build the request
        let req = null;
        if (reqFile[0].read) {
            req = StashKu.requestFromObject(reqFile[0].data);
        }
        if (this.options.method === 'get') {
            req = this.buildGet(req);
        } else if (this.options.method === 'options') {
            req = this.buildOptions(req);
        } else {
            throw new Error(`No supported method specified for processing ("${this.options.method}" is invalid or unsupported).`);
        }
        //save query to file (do this early to help facilitate troubleshooting).
        if (this.options.save) {
            await fairu.including(this.options.save).stringify().write(req);
        }
        //run the request
        if (!this.options.cli.quiet && this.options.cli.verbose) {
            console.debug(`Running GET request on "${this.stash.engine.name}" engine for the "${this.options.resource}" resource.`);
            console.debug(JSON.stringify(req.metadata, null, 4));
        }
        let res = await this.stash[this.options.method](req);
        //output response to console
        if (!this.options.cli.quiet) {
            let outputObj = res;
            //handle options requests sending a constructor instead of instance.
            if (this.options.method === 'options') {
                outputObj = Object.assign({}, res, { data: [] });
                for (let i = 0; i < res.returned; i++) {
                    outputObj.data.push(ModelUtility.schema(res.data[i]));
                }
            }
            console.log(FairuUtil.stringify(this.options.cli.format, outputObj));
        }
        //save output to file
        if (this.options.output) {
            await fairu.including(this.options.output).stringify().write(res);
        }
        //handle options exporting
        if (this.options.method === 'options') {
            let exportMap = await new OptionsExporter().export(res, {
                dirPath: this.options.dirPath,
                overwrite: !!this.options.force
            });
            if (!this.options.cli.quiet && this.options.cli.verbose) {
                for (let [resource, mt] of exportMap) {
                    if (mt) {
                        console.log(`/** ${resource} base: **/\n${mt.base}\n\n/**${resource} extending: **/\n${mt.extending}`);
                    } else {
                        console.log(`${resource}: <null>`);
                    }
                }
            }
        }
    }

    /**
     * Builds a `GetRequest` from the command-line/processor options.
     * @param {GetRequest} req - An exisiting `GetRequest` to build upon.
     * @returns {GetRequest}
     */
    buildGet(req) {
        if (!req) {
            req = new GetRequest();
            req.from(this.options.resource);
        } else if ((req instanceof GetRequest) === false) {
            throw new Error('The "req" argument when specified must be a GetRequest instance.');
        }
        if (Array.isArray(this.options.prop) && this.options.prop.length) {
            req.properties(...this.options.prop);
        }
        if (typeof this.options.skip !== 'undefined' && isNaN(this.options.skip) === false) {
            req.skip(this.options.skip);
        }
        if (typeof this.options.take !== 'undefined' && isNaN(this.options.take) === false) {
            req.take(this.options.take);
        }
        if (this.options.distinct) {
            req.distinct();
        }
        if (this.options.count) {
            req.count();
        }
        if (this.options.where) {
            req.where(Filter.parse(this.options.where));
        }
        if (this.options.sortBy) {
            req.sort(Sort.parse(this.options.sortBy));
        }
        return req;
    }

    /**
     * Builds a `OptionsRequest` from the command-line/processor options.
     * @param {OptionsRequest} req - An exisiting `OptionsRequest` to build upon.
     * @returns {OptionsRequest}
     */
    buildOptions(req) {
        if (!req) {
            req = new OptionsRequest();
            req.from(this.options.resource);
        } else if ((req instanceof OptionsRequest) === false) {
            throw new Error('The "req" argument when specified must be a OptionsRequest instance.');
        }
        return req;
    }

}

export default RequestProcessor;