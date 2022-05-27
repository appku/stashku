import DeleteRequest from '../requests/delete-request.js';
import GetRequest from '../requests/get-request.js';
import OptionsRequest from '../requests/options-request.js';
import PatchRequest from '../requests/patch-request.js';
import PostRequest from '../requests/post-request.js';
import PutRequest from '../requests/put-request.js';
import RESTError from '../rest-error.js';
import Filter from '../filter.js';
import Sort from '../sort.js';
import Logger from '../logger.js';
import Response from '../response.js';
import fs from 'fs/promises';
import FetchEngine from './fetch-engine.js';
import fetchMock from 'jest-fetch-mock';

class ContactPersonModel {
    static get FirstName() { return 'first'; }
    static get LastName() { return 'last'; }
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

beforeAll(() => {
    fetchMock.enableMocks();
});

describe('#constructor', () => {
    it('sets the engine name to "fetch".', () => {
        expect(new FetchEngine().name).toBe('fetch');
    });
});

describe('#configure', () => {
    it('sets a default root property to a value of null.', () => {
        let e = new FetchEngine();
        e.configure();
        expect(e.config.root).toBeNull();
    });
    it('sets a default path property value to null.', () => {
        let e = new FetchEngine();
        e.configure();
        expect(e.config.path).toBeNull();
    });
    it('sets a default trailingSlash property value to false.', () => {
        let e = new FetchEngine();
        e.configure();
        expect(e.config.trailingSlash).toBe(false);
    });
    it('sets the root property from an object.', () => {
        let e = new FetchEngine();
        e.configure({ root: 'https://localhost' });
        expect(e.config.root).toBe('https://localhost');
        expect(e.config.path).toBeNull();
        expect(e.config.trailingSlash).toBe(false);
    });
    it('sets the path property from an object.', () => {
        let e = new FetchEngine();
        e.configure({ path: '/api/v2' });
        expect(e.config.root).toBeNull();
        expect(e.config.path).toBe('/api/v2');
        expect(e.config.trailingSlash).toBe(false);
    });
    it('sets the trailingSlash property from an object.', () => {
        let e = new FetchEngine();
        e.configure({ trailingSlash: true });
        expect(e.config.root).toBeNull();
        expect(e.config.path).toBeNull();
        expect(e.config.trailingSlash).toBe(true);
    });
    it('sets the root property from a the environmental variable.', () => {
        let e = new FetchEngine();
        process.env.STASHKU_FETCH_ROOT = 'http://domain';
        e.configure();
        expect(e.config.root).toBe('http://domain');
        delete process.env.STASHKU_FETCH_ROOT;
    });
    it('sets the path property from a the environmental variable.', () => {
        let e = new FetchEngine();
        process.env.STASHKU_FETCH_PATH = '';
        e.configure();
        expect(e.config.path).toBe('');
        delete process.env.STASHKU_FETCH_PATH;
    });
    it('sets the trailingSlash property from a the environmental variable.', () => {
        let e = new FetchEngine();
        process.env.STASHKU_FETCH_TRAILING_SLASH = 'true';
        e.configure();
        expect(e.config.trailingSlash).toBe(true);
        delete process.env.STASHKU_FETCH_TRAILING_SLASH;
    });
});

describe('#_uri', () => {
    it('generates a uri with a blank resource.', () => {
        let e = new FetchEngine();
        let tests = [
            [{}, null, '/'],
            [{}, undefined, '/'],
            [{}, '', '/'],
            [{ trailingSlash: true }, '', '/'],
            [{ root: 'https://0.0.0.0' }, '', 'https://0.0.0.0'],
            [{ root: 'https://0.0.0.0/' }, '', 'https://0.0.0.0'],
            [{ root: 'https://0.0.0.0/', path: '/api/v3/' }, '', 'https://0.0.0.0/api/v3'],
            [{ root: 'localhost', path: 'api-endpoint' }, '', 'localhost/api-endpoint'],
            [{ root: 'https://0.0.0.0', trailingSlash: true }, '', 'https://0.0.0.0/'],
            [{ root: 'https://0.0.0.0', path: '/api/v3', trailingSlash: true }, '', 'https://0.0.0.0/api/v3/'],
        ];
        for (let t of tests) {
            e.configure(t[0]);
            expect(e._uri(t[1])).toBe(t[2]);
        }
    });
    it('generates a uri with a configured resource specified.', () => {
        let e = new FetchEngine();
        let tests = [
            [{}, 'contact-person', '/contact-person'],
            [{ trailingSlash: true }, 'contact-person', '/contact-person/'],
            [{ path: 'api/v3/' }, 'contact-person', '/api/v3/contact-person'],
            [{ root: 'https://0.0.0.0/', path: '/api/v3/' }, 'contact-person', 'https://0.0.0.0/api/v3/contact-person'],
            [{ root: 'localhost', path: 'api-endpoint' }, 'contact-person', 'localhost/api-endpoint/contact-person'],
            [{ root: 'https://0.0.0.0/', path: '/api/v3/' }, 'contacts/person/', 'https://0.0.0.0/api/v3/contacts/person'],
            [{ root: 'localhost', path: 'api-endpoint' }, 'contacts/person/', 'localhost/api-endpoint/contacts/person'],
            [{ root: 'https://0.0.0.0/', path: '/api/v3', trailingSlash: true }, 'contacts/person/', 'https://0.0.0.0/api/v3/contacts/person/'],
            [{ root: 'localhost', path: 'api-endpoint', trailingSlash: true }, 'contacts/person/', 'localhost/api-endpoint/contacts/person/'],
        ];
        for (let t of tests) {
            e.configure(t[0]);
            expect(e._uri(t[1])).toBe(t[2]);
        }
    });
    it('ignores adding a trailing slash when the uri contains parameters', () => {
        let e = new FetchEngine();
        let tests = [
            [{ trailingSlash: true }, '?tacos', '/?tacos'],
            [{ root: 'https://0.0.0.0/', trailingSlash: true }, 'horse?meat=1', 'https://0.0.0.0/horse?meat=1'],
            [{ root: 'https://0.0.0.0/', path: '/api/v3/', trailingSlash: true }, 'meats?soda=1&burgers=2', 'https://0.0.0.0/api/v3/meats?soda=1&burgers=2'],
        ];
        for (let t of tests) {
            e.configure(t[0]);
            expect(e._uri(t[1])).toBe(t[2]);
        }
    });
});

describe('#_paramSerialize', () => {
    it('serializes a blank object to null.', () => {
        let e = new FetchEngine();
        expect(e._paramSerialize()).toBeNull();
    });
    it('serializes a simple object.', () => {
        let e = new FetchEngine();
        expect(e._paramSerialize({
            hello: 'world 199.5% - 22 & one_half',
            one: 2345,
            well: true
        })).toBe('hello=world%20199.5%25%20-%2022%20%26%20one_half&one=2345&well=true');
    });
    it('serializes an object with an array.', () => {
        let e = new FetchEngine();
        expect(e._paramSerialize({
            things: [1, 'hello', 'world', 2, 3]
        })).toBe('things%5B0%5D=1&things%5B1%5D=hello&things%5B2%5D=world&things%5B3%5D=2&things%5B4%5D=3');
    });
    it('serializes an object with child objects.', () => {
        let e = new FetchEngine();
        expect(e._paramSerialize({
            others: {
                monsters: 1,
                goonies: 2
            }
        })).toBe('others%5Bmonsters%5D=1&others%5Bgoonies%5D=2');
    });
    it('serializes dates.', () => {
        let e = new FetchEngine();
        expect(e._paramSerialize({
            when: new Date(Date.parse('1/1/1900 3:59:59 -08:00')),
            then: new Date(Date.parse('09-19-2014'))
        })).toBe('when=1900-01-01T11%3A59%3A59.000Z&then=2014-09-19T07%3A00%3A00.000Z');
    });
});

describe('#_fetch', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });
    it('defaults to making a GET fetch request.', async () => {
        fetchMock.mockResponseOnce(JSON.stringify({ data: 12345 }));
        let e = new FetchEngine();
        e.configure();
        await e._fetch('', null, null).then(r => {
            expect(r.json()).resolves.toEqual({ data: 12345 });
        });
        expect(fetchMock.mock.calls.length).toEqual(1);
        expect(fetchMock.mock.calls[0][0]).toEqual('/');
        expect(fetchMock.mock.calls[0][1]).toEqual({ method: 'GET', cache: 'no-cache' });
    });
    it('overrides default fetch settings with configured.', async () => {
        let e = new FetchEngine();
        e.configure({
            fetch: {
                mode: 'cors',
                cache: 'default'
            }
        });
        await e._fetch('', null, null);
        expect(fetchMock.mock.calls.length).toEqual(1);
        expect(fetchMock.mock.calls[0][0]).toEqual('/');
        expect(fetchMock.mock.calls[0][1]).toEqual({ method: 'GET', cache: 'default', mode: 'cors' });
    });
    it('parameterizes data when method is GET.', async () => {
        let e = new FetchEngine();
        e.configure();
        await e._fetch('', { abc: 123, hello: 'world' }, null);
        expect(fetchMock.mock.calls.length).toEqual(1);
        expect(fetchMock.mock.calls[0][0]).toEqual('/?abc=123&hello=world');
        expect(fetchMock.mock.calls[0][1]).toEqual({ method: 'GET', cache: 'no-cache' });
    });
    describe('uses body with JSON for data when...', () => {
        let e = new FetchEngine();
        e.configure();
        let methods = ['POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'];
        for (let m of methods) {
            it(`is the method ${m}`, async () => {
                await e._fetch('', { abc: 123, hello: 'world' }, { method: m });
                expect(fetchMock.mock.calls.length).toEqual(1);
                expect(fetchMock.mock.calls[0][0]).toEqual('/');
                expect(fetchMock.mock.calls[0][1]).toEqual({
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ abc: 123, hello: 'world' }),
                    method: m,
                    cache: 'no-cache'
                });
            });
        }
    });
});

describe('#resources', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });
    it('makes a stndard GET request to a "resources" resource and returns the array of resource strings.', async () => {
        fetchMock.mockResponseOnce(JSON.stringify({ data: ['themes', 'products'], total: 2, affected: 0, returned: 2 }));
        let e = new FetchEngine();
        e.configure();
        expect(await e.resources('', null, null)).toEqual(['themes', 'products']);
        expect(fetchMock.mock.calls.length).toEqual(1);
        expect(fetchMock.mock.calls[0][0]).toEqual('/resources');
        expect(fetchMock.mock.calls[0][1]).toEqual({ method: 'GET', cache: 'no-cache' });
    });
});

describe('#get', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });
    it('makes a fetch for the resource specified in the GetRequest and returns the response object from json.', async () => {
        fetchMock.mockResponseOnce(JSON.stringify({ data: [{ hello: 'world' }, { hello: 'mars' }], total: 2, affected: 0, returned: 2 }));
        let e = new FetchEngine();
        e.configure();
        let res = await e.get(new GetRequest().from('themes'));
        expect(res).toBeInstanceOf(Response);
        expect(res.data).toEqual([{ hello: 'world' }, { hello: 'mars' }]);
        expect(res.total).toBe(2);
        expect(res.affected).toBe(0);
        expect(res.returned).toBe(2);
        expect(fetchMock.mock.calls.length).toEqual(1);
        expect(fetchMock.mock.calls[0][0]).toEqual('/themes');
        expect(fetchMock.mock.calls[0][1]).toEqual({ method: 'GET', cache: 'no-cache' });
    });
});

describe('#post', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });
    it('makes a fetch for the resource specified in the PostRequest and returns the response object from json.', async () => {
        fetchMock.mockResponseOnce(JSON.stringify({ data: [{ id: 1, hello: 'world' }, { id: 2, hello: 'mars' }], total: 2, affected: 2, returned: 2 }));
        let e = new FetchEngine();
        e.configure();
        let res = await e.post(new PostRequest().to('themes').objects({ id: 1, hello: 'world' }, { id: 2, hello: 'mars' }));
        expect(res).toBeInstanceOf(Response);
        expect(res.data).toEqual([{ id: 1, hello: 'world' }, { id: 2, hello: 'mars' }]);
        expect(res.total).toBe(2);
        expect(res.affected).toBe(2);
        expect(res.returned).toBe(2);
        expect(fetchMock.mock.calls.length).toEqual(1);
        expect(fetchMock.mock.calls[0][0]).toEqual('/themes');
        expect(fetchMock.mock.calls[0][1]).toEqual({
            method: 'POST',
            cache: 'no-cache',
            body: '{"to":"themes","objects":[{"id":1,"hello":"world"},{"id":2,"hello":"mars"}]}',
            headers: {
                'Content-Type': 'application/json'
            }
        });
    });
});

describe('#put', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });
    it('makes a fetch for the resource specified in the PutRequest and returns the response object from json.', async () => {
        fetchMock.mockResponseOnce(JSON.stringify({ data: [{ id: 1, hello: 'world' }, { id: 2, hello: 'mars' }], total: 2, affected: 2, returned: 2 }));
        let e = new FetchEngine();
        e.configure();
        let res = await e.put(new PutRequest()
            .to('themes')
            .pk('id')
            .objects({ id: 1, hello: 'world' }, { id: 2, hello: 'mars' })
        );
        expect(res).toBeInstanceOf(Response);
        expect(res.data).toEqual([{ id: 1, hello: 'world' }, { id: 2, hello: 'mars' }]);
        expect(res.total).toBe(2);
        expect(res.affected).toBe(2);
        expect(res.returned).toBe(2);
        expect(fetchMock.mock.calls.length).toEqual(1);
        expect(fetchMock.mock.calls[0][0]).toEqual('/themes');
        expect(fetchMock.mock.calls[0][1]).toEqual({
            method: 'PUT',
            cache: 'no-cache',
            body: '{"to":"themes","objects":[{"id":1,"hello":"world"},{"id":2,"hello":"mars"}],"pk":["id"]}',
            headers: {
                'Content-Type': 'application/json'
            }
        });
    });
});

describe('#patch', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });
    it('makes a fetch for the resource specified in the PatchRequest and returns the response object from json.', async () => {
        fetchMock.mockResponseOnce(JSON.stringify({ data: [{ id: 1, hello: 'zoo' }], total: 1, affected: 1, returned: 1 }));
        let e = new FetchEngine();
        e.configure();
        let res = await e.patch(new PatchRequest()
            .to('themes')
            .template({ hello: 'zoo' })
            .where(f => f.and('id', f.OP.EQUALS, 1))
        );
        expect(res).toBeInstanceOf(Response);
        expect(res.data).toEqual([{ id: 1, hello: 'zoo' }]);
        expect(res.total).toBe(1);
        expect(res.affected).toBe(1);
        expect(res.returned).toBe(1);
        expect(fetchMock.mock.calls.length).toEqual(1);
        expect(fetchMock.mock.calls[0][0]).toEqual('/themes');
        expect(fetchMock.mock.calls[0][1]).toEqual({
            method: 'PATCH',
            cache: 'no-cache',
            body: '{"to":"themes","template":{"hello":"zoo"},"where":{"logic":"and","filters":[{"property":"id","op":"eq","value":1}]}}',
            headers: {
                'Content-Type': 'application/json'
            }
        });
    });
});

describe('#delete', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });
    it('makes a fetch for the resource specified in the DeleteRequest and returns the response object from json.', async () => {
        fetchMock.mockResponseOnce(JSON.stringify({ data: [{ id: 1, hello: 'zoo' }], total: 1, affected: 1, returned: 1 }));
        let e = new FetchEngine();
        e.configure();
        let res = await e.delete(new DeleteRequest()
            .from('themes')
            .where(f => f.and('id', f.OP.EQUALS, 1))
            .headers({ hello: 'world' })
            .count()
        );
        expect(res).toBeInstanceOf(Response);
        expect(res.data).toEqual([{ id: 1, hello: 'zoo' }]);
        expect(res.total).toBe(1);
        expect(res.affected).toBe(1);
        expect(res.returned).toBe(1);
        expect(fetchMock.mock.calls.length).toEqual(1);
        expect(fetchMock.mock.calls[0][0]).toEqual('/themes');
        expect(fetchMock.mock.calls[0][1]).toEqual({
            method: 'DELETE',
            cache: 'no-cache',
            body: '{"from":"themes","headers":{"hello":"world"},"count":true,"where":{"logic":"and","filters":[{"property":"id","op":"eq","value":1}]}}',
            headers: {
                'Content-Type': 'application/json'
            }
        });
    });
});

describe('#options', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });
    it('makes a fetch for the resource specified in the OptionsRequest and returns the response object from json.', async () => {
        fetchMock.mockResponseOnce(JSON.stringify({ data: [{ id: 1, hello: 'zoo' }], total: 1, affected: 1, returned: 1 }));
        let e = new FetchEngine();
        e.configure();
        let res = await e.options(new OptionsRequest().from('themes'));
        expect(res).toBeInstanceOf(Response);
        expect(res.data).toEqual([{ id: 1, hello: 'zoo' }]);
        expect(res.total).toBe(1);
        expect(res.affected).toBe(1);
        expect(res.returned).toBe(1);
        expect(fetchMock.mock.calls.length).toEqual(1);
        expect(fetchMock.mock.calls[0][0]).toEqual('/themes');
        expect(fetchMock.mock.calls[0][1]).toEqual({
            method: 'OPTIONS',
            cache: 'no-cache',
            body: '{"from":"themes"}',
            headers: {
                'Content-Type': 'application/json'
            }
        });
    });
});