import OptionsExporter from './options-exporter.js';
import Strings from '../utilities/strings.js';

function TestFunc(a, b, c) {
    if (c === 5) return a + b;
    return a;
}

describe('#toJavaScriptString', () => {
    let exporter = new OptionsExporter();
    let testSelfRefArray = [1, 2];
    testSelfRefArray.push(testSelfRefArray);
    let testSelfRefObj = { a: 123 };
    testSelfRefObj.me = testSelfRefObj;
    let tests = [
        ['an undefined', undefined, 'undefined'],
        ['a floating point number', 123.4412, '123.4412'],
        ['a negative floating point number', -123.4412, '-123.4412'],
        ['an integer number', 123456, '123456'],
        ['a negative integer number', -123456, '-123456'],
        ['an inifite', Infinity, 'Infinity'],
        ['a negative inifite', -Infinity, '-Infinity'],
        ['a true boolean', true, 'true'],
        ['a false boolean', false, 'false'],
        ['a NaN', NaN, 'NaN'],
        ['a string', 'abc', '\'abc\''],
        ['an empty string', '', '\'\''],
        ['a date', new Date('2022-01-01'), 'new Date(\'2022-01-01T00:00:00.000Z\')'],
        ['a buffer', Buffer.from([0x01, 0x02, 0x03, 0xff]), 'Buffer.from(\'AQID/w==\', \'base64\')'],
        ['an empty object', {}, '{}'],
        ['a simple object', { a: 1, b: 'hello', c: false }, '{\n    a: 1,\n    b: \'hello\',\n    c: false\n}'],
        ['a simple lambda', (a, b, c) => 'hello world', '(a, b, c) => \'hello world\''],
        ['a function', TestFunc, 'function TestFunc(a, b, c) {\n  if (c === 5) return a + b;\n  return a;\n}'],
        ['a mixed array of values', [-43.33, 1343, true, NaN, [1, 2, 'bar'], -Infinity, 'hello'], '[\n    -43.33,\n    1343,\n    true,\n    NaN,\n    [\n        1,\n        2,\n        \'bar\'\n    ],\n    -Infinity,\n    \'hello\'\n]'],
        ['a complex array', [[1, Buffer.from([0x16])], TestFunc, 'hello world', [{ a: true }]], '[\n    [\n        1,\n        Buffer.from(\'Fg==\', \'base64\')\n    ],\n    function TestFunc(a, b, c) {\n      if (c === 5) return a + b;\n      return a;\n    },\n    \'hello world\',\n    [\n        {\n            a: true\n        }\n    ]\n]'],
        ['an array with a self-reference', testSelfRefArray, '[\n    1,\n    2,\n    null\n]'],
        ['an object with a self-reference', testSelfRefObj, '{\n    a: 123,\n    me: null\n}'],
    ];
    for (let test of tests) {
        it(`converts ${test[0]} value.`, () => {
            expect(exporter.toJavaScriptString(test[1])).toBe(test[2]);
            expect(exporter.toJavaScriptString(test[1], 1, false)).toBe(Strings.indent(test[2], 1));
            expect(exporter.toJavaScriptString(test[1], 1, true)).toBe(Strings.indent(test[2]));
        });
    }
});