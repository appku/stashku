import GetRequest from './get-request.js';
import Sort from '../sort.js';
import Filter from '../filter.js';
import jest from 'jest-mock';

describe('#constructor', () => {
    it('accepts no arguments', () => {
        expect(() => new GetRequest()).not.toThrow();
        expect(new GetRequest().metadata).toBeTruthy();
    });
    it('sets the "properties" metadata when specified', () => {
        let req = new GetRequest('a', 'b', 'c');
        expect(req.metadata.properties).toEqual(['a', 'b', 'c']);
    });
});

describe('#method', () => {
    it('returns "get".', () => {
        expect(new GetRequest().method).toBe('get');
    });
});

describe('#model', () => {
    it('throws on a non-object, non-null model type.', () => {
        expect(() => new GetRequest().model()).toThrow(/modelType.+object/i);
        expect(() => new GetRequest().model(123)).toThrow(/modelType.+object/i);
        expect(() => new GetRequest().model(true)).toThrow(/modelType.+object/i);
        expect(() => new GetRequest().model('abc')).toThrow(/modelType.+object/i);
    });
    it('returns the request for chaining.', () => {
        let r = new GetRequest();
        expect(r.model(class MyModel { })).toBe(r);
    });
    it('sets the metadata "model" property.', () => {
        class MyModel { }
        let r = new GetRequest().model(MyModel);
        expect(r.metadata.model).toBe(MyModel);
    });
    it('sets the metadata "from" property.', () => {
        class MyModel {
            static get $stashku() {
                return { resource: 'abc' };
            }
        }
        let r = new GetRequest().model(MyModel);
        expect(r.metadata.from).toBe('abc');
    });
});

describe('#distinct', () => {
    it('is disabled by default.', () => {
        let g = new GetRequest();
        expect(g.metadata.distinct).toBe(false);
    });
    it('enables on an undefined argument.', () => {
        let g = new GetRequest();
        expect(g.distinct().metadata.distinct).toBe(true);
    });
    it('enables the flag on a truthy value.', () => {
        expect(new GetRequest().distinct(1).metadata.distinct).toBe(true);
        expect(new GetRequest().distinct(true).metadata.distinct).toBe(true);
        expect(new GetRequest().distinct({}).metadata.distinct).toBe(true);
        expect(new GetRequest().distinct('abc').metadata.distinct).toBe(true);
    });
    it('disables the flag on a falsey value.', () => {
        expect(new GetRequest().distinct(0).metadata.distinct).toBe(false);
        expect(new GetRequest().distinct(false).metadata.distinct).toBe(false);
        expect(new GetRequest().distinct(null).metadata.distinct).toBe(false);
        expect(new GetRequest().distinct('').metadata.distinct).toBe(false);
    });
});

describe('#count', () => {
    it('is disabled by default.', () => {
        let g = new GetRequest();
        expect(g.metadata.count).toBe(false);
    });
    it('enables on an undefined argument.', () => {
        let g = new GetRequest();
        expect(g.count().metadata.count).toBe(true);
    });
    it('enables the flag on a truthy value.', () => {
        expect(new GetRequest().count(1).metadata.count).toBe(true);
        expect(new GetRequest().count(true).metadata.count).toBe(true);
        expect(new GetRequest().count({}).metadata.count).toBe(true);
        expect(new GetRequest().count('abc').metadata.count).toBe(true);
    });
    it('disables the flag on a falsey value.', () => {
        expect(new GetRequest().count(0).metadata.count).toBe(false);
        expect(new GetRequest().count(false).metadata.count).toBe(false);
        expect(new GetRequest().count(null).metadata.count).toBe(false);
        expect(new GetRequest().count('').metadata.count).toBe(false);
    });
});

