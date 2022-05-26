import qs from 'qs';
import url from 'url';
import path from 'path';
import Filter from '../filter.js';
import DeleteRequest from '../requests/delete-request.js';
import GetRequest from '../requests/get-request.js';
import OptionsRequest from '../requests/options-request.js';
import PatchRequest from '../requests/patch-request.js';
import PostRequest from '../requests/post-request.js';
import PutRequest from '../requests/put-request.js';

function bodyParse(req) {
    if (Buffer.isBuffer(req.body)) {
        return JSON.parse(req.body.toString());
    } else if (typeof req.body === 'string') {
        return JSON.parse(req.body);
    }
    return req.body;
}

/**
 * Attempts to parse a request object from an `http.IncomingMessage`, matched by the request method.
 * @param {http.IncomingMessage} req - The request object.
 * @param {Object} requestType - The request type expected back.
 * @returns {Promise.<GetRequest | PostRequest | PutRequest | PatchRequest | DeleteRequest | OptionsRequest>}
 */
async function HttpRequestLoader(req, requestType) {
    let method = req.method.toLowerCase();
    let r = null;
    if (method === 'get') {
        r = new GetRequest();
        let url = new URL(req.url, 'http://localhost');
        if (url.pathname) {
            r.from(path.basename(url.pathname));
        }
        if (url.search) {
            let clone = qs.parse(url.search.substring(1));
            if (clone.from) {
                r.from(clone.from);
            }
            if (clone.count) {
                r.metadata.count = !!clone.count;
            }
            if (clone.distinct) {
                r.metadata.distinct = !!clone.distinct;
            }
            if (clone.headers) {
                r.headers(clone.headers);
            }
            if (clone.properties && clone.properties.length) {
                r.properties(...clone.properties);
            }
            if (clone.skip) {
                r.metadata.skip = clone.skip;
            }
            if (clone.sorts && clone.sorts.length) {
                r.sort(...clone.sorts);
            }
            if (clone.take) {
                r.metadata.take = clone.take;
            }
            if (typeof clone.where === 'string') {
                r.where(new Filter(JSON.parse(clone.where)));
            } else {
                r.where(Filter.fromObject(clone.where));
            }
        }
    } else if (method === 'post') {
        r = new PostRequest();
        let clone = bodyParse(req);
        if (clone.to) {
            r.to(clone.to);
        }
        if (clone.count) {
            r.metadata.count = !!clone.count;
        }
        if (clone.headers) {
            r.headers(clone.headers);
        }
        if (clone.objects && clone.objects.length) {
            r.objects(...clone.objects);
        }
    } else if (method === 'put') {
        r = new PutRequest();
        let clone = bodyParse(req);
        if (clone.to) {
            r.to(clone.to);
        }
        if (clone.count) {
            r.metadata.count = !!clone.count;
        }
        if (clone.headers) {
            r.headers(clone.headers);
        }
        if (clone.pk && clone.pk.length) {
            r.pk(...clone.pk);
        }
        if (clone.objects && clone.objects.length) {
            r.objects(...clone.objects);
        }
    } else if (method === 'patch') {
        r = new PatchRequest();
        let clone = bodyParse(req);
        if (clone.to) {
            r.to(clone.to);
        }
        if (clone.count) {
            r.metadata.count = !!clone.count;
        }
        if (clone.all) {
            r.metadata.all = !!clone.all;
        }
        if (clone.headers) {
            r.headers(clone.headers);
        }
        if (clone.template) {
            r.template(clone.template);
        }
        if (typeof clone.where === 'string') {
            r.where(new Filter(JSON.parse(clone.where)));
        } else {
            r.where(Filter.fromObject(clone.where));
        }
    } else if (method === 'delete') {
        r = new DeleteRequest();
        let clone = bodyParse(req);
        if (clone.from) {
            r.from(clone.from);
        }
        if (clone.count) {
            r.metadata.count = !!clone.count;
        }
        if (clone.all) {
            r.metadata.all = !!clone.all;
        }
        if (clone.headers) {
            r.headers(clone.headers);
        }
        if (typeof clone.where === 'string') {
            r.where(new Filter(JSON.parse(clone.where)));
        } else {
            r.where(Filter.fromObject(clone.where));
        }
    } else if (method === 'options') {
        r = new OptionsRequest();
        let clone = bodyParse(req);
        if (clone.from) {
            r.from(clone.from);
        }
        if (clone.headers) {
            r.headers(clone.headers);
        }
    }
    console.log('http parse', method, r);
    return r;
}

export default HttpRequestLoader;