import OptionsRequest from './options-request.js';
import Filter from '../filter.js';
import jest from 'jest-mock';

describe('#constructor', () => {
    it('accepts no arguments', () => {
        expect(() => new OptionsRequest()).not.toThrow();
        expect(new OptionsRequest().metadata).toBeTruthy();
    });
});

describe('#method', () => {
    it('returns "options".', () => {
        expect(new OptionsRequest().method).toBe('options');
    });
});

describe('#model', () => {
    it('throws on a non-object, non-null model type.', () => {
        expect(() => new OptionsRequest().model()).toThrow(/modelType.+object/i);
        expect(() => new OptionsRequest().model(123)).toThrow(/modelType.+object/i);
        expect(() => new OptionsRequest().model(true)).toThrow(/modelType.+object/i);
        expect(() => new OptionsRequest().model('abc')).toThrow(/modelType.+object/i);
    });
    it('returns the request for chaining.', () => {
        let r = new OptionsRequest();
        expect(r.model(class MyModel { })).toBe(r);
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
        let r = new OptionsRequest().model(ContactPersonModel, false, true);
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

describe('#from', () => {
    it('throws on a non-string "name" argument.', () => {
        expect(() => new OptionsRequest().from(1312312)).toThrow(/name.+argument/);
        expect(() => new OptionsRequest().from(new Date())).toThrow(/name.+argument/);
        expect(() => new OptionsRequest().from({})).toThrow(/name.+argument/);
        expect(() => new OptionsRequest().from([1, 2])).toThrow(/name.+argument/);
        expect(() => new OptionsRequest().from(true)).toThrow(/name.+argument/);
    });
    it('sets the "from" metadata with the "name" argument value.', () => {
        let r = new OptionsRequest().from('test');
        expect(r.metadata.from).toBe('test');
        r.from('abc', '123');
        expect(r.metadata.from).toBe('abc');
    });
    it('clears the "from" metadata when a null is passed.', () => {
        let r = new OptionsRequest().from('test');
        r.from(null);
        expect(r.metadata.from).toBeNull();
    });
    it('returns the request instance in any valid call.', () => {
        let r = new OptionsRequest();
        expect(r.from('a')).toBe(r);
        expect(r.from(null)).toBe(r);
    });
});

describe('#all', () => {
    it('sets the "from" metadata to a value of "*".', () => {
        let r = new OptionsRequest().from('test');
        r.all();
        expect(r.metadata.from).toBe('*');
    });
});

describe('#clear', () => {
    it('resets metadata object properties to default.', () => {
        let r = new OptionsRequest()
            .from('somewhere');
        r.clear();
        expect(r.metadata.from).toBeNull();
        expect(r.metadata.headers).toBeNull();
    });
    it('recreates the metadata object if it is null', () => {
        let r = new OptionsRequest();
        r.metadata = null;
        r.clear();
        expect(r.metadata).toBeTruthy();
        expect(r.metadata).toBeInstanceOf(Object);
    });
    it('returns the request instance in any valid call.', () => {
        let r = new OptionsRequest();
        expect(r.clear()).toBe(r);
    });
});

describe('#headers', () => {
    it('throws when the dictionary argument is missing.', () => {
        expect(() => new OptionsRequest().headers()).toThrow(/dictionary.+argument/);
    });
    it('throws when the dictionary argument is not a Map, object, or null.', () => {
        expect(() => new OptionsRequest().headers(244)).toThrow(/dictionary.+argument/);
        expect(() => new OptionsRequest().headers(true)).toThrow(/dictionary.+argument/);
        expect(() => new OptionsRequest().headers(undefined)).toThrow(/dictionary.+argument/);
    });
    it('throws when the a non-string key is defined.', () => {
        let m = new Map();
        m.set('ok', true);
        m.set(123, true);
        expect(() => new OptionsRequest().headers(m)).toThrow(/key.+argument/);
    });
    it('skips null or undefined keys.', () => {
        let m = new Map();
        m.set(null, true);
        m.set('ok', true);
        expect(new OptionsRequest().headers(m).metadata.headers.size).toBe(1);
    });
    it('deletes the header if the value for the key is null or undefined.', () => {
        let r = new OptionsRequest();
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
        let r = new OptionsRequest();
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
        let r = new OptionsRequest();
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
        let r = new OptionsRequest();
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
        let r = new OptionsRequest();
        r.headers({ a: 1, b: 'hi', c: true });
        expect(r.headers(null).metadata.headers).toBeInstanceOf(Map);
        expect(r.metadata.headers.size).toBe(0);
    });
    it('returns the request instance in any valid call.', () => {
        let r = new OptionsRequest();
        expect(r.headers({})).toBe(r);
        expect(r.headers(new Map())).toBe(r);
        expect(r.headers(null)).toBe(r);
    });
});

describe('#toJSON', () => {
    it('returns the metadata to utilize for JSON stringifying.', () => {
        let r = new OptionsRequest()
            .from('Goose')
            .headers({ hello: 'world' });
        let parsed = JSON.parse(JSON.stringify(r));
        expect(parsed.from).toEqual(r.metadata.from);
        expect(parsed.headers).toEqual({ hello: 'world' });
    });
});