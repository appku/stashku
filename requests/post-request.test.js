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
    it('sets the metadata "model" property.', () => {
        class MyModel { }
        let r = new PostRequest().model(MyModel);
        expect(r.metadata.model).toBe(MyModel);
    });
    it('sets the metadata "to" property.', () => {
        class MyModel {
            static get $stashku() {
                return { resource: 'abc' };
            }
        }
        let r = new PostRequest().model(MyModel);
        expect(r.metadata.to).toBe('abc');
    });
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

describe('#meta', () => {
    it('removes all non-standard metadata on a null value.', () => {
        let r = new PostRequest()
            .to('somewhere');
        r.metadata.abc = 'whattttt';
        r.metadata.nonstandard = 123;
        r.meta(null);
        expect(r.metadata.to).toBe('somewhere');
        expect(r.metadata.abc).toBeUndefined();
        expect(r.metadata.nonstandard).toBeUndefined();
    });
    it('throws on standard metadata property name.', () => {
        let r = new PostRequest()
            .to('somewhere');
        for (let p of ['objects', 'to']) {
            let obj = {};
            obj[p] = 123;
            expect(() => r.meta(obj)).toThrow();
        }
    });
    it('add new metadata on a request.', () => {
        let r = new PostRequest()
            .to('somewhere');
        r.meta({ abc: 'ok', extra: 123 });
        expect(r.metadata.to).toBe('somewhere');
        expect(r.metadata.abc).toBe('ok');
        expect(r.metadata.extra).toBe(123);
    });
});