import fs from 'fs';
import path from 'path';
import { URL } from 'url';
import glob from 'glob';
import toml from '@iarna/toml';
import yaml from 'js-yaml'; 

const _isTOMLFilePath = function (filePath) {
    if (
        (typeof filePath === 'string' && filePath.match(/.+\.toml$/i))
        || (filePath instanceof URL && filePath.pathname.match(/.+\.toml$/i))
    ) {
        return true;
    }
    return false;
};
const _isYAMLFilePath = function (filePath) {
    if (
        (typeof filePath === 'string' && filePath.match(/.+\.ya?ml$/i))
        || (filePath instanceof URL && filePath.pathname.match(/.+\.ya?ml$/i))
    ) {
        return true;
    }
    return false;
};

/**
 * A chainable utility class for working with one or more files. 
 */
class Files {
    /**
     * Creates a new instance of a `Files` object.
     * @param {...String} [filePaths] - The file paths to perform operations on.
     */
    constructor(...filePaths) {

        /**
         * @type {Boolean|String}
         * @private
         */
        this._parse = false;

        /**
         * @type {Boolean|String}
         * @private
         */
        this._stringify = false;

        /**
         * @type {String}
         * @private
         */
        this._encoding = null;

        /**
         * @type {Boolean}
         * @private
         */
        this._nullify = false;

        /**
         * @type {String|URL|Buffer|Number}
         * @private
         */
        this._filePaths = filePaths || [];

        /**
         * @type {{include:Array.<String>, exclude:Array.<String>}}
         * @private
         */
        this._glob = {};

        /**
         * @type {String}
         * @private
         */
        this._root = process.cwd();
    }

    /**
     * The runtime OS's directory path seperator character string.
     * @type {String}
     */
    static get sep() {
        return path.sep;
    }

    /**
     * Join all arguments together and normalize the resulting path.
     * Arguments must be strings. Non-string arguments throw an exception.
     * 
     * This is equivilent to the node built-in `path.join` function.
     * @param  {...String} paths - The paths to join.
     * @returns {String}
     */
    static join(...paths) {
        return path.join(...paths);
    }

    /**
     * Return the directory name of a path.
     * 
     * This is equivilent to the node built-in `path.dirname` function.
     * @param {String} p - The path to get the directory name of.
     * @returns {String}
     */
    static dirname(p) {
        return path.dirname(p);
    }

    /**
     * Normalize a string path, reducing '..' and '.' parts.
     * When multiple slashes are found, they're replaced by a single one; when the path contains a trailing slash, it
     * is preserved. On Windows backslashes are used.
     * 
     * This is equivilent to the node built-in `path.normalize` function.
     * @param {String} p - The path to normalize.
     * @returns {String}
     */
    static normalize(p) {
        return path.normalize(p);
    }

    /**
     * The right-most parameter is considered {to}.  Other parameters are considered an array of {from}.
     *
     * Starting from leftmost {from} parameter, resolves {to} to an absolute path.
     *
     * If {to} isn't already absolute, {from} arguments are prepended in right to left order,
     * until an absolute path is found. If after using all {from} paths still no absolute path is found,
     * the current working directory is used as well. The resulting path is normalized,
     * and trailing slashes are removed unless the path gets resolved to the root directory.
     * 
     * This is equivilent to the node built-in `path.resolve` function.
     * @param {...String} pathSegments - The path to resolve.
     * @returns {String}
     */
    static resolve(...pathSegments) {
        return path.resolve(...pathSegments);
    }

    /**
     * Returns the extension of the path, from the last '.' to end of string in the last portion of the path.
     * If there is no '.' in the last portion of the path or the first character of it is '.', then it returns an
     * empty string.
     * @param {String} p - The path to evaluate.
     * @returns {String}
     */
    static extname(p) {
        return path.extname(p);
    }

    /**
     * Adds the specified file paths to the the file operation chain. File paths are not tested for existence and
     * can therefore cause an error if they are not found.
     * @param  {...String} filePaths - One or more paths to a file.
     * @returns {Files}
     */
    including(...filePaths) {
        this._filePaths = this._filePaths.concat(filePaths);
        return this;
    }

