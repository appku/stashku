/* eslint-disable no-console */
import BaseProcessor from './base-processor.js';
import StashKu, { GetRequest, Filter, Sort } from '../../stashku.js';
import fairu, { Util as FairuUtil } from '@appku/fairu';

/**
 * Runs a standard RESTful StashKu GET request using command line options to define the request metadata. Callers can
 * optionally save output to file.
 */
class RequestProcessor extends BaseProcessor {
    // eslint-disable-next-line valid-jsdoc
    /**
     * Runs a standard RESTful StashKu request using command line options to define the request metadata. Callers can
     * optionally save output to file.
     * @param {import('../main.js').GetCommandLineOptions} options - The command line options of the request.
     */
    constructor(options) {
        super(options);

        /**
         * @type {import('../main.js').GetCommandLineOptions}
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
        if (this.options.method === 'get') {
            let reqFile = await fairu.including(this.options.resource)
                .nullify()
                .parse()
                .read();
            //build the request
            let gr = null;
            if (reqFile[0].read) {
                gr = StashKu.requestFromObject(reqFile[0].data);
            } else {
                gr = new GetRequest();
                gr.from(this.options.resource);
            }
            if (Array.isArray(this.options.prop) && this.options.prop.length) {
                gr.properties(...this.options.prop);
            }
            if (typeof this.options.skip !== 'undefined' && isNaN(this.options.skip) === false) {
                gr.skip(this.options.skip);
            }
            if (typeof this.options.take !== 'undefined' && isNaN(this.options.take) === false) {
                gr.take(this.options.take);
            }
            if (this.options.distinct) {
                gr.distinct();
            }
            if (this.options.count) {
                gr.count();
            }
            if (this.options.where) {
                gr.where(Filter.parse(this.options.where));
            }
            if (this.options.sortBy) {
                gr.sort(Sort.parse(this.options.sortBy));
            }
            //save query to file (do this early to help facilitate troubleshooting).
            if (this.options.save) {
                await fairu.including(this.options.save).stringify().write(gr);
            }
            //run the request
            if (!this.options.cli.quiet && this.options.cli.verbose) {
                console.debug(`Running GET request on "${this.stash.engine.name}" engine for the "${this.options.resource}" resource.`);
                console.debug(JSON.stringify(gr.metadata, null, 4));
            }
            let res = await this.stash.get(gr);
            //output response to console
            if (!this.options.cli.quiet) {
                console.log(FairuUtil.stringify(this.options.cli.format, res));
            }
            //save output to file
            if (this.options.output) {
                await fairu.including(this.options.output).stringify().write(res);
            }
        } else {
            throw new Error('No method specified for processing.');
        }
    }
}

export default RequestProcessor;