
/**
 * @namespace CLI
 */

/**
 * @typedef CLI.CommandLineOptions
 * @property {String} [log="error"]
 * @property {String} [env]
 * @property {String} engine
 * @property {Boolean} [quiet=false]
 * @property {Boolean} [verbose=false]
 * @property {String} [format="json"]
 * @property {Boolean} [test=false]
 */

/**
 * @typedef CLI.GetCommandLineOptions
 * @property {CLI.CommandLineOptions} cli
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
 * @typedef CLI.OptionsCommandLineOptions
 * @property {CLI.CommandLineOptions} cli
 * @property {String} [method="options"]
 * @property {String} resource
 * @property {String} export
 * @property {Boolean} [force]
 * @property {Boolean} [dryRun]
 */