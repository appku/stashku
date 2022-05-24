import BaseEngine from './base-engine.js';
import DeleteRequest from '../requests/delete-request.js';
import GetRequest from '../requests/get-request.js';
import OptionsRequest from '../requests/options-request.js';
import PatchRequest from '../requests/patch-request.js';
import PostRequest from '../requests/post-request.js';
import PutRequest from '../requests/put-request.js';
import RESTError from '../rest-error.js';
import Filter from '../filter.js';

class TestEngine extends BaseEngine {
    constructor(name) { super(name); }
}

class OverridingTestEngine extends BaseEngine {
    constructor(name) { super(name); }
    async extract(resource) { await super.extract(resource); }
    async get(request) { await super.get(request); }
    async post(request) { await super.post(request); }
    async put(request) { await super.put(request); }
    async patch(request) { await super.patch(request); }
    async delete(request) { await super.delete(request); }
}

describe('#constructor', () => {
    it('throws on direct construction (abstract enforcement).', () => {
        expect(() => { new BaseEngine(); }).toThrow(/abstract/);
    });
    it('throws when the "name" argument is not specified.', () => {
        expect(() => { new TestEngine(); }).toThrow(/name.+required/);
        expect(() => { new TestEngine(null); }).toThrow(/name.+required/);
        expect(() => { new TestEngine(''); }).toThrow(/name.+required/);
    });
    it('throws when the "name" argument is not a string.', () => {
        expect(() => { new TestEngine(1234); }).toThrow(/name.+string/);
        expect(() => { new TestEngine(new Date()); }).toThrow(/name.+string/);
        expect(() => { new TestEngine(true); }).toThrow(/name.+string/);
        expect(() => { new TestEngine(['abc']); }).toThrow(/name.+string/);
        expect(() => { new TestEngine({}); }).toThrow(/name.+string/);
    });
    it('constructs ok when extended.', () => {
        expect(() => { new TestEngine('test'); }).not.toThrow();
    });
});

describe('#destroy', () => {
    it('runs without error.', () => {
        expect(() => { new TestEngine('test').destroy(); }).not.toThrow();
    });
});

describe('#configure', () => {
    it('sets the config property on the engine.', () => {
        let engine = new TestEngine('yarg');
        engine.configure({ a: 1 });
        expect(engine.config).toEqual({ a: 1 });
    });
    it('sets a logger object if provided.', () => {
        let engine = new TestEngine('yarg');
        engine.configure({}, { bleh: 1 });
        expect(engine.log).toStrictEqual({ bleh: 1 });
    });
    it('sets the log to null if a null is provided.', () => {
        let engine = new TestEngine('yarg');
        engine.configure({}, null);
        expect(engine.log).toBeNull();
    });
});

describe('#resources', () => {
    it('throws a 501 "not supported" error when called by an extending class.', async () => {
        await expect(new TestEngine('test').resources()).rejects.toThrow(/not.+supported/i);
        await expect(new TestEngine('test').resources()).rejects.toHaveProperty('code', 501);
    });
});

describe('#get', () => {
    let createRequest = () => {
        return new GetRequest()
            .properties('a', 'b', 'c')
            .skip(100)
            .take(50)
            .from('Letters')
            .where(f => f.and('a', Filter.OP.CONTAINS, 'z'));
    };
    it('throws a 501 "not supported" error when called by an extending class.', async () => {
        await expect(new TestEngine('test').get(null)).rejects.toThrow(/get.+supported/i);
        await expect(new TestEngine('test').get('test')).rejects.toHaveProperty('code', 501);
    });
    it('throws a 400 error when overriden and the request is missing or not a GetRequest.', async () => {
        await expect(new OverridingTestEngine('test').get({})).rejects.toThrow(/required.+get/i);
        await expect(new OverridingTestEngine('test').get({})).rejects.toHaveProperty('code', 400);
    });
    it('throws a 400 error when overriden and the request missing required metadata.', async () => {
        let r = createRequest();
        r.metadata = null;
        await expect(new OverridingTestEngine('test').get(r)).rejects.toThrow(/required.+metadata/i);
        await expect(new OverridingTestEngine('test').get(r)).rejects.toHaveProperty('code', 400);
    });
    it('throws a 400 error when overriden and  the request metadata is missing a required "from" value.', async () => {
        let r = createRequest().from(null);
        await expect(new OverridingTestEngine('test').get(r)).rejects.toThrow(/missing.+from/i);
        await expect(new OverridingTestEngine('test').get(r)).rejects.toHaveProperty('code', 400);
    });
    it('resolves ok if overridden and called with expected arguments.', async () => {
        await expect(new OverridingTestEngine('test').get(createRequest())).resolves.not.toThrow();
    });
});

describe('#post', () => {
    let createRequest = () => {
        return new PostRequest()
            .objects({ a: 1 }, { a: 2 })
            .to('Something');
    };
    it('throws a 501 "not supported" error when called by an extending class.', async () => {
        await expect(new TestEngine('test').post(null)).rejects.toThrow(/post.+supported/i);
        await expect(new TestEngine('test').post('test')).rejects.toHaveProperty('code', 501);
    });
    it('throws a 400 error when overriden and the request is missing or not a PostRequest.', async () => {
        await expect(new OverridingTestEngine('test').post({})).rejects.toThrow(/required.+post/i);
        await expect(new OverridingTestEngine('test').post({})).rejects.toHaveProperty('code', 400);
    });
    it('throws a 400 error when overriden and the request missing required metadata.', async () => {
        let r = createRequest();
        r.metadata = null;
        await expect(new OverridingTestEngine('test').post(r)).rejects.toThrow(/required.+metadata/i);
        await expect(new OverridingTestEngine('test').post(r)).rejects.toHaveProperty('code', 400);
    });
    it('throws a 400 error when overriden and the request metadata is missing a required "to" value.', async () => {
        let r = createRequest().to(null);
        await expect(new OverridingTestEngine('test').post(r)).rejects.toThrow(/required.+to/i);
        await expect(new OverridingTestEngine('test').post(r)).rejects.toHaveProperty('code', 400);
    });
    it('resolves ok if overridden and called with expected arguments.', async () => {
        await expect(new OverridingTestEngine('test').post(createRequest())).resolves.not.toThrow();
    });
});

describe('#put', () => {
    let createRequest = () => {
        return new PutRequest()
            .objects({ a: 1 }, { b: 2 })
            .pk('a')
            .to('Something');
    };
    it('throws a 501 "not supported" error when called by an extending class.', async () => {
        await expect(new TestEngine('test').put(null)).rejects.toThrow(/put.+supported/i);
        await expect(new TestEngine('test').put('test')).rejects.toHaveProperty('code', 501);
    });
    it('throws a 400 error when overriden and the request is missing or not a PutRequest.', async () => {
        await expect(new OverridingTestEngine('test').put({})).rejects.toThrow(/required.+put/i);
        await expect(new OverridingTestEngine('test').put({})).rejects.toHaveProperty('code', 400);
    });
    it('throws a 400 error when overriden and the request missing required metadata.', async () => {
        let r = createRequest();
        r.metadata = null;
        await expect(new OverridingTestEngine('test').put(r)).rejects.toThrow(/required.+metadata/i);
        await expect(new OverridingTestEngine('test').put(r)).rejects.toHaveProperty('code', 400);
    });
    it('throws a 400 error when overriden and the request metadata is missing a required "to" value.', async () => {
        let r = createRequest().to(null);
        await expect(new OverridingTestEngine('test').put(r)).rejects.toThrow(/required.+to/i);
        await expect(new OverridingTestEngine('test').put(r)).rejects.toHaveProperty('code', 400);
    });
    it('throws a 400 error when overriden and the request metadata is missing at least one "pk" value.', async () => {
        let r = createRequest().pk(null);
        await expect(new OverridingTestEngine('test').put(r)).rejects.toThrow(/missing.+PK/i);
        await expect(new OverridingTestEngine('test').put(r)).rejects.toHaveProperty('code', 400);
    });
    it('resolves ok if overridden and called with expected arguments.', async () => {
        await expect(new OverridingTestEngine('test').put(createRequest())).resolves.not.toThrow();
    });
});

describe('#patch', () => {
    let createRequest = () => {
        return new PatchRequest()
            .template({ a: 1 })
            .where(f => f.and('a', Filter.OP.CONTAINS, 'z'))
            .to('Something');
    };
    it('throws a 501 "not supported" error when called by an extending class.', async () => {
        await expect(new TestEngine('test').patch(null)).rejects.toThrow(/patch.+supported/i);
        await expect(new TestEngine('test').patch('test')).rejects.toHaveProperty('code', 501);
    });
    it('throws a 400 error when overriden and the request is missing or not a PatchRequest.', async () => {
        await expect(new OverridingTestEngine('test').patch({})).rejects.toThrow(/required.+patch/i);
        await expect(new OverridingTestEngine('test').patch({})).rejects.toHaveProperty('code', 400);
    });
    it('throws a 400 error when overriden and the request missing required metadata.', async () => {
        let r = createRequest();
        r.metadata = null;
        await expect(new OverridingTestEngine('test').patch(r)).rejects.toThrow(/required.+metadata/i);
        await expect(new OverridingTestEngine('test').patch(r)).rejects.toHaveProperty('code', 400);
    });
    it('throws a 400 error when overriden and the request metadata is missing a required "to" value.', async () => {
        let r = createRequest().to(null);
        await expect(new OverridingTestEngine('test').patch(r)).rejects.toThrow(/required.+to/i);
        await expect(new OverridingTestEngine('test').patch(r)).rejects.toHaveProperty('code', 400);
    });
    it('throws a 400 error when overriden and the request metadata is missing a "template" object.', async () => {
        let r = createRequest().template(null);
        await expect(new OverridingTestEngine('test').patch(r)).rejects.toThrow(/missing.+template/i);
        await expect(new OverridingTestEngine('test').patch(r)).rejects.toHaveProperty('code', 400);
    });
    it('throws a 400 error when overriden and the request metadata is missing "where" conditions.', async () => {
        let r = createRequest().where(null);
        await expect(new OverridingTestEngine('test').patch(r)).rejects.toThrow(/missing.+where/i);
        await expect(new OverridingTestEngine('test').patch(r)).rejects.toHaveProperty('code', 400);
        r.where(new Filter());
        await expect(new OverridingTestEngine('test').patch(r)).rejects.toThrow(/missing.+where/i);
        await expect(new OverridingTestEngine('test').patch(r)).rejects.toHaveProperty('code', 400);
    });
    it('does not throw a 400 error when overriden and the request metadata is missing "where" conditions but "all" is enabled.', async () => {
        let r = createRequest().where(null).all();
        await expect(new OverridingTestEngine('test').patch(r)).resolves.not.toThrow();
    });
    it('resolves ok if overridden and called with expected arguments.', async () => {
        await expect(new OverridingTestEngine('test').patch(createRequest())).resolves.not.toThrow();
    });
});

describe('#delete', () => {
    let createRequest = () => {
        return new DeleteRequest()
            .where(f => f.and('a', Filter.OP.CONTAINS, 'z'))
            .from('Something');
    };
    it('throws a 501 "not supported" error when called by an extending class.', async () => {
        await expect(new TestEngine('test').delete(null)).rejects.toThrow(/delete.+supported/i);
        await expect(new TestEngine('test').delete('test')).rejects.toHaveProperty('code', 501);
    });
    it('throws a 400 error when overriden and the request is missing or not a DeleteRequest.', async () => {
        await expect(new OverridingTestEngine('test').delete({})).rejects.toThrow(/required.+delete/i);
        await expect(new OverridingTestEngine('test').delete({})).rejects.toHaveProperty('code', 400);
    });
    it('throws a 400 error when overriden and the request missing required metadata.', async () => {
        let r = createRequest();
        r.metadata = null;
        await expect(new OverridingTestEngine('test').delete(r)).rejects.toThrow(/required.+metadata/i);
        await expect(new OverridingTestEngine('test').delete(r)).rejects.toHaveProperty('code', 400);
    });
    it('throws a 400 error when overriden and the request metadata is missing a required "from" value.', async () => {
        let r = createRequest().from(null);
        await expect(new OverridingTestEngine('test').delete(r)).rejects.toThrow(/required.+from/i);
        await expect(new OverridingTestEngine('test').delete(r)).rejects.toHaveProperty('code', 400);
    });
    it('throws a 400 error when overriden and the request metadata is missing "where" conditions.', async () => {
        let r = createRequest().where(null);
        await expect(new OverridingTestEngine('test').delete(r)).rejects.toThrow(/missing.+where/i);
        await expect(new OverridingTestEngine('test').delete(r)).rejects.toHaveProperty('code', 400);
        r.where(new Filter());
        await expect(new OverridingTestEngine('test').delete(r)).rejects.toThrow(/missing.+where/i);
        await expect(new OverridingTestEngine('test').delete(r)).rejects.toHaveProperty('code', 400);
    });
    it('does not throw a 400 error when overriden and the request metadata is missing "where" conditions but "all" is enabled.', async () => {
        let r = createRequest().where(null).all();
        await expect(new OverridingTestEngine('test').delete(r)).resolves.not.toThrow();
    });
    it('resolves ok if overridden and called with expected arguments.', async () => {
        await expect(new OverridingTestEngine('test').delete(createRequest())).resolves.not.toThrow();
    });
});

