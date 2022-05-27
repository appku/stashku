import ModelGenerator from './model-generator.js';

describe('.formatPropName', () => {
    it('returns a formatted camelCase name when given dirty values.', () => {
        expect(ModelGenerator.formatPropName('test-prop')).toBe('testProp');
        expect(ModelGenerator.formatPropName('The Quick brown fox-jumped.')).toBe('theQuickBrownFoxJumped');
        expect(ModelGenerator.formatPropName('[john].[jumped[')).toBe('johnJumped');
        expect(ModelGenerator.formatPropName('[acro.NYM].[OK[')).toBe('acroNYMOK');
    });
});

describe('.formatModelName', () => {
    it('returns a formatted pascalCase name when given dirty values.', () => {
        expect(ModelGenerator.formatModelName('test-yoda')).toBe('TestYodaModel');
        expect(ModelGenerator.formatModelName('The Quick brown fox-jumped.')).toBe('TheQuickBrownFoxJumpedModel');
        expect(ModelGenerator.formatModelName('[john].[jumped[')).toBe('JohnJumpedModel');
        expect(ModelGenerator.formatModelName('[acro.NYM].[OK[')).toBe('AcroNYMOKModel');
        expect(ModelGenerator.formatModelName('[dbo].[ContactRecords]')).toBe('ContactRecordModel');
        expect(ModelGenerator.formatModelName('{{ContactRecords}}')).toBe('ContactRecordModel');
    });
    it('returns a formatted pascalCase name when given dirty values with a different suffix.', () => {
        expect(ModelGenerator.formatModelName('test-yoda')).toBe('TestYodaModel');
        expect(ModelGenerator.formatModelName('test-yoda', 'Data')).toBe('TestYodaData');
        expect(ModelGenerator.formatModelName('test-yoda', null)).toBe('TestYoda');
        expect(ModelGenerator.formatModelName('test-yoda', '')).toBe('TestYoda');
    });
    it('strips out database-schema-like prefixes by default.', () => {
        expect(ModelGenerator.formatModelName('dbo.test-yoda')).toBe('TestYodaModel');
        expect(ModelGenerator.formatModelName('dbo.Contact_Records')).toBe('ContactRecordModel');
        expect(ModelGenerator.formatModelName('rpt.Contact_Records')).toBe('ContactRecordModel');
        expect(ModelGenerator.formatModelName('etl.Contact_Records')).toBe('ContactRecordModel');
        expect(ModelGenerator.formatModelName('etl.ETLLog')).toBe('ETLLogModel');
        expect(ModelGenerator.formatModelName('rpt.Rpt.Log')).toBe('RptLogModel');
        expect(ModelGenerator.formatModelName('[dbo].test-yoda')).toBe('TestYodaModel');
        expect(ModelGenerator.formatModelName('[dbo].Contact_Records')).toBe('ContactRecordModel');
        expect(ModelGenerator.formatModelName('[rpt].Contact_Records')).toBe('ContactRecordModel');
        expect(ModelGenerator.formatModelName('[etl].Contact_Records')).toBe('ContactRecordModel');
        expect(ModelGenerator.formatModelName('[etl].ETLLog')).toBe('ETLLogModel');
        expect(ModelGenerator.formatModelName('[rpt].Rpt.Log')).toBe('RptLogModel');
    });
});

describe('.generateModelType', () => {
    it('throws an error if the "typeName" argument is missing.', () => {
        expect(() => { ModelGenerator.generateModelType('', new Map(), {}); }).toThrow(/resource.+required/);
        expect(() => { ModelGenerator.generateModelType(null, new Map(), {}); }).toThrow(/resource.+required/);
        expect(() => { ModelGenerator.generateModelType(undefined, new Map(), {}); }).toThrow(/resource.+required/);
    });
    it('throws an error if the "properties" argument is missing.', () => {
        expect(() => { ModelGenerator.generateModelType('Test', null, {}); }).toThrow(/properties.+required/);
        expect(() => { ModelGenerator.generateModelType('Test', undefined, {}); }).toThrow(/properties.+required/);
    });
    it('throws an error if the "properties" argument is not a Map instance.', () => {
        expect(() => { ModelGenerator.generateModelType('Test', new Date(), {}); }).toThrow(/properties.+Map/);
        expect(() => { ModelGenerator.generateModelType('Test', [[], []], {}); }).toThrow(/properties.+Map/);
        expect(() => { ModelGenerator.generateModelType('Test', 'hello', {}); }).toThrow(/properties.+Map/);
        expect(() => { ModelGenerator.generateModelType('Test', true, {}); }).toThrow(/properties.+Map/);
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
            let dynamicModel = ModelGenerator.generateModelType('testa-bits', properties, mc);
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
        let TestaBitModel = ModelGenerator.generateModelType('testa-bits', properties, mc);
        let model = new TestaBitModel();
        expect(model).toBeInstanceOf(TestaBitModel);
        expect(model.A).toBe(null);
        expect(model.B).toBe(null);
        expect(model.C).toBe(null);
        expect(model.D).toBe(4949);
        expect(model.E).toBe(null);
    });
    it('returns a class type with an auto-generated $stashku configuration.', () => {
        let TestaBitModel = ModelGenerator.generateModelType('contact_Records', properties);
        expect(TestaBitModel.$stashku.resource).toBe('contact_Records');
        expect(TestaBitModel.$stashku.name).toBe('ContactRecord');
        expect(TestaBitModel.$stashku.slug).toBe('contact-record');
        expect(TestaBitModel.$stashku.plural.name).toBe('ContactRecords');
        expect(TestaBitModel.$stashku.plural.slug).toBe('contact-records');
    });
    it('returns a class type with and auto-fills missing $stashku configuration names.', () => {
        let TestaBitModel = ModelGenerator.generateModelType('horse_Records', properties, {
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
        let TestaBitModel = ModelGenerator.generateModelType('Contacts', new Map([
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