    /**
     * Adds the specified file paths to the the file operation chain. File paths are not tested for existence and
     * can therefore cause an error if they are not found.
     * @param  {...String} filePaths - One or more paths to a file.
     * @returns {Files}
     */
    static including(...filePaths) {
        return new Files(...filePaths);
    }

    /**
     * Sets the root directory for relative paths being resolved.
     * @param {String} rootDirectory - The root directory path. Defaults to the current working directory.
     * @returns {Files}
     */
    root(rootDirectory) {
        this._root = rootDirectory || null;
        return this;
    }

    /**
     * Sets the root directory for relative paths being resolved.
     * @param {String} rootDirectory - The root directory path. Defaults to the current working directory.
     * @returns {Files}
     */
    static root(rootDirectory) {
        return new Files().root(rootDirectory);
    }

    /**
     * Scans the file system for files matching the given glob pattern(s). This method replaces existing glob patterns.
     * 
     * See the [glob package](https://www.npmjs.com/package/glob) for more information.
     * @param {...String} pattern - One or more glob patterns to scan for files.
     * @param {String} [rootDirectory] - The relative file system root to use for relative paths. Defaults to the 
     * current working directory.
     * @returns {Files}
     */
    glob(...patterns) {
        this._glob.include = patterns;
        return this;
    }

    /**
     * Scans the file system for files matching the given glob pattern(s). This method replaces existing glob patterns.
     * 
     * See the [glob package](https://www.npmjs.com/package/glob) for more information.
     * @param {...String} pattern - One or more glob patterns to scan for files.
     * @param {String} [rootDirectory] - The relative file system root to use for relative paths. Defaults to the 
     * current working directory.
     * @returns {Files}
     */
    static glob(...patterns) {
        return new Files().glob(...patterns);
    }

    /**
     * Sets glob patterns for matching files to ignore. This method replaces existing ignore patterns.
     * 
     * See the [glob package](https://www.npmjs.com/package/glob) for more information.
     * @param {...String} pattern - One or more glob patterns to scan for files.
     * @returns {Files}
     */
    ignore(...patterns) {
        this._glob.exclude = patterns;
        return this;
    }

    /**
     * Sets glob patterns for matching files to ignore. This method replaces existing ignore patterns.
     * 
     * See the [glob package](https://www.npmjs.com/package/glob) for more information.
     * @param {...String} pattern - One or more glob patterns to scan for files.
     * @returns {Files}
     */
    static ignore(...patterns) {
        return new Files().ignore(...patterns);
    }

    /**
     * Sets the parsing flag for use on "read" operations.
     * 
     * Calling this function without a `parse` parameter argument will set the flag to `true`.
     * @param {Boolean|String} parse - When set, "read" operations will parse objects from the file contents instead of
     * utilizing a `Buffer`. If `parse` is true, the contents will attempt to be parsed based on the file extension 
     * used, falling back to JSON if other parses fail. Currently supports TOML, YAML or JSON files. Optionally pass 
     * a string of "toml", "yaml", or "json" to force parsing using a specific format.
     * @returns {Files}
     */
    parse(parse) {
        if (typeof parse === 'undefined') {
            parse = true;
        }
        this._parse = parse || false;
        return this;
    }

    /**
     * Sets the parsing flag for use on "read" operations.
     * 
     * Calling this function without a `parse` parameter argument will set the flag to `true`.
     * @param {Boolean|String} parse - When set, "read" operations will parse objects from the file contents instead of
     * utilizing a `Buffer`. If `parse` is true, the contents will attempt to be parsed based on the file extension 
     * used, falling back to JSON if other parses fail. Currently supports TOML, YAML or JSON files. Optionally pass 
     * a string of "toml", "yaml", or "json" to force parsing using a specific format.
     * @returns {Files}
     */
    static parse(parse) {
        return new Files().parse(parse);
    }

    /**
     * Sets the stringify flag for use on "write" operations.
     * 
     * Calling this function without a `stringify` parameter argument will set the flag to `true`.
     * @param {Boolean|String} stringify - Stringifies content to the file instead of performing a buffered 
     * write. If `parse` is true, the contents will attempt to be stringified based on the file extension used, falling
     * back to JSON if other parses fail. Currently supports TOML, YAML or JSON files. Optionally pass 
     * a string of "toml", "yaml", or "json" to force parsing using a specific format.
     * @returns {Files}
     */
    stringify(stringify) {
        if (typeof stringify === 'undefined') {
            stringify = true;
        }
        this._stringify = stringify || false;
        return this;
    }

