
/**
 * @typedef {Object} Filter.FilterCondition
 * @property {String} field - The field name from the schema affected by the filter.
 * @property {String} op - The filter operator.
 * @property {*} [value] - The value used by the operator on the field value.
 */

/**
 * @typedef {Object} Filter.FilterLogicalGroup
 * @property {String} logic - The logical operator to apply to the filters.
 * @property {Array.<Filter.FilterCondition|Filter.FilterLogicalGroup>} filters - The filter items and groups under the logical operator.
 */

/**
 * Represents a tree of conditions that can be used to filter objects and data based on "fields", "operations", and
 * "values" in logical and/or groupings.
 */
class Filter {
    /**
     * Creates a new `Filter` instance.
     * @param {Filter|Filter.FilterLogicalGroup} [tree] - Create the filter with an existing filter tree object.
     */
    constructor(tree) {

        /**
         * @type {Filter.FilterLogicalGroup}
         */
        this.tree = null;

        /**
         * @type {Filter.FilterLogicalGroup}
         * @private
         */
        this._current = null;

        /**
         * When enabled (default) the Filter will support dot-notation field names, allowing nested object value
         * evaluation. If disabled, dot-notation field names will be treated as the explicit field name.
         * @type {Boolean}
         */
        this.dot = true;

        /**
         * @type {Filter.LOGIC}
         */
        this.LOGIC = Filter.LOGIC;

        /**
         * @type {Filter.OP}
         */
        this.OP = Filter.OP;

        //init
        if (tree) {
            let cleanup = (fg) => {
                if (fg.logic && fg.filters && Array.isArray(fg.filters)) {
                    for (let f of fg.filters) {
                        cleanup(f);
                    }
                } else if (fg.field && fg.operator) {
                    //convert property "operator" to "op"
                    fg.op = fg.operator;
                    delete fg.operator;
                }
                return fg;
            };
            if (tree instanceof Filter) {
                this.tree = tree.tree;
            } else if (tree.logic) { //tree-like object
                this.tree = cleanup(tree);
            }
        }
    }

    /**
     * Create a new `Filter` instance and opening with a logical "and" operator.
     * @param {String|Filter|Filter.FilterLogicalGroup} field - The field affected by the filter.
     * @param {String} [op] - The filter operator.
     * @param {*} [value] - The value used by the operator on the field value.
     * @returns {Filter}
     */
    static and(field, op, value) {
        return new Filter().and(field, op, value);
    }

    /**
     * Create a new `Filter` instance and opening with a logical "or" operator.
     * @param {String|Filter|Filter.FilterLogicalGroup} field - The field affected by the filter.
     * @param {String} [op] - The filter operator.
     * @param {*} [value] - The value used by the operator on the field value.
     * @returns {Filter}
     */
    static or(field, op, value) {
        return new Filter().or(field, op, value);
    }

    /**
     * Checks if the specified filter is empty (contains no logical conditions) and returns a `true` if empty, `false`
     * if not.
     * @param {Filter|Filter.FilterLogicalGroup} filter - The filter to check.
     * @returns {Boolean}
     */
    static isEmpty(filter) {
        if (filter) {
            if (filter instanceof Filter) {
                return Filter.isEmpty(filter.tree);
            } else {
                for (let f of filter.filters) {
                    if (f.field) {
                        return false;
                    } else if (f.logic) {
                        if (Filter.isEmpty(f) === false) {
                            return false;
                        }
                    }
                }
            }
        }
        return true;
    }

    /**
     * Adds a new condition using a logical "or" operator.
     * @param {String|Filter|Filter.FilterLogicalGroup} field - The field affected by the filter.
     * @param {String} [op] - The filter operator.
     * @param {*} [value] - The value used by the operator on the field value.
     * @returns {Filter}
     */
    and(field, op, value) {
        return this.add(Filter.LOGIC.AND, field, op, value);
    }

