import ModelUtility from './model-utility.js';
import jest from 'jest-mock';

const invalidModelTypeValues = [
    new Date(),
    new String(),
    new Number(),
    new Boolean(),
    123,
    true,
    false,
    null,
    undefined,
    'hello',
    {}
];

const methods = ['get', 'post', 'put', 'patch', 'delete'];

describe('.isValidType', () => {
    class TestModel { }
    function TestModel2() { }
    it('returns true on class objects.', () => {
        expect(ModelUtility.isValidType(TestModel)).toBe(true);
        expect(ModelUtility.isValidType(Date)).toBe(true);
        expect(ModelUtility.isValidType(Number)).toBe(true);
        expect(ModelUtility.isValidType(Boolean)).toBe(true);
    });
    it('returns true on contructor functions.', () => {
        expect(ModelUtility.isValidType(TestModel2)).toBe(true);
    });
    it('returns false on class instances.', () => {
        expect(ModelUtility.isValidType(new TestModel())).toBe(false);
        expect(ModelUtility.isValidType(new TestModel2())).toBe(false);
        for (let i = 0; i <= 3; i++) {
            expect(ModelUtility.isValidType(invalidModelTypeValues[i])).toBe(false);
        }
    });
    it('returns false on non-constructor functions.', () => {
        expect(ModelUtility.isValidType()).toBe(false);
        for (let i = 4; i < invalidModelTypeValues.length; i++) {
            expect(ModelUtility.isValidType(invalidModelTypeValues[i])).toBe(false);
        }
    });
});

describe('.isModelType', () => {
    class TestModel {
        static get FirstName() { return 'First_Name'; }

        static get $stashku() {
            return {};
        }
    }
    TestModel.LastName = 'lastname';
    it('Returns true when all objects only contain properties found in the model type.', () => {
        expect(ModelUtility.isModelType(TestModel, {})).toBe(true);
        expect(ModelUtility.isModelType(TestModel, { FirstName: 'abc' }, { LastName: 'abc' }, { FirstName: 123, LastName: 'abc' })).toBe(true);
    });
    it('Skips null and undefined objects.', () => {
        expect(ModelUtility.isModelType(TestModel, { FirstName: 'abc' }, null, { LastName: 'abc' }, undefined)).toBe(true);
        expect(ModelUtility.isModelType(TestModel, { FirstName: 'abc' }, null, { bob: 'abc' }, undefined)).toBe(false);
    });
    it('Returns false when any object contains a property not found in the model type.', () => {
        expect(ModelUtility.isModelType(TestModel, { ok: 123 })).toBe(false);
        expect(ModelUtility.isModelType(TestModel, { FirstName: 'abc' }, { LastName: 'abc' }, { FirstName: 123, nothere: 123, LastName: 'abc' })).toBe(false);
    });
});

describe('.map', () => {
    it('returns an empty map when the "modelType" argument is not a valid model type.', () => {
        for (let i = 4; i < invalidModelTypeValues.length; i++) {
            expect(ModelUtility.map(invalidModelTypeValues[i])).toBeInstanceOf(Map);
            expect(ModelUtility.map(invalidModelTypeValues[i]).size).toBe(0);
        }
    });
    it('returns a map of static property names and their string values, all others are ignored.', () => {
        let mapping = ModelUtility.map(class Test {
            constructor() {
                this.a = 1;
                this.b = 2;
            }
            get c() { return 2; }
            static d() { return 3; }
            e() { return 4; }
            static get f() { return '5'; }
            static get g() { return 6; }
            static get h() { return true; }
            static get i() { return {}; }
            static get j() { return (mt, p) => 'neat:' + p; }
        });
        expect(Array.from(mapping.keys())).toEqual(['f', 'i', 'j']);
        expect(Array.from(mapping.values())).toEqual([{ target: '5' }, { target: 'i' }, { target: 'neat:j' }]);
    });
});

describe('.resource', () => {
    it('returns null when an invalid model type is specified.', () => {
        for (let invalid of invalidModelTypeValues) {
            expect(ModelUtility.resource(invalid)).toBeNull();
        }
    });
    it('returns a string when the resource property is present as a string.', () => {
        for (let m of [class TestModel { }, function TestModel2() { }]) {
            m.$stashku = { resource: 'abc' };
            expect(ModelUtility.resource(m)).toBe('abc');
        }
    });
    it('returns a string return value when the resource property is present as a callback function.', () => {
        for (let m of [class TestModel { }, function TestModel2() { }]) {
            m.$stashku = { resource: jest.fn(() => 'abc') };
            expect(ModelUtility.resource(m)).toBe('abc');
            expect(m.$stashku.resource).toHaveBeenCalled();
        }
    });
    it('returns a string value for a specific action on a resource object.', () => {
        for (let m of [class TestModel { }, function TestModel2() { }]) {
            for (let action of methods) {
                m.$stashku = { resource: {} };
                m.$stashku.resource[action] = 'abc';
                expect(ModelUtility.resource(m, action)).toBe('abc');
            }
        }
    });
    it('returns a string return value for a specific action on a resource object with a callback function.', () => {
        for (let m of [class TestModel { }, function TestModel2() { }]) {
            for (let action of methods) {
                m.$stashku = { resource: {} };
                m.$stashku.resource[action] = jest.fn(() => 'abc');
                expect(ModelUtility.resource(m, action)).toBe('abc');
                expect(m.$stashku.resource[action]).toHaveBeenCalled();
            }
        }
    });
    it('falls-back to "all" or "*" property string values when the action property is not present.', () => {
        for (let m of [class TestModel { }, function TestModel2() { }]) {
            for (let action of methods) {
                for (let fallback of ['all', '*']) {
                    m.$stashku = { resource: {} };
                    m.$stashku.resource[fallback] = 'abc';
                    expect(ModelUtility.resource(m, action)).toBe('abc');
                }
            }
        }
    });
    it('falls-back to "all" or "*" property string return values from a callback when the action property is not present.', () => {
        for (let m of [class TestModel { }, function TestModel2() { }]) {
            for (let action of methods) {
                for (let fallback of ['all', '*']) {
                    m.$stashku = { resource: {} };
                    m.$stashku.resource[fallback] = jest.fn(() => 'abc');
                    expect(ModelUtility.resource(m, action)).toBe('abc');
                    expect(m.$stashku.resource[fallback]).toHaveBeenCalled();
                }
            }
        }
    });
    it('falls-back to the class/constructor name when no resource property is present.', () => {
        for (let action of methods) {
            expect(ModelUtility.resource(class TestModel { }, action)).toBe('TestModel');
            expect(ModelUtility.resource(function TestModel2() { }, action)).toBe('TestModel2');
        }
    });
    it('returns null when the resource is a non-supported value.', () => {
        for (let m of [class TestModel { }, function TestModel2() { }]) {
            for (let action of methods) {
                for (let invalid of [123, true]) {
                    m.$stashku = { resource: invalid };
                    expect(ModelUtility.resource(m, action)).toBeNull();
                }
            }
        }
    });
    it('returns null when the action and fallback properties are not present.', () => {
        for (let m of [class TestModel { }, function TestModel2() { }]) {
            for (let action of methods) {
                m.$stashku = { resource: {} };
                expect(ModelUtility.resource(m, action)).toBeNull();
            }
        }
    });
});

describe('.pk', () => {
    it('returns an array even with no primary keys configured.', () => {
        class TestModel {
            static get bob() {
                return {};
            }
        }
        expect(ModelUtility.pk(TestModel)).toEqual([]);
    });
    it('returns an array as defined from the model type pks.', () => {
        class TestModel {
            static get test1() {
                return { pk: true };
            }
            static get test2() {
                return {};
            }
            static get test3() {
                return { pk: true };
            }
        }
        expect(ModelUtility.pk(TestModel)).toEqual(['test1', 'test3']);
    });
    it('uses a target name if it is presetn.', () => {
        class TestModel {
            static get test1() {
                return { pk: true, target: 'apples' };
            }
            static get test2() {
                return {};
            }
            static get test3() {
                return { pk: true };
            }
        }
        expect(ModelUtility.pk(TestModel)).toEqual(['apples', 'test3']);
    });
    it('returns an empty array an invalid model type is specified.', () => {
        expect(ModelUtility.pk()).toEqual([]);
        expect(ModelUtility.pk({})).toEqual([]);
        expect(ModelUtility.pk(true)).toEqual([]);
        expect(ModelUtility.pk(123)).toEqual([]);
    });
});

describe('.override', () => {
    it('calls the request override callback when only the "request" is passed.', () => {
        let reqCb = jest.fn();
        let resCb = jest.fn();
        let myReq = {};
        class TestModel {
            static get $stashku() {
                return { override: { request: reqCb, response: resCb } };
            }
        }
        ModelUtility.override(TestModel, myReq);
        ModelUtility.override(TestModel, myReq, null);
        expect(reqCb).toHaveBeenCalledTimes(2);
        expect(reqCb).toBeCalledWith(myReq);
        expect(resCb).not.toHaveBeenCalled();
    });
    it('calls the response override callback when the "request" and "response" is passed.', () => {
        let reqCb = jest.fn();
        let resCb = jest.fn();
        let myReq = {};
        let myRes = {};
        class TestModel {
            static get $stashku() {
                return { override: { request: reqCb, response: resCb } };
            }
        }
        ModelUtility.override(TestModel, myReq, myRes);
        expect(resCb).toHaveBeenCalledTimes(1);
        expect(resCb).toBeCalledWith(myReq, myRes);
        expect(reqCb).not.toHaveBeenCalled();
    });
    it('returns when an invalid model type is specified.', () => {
        expect(() => ModelUtility.override()).not.toThrow();
        expect(() => ModelUtility.override({})).not.toThrow();
        expect(() => ModelUtility.override(true)).not.toThrow();
        expect(() => ModelUtility.override(123)).not.toThrow();
    });
});

describe('.model', () => {
    it('yields nothing when the model type is invalid.', () => {
        for (let invalid of invalidModelTypeValues) {
            expect(ModelUtility.model(invalid).next().done).toBe(true);
            expect(Array.from(ModelUtility.model(invalid))).toEqual([]);
        }
    });
    it('converts objects to model instances when specified.', () => {
        class TestModel {
            constructor() {
                this.firstName = null;
                this.lastName = null;
            }
            static get firstName() { return 'First_Name'; }
            static get lastName() { return { target: 'Last_Name' }; }
        }
        let iterator = ModelUtility.model(TestModel, {}, null, undefined, { First_Name: 'abc', Last_Name: 123 });
        expect(iterator.next().value).toBeInstanceOf(TestModel);
        expect(iterator.next().value).toBeNull();
        expect(iterator.next().value).toBeNull();
        expect(iterator.next().value).toBeInstanceOf(TestModel);
    });
    it('converts objects to model instances when specified.', () => {
        class TestModel {
            constructor() {
                this.firstName = null;
                this.lastName = null;
            }
            static get firstName() { return 'First_Name'; }
            static get lastName() { return { target: 'Last_Name' }; }
        }
        let iterator = ModelUtility.model(TestModel, {}, { First_Name: 'abc', Last_Name: 123 }, { First_Name: 'def' });
        expect(iterator.next().value).toEqual({});
        expect(iterator.next().value).toEqual({ firstName: 'abc', lastName: 123 });
        expect(iterator.next().value).toEqual({ firstName: 'def' });
    });
    it('runs a transform on the model.', () => {
        class TestModel {
            constructor() {
                this.firstName = null;
                this.lastName = null;
            }
            static get firstName() { return 'First_Name'; }
            static get lastName() { return { target: 'Last_Name', transform: (v) => v ? v : 'default' }; }
        }
        let iterator = ModelUtility.model(TestModel, {}, { First_Name: 'abc', Last_Name: 123 }, { First_Name: 'def' });
        expect(iterator.next().value).toEqual({ lastName: 'default' });
        expect(iterator.next().value).toEqual({ firstName: 'abc', lastName: 123 });
        expect(iterator.next().value).toEqual({ firstName: 'def', lastName: 'default' });
    });
});

describe('.unmodel', () => {
    it('yields nothing when the model type is invalid.', () => {
        for (let invalid of invalidModelTypeValues) {
            expect(ModelUtility.unmodel(invalid).next().done).toBe(true);
            expect(Array.from(ModelUtility.unmodel(invalid))).toEqual([]);
        }
    });
    it('converts model instances back to plain objects.', () => {
        class TestModel {
            constructor() {
                this.firstName = null;
                this.lastName = null;
            }
            static get firstName() { return 'First_Name'; }
            static get lastName() { return { target: 'Last_Name' }; }
        }
        let m = new TestModel();
        m.firstName = 'abc';
        m.lastName = 123;
        let iterator = ModelUtility.unmodel(TestModel, new TestModel(), null, undefined, m);
        expect(iterator.next().value.constructor).toBe(Object);
        expect(iterator.next().value).toBeNull();
        expect(iterator.next().value).toBeNull();
        expect(iterator.next().value.constructor).toBe(Object);
    });
    it('converts objects to model instances when specified.', () => {
        class TestModel {
            constructor() {
                this.firstName = null;
                this.lastName = null;
            }
            static get firstName() { return 'First_Name'; }
            static get lastName() { return { target: 'Last_Name' }; }
        }
        let m = new TestModel();
        m.firstName = 'abc';
        m.lastName = 123;
        let iterator = ModelUtility.unmodel(TestModel, new TestModel(), m);
        expect(iterator.next().value).toEqual({ First_Name: null, Last_Name: null });
        expect(iterator.next().value).toEqual({ First_Name: 'abc', Last_Name: 123 });
    });
    it('runs a transform on the model.', () => {
        class TestModel {
            constructor() {
                this.firstName = null;
                this.lastName = null;
            }
            static get firstName() { return 'First_Name'; }
            static get lastName() { return { target: 'Last_Name', transform: (v) => v ? v : 'default' }; }
        }
        let m = new TestModel();
        m.firstName = 'abc';
        m.lastName = 123;
        let iterator = ModelUtility.unmodel(TestModel, new TestModel(), m);
        expect(iterator.next().value).toEqual({ First_Name: null, Last_Name: 'default' });
        expect(iterator.next().value).toEqual({ First_Name: 'abc', Last_Name: 123 });
    });
});