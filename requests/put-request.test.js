import PutRequest from './put-request.js';
import jest from 'jest-mock';

describe('#constructor', () => {
    it('accepts no arguments', () => {
        expect(() => new PutRequest()).not.toThrow();
        expect(new PutRequest().metadata).toBeTruthy();
    });
    it('sets the "pk" metadata when "pk" arguments is provided.', () => {
        expect(new PutRequest(['a', 'b', 'c']).metadata.pk.length).toBe(3);
    });
    it('sets the "objects" metadata when "objects" arguments is provided.', () => {
        expect(new PutRequest(null, {}, {}).metadata.objects.length).toBe(2);
    });
});

describe('#method', () => {
    it('returns "put".', () => {
        expect(new PutRequest().method).toBe('put');
    });
});

describe('#model', () => {
    it('throws on a non-object, non-null model type.', () => {
        expect(() => new PutRequest().model()).toThrow(/modelType.+object/i);
        expect(() => new PutRequest().model(123)).toThrow(/modelType.+object/i);
        expect(() => new PutRequest().model(true)).toThrow(/modelType.+object/i);
        expect(() => new PutRequest().model('abc')).toThrow(/modelType.+object/i);
    });
    it('returns the request for chaining.', () => {
        let r = new PutRequest();
        expect(r.model(class MyModel { })).toBe(r);
    });
    it('sets the metadata "model" property.', () => {
        class MyModel { }
        let r = new PutRequest().model(MyModel);
        expect(r.metadata.model).toBe(MyModel);
    });
    it('removes the metadata "model" property when null is passed.', () => {
        let r = new PutRequest().model(class MyModel { });
        r.model(null);
        expect(r.metadata.model).toBeNull();
    });
    it('sets the metadata "to" property.', () => {
        class MyModel {
            static get $stashku() {
                return { resource: 'abc' };
            }
        }
        let r = new PutRequest().model(MyModel);
        expect(r.metadata.to).toBe('abc');
    });
    it('sets and replaces any pks on the request.', () => {
        let r = new PutRequest().pk('ID');
        expect(r.metadata.pk).toEqual(['ID']);
        r.model(class MyModel {
            static get Key() {
                return { pk: true };
            }
            static get Hello() {
                return { target: 'world' };
            }
            static get Toast() {
                return { pk: true };
            }
        });
        expect(r.metadata.pk).toEqual(['Key', 'Toast']);
    });
});

describe('#count', () => {
    it('is disabled by default.', () => {
        let g = new PutRequest();
        expect(g.metadata.count).toBe(false);
    });
    it('enables on an undefined argument.', () => {
        let g = new PutRequest();
        expect(g.count().metadata.count).toBe(true);
    });
    it('enables the flag on a truthy value.', () => {
        expect(new PutRequest().count(1).metadata.count).toBe(true);
        expect(new PutRequest().count(true).metadata.count).toBe(true);
        expect(new PutRequest().count({}).metadata.count).toBe(true);
        expect(new PutRequest().count('abc').metadata.count).toBe(true);
    });
    it('disables the flag on a falsey value.', () => {
        expect(new PutRequest().count(0).metadata.count).toBe(false);
        expect(new PutRequest().count(false).metadata.count).toBe(false);
        expect(new PutRequest().count(null).metadata.count).toBe(false);
        expect(new PutRequest().count('').metadata.count).toBe(false);
    });
});

describe('#pk', () => {
    it('throws on a non-string value of the "primaryKey" argument.', () => {
        expect(() => new PutRequest().pk(1312312)).toThrow(/primaryKeys.+argument/);
        expect(() => new PutRequest().pk({})).toThrow(/primaryKeys.+argument/);
        expect(() => new PutRequest().pk(new Date())).toThrow(/primaryKeys.+argument/);
        expect(() => new PutRequest().pk([1, 2, 3])).toThrow(/primaryKeys.+argument/);
        expect(() => new PutRequest().pk(true, 'ok', 'dokey')).toThrow(/primaryKeys.+argument/);
        expect(() => new PutRequest().pk('ok', 'dokey', 1323)).toThrow(/primaryKeys.+argument/);
    });
    it('sets the "pk" metadata when string arguments are provided.', () => {
        let r = new PutRequest();
        r.pk('a', 'b', 'c');
        expect(r.metadata.pk).toEqual(['a', 'b', 'c']);
    });
    it('ignores PKs that have already been added.', () => {
        let r = new PutRequest();
        r.pk('a', 'b', 'c');
        r.pk('c', 'a', 'q');
        expect(r.metadata.pk).toEqual(['a', 'b', 'c', 'q']);
    });
    it('recreates the "pk" metadata as an array if not already an array.', () => {
        let r = new PutRequest();
        r.metadata.pk = null;
        r.pk('a', 'b');
        expect(Array.isArray(r.metadata.pk)).toBe(true);
    });
    it('clears PKs when null is passed', () => {
        let r = new PutRequest();
        r.pk('a', 'b', 'c');
        r.pk(null);
        expect(r.metadata.pk.length).toBe(0);
    });
});

describe('#objects', () => {
    it('throws when a "objects" argument is a non-object.', () => {
        expect(() => new PutRequest().objects(1312312)).toThrow(/objects.+argument/);
        expect(() => new PutRequest().objects([1, 2])).toThrow(/objects.+argument/);
        expect(() => new PutRequest().objects(true)).toThrow(/objects.+argument/);
        expect(() => new PutRequest().objects(() => { })).toThrow(/objects.+argument/);
        expect(() => new PutRequest().objects({}, 1312312, {})).toThrow(/objects.+argument/);
        expect(() => new PutRequest().objects({}, [1, 2], {})).toThrow(/objects.+argument/);
        expect(() => new PutRequest().objects({}, true, {})).toThrow(/objects.+argument/);
        expect(() => new PutRequest().objects({}, () => { }, {})).toThrow(/objects.+argument/);
    });
    it('skips over null and undefined "objects" argument values.', () => {
        let r = new PutRequest().objects({ a: 0 }, { b: 1 }, null, { c: 2 }, undefined);
        let expected = ['a', 'b', 'c'];
        for (let i = 0; i < expected.length; i++) {
            expect(r.metadata.objects[i][expected[i]]).toBe(i);
        }
    });
    it('skips over existing objects.', () => {
        let c = { v: 2 };
        let r = new PutRequest().objects({ v: 0 }, { v: 1 }, c);
        r.objects({ v: 3 }, c, { v: 4 });
        expect(r.metadata.objects.length).toBe(5);
        for (let i = 0; i < 5; i++) {
            expect(r.metadata.objects[i].v).toBe(i);
        }
    });
    it('recreates the "objects" metadata as an array if not already an array.', () => {
        let r = new PutRequest();
        r.metadata.objects = null;
        r.objects({}, {});
        expect(Array.isArray(r.metadata.objects)).toBe(true);
    });
    it('adds objects from mixed arguments of objects and arrays.', () => {
        let r = new PutRequest();
        r.objects({}, [{}, {}], [[[{}, {}], {}]], {});
        expect(Array.isArray(r.metadata.objects)).toBe(true);
        expect(r.metadata.objects.length).toBe(7);
    });
    it('clears the "objects" metadata when a null is passed.', () => {
        let r = new PutRequest().objects({}, {});
        r.objects(null);
        expect(Array.isArray(r.metadata.objects)).toBe(true);
        expect(r.metadata.objects.length).toBe(0);
    });
    it('returns the request instance in any valid call.', () => {
        let r = new PutRequest();
        expect(r.objects({}, {})).toBe(r);
        expect(r.objects(null)).toBe(r);
    });
});

describe('#to', () => {
    it('throws on a non-string "name" argument.', () => {
        expect(() => new PutRequest().to(1312312)).toThrow(/name.+argument/);
        expect(() => new PutRequest().to(new Date())).toThrow(/name.+argument/);
        expect(() => new PutRequest().to({})).toThrow(/name.+argument/);
        expect(() => new PutRequest().to([1, 2])).toThrow(/name.+argument/);
        expect(() => new PutRequest().to(true)).toThrow(/name.+argument/);
    });
    it('sets the "to" metadata with the "name" argument value.', () => {
        let r = new PutRequest().to('test');
        expect(r.metadata.to).toBe('test');
        r.to('abc', '123');
        expect(r.metadata.to).toBe('abc');
    });
    it('clears the "to" metadata when a null is passed.', () => {
        let r = new PutRequest().to('test');
        r.to(null);
        expect(r.metadata.to).toBeNull();
    });
    it('returns the request instance in any valid call.', () => {
        let r = new PutRequest();
        expect(r.to('a')).toBe(r);
        expect(r.to(null)).toBe(r);
    });
});

describe('#clear', () => {
    it('resets metadata object to default.', () => {
        let r = new PutRequest()
            .objects({}, {}, {})
            .to('somewhere', 's');
        r.clear();
        expect(Array.isArray(r.metadata.objects)).toBe(true);
        expect(r.metadata.objects.length).toBe(0);
        expect(r.metadata.to).toBeNull();
        expect(r.metadata.headers).toBeNull();
    });
    it('recreates the metadata object if it is null', () => {
        let r = new PutRequest();
        r.metadata = null;
        r.clear();
        expect(r.metadata).toBeTruthy();
        expect(r.metadata).toBeInstanceOf(Object);
    });
    it('returns the request instance in any valid call.', () => {
        let r = new PutRequest();
        expect(r.clear()).toBe(r);
    });
});

describe('#headers', () => {
    it('throws when the dictionary argument is missing.', () => {
        expect(() => new PutRequest().headers()).toThrow(/dictionary.+argument/);
    });
    it('throws when the dictionary argument is not a Map, object, or null.', () => {
        expect(() => new PutRequest().headers(244)).toThrow(/dictionary.+argument/);
        expect(() => new PutRequest().headers(true)).toThrow(/dictionary.+argument/);
        expect(() => new PutRequest().headers(undefined)).toThrow(/dictionary.+argument/);
    });
    it('throws when the a non-string key is defined.', () => {
        let m = new Map();
        m.set('ok', true);
        m.set(123, true);
        expect(() => new PutRequest().headers(m)).toThrow(/key.+argument/);
    });
    it('skips null or undefined keys.', () => {
        let m = new Map();
        m.set(null, true);
        m.set('ok', true);
        expect(new PutRequest().headers(m).metadata.headers.size).toBe(1);
    });
    it('deletes the header if the value for the key is null or undefined.', () => {
        let r = new PutRequest();
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
        let r = new PutRequest();
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
        let r = new PutRequest();
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
        let r = new PutRequest();
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
        let r = new PutRequest();
        r.headers({ a: 1, b: 'hi', c: true });
        expect(r.headers(null).metadata.headers).toBeInstanceOf(Map);
        expect(r.metadata.headers.size).toBe(0);
    });
    it('returns the request instance in any valid call.', () => {
        let r = new PutRequest();
        expect(r.headers({})).toBe(r);
        expect(r.headers(new Map())).toBe(r);
        expect(r.headers(null)).toBe(r);
    });
});

describe('#meta', () => {
    it('removes all non-standard metadata on a null value.', () => {
        let r = new PutRequest()
            .objects({}, {}, {})
            .to('somewhere');
        r.metadata.abc = 'whattttt';
        r.metadata.nonstandard = 123;
        r.meta(null);
        expect(r.metadata.to).toBe('somewhere');
        expect(r.metadata.abc).toBeUndefined();
        expect(r.metadata.nonstandard).toBeUndefined();
    });
    it('throws on standard metadata property name.', () => {
        let r = new PutRequest()
            .objects({}, {}, {})
            .to('somewhere');
        for (let p of ['pk', 'objects', 'to', 'count', 'model']) {
            let obj = {};
            obj[p] = 123;
            expect(() => r.meta(obj)).toThrow();
        }
    });
    it('add new metadata on a request.', () => {
        let r = new PutRequest()
            .objects({}, {}, {})
            .to('somewhere');
        r.meta({ abc: 'ok', extra: 123 });
        expect(r.metadata.to).toBe('somewhere');
        expect(r.metadata.abc).toBe('ok');
        expect(r.metadata.extra).toBe(123);
    });
});

describe('#toJSON', () => {
    class ThemeModel { }
    it('returns the metadata to utilize for JSON stringifying.', () => {
        let r = new PutRequest()
            .model(ThemeModel)
            .to('Goose')
            .headers({ hello: 'world' })
            .objects({ Bob: 'Sue', Hi: 12345 }, { Hi: true })
            .pk('ID');
        let parsed = JSON.parse(JSON.stringify(r));
        expect(parsed.model).toEqual(r.metadata.model.name);
        expect(parsed.to).toEqual(r.metadata.to);
        expect(parsed.count).toEqual(r.metadata.count);
        expect(parsed.objects).toEqual([{ Bob: 'Sue', Hi: 12345 }, { Hi: true }]);
        expect(parsed.pk).toEqual(['ID']);
        expect(parsed.headers).toEqual({ hello: 'world' });
        expect(parsed.method).toBe('put');
    });
});