    /**
     * Adds a new condition using a logical "or" operator.
     * @param {String|Filter|Filter.FilterLogicalGroup} field - The field affected by the filter.
     * @param {String} [op] - The filter operator.
     * @param {*} [value] - The value used by the operator on the field value.
     * @returns {Filter}
     */
    or(field, op, value) {
        return this.add(Filter.LOGIC.OR, field, op, value);
    }

    /**
     * Adds a new condition or filter group to the tree using the given logical operator.
     * @param {String} logic - The logical operator.
     * @param {String|Filter|Filter.FilterLogicalGroup} field - The field affected by the filter.
     * @param {String} [op] - The filter operator.
     * @param {*} [value] - The value used by the operator on the field value.
     * @returns {Filter} 
     */
    add(logic, field, op, value) {
        if (!logic) {
            throw new Error('The "logic" parameter argument is required.');
        } else if (Filter.LOGIC_KEYS.indexOf(logic) <= -1) {
            throw new Error(`The "logic" parameter argument "${logic}" is invalid or unsupported.`);
        } else if (!field) {
            throw new Error('The "field" parameter argument is required.');
        }
        //ensure there is a tree object.
        if (!this.tree) {
            this.tree = this._filterLogicalGroup(logic);
            this._current = this.tree;
        }
        //add another filter logical group
        if (field instanceof Filter) {
            if (field.tree) {
                field = field.tree;
            } else {
                return this; //empty filter
            }
        }
        if (field.logic && field.filters) {
            this._current.filters.push(field);
            return this;
        }
        //add a condition
        if (this._current.logic === logic) {
            this._current.filters.push(this._filterCondition(field, op, value));
        } else {
            //wrap the current logical group with the new operator, then add the new condition
            let lg = this._filterLogicalGroup(this._current.logic);
            lg.filters = this._current.filters;
            this._current.logic = logic;
            this._current.filters = [lg, this._filterCondition(field, op, value)];
        }
        return this;
    }

    /**
     * Creates a new logical group object.
     * @param {String} logic - The logical operator.
     * @returns {Filter.FilterLogicalGroup}
     * @private
     */
    _filterLogicalGroup(logic) {
        if (!logic) {
            throw new Error('The "logic" parameter argument is required.');
        } else if (Filter.LOGIC_KEYS.indexOf(logic) <= -1) {
            throw new Error(`The "logic" parameter argument "${logic}" is invalid or unsupported.`);
        }
        return {
            logic: logic,
            filters: []
        };
    }

    /**
     * Creates a new condition object.
     * @param {String} field - The field affected by the filter.
     * @param {String} [op] - The filter operator.
     * @param {*} [value] - The value used by the operator on the field value.
     * @returns {Filter.FilterCondition}
     * @private
     */
    _filterCondition(field, op, value) {
        if (!field) {
            throw new Error('The "field" parameter argument is required.');
        } else if (!op) {
            throw new Error('The "op" parameter argument is required.');
        } else if (Filter.OP_KEYS.indexOf(op) <= -1) {
            throw new Error(`The "op" parameter argument "${op}" is invalid or unsupported.`);
        }
        return {
            field: field,
            op: op,
            value: value
        };
    }

    /**
     * Creates a clone of this filter.
     * 
     * Note: Instance values on filter items are not deep-cloned.
     * @returns {Filter}
     */
    clone() {
        let f = new Filter();
        if (this.tree) {
            f.tree = this._cloneFilterGroup(this.tree);
        }
        return f;
    }

    /**
     * Makes a copy of the filter group and returns the clone.
     * @param {Filter.FilterLogicalGroup} orig - The group to clone.
     * @returns {Filter.FilterLogicalGroup}
     * @private
     */
    _cloneFilterGroup(orig) {
        let g = this._filterLogicalGroup(orig.logic);
        for (let f of orig.filters) {
            if (f.field) {
                g.filters.push(Object.assign({}, f));
            } else if (f.logic) {
                g.filters.push(this._cloneFilterGroup(f));
            }
        }
        return g;
    }