    /**
     * Sets the stringify flag for use on "write" operations.
     * @param {Boolean|String} stringify - Stringifies content to the file instead of performing a buffered 
     * write. If `parse` is true, the contents will attempt to be stringified based on the file extension used, falling
     * back to JSON if other parses fail. Currently supports TOML, YAML or JSON files. Optionally pass 
     * a string of "toml", "yaml", or "json" to force parsing using a specific format.
     * @returns {Files}
     */
    static stringify(stringify) {
        return new Files().stringify(stringify);
    }

    /**
     * Sets the text file encoding.
     * @param {String} encoding - The file text encoding to use when reading and writing files.
     * @returns {Files}
     */
    encoding(encoding) {
        this._encoding = encoding || null;
        return this;
    }

    /**
     * Sets the text file encoding.
     * @param {String} encoding - The file text encoding to use when reading and writing files.
     * @returns {Files}
     */
    static encoding(encoding) {
        return new Files().encoding(encoding);
    }

    /**
     * Sets the option to have file operation return a null result on a per-file basis when running an operation if
     * an error occurs. If this is not enabled (`false`), then the file operation will reject upon the first failure.
     * 
     * Calling this function without a `nullify` parameter argument will set the flag to `true`.
     * @param {Boolean} [nullify=false] - If true, per-file promise rejections are resolved to a null value in 
     * the results, rather than triggering a rejection.
     * @returns {Files}
     */
    nullify(nullify) {
        if (typeof nullify === 'undefined') {
            nullify = true;
        }
        this._nullify = nullify || false;
        return this;
    }

    /**
     * Sets the option to have file operation return a null result on a per-file basis when running an operation if
     * an error occurs. If this is not enabled (`false`), then the file operation will reject upon the first failure.
     * 
     * Calling this function without a `nullify` parameter argument will set the flag to `true`.
     * @param {Boolean} [nullify=false] - If `true`, per-file promise rejections are resolved to a null value in 
     * the results, rather than triggering a rejection.
     * @returns {Files}
     */
    static nullify(nullify) {
        return Files.nullify(nullify);
    }

    /**
     * Sets the option to have file directory path created recursively if it is not found. If this option is not 
     * enabled (`false`) and the directory path does not exist, then the file operation will reject.
     * 
     * Calling this function without a `ensure` parameter argument will set the flag to `true`.
     * @param {Boolean} [ensure=false] - If true, the directory path will be created if missing.
     * @returns {Files}
     */
    ensure(ensure) {
        if (typeof ensure === 'undefined') {
            ensure = true;
        }
        this._ensure = ensure || false;
        return this;
    }

    /**
     * Sets the option to have file directory path created recursively if it is not found. If this option is not 
     * enabled (`false`) and the directory path does not exist, then the file operation will reject.
     * 
     * Calling this function without a `ensure` parameter argument will set the flag to `true`.
     * @param {Boolean} [ensure=false] - If true, the directory path will be created if missing.
     * @returns {Files}
     */
    static ensure(ensure) {
        return Files.ensure(ensure);
    }

    /**
     * Resets all values to their initial defaults.
     */
    reset() {
        this._parse = false;
        this._stringify = false;
        this._nullify = false;
        this._ensure = false;
        this._encoding = null;
        this._filePaths = [];
        this._glob = {};
        this._root = process.cwd();
    }

    /**
     * Runs the specified promise-returning function for all file paths and returns their results in the expected
     * order.
     * @param {Array.<String>} filePaths - The file paths to run the promise functions for.
     * @param {Function} promiseFunc - The function called once per file.
     * @returns {Promise.<Array.<*>>}
     * @private
     */
    _runAll(filePaths, promiseFunc) {
        let pa = [];
        for (let filePath of filePaths) {
            pa.push(promiseFunc(filePath));
        }
        return Promise.all(pa);
    }

    /**
     * Asynchronously resolves a glob pattern.
     * @param {String} pattern - The glob pattern to resolve.
     * @param {String} [ignore] - An ignore pattern to exclude results from the matching file paths.
     * @returns {Promise.<Array.<String>>}
     * @private
     */
    async _globFind(pattern, ignore) {
        return await new Promise((resolve, reject) => {
            glob(pattern, {
                ignore: ignore
            }, (err, matches) => {
                if (err) reject(err);
                return resolve(matches);
            });
        });
    }

