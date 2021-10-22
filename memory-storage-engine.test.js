import MemoryStorageEngine from './memory-storage-engine.js';
import Files from './utilities/files.js';
import GetRequest from './requests/get-request.js';
import PostRequest from './requests/post-request.js';
import PutRequest from './requests/put-request.js';
import PatchRequest from './requests/patch-request.js';
import DeleteRequest from './requests/delete-request.js';
import Response from './response.js';
import Sort from './sort.js';
import Filter from './filter.js';

const samples = {
    products: Files.including('./test/memory-storage-engine/data-products.json').parse().readSync()[0].data,
    themes: Files.including('./test/memory-storage-engine/data-themes.json').parse().readSync()[0].data
};

describe('#constructor', () => {
    it('sets the engine name to "memory".', () => {
        expect(new MemoryStorageEngine().name).toBe('memory');
    });
});

describe('#configure', () => {
    it('sets a default limit property value of 0.', () => {
        let engine = new MemoryStorageEngine();
        engine.configure();
        expect(engine.config.limit).toBe(0);
    });
    it('sets a default caseSensitive property value to null.', () => {
        let engine = new MemoryStorageEngine();
        engine.configure();
        expect(engine.config.caseSensitive).toBeNull();
    });
    it('sets the limit property from an object.', () => {
        let engine = new MemoryStorageEngine();
        engine.configure({ limit: 100 });
        expect(engine.config.limit).toBe(100);
    });
    it('sets the limit property from a the environmental variable.', () => {
        let engine = new MemoryStorageEngine();
        process.env.STASHKU_MEMORY_LIMIT = 100;
        engine.configure();
        expect(engine.config.limit).toBe(100);
        delete process.env.STASHKU_MEMORY_LIMIT;
    });
    it('sets the caseSensitive property from a the environmental variable.', () => {
        let engine = new MemoryStorageEngine();
        process.env.STASHKU_MEMORY_CASESENSITIVE = true;
        engine.configure();
        expect(engine.config.caseSensitive).toBe(true);
        delete process.env.STASHKU_MEMORY_CASESENSITIVE;
    });
});

describe('#resources', () => {
    it('returns an empty array when no resources present.', async () => {
        let engine = new MemoryStorageEngine();
        await expect(engine.resources()).resolves.toEqual([]);
    });
    it('returns an array of available resources in case-sensitive state.', async () => {
        let engine = new MemoryStorageEngine();
        engine.configure({ caseSensitive: true });
        await engine.post(new PostRequest().to('A').objects({ a: 1 }));
        await engine.post(new PostRequest().to('B').objects({ b: 2 }));
        await engine.post(new PostRequest().to('C').objects({ c: 3 }));
        await expect(engine.resources()).resolves.toEqual(['A', 'B', 'C']);
    });
    it('returns an array of available resources in case-insensitive state (default).', async () => {
        let engine = new MemoryStorageEngine();
        await engine.post(new PostRequest().to('A').objects({ a: 1 }));
        await engine.post(new PostRequest().to('B').objects({ b: 2 }));
        await engine.post(new PostRequest().to('C').objects({ c: 3 }));
        await expect(engine.resources()).resolves.toEqual(['a', 'b', 'c']);
    });
});

describe('#resourceOf', () => {
    it('returns all resource names lower-case by default with no headers or configuration.', async () => {
        let engine = new MemoryStorageEngine();
        expect(engine.resourceOf(new DeleteRequest().from('Test'))).toBe('test');
        expect(engine.resourceOf(new GetRequest().from('Test'))).toBe('test');
        expect(engine.resourceOf(new PostRequest().to('Test'))).toBe('test');
        expect(engine.resourceOf(new PutRequest().to('Test'))).toBe('test');
        expect(engine.resourceOf(new PatchRequest().to('Test'))).toBe('test');
    });
    it('returns all resource names regular-case when the case-sensitive is enabled in configuration.', async () => {
        let engine = new MemoryStorageEngine();
        engine.configure({ caseSensitive: true });
        expect(engine.resourceOf(new DeleteRequest().from('Test'))).toBe('Test');
        expect(engine.resourceOf(new GetRequest().from('Test'))).toBe('Test');
        expect(engine.resourceOf(new PostRequest().to('Test'))).toBe('Test');
        expect(engine.resourceOf(new PutRequest().to('Test'))).toBe('Test');
        expect(engine.resourceOf(new PatchRequest().to('Test'))).toBe('Test');
    });
    it('returns resource names as lower-case or regular-case depending on request header.', async () => {
        let engine = new MemoryStorageEngine();
        expect(engine.resourceOf(new DeleteRequest().from('Test').headers({ caseSensitive: true }))).toBe('Test');
        expect(engine.resourceOf(new GetRequest().from('Test').headers({ caseSensitive: true }))).toBe('Test');
        expect(engine.resourceOf(new PostRequest().to('Test').headers({ caseSensitive: true }))).toBe('Test');
        expect(engine.resourceOf(new PutRequest().to('Test').headers({ caseSensitive: true }))).toBe('Test');
        expect(engine.resourceOf(new PatchRequest().to('Test').headers({ caseSensitive: true }))).toBe('Test');
        expect(engine.resourceOf(new DeleteRequest().from('Test').headers({ caseSensitive: false }))).toBe('test');
        expect(engine.resourceOf(new GetRequest().from('Test').headers({ caseSensitive: false }))).toBe('test');
        expect(engine.resourceOf(new PostRequest().to('Test').headers({ caseSensitive: false }))).toBe('test');
        expect(engine.resourceOf(new PutRequest().to('Test').headers({ caseSensitive: false }))).toBe('test');
        expect(engine.resourceOf(new PatchRequest().to('Test').headers({ caseSensitive: false }))).toBe('test');
    });
});

describe('#get', () => {
    //create pre-populated engine
    let memory = new MemoryStorageEngine();
    for (let p in samples) {
        memory.data.set(p, samples[p]);
    }
    it('throws when the resource is not present.', async () => {
        await expect(memory.get(new GetRequest().from('lalala'))).rejects.toThrow(/resource.+not found/gi);
    });
    it('returns all data with no conditions.', async () => {
        let results = await memory.get(new GetRequest().from('themes'));
        expect(results).toBeInstanceOf(Response);
        expect(samples.themes.length).toBe(100); //should not affect original array.
        expect(results.total).toBe(100);
        expect(results.affected).toBe(0);
        expect(results.returned).toBe(100);
        expect(results.data.length).toBe(results.total);
    });
    it('returns data filtered by a where condition.', async () => {
        let results = await memory.get(new GetRequest()
            .from('themes')
            .where(f => f
                .and('ID', Filter.OP.GREATERTHANOREQUAL, 3)
                .and('ID', Filter.OP.LESSTHAN, 50)
            )
        );
        expect(results).toBeInstanceOf(Response);
        expect(samples.themes.length).toBe(100); //should not affect original array.
        expect(results.total).toBe(47);
        expect(results.affected).toBe(0);
        expect(results.returned).toBe(47);
        expect(results.data.length).toBe(results.total);
        for (let i = 0; i < results.data.length; i++) {
            let r = results.data[i];
            expect(r).toEqual(samples.themes[i + 2]);
        }
    });
    it('returns data filtered and paged.', async () => {
        let results = await memory.get(new GetRequest()
            .from('themes')
            .where(f => f
                .and('ID', Filter.OP.GREATERTHANOREQUAL, 3)
                .and('ID', Filter.OP.LESSTHAN, 50)
            )
            .skip(3)
            .take(4)
        );
        expect(results).toBeInstanceOf(Response);
        expect(samples.themes.length).toBe(100); //should not affect original array.
        expect(results.total).toBe(47);
        expect(results.affected).toBe(0);
        expect(results.returned).toBe(4);
        expect(results.data.length).toBe(results.returned);
        for (let i = 0; i < results.data.length; i++) {
            let r = results.data[i];
            expect(r).toEqual(samples.themes[i + 5]);
        }
    });
    it('returns sorted and paged results.', async () => {
        let results = await memory.get(new GetRequest()
            .from('themes')
            .take(5)
            .sort(Sort.desc('ID'), Sort.asc('HexCode'))
        );
        expect(results).toBeInstanceOf(Response);
        expect(samples.themes.length).toBe(100); //should not affect original array.
        expect(results.total).toBe(100);
        expect(results.affected).toBe(0);
        expect(results.returned).toBe(5);
        expect(results.data.length).toBe(results.returned);
        for (let i = results.data.length - 1; i >= 0; i--) {
            let r = results.data[i];
            expect(r).toEqual(samples.themes[99 - i]);
        }
    });
    it('only returns distinct objects.', async () => {
        await memory.post(new PostRequest(
            { id: 2, name: 'John', age: 22 },
            { id: 3, name: 'Sammy', age: 84 },
            { id: 2, name: 'John', age: 22 },
            { id: 9, name: 'John', age: 65 }
        ).to('distinctTest'));
        let results = await memory.get(new GetRequest()
            .from('distinctTest')
            .distinct()
        );
        expect(results).toBeInstanceOf(Response);
        expect(results.data.length).toBe(3);
        expect(results.total).toBe(3);
        expect(results.affected).toBe(0);
        expect(results.returned).toBe(3);
    });
    it('returns the total only from a query with the counts flag.', async () => {
        let results = await memory.get(new GetRequest()
            .from('themes')
            .take(5)
            .count()
        );
        expect(results).toBeInstanceOf(Response);
        expect(results.data.length).toBe(0);
        expect(results.total).toBe(100);
        expect(results.affected).toBe(0);
        expect(results.returned).toBe(5);
    });
    it('returns only specific properties', async () => {
        let res = await memory.get(new GetRequest()
            .from('themes')
            .properties('HexCode', 'Name')
        );
        expect(res).toBeInstanceOf(Response);
        expect(res.data.length).toBe(100);
        expect(res.total).toBe(100);
        expect(res.affected).toBe(0);
        expect(res.returned).toBe(100);
        for (let o of res.data) {
            expect(o.ID).toBeUndefined();
            expect(o.Name).not.toBeUndefined();
            expect(o.HexCode).not.toBeUndefined();
        }
    });
    it('responds with property values derrived from a defined model.', async () => {
        class Theme {
            static get ID() { return 'ID'; }
            static get Name() { return 'Name'; }
        }
        let res = await memory.get(new GetRequest().model(Theme));
        expect(res).toBeInstanceOf(Response);
        expect(res.data.length).toBe(100);
        expect(res.total).toBe(100);
        expect(res.affected).toBe(0);
        expect(res.returned).toBe(100);
        for (let o of res.data) {
            expect(o.ID).not.toBeUndefined();
            expect(o.Name).not.toBeUndefined();
            expect(o.HexCode).toBeUndefined();
        }
        //handles additional properties
        res = await memory.get(new GetRequest().model(Theme).properties('HexCode'));
        for (let o of res.data) {
            expect(o.ID).not.toBeUndefined();
            expect(o.Name).not.toBeUndefined();
            expect(o.HexCode).not.toBeUndefined();
        }
    });
    it('responds with plain data objects (stashku handles model conversion post response).', async () => {
        class Theme {
            static get ID() { return 'ID'; }
            static get Name() { return 'Name'; }
        }
        let res = await memory.get(new GetRequest().model(Theme));
        for (let o of res.data) {
            expect(o).not.toBeInstanceOf(Theme);
        }
    });
});

describe('#post', () => {
    it('throws a 400 error the configured limit would be exceeded.', async () => {
        let mem = new MemoryStorageEngine();
        mem.configure({ limit: 1 });
        for (let p in samples) {
            mem.data.set(p, samples[p]);
        }
        expect.assertions(3);
        expect(mem.config.limit).toBe(1);
        try {
            await mem.post(new PostRequest()
                .to('themes')
                .objects({ abc: 123 })
            );
        } catch (err) {
            expect(err.toString()).toMatch(/limit.+exceeded/i);
            expect(err.code).toBe(400);
        }
    });
    it('returns an empty response when no objects are specified.', async () => {
        let mem = new MemoryStorageEngine();
        let res = await mem.post(new PostRequest().to('test'));
        expect(res.data.length).toBe(0);
        expect(res.total).toBe(0);
        expect(res.affected).toBe(0);
        expect(res.returned).toBe(0);
    });
    it('adds objects to the underlying storage.', async () => {
        let mem = new MemoryStorageEngine();
        let res = await mem.post(new PostRequest()
            .to('test')
            .objects({ hello: 'world' }, { hello: 'mars' }, { hello: 'jupiter' })
        );
        expect(res).toBeInstanceOf(Response);
        expect(res.data.length).toBe(3);
        for (let d of res.data) {
            expect(typeof d.hello).toBe('string');
        }
        expect(res.total).toBe(3);
        expect(res.affected).toBe(3);
        expect(res.returned).toBe(3);
    });
    it('adds objects to the underlying storage and dereferences them.', async () => {
        let mem = new MemoryStorageEngine();
        let testObj = { hello: 'world' };
        let res = await mem.post(new PostRequest()
            .to('test')
            .objects(testObj, testObj, testObj)
        );
        expect(res).toBeInstanceOf(Response);
        expect(res.data.length).toBe(3);
        for (let d of res.data) {
            expect(d).not.toBe(testObj);
        }
        expect(res.total).toBe(3);
        expect(res.affected).toBe(3);
        expect(res.returned).toBe(3);
    });
    it('adds objects to the underlying storage but only returns counts when specified.', async () => {
        let mem = new MemoryStorageEngine();
        let res = await mem.post(new PostRequest()
            .to('test')
            .objects({ hello: 'world' }, { hello: 'mars' }, { hello: 'jupiter' })
            .count()
        );
        expect(res).toBeInstanceOf(Response);
        expect(res.data.length).toBe(0);
        expect(res.total).toBe(3);
        expect(res.affected).toBe(3);
        expect(res.returned).toBe(3);
    });
    it('responds with plain data objects (stashku handles model conversion post response).', async () => {
        class Theme {
            static get ID() { return 'ID'; }
            static get Name() { return 'Name'; }
        }
        let m = new Theme();
        m.ID = 100;
        m.Name = 'NeverSeeMe';
        let mem = new MemoryStorageEngine();
        let res = await mem.post(new PostRequest()
            .model(Theme)
            .objects(m)
        );
        for (let o of res.data) {
            expect(o).not.toBeInstanceOf(Theme);
        }
    });
});

describe('#put', () => {
    //create pre-populated engine
    let memory = new MemoryStorageEngine();
    for (let p in samples) {
        memory.data.set(p, samples[p]);
    }
    it('throws a 409 multiple matches error when the primary keys match to more than one record in storage.', async () => {
        expect.assertions(2);
        try {
            await memory.put(new PutRequest()
                .to('themes')
                .objects({ HexCode: 'green', value: 123 })
                .pk('HexCode')
            );
        } catch (err) {
            expect(err.toString()).toMatch(/multiple.+primary key/i);
            expect(err.code).toBe(409);
        }
    });
    it('throws a 404 when an invalid resource is specified.', async () => {
        expect.assertions(2);
        try {
            await memory.put(new PutRequest()
                .to('test')
                .pk('ID')
            );
        } catch (err) {
            expect(err.toString()).toMatch(/resource.+not found/i);
            expect(err.code).toBe(404);
        }
    });
    it('returns an empty response when no objects are specified.', async () => {
        let res = await memory.put(new PutRequest()
            .to('themes')
            .objects()
            .pk('ID')
        );
        expect(res).toEqual(Response.empty());
    });
    it('updates existing objects matched by a key.', async () => {
        let res = await memory.put(new PutRequest()
            .to('themes')
            .objects({ ID: 1, value: 111 }, { ID: 9999, value: 9999 }, { ID: 3, value: 333 })
            .pk('ID')
        );
        expect(res).toBeInstanceOf(Response);
        expect(res.data.length).toBe(2);
        expect(res.total).toBe(2);
        expect(res.affected).toBe(2);
        expect(res.returned).toBe(2);
        expect(res.data[0].value).toBe(111);
        expect(res.data[1].value).toBe(333);
    });
    it('updates existing objects matched by a key and returns only counts.', async () => {
        let res = await memory.put(new PutRequest()
            .to('themes')
            .objects({ ID: 1, value: 111 }, { ID: 9999, value: 9999 }, { ID: 3, value: 333 })
            .pk('ID')
            .count()
        );
        expect(res).toBeInstanceOf(Response);
        expect(res.data.length).toBe(0);
        expect(res.total).toBe(2);
        expect(res.affected).toBe(2);
        expect(res.returned).toBe(2);
    });
    it('updates existing objects matched by multiple keys.', async () => {
        let res = await memory.put(new PutRequest()
            .to('themes')
            .objects({ ID: 2, HexCode: '#0D98BA', value: 222 }, { ID: 9999, value: 9999 }, { ID: 3, HexCode: 'test', value: 333 })
            .pk('ID', 'HexCode')
        );
        expect(res).toBeInstanceOf(Response);
        expect(res.data.length).toBe(1);
        expect(res.total).toBe(1);
        expect(res.affected).toBe(1);
        expect(res.returned).toBe(1);
        expect(res.data[0].value).toBe(222);
    });
});

describe('#patch', () => {
    //create pre-populated engine
    let memory = new MemoryStorageEngine();
    for (let p in samples) {
        memory.data.set(p, samples[p]);
    }
    it('throws a 404 when an invalid resource is specified.', async () => {
        expect.assertions(2);
        try {
            await memory.patch(new PatchRequest()
                .to('test')
                .template({})
                .where(f => f.and('a', Filter.OP.EQUALS, 'b'))
            );
        } catch (err) {
            expect(err.toString()).toMatch(/resource.+not found/i);
            expect(err.code).toBe(404);
        }
    });
    it('returns empty when there are no matches', async () => {
        let res = await memory.patch(new PatchRequest()
            .to('themes')
            .template({ ID: 1, value: 111 })
            .where(f => f.and('ID', Filter.OP.EQUALS, 99999))
        );
        expect(res).toBeInstanceOf(Response);
        expect(res.data.length).toBe(0);
        expect(res.total).toBe(0);
        expect(res.affected).toBe(0);
        expect(res.returned).toBe(0);
    });
    it('updates any matching records with the specified template properties and values.', async () => {
        let res = await memory.patch(new PatchRequest()
            .to('products')
            .template({ Cost: 999, Hello: 'World' })
            .where(f => f
                .and('ID', Filter.OP.GREATERTHAN, 5)
                .and('ID', Filter.OP.LESSTHAN, 10)
            )
        );
        expect(res).toBeInstanceOf(Response);
        expect(res.data.length).toBe(4);
        expect(res.total).toBe(4);
        expect(res.affected).toBe(4);
        expect(res.returned).toBe(4);
        for (let d of res.data) {
            expect(d.Cost).toBe(999);
            expect(d.Hello).toBe('World');
            expect(d.ID).not.toBeUndefined();
            expect(d.Price).not.toBeUndefined();
            expect(d.Name).not.toBeUndefined();
        }
    });
    it('updates existing objects matched by a key and returns only counts.', async () => {
        let res = await memory.patch(new PatchRequest()
            .to('products')
            .template({ Cost: 999, Hello: 'World' })
            .where(f => f
                .and('ID', Filter.OP.GREATERTHAN, 5)
                .and('ID', Filter.OP.LESSTHAN, 10)
            )
            .count()
        );
        expect(res).toBeInstanceOf(Response);
        expect(res.data.length).toBe(0);
        expect(res.total).toBe(4);
        expect(res.affected).toBe(4);
        expect(res.returned).toBe(4);
    });
});

describe('#delete', () => {
    //create pre-populated engine
    let memory = new MemoryStorageEngine();
    for (let p in samples) {
        memory.data.set(p, samples[p]);
    }
    it('throws a 404 when an invalid resource is specified.', async () => {
        expect.assertions(2);
        try {
            await memory.delete(new DeleteRequest()
                .from('test')
                .where(f => f.and('a', Filter.OP.EQUALS, 'b'))
            );
        } catch (err) {
            expect(err.toString()).toMatch(/resource.+not found/i);
            expect(err.code).toBe(404);
        }
    });
    it('returns empty when there are no matches or the resource is missing.', async () => {
        let res = await memory.delete(new DeleteRequest()
            .from('themes')
            .where(f => f.and('ID', Filter.OP.EQUALS, 99999))
        );
        expect(res).toBeInstanceOf(Response);
        expect(res.data.length).toBe(0);
        expect(res.total).toBe(0);
        expect(res.affected).toBe(0);
        expect(res.returned).toBe(0);
    });
    it('deletes any matching records with the specified template properties and values.', async () => {
        let res = await memory.delete(new DeleteRequest()
            .from('products')
            .where(f => f
                .and('ID', Filter.OP.GREATERTHAN, 900)
            )
        );
        expect(res).toBeInstanceOf(Response);
        expect(res.data.length).toBe(100);
        expect(res.total).toBe(100);
        expect(res.affected).toBe(100);
        expect(res.returned).toBe(100);
        for (let d of res.data) {
            expect(d.ID).toBeGreaterThan(900);
        }
    });
    it('deletes existing objects matched by a key and returns only counts.', async () => {
        let res = await memory.delete(new DeleteRequest()
            .from('products')
            .where(f => f
                .and('ID', Filter.OP.GREATERTHAN, 800)
            )
            .count()
        );
        expect(res).toBeInstanceOf(Response);
        expect(res.data.length).toBe(0);
        expect(res.total).toBe(100);
        expect(res.affected).toBe(100);
        expect(res.returned).toBe(100);
    });
});