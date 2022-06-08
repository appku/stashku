import qs from 'qs';
import url from 'url';
import path from 'path';
import Filter from '../filter.js';
import ModelUtility from '../modeling/model-utility.js';
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
 * @param {http.IncomingMessage} httpReq - The request object.
 * @param {Modeling.AnyModelType} [modelType] - Optional model set 
 * @returns {Promise.<GetRequest | PostRequest | PutRequest | PatchRequest | DeleteRequest | OptionsRequest>}
 */
async function HttpRequestLoader(httpReq, modelType) {
    let method = httpReq.method.toLowerCase();
    let req = null;
    let resource = null;
    let url = new URL(httpReq.url, 'http://localhost');
    if (modelType) {
        resource = ModelUtility.resource(modelType, method);
    } else if (url.pathname) {
        resource = path.basename(url.pathname);
    }
    if (method === 'get') {
        req = new GetRequest().from(resource);
        if (url.search) {
            let clone = qs.parse(url.search.substring(1));
            if (clone.from) {
                req.from(clone.from);
            }
            if (clone.count) {
                req.metadata.count = !!clone.count;
            }
            if (clone.distinct) {
                req.metadata.distinct = !!clone.distinct;
            }
            if (clone.headers) {
                req.headers(clone.headers);
            }
            if (clone.properties && clone.properties.length) {
                req.properties(...clone.properties);
            }
            if (clone.skip) {
                req.metadata.skip = clone.skip;
            }
            if (clone.sorts && clone.sorts.length) {
                req.sort(...clone.sorts);
            }
            if (clone.take) {
                req.metadata.take = clone.take;
            }
            if (typeof clone.where === 'string') {
                req.where(new Filter(JSON.parse(clone.where)));
            } else {
                req.where(Filter.fromObject(clone.where));
            }
        }
    } else if (method === 'post') {
        req = new PostRequest().to(resource);
        let clone = bodyParse(httpReq);
        if (clone.to) {
            req.to(clone.to);
        }
        if (clone.count) {
            req.metadata.count = !!clone.count;
        }
        if (clone.headers) {
            req.headers(clone.headers);
        }
        if (clone.objects && clone.objects.length) {
            req.objects(...clone.objects);
        }
    } else if (method === 'put') {
        req = new PutRequest().to(resource);
        let clone = bodyParse(httpReq);
        if (clone.to) {
            req.to(clone.to);
        }
        if (clone.count) {
            req.metadata.count = !!clone.count;
        }
        if (clone.headers) {
            req.headers(clone.headers);
        }
        if (clone.pk && clone.pk.length) {
            req.pk(...clone.pk);
        }
        if (clone.objects && clone.objects.length) {
            req.objects(...clone.objects);
        }
    } else if (method === 'patch') {
        req = new PatchRequest().to(resource);
        let clone = bodyParse(httpReq);
        if (clone.to) {
            req.to(clone.to);
        }
        if (clone.count) {
            req.metadata.count = !!clone.count;
        }
        if (clone.all) {
            req.metadata.all = !!clone.all;
        }
        if (clone.headers) {
            req.headers(clone.headers);
        }
        if (clone.template) {
            req.template(clone.template);
        }
        if (typeof clone.where === 'string') {
            req.where(new Filter(JSON.parse(clone.where)));
        } else {
            req.where(Filter.fromObject(clone.where));
        }
    } else if (method === 'delete') {
        req = new DeleteRequest().from(resource);
        let clone = bodyParse(httpReq);
        if (clone.from) {
            req.from(clone.from);
        }
        if (clone.count) {
            req.metadata.count = !!clone.count;
        }
        if (clone.all) {
            req.metadata.all = !!clone.all;
        }
        if (clone.headers) {
            req.headers(clone.headers);
        }
        if (typeof clone.where === 'string') {
            req.where(new Filter(JSON.parse(clone.where)));
        } else {
            req.where(Filter.fromObject(clone.where));
        }
    } else if (method === 'options') {
        req = new OptionsRequest().from(resource);
        let clone = bodyParse(httpReq);
        if (clone.from) {
            req.from(clone.from);
        }
        if (clone.headers) {
            req.headers(clone.headers);
        }
    }
    return req;
}

export default HttpRequestLoader;