    /**
     * Synchronously resolves a glob pattern.
     * @param {String} pattern - The glob pattern to resolve.
     * @param {String} [ignore] - An ignore pattern to exclude results from the matching file paths.
     * @returns {Array.<String>}
     * @private
     */
    _globFindSync(pattern, ignore) {
        return glob.sync(pattern, {
            ignore: ignore
        });
    }

    /**
     * Returns the file paths included and discovered with any glob patterns defined either as a Promise or handled
     * asynchronously.
     * @param {Boolean} sync - Specifies if you want to run the find operation synchronously or asynchronously.
     * @returns {Promise.<Array.<String>>|Array.<String>}
     */
    _find(sync) {
        let resolvedPaths = [];
        let root = this._root || process.cwd();
        let patterns = [];
        let ignorePatterns = [];
        //add globs
        if (this._glob && this._glob.include) {
            patterns = patterns.concat(this._glob.include);
        }
        if (this._glob && this._glob.exclude) {
            ignorePatterns = ignorePatterns.concat(this._glob.exclude);
        }
        //resolve relative patterns
        patterns = patterns.map(fp => path.resolve(root, fp));
        ignorePatterns = ignorePatterns.map(fp => path.resolve(root, fp));
        //add included paths
        if (this._filePaths && this._filePaths.length) {
            //we process these outside the globs so that they can fail if not found - this is done because the caller
            //specifically chose to include these, rather than matching a glob pattern against the file-system.
            let included = this._filePaths.map(fp => path.resolve(root, fp));
            //ignore included paths if matching ignore patterns.
            if (ignorePatterns.length) {
                for (let ip of ignorePatterns) {
                    let igGlob = new glob.Glob(ip, null, null);
                    included = included.filter(a => !igGlob.minimatch.match(a));
                }
            }
            resolvedPaths.push(...included);
        }
        //discover glob matches
        if (sync) {
            for (let pattern of patterns) {
                let discovered = this._globFindSync(pattern, ignorePatterns);
                if (discovered && discovered.length) {
                    for (let p of discovered) {
                        if (resolvedPaths.indexOf(p) < 0) {
                            resolvedPaths.push(p);
                        }
                    }
                }
            }
            return resolvedPaths.map(fp => path.normalize(fp)); //normalize for windows ಠ╭╮ಠ
        } else {
            let parr = [];
            for (let pattern of patterns) {
                parr.push(this._globFind(pattern, ignorePatterns)
                    .then((discovered) => {
                        if (discovered && discovered.length) {
                            for (let p of discovered) {
                                if (resolvedPaths.indexOf(p) < 0) {
                                    resolvedPaths.push(p);
                                }
                            }
                        }
                    }));
            }
            return Promise.all(parr).then(() => {
                return resolvedPaths.map(fp => path.normalize(fp)); //normalize for windows ಠ╭╮ಠ
            });
        }
    }

    /**
     * Returns the file paths included and discovered with any glob patterns defined.
     * @returns {Promise.<Array.<String>>}
     */
    async find() {
        return await this._find(false);
    }

    /**
     * Returns the file paths included and discovered with any glob patterns defined.
     * @returns {Array.<String>}
     */
    findSync() {
        return this._find(true);
    }

    /**
     * Returns the stats for matching files.
     * @returns {Promise.<Array.<{filePath:String, stat:fs.Stats}>>}
     */
    async stat() {
        let filePaths = await this.find();
        let fnullify = this._nullify;
        let fensure = this._ensure;
        return await this._runAll(filePaths, (filePath) => { //called once per file. Return a promise.
            return new Promise((resolve, reject) => {
                if (fensure) {
                    fs.mkdirSync(path.dirname(filePath), { recursive: true });
                }
                fs.stat(filePath, function (err, stat) {
                    if (err && !fnullify) {
                        return reject(err);
                    }
                    return resolve({ filePath: filePath, stat: stat || null });
                });
            });
        });
    }

