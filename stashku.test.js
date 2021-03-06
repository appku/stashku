import StashKu, * as index from './stashku.js';
import DeleteRequest from './requests/delete-request.js';
import GetRequest from './requests/get-request.js';
import OptionsRequest from './requests/options-request.js';
import PatchRequest from './requests/patch-request.js';
import PostRequest from './requests/post-request.js';
import PutRequest from './requests/put-request.js';
import Response from './response.js';
import RESTError from './rest-error.js';
import Filter from './filter.js';
import Sort from './sort.js';
import Logger from './logger.js';
import jest from 'jest-mock';
import fs from 'fs/promises';
import ThemeModel from './test/models/theme-model.js';

const samples = {
    products: null,
    themes: null
};

beforeAll(async () => {
    samples.products = JSON.parse(await fs.readFile('./test/memory-engine/data-products.json', 'utf8'));
    samples.themes = JSON.parse(await fs.readFile('./test/memory-engine/data-themes.json', 'utf8'));
});

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
    it('exports the BaseEngine class', () => {
        expect(index.BaseEngine).not.toBeUndefined();
        expect(index.BaseEngine.name).toBe('BaseEngine');
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
    afterEach(() => {
        //reset env
        delete process.env.STASHKU_ENGINE;
        delete process.env.STASHKU_MODEL_HEADER;
    });
    it('loads expected defaults.', async () => {
        let stash = new StashKu();
        await stash.engine;
        expect(stash.engine.name).toBe('memory');
        expect(Array.isArray(stash.config.resources)).toBe(true);
        expect(stash.config.resources.length).toBe(0);
        expect(Array.isArray(stash.config.middleware)).toBe(true);
        expect(stash.config.middleware.length).toBe(0);
        expect(stash.config.model).toEqual({ header: false });
    });
    it('sets the model configuration from the environment.', async () => {
        process.env.STASHKU_MODEL_HEADER = true;
        let stash = new StashKu();
        expect(stash.config.model).toEqual({ header: true });
    });
    it('loads a different built-in engine by value from the environment.', async () => {
        process.env.STASHKU_ENGINE = 'fetch';
        let stash = new StashKu();
        await stash.engine;
        expect(stash.engine.name).toBe('fetch');
    });
    it('passes engine configuration on to the loaded engine.', async () => {
        let stash = new StashKu({
            memory: {
                test: 123,
                nested: {
                    hello: 'world'
                }
            }
        });
        await stash.configure();
        expect(stash.engine.config.test).toBe(123);
        expect(stash.engine.config.nested.hello).toBe('world');
    });
    it('throws when an invalid engine is specified, and called with an await.', async () => {
        let stash = new StashKu({
            engine: 'blargh'
        });
        await expect(stash.configure()).rejects.toThrow(/cannot find module/i);
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
        let res = await stash.model(ThemeModel).get();
        for (let m of res.data) {
            expect(typeof m.HexCode).toBe('string');
            expect(typeof m.ID).toBe('number');
            expect(typeof m.Name).toBe('string');
            expect(m).toBeInstanceOf(ThemeModel);
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
        let res = await stash.model(ThemeModel).post((r, m) => r
            .objects(
                { Name: 'Cobbler' },
                { Name: 'Cobbler' },
                { Name: 'Cobbler' }
            )
        );
        expect(res.total).toBe(3);
        for (let m of res.data) {
            expect(typeof m.ID).toBe('number');
            expect(m.ID).toBeGreaterThan(150);
            expect(m.Name).toBe('Cobbler');
            expect(m.HexCode).toBe('#000000');
            expect(m).toBeInstanceOf(ThemeModel);
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
        let res = await stash.model(ThemeModel).put((r, m) => r
            .pk(m.ID)
            .objects({
                ID: 5,
                Name: 'Banana Toast'
            })
        );
        expect(res.total).toBe(1);
        for (let rm of res.data) {
            expect(rm.ID).toBe(5);
            expect(rm.Name).toBe('Banana Toast');
            expect(rm).toBeInstanceOf(ThemeModel);
        }
    });
    it('updates a specific record using a model.', async () => {
        let stash = new StashKu();
        for (let p in samples) {
            stash.engine.data.set(p, samples[p]);
        }
        let m = new ThemeModel();
        m.ID = 6;
        m.Name = 'Soda Pop';
        let res = await stash.model(ThemeModel).put(r => r.objects(m));
        expect(res.total).toBe(1);
        for (let rm of res.data) {
            expect(rm.ID).toBe(6);
            expect(rm.Name).toBe('Soda Pop');
            expect(rm).toBeInstanceOf(ThemeModel);
            expect(rm).not.toBe(m);
        }
        for (let v of stash.engine.data.get('themes')) {
            if (v.ID === 6) {
                expect(v.Name).toBe('Soda Pop');
            } else {
                expect(v.Name).not.toBe('Soda Pop');
            }
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
        let res = await stash.model(ThemeModel).patch((r, m) => r
            .template({
                Name: 'Hello Neptune'
            })
            .where(f => f.and(m.ID, f.OP.EQUALS, 6))
        );
        expect(res.total).toBe(1);
        for (let m of res.data) {
            expect(m.Name).toBe('Hello Neptune');
            expect(m).toBeInstanceOf(ThemeModel);
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
        let res = await stash.model(ThemeModel).delete((r, m) => r
            .where(f => f.and(m.ID, f.OP.LESSTHAN, 5))
        );
        expect(res.total).toBe(4);
        for (let m of res.data) {
            expect(m).toBeInstanceOf(ThemeModel);
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
        let res = await stash.model(ThemeModel).options((r, m) => r.from('Themes'));
        expect(res.total).toBe(1);
        for (let m of res.data) {
            expect(m).toBeInstanceOf(ThemeModel);
        }
    });
});

describe('.requestFromFile', () => {
    let testFilter = Filter
        .or('lastName', Filter.OP.EQUALS, 'Thing')
        .or('lastName', Filter.OP.EQUALS, 'Other')
        .and('firstName', Filter.OP.EQUALS, 'Bob')
        .and('age', Filter.OP.GREATERTHAN, 23);
    it('loads an DELETE request from file.', async () => {
        let r = await StashKu.requestFromFile('./test/requests/delete.json');
        expect(r).toBeInstanceOf(DeleteRequest);
        expect(r.metadata.from).toBe('test');
        expect(r.metadata.all).toBe(true);
        expect(r.metadata.count).toBe(true);
        expect(r.metadata.where).toBeInstanceOf(Filter);
        expect(r.metadata.where.tree).toEqual(testFilter.tree);
        expect(r.metadata.headers.get('hello')).toBe('world');
        expect(r.metadata.headers.get('good')).toBe(true);
        expect(r.metadata.headers.get('evil')).toBe(false);
    });
    it('loads a GET request from file.', async () => {
        let r = await StashKu.requestFromFile('./test/requests/get.json');
        expect(r).toBeInstanceOf(GetRequest);
        expect(r.metadata.from).toBe('test');
        expect(r.metadata.properties).toEqual(['firstName', 'lastName']);
        expect(r.metadata.distinct).toBe(true);
        expect(r.metadata.count).toBe(true);
        expect(r.metadata.take).toBe(1);
        expect(r.metadata.skip).toBe(2);
        expect(r.metadata.sorts.length).toBe(2);
        expect(r.metadata.sorts[0]).toBeInstanceOf(Sort);
        expect(r.metadata.sorts[0].property).toBe('firstName');
        expect(r.metadata.sorts[0].dir).toBe('desc');
        expect(r.metadata.sorts[1]).toBeInstanceOf(Sort);
        expect(r.metadata.sorts[1].property).toBe('lastName');
        expect(r.metadata.sorts[1].dir).toBe('asc');
        expect(r.metadata.where).toBeInstanceOf(Filter);
        expect(r.metadata.where.tree).toEqual(testFilter.tree);
        expect(r.metadata.headers.get('hello')).toBe('world');
        expect(r.metadata.headers.get('good')).toBe(true);
        expect(r.metadata.headers.get('evil')).toBe(false);
    });
    it('loads an OPTIONS request from file.', async () => {
        let r = await StashKu.requestFromFile('./test/requests/options.json');
        expect(r).toBeInstanceOf(OptionsRequest);
        expect(r.metadata.from).toBe('test');
        expect(r.metadata.headers.get('hello')).toBe('world');
        expect(r.metadata.headers.get('good')).toBe(true);
        expect(r.metadata.headers.get('evil')).toBe(false);
    });
    it('loads an PATCH request from file.', async () => {
        let r = await StashKu.requestFromFile('./test/requests/patch.json');
        expect(r).toBeInstanceOf(PatchRequest);
        expect(r.metadata.to).toBe('test');
        expect(r.metadata.template).toEqual({
            firstName: 'Bob',
            age: 22
        });
        expect(r.metadata.all).toBe(true);
        expect(r.metadata.count).toBe(true);
        expect(r.metadata.where).toBeInstanceOf(Filter);
        expect(r.metadata.where.tree).toEqual(testFilter.tree);
        expect(r.metadata.headers.get('hello')).toBe('world');
        expect(r.metadata.headers.get('good')).toBe(true);
        expect(r.metadata.headers.get('evil')).toBe(false);
    });
    it('loads an POST request from file.', async () => {
        let r = await StashKu.requestFromFile('./test/requests/post.json');
        expect(r).toBeInstanceOf(PostRequest);
        expect(r.metadata.to).toBe('test');
        expect(r.metadata.objects).toEqual([
            {
                firstName: 'Bob',
                lastName: 'Goose',
                age: 33
            },
            {
                firstName: 'Susan',
                lastName: 'Moose',
                age: 17
            }
        ]);
        expect(r.metadata.count).toBe(true);
        expect(r.metadata.headers.get('hello')).toBe('world');
        expect(r.metadata.headers.get('good')).toBe(true);
        expect(r.metadata.headers.get('evil')).toBe(false);
    });
    it('loads an PUT request from file.', async () => {
        let r = await StashKu.requestFromFile('./test/requests/put.json');
        expect(r).toBeInstanceOf(PutRequest);
        expect(r.metadata.to).toBe('test');
        expect(r.metadata.pk).toEqual(['ID']);
        expect(r.metadata.objects).toEqual([
            {
                ID: 1,
                firstName: 'Bob',
                lastName: 'Goose',
                age: 33
            },
            {
                ID: 44,
                firstName: 'Susan',
                lastName: 'Moose',
                age: 17
            }
        ]);
        expect(r.metadata.count).toBe(true);
        expect(r.metadata.headers.get('hello')).toBe('world');
        expect(r.metadata.headers.get('good')).toBe(true);
        expect(r.metadata.headers.get('evil')).toBe(false);
    });
});