describe('#properties', () => {
    it('throws on a non-string value of the "properties" argument.', () => {
        expect(() => new GetRequest().properties(1312312)).toThrow(/argument/);
        expect(() => new GetRequest().properties({})).toThrow(/argument/);
        expect(() => new GetRequest().properties(new Date())).toThrow(/argument/);
        expect(() => new GetRequest().properties([1, 2, 3])).toThrow(/argument/);
        expect(() => new GetRequest().properties(true, 'ok', 'dokey')).toThrow(/argument/);
        expect(() => new GetRequest().properties('ok', 'dokey', 1323)).toThrow(/argument/);
    });
    it('sets the "properties" metadata when string arguments are provided.', () => {
        let r = new GetRequest();
        r.properties('a', 'b', 'c');
        expect(r.metadata.properties).toEqual(['a', 'b', 'c']);
    });
    it('ignores "properties" that have already been added.', () => {
        let r = new GetRequest();
        r.properties('a', 'b', 'c');
        r.properties('c', 'a', 'q');
        expect(r.metadata.properties).toEqual(['a', 'b', 'c', 'q']);
    });
    it('recreates the "properties" metadata as an array if not already an array.', () => {
        let r = new GetRequest();
        r.metadata.properties = null;
        r.properties('a', 'b');
        expect(Array.isArray(r.metadata.properties)).toBe(true);
    });
    it('clears properties when null is passed', () => {
        let r = new GetRequest();
        r.properties('a', 'b', 'c');
        r.properties(null);
        expect(r.metadata.properties.length).toBe(0);
    });
});

describe('#where', () => {
    it('throws on a non-filtering "conditions" argument.', () => {
        expect(() => new GetRequest().where(1312312)).toThrow(/conditions.+argument/);
        expect(() => new GetRequest().where(new Date())).toThrow(/conditions.+argument/);
        expect(() => new GetRequest().where({})).toThrow(/conditions.+argument/);
        expect(() => new GetRequest().where([1, 2])).toThrow(/conditions.+argument/);
        expect(() => new GetRequest().where(true)).toThrow(/conditions.+argument/);
    });
    it('sets the "where" metadata to the Filter from the "conditions" argument.', () => {
        let f1 = Filter.and('a', Filter.OP.CONTAINS, 'z');
        let f2 = Filter.and('b', Filter.OP.CONTAINS, 'b');
        let r = new GetRequest().where(f1);
        expect(r.metadata.where).toBe(f1);
        r.where(f2);
        expect(r.metadata.where).toBe(f2);
    });
    it('resolves a callback to a Filter instance and sets the metadata.', () => {
        let r = new GetRequest();
        r.where(f => f.and('a', Filter.OP.CONTAINS, 'z'));
        expect(r.metadata.where).toBeInstanceOf(Filter);
        expect(r.metadata.where.tree.logic).toBe(Filter.LOGIC.AND);
        expect(r.metadata.where.tree.filters.length).toBe(1);
        expect(r.metadata.where.tree.filters[0].field).toBe('a');
        expect(r.metadata.where.tree.filters[0].op).toBe(Filter.OP.CONTAINS);
        expect(r.metadata.where.tree.filters[0].value).toBe('z');
    });
    it('clears the "where" metadata when a null is passed.', () => {
        let r = new GetRequest();
        r.where(null);
        expect(r.metadata.where).toBeNull();
    });
    it('returns the request instance in any valid call.', () => {
        let r = new GetRequest();
        expect(r.where(null)).toBe(r);
        expect(r.where(f => f.and('a', Filter.OP.CONTAINS, 'z'))).toBe(r);
        expect(r.where(Filter.and('a', Filter.OP.CONTAINS, 'z'))).toBe(r);
    });
});

