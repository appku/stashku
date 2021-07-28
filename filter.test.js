import Filter from './filter.js';

describe('#constructor', () => {
    it('initializes ok.', () => {
        expect(() => { new Filter(); }).not.toThrow();
    });
    it('copies an existing filter tree.', () => {
        let src = Filter.or('First', Filter.OP.EQUALS, 'ABC');
        let tgt = new Filter(src);
        expect(tgt.tree.logic).toBe(Filter.LOGIC.OR);
        expect(tgt.tree.filters.length).toBe(1);
        expect(tgt.tree.filters[0].field).toBe('First');
        expect(tgt.tree.filters[0].op).toBe(Filter.OP.EQUALS);
        expect(tgt.tree.filters[0].value).toBe('ABC');
    });
    it('copies a tree-like object, renaming any "operator" properties.', () => {
        let src = {
            logic: 'or',
            filters: [
                { field: 'First', operator: 'eq', value: 'ABC' },
                { field: 'Age', operator: 'gt', value: 123 },
                {
                    logic: 'or',
                    filters: [
                        { field: 'Last', operator: 'startswith', value: 'A' },
                        { field: 'Last', operator: 'startswith', value: 'Z' }
                    ]
                }
            ]
        };
        let tgt = new Filter(src);
        expect(tgt.tree.logic).toBe(Filter.LOGIC.OR);
        expect(tgt.tree.filters.length).toBe(3);
        expect(tgt.tree.filters[0].field).toBe('First');
        expect(tgt.tree.filters[0].op).toBe(Filter.OP.EQUALS);
        expect(tgt.tree.filters[0].value).toBe('ABC');
        expect(tgt.tree.filters[1].field).toBe('Age');
        expect(tgt.tree.filters[1].op).toBe(Filter.OP.GREATERTHAN);
        expect(tgt.tree.filters[1].value).toBe(123);
        expect(tgt.tree.filters[2].logic).toBe(Filter.LOGIC.OR);
        expect(tgt.tree.filters[2].filters[0].field).toBe('Last');
        expect(tgt.tree.filters[2].filters[0].op).toBe(Filter.OP.STARTSWITH);
        expect(tgt.tree.filters[2].filters[0].value).toBe('A');
        expect(tgt.tree.filters[2].filters[1].field).toBe('Last');
        expect(tgt.tree.filters[2].filters[1].op).toBe(Filter.OP.STARTSWITH);
        expect(tgt.tree.filters[2].filters[1].value).toBe('Z');
    });
});

describe('.and', () => {
    it('throws when the "field" parameter argument is missing', () => {
        expect(() => { Filter.and(); }).toThrow('field');
        expect(() => { Filter.and(null); }).toThrow('field');
    });
    it('throws when the "operator" parameter argument is missing', () => {
        expect(() => { Filter.and('test'); }).toThrow('op');
        expect(() => { Filter.and(123); }).toThrow('op');
    });
    it('builds the appropriate tree.', () => {
        let f = Filter.and('test', Filter.OP.EQUALS, 1);
        expect(f.tree).toBeTruthy();
        expect(f.tree.logic).toBe(Filter.LOGIC.AND);
        expect(f.tree.filters.length).toBe(1);
        expect(f.tree.filters[0].field).toBe('test');
        expect(f.tree.filters[0].op).toBe(Filter.OP.EQUALS);
        expect(f.tree.filters[0].value).toBe(1);
    });
    it('continues current logic operator.', () => {
        let f = Filter
            .and('test0', Filter.OP.EQUALS, 1)
            .and('test1', Filter.OP.EQUALS, 2)
            .and('test2', Filter.OP.EQUALS, 3);
        expect(f.tree).toBeTruthy();
        expect(f.tree.logic).toBe(Filter.LOGIC.AND);
        expect(f.tree.filters.length).toBe(3);
        for (let x = 0; x < 3; x++) {
            expect(f.tree.filters[x].field).toBe('test' + x);
            expect(f.tree.filters[x].value).toBe(x + 1);
        }
    });
});

