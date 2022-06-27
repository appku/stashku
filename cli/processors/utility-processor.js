/* eslint-disable no-console */
///<reference path="../cli.d.js" />
import GetRequest from '../../requests/get-request.js';
import OptionsRequest from '../../requests/options-request.js';
import Filter from '../../filter.js';
import Sort from '../../sort.js';
import ModelUtility from '../../modeling/model-utility.js';
import BaseProcessor from './base-processor.js';
import StashKu from '../../stashku.js';
import OptionsExporter from '../options-exporter.js';
import fairu from '@appku/fairu';
import path from 'path';

const __dirname = (
    process.platform === 'win32' ?
        path.dirname(decodeURI(new URL(import.meta.url).pathname)).substring(1) :
        path.dirname(decodeURI(new URL(import.meta.url).pathname))
);

/**
 * Runs a standard RESTful StashKu GET request using command line options to define the request metadata. Callers can
 * optionally save output to file.
 */
class UtilityProcessor extends BaseProcessor {
    // eslint-disable-next-line valid-jsdoc
    /**
     * Runs a standard RESTful StashKu request using command line options to define the request metadata. Callers can
     * optionally save output to file.
     * @param {CLI.GetCommandLineOptions | CLI.OptionsCommandLineOptions} options - The command line options of the request.
     */
    constructor(options) {
        super(options);
    }

    /**
     * @inheritdoc
     */
    async start() {
       
    }

}

export default UtilityProcessor;