    /**
     * Tests the filter criteria against the specified model(s). If any model fails a filter, or no models are
     * specified, a `false` value is returned. If all models pass the filters, a `true` value is returned.
     * @param {...Model} models - The models to test the filter against.
     * @returns {Boolean}
     */
    test(...models) {
        if (models && models.length) {
            if (this.tree && Filter.isEmpty(this) === false && Array.isArray(this.tree.filters) && this.tree.filters.length) {
                for (let x = models.length - 1; x >= 0; x--) {
                    if (this._evaluateCriteria(this.tree, models[x]) === false) {
                        return false;
                    }
                }
            }
            return true;
        }
        return false;
    }

    /**
     * Checks if the given model matches the given filter group criteria.
     * @param {Filter.FilterLogicalGroup|Filter.FilterCondition} conditionOrGroup - The filter criteria to check.
     * @param {Model} model - The model to evaluate. 
     * @returns {Boolean}
     * @private
     */
    _evaluateCriteria(conditionOrGroup, model) {
        if (conditionOrGroup.logic && conditionOrGroup.filters && Array.isArray(conditionOrGroup.filters)) {
            let group = conditionOrGroup;
            let result = (group.logic === Filter.LOGIC.AND);
            if (group.logic === Filter.LOGIC.OR) {
                for (let f of group.filters) {
                    result |= this._evaluateCriteria(f, model);
                }
            } else if (group.logic === Filter.LOGIC.AND) {
                for (let f of group.filters) {
                    result &= this._evaluateCriteria(f, model);
                }
            }
            return !!result;
        } else if (conditionOrGroup.field && conditionOrGroup.op) {
            let condition = conditionOrGroup;
            let modelValue = null;
            if (this.dot && condition.field.indexOf('.') >= 0) {
                modelValue = condition.field.split('.').reduce((o, i) => o[i], model);
            } else {
                modelValue = model[condition.field];
            }
            switch (condition.op) {
                case Filter.OP.NOTEQUALS:
                    return modelValue != condition.value;
                case Filter.OP.ISNULL:
                    return modelValue === null;
                case Filter.OP.ISNOTNULL:
                    return modelValue !== null;
                case Filter.OP.LESSTHAN:
                    return modelValue < condition.value;
                case Filter.OP.LESSTHANOREQUAL:
                    return modelValue <= condition.value;
                case Filter.OP.GREATERTHAN:
                    return modelValue > condition.value;
                case Filter.OP.GREATERTHANOREQUAL:
                    return modelValue >= condition.value;
                case Filter.OP.STARTSWITH: {
                    let a = modelValue ? modelValue.toString() : '';
                    let b = condition.value ? condition.value.toString() : '';
                    return a.startsWith(b);
                }
                case Filter.OP.ENDSWITH: {
                    let a = modelValue ? modelValue.toString() : '';
                    let b = condition.value ? condition.value.toString() : '';
                    return a.endsWith(b);
                }
                case Filter.OP.CONTAINS: {
                    let a = modelValue ? modelValue.toString() : '';
                    let b = condition.value ? condition.value.toString() : '';
                    return (a.indexOf(b) > -1);
                }
                case Filter.OP.DOESNOTCONTAIN: {
                    let a = modelValue ? modelValue.toString() : '';
                    let b = condition.value ? condition.value.toString() : '';
                    return (a.indexOf(b) < 0);
                }
                case Filter.OP.ISEMPTY:
                    return typeof modelValue === 'undefined'
                        || modelValue === null
                        || modelValue === '';
                case Filter.OP.ISNOTEMPTY:
                    return typeof modelValue !== 'undefined'
                        && modelValue != null
                        && modelValue !== '';
                case Filter.OP.IN:
                    if (Array.isArray(condition.value) || typeof condition.value === 'string') {
                        return condition.value.indexOf(modelValue) > -1;
                    } else {
                        return false;
                    }
                case Filter.OP.NOTIN:
                    if (Array.isArray(condition.value) || typeof condition.value === 'string') {
                        return condition.value.indexOf(modelValue) < 0;
                    } else {
                        return true;
                    }
                default: //eq
                    return modelValue === condition.value;
            }
        }
    }