    /**
     * Returns the normalized value for all paths, reducing '..' and '.' parts.
     * When multiple slashes are found, they're replaced by a single one; when the path contains a trailing slash, it 
     * is preserved. On Windows backslashes are used.
     * @returns {Promise.<Array.<{filePath:String, normalized:String}>>}
     */
    async normalize() {
        let filePaths = await this.find();
        let fnullify = this._nullify;
        return await this._runAll(filePaths, (filePath) => { //called once per file. Return a promise.
            return new Promise((resolve, reject) => {
                try {
                    let result = path.normalize(filePath);
                    return resolve({ filePath: filePath, normalized: result || null });
                } catch (err) {
                    if (err && !fnullify) {
                        return reject(err);
                    }
                }
            });
        });
    }

    /**
     * Unlinks the matching files and returns `true` if successfully unlinked (otherwise `false`).
     * @param {Boolean} [dirs=false] - If true, directory paths will also be recursivelly deleted.
     * @returns {Promise.<Array.<{filePath:String, unlinked:Boolean}>>}
     */
    async unlink(dirs) {
        let filePaths = await this.find();
        let fnullify = this._nullify;
        let fensure = this._ensure;
        return await this._runAll(filePaths, (filePath) => {
            return new Promise((resolve, reject) => {
                if (fensure) {
                    fs.mkdirSync(path.dirname(filePath), { recursive: true });
                }
                fs.unlink(filePath, (err) => {
                    let unlinked = true;
                    if (err) {
                        if (err.code == 'EISDIR' && dirs) {
                            try {
                                fs.rmdirSync(filePath, { recursive: true, force: true });
                                err = null;
                            } catch (derr) {
                                err = derr;
                            }
                        }
                        if (err && !fnullify) {
                            return reject(err);
                        } else if (err) {
                            unlinked = false;
                        }
                    }
                    return resolve({ filePath: filePath, unlinked: unlinked });
                });
            });
        });
    }

    /**
     * Writes the given content to matching files. If the file exists, it is overwritten. If the file does not exist,
     * it is created.
     * @param {*} content - The content to write to the file. If the content is not a `Buffer`, `Number`, `Boolean` or
     * `String` or `Date`, it is converted to TOML or JSON (default) depending on the `filePath` extension and the 
     * flag for `stringify`.
     * @returns {Promise.<Array.<{filePath:String, written:Boolean}>>}
     */
    async write(content) {
        let filePaths = await this.find();
        let fencoding = this._encoding;
        let fnullify = this._nullify;
        let fstringify = this._stringify;
        let fensure = this._ensure;
        return await this._runAll(filePaths, (filePath) => {
            return new Promise((resolve, reject) => {
                let t = typeof content;
                let data = content;
                if (fstringify) {
                    if (t !== 'string' && t !== 'boolean' && t !== 'number' && Buffer.isBuffer(content) === false && content instanceof Date === false) {
                        if (fstringify !== 'json' && (_isTOMLFilePath(filePath) || fstringify === 'toml')) {
                            data = toml.stringify(data);
                        } else if (fstringify !== 'json' && (_isYAMLFilePath(filePath) || fstringify === 'yaml')) {
                            data = yaml.safeDump(data, {
                                indent: 4,
                                lineWidth: 120
                            });
                        } else {
                            data = JSON.stringify(data, null, 4);
                        }
                    }
                }
                if (fensure) {
                    fs.mkdirSync(path.dirname(filePath), { recursive: true });
                }
                fs.writeFile(filePath, data, { encoding: fencoding }, (err) => {
                    let written = true;
                    if (err) {
                        if (!fnullify) {
                            return reject(err);
                        } else {
                            written = false;
                        }
                    }
                    return resolve({ filePath: filePath, written: written });
                });
            });
        });
    }