describe('.or', () => {
    it('throws when the "field" parameter argument is missing', () => {
        expect(() => { Filter.or(); }).toThrow('field');
        expect(() => { Filter.or(null); }).toThrow('field');
    });
    it('throws when the "operator" parameter argument is missing', () => {
        expect(() => { Filter.or('test'); }).toThrow('op');
        expect(() => { Filter.or(123); }).toThrow('op');
    });
    it('builds the appropriate tree.', () => {
        let f = Filter.or('test', Filter.OP.EQUALS, 1);
        expect(f.tree).toBeTruthy();
        expect(f.tree.logic).toBe(Filter.LOGIC.OR);
        expect(f.tree.filters.length).toBe(1);
        expect(f.tree.filters[0].field).toBe('test');
        expect(f.tree.filters[0].op).toBe(Filter.OP.EQUALS);
        expect(f.tree.filters[0].value).toBe(1);
    });
    it('continues current logic operator.', () => {
        let f = Filter
            .or('test0', Filter.OP.EQUALS, 1)
            .or('test1', Filter.OP.EQUALS, 2)
            .or('test2', Filter.OP.EQUALS, 3);
        expect(f.tree).toBeTruthy();
        expect(f.tree.logic).toBe(Filter.LOGIC.OR);
        expect(f.tree.filters.length).toBe(3);
        for (let x = 0; x < 3; x++) {
            expect(f.tree.filters[x].field).toBe('test' + x);
            expect(f.tree.filters[x].value).toBe(x + 1);
        }
    });
});

describe('.isEmpty', () => {
    it('returns true when the condition tree is empty.', () => {
        expect(Filter.isEmpty(new Filter())).toBe(true);
    });
    it('returns true when the condition tree only contains empty groups.', () => {
        let f = new Filter();
        f.and(f._filterLogicalGroup(Filter.LOGIC.AND));
        f.or(f._filterLogicalGroup(Filter.LOGIC.AND));
        expect(Filter.isEmpty(f)).toBe(true);
    });
    it('returns false when the condition tree contains at least one condition.', () => {
        let f = new Filter();
        f.and(f._filterLogicalGroup(Filter.LOGIC.AND));
        f.or(f._filterLogicalGroup(Filter.LOGIC.AND));
        f.or('a', Filter.OP.ISNOTEMPTY);
        expect(Filter.isEmpty(f)).toBe(false);
        //test nested condition.
        f = new Filter({
            filters: [{
                filters: [{ field: 'abc', op: Filter.OP.EQUALS, value: 123 }],
                logic: Filter.LOGIC.AND
            }],
            logic: Filter.LOGIC.AND
        });
        expect(Filter.isEmpty(f)).toBe(false);
    });
});

describe('#clone', () => {
    it('clones an empty filter.', () => {
        let f = new Filter();
        expect(() => { f.clone(); }).not.toThrow();
        expect(f.clone()).not.toBe(f);
        expect(f.clone().tree).toBe(null);
    });
    it('ensures a new instance and copy of tree conditions and groups.', () => {
        let f = Filter
            .or('test0', Filter.OP.EQUALS, 1)
            .or('test1', Filter.OP.EQUALS, 2)
            .and('test2', Filter.OP.CONTAINS, 'test');
        let c = f.clone();
        expect(c.tree).not.toBe(f.tree);
        expect(c.tree.logic).toBe(f.tree.logic);
        expect(c.toString()).toBe(f.toString());
        expect(c.tree.filters.length).toBe(2);
        expect(c.tree.filters[0]).not.toBe(f.tree.filters[0]);
        expect(c.tree.filters[1]).not.toBe(f.tree.filters[1]);
    });
});

describe('#add', () => {
    it('throws when the "logic" argument is missing.', () => {
        expect(() => new Filter().add(null)).toThrow(/logic.+required/gi);
    });
    it('throws when the "logic" argument is invalid.', () => {
        expect(() => new Filter().add('banana')).toThrow(/logic.+invalid/gi);
    });
    it('throws when the "field" argument is missing.', () => {
        expect(() => new Filter().add(Filter.LOGIC.AND, null)).toThrow(/field.+required/gi);
    });
    it('does not modify the filter tree when an empty filter is passed.', () => {
        let f = Filter
            .or('test0', Filter.OP.EQUALS, 1)
            .or('test1', Filter.OP.EQUALS, 2)
            .or('test2', Filter.OP.EQUALS, 3);
        let expectedTree = Object.assign({}, f.tree);
        expect(f.add(Filter.LOGIC.AND, new Filter()).tree).toEqual(expectedTree);
    });
});

describe('#test', () => {
    let model = {
        abc: 123,
        hello: 'world'
    };
    it('correctly returns expected boolean result for simple condition.', () => {
        let tests = [
            { field: 'abc', op: Filter.OP.EQUALS, value: 123, expects: true },
            { field: 'abc', op: Filter.OP.EQUALS, value: '123', expects: false },
            { field: 'abc', op: Filter.OP.EQUALS, value: null, expects: false },
            { field: 'abc', op: Filter.OP.NOTEQUALS, value: 456, expects: true },
            { field: 'abc', op: Filter.OP.NOTEQUALS, value: '456', expects: true },
            { field: 'abc', op: Filter.OP.NOTEQUALS, value: null, expects: true },
            { field: 'abc', op: Filter.OP.ISNULL, expects: false },
            { field: 'abc', op: Filter.OP.ISNOTNULL, expects: true },
            { field: 'abc', op: Filter.OP.LESSTHAN, value: 999, expects: true },
            { field: 'abc', op: Filter.OP.LESSTHAN, value: 123, expects: false },
            { field: 'abc', op: Filter.OP.LESSTHAN, value: 1, expects: false },
            { field: 'abc', op: Filter.OP.LESSTHANOREQUAL, value: 999, expects: true },
            { field: 'abc', op: Filter.OP.LESSTHANOREQUAL, value: 123, expects: true },
            { field: 'abc', op: Filter.OP.LESSTHANOREQUAL, value: 1, expects: false },
            { field: 'abc', op: Filter.OP.GREATERTHAN, value: 111, expects: true },
            { field: 'abc', op: Filter.OP.GREATERTHAN, value: 123, expects: false },
            { field: 'abc', op: Filter.OP.GREATERTHAN, value: 999, expects: false },
            { field: 'abc', op: Filter.OP.GREATERTHANOREQUAL, value: 111, expects: true },
            { field: 'abc', op: Filter.OP.GREATERTHANOREQUAL, value: 123, expects: true },
            { field: 'abc', op: Filter.OP.GREATERTHANOREQUAL, value: 999, expects: false },
            { field: 'hello', op: Filter.OP.STARTSWITH, value: 'wor', expects: true },
            { field: 'hello', op: Filter.OP.STARTSWITH, value: 'WOR', expects: false },
            { field: 'hello', op: Filter.OP.STARTSWITH, value: 'or', expects: false },
            { field: 'hello', op: Filter.OP.ENDSWITH, value: 'ld', expects: true },
            { field: 'hello', op: Filter.OP.ENDSWITH, value: 'LD', expects: false },
            { field: 'hello', op: Filter.OP.ENDSWITH, value: 'llld', expects: false },
            { field: 'hello', op: Filter.OP.CONTAINS, value: 'orl', expects: true },
            { field: 'hello', op: Filter.OP.CONTAINS, value: 'OrL', expects: false },
            { field: 'hello', op: Filter.OP.CONTAINS, value: 'owls', expects: false },
            { field: 'hello', op: Filter.OP.DOESNOTCONTAIN, value: 'banana', expects: true },
            { field: 'hello', op: Filter.OP.DOESNOTCONTAIN, value: 'oRL', expects: true },
            { field: 'hello', op: Filter.OP.DOESNOTCONTAIN, value: 'orl', expects: false },
            { field: 'hello', op: Filter.OP.ISEMPTY, expects: false },
            { field: 'hello', op: Filter.OP.ISNOTEMPTY, expects: true },
            { field: 'hello', op: Filter.OP.IN, value: ['ok', 'ehll', 'world'], expects: true },
            { field: 'hello', op: Filter.OP.IN, value: ['ok', 'ehll', 'WORLD'], expects: false },
            { field: 'hello', op: Filter.OP.IN, value: ['ok', 'ehll', 'moose'], expects: false },
            { field: 'hello', op: Filter.OP.IN, value: [], expects: false },
            { field: 'hello', op: Filter.OP.IN, value: null, expects: false },
            { field: 'hello', op: Filter.OP.NOTIN, value: ['hello', 'moose'], expects: true },
            { field: 'hello', op: Filter.OP.NOTIN, value: ['hello', 'world', 'moose'], expects: false },
            { field: 'hello', op: Filter.OP.NOTIN, value: [], expects: true },
            { field: 'hello', op: Filter.OP.NOTIN, value: null, expects: true }
        ];
        for (let x = 0; x < tests.length; x++) {
            let f = Filter.and(tests[x].field, tests[x].op, tests[x].value);
            expect(f.test(model)).toBe(tests[x].expects);
        }
    });
    it('applies OR logic properly.', () => {
        let f = Filter
            .or('abc', Filter.OP.EQUALS, 999)
            .or('hello', Filter.OP.EQUALS, 'worldsz');
        expect(f.test(model)).toBe(false);
        f.or('hello', Filter.OP.EQUALS, 'world');
        expect(f.test(model)).toBe(true);
    });
    it('applies AND logic properly.', () => {
        let f = Filter
            .and('abc', Filter.OP.EQUALS, 123)
            .and('hello', Filter.OP.EQUALS, 'world');
        expect(f.test(model)).toBe(true);
        f.and('hello', Filter.OP.EQUALS, 'banana');
        expect(f.test(model)).toBe(false);
    });
    it('logic follows order of operations.', () => {
        let f = Filter
            .and('abc', Filter.OP.EQUALS, 123)
            .and('hello', Filter.OP.EQUALS, 'gambit')
            .or('abc', Filter.OP.GREATERTHAN, 200)
            .and('abc', Filter.OP.GREATERTHAN, 1);
        expect(f.test(model)).toBe(model.abc === 123 && model.hello === 'gambit' || model.abc > 200 && model.abc > 1);
        f = Filter
            .or('abc', Filter.OP.ISNULL)
            .or('hello', Filter.OP.ISNULL)
            .or('abc', Filter.OP.LESSTHAN, 329)
            .and('abc', Filter.OP.GREATERTHAN, 122);
        expect(f.test(model)).toBe(model.abc !== null || model.hello !== null || model.abc < 329 && model.abc > 122);
    });
    it('supports nested objects through dot-notation.', () => {
        let tests = [
            { expected: true, message: { bold: true, value: 'hello' } },
            { expected: false, message: { bold: false, value: 'world' } }
        ];
        let f = Filter.and('message.bold', Filter.OP.EQUALS, true);
        for (let x = 0; x < tests.length; x++) {
            expect(f.test(tests[x])).toBe(tests[x].expected);
        }
        f = Filter.and('message.value', Filter.OP.ENDSWITH, 'orld');
        for (let x = 0; x < tests.length; x++) {
            expect(f.test(tests[x])).toBe(!tests[x].expected);
        }
    });
    it('returns false when no models are specified.', () => {
        expect(new Filter().test()).toBe(false);
        expect(new Filter().test(...[])).toBe(false);
    });
    it('returns true when models are specified but there are no conditions.', () => {
        expect(new Filter().test(null)).toBe(true);
        expect(new Filter().test(...[{ a: 1 }, { b: 2 }])).toBe(true);
    });
});

describe('#toString', () => {
    it('returns simple filter representation.', () => {
        let f = Filter
            .or('test0', Filter.OP.EQUALS, 1)
            .or('test1', Filter.OP.EQUALS, 2)
            .or('test2', Filter.OP.EQUALS, 3)
            .or('test3', Filter.OP.EQUALS, null)
            .or('test4', Filter.OP.EQUALS);
        expect(f.toString()).toBe('([test0] EQ 1 OR [test1] EQ 2 OR [test2] EQ 3 OR [test3] EQ null OR [test4] EQ undefined)');
    });
    it('returns complex filter representation.', () => {
        let f = Filter
            .or('test0', Filter.OP.EQUALS, 1)
            .or('test1', Filter.OP.EQUALS, 2)
            .or('test2', Filter.OP.EQUALS, 3)
            .or(Filter
                .and('test3', Filter.OP.ISNULL)
                .and('test4', Filter.OP.EQUALS, 4)
                .or('test5', Filter.OP.IN, '1,2,3,4,5,6')
                .or('test5', Filter.OP.IN, ['abc', null, 123, undefined, true])
            );
        expect(f.toString()).toBe('([test0] EQ 1 OR [test1] EQ 2 OR [test2] EQ 3 OR (([test3] ISNULL AND [test4] EQ 4) OR [test5] IN "1,2,3,4,5,6" OR [test5] IN {"abc",null,123,undefined,true}))');
    });
});

describe('builds complex logic tree', () => {
    it('allows sub-filters.', () => {
        let f = Filter
            .or('test0', Filter.OP.EQUALS, 1)
            .or('test1', Filter.OP.EQUALS, 2)
            .or(Filter
                .and('abc', Filter.OP.CONTAINS, 'hi')
                .and('abc123', Filter.OP.CONTAINS, 'world')
                .and(Filter
                    .or('moose', Filter.OP.NOTEQUALS, 'goose')
                    .or('horse', Filter.OP.EQUALS, 'gorse')
                )
            );
        expect(f.tree).toBeTruthy();
        expect(f.tree.logic).toBe(Filter.LOGIC.OR);
        expect(f.tree.filters.length).toBe(3);
        expect(f.tree.filters[2].logic).toBe(Filter.LOGIC.AND);
        expect(f.tree.filters[2].filters[2].logic).toBe(Filter.LOGIC.OR);
    });
    it('wraps existing filters in new logic operator.', () => {
        let f = Filter
            .or('test0', Filter.OP.EQUALS, 1)
            .or('test1', Filter.OP.EQUALS, 2)
            .or('test2', Filter.OP.EQUALS, 3)
            .and('test3', Filter.OP.CONTAINS, 'test');
        expect(f.tree).toBeTruthy();
        expect(f.tree.logic).toBe(Filter.LOGIC.AND);
        expect(f.tree.filters.length).toBe(2);
        expect(f.tree.filters[0].logic).toBe(Filter.LOGIC.OR);
        for (let x = 0; x < 3; x++) {
            expect(f.tree.filters[0].filters[x].field).toBe('test' + x);
            expect(f.tree.filters[0].filters[x].value).toBe(x + 1);
        }
    });
});

describe('#_filterLogicalGroup', () => {
    it('throws when the "logic" argument is missing.', () => {
        expect(() => new Filter()._filterLogicalGroup(null)).toThrow(/logic.+required/gi);
    });
    it('throws when the "logic" argument is invalid.', () => {
        expect(() => new Filter()._filterLogicalGroup('banana')).toThrow(/logic.+invalid/gi);
    });
    it('returns a new filter logical group with the logic set.', () => {
        expect(new Filter()._filterLogicalGroup(Filter.LOGIC.AND)).toEqual({ logic: Filter.LOGIC.AND, filters: [] });
        expect(new Filter()._filterLogicalGroup(Filter.LOGIC.OR)).toEqual({ logic: Filter.LOGIC.OR, filters: [] });
    });
});

describe('#_filterCondition', () => {
    it('throws when the "field" argument is missing.', () => {
        expect(() => new Filter()._filterCondition(null)).toThrow(/field.+required/gi);
    });
    it('throws when the "op" argument is missing.', () => {
        expect(() => new Filter()._filterCondition('abc', null)).toThrow(/op.+required/gi);
    });
    it('throws when the "op" argument is invalid.', () => {
        expect(() => new Filter()._filterCondition('abc', 'banana')).toThrow(/op.+invalid/gi);
    });
    it('returns a new filter condition with the field, op, and value set.', () => {
        expect(new Filter()._filterCondition('abc', Filter.OP.ISNULL)).toEqual({ field: 'abc', op: Filter.OP.ISNULL });
    });
});