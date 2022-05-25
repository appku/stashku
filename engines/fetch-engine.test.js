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

describe('#constructor', () => {
    it('sets the engine name to "fetch".', () => {
        expect(new FetchEngine().name).toBe('fetch');
    });
});

describe('#configure', () => {
    it('sets a default root property to a value of null.', () => {
        let engine = new FetchEngine();
        engine.configure();
        expect(engine.config.root).toBeNull();
    });
    it('sets a default path property value to "/api".', () => {
        let engine = new FetchEngine();
        engine.configure();
        expect(engine.config.path).toBe('/api');
    });
    it('sets the root property from an object.', () => {
        let engine = new FetchEngine();
        engine.configure({ root: 'https://localhost' });
        expect(engine.config.root).toBe('https://localhost');
    });
    it('sets the root property from a the environmental variable.', () => {
        let engine = new FetchEngine();
        process.env.STASHKU_FETCH_ROOT = 'http://domain';
        engine.configure();
        expect(engine.config.root).toBe('http://domain');
        delete process.env.STASHKU_FETCH_ROOT;
    });
    it('sets the path property from a the environmental variable.', () => {
        let engine = new FetchEngine();
        process.env.STASHKU_FETCH_PATH = '';
        engine.configure();
        expect(engine.config.path).toBe('');
        delete process.env.STASHKU_FETCH_PATH;
    });
});