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
    class TestModel {
        static get a() { return 'aaa'; }
        static get b() {
            return { target: 'bbbb' };
        }
        static get c() {
            return { target: 'c' };
        }
    }
    it('translates modeled sorts.', () => {
        let r = new GetRequest().sort(new Sort('a'), new Sort('b', Sort.DIR.DESC), new Sort('c'));
        r.model(TestModel);
        expect(r.metadata.sorts[0].property).toBe('aaa');
        expect(r.metadata.sorts[1].property).toBe('bbbb');
        expect(r.metadata.sorts[2].property).toBe('c');
    });
    it('translates modeled where conditions.', () => {
        let r = new GetRequest().where('{a} == 55 OR {b} ~~ "soda" OR {c} != 53');
        r.model(TestModel);
        expect(r.metadata.where.tree).toEqual({
            logic: 'or',
            filters: [
                { property: 'aaa', op: 'eq', value: 55 },
                { property: 'bbbb', op: 'contains', value: 'soda' },
                { property: 'c', op: 'neq', value: 53 }
            ]
        });
    });
    it('adds the model type $stashku header when specified.', () => {
        class ContactPersonModel {
            static get $stashku() {
                return {
                    name: 'ContactPersonModel',
                    slug: 'contact-person',
                    plural: {
                        name: 'ContactPersonModels',
                        slug: 'contact-persons',
                    }
                };
            }
        }
        let r = new GetRequest().model(ContactPersonModel, false, true);
        expect(r.metadata.headers.get('model')).toEqual({
            name: 'ContactPersonModel',
            slug: 'contact-person',
            plural: {
                name: 'ContactPersonModels',
                slug: 'contact-persons',
            }
        });
    });
    it('adds to the metadata "properties" property.', () => {
        class MyModel {
            static get hello() { return 'hello'; }
            static get abc() { return 'abc'; }
        }
        let r = new GetRequest().model(MyModel);
        expect(r.metadata.properties).toEqual(['hello', 'abc']);
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
    it('sets the "properties" metadata when PropertyDefinition arguments are provided.', () => {
        let r = new GetRequest();
        r.properties({ target: 'a' }, { target: 'b' }, { target: 'c' });
        expect(r.metadata.properties).toEqual(['a', 'b', 'c']);
    });
    it('ignores "properties" that have already been added.', () => {
        let r = new GetRequest();
        r.properties('a', 'b', 'c');
        r.properties('c', { target: 'a' }, 'q');
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
    it('adds to properties already defined in a model.', () => {
        class TestModel {
            static get hello() { return 'hello'; }
        }
        expect(new GetRequest().model(TestModel).properties('ID', 'Moose').metadata.properties)
            .toEqual(['hello', 'ID', 'Moose']);
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
        expect(r.metadata.where.tree.filters[0].property).toBe('a');
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
    it('accepts tokenized sort strings.', () => {
        let r = new GetRequest();
        expect(r.sort('{ID} desc', '{Horse} asc')).toBe(r);
        expect(r.metadata.sorts.length).toBe(2);
        expect(r.metadata.sorts[0]).toBeInstanceOf(Sort);
        expect(r.metadata.sorts[0].property).toBe('ID');
        expect(r.metadata.sorts[0].dir).toBe('desc');
        expect(r.metadata.sorts[1]).toBeInstanceOf(Sort);
        expect(r.metadata.sorts[1].property).toBe('Horse');
        expect(r.metadata.sorts[1].dir).toBe('asc');
    });
    it('accepts a Sort-like array of objects.', () => {
        let r = new GetRequest();
        expect(r.sort([{ property: 'ID', dir: 'asc' }])).toBe(r);
        expect(r.metadata.sorts.length).toBe(1);
        expect(r.metadata.sorts[0]).toBeInstanceOf(Sort);
        expect(r.metadata.sorts[0].property).toBe('ID');
        expect(r.metadata.sorts[0].dir).toBe('asc');
    });
    it('accepts a kendo-like array of objects.', () => {
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
    it('sets skip and take to 0 if "all" is passed.', () => {
        let q = new GetRequest().skip(111).take(123);
        q.skip('all');
        expect(q.metadata.skip).toBe(0);
        expect(q.metadata.take).toBe(0);
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
    it('sets skip and take to 0 if "all" is passed.', () => {
        let q = new GetRequest().skip(111).take(123);
        q.take('all');
        expect(q.metadata.skip).toBe(0);
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
        expect(r.metadata.headers).toBeNull();
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

describe('#headers', () => {
    it('throws when the dictionary argument is missing.', () => {
        expect(() => new GetRequest().headers()).toThrow(/dictionary.+argument/);
    });
    it('throws when the dictionary argument is not a Map, object, or null.', () => {
        expect(() => new GetRequest().headers(244)).toThrow(/dictionary.+argument/);
        expect(() => new GetRequest().headers(true)).toThrow(/dictionary.+argument/);
        expect(() => new GetRequest().headers(undefined)).toThrow(/dictionary.+argument/);
    });
    it('throws when the a non-string key is defined.', () => {
        let m = new Map();
        m.set('ok', true);
        m.set(123, true);
        expect(() => new GetRequest().headers(m)).toThrow(/key.+argument/);
    });
    it('skips null or undefined keys.', () => {
        let m = new Map();
        m.set(null, true);
        m.set('ok', true);
        expect(new GetRequest().headers(m).metadata.headers.size).toBe(1);
    });
    it('deletes the header if the value for the key is null or undefined.', () => {
        let r = new GetRequest();
        r.headers({ a: 1, b: 'hi', c: true });
        expect(r.metadata.headers.size).toBe(3);
        r.headers({ b: null });
        expect(r.metadata.headers.size).toBe(2);
        expect(r.metadata.headers.get('b')).toBeUndefined();
        r.headers({ c: undefined });
        expect(r.metadata.headers.size).toBe(1);
        expect(r.metadata.headers.get('c')).toBeUndefined();
    });
    it('creates a header map from an object.', () => {
        let r = new GetRequest();
        r.headers({
            a: 1,
            b: 'hi',
            c: true,
            z: { complex: new Date() }
        });
        expect(r.metadata.headers).toBeInstanceOf(Map);
        expect(r.metadata.headers.size).toBe(4);
        expect(r.metadata.headers.get('a')).toBe(1);
        expect(r.metadata.headers.get('b')).toBe('hi');
        expect(r.metadata.headers.get('c')).toBe(true);
        expect(r.metadata.headers.get('z')).toBeTruthy();
        expect(r.metadata.headers.get('z').complex).toBeInstanceOf(Date);
    });
    it('creates a header map from a Map.', () => {
        let r = new GetRequest();
        let myMap = new Map();
        myMap.set('a', 1);
        myMap.set('b', 'hi');
        myMap.set('c', true);
        myMap.set('z', { complex: new Date() });
        r.headers(myMap);
        expect(r.metadata.headers).toBeInstanceOf(Map);
        expect(r.metadata.headers.size).toBe(4);
        expect(r.metadata.headers.get('a')).toBe(1);
        expect(r.metadata.headers.get('b')).toBe('hi');
        expect(r.metadata.headers.get('c')).toBe(true);
        expect(r.metadata.headers.get('z')).toBeTruthy();
        expect(r.metadata.headers.get('z').complex).toBeInstanceOf(Date);
    });
    it('merges properties from subsequent calls.', () => {
        let r = new GetRequest();
        let myMap = new Map();
        myMap.set('a', 1);
        myMap.set('b', 'hi');
        myMap.set('c', true);
        r.headers(myMap);
        r.headers({ z: { complex: new Date() } });
        r.headers({ b: 'dinosaurs' });
        expect(r.metadata.headers).toBeInstanceOf(Map);
        expect(r.metadata.headers.size).toBe(4);
        expect(r.metadata.headers.get('a')).toBe(1);
        expect(r.metadata.headers.get('b')).toBe('dinosaurs');
        expect(r.metadata.headers.get('c')).toBe(true);
        expect(r.metadata.headers.get('z')).toBeTruthy();
        expect(r.metadata.headers.get('z').complex).toBeInstanceOf(Date);
    });
    it('should clear any headers when null is passed.', () => {
        let r = new GetRequest();
        r.headers({ a: 1, b: 'hi', c: true });
        expect(r.headers(null).metadata.headers).toBeInstanceOf(Map);
        expect(r.metadata.headers.size).toBe(0);
    });
    it('returns the request instance in any valid call.', () => {
        let r = new GetRequest();
        expect(r.headers({})).toBe(r);
        expect(r.headers(new Map())).toBe(r);
        expect(r.headers(null)).toBe(r);
    });
});

describe('#toJSON', () => {
    it('returns the metadata to utilize for JSON stringifying.', () => {
        let r = new GetRequest()
            .where(Filter
                .or('test0', Filter.OP.EQUALS, 1)
                .or('test1', Filter.OP.EQUALS, 2)
                .or('test2', Filter.OP.EQUALS, 3)
                .or('test3', Filter.OP.EQUALS, null)
                .or('test4', Filter.OP.EQUALS))
            .from('Goose')
            .headers({ hello: 'world' })
            .skip(10)
            .take(123)
            .sort(new Sort('FirstName', Sort.DIR.DESC));
        let parsed = JSON.parse(JSON.stringify(r));
        expect(parsed.from).toEqual(r.metadata.from);
        expect(parsed.skip).toEqual(r.metadata.skip);
        expect(parsed.take).toEqual(r.metadata.take);
        expect(parsed.count).toBeUndefined();
        expect(parsed.distinct).toBeUndefined();
        expect(parsed.sorts).toEqual([new Sort('FirstName', Sort.DIR.DESC)]);
        expect(parsed.where).toEqual(JSON.stringify(r.metadata.where));
        expect(parsed.headers).toEqual({ hello: 'world' });
    });
});