import DeleteRequest from './delete-request.js';
import Filter from '../filter.js';
import jest from 'jest-mock';

describe('#constructor', () => {
    it('accepts no arguments', () => {
        expect(() => new DeleteRequest()).not.toThrow();
        expect(new DeleteRequest().metadata).toBeTruthy();
    });
});

describe('#method', () => {
    it('returns "delete".', () => {
        expect(new DeleteRequest().method).toBe('delete');
    });
});

describe('#model', () => {
    it('throws on a non-object, non-null model type.', () => {
        expect(() => new DeleteRequest().model()).toThrow(/modelType.+object/i);
        expect(() => new DeleteRequest().model(123)).toThrow(/modelType.+object/i);
        expect(() => new DeleteRequest().model(true)).toThrow(/modelType.+object/i);
        expect(() => new DeleteRequest().model('abc')).toThrow(/modelType.+object/i);
    });
    it('returns the request for chaining.', () => {
        let r = new DeleteRequest();
        expect(r.model(class MyModel { })).toBe(r);
    });
    it('translates modeled where conditions.', () => {
        class TestModel {
            static get a() { return 'aaa'; }
            static get b() {
                return { target: 'bbbb' };
            }
            static get c() {
                return { target: 'c' };
            }
        }
        let r = new DeleteRequest().where('{a} == 55 OR {b} ~~ "soda" OR {c} != 53');
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
        let r = new DeleteRequest().model(ContactPersonModel, false, true);
        expect(r.metadata.headers.get('model')).toEqual({
            name: 'ContactPersonModel',
            slug: 'contact-person',
            plural: {
                name: 'ContactPersonModels',
                slug: 'contact-persons',
            }
        });
    });
});

describe('#count', () => {
    it('is disabled by default.', () => {
        let g = new DeleteRequest();
        expect(g.metadata.count).toBe(false);
    });
    it('enables on an undefined argument.', () => {
        let g = new DeleteRequest();
        expect(g.count().metadata.count).toBe(true);
    });
    it('enables the flag on a truthy value.', () => {
        expect(new DeleteRequest().count(1).metadata.count).toBe(true);
        expect(new DeleteRequest().count(true).metadata.count).toBe(true);
        expect(new DeleteRequest().count({}).metadata.count).toBe(true);
        expect(new DeleteRequest().count('abc').metadata.count).toBe(true);
    });
    it('disables the flag on a falsey value.', () => {
        expect(new DeleteRequest().count(0).metadata.count).toBe(false);
        expect(new DeleteRequest().count(false).metadata.count).toBe(false);
        expect(new DeleteRequest().count(null).metadata.count).toBe(false);
        expect(new DeleteRequest().count('').metadata.count).toBe(false);
    });
});

describe('#all', () => {
    it('enables the "all" metadata property when called without arguments.', () => {
        expect(new DeleteRequest().all().metadata.all).toBe(true);
    });
    it('sets the "all" metadata property to a Boolean equivalent of the "enabled" argument.', () => {
        expect(new DeleteRequest().all(1).metadata.all).toBe(true);
        expect(new DeleteRequest().all(0).metadata.all).toBe(false);
        expect(new DeleteRequest().all(true).metadata.all).toBe(true);
        expect(new DeleteRequest().all(false).metadata.all).toBe(false);
    });
});

describe('#where', () => {
    it('throws on a non-filtering "conditions" argument.', () => {
        expect(() => new DeleteRequest().where(1312312)).toThrow(/conditions.+argument/);
        expect(() => new DeleteRequest().where(new Date())).toThrow(/conditions.+argument/);
        expect(() => new DeleteRequest().where({})).toThrow(/conditions.+argument/);
        expect(() => new DeleteRequest().where([1, 2])).toThrow(/conditions.+argument/);
        expect(() => new DeleteRequest().where(true)).toThrow(/conditions.+argument/);
    });
    it('sets the "where" metadata to the Filter from the "conditions" argument.', () => {
        let f1 = Filter.and('a', Filter.OP.CONTAINS, 'z');
        let f2 = Filter.and('b', Filter.OP.CONTAINS, 'b');
        let r = new DeleteRequest().where(f1);
        expect(r.metadata.where).toBe(f1);
        r.where(f2);
        expect(r.metadata.where).toBe(f2);
    });
    it('resolves a callback to a Filter instance and sets the metadata.', () => {
        let r = new DeleteRequest();
        r.where(f => f.and('a', Filter.OP.CONTAINS, 'z'));
        expect(r.metadata.where).toBeInstanceOf(Filter);
        expect(r.metadata.where.tree.logic).toBe(Filter.LOGIC.AND);
        expect(r.metadata.where.tree.filters.length).toBe(1);
        expect(r.metadata.where.tree.filters[0].property).toBe('a');
        expect(r.metadata.where.tree.filters[0].op).toBe(Filter.OP.CONTAINS);
        expect(r.metadata.where.tree.filters[0].value).toBe('z');
    });
    it('clears the "where" metadata when a null is passed.', () => {
        let r = new DeleteRequest();
        r.where(null);
        expect(r.metadata.where).toBeNull();
    });
    it('returns the request instance in any valid call.', () => {
        let r = new DeleteRequest();
        expect(r.where(null)).toBe(r);
        expect(r.where(f => f.and('a', Filter.OP.CONTAINS, 'z'))).toBe(r);
        expect(r.where(Filter.and('a', Filter.OP.CONTAINS, 'z'))).toBe(r);
    });
    it('passes the original filter, as well as new one in a where callback.', () => {
        let r = new DeleteRequest().where('{ID} == 3');
        let cb = jest.fn();
        r.where(cb);
        expect(cb).toHaveBeenCalled();
        expect(cb.mock.calls[0][0]).toBeInstanceOf(Filter);
        expect(cb.mock.calls[0][0].tree).toBeNull();
        expect(cb.mock.calls[0][1]).toBeInstanceOf(Filter);
        expect(cb.mock.calls[0][1].tree).toEqual(Filter.parse('{ID} == 3').tree);
    });
    it('allows modification of the original where filter through the callback.', () => {
        let r = new DeleteRequest().where('{ID} == 3');
        r.where((f, orig) => orig.and('Host', f.OP.ISNOTNULL));
        expect(r.metadata.where.tree).toEqual(Filter.parse('{ID} == 3 AND {Host} ISNOTNULL').tree);
    });
});

describe('#from', () => {
    it('throws on a non-string "name" argument.', () => {
        expect(() => new DeleteRequest().from(1312312)).toThrow(/name.+argument/);
        expect(() => new DeleteRequest().from(new Date())).toThrow(/name.+argument/);
        expect(() => new DeleteRequest().from({})).toThrow(/name.+argument/);
        expect(() => new DeleteRequest().from([1, 2])).toThrow(/name.+argument/);
        expect(() => new DeleteRequest().from(true)).toThrow(/name.+argument/);
    });
    it('sets the "from" metadata with the "name" argument value.', () => {
        let r = new DeleteRequest().from('test');
        expect(r.metadata.from).toBe('test');
        r.from('abc', '123');
        expect(r.metadata.from).toBe('abc');
    });
    it('clears the "from" metadata when a null is passed.', () => {
        let r = new DeleteRequest().from('test');
        r.from(null);
        expect(r.metadata.from).toBeNull();
    });
    it('returns the request instance in any valid call.', () => {
        let r = new DeleteRequest();
        expect(r.from('a')).toBe(r);
        expect(r.from(null)).toBe(r);
    });
});

describe('#clear', () => {
    it('resets metadata object properties to default.', () => {
        let r = new DeleteRequest()
            .all()
            .from('somewhere')
            .where(f => f.and('a', Filter.OP.CONTAINS, 'z'));
        r.clear();
        expect(r.metadata.where).toBeNull();
        expect(r.metadata.from).toBeNull();
        expect(r.metadata.headers).toBeNull();
    });
    it('recreates the metadata object if it is null', () => {
        let r = new DeleteRequest();
        r.metadata = null;
        r.clear();
        expect(r.metadata).toBeTruthy();
        expect(r.metadata).toBeInstanceOf(Object);
    });
    it('returns the request instance in any valid call.', () => {
        let r = new DeleteRequest();
        expect(r.clear()).toBe(r);
    });
});

describe('#headers', () => {
    it('throws when the dictionary argument is missing.', () => {
        expect(() => new DeleteRequest().headers()).toThrow(/dictionary.+argument/);
    });
    it('throws when the dictionary argument is not a Map, object, or null.', () => {
        expect(() => new DeleteRequest().headers(244)).toThrow(/dictionary.+argument/);
        expect(() => new DeleteRequest().headers(true)).toThrow(/dictionary.+argument/);
        expect(() => new DeleteRequest().headers(undefined)).toThrow(/dictionary.+argument/);
    });
    it('throws when the a non-string key is defined.', () => {
        let m = new Map();
        m.set('ok', true);
        m.set(123, true);
        expect(() => new DeleteRequest().headers(m)).toThrow(/key.+argument/);
    });
    it('skips null or undefined keys.', () => {
        let m = new Map();
        m.set(null, true);
        m.set('ok', true);
        expect(new DeleteRequest().headers(m).metadata.headers.size).toBe(1);
    });
    it('deletes the header if the value for the key is null or undefined.', () => {
        let r = new DeleteRequest();
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
        let r = new DeleteRequest();
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
        let r = new DeleteRequest();
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
        let r = new DeleteRequest();
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
        let r = new DeleteRequest();
        r.headers({ a: 1, b: 'hi', c: true });
        expect(r.headers(null).metadata.headers).toBeInstanceOf(Map);
        expect(r.metadata.headers.size).toBe(0);
    });
    it('returns the request instance in any valid call.', () => {
        let r = new DeleteRequest();
        expect(r.headers({})).toBe(r);
        expect(r.headers(new Map())).toBe(r);
        expect(r.headers(null)).toBe(r);
    });
});

describe('#toJSON', () => {
    it('returns the metadata to utilize for JSON stringifying.', () => {
        let dr = new DeleteRequest()
            .where(Filter
                .or('test0', Filter.OP.EQUALS, 1)
                .or('test1', Filter.OP.EQUALS, 2)
                .or('test2', Filter.OP.EQUALS, 3)
                .or('test3', Filter.OP.EQUALS, null)
                .or('test4', Filter.OP.EQUALS))
            .from('Goose')
            .headers({ hello: 'world' })
            .count();
        let parsed = JSON.parse(JSON.stringify(dr));
        expect(parsed.all).toBeUndefined();
        expect(parsed.from).toEqual(dr.metadata.from);
        expect(parsed.count).toEqual(dr.metadata.count);
        expect(parsed.where).toEqual(JSON.parse(JSON.stringify(dr.metadata.where)));
        expect(parsed.headers).toEqual({ hello: 'world' });
    });
});