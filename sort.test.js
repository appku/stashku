import Sort from './sort.js';

describe('#constructor', () => {
    it('sets a property name if given', () => {
        expect(new Sort('test').property).toBe('test');
    });
    it('sets a property name and sort order if given', () => {
        expect(new Sort('test', Sort.DIR.DESC).property).toBe('test');
        expect(new Sort('test', Sort.DIR.DESC).dir).toBe(Sort.DIR.DESC);
    });
    it('sets the default sort direction to ascending.', () => {
        expect(new Sort().dir).toBe(Sort.DIR.ASC);
    });
});

describe('#toString', () => {
    it('returns a property and direction when set.', () => {
        expect(new Sort('test', Sort.DIR.ASC).toString()).toBe('{test} ASC');
    });
    it('returns a property when set but direction is missing.', () => {
        let s = new Sort('test');
        s.dir = null;
        expect(s.toString()).toBe('{test}');
    });
    it('returns a blank string when the property is missing.', () => {
        expect(new Sort('', Sort.DIR.ASC).toString()).toBe('');
        expect(new Sort(null, Sort.DIR.ASC).toString()).toBe('');
        expect(new Sort(undefined, Sort.DIR.DESC).toString()).toBe('');
    });
});

describe('.asc', () => {
    it('returns a new Sort instance sorted in ASC direction.', () => {
        expect(Sort.asc('abc').property).toBe('abc');
        expect(Sort.asc('abc').dir).toBe(Sort.DIR.ASC);
    });
});

describe('.desc', () => {
    it('returns a new Sort instance sorted in DESC direction.', () => {
        expect(Sort.desc('abc').property).toBe('abc');
        expect(Sort.desc('abc').dir).toBe(Sort.DIR.DESC);
    });
});

describe('.parse', () => {
    it('returns a new Sort instance created from just a property name.', () => {
        let tries = [
            { input: '{test}', expected: { property: 'test', dir: Sort.DIR.ASC } },
            { input: '{test} desc', expected: { property: 'test', dir: Sort.DIR.DESC } },
            { input: '{test} DESC', expected: { property: 'test', dir: Sort.DIR.DESC } },
            { input: '{test} asc', expected: { property: 'test', dir: Sort.DIR.ASC } },
            { input: '{test} ASC', expected: { property: 'test', dir: Sort.DIR.ASC } }
        ];
        for (let t of tries) {
            let s = Sort.parse(t.input);
            expect(s).toBeInstanceOf(Sort);
            expect(s.property).toBe(t.expected.property);
            expect(s.dir).toBe(t.expected.dir);
        }
    });
    it('returns an array of sorts if the string is comma-seperated', () => {
        let tries = [
            {
                input: '{test}, {moose}, {rest}',
                expected: [
                    { property: 'test', dir: Sort.DIR.ASC },
                    { property: 'moose', dir: Sort.DIR.ASC },
                    { property: 'rest', dir: Sort.DIR.ASC }
                ]
            },
            {
                input: '{test} desc, {moose} asc, {rest} desc',
                expected: [
                    { property: 'test', dir: Sort.DIR.DESC },
                    { property: 'moose', dir: Sort.DIR.ASC },
                    { property: 'rest', dir: Sort.DIR.DESC }
                ]
            },
            {
                input: '{test} desc, {moose}',
                expected: [
                    { property: 'test', dir: Sort.DIR.DESC },
                    { property: 'moose', dir: Sort.DIR.ASC }
                ]
            }
        ];
        for (let t of tries) {
            let s = Sort.parse(t.input);
            expect(s).toBeInstanceOf(Array);
            expect(s).toEqual(t.expected);
            expect(s.length).toBeGreaterThan(1);
        }
    });
    it('Returns null if unparsable.', () => {
        let tries = [null, undefined, '', 0, false];
        for (let t of tries) {
            let s = Sort.parse(t);
            expect(s).toBeNull();
        }
    });
});

describe('._tokenize', () => {
    it('retrieves properties, order, and separator tokens.', () => {
        let tests = [
            {
                input: '{Bob}',
                expected: [
                    { type: 'property', value: 'Bob' }
                ]
            },
            {
                input: '{\\{Bobby Tables\\}}',
                expected: [
                    { type: 'property', value: '{Bobby Tables}' }
                ]
            },
            {
                input: '{Bob},  {Susan} desc, {Micael} asc',
                expected: [
                    { type: 'property', value: 'Bob' },
                    { type: 'separator' },
                    { type: 'property', value: 'Susan' },
                    { type: 'order', value: Sort.DIR.DESC },
                    { type: 'separator' },
                    { type: 'property', value: 'Micael' },
                    { type: 'order', value: Sort.DIR.ASC },
                ]
            },
        ];
        for (let t of tests) {
            let s = Sort._tokenize(t.input);
            expect(s).toBeInstanceOf(Array);
            expect(s).toEqual(t.expected);
        }
    });
    it('throws SyntaxError on invalid or unescaped character in the string.', () => {
        expect(() => Sort._tokenize('{Marshmellow} mellon')).toThrow(SyntaxError);
        expect(() => Sort._tokenize('{Marshmellow} ||')).toThrow(SyntaxError);
    });
});