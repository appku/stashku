
/**
 * @typedef {Object} PropertyNameOptions
 * @property {Boolean} [underscore=true] - If true, include properties that begin with an underscore.
 * @property {Boolean} [object=true] - If false, the "constructor" property and any properties on the Object type
 * will be omitted. The prototype chain search will stop once encountering the Object constructor.
 * @property {Number} [depth] - If specified, only examine up to depth number of prototypes from the given object.
 * 'prototype'. If omitted, all prototypes will be evaluated.
 * @property {Array.<Function>} [stopTypes] - Stops reading the prototype chain if the prototype encounters an
 * instance of one or more of the specified constructors.  
 * @property {Array.<String>} [ignore] - Any property names found in this array are omitted from the output.
 */

const Objects = {

    /**
     * Returns an object generated from the given entries (array of tuples).
     * @param {Iterable} entries - The entries to create a new object from.
     * @returns {*} 
     */
    fromEntries: function (entries) {
        return [...entries].reduce((obj, [k, v]) => {
            obj[k] = v;
            return obj;
        }, {});
    },

    /**
     * Returns the first matching prototype of `target` with the name or type matching any of the `names` specified.
     * If no prototype match is found, `null` is returned.
     * @param {*} target - The target object to search.
     * @param  {...String|*} names - One or more names (or types) of the prototypes to find.
     * @returns {*}
     */
    getPrototype: function (target, ...names) {
        target = Object.getPrototypeOf(target); //start with the prototype of the object.
        let proto = Object.getPrototypeOf(target);
        while (proto) {
            //check if the prototype is a match
            if (names.some(a =>
                (proto.constructor.name === a)
                || (typeof a !== 'string' && proto.constructor === a))
            ) {
                return target;
            }
            //set the next prototype to check.
            target = proto;
            proto = Object.getPrototypeOf(target);
            if (proto === target) {
                return null;
            }
        }
        return null;
    },

    /**
     * Gets all of the property names for an object, including ES6 objects.
     * @param {Object} target - The object to scan for property names.
     * @param {PropertyNameOptions} [options] - The options to apply when determining property names.
     * @returns {Array.<String>}
     */
    getPropertyNames: function (target, options) {
        options = Object.assign({
            underscore: true,
            object: true,
            depth: -1,
            stopTypes: [],
            ignore: []
        }, options);
        let output = [];
        if (target) {
            //get standard object properties
            let props = Object.getOwnPropertyNames(target);
            if (typeof options.depth === 'undefined' || options.depth === null) {
                options.depth = -1;
            }
            //scan prototypes
            let proto = Object.getPrototypeOf(target);
            let index = 0;
            if (!options.object) {
                options.stopTypes.push(Object);
            }
            while ((options.depth <= -1 || index <= options.depth) && proto) {
                if (options.stopTypes.length > 0) {
                    let stop = Objects.isConstructorOf.apply(this, [proto].concat(options.stopTypes));
                    if (stop) {
                        index = options.depth;
                        proto = null;
                    }
                }
                if (proto) {
                    props = props.concat(Object.getOwnPropertyNames(proto));
                    let nextProto = Object.getPrototypeOf(proto);
                    if (nextProto === proto) {
                        proto = null; //done
                    } else {
                        proto = nextProto;
                    }
                    index++;
                }
            }
            //add valid properties to output
            for (let x = 0; x < props.length; x++) {
                let p = props[x];
                let include = true;
                if (output.indexOf(p) > -1) { //don't add if already present
                    include = false;
                } else if (!options.underscore && p.length > 0 && p[0] === '_') {
                    include = false;
                } else if (!options.object && p === 'constructor') {
                    include = false;
                } else if (options.ignore && options.ignore.indexOf(p) > -1) {
                    include = false;
                }
                if (include) {
                    output.push(p);
                }
            }
        }
        return output;
    },

    /**
     * Checks if the given object has the constructor of the given functions.
     * @param {Object} obj - The object to have it's constructor checked.
     * @param {...Function} args - One or more functions (or classes) provided as arguments.
     * @returns {Boolean}
     */
    isConstructorOf: function (obj, args) {
        if (arguments.length > 1) {
            for (let x = 1; x < arguments.length; x++) {
                if (obj.constructor === arguments[x] || obj === arguments[x]) {
                    return true;
                }
            }
        }
        return false;
    },

    /**
     * Merges sources recursively into the target.
     * @param {*} target - The object to be populated with source values.
     * @param  {...any} sources - The objects with properties, left to right, to be copied into the target.
     * @returns {*}
     */
    merge: function (target, ...sources) {
        if (!sources.length) {
            return target;
        }
        const source = sources.shift();
        if (typeof target === 'object' && Array.isArray(target) === false && typeof source === 'object' && Array.isArray(source) === false) {
            for (const key in source) {
                let item = source[key];
                if (item instanceof Map) {
                    target[key] = new Map(item);
                } else if (item instanceof Set) {
                    target[key] = new Set(item);
                } else if (item && typeof item === 'object' && Array.isArray(item) === false) {
                    if (!target[key]) Object.assign(target, { [key]: {} });
                    this.merge(target[key], item);
                } else {
                    Object.assign(target, { [key]: item });
                }
            }
        }
        return this.merge(target, ...sources);
    }

};

/** @exports Objects */
export default Objects;