    /**
     * Converts the filter to a readable string.
     * @param {Filter.FilterLogicalGroup|Filter.FilterCondition} [fg] - Optional filter condition or filter group to convert to a string.
     * @returns {String}
     */
    toString(fg) {
        let s = null;
        if (fg) {
            if (fg.logic) {
                if (fg.filters) {
                    s = '(';
                    for (let x = 0; x < fg.filters.length; x++) {
                        s += this.toString(fg.filters[x]);
                        if (fg.filters.length > 1 && x < fg.filters.length - 1) {
                            s += ` ${fg.logic.toUpperCase()} `;
                        }
                    }
                    s += ')';
                }
            } else if (fg.field && fg.op) {
                if (fg.op === Filter.OP.ISNULL
                    || fg.op === Filter.OP.ISNOTNULL
                    || fg.op === Filter.OP.ISEMPTY
                    || fg.op === Filter.OP.ISNOTEMPTY) {
                    s = `[${fg.field}] ${fg.op.toUpperCase()}`;
                } else {
                    let strValue = null;
                    if (Array.isArray(fg.value)) {
                        strValue = '{' + fg.value.map(v => {
                            if (typeof v === 'string') {
                                return `"${v}"`;
                            } else if (v === null) {
                                return 'null';
                            } else if (typeof v === 'undefined') {
                                return 'undefined';
                            } else {
                                return v.toString();
                            }
                        }).join(',') + '}';
                    } else if (typeof fg.value === 'string') {
                        strValue = `"${fg.value}"`;
                    } else if (fg.value === null) {
                        strValue = 'null';
                    } else if (typeof fg.value === 'undefined') {
                        strValue = 'undefined';
                    } else {
                        strValue = fg.value.toString();
                    }
                    s = `[${fg.field}] ${fg.op.toUpperCase()} ${strValue}`;
                }
            }
        } else {
            s = this.toString(this.tree);
        }
        return s;
    }

    /**
     * Attempts to parse a string containing a filter declaration into a new `Filter` instance and returns it.
     * @throws SyntaxError if the string is unparsable.
     * @param {String} input - The input string to parse into a new `Filter` instance.
     * @returns {Filter} Returns a `Filter` instance when an input is given. If the input is `null` then `null` 
     * is returned.
     */
    static parse(input) {
        if (input !== null) {
            if (typeof input !== 'string') {
                throw new SyntaxError('Invalid "input" argument, the value is not a string.');
            }
            let f = new Filter();
            //parse this
            //[test0] EQ 1 OR [test1] EQ 2
            //'([test0] EQ 1 OR [test1] EQ 2 OR [test2] EQ 3 OR (([test3] ISNULL AND [test4] EQ 4) OR [test5] IN "1,2,3,4,5,6" OR [test5] IN {"abc",null,123,undefined,true}))'
            //ignore [ and ]
            //( indicates start of group
            //) indicates end of last group
            //AND and OR are the only logic supported
            let isNewLogicalGroupRegEx = /^\s*\(/;
            let isEndingLogicalGroupRegEx = /^\s*\)/;
            let isLogicalOr = /^OR\s/i;
            let isLogicalAnd = /^AND\s/i;
            let tree = { logic: null, filters: [] };
            let group = tree;
            //strip outermost parenthesis, if any.
            if (/^\(.*\)$/.test(input)) {
                input = input.substr(1, input.length - 2);
            }
            //start walk
            for (let i = 0; i < input.length; i++) {
                if (isNewLogicalGroupRegEx.test(input[i])) {
                    let newGroup = {
                        logic: null,
                        filters: []
                    };
                    Object.defineProperty(newGroup, 'parent', { value: group, enumerable: false });
                    group.filters.push(newGroup);
                    group = newGroup;
                } else if (isEndingLogicalGroupRegEx.test(input[i])) {
                    if (tree === group) {
                        throw new SyntaxError(`Error parsing filter group, mismatched grouping: Found no starting "(" for ending ")" at position ${i}.`);
                    } else {
                        //final group check
                        if (!group.logic) {
                            group.logic = Filter.LOGIC.AND;
                        }
                        //pop to parent
                        group = group.parent;
                    }
                } else if (input[i] === '[') {
                    let parseResult = Filter._parseCondition(input, i);
                    group.filters.push(parseResult.condition);
                    i = parseResult.indexTo;
                } else if (isLogicalOr.test(input.substr(i, 3))) {
                    if (!group.logic) {
                        group.logic = Filter.LOGIC.OR;
                    } else if (group.logic !== Filter.LOGIC.OR) {
                        throw new SyntaxError(`Error parsing filter at position ${i}, logical comparison has changed from "${group.logic}" to "${Filter.LOGIC.OR}" without starting a new group (parenthesis).`);
                    }
                    i += 2;
                } else if (isLogicalAnd.test(input.substr(i, 4))) {
                    if (!group.logic) {
                        group.logic = Filter.LOGIC.AND;
                    } else if (group.logic !== Filter.LOGIC.AND) {
                        throw new SyntaxError(`Error parsing filter at position ${i}, logical comparison has changed from "${group.logic}" to "${Filter.LOGIC.AND}" without starting a new group (parenthesis).`);
                    }
                    i += 3;
                }
            }
            if (tree !== group) {
                throw new SyntaxError('Error parsing filter group, mismatched grouping: Found starting "(" but no corresponding ending ")".');
            }
            if (!tree.logic) {
                tree.logic = Filter.LOGIC.AND;
            }
            console.log(JSON.stringify(tree, null, 4));
            return f;
        }
        return null;
    }

    /**
     * Extracts a filter condition object from the given string, up to any ending value determination.
     * @param {String} input - the full input string being parsed.
     * @param {Number} startIndex - the current index in the parser walk.
     * @returns {FilterCondition}
     * @private
     */
    static _parseCondition(input, startIndex) {
        let c = {
            field: '',
            op: ''
        };
        let noValueOps = [Filter.OP.ISNULL, Filter.OP.ISNOTNULL, Filter.OP.ISEMPTY, Filter.OP.ISNOTEMPTY];
        let prop = 'field';
        let isQuoted = false;
        let isSingleQuoted = false;
        let isBraced = false;
        let i = startIndex;
        for (; i < input.length; i++) {
            if (prop === 'field') {
                if (input[i] === '[') {
                    continue;
                } else if (input[i] === ']') {
                    prop = 'op';
                } else if (i === input.length - 1) {
                    throw new SyntaxError(`Error parsing filter condition starting at ${startIndex}, unterminated property name: Found no "]" for starting "[".`);
                } else {
                    c.field += input[i];
                }
            } else if (prop === 'op') {
                if (!c.op && /\s/.test(input[i])) {
                    continue;
                } else if (c.op && /\s/.test(input[i])) {
                    if (noValueOps.indexOf(c.op.toLowerCase()) > -1) {
                        break;
                    } else {
                        prop = 'value';
                    }
                } else if (i === input.length - 1) {
                    throw new SyntaxError(`Error parsing filter condition starting at ${startIndex}, could not determine operator.`);
                } else {
                    c.op += input[i];
                }
            } else { //value
                let missing = (typeof c.value === 'undefined');
                if (missing && /\s/.test(input[i])) {
                    continue;
                } else if (missing && /null/i.test(input.substr(i, 4))) {
                    c.value = null;
                    i += 4;
                    break;
                } else if (missing && /undefined/i.test(input.substr(i, 9))) {
                    i += 9;
                    break;
                } else if (missing && input[i] === '"') {
                    isQuoted = true;
                    c.value = '';
                } else if (missing && input[i] === '\'') {
                    isSingleQuoted = true;
                    c.value = '';
                } else if (missing && input[i] === '{') {
                    isBraced = true;
                    c.value = [];
                } else if (missing) {
                    c.value = input[i];
                } else if (!missing && isQuoted && input[i] === '"' && input[i - 1] !== '\\') { //end of string value
                    isQuoted = false;
                    break;
                } else if (!missing && isSingleQuoted && input[i] === '\'' && input[i - 1] !== '\\') { //end of string value
                    isSingleQuoted = false;
                    break;
                } else if (!missing && isBraced && input[i] === '}') { //end of array value
                    isBraced = false;
                    c.value = c.value.split(',').map(v => Filter._parseValueString(v));
                    break;
                } else if (!missing && isQuoted === false && isSingleQuoted === false && isBraced === false && /\s|\)/.test(input[i])) { //end of indeterminate value
                    c.value = Filter._parseValueString(c.value);
                    i--;
                    break;
                } else {
                    c.value += input[i];
                }
            }
        }
        if (isQuoted) {
            throw new SyntaxError(`Error parsing filter condition starting at ${startIndex}, unterminated double-quoted value.`);
        } else if (isSingleQuoted) {
            throw new SyntaxError(`Error parsing filter condition starting at ${startIndex}, unterminated single-quoted value.`);
        } else if (isBraced) {
            throw new SyntaxError(`Error parsing filter condition starting at ${startIndex}, unterminated array ({...}) value.`);
        }
        return {
            indexTo: i,
            condition: c
        };
    }

    /**
     * Parses a singlular supported string representation of a value into a typed value, either a Number, String, 
     * Date (from ISO8601, full), or Boolean. This method will remove outermost double or single quotes if found on
     * a String value.
     * @throws SyntaxError if there is an outermost starting or ending single or double quote without the opposite.
     * @param {String} value - the value to be parsed.
     * @returns {Number|String|Date|Boolean}
     * @private
     */
    static _parseValueString(value) {
        const ISO8601Date = /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(\.\d+)?(([+-]\d\d:\d\d)|Z)?$/i;
        if (value) {
            if (/^-?\d*(\.\d+)?$/.test(value)) {
                let tryValue = parseFloat(value);
                if (isNaN(tryValue) === false) {
                    return tryValue;
                }
            } else if (/^true$/i.test(value)) {
                return true;
            } else if (/^false$/i.test(value)) {
                return false;
            } else if (/^null$/i.test(value)) {
                return null;
            } else if (/^undefined$/i.test(value)) {
                return undefined;
            } else if (ISO8601Date.test(value)) {
                return new Date(value);
            } else if (/^(""|'')$/.test(value)) { //empty string
                return '';
            } else if (/^".+[^\\]"$/.test(value) || /^'.+[^\\]'$/.test(value)) { //strip quotes
                return value.substr(1, value.length - 2);
            } else if (/^".+([^"]|\\")$/.test(value) || /^([^"]|\\").+[^\\]"$/.test(value)) {
                throw new SyntaxError(`Error parsing filter value "${value}", unterminated double-quoted value.`);
            } else if (/^'.+([^']|\\')$/.test(value) || /^([^']|\\').+[^\\]'$/.test(value)) {
                throw new SyntaxError(`Error parsing filter value "${value}", unterminated single-quoted value.`);
            }
        }
        return value;
    }

}

/**
 * @readonly
 */
Filter.LOGIC = {
    AND: 'and',
    OR: 'or'
};

/**
 * Array of valid logic strings.
 * @type {Array.<String>}
 */
Filter.LOGIC_KEYS = Object.keys(Filter.LOGIC).map(k => Filter.LOGIC[k]);

/**
 * @readonly
 */
Filter.OP = {
    EQUALS: 'eq',
    NOTEQUALS: 'neq',
    ISNULL: 'isnull',
    ISNOTNULL: 'isnotnull',
    LESSTHAN: 'lt',
    LESSTHANOREQUAL: 'lte',
    GREATERTHAN: 'gt',
    GREATERTHANOREQUAL: 'gte',
    STARTSWITH: 'startswith',
    ENDSWITH: 'endswith',
    CONTAINS: 'contains',
    DOESNOTCONTAIN: 'doesnotcontain',
    ISEMPTY: 'isempty',
    ISNOTEMPTY: 'isnotempty',
    IN: 'in',
    NOTIN: 'nin'
};

/**
 * Array of valid conditional comparison strings.
 * @type {Array.<String>}
 */
Filter.OP_KEYS = Object.keys(Filter.OP).map(k => Filter.OP[k]);

export default Filter;