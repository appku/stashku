import StringUtility from './string-utility.js';

describe('.escape', () => {
    it('escapes for a URI.', () => {
        expect(StringUtility.escape('why? x=hello world', StringUtility.EscapeMethod.URI)).toBe('why%3F%20x%3Dhello%20world');
    });

    it('escapes for a regular expression.', () => {
        expect(StringUtility.escape('Look! at [this]...', StringUtility.EscapeMethod.REGEXP)).toBe('Look! at \\[this\\]\\.\\.\\.');
    });
});

describe('.some', () => {
    it('matches correctly against a string test.', () => {
        expect(StringUtility.some(null, 'aaa')).toBe(false);
        expect(StringUtility.some(null, null)).toBe(true);
        expect(StringUtility.some('abcDEFG', 'abcDEFG')).toBe(true);
        expect(StringUtility.some('abcDEFG', '123')).toBe(false);
        expect(StringUtility.some('abcDEFG', 'abcdefg', true)).toBe(true);
        expect(StringUtility.some('abcDEFG', 'abcdefg')).toBe(false);
    });
    it('matches correctly against a string array of tests.', () => {
        expect(StringUtility.some(null, [])).toBe(false);
        expect(StringUtility.some(null, ['aaa'])).toBe(false);
        expect(StringUtility.some('abcDEFG', ['abcDEFG'])).toBe(true);
        expect(StringUtility.some('abcDEFG', [])).toBe(false);
        expect(StringUtility.some('abcDEFG', ['123'])).toBe(false);
        expect(StringUtility.some('abcDEFG', ['abcdefg'], true)).toBe(true);
        expect(StringUtility.some('abcDEFG', ['abcdefg'])).toBe(false);
    });
    it('matches correctly against a RegExp test.', () => {
        expect(StringUtility.some(null, /aaa/)).toBe(false);
        expect(StringUtility.some('abcDEFG', /abcDEFG/)).toBe(true);
        expect(StringUtility.some('abcDEFG', /123/)).toBe(false);
        expect(StringUtility.some('abcDEFG', /ABCDEfg/, true)).toBe(true);
        expect(StringUtility.some('abcDEFG', /abcdefg/)).toBe(false);
        expect(StringUtility.some('abcDEFG', /abc/)).toBe(true);
    });
    it('matches correctly against a string array of tests.', () => {
        expect(StringUtility.some(null, [/aaa/])).toBe(false);
        expect(StringUtility.some('abcDEFG', [/abcDEFG/])).toBe(true);
        expect(StringUtility.some('abcDEFG', [/123/])).toBe(false);
        expect(StringUtility.some('abcDEFG', [/abcdefg/], true)).toBe(true);
        expect(StringUtility.some('abcDEFG', [/abcdefg/])).toBe(false);
    });
});

describe('.slugify', () => {
    it('creates valid slugs.', () => {
        expect(StringUtility.slugify('hello WORLD 123...')).toBe('hello-world-123');
        expect(StringUtility.slugify('Lala^**## Stuff')).toBe('lala-stuff');
        expect(StringUtility.slugify('Lala^**## Stuff-today,test')).toBe('lala-stuff-today-test');
        expect(StringUtility.slugify('Lala^**## Stuff-today,test', '|-|')).toBe('lala|-|stuff|-|today|-|test');
        expect(StringUtility.slugify('....hello WORLD 123...', '.',)).toBe('hello.world.123');
        expect(StringUtility.slugify('hello WORLD 123...', '***',)).toBe('hello***world***123');
        expect(StringUtility.slugify('hello-world...', '.',)).toBe('hello.world');
        expect(StringUtility.slugify('helloWorldFox', '_', false, true)).toBe('hello_World_Fox');
        expect(StringUtility.slugify('helloWorldFox', '-', true, true)).toBe('hello-world-fox');
        expect(StringUtility.slugify('HelloWorldFox', '-', false, true)).toBe('Hello-World-Fox');
        expect(StringUtility.slugify('Hello_World_Fox', '-', false, true)).toBe('Hello-World-Fox');
        expect(StringUtility.slugify('Hello_WORLD_Fox', '-', false, true)).toBe('Hello-WORLD-Fox');
        expect(StringUtility.slugify('HelloWORLDFox', '-', false, true)).toBe('Hello-WORLD-Fox');
        expect(StringUtility.slugify('HelloToTHEA-team', '-', false, true)).toBe('Hello-To-THE-A-team');
        expect(StringUtility.slugify('APPEND_world', '-', false, true)).toBe('APPEND-world');
        expect(StringUtility.slugify('Aàáäâyeeèéóöôùúü Thats nuts.')).toBe('aaaaayeeeeooouuu-thats-nuts');
    });
});

describe('.camelify', () => {
    it('creates valid camel-case strings.', () => {
        expect(StringUtility.camelify('ID')).toBe('ID');
        expect(StringUtility.camelify('UUID')).toBe('UUID');
        expect(StringUtility.camelify('GUID')).toBe('GUID');
        expect(StringUtility.camelify('Id')).toBe('ID');
        expect(StringUtility.camelify('uuID')).toBe('UUID');
        expect(StringUtility.camelify('GUId')).toBe('GUID');
        expect(StringUtility.camelify('hello WORLD 123...')).toBe('helloWorld123');
        expect(StringUtility.camelify('Lala^**## Stuff')).toBe('lalaStuff');
        expect(StringUtility.camelify('the quick brown fox')).toBe('theQuickBrownFox');
        expect(StringUtility.camelify('the quick brown fox', false)).toBe('theQuickBrownFox');
        expect(StringUtility.camelify('Order-id')).toBe('orderID');
        expect(StringUtility.camelify('Order-guid')).toBe('orderGUID');
        expect(StringUtility.camelify('Order-uuid')).toBe('orderUUID');
        expect(StringUtility.camelify('OrderID')).toBe('orderID');
        expect(StringUtility.camelify('Order_ID')).toBe('orderID');
        expect(StringUtility.camelify('Order_Guid')).toBe('orderGUID');
        expect(StringUtility.camelify('Order_Uuid')).toBe('orderUUID');
        expect(StringUtility.camelify('SQL server')).toBe('sqlServer');
        expect(StringUtility.camelify('SQL-server')).toBe('sqlServer');
        expect(StringUtility.camelify('SQL_Server')).toBe('sqlServer');
        expect(StringUtility.camelify('AddressEntityTypesX3')).toBe('addressEntityTypesX3');
        expect(StringUtility.camelify('vServerStorage')).toBe('vServerStorage');
        expect(StringUtility.camelify('Crazy-letters:áäâyeeèéóöôùú')).toBe('crazyLettersAAAYeeeEOOOUU');
        expect(StringUtility.camelify('a,bunch.of.value^together')).toBe('aBunchOfValueTogether');
        expect(StringUtility.camelify('Comma,sEParated,values')).toBe('commaSEParatedValues');
        expect(StringUtility.camelify('dot.notation.knows.BEST...right')).toBe('dotNotationKnowsBestRight');
        expect(StringUtility.camelify('[john].[jumped[')).toBe('johnJumped');
        expect(StringUtility.camelify('[acro.NYM].[OK[')).toBe('acroNymOK');
        expect(StringUtility.camelify(null)).toBe(null);
        expect(StringUtility.camelify('')).toBe('');
    });
    it('creates valid pascal-case strings.', () => {
        expect(StringUtility.camelify('ID', true)).toBe('ID');
        expect(StringUtility.camelify('UUID', true)).toBe('UUID');
        expect(StringUtility.camelify('GUID', true)).toBe('GUID');
        expect(StringUtility.camelify('Id', true)).toBe('ID');
        expect(StringUtility.camelify('uuID', true)).toBe('UUID');
        expect(StringUtility.camelify('GUId', true)).toBe('GUID');
        expect(StringUtility.camelify('hello WORLD 123...', true)).toBe('HelloWorld123');
        expect(StringUtility.camelify('Lala^**## Stuff', true)).toBe('LalaStuff');
        expect(StringUtility.camelify('the quick brown fox', true)).toBe('TheQuickBrownFox');
        expect(StringUtility.camelify('Order-id', true)).toBe('OrderID');
        expect(StringUtility.camelify('Order-guid', true)).toBe('OrderGUID');
        expect(StringUtility.camelify('Order-uuid', true)).toBe('OrderUUID');
        expect(StringUtility.camelify('OrderID', true)).toBe('OrderID');
        expect(StringUtility.camelify('Order_ID', true)).toBe('OrderID');
        expect(StringUtility.camelify('Order_Guid', true)).toBe('OrderGUID');
        expect(StringUtility.camelify('Order_Uuid', true)).toBe('OrderUUID');
        expect(StringUtility.camelify('SQL server', true)).toBe('SqlServer');
        expect(StringUtility.camelify('SQL-server', true)).toBe('SqlServer');
        expect(StringUtility.camelify('SQL_Server', true)).toBe('SqlServer');
        expect(StringUtility.camelify('AddressEntityTypesX3', true)).toBe('AddressEntityTypesX3');
        expect(StringUtility.camelify('vServerStorage', true)).toBe('VServerStorage');
        expect(StringUtility.camelify('Crazy-letters:áäâyeeèéóöôùú', true)).toBe('CrazyLettersAAAYeeeEOOOUU');
        expect(StringUtility.camelify('a,bunch.of.value^together', true)).toBe('ABunchOfValueTogether');
        expect(StringUtility.camelify('Comma,sEParated,values', true)).toBe('CommaSEParatedValues');
        expect(StringUtility.camelify('dot.notation.knows.BEST...right', true)).toBe('DotNotationKnowsBestRight');
        expect(StringUtility.camelify('[john].[jumped[', true)).toBe('JohnJumped');
        expect(StringUtility.camelify('[acro.NYM].[OK[', true)).toBe('AcroNymOK');
        expect(StringUtility.camelify(null, true)).toBe(null);
        expect(StringUtility.camelify('', true)).toBe('');
    });
});

describe('.indent', () => {
    it('indents a single line.', () => {
        expect(StringUtility.indent('hello')).toBe('    hello');
        expect(StringUtility.indent('hello', 0, 0, '---')).toBe('---hello');
    });
    it('indents all lines.', () => {
        expect(StringUtility.indent('hello\nworld\n    howdy')).toBe('    hello\n    world\n        howdy');
        expect(StringUtility.indent('hello\nworld\n    howdy', null, null, '♡♡♡♡')).toBe('♡♡♡♡hello\n♡♡♡♡world\n♡♡♡♡    howdy');
    });
    it('indents specific lines.', () => {
        expect(StringUtility.indent('hello\nworld\n    howdy', 2)).toBe('hello\nworld\n        howdy');
        expect(StringUtility.indent('hello\nworld\n    howdy', 1, 1)).toBe('hello\n    world\n    howdy');
        expect(StringUtility.indent('hello\nworld\n    howdy', 1, 2, '**')).toBe('hello\n**world\n**    howdy');
    });
});