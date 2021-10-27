import StashKu, * as index from './stashku.js';
import GetRequest from './requests/get-request.js';
import PostRequest from './requests/post-request.js';
import PutRequest from './requests/put-request.js';
import PatchRequest from './requests/patch-request.js';
import DeleteRequest from './requests/delete-request.js';
import OptionsRequest from './requests/options-request.js';
import Response from './response.js';
import jest from 'jest-mock';
import fs from 'fs/promises';

const samples = {
    products: null,
    themes: null
};

beforeAll(async () => {
    samples.products = JSON.parse(await fs.readFile('./test/memory-storage-engine/data-products.json', 'utf8'));
    samples.themes = JSON.parse(await fs.readFile('./test/memory-storage-engine/data-themes.json', 'utf8'));
});

class Theme {
    static get ID() { return 'ID'; }
    static get Name() { return 'Name'; }
    static get HexCode() { return 'HexCode'; }
}

describe('~exports', () => {
    it('exports the GetRequest class', () => {
        expect(index.GetRequest).not.toBeUndefined();
        expect(index.GetRequest.name).toBe('GetRequest');
    });
    it('exports the PostRequest class', () => {
        expect(index.PostRequest).not.toBeUndefined();
        expect(index.PostRequest.name).toBe('PostRequest');
    });
    it('exports the PutRequest class', () => {
        expect(index.PutRequest).not.toBeUndefined();
        expect(index.PutRequest.name).toBe('PutRequest');
    });
    it('exports the PatchRequest class', () => {
        expect(index.PatchRequest).not.toBeUndefined();
        expect(index.PatchRequest.name).toBe('PatchRequest');
    });
    it('exports the DeleteRequest class', () => {
        expect(index.DeleteRequest).not.toBeUndefined();
        expect(index.DeleteRequest.name).toBe('DeleteRequest');
    });
    it('exports the BaseStorageEngine class', () => {
        expect(index.BaseStorageEngine).not.toBeUndefined();
        expect(index.BaseStorageEngine.name).toBe('BaseStorageEngine');
    });
    it('exports the Response class', () => {
        expect(index.Response).not.toBeUndefined();
        expect(index.Response.name).toBe('Response');
    });
    it('exports the RESTError class', () => {
        expect(index.RESTError).not.toBeUndefined();
        expect(index.RESTError.name).toBe('RESTError');
    });
    it('exports the Filter class', () => {
        expect(index.Filter).not.toBeUndefined();
        expect(index.Filter.name).toBe('Filter');
    });
    it('exports the Sort class', () => {
        expect(index.Sort).not.toBeUndefined();
        expect(index.Sort.name).toBe('Sort');
    });
});

describe('#constructor', () => {
    it('loads the "memory" storage engine by default.', async () => {
        let stash = new StashKu();
        await stash.engine;
        expect(stash.engine.name).toBe('memory');
    });
});