    /**
     * Appends the given content to a file. If the file does not exist, it is created.
     * @param {*} content - The content to append to the file. If the content is not a `Buffer`, `Number`, `Boolean` or
     * `String` or `Date`, it is converted to TOML or JSON (default) depending on the `filePath` extension.
     * @returns {Promise.<Array.<{filePath:String, appended:Boolean}>>}
     */
    async append(content) {
        let filePaths = await this.find();
        let fencoding = this._encoding;
        let fnullify = this._nullify;
        let fstringify = this._stringify;
        let fensure = this._ensure;
        return await this._runAll(filePaths, (filePath) => {
            return new Promise((resolve, reject) => {
                let t = typeof content;
                let data = content;
                if (fstringify) {
                    if (t !== 'string' && t !== 'boolean' && t !== 'number' && Buffer.isBuffer(content) === false && content instanceof Date === false) {
                        if (fstringify !== 'json' && (_isTOMLFilePath(filePath) || fstringify === 'toml')) {
                            data = toml.stringify(data);
                        } else if (fstringify !== 'json' && (_isYAMLFilePath(filePath) || fstringify === 'yaml')) {
                            data = yaml.safeDump(data, {
                                indent: 4,
                                lineWidth: 120
                            });
                        } else {
                            data = JSON.stringify(data, null, 4);
                        }
                    }
                }
                if (fensure) {
                    fs.mkdirSync(path.dirname(filePath), { recursive: true });
                }
                fs.appendFile(filePath, data, { encoding: fencoding }, (err) => {
                    let appended = true;
                    if (err) {
                        if (!fnullify) {
                            return reject(err);
                        } else {
                            appended = false;
                        }
                    }
                    return resolve({ filePath: filePath, appended: appended });
                });
            });
        });
    }

    /**
     * Reads the contents of a file into a `Buffer`.
     * @returns {Promise.<Array.<{filePath:String, data:*, read:Boolean, exists:Boolean}>>}
     */
    async read() {
        let filePaths = await this.find();
        let fencoding = this._encoding;
        let fnullify = this._nullify;
        let fparse = this._parse;
        let fensure = this._ensure;
        return await this._runAll(filePaths, (filePath) => {
            return new Promise((resolve, reject) => {
                if (fensure) {
                    fs.mkdirSync(path.dirname(filePath), { recursive: true });
                }
                fs.readFile(filePath, { encoding: fencoding }, (err, data) => {
                    let readOK = true;
                    let fileExists = true;
                    if (err) {
                        fileExists = false;
                        if (!fnullify) {
                            return reject(err);
                        } else {
                            readOK = false;
                        }
                    }
                    if (readOK && fparse) {
                        try {
                            if (fparse !== 'json' && (_isTOMLFilePath(filePath) || fparse === 'toml')) {
                                data = toml.parse(data.toString(fencoding || undefined));
                            } else if (fparse !== 'json' && (_isYAMLFilePath(filePath) || fparse === 'yaml')) {
                                data = yaml.safeLoad(data.toString(fencoding || undefined), {
                                    filename: filePath
                                });
                            } else {
                                data = JSON.parse(data.toString(fencoding || undefined));
                            }
                        } catch (parseErr) {
                            if (fnullify) {
                                readOK = false;
                            } else {
                                return reject(parseErr);
                            }
                        }
                    }
                    if (readOK === false) {
                        data = null;
                    }
                    return resolve({ filePath: filePath, data: data, read: readOK, exists: fileExists });
                });
            });
        });
    }

    /**
     * Reads the contents of a file into a `Buffer` synchronously.
     * @returns {Array.<{filePath:String, data:*, read:Boolean}>}
     */
    readSync() {
        let filePaths = this.findSync();
        let fencoding = this._encoding;
        let fnullify = this._nullify;
        let fparse = this._parse;
        let fensure = this._ensure;
        let output = [];
        for (let filePath of filePaths) {
            let readOK = true;
            let data = null;
            try {
                if (fensure) {
                    fs.mkdirSync(path.dirname(filePath), { recursive: true });
                }
                data = fs.readFileSync(filePath, { encoding: fencoding });
                if (fparse) {
                    if (fparse !== 'json' && (_isTOMLFilePath(filePath) || fparse === 'toml')) {
                        data = toml.parse(data.toString(fencoding || undefined));
                    } else if (fparse !== 'json' && (_isYAMLFilePath(filePath) || fparse === 'yaml')) {
                        data = yaml.safeLoad(data.toString(fencoding || undefined), {
                            filename: filePath
                        });
                    } else {
                        data = JSON.parse(data.toString(fencoding || undefined));
                    }
                }
            } catch (err) {
                if (!fnullify) {
                    throw err;
                } else {
                    readOK = false;
                }
            }
            if (readOK === false) {
                data = null;
            }
            output.push({ filePath: filePath, data: data, read: readOK });
        }
        return output;
    }
}

export default Files;