describe('#sort', () => {
    it('throws an error if the any `sorts` argument values are not a string, Sort, null, or undefined.', () => {
        expect(() => new GetRequest().sort(1312312)).toThrow(/sorts.+argument/);
        expect(() => new GetRequest().sort(new Date())).toThrow(/sorts.+argument/);
        expect(() => new GetRequest().sort({})).toThrow(/sorts.+argument/);
        expect(() => new GetRequest().sort([1, 2])).toThrow(/sorts.+argument/);
        expect(() => new GetRequest().sort(true)).toThrow(/sorts.+argument/);
        expect(() => new GetRequest().sort('a', 'b', 1312312)).toThrow(/sorts.+argument/);
        expect(() => new GetRequest().sort('a', 'b', new Date())).toThrow(/sorts.+argument/);
        expect(() => new GetRequest().sort('a', 'b', {})).toThrow(/sorts.+argument/);
        expect(() => new GetRequest().sort('a', 'b', [1, 2])).toThrow(/sorts.+argument/);
        expect(() => new GetRequest().sort('a', 'b', true)).toThrow(/sorts.+argument/);
    });
    it('reorders existing sorts to last cumulative call order.', () => {
        let r = new GetRequest().sort('a', 'b', 'c');
        r.sort('d', 'a', 'e');
        let expected = ['b', 'c', 'd', 'a', 'e'];
        for (let i = 0; i < expected.length; i++) {
            expect(r.metadata.sorts[i].property).toBe(expected[i]);
        }
    });
    it('skips over null, undefined and blank string "sorts" argument values.', () => {
        let r = new GetRequest().sort('a', 'b', null, 'c', 'd', '', 'e', undefined);
        let expected = ['a', 'b', 'c', 'd', 'e'];
        for (let i = 0; i < expected.length; i++) {
            expect(r.metadata.sorts[i].property).toBe(expected[i]);
        }
    });
    it('recreates the "sorts" metadata as an array if not already an array.', () => {
        let r = new GetRequest();
        r.metadata.sorts = null;
        r.sort('a', 'b');
        expect(Array.isArray(r.metadata.sorts)).toBe(true);
    });
    it('clears the "sorts" metadata when a null is passed.', () => {
        let r = new GetRequest().sort('a', 'b');
        r.sort(null);
        expect(Array.isArray(r.metadata.sorts)).toBe(true);
        expect(r.metadata.sorts.length).toBe(0);
    });
    it('returns the request instance in any valid call.', () => {
        let r = new GetRequest();
        expect(r.sort(null)).toBe(r);
        expect(r.sort('test', 'abc', Sort.asc('yolo'))).toBe(r);
    });

    it('accepts a kendo-like array of sorts.', () => {
        let r = new GetRequest();
        expect(r.sort([{ field: 'ID', dir: 'asc' }])).toBe(r);
        expect(r.metadata.sorts.length).toBe(1);
        expect(r.metadata.sorts[0]).toBeInstanceOf(Sort);
        expect(r.metadata.sorts[0].property).toBe('ID');
        expect(r.metadata.sorts[0].dir).toBe('asc');
    });
});

describe('#from', () => {
    it('throws on a non-string "name" argument.', () => {
        expect(() => new GetRequest().from(1312312)).toThrow(/name.+argument/);
        expect(() => new GetRequest().from(new Date())).toThrow(/name.+argument/);
        expect(() => new GetRequest().from({})).toThrow(/name.+argument/);
        expect(() => new GetRequest().from([1, 2])).toThrow(/name.+argument/);
        expect(() => new GetRequest().from(true)).toThrow(/name.+argument/);
    });
    it('sets the "from" metadata with the "name" argument value.', () => {
        let r = new GetRequest().from('test');
        expect(r.metadata.from).toBe('test');
        r.from('abc', '123');
        expect(r.metadata.from).toBe('abc');
    });
    it('clears the "from" metadata when a null is passed.', () => {
        let r = new GetRequest().from('test');
        r.from(null);
        expect(r.metadata.from).toBeNull();
    });
    it('returns the request instance in any valid call.', () => {
        let r = new GetRequest();
        expect(r.from('a')).toBe(r);
        expect(r.from(null)).toBe(r);
    });
});

describe('#one', () => {
    it('sets the take to 1.', () => {
        let q = new GetRequest().one();
        expect(q.metadata.skip).toBe(0);
        expect(q.metadata.take).toBe(1);
    });
});