describe('#use', () => {
    it('adds a function to the middleware array.', async () => {
        let stash = new StashKu();
        let cb = () => { };
        stash.use(cb);
        expect(stash.middleware.length).toBe(1);
        expect(stash.middleware[0].methods).toBeUndefined();
        expect(stash.middleware[0].callback).toBe(cb);
    });
    describe('adds a middleware object...', () => {
        let cb = jest.fn();
        it('converts a single string "states" property value to an array.', () => {
            for (let s of ['log', 'request', 'response', 'done']) {
                let stash = new StashKu();
                stash.use({
                    states: s,
                    callback: cb
                });
                expect(stash.middleware.length).toBe(1);
                expect(stash.middleware[0].states).toEqual([s]);
                expect(stash.middleware[0].methods).toBeUndefined();
                expect(stash.middleware[0].callback).toBe(cb);
            }
        });
        it('throws when the "states" property value is defined as a non-array/non-string.', () => {
            let stash = new StashKu();
            let invalidValues = [123, true, new Date()];
            expect.assertions(2 * invalidValues.length);
            for (let v of invalidValues) {
                try {
                    stash.use({
                        states: v,
                        callback: cb
                    });
                } catch (err) {
                    expect(err.toString()).toMatch(/invalid.+states.+string.+array/i);
                    expect(err.code).toBe(500);
                }
            }
        });
        it('throws when any one of the "states" property values is defined as a non-string.', () => {
            let stash = new StashKu();
            let invalidValues = [123, true, new Date()];
            expect.assertions(2 * invalidValues.length);
            for (let v of invalidValues) {
                try {
                    stash.use({
                        states: ['log', 'done', v, 'request'],
                        callback: cb
                    });
                } catch (err) {
                    expect(err.toString()).toMatch(/invalid.+states.+all.+strings/i);
                    expect(err.code).toBe(500);
                }
            }
        });
        it('throws when any one of the "states" property values is an unsupported string value.', () => {
            let stash = new StashKu();
            expect.assertions(2);
            try {
                stash.use({
                    states: ['log', 'done', 'monkey', 'request'],
                    callback: cb
                });
            } catch (err) {
                expect(err.toString()).toMatch(/invalid.+states.+allowed/i);
                expect(err.code).toBe(500);
            }
        });
        it('converts a single string "methods" property value to an array.', () => {
            for (let m of ['all', '*', 'get', 'post', 'put', 'patch', 'delete']) {
                let stash = new StashKu();
                stash.use({
                    methods: m,
                    callback: cb
                });
                expect(stash.middleware.length).toBe(1);
                expect(stash.middleware[0].states).toBeUndefined();
                expect(stash.middleware[0].methods).toEqual([m]);
                expect(stash.middleware[0].callback).toBe(cb);
            }
        });

        it('throws when the "methods" property value is defined as a non-array/non-string.', () => {
            let stash = new StashKu();
            let invalidValues = [123, true, new Date()];
            expect.assertions(2 * invalidValues.length);
            for (let v of invalidValues) {
                try {
                    stash.use({
                        methods: v,
                        callback: cb
                    });
                } catch (err) {
                    expect(err.toString()).toMatch(/invalid.+methods.+string.+array/i);
                    expect(err.code).toBe(500);
                }
            }
        });
        it('throws when any one of the "methods" property values is defined as a non-string.', () => {
            let stash = new StashKu();
            let invalidValues = [123, true, new Date()];
            expect.assertions(2 * invalidValues.length);
            for (let v of invalidValues) {
                try {
                    stash.use({
                        methods: ['*', 'patch', v, 'delete'],
                        callback: cb
                    });
                } catch (err) {
                    expect(err.toString()).toMatch(/invalid.+methods.+all.+strings/i);
                    expect(err.code).toBe(500);
                }
            }
        });
        it('throws when any one of the "methods" property values is an unsupported string value.', () => {
            let stash = new StashKu();
            expect.assertions(2);
            try {
                stash.use({
                    methods: ['get', 'monkey', 'post'],
                    callback: cb
                });
            } catch (err) {
                expect(err.toString()).toMatch(/invalid.+methods.+allowed/i);
                expect(err.code).toBe(500);
            }
        });
    });
});

describe('#configure', () => {
    it('passes engine configuration on to the loaded engine.', async () => {
        let stash = new StashKu({
            memory: {
                test: 123,
                nested: {
                    hello: 'world'
                }
            }
        });
        await stash.engine;
        expect(stash.engine.config.test).toBe(123);
        expect(stash.engine.config.nested.hello).toBe('world');
    });
});

describe('#middlerun', () => {
    it('fires a request middleware callback.', async () => {
        let stash = new StashKu();
        let flag = false;
        let cb = () => { flag = true; };
        stash.use(cb);
        await stash.middlerun('request', new GetRequest(), new Response());
        expect(flag).toBeTruthy();
    });
});

describe('#model', () => {
    class TestModel {
        constructor() {
            this.firstName = 'John';
            this.lastName = 'Gibbers';
            this.age = 23;
        }
        static get firstName() { return 'firstName'; }
        static get lastName() { return 'lastName'; }
        static get age() { return 'age'; }
    }
    it('throws when the "modelType" argument is falsey or missing.', async () => {
        let stash = new StashKu();
        expect(() => stash.model()).toThrow(/modelType.+required/);
        expect(() => stash.model(null)).toThrow(/modelType.+required/);
        expect(() => stash.model(undefined)).toThrow(/modelType.+required/);
    });
    it('throws when the "modelType" argument is not a class or constructor function.', async () => {
        let stash = new StashKu();
        expect(() => stash.model(new TestModel())).toThrow(/modelType.+constructor/);
        expect(() => stash.model('hello')).toThrow(/modelType.+constructor/);
        expect(() => stash.model(true)).toThrow(/modelType.+constructor/);
        expect(() => stash.model(123)).toThrow(/modelType.+constructor/);
    });
    it('returns a StashKu proxy instance.', async () => {
        let stash = new StashKu();
        let proxy = stash.model(TestModel);
        expect(proxy).toBeTruthy();
        expect(proxy.config.proxy).toEqual({ parent: stash, model: TestModel });
    });
});

describe('#get', () => {
    it('throws when an invalid engine is specified.', async () => {
        let stash = new StashKu({
            engine: 'blargh'
        });
        await expect(stash.get(new GetRequest().from('test'))).rejects.toThrow(/cannot find module/i);
    });
    it('returns data as model type instances when a model is defined on the request.', async () => {
        let stash = new StashKu();
        for (let p in samples) {
            stash.engine.data.set(p, samples[p]);
        }
        let res = await stash.model(Theme).get();
        for (let m of res.data) {
            expect(m).toBeInstanceOf(Theme);
        }
    });
});

describe('#post', () => {
    it('throws when an invalid engine is specified.', async () => {
        let stash = new StashKu({
            engine: 'blargh'
        });
        await expect(stash.post(new PostRequest().to('test'))).rejects.toThrow(/cannot find module/i);
    });
    it('returns data as model type instances when a model is defined on the request.', async () => {
        let stash = new StashKu();
        for (let p in samples) {
            stash.engine.data.set(p, samples[p]);
        }
        let res = await stash.model(Theme).post((r, m) => r
            .objects(
                { ID: 155, Name: 'Cobbler' },
                { ID: 156, Name: 'Cobbler' },
                { ID: 157, Name: 'Cobbler' }
            )
        );
        expect(res.total).toBe(3);
        for (let m of res.data) {
            expect(m.Name).toBe('Cobbler');
            expect(m).toBeInstanceOf(Theme);
        }
    });
});

describe('#put', () => {
    it('throws when an invalid engine is specified.', async () => {
        let stash = new StashKu({
            engine: 'blargh'
        });
        await expect(stash.put(new PutRequest().to('test'))).rejects.toThrow(/cannot find module/i);
    });
    it('returns data as model type instances when a model is defined on the request.', async () => {
        let stash = new StashKu();
        for (let p in samples) {
            stash.engine.data.set(p, samples[p]);
        }
        let res = await stash.model(Theme).put((r, m) => r
            .pk(m.ID)
            .objects({
                ID: 5,
                Name: 'Banana Toast'
            })
        );
        expect(res.total).toBe(1);
        for (let m of res.data) {
            expect(m.Name).toBe('Banana Toast');
            expect(m).toBeInstanceOf(Theme);
        }
    });
});

describe('#patch', () => {
    it('throws when an invalid engine is specified.', async () => {
        let stash = new StashKu({
            engine: 'blargh'
        });
        await expect(stash.patch(new PatchRequest().to('test'))).rejects.toThrow(/cannot find module/i);
    });
    it('returns data as model type instances when a model is defined on the request.', async () => {
        let stash = new StashKu();
        for (let p in samples) {
            stash.engine.data.set(p, samples[p]);
        }
        let res = await stash.model(Theme).patch((r, m) => r
            .template({
                Name: 'Hello Neptune'
            })
            .where(f => f.and(m.ID, f.OP.EQUALS, 6))
        );
        expect(res.total).toBe(1);
        for (let m of res.data) {
            expect(m.Name).toBe('Hello Neptune');
            expect(m).toBeInstanceOf(Theme);
        }
    });
});

describe('#delete', () => {
    it('throws when an invalid engine is specified.', async () => {
        let stash = new StashKu({
            engine: 'blargh'
        });
        await expect(stash.delete(new DeleteRequest().from('test'))).rejects.toThrow(/cannot find module/i);
    });
    it('returns data as model type instances when a model is defined on the request.', async () => {
        let stash = new StashKu();
        for (let p in samples) {
            stash.engine.data.set(p, samples[p]);
        }
        let res = await stash.model(Theme).delete((r, m) => r
            .where(f => f.and(m.ID, f.OP.LESSTHAN, 5))
        );
        expect(res.total).toBe(4);
        for (let m of res.data) {
            expect(m).toBeInstanceOf(Theme);
        }
    });
});

describe('#options', () => {
    it('throws when an invalid engine is specified.', async () => {
        let stash = new StashKu({
            engine: 'blargh'
        });
        await expect(stash.options(new OptionsRequest().from('test'))).rejects.toThrow(/cannot find module/i);
    });
    it('returns data as model type instances when a model is defined on the request.', async () => {
        let stash = new StashKu();
        for (let p in samples) {
            stash.engine.data.set(p, samples[p]);
        }
        let res = await stash.model(Theme).options((r, m) => r.from('Themes'));
        expect(res.total).toBe(1);
        for (let m of res.data) {
            expect(m).toBeInstanceOf(Theme);
        }
    });
});