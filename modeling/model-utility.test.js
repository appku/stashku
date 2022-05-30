import jest from 'jest-mock';
import Sort from '../sort.js';
import Filter from '../filter.js';
import ModelUtility from './model-utility.js';

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
    it('returns a map of a class type that extends another.', () => {
        class SuperBaseModelTest {
            static get c() { return 'ccc'; }
        }
        class BaseModelTest extends SuperBaseModelTest {
            constructor() { super(); }
            static get a() { return 'aaa'; }
            static get b() { return 'bbb'; }
        }
        class ModelTest extends BaseModelTest {
            constructor() { super(); }
        }
        let mapping = ModelUtility.map(ModelTest);
        expect(Array.from(mapping.keys())).toEqual(['a', 'b', 'c']);
        expect(Array.from(mapping.values())).toEqual([{ target: 'aaa' }, { target: 'bbb' }, { target: 'ccc' }]);
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
    let resourceProps = [undefined, 'resource', 'name', 'slug', 'plural.name', 'plural.slug'];
    for (let prop of resourceProps) {
        it(`with resource property "${prop}": returns a string when the resource property is present as a string.`, () => {
            for (let m of [class TestModel { }, function TestModel2() { }]) {
                m.$stashku = { resource: 'resource-abc', plural: {} };
                switch (prop) {
                    case 'name': m.$stashku.name = prop + '-abc'; break;
                    case 'slug': m.$stashku.slug = prop + '-abc'; break;
                    case 'plural.name': m.$stashku.plural.name = prop + '-abc'; break;
                    case 'plural.slug': m.$stashku.plural.slug = prop + '-abc'; break;
                }
                expect(ModelUtility.resource(m, null, prop)).toBe((prop ?? 'resource') + '-abc');
            }
        });
        it(`with resource property "${prop}": returns a string value for a specific action on a resource object.`, () => {
            for (let m of [class TestModel { }, function TestModel2() { }]) {
                for (let action of methods) {
                    m.$stashku = { resource: {}, name: {}, slug: {}, plural: { name: {}, slug: {} } };
                    switch (prop) {
                        case 'name': m.$stashku.name[action] = prop + '-abc'; break;
                        case 'slug': m.$stashku.slug[action] = prop + '-abc'; break;
                        case 'plural.name': m.$stashku.plural.name[action] = prop + '-abc'; break;
                        case 'plural.slug': m.$stashku.plural.slug[action] = prop + '-abc'; break;
                        default: m.$stashku.resource[action] = 'resource-abc'; break;
                    }
                    expect(ModelUtility.resource(m, action, prop)).toBe((prop ?? 'resource') + '-abc');
                }
            }
        });
        it(`with resource property "${prop}": falls-back to "all" or "*" property string values when the method property is not present.`, () => {
            for (let m of [class TestModel { }, function TestModel2() { }]) {
                for (let action of methods) {
                    m.$stashku = { resource: {}, name: {}, slug: {}, plural: { name: {}, slug: {} } };
                    switch (prop) {
                        case 'name': m.$stashku.name[action] = prop + '-abc'; break;
                        case 'slug': m.$stashku.slug[action] = prop + '-abc'; break;
                        case 'plural.name': m.$stashku.plural.name[action] = prop + '-abc'; break;
                        case 'plural.slug': m.$stashku.plural.slug[action] = prop + '-abc'; break;
                        default: m.$stashku.resource[action] = 'resource-abc'; break;
                    }
                    for (let fallback of ['all', '*']) {
                        switch (prop) {
                            case 'name': m.$stashku.name[fallback] = prop + '-fallback'; break;
                            case 'slug': m.$stashku.slug[fallback] = prop + '-fallback'; break;
                            case 'plural.name': m.$stashku.plural.name[fallback] = prop + '-fallback'; break;
                            case 'plural.slug': m.$stashku.plural.slug[fallback] = prop + '-fallback'; break;
                            default: m.$stashku.resource[fallback] = 'resource-fallback'; break;
                        }
                        expect(ModelUtility.resource(m, action, prop)).toBe((prop ?? 'resource') + '-abc');
                    }
                }
            }
        });
        it(`with resource property "${prop}": falls-back to the plural of the class/constructor name when no resource property is present.`, () => {
            for (let action of methods) {
                expect(ModelUtility.resource(class TestModel { }, action, prop)).toBe('TestModels');
                expect(ModelUtility.resource(function TestModel2() { }, action, prop)).toBe('TestModel2s');
            }
        });
        it(`with resource property "${prop}": returns null when the resource is a non-supported value.`, () => {
            for (let m of [class TestModel { }, function TestModel2() { }]) {
                for (let action of methods) {
                    for (let invalid of [123, true]) {
                        m.$stashku = { resource: invalid, plural: {} };
                        switch (prop) {
                            case 'name': m.$stashku.name = invalid; break;
                            case 'slug': m.$stashku.slug = invalid; break;
                            case 'plural.name': m.$stashku.plural.name = invalid; break;
                            case 'plural.slug': m.$stashku.plural.slug = invalid; break;
                        }
                        expect(ModelUtility.resource(m, action)).toBeNull();
                    }
                }
            }
        });
        it(`with resource property "${prop}": returns null when the action and fallback properties are not present.`, () => {
            for (let m of [class TestModel { }, function TestModel2() { }]) {
                for (let action of methods) {
                    m.$stashku = { resource: {} };
                    expect(ModelUtility.resource(m, action)).toBeNull();
                }
            }
        });
    }
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
    it('does basic type conversion for definitions with type "Date".', () => {
        class TestModel {
            static get dateCreated() { return { target: 'DateCreated', type: 'Date' }; }
            static get dateDeleted() { return { target: 'DateDeleted', type: 'Date' }; }
        }
        let iterator = ModelUtility.model(TestModel, 'get', { DateCreated: '2022-05-16T21:54:51.955Z', DateDeleted: 1652738691955 });
        let m = iterator.next().value;
        expect(m).toBeInstanceOf(TestModel);
        expect(m.dateCreated).toBeInstanceOf(Date);
        expect(m.dateCreated.toISOString()).toBe('2022-05-16T21:54:51.955Z');
        expect(m.dateDeleted.toISOString()).toBe('2022-05-16T22:04:51.955Z');
    });
    it('does basic type conversion for definitions with type "Boolean".', () => {
        class TestModel {
            static get a() { return { target: 'a', type: 'Boolean' }; }
            static get b() { return { target: 'b', type: 'Boolean' }; }
        }
        let pairs = [
            [1, 0], [5, 0], [0.005, 0],
            ['yes', 'no'], ['YES', 'NO'], ['Yes', 'No'], ['Y', 'N'], ['y', 'n'],
            ['true', 'false'], ['TRUE', 'FALSE'], ['True', 'False'], ['T', 'F'], ['t', 'f']
        ];
        for (let pair of pairs) {
            let iterator = ModelUtility.model(TestModel, 'get', { a: pair[0], b: pair[1] });
            let m = iterator.next().value;
            expect(m).toBeInstanceOf(TestModel);
            expect(typeof m.a).toBe('boolean');
            expect(typeof m.b).toBe('boolean');
            expect(m.a).toBe(true);
            expect(m.b).toBe(false);
        }
    });
    it('does basic type conversion for definitions with type "Number".', () => {
        class TestModel {
            static get a() { return { target: 'a', type: 'Number' }; }
            static get b() { return { target: 'b', type: 'Number' }; }
        }
        let pairs = [
            ['15', '-22.554'],
            ['15.00000', '-22.5540000']
        ];
        for (let pair of pairs) {
            let iterator = ModelUtility.model(TestModel, 'get', { a: pair[0], b: pair[1] });
            let m = iterator.next().value;
            expect(m).toBeInstanceOf(TestModel);
            expect(typeof m.a).toBe('number');
            expect(typeof m.b).toBe('number');
            expect(m.a).toBe(15);
            expect(m.b).toBe(-22.554);
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
    it('correctly omits properties that are marked by boolean to do so.', () => {
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
        test.a = 'hello';
        test.om_any = 'yoyo';
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

describe('.unmodelSorts', () => {
    class TestModel {
        constructor() {
        }
        static get a() { return 'aaa'; }
        static get b() {
            return { target: 'bbbb' };
        }
        static get c() {
            return { target: 'c' };
        }
    }
    it('skips over invalid filter objects.', () => {
        expect(() => ModelUtility.unmodelSorts(null, undefined, 0, new Date())).not.toThrow();
    });
    it('maps modeled properties to target properties', () => {
        let test = [
            new Sort('tacos', Sort.DIR.ASC),
            new Sort('a', Sort.DIR.DESC),
            new Sort('c', Sort.DIR.ASC)
        ];
        ModelUtility.unmodelSorts(TestModel, ...test);
        expect(test[0].property).toBe('tacos');
        expect(test[0].dir).toBe(Sort.DIR.ASC);
        expect(test[1].property).toBe('aaa');
        expect(test[1].dir).toBe(Sort.DIR.DESC);
        expect(test[2].property).toBe('c');
        expect(test[2].dir).toBe(Sort.DIR.ASC);
    });
});

describe('.unmodelFilters', () => {
    class TestModel {
        static get a() { return 'aaa'; }
        static get b() {
            return { target: 'bbbb' };
        }
        static get c() {
            return { target: 'c' };
        }
    }
    it('skips over invalid filter objects.', () => {
        expect(() => ModelUtility.unmodelFilters(null, undefined, 0, new Date())).not.toThrow();
    });
    it('maps modeled properties to target properties', () => {
        let test = [
            Filter.and('test', Filter.OP.EQUALS, 'tacos'),
            Filter.and('a', Filter.OP.GREATERTHAN, 555).and('c', Filter.OP.LESSTHAN, 123),
            Filter.parse('{a} == 55 OR {b} ~~ "soda" OR {c} != 53'),
        ];
        ModelUtility.unmodelFilters(TestModel, ...test);
        expect(test[0].tree).toEqual({
            logic: 'and',
            filters: [{ property: 'test', op: 'eq', value: 'tacos' }]
        });
        expect(test[1].tree).toEqual({
            logic: 'and',
            filters: [
                { property: 'aaa', op: 'gt', value: 555 },
                { property: 'c', op: 'lt', value: 123 }
            ]
        });
        expect(test[2].tree).toEqual({
            logic: 'or',
            filters: [
                { property: 'aaa', op: 'eq', value: 55 },
                { property: 'bbbb', op: 'contains', value: 'soda' },
                { property: 'c', op: 'neq', value: 53 }
            ]
        });
    });
});