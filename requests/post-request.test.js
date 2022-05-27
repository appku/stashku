import PostRequest from './post-request.js';
import jest from 'jest-mock';

describe('#constructor', () => {
    it('accepts no arguments', () => {
        expect(() => new PostRequest()).not.toThrow();
        expect(new PostRequest().metadata).toBeTruthy();
    });
    it('sets the objects when "objects" arguments is provided.', () => {
        expect(new PostRequest({}, {}).metadata.objects.length).toBe(2);
    });
});

describe('#method', () => {
    it('returns "post".', () => {
        expect(new PostRequest().method).toBe('post');
    });
});

describe('#model', () => {
    it('throws on a non-object, non-null model type.', () => {
        expect(() => new PostRequest().model()).toThrow(/modelType.+object/i);
        expect(() => new PostRequest().model(123)).toThrow(/modelType.+object/i);
        expect(() => new PostRequest().model(true)).toThrow(/modelType.+object/i);
        expect(() => new PostRequest().model('abc')).toThrow(/modelType.+object/i);
    });
    it('returns the request for chaining.', () => {
        let r = new PostRequest();
        expect(r.model(class MyModel { })).toBe(r);
    });
    let resourceProps = [undefined, 'resource', 'name', 'slug', 'plural.name', 'plural.slug'];
    for (let prop of resourceProps) {
        it(`sets the metadata "from" property using the model resource property "${prop}".`, () => {
            class MyModel {
                static get $stashku() {
                    return {
                        resource: 'resource-abc',
                        name: 'name-abc',
                        slug: 'slug-abc',
                        plural: {
                            name: 'plural.name-abc',
                            slug: 'plural.slug-abc',
                        }
                    };
                }
            }
            let r = new PostRequest().model(MyModel, false, prop);
            expect(r.metadata.to).toBe((prop ?? 'resource') + '-abc');
            r = new PostRequest().model(class TestModel { });
            expect(r.metadata.to).toBe('TestModels');
            r = new PostRequest().to('someresource').model(MyModel);
            expect(r.metadata.to).toBe('someresource');
        });
    }
});

describe('#count', () => {
    it('is disabled by default.', () => {
        let g = new PostRequest();
        expect(g.metadata.count).toBe(false);
    });
    it('enables on an undefined argument.', () => {
        let g = new PostRequest();
        expect(g.count().metadata.count).toBe(true);
    });
    it('enables the flag on a truthy value.', () => {
        expect(new PostRequest().count(1).metadata.count).toBe(true);
        expect(new PostRequest().count(true).metadata.count).toBe(true);
        expect(new PostRequest().count({}).metadata.count).toBe(true);
        expect(new PostRequest().count('abc').metadata.count).toBe(true);
    });
    it('disables the flag on a falsey value.', () => {
        expect(new PostRequest().count(0).metadata.count).toBe(false);
        expect(new PostRequest().count(false).metadata.count).toBe(false);
        expect(new PostRequest().count(null).metadata.count).toBe(false);
        expect(new PostRequest().count('').metadata.count).toBe(false);
    });
});

describe('#objects', () => {
    it('throws when a "objects" argument is a non-object.', () => {
        expect(() => new PostRequest().objects(1312312)).toThrow(/objects.+argument/);
        expect(() => new PostRequest().objects([1, 2])).toThrow(/objects.+argument/);
        expect(() => new PostRequest().objects(true)).toThrow(/objects.+argument/);
        expect(() => new PostRequest().objects(() => { })).toThrow(/objects.+argument/);
        expect(() => new PostRequest().objects({}, 1312312, {})).toThrow(/objects.+argument/);
        expect(() => new PostRequest().objects({}, [1, 2], {})).toThrow(/objects.+argument/);
        expect(() => new PostRequest().objects({}, true, {})).toThrow(/objects.+argument/);
        expect(() => new PostRequest().objects({}, () => { }, {})).toThrow(/objects.+argument/);
    });
    it('skips over null and undefined "objects" argument values.', () => {
        let r = new PostRequest().objects({ a: 0 }, { b: 1 }, null, { c: 2 }, undefined);
        let expected = ['a', 'b', 'c'];
        for (let i = 0; i < expected.length; i++) {
            expect(r.metadata.objects[i][expected[i]]).toBe(i);
        }
    });
    it('recreates the "objects" metadata as an array if not already an array.', () => {
        let r = new PostRequest();
        r.metadata.objects = null;
        r.objects({}, {});
        expect(Array.isArray(r.metadata.objects)).toBe(true);
    });
    it('adds objects from mixed arguments of objects and arrays.', () => {
        let r = new PostRequest();
        r.objects({}, [{}, {}], [[[{}, {}], {}]], {});
        expect(Array.isArray(r.metadata.objects)).toBe(true);
        expect(r.metadata.objects.length).toBe(7);
    });
    it('clears the "objects" metadata when a null is passed.', () => {
        let r = new PostRequest().objects({}, {});
        r.objects(null);
        expect(Array.isArray(r.metadata.objects)).toBe(true);
        expect(r.metadata.objects.length).toBe(0);
    });
    it('returns the request instance in any valid call.', () => {
        let r = new PostRequest();
        expect(r.objects({}, {})).toBe(r);
        expect(r.objects(null)).toBe(r);
    });
});

describe('#to', () => {
    it('throws on a non-string "name" argument.', () => {
        expect(() => new PostRequest().to(1312312)).toThrow(/name.+argument/);
        expect(() => new PostRequest().to(new Date())).toThrow(/name.+argument/);
        expect(() => new PostRequest().to({})).toThrow(/name.+argument/);
        expect(() => new PostRequest().to([1, 2])).toThrow(/name.+argument/);
        expect(() => new PostRequest().to(true)).toThrow(/name.+argument/);
    });
    it('sets the "to" metadata with the "name" argument value.', () => {
        let r = new PostRequest().to('test');
        expect(r.metadata.to).toBe('test');
        r.to('abc', '123');
        expect(r.metadata.to).toBe('abc');
    });
    it('clears the "to" metadata when a null is passed.', () => {
        let r = new PostRequest().to('test');
        r.to(null);
        expect(r.metadata.to).toBeNull();
    });
    it('returns the request instance in any valid call.', () => {
        let r = new PostRequest();
        expect(r.to('a')).toBe(r);
        expect(r.to(null)).toBe(r);
    });
});

describe('#clear', () => {
    it('resets metadata object properties to default.', () => {
        let r = new PostRequest()
            .objects({}, {}, {})
            .to('somewhere', 's');
        r.clear();
        expect(Array.isArray(r.metadata.objects)).toBe(true);
        expect(r.metadata.objects.length).toBe(0);
        expect(r.metadata.to).toBeNull();
        expect(r.metadata.headers).toBeNull();
    });
    it('recreates the metadata object if it is null', () => {
        let r = new PostRequest();
        r.metadata = null;
        r.clear();
        expect(r.metadata).toBeTruthy();
        expect(r.metadata).toBeInstanceOf(Object);
    });
    it('returns the request instance in any valid call.', () => {
        let r = new PostRequest();
        expect(r.clear()).toBe(r);
    });
});

describe('#headers', () => {
    it('throws when the dictionary argument is missing.', () => {
        expect(() => new PostRequest().headers()).toThrow(/dictionary.+argument/);
    });
    it('throws when the dictionary argument is not a Map, object, or null.', () => {
        expect(() => new PostRequest().headers(244)).toThrow(/dictionary.+argument/);
        expect(() => new PostRequest().headers(true)).toThrow(/dictionary.+argument/);
        expect(() => new PostRequest().headers(undefined)).toThrow(/dictionary.+argument/);
    });
    it('throws when the a non-string key is defined.', () => {
        let m = new Map();
        m.set('ok', true);
        m.set(123, true);
        expect(() => new PostRequest().headers(m)).toThrow(/key.+argument/);
    });
    it('skips null or undefined keys.', () => {
        let m = new Map();
        m.set(null, true);
        m.set('ok', true);
        expect(new PostRequest().headers(m).metadata.headers.size).toBe(1);
    });
    it('deletes the header if the value for the key is null or undefined.', () => {
        let r = new PostRequest();
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
        let r = new PostRequest();
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
        let r = new PostRequest();
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
        let r = new PostRequest();
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
        let r = new PostRequest();
        r.headers({ a: 1, b: 'hi', c: true });
        expect(r.headers(null).metadata.headers).toBeInstanceOf(Map);
        expect(r.metadata.headers.size).toBe(0);
    });
    it('returns the request instance in any valid call.', () => {
        let r = new PostRequest();
        expect(r.headers({})).toBe(r);
        expect(r.headers(new Map())).toBe(r);
        expect(r.headers(null)).toBe(r);
    });
});

describe('#toJSON', () => {
    it('returns the metadata to utilize for JSON stringifying.', () => {
        let r = new PostRequest()
            .to('Goose')
            .headers({ hello: 'world' })
            .objects({ Bob: 'Sue', Hi: 12345 }, { Hi: true });
        let parsed = JSON.parse(JSON.stringify(r));
        expect(parsed.to).toEqual(r.metadata.to);
        expect(parsed.count).toBeUndefined();
        expect(parsed.objects).toEqual([{ Bob: 'Sue', Hi: 12345 }, { Hi: true }]);
        expect(parsed.headers).toEqual({ hello: 'world' });
    });
});