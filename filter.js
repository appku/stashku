
/**
 * @typedef FilterCondition
 * @property {String} field - The field name from the schema affected by the filter.
 * @property {String} op - The filter operator.
 * @property {*} [value] - The value used by the operator on the field value.
 */

/**
 * @typedef FilterLogicalGroup
 * @property {String} logic - The logical operator to apply to the filters.
 * @property {Array.<FilterCondition|FilterLogicalGroup>} filters - The filter items and groups under the logical operator.
 */

const ISO8601Date = /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(\.\d+)?(([+-]\d\d:\d\d)|Z)?$/i;
const NakedValueTokenTerminator = /\s|\)|\(|\[|\]/;

/**
 * Represents a tree of conditions that can be used to filter objects and data based on "fields", "operations", and
 * "values" in logical and/or groupings.
 */
class Filter {
    /**
     * Creates a new `Filter` instance.
     * @param {Filter|FilterLogicalGroup} [tree] - Create the filter with an existing filter tree object.
     */
    constructor(tree) {

        /**
         * @type {FilterLogicalGroup}
         */
        this.tree = null;

        /**
         * @type {FilterLogicalGroup}
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
     * @param {String|Filter|FilterLogicalGroup} field - The field affected by the filter.
     * @param {String} [op] - The filter operator.
     * @param {*} [value] - The value used by the operator on the field value.
     * @returns {Filter}
     */
    static and(field, op, value) {
        return new Filter().and(field, op, value);
    }

    /**
     * Create a new `Filter` instance and opening with a logical "or" operator.
     * @param {String|Filter|FilterLogicalGroup} field - The field affected by the filter.
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
     * @param {Filter|FilterLogicalGroup} filter - The filter to check.
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
     * @param {String|Filter|FilterLogicalGroup} field - The field affected by the filter.
     * @param {String} [op] - The filter operator.
     * @param {*} [value] - The value used by the operator on the field value.
     * @returns {Filter}
     */
    and(field, op, value) {
        return this.add(Filter.LOGIC.AND, field, op, value);
    }

    /**
     * Adds a new condition using a logical "or" operator.
     * @param {String|Filter|FilterLogicalGroup} field - The field affected by the filter.
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
     * @param {String|Filter|FilterLogicalGroup} field - The field affected by the filter.
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
     * @returns {FilterLogicalGroup}
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
     * @returns {FilterCondition}
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
     * @param {FilterLogicalGroup} orig - The group to clone.
     * @returns {FilterLogicalGroup}
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
     * @param {FilterLogicalGroup|FilterCondition} conditionOrGroup - The filter criteria to check.
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
     * @param {FilterLogicalGroup|FilterCondition} [fg] - Optional filter condition or filter group to convert to a string.
     * @returns {String}
     */
    toString(fg) {
        let s = null;
        if (fg) {
            if (fg.logic) {
                if (fg.filters) {
                    if (fg !== this.tree) {
                        s = '(';
                    } else {
                        s = '';
                    }
                    for (let x = 0; x < fg.filters.length; x++) {
                        s += this.toString(fg.filters[x]);
                        if (fg.filters.length > 1 && x < fg.filters.length - 1) {
                            s += ` ${fg.logic.toUpperCase()} `;
                        }
                    }
                    if (fg !== this.tree) {
                        s += ')';
                    }
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
                            } else if (v instanceof Date) {
                                return `"${v.toISOString()}"`;
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
                    } else if (fg.value instanceof Date) {
                        strValue = `"${fg.value.toISOString()}"`;
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
     * Recursive function that parses each "group" it finds into a new `Filter` instance.
     * @throws SyntaxError if the string is unparsable.
     * @param {String|Array.<ParserToken>} input - The input string to parse into a new `Filter` instance.
     * @returns {Filter} Returns a `Filter` instance when an input is given. If the input is `null` then `null` 
     * is returned.
     */
    static parse(input) {
        if (input) {
            let tokens;
            if (typeof input === 'string') {
                tokens = Filter._tokenize(input);
                console.log(tokens);
            } else if (Array.isArray(input)) {
                tokens = input;
            } else {
                throw new SyntaxError('Invalid "input" argument. Input must be a string or array of tokens.');
            }
            let f = new Filter();
            //look-ahead for group-logic
            let groupDepth = 0;
            let groupLogic = Filter.LOGIC.AND;
            for (let gei = 0; gei < tokens.length; gei++) {
                if (tokens[gei].type === 'group-start') {
                    groupDepth++;
                } else if (groupDepth > 0 && tokens[gei].type === 'group-end') {
                    groupDepth--;
                } else if (groupDepth === 0 && tokens[gei].type === 'group-logic') {
                    groupLogic = tokens[gei].value;
                }
            }
            for (let ti = 0; ti < tokens.length; ti++) {
                let t = tokens[ti];
                if (t.type === 'group-start') {
                    //find ending token index for the group, and determine logic
                    let endingTokenIndex = -1;
                    let groupDepth = 0;
                    for (let gei = ti + 1; gei < tokens.length; gei++) {
                        if (tokens[gei].type === 'group-start') {
                            groupDepth++;
                        } else if (groupDepth > 0 && tokens[gei].type === 'group-end') {
                            groupDepth--;
                        } else if (groupDepth === 0 && tokens[gei].type === 'group-end') {
                            endingTokenIndex = gei;
                        }
                    }
                    //create new group
                    let tokensInGroup = tokens.slice(ti + 1, endingTokenIndex);
                    if (tokensInGroup && tokensInGroup.length) {
                        let fg = this.parse(tokensInGroup);
                        f.add(groupLogic, fg);
                    }
                    //move to after the group to process next
                    ti = endingTokenIndex;
                } else if (t.type === 'condition-field') {
                    //look-ahead and get the op and optional value.
                    let tOp = tokens[ti + 1];
                    let tValue;
                    if (ti + 2 < tokens.length && tokens[ti + 2].type === 'condition-value') {
                        tValue = tokens[ti + 2];
                    }
                    f.add(groupLogic, t.value, tOp.value, Filter._parseValueString(tValue?.value));
                }
            }
            return f;
        }
        return null;
    }

    /**
     * @typedef ParserToken
     * @property {String} type
     * @property {Number} startIndex
     * @property {Number} endIndex
     * @property {String} [value]
     */

    /**
     * Scans the input string starting at the given index to determine the logic for a group.
     * @param {String} input - The input string to parse into an array of tokens.
     * @returns {Array.<ParserToken>}
     * @private
     */
    static _tokenize(input) {
        let tokens = [];
        let openToken = null;
        let isLogicalOr = /^OR/i;
        let isLogicalAnd = /^AND/i;
        let sortedOpKeys = Filter.OP_KEYS.sort((a, b) => b.length - a.length); //ensure longest strings are checked first
        for (let i = 0; i < input.length; i++) {
            let newToken = null;
            if (openToken && openToken.type === 'condition-value') { //parsing a value
                if (!openToken.endIndex
                    && (
                        (openToken.style === 'double-quoted' && input[i - 1] !== '\\' && input[i] === '"')
                        || (openToken.style === 'single-quoted' && input[i - 1] !== '\\' && input[i] === '\'')
                        || (openToken.style === 'array' && input[i - 1] !== '\\' && input[i] === '}')
                    )) {
                    openToken.value += input[i]; //we include the quote (parsed out later)
                    openToken.endIndex = i + 1;
                    openToken = null;
                } else if (!openToken.endIndex && openToken.style === 'naked' && NakedValueTokenTerminator.test(input[i])) {
                    openToken.endIndex = i;
                    openToken = null;
                    i--; //need to walk back (-1) on this after closing as it may be a actionable char
                } else if (!openToken.endIndex && openToken.style === 'naked' && input[i - 1] !== '\\' && input[i] === '"') {
                    throw new SyntaxError(`Failed to tokenize filter string, a conditional value at position ${openToken.startIndex} found a closing double-quote, but the value was not opened with one.`);
                } else if (!openToken.endIndex && openToken.style === 'naked' && input[i - 1] !== '\\' && input[i] === '\'') {
                    throw new SyntaxError(`Failed to tokenize filter string, a conditional value at position ${openToken.startIndex} found a closing single-quote, but the value was not opened with one.`);
                } else {
                    openToken.value += input[i];
                }
            } else if (openToken && openToken.type === 'condition-field') { //parsing a field name
                if (!openToken.endIndex && input[i] === ']') {
                    openToken.endIndex = i + 1;
                    openToken = null;
                } else {
                    openToken.value = (openToken.value ?? '') + input[i];
                }
            } else if (input[i] === '(') { //new group detected
                newToken = {
                    type: 'group-start',
                    startIndex: i,
                    endIndex: i + 1
                };
            } else if (input[i] === ')') { //new group detected
                newToken = {
                    type: 'group-end',
                    startIndex: i,
                    endIndex: i + 1
                };
            } else if (input[i] === '[') {
                newToken = {
                    type: 'condition-field',
                    startIndex: i
                };
                openToken = newToken; //token is open for more information
            } else if (isLogicalOr.test(input.substr(i, 2))) {
                newToken = {
                    type: 'group-logic',
                    startIndex: i,
                    endIndex: i + 2,
                    value: Filter.LOGIC.OR
                };
                i += 1;
            } else if (isLogicalAnd.test(input.substr(i, 3))) {
                newToken = {
                    type: 'group-logic',
                    startIndex: i,
                    endIndex: i + 3,
                    value: Filter.LOGIC.AND
                };
                i += 2;
            } else {
                if (tokens.length && tokens[tokens.length - 1].type === 'condition-field') { //check for matching operator only if preceding was a conditional-field
                    for (let op of sortedOpKeys) {
                        if (input.substr(i, op.length)?.localeCompare(op, undefined, { sensitivity: 'base' }) === 0) {
                            newToken = {
                                type: 'condition-op',
                                startIndex: i,
                                endIndex: i + op.length,
                                value: op
                            };
                            i += op.length - 1;
                            break;
                        }
                    }
                }
                if (!newToken && /\s/.test(input[i]) === false) { //check for a possible value starting
                    //values should only be declared if the last token was a condition-op, validate this immediately.
                    if (tokens.length && tokens[tokens.length - 1].type !== 'condition-op') {
                        throw new SyntaxError(`Failed to tokenize filter string, an invalid or unexpected value was found at position ${i}.`);
                    }
                    newToken = {
                        type: 'condition-value',
                        startIndex: i,
                        value: input[i],
                        style: 'naked'
                    };
                    if (input[i - 1] !== '\\') { //ignore escaped values
                        if (input[i] === '"') {
                            newToken.style = 'double-quoted';
                        } else if (input[i] === '\'') {
                            newToken.style = 'single-quoted';
                        } else if (input[i] === '{') {
                            newToken.style = 'array';
                        }
                    }
                    openToken = newToken; //token is open for more information
                }
            }
            //push new token to array
            if (newToken) {
                tokens.push(newToken);
            }
        }
        //validate
        //ensure no open token
        if (openToken) {
            if (openToken.type === 'condition-field') {
                throw new SyntaxError(`Failed to tokenize filter string, a conditional field at position ${openToken.startIndex} was not closed properly, expected matching square brackets "[" and "]".`);
            } else if (openToken.type === 'condition-value' && openToken.style === 'double-quoted') {
                throw new SyntaxError(`Failed to tokenize filter string, a conditional value at position ${openToken.startIndex} was not closed properly, a closing double-quote was not found.`);
            } else if (openToken.type === 'condition-value' && openToken.style === 'single-quoted') {
                throw new SyntaxError(`Failed to tokenize filter string, a conditional value token at position ${openToken.startIndex} was not closed properly, a closing single-quote was not found.`);
            }
        }
        //ensure all groups are terminated
        let groupStartCount = tokens.reduce((p, c) => c.type === 'group-start' ? p + 1 : p + 0, 0);
        let groupEndCount = tokens.reduce((p, c) => c.type === 'group-end' ? p + 1 : p + 0, 0);
        if (groupStartCount !== groupEndCount) {
            throw new SyntaxError('Failed to tokenize filter string, there are one or more mismatches between the opening and closing group parenthesis "(" and ")".');
        }
        //ensure all condition fields are followed by appropriate tokens
        for (let ti = 0; ti < tokens.length; ti++) {
            let t = tokens[ti];
            if (t.type === 'condition-field') { //check followed by condition-op
                if (ti === tokens.length - 1 || (ti < tokens.length - 1 && tokens[ti + 1].type !== 'condition-op')) {
                    throw new SyntaxError(`Failed to tokenize filter string, a conditional field at position ${t.startIndex} was not followed by a conditional operator.`);
                }
            }
        }
        return tokens;
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