describe('#skip', () => {
    it('stores the skip value.', () => {
        let q = new GetRequest().skip(22);
        expect(q.metadata.skip).toBe(22);
        q.skip(33);
        expect(q.metadata.skip).toBe(33);
    });
    it('stores the skip value but skips the undefined values.', () => {
        let q = new GetRequest().skip(22);
        q.skip(undefined);
        q.skip();
        expect(q.metadata.skip).toBe(22);
    });
    it('skips the undefined values and returns request object.', () => {
        let q = new GetRequest().skip(undefined);
        expect(q).toBeInstanceOf(GetRequest);
    });
    it('sets 0 on null.', () => {
        let q = new GetRequest().skip(111);
        q.skip(null);
        expect(q.metadata.skip).toBe(0);
    });
    it('throws on non-number.', () => {
        let q = new GetRequest();
        expect(() => { q.skip('failthis'); }).toThrow(/number/i);
    });
    it('throws on invalid number.', () => {
        let q = new GetRequest();
        expect(() => { q.skip(-323939); }).toThrow(/number/i);
    });
});

describe('#take', () => {
    it('stores the take value.', () => {
        let q = new GetRequest().take(111);
        expect(q.metadata.take).toBe(111);
        q.take(4223);
        expect(q.metadata.take).toBe(4223);
    });
    it('stores the take value but skips the undefined values.', () => {
        let q = new GetRequest().take(22);
        q.take(undefined);
        q.take();
        expect(q.metadata.take).toBe(22);
    });
    it('skips the undefined values and returns request object.', () => {
        let q = new GetRequest().take(undefined);
        expect(q).toBeInstanceOf(GetRequest);
    });
    it('sets 0 on null.', () => {
        let q = new GetRequest().take(111);
        q.take(null);
        expect(q.metadata.take).toBe(0);
    });
    it('throws on non-number.', () => {
        let q = new GetRequest();
        expect(() => { q.take('failthis'); }).toThrow(/number/i);
    });
    it('throws on invalid number.', () => {
        let q = new GetRequest();
        expect(() => { q.take(-323939); }).toThrow(/number/i);
    });
});

describe('#clear', () => {
    it('resets metadata object properties to default.', () => {
        let r = new GetRequest()
            .properties('a', 'b', 'c')
            .from('somewhere')
            .where(f => f.and('a', Filter.OP.CONTAINS, 'z'))
            .sort('a', 'b');
        r.clear();
        expect(r.metadata.properties.length).toBe(0);
        expect(r.metadata.where).toBeNull();
        expect(r.metadata.sorts.length).toBe(0);
        expect(r.metadata.from).toBeNull();
        expect(r.metadata.skip).toBe(0);
        expect(r.metadata.take).toBe(0);
    });
    it('recreates the metadata object if it is null', () => {
        let r = new GetRequest();
        r.metadata = null;
        r.clear();
        expect(r.metadata).toBeTruthy();
        expect(r.metadata).toBeInstanceOf(Object);
    });
    it('returns the request instance in any valid call.', () => {
        let r = new GetRequest();
        expect(r.clear()).toBe(r);
    });
});

describe('#meta', () => {
    it('removes all non-standard metadata on a null value.', () => {
        let r = new GetRequest()
            .properties('a', 'b', 'c')
            .from('somewhere');
        r.metadata.abc = 'whattttt';
        r.metadata.nonstandard = 123;
        r.meta(null);
        expect(r.metadata.properties).toEqual(['a', 'b', 'c']);
        expect(r.metadata.from).toBe('somewhere');
        expect(r.metadata.abc).toBeUndefined();
        expect(r.metadata.nonstandard).toBeUndefined();
    });
    it('throws on standard metadata property name.', () => {
        let r = new GetRequest()
            .properties('a', 'b', 'c')
            .from('somewhere');
        for (let p of ['properties', 'where', 'sorts', 'from', 'skip', 'take']) {
            let obj = {};
            obj[p] = 123;
            expect(() => r.meta(obj)).toThrow();
        }
    });
    it('add new metadata on a request.', () => {
        let r = new GetRequest()
            .properties('a', 'b', 'c')
            .from('somewhere');
        r.meta({ abc: 'ok', extra: 123 });
        expect(r.metadata.properties).toEqual(['a', 'b', 'c']);
        expect(r.metadata.from).toBe('somewhere');
        expect(r.metadata.abc).toBe('ok');
        expect(r.metadata.extra).toBe(123);
    });
});