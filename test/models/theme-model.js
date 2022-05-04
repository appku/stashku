import GetRequest from './requests/get-request.js';
import PostRequest from './requests/post-request.js';
import PutRequest from './requests/put-request.js';
import PatchRequest from './requests/patch-request.js';
import DeleteRequest from './requests/delete-request.js';

export default class ThemeModel {
    constructor() {
        this.id = 0;
        this.name = '';
        this.hexCode = null;
    }

    //#region Stashku Static Definitions

    static get id() {
        return {
            target: 'ID',
            pk: true,
            validate: (v, def) => typeof v === 'number'
        };
    }

    static get name() {
        return {
            target: 'Name',
            validate: [
                (v, def) => typeof v === 'string',
                (v, def) => v?.length > 1
            ]
        };
    }

    static get hexCode() {
        return {
            target: 'Hex_Code', 
            validate: [
                (v, def) => typeof v === 'string',
                (v, def) => v?.length === 7
            ]
        };
    }

    static get $stashku() {
        return {
            resource: {
                '*': 'Theme', //default, can also use the property name "all".
                'get': 'Theme',
                'post': 'Theme',
                'put': (action) => 'Theme', //can be a callback
                'patch': 'Theme',
                'delete': null
            },
            override: {
                'get': new GetRequest(),
                'post': new PostRequest(),
                'put': new PutRequest(),
                'patch': new PatchRequest(),
                'delete': new DeleteRequest()
            }
        };
    }

    //#endregion
}