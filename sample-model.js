import GetRequest from './requests/get-request.js';
import PostRequest from './requests/post-request.js';
import PutRequest from './requests/put-request.js';
import PatchRequest from './requests/patch-request.js';
import DeleteRequest from './requests/delete-request.js';

export default class BasePersonModel {
    constructor() {
        this.firstName = '';
        this.lastName = '';
        this.age = null;
    }

    static get firstName() {
        return {
            target: 'First_Name',
            pk: true,
            transform: v => v ? v : 'blargh'
        };
    }
}
BasePersonModel.lastName = 'lastName';
BasePersonModel.age = 'age';

class PersonModel extends BasePersonModel {
    constructor() {
        super();

        this.x = null;
    }

    static get $stashku() {
        return {
            resource: {
                '*': 'Person', //default, can also use the property name "all".
                'get': 'Person',
                'post': 'Person',
                'put': (action) => 'Person', //can be a callback
                'patch': 'Person',
                'delete': null
            },
            override: {
                'get': new GetRequest(),
                'post': new PostRequest(),
                'put': new PutRequest().pk(...this.$stashku.keys),
                'patch': new PatchRequest(),
                'delete': new DeleteRequest()
            }
        };
    }
}

new PersonModel();