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
    it('sets the metadata "to" property.', () => {
        class MyModel {
            static get $stashku() {
                return { resource: 'abc' };
            }
        }
        let r = new PutRequest().model(MyModel);
        expect(r.metadata.to).toBe('abc');
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