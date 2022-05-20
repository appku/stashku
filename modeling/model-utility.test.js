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

describe('.formatPropName', () => {
    it('returns a formatted camelCase name when given dirty values.', () => {
        expect(ModelUtility.formatPropName('test-prop')).toBe('testProp');
        expect(ModelUtility.formatPropName('The Quick brown fox-jumped.')).toBe('theQuickBrownFoxJumped');
        expect(ModelUtility.formatPropName('[john].[jumped[')).toBe('johnJumped');
        expect(ModelUtility.formatPropName('[acro.NYM].[OK[')).toBe('acroNYMOK');
    });
});

describe('.formatModelName', () => {
    it('returns a formatted pascalCase name when given dirty values.', () => {
        expect(ModelUtility.formatModelName('test-yoda')).toBe('TestYodaModel');
        expect(ModelUtility.formatModelName('The Quick brown fox-jumped.')).toBe('TheQuickBrownFoxJumpedModel');
        expect(ModelUtility.formatModelName('[john].[jumped[')).toBe('JohnJumpedModel');
        expect(ModelUtility.formatModelName('[acro.NYM].[OK[')).toBe('AcroNYMOKModel');
    });
    it('returns a formatted pascalCase name when given dirty values with a different suffix.', () => {
        expect(ModelUtility.formatModelName('test-yoda')).toBe('TestYodaModel');
        expect(ModelUtility.formatModelName('test-yoda', 'Data')).toBe('TestYodaData');
        expect(ModelUtility.formatModelName('test-yoda', null)).toBe('TestYoda');
        expect(ModelUtility.formatModelName('test-yoda', '')).toBe('TestYoda');
    });
    it('strips out database-schema-like prefixes by default.', () => {
        expect(ModelUtility.formatModelName('dbo.test-yoda')).toBe('TestYodaModel');
        expect(ModelUtility.formatModelName('dbo.Contact_Records')).toBe('ContactRecordModel');
        expect(ModelUtility.formatModelName('rpt.Contact_Records')).toBe('ContactRecordModel');
        expect(ModelUtility.formatModelName('etl.Contact_Records')).toBe('ContactRecordModel');
        expect(ModelUtility.formatModelName('etl.ETLLog')).toBe('ETLLogModel');
        expect(ModelUtility.formatModelName('rpt.Rpt.Log')).toBe('RptLogModel');
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

describe('.schema', () => {
    it('throws a REST error when given an invalid model type.', () => {
        for (let i = 4; i < invalidModelTypeValues.length; i++) {
            expect(() => ModelUtility.schema(invalidModelTypeValues[i])).toThrow(/modelType/);
        }
    });
    it('returns a schema object representing the information about the model.', () => {
        class TestModel {
            static get FirstName() { return 'First_Name'; }

            static get $stashku() {
                return { resource: 'test' };
            }
        }
        expect(ModelUtility.schema(TestModel).FirstName).toEqual({ target: 'First_Name' });
        expect(ModelUtility.schema(TestModel).$stashku).toEqual({ resource: 'test' });
    });
    it('returns a schema object and generates the $stashku object.', () => {
        class TestModel {
            static get FirstName() { return 'First_Name'; }
        }
        expect(ModelUtility.schema(TestModel).FirstName).toEqual({ target: 'First_Name' });
        expect(ModelUtility.schema(TestModel).$stashku).toEqual({ resource: 'TestModels' });
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
    it('returns a string value for a specific action on a resource object.', () => {
        for (let m of [class TestModel { }, function TestModel2() { }]) {
            for (let action of methods) {
                m.$stashku = { resource: {} };
                m.$stashku.resource[action] = 'abc';
                expect(ModelUtility.resource(m, action)).toBe('abc');
            }
        }
    });
    it('falls-back to "all" or "*" property string values when the method property is not present.', () => {
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
    it('falls-back to the plural of the class/constructor name when no resource property is present.', () => {
        for (let action of methods) {
            expect(ModelUtility.resource(class TestModel { }, action)).toBe('TestModels');
            expect(ModelUtility.resource(function TestModel2() { }, action)).toBe('TestModel2s');
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
    it('uses a target name if it is present.', () => {
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

describe('.generateModelType', () => {
    it('throws an error if the "typeName" argument is missing.', () => {
        expect(() => { ModelUtility.generateModelType('', new Map(), {}); }).toThrow(/resource.+required/);
        expect(() => { ModelUtility.generateModelType(null, new Map(), {}); }).toThrow(/resource.+required/);
        expect(() => { ModelUtility.generateModelType(undefined, new Map(), {}); }).toThrow(/resource.+required/);
    });
    it('throws an error if the "properties" argument is missing.', () => {
        expect(() => { ModelUtility.generateModelType('Test', null, {}); }).toThrow(/properties.+required/);
        expect(() => { ModelUtility.generateModelType('Test', undefined, {}); }).toThrow(/properties.+required/);
    });
    it('throws an error if the "properties" argument is not a Map instance.', () => {
        expect(() => { ModelUtility.generateModelType('Test', new Date(), {}); }).toThrow(/properties.+Map/);
        expect(() => { ModelUtility.generateModelType('Test', [[], []], {}); }).toThrow(/properties.+Map/);
        expect(() => { ModelUtility.generateModelType('Test', 'hello', {}); }).toThrow(/properties.+Map/);
        expect(() => { ModelUtility.generateModelType('Test', true, {}); }).toThrow(/properties.+Map/);
    });
    let properties = new Map(Object.entries({
        a: {},
        b: { pk: false },
        c: null,
        d: { target: 'z', default: 4949, required: false },
        e: { pk: true }
    }));
    it('returns a class type with the proper configuration.', () => {
        let configs = [null, { resource: 'testa-bits' }];
        for (let mc of configs) {
            let dynamicModel = ModelUtility.generateModelType('testa-bits', properties, mc);
            expect(dynamicModel).toBeTruthy();
            expect(dynamicModel.name).toBe('TestaBitModel');
            expect(dynamicModel.$stashku.resource).toBe('testa-bits');
            expect(dynamicModel.A).toEqual({});
            expect(dynamicModel.B).toEqual({ pk: false });
            expect(dynamicModel.C).toEqual({});
            expect(dynamicModel.D).toEqual({ target: 'z', default: 4949, required: false });
            expect(dynamicModel.E).toEqual({ pk: true });
            expect(dynamicModel.$stashku.resource).toBe('testa-bits');
            expect(dynamicModel.$stashku.name).toBe('TestaBit');
            expect(dynamicModel.$stashku.slug).toBe('testa-bit');
            expect(dynamicModel.$stashku.plural.name).toBe('TestaBits');
            expect(dynamicModel.$stashku.plural.slug).toBe('testa-bits');
        }
    });
    it('returns a class type that constructs with defined properties.', () => {
        let mc = { resource: 'testa-bits' };
        let TestaBitModel = ModelUtility.generateModelType('testa-bits', properties, mc);
        let model = new TestaBitModel();
        expect(model).toBeInstanceOf(TestaBitModel);
        expect(model.A).toBe(null);
        expect(model.B).toBe(null);
        expect(model.C).toBe(null);
        expect(model.D).toBe(4949);
        expect(model.E).toBe(null);
    });
    it('returns a class type with an auto-generated $stashku configuration.', () => {
        let TestaBitModel = ModelUtility.generateModelType('contact_Records', properties);
        expect(TestaBitModel.$stashku.resource).toBe('contact_Records');
        expect(TestaBitModel.$stashku.name).toBe('ContactRecord');
        expect(TestaBitModel.$stashku.slug).toBe('contact-record');
        expect(TestaBitModel.$stashku.plural.name).toBe('ContactRecords');
        expect(TestaBitModel.$stashku.plural.slug).toBe('contact-records');
    });
    it('returns a class type with and auto-fills missing $stashku configuration names.', () => {
        let TestaBitModel = ModelUtility.generateModelType('horse_Records', properties, {
            name: 'Banana',
            plural: {
                slug: 'dancing-frogs'
            }
        });
        expect(TestaBitModel.$stashku.resource).toBe('horse_Records');
        expect(TestaBitModel.$stashku.name).toBe('Banana');
        expect(TestaBitModel.$stashku.slug).toBe('banana');
        expect(TestaBitModel.$stashku.plural.name).toBe('Bananas');
        expect(TestaBitModel.$stashku.plural.slug).toBe('dancing-frogs');
    });
    it('retains properties that may collide through pascal-case conversion..', () => {
        let TestaBitModel = ModelUtility.generateModelType('Contacts', new Map([
            ['first-name', { target: 'first-name' }],
            ['first_name', { target: 'first_name' }],
            ['first name', { target: 'first name' }],
            ['FIRSTname', { target: 'firstname' }],
        ]), {
            name: 'ContactRecordModel'
        });
        expect(TestaBitModel.$stashku.resource).toBe('Contacts');
        expect(TestaBitModel.$stashku.name).toBe('ContactRecordModel');
        expect(TestaBitModel.$stashku.slug).toBe('contact-record-model');
        expect(TestaBitModel.$stashku.plural.name).toBe('ContactRecordModels');
        expect(TestaBitModel.$stashku.plural.slug).toBe('contact-record-models');
        expect(TestaBitModel.FIRSTname).toEqual({ target: 'firstname' });
        expect(TestaBitModel.FirstName).toEqual({ target: 'first name' });
        expect(TestaBitModel.first_name).toEqual({ target: 'first_name' });
        expect(TestaBitModel['first-name']).toEqual({ target: 'first-name' });
    });
});

describe('.model', () => {
    it('throws error when the model type is invalid.', () => {
        for (let invalid of invalidModelTypeValues) {
            expect(() => ModelUtility.model(invalid, 'get').next().done()).toThrow(/model/);
        }
    });
    it('throws error when the method is missing.', () => {
        expect(() => ModelUtility.model(function MyModel() { }).next().done()).toThrow(/method/);
        expect(() => ModelUtility.model(function MyModel() { }, '').next().done()).toThrow(/method/);
        expect(() => ModelUtility.model(function MyModel() { }, null).next().done()).toThrow(/method/);
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
        let iterator = ModelUtility.model(TestModel, 'get', {}, null, undefined, { First_Name: 'abc', Last_Name: 123 });
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
        let iterator = ModelUtility.model(TestModel, 'get', { First_Name: null }, { First_Name: 'abc', Last_Name: 123 }, { First_Name: 'def', Last_Name: null });
        expect(iterator.next().value).toEqual({ firstName: null });
        expect(iterator.next().value).toEqual({ firstName: 'abc', lastName: 123 });
        expect(iterator.next().value).toEqual({ firstName: 'def', lastName: null });
    });
    it('runs a transform on the model.', () => {
        class TestModel {
            constructor() {
                this.firstName = null;
                this.lastName = null;
            }
            static get firstName() { return 'First_Name'; }
            static get lastName() { return { target: 'Last_Name', transform: (k, v) => v ? v : 'default' }; }
        }
        let iterator = ModelUtility.model(TestModel, 'get', { First_Name: null }, { First_Name: 'abc', Last_Name: 123 }, { First_Name: 'def', Last_Name: null });
        expect(iterator.next().value).toEqual({ firstName: null, lastName: 'default' });
        expect(iterator.next().value).toEqual({ firstName: 'abc', lastName: 123 });
        expect(iterator.next().value).toEqual({ firstName: 'def', lastName: 'default' });
    });
    it('skips constructing models over objects that are already instances of the model type', () => {
        class TestModel {
            constructor() {
                this.A = null;
            }
            static get A() { return 'AAA'; }
        }
        let m = new TestModel();
        m.A = 'yoyo';
        m.B = 'b';
        let iterator = ModelUtility.model(TestModel, 'get', { AAA: null }, m, { AAA: 'abc', bogus: 123 });
        expect(iterator.next().value).toEqual({ A: null });
        expect(iterator.next().value).toEqual({ A: 'yoyo', B: 'b' });
        expect(iterator.next().value).toEqual({ A: 'abc' });
    });
    it('correctly omits properties that are marked so.', () => {
        class TestModel {
            constructor() {
            }
            static get a() { return 'a'; }
            static get om_any() { return { target: 'om_any', omit: true }; }
        }
        let omits = ['all', 'get', 'put', 'post', 'patch', 'delete', 'options'];
        for (let i = 0; i <= omits.length; i++) {
            let omit = {};
            omit[omits[i]] = true;
            TestModel[`om_${omits[i]}`] = { target: `om_${omits[i]}`, omit: omit };
        }
        let test = { a: 'hello', om_any: 'yoyo' };
        for (let i = 0; i < omits.length; i++) {
            test[`om_${omits[i]}`] = `hello ${i}`;
        }
        for (let i = 0; i < omits.length; i++) {
            let iterator = ModelUtility.model(TestModel, omits[i], test);
            let nextModel = iterator.next().value;
            expect(nextModel).toBeInstanceOf(TestModel);
            let sample = Object.assign({}, test);
            delete sample.om_any;
            delete sample.om_all;
            delete sample[`om_${omits[i]}`];
            expect(nextModel).toEqual(sample);
        }
    });
    it('correctly omits properties determined by callback function.', () => {
        class TestModel {
            constructor() {
            }
            static get a() { return 'a'; }
            static get b() {
                return { target: 'b', omit: () => true };
            }
            static get c() {
                return { target: 'c', omit: () => false };
            }
        }
        let iterator = ModelUtility.model(TestModel, 'get', { a: 'hello', b: 'world', c: '!!!' });
        let nextModel = iterator.next().value;
        expect(nextModel).toBeInstanceOf(TestModel);
        expect(nextModel.a).toBe('hello');
        expect(nextModel.b).toBeUndefined();
        expect(nextModel.c).toBe('!!!');
    });
});

describe('.unmodel', () => {
    it('throws error when the model type is invalid.', () => {
        for (let invalid of invalidModelTypeValues) {
            expect(() => ModelUtility.unmodel(invalid, 'post').next().done()).toThrow(/model/);
        }
    });
    it('throws error when the method is missing.', () => {
        expect(() => ModelUtility.unmodel(function MyModel() { }).next().done()).toThrow(/method/);
        expect(() => ModelUtility.unmodel(function MyModel() { }, '').next().done()).toThrow(/method/);
        expect(() => ModelUtility.unmodel(function MyModel() { }, null).next().done()).toThrow(/method/);
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
        let iterator = ModelUtility.unmodel(TestModel, 'post', new TestModel(), null, undefined, m);
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
        let iterator = ModelUtility.unmodel(TestModel, 'post', new TestModel(), m);
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
            static get lastName() { return { target: 'Last_Name', transform: (k, v) => v ? v : 'default' }; }
        }
        let m = new TestModel();
        m.firstName = 'abc';
        m.lastName = 123;
        let iterator = ModelUtility.unmodel(TestModel, 'post', new TestModel(), m);
        expect(iterator.next().value).toEqual({ First_Name: null, Last_Name: 'default' });
        expect(iterator.next().value).toEqual({ First_Name: 'abc', Last_Name: 123 });
    });
    it('skips constructing objects over models that are not instances of the model type', () => {
        class TestModel {
            constructor() {
                this.A = null;
            }
            static get A() { return 'AAA'; }
        }
        let m = new TestModel();
        m.A = 'yoyo';
        m.B = 'b';
        let iterator = ModelUtility.unmodel(TestModel, 'get', { AAA: null }, m, { AAA: 'abc', bogus: 123 });
        expect(iterator.next().value).toEqual({ AAA: null });
        expect(iterator.next().value).toEqual({ AAA: 'yoyo' });
        expect(iterator.next().value).toEqual({ AAA: 'abc', bogus: 123 });
    });
    it('correctly omits properties that are marked so.', () => {
        class TestModel {
            constructor() {
            }
            static get a() { return 'a'; }
            static get om_any() { return { target: 'om_any', omit: true }; }
        }
        let omits = ['all', 'get', 'put', 'post', 'patch', 'delete', 'options'];
        for (let i = 0; i <= omits.length; i++) {
            let omit = {};
            omit[omits[i]] = true;
            TestModel[`om_${omits[i]}`] = { target: `om_${omits[i]}`, omit: omit };
        }
        let test = new TestModel();
        test.a= 'hello';
        test.om_any ='yoyo';
        for (let i = 0; i < omits.length; i++) {
            test[`om_${omits[i]}`] = `hello ${i}`;
        }
        for (let i = 0; i < omits.length; i++) {
            let iterator = ModelUtility.unmodel(TestModel, omits[i], test);
            let nextModel = iterator.next().value;
            expect(nextModel.constructor).toBeInstanceOf(Object);
            let sample = Object.assign({}, test);
            delete sample.om_any;
            delete sample.om_all;
            delete sample[`om_${omits[i]}`];
            expect(nextModel).toEqual(sample);
        }
    });
    it('correctly omits properties determined by callback function.', () => {
        class TestModel {
            constructor() {
            }
            static get a() { return 'a'; }
            static get b() {
                return { target: 'b', omit: () => true };
            }
            static get c() {
                return { target: 'c', omit: () => false };
            }
        }
        let m = new TestModel();
        m.a = 'hello';
        m.b = 'world';
        m.c = '!!!';
        let iterator = ModelUtility.unmodel(TestModel, 'get', m);
        let nextModel = iterator.next().value;
        expect(nextModel.constructor).toBe(Object);
        expect(nextModel.a).toBe('hello');
        expect(nextModel.b).toBeUndefined();
        expect(nextModel.c).toBe('!!!');
    });
});