import Strings from './strings.js';

describe('.escape', () => {
    it('escapes for a URI.', () => {
        expect(Strings.escape('why? x=hello world', Strings.EscapeMethod.URI)).toBe('why%3F%20x%3Dhello%20world');
    });

    it('escapes for a regular expression.', () => {
        expect(Strings.escape('Look! at [this]...', Strings.EscapeMethod.REGEXP)).toBe('Look! at \\[this\\]\\.\\.\\.');
    });
});

describe('.some', () => {
    it('matches correctly against a string test.', () => {
        expect(Strings.some(null, 'aaa')).toBe(false);
        expect(Strings.some(null, null)).toBe(true);
        expect(Strings.some('abcDEFG', 'abcDEFG')).toBe(true);
        expect(Strings.some('abcDEFG', '123')).toBe(false);
        expect(Strings.some('abcDEFG', 'abcdefg', true)).toBe(true);
        expect(Strings.some('abcDEFG', 'abcdefg')).toBe(false);
    });
    it('matches correctly against a string array of tests.', () => {
        expect(Strings.some(null, [])).toBe(false);
        expect(Strings.some(null, ['aaa'])).toBe(false);
        expect(Strings.some('abcDEFG', ['abcDEFG'])).toBe(true);
        expect(Strings.some('abcDEFG', [])).toBe(false);
        expect(Strings.some('abcDEFG', ['123'])).toBe(false);
        expect(Strings.some('abcDEFG', ['abcdefg'], true)).toBe(true);
        expect(Strings.some('abcDEFG', ['abcdefg'])).toBe(false);
    });
    it('matches correctly against a RegExp test.', () => {
        expect(Strings.some(null, /aaa/)).toBe(false);
        expect(Strings.some('abcDEFG', /abcDEFG/)).toBe(true);
        expect(Strings.some('abcDEFG', /123/)).toBe(false);
        expect(Strings.some('abcDEFG', /ABCDEfg/, true)).toBe(true);
        expect(Strings.some('abcDEFG', /abcdefg/)).toBe(false);
        expect(Strings.some('abcDEFG', /abc/)).toBe(true);
    });
    it('matches correctly against a string array of tests.', () => {
        expect(Strings.some(null, [/aaa/])).toBe(false);
        expect(Strings.some('abcDEFG', [/abcDEFG/])).toBe(true);
        expect(Strings.some('abcDEFG', [/123/])).toBe(false);
        expect(Strings.some('abcDEFG', [/abcdefg/], true)).toBe(true);
        expect(Strings.some('abcDEFG', [/abcdefg/])).toBe(false);
    });
});

describe('.slugify', () => {
    it('creates valid slugs.', () => {
        expect(Strings.slugify('hello WORLD 123...')).toBe('hello-world-123');
        expect(Strings.slugify('Lala^**## Stuff')).toBe('lala-stuff');
        expect(Strings.slugify('Lala^**## Stuff-today,test')).toBe('lala-stuff-today-test');
        expect(Strings.slugify('Lala^**## Stuff-today,test', '|-|')).toBe('lala|-|stuff|-|today|-|test');
        expect(Strings.slugify('....hello WORLD 123...', '.',)).toBe('hello.world.123');
        expect(Strings.slugify('hello WORLD 123...', '***',)).toBe('hello***world***123');
        expect(Strings.slugify('hello-world...', '.',)).toBe('hello.world');
        expect(Strings.slugify('helloWorldFox', '_', false, true)).toBe('hello_World_Fox');
        expect(Strings.slugify('helloWorldFox', '-', true, true)).toBe('hello-world-fox');
        expect(Strings.slugify('HelloWorldFox', '-', false, true)).toBe('Hello-World-Fox');
        expect(Strings.slugify('Hello_World_Fox', '-', false, true)).toBe('Hello-World-Fox');
        expect(Strings.slugify('Hello_WORLD_Fox', '-', false, true)).toBe('Hello-WORLD-Fox');
        expect(Strings.slugify('HelloWORLDFox', '-', false, true)).toBe('Hello-WORLD-Fox');
        expect(Strings.slugify('HelloToTHEA-team', '-', false, true)).toBe('Hello-To-THE-A-team');
        expect(Strings.slugify('APPEND_world', '-', false, true)).toBe('APPEND-world');
        expect(Strings.slugify('Aàáäâyeeèéóöôùúü Thats nuts.')).toBe('aaaaayeeeeooouuu-thats-nuts');
    });
});

describe('.camelify', () => {
    it('creates valid camel-case strings.', () => {
        expect(Strings.camelify('ID')).toBe('ID');
        expect(Strings.camelify('UUID')).toBe('UUID');
        expect(Strings.camelify('GUID')).toBe('GUID');
        expect(Strings.camelify('Id')).toBe('ID');
        expect(Strings.camelify('UuID')).toBe('UUID');
        expect(Strings.camelify('GUId')).toBe('GUID');
        expect(Strings.camelify('hello WORLD 123...')).toBe('helloWORLD123');
        expect(Strings.camelify('Lala^**## Stuff')).toBe('lalaStuff');
        expect(Strings.camelify('Lala^**## Stuff', true)).toBe('LalaStuff');
        expect(Strings.camelify('the quick brown fox')).toBe('theQuickBrownFox');
        expect(Strings.camelify('the quick brown fox', false)).toBe('theQuickBrownFox');
        expect(Strings.camelify('the quick brown fox', true)).toBe('TheQuickBrownFox');
        expect(Strings.camelify('OrderID')).toBe('orderID');
        expect(Strings.camelify('Order_ID')).toBe('orderID');
        expect(Strings.camelify('Order_ID', true)).toBe('OrderID');
        expect(Strings.camelify('Order_GuID')).toBe('orderGUID');
        expect(Strings.camelify('Order_GUID', true)).toBe('OrderGUID');
        expect(Strings.camelify('Order_UuID')).toBe('orderUUID');
        expect(Strings.camelify('Order_UUID', true)).toBe('OrderUUID');
        expect(Strings.camelify('SQL server')).toBe('SQLServer');
        expect(Strings.camelify('SQL-server')).toBe('SQLServer');
        expect(Strings.camelify('SQL_Server')).toBe('SQLServer');
        expect(Strings.camelify('AddressEntityTypesX3')).toBe('addressEntityTypesX3');
        expect(Strings.camelify('AddressEntityTypesX3', true)).toBe('AddressEntityTypesX3');
        expect(Strings.camelify('vServerStorage')).toBe('vServerStorage');
        expect(Strings.camelify('Crazy-letters:áäâyeeèéóöôùú')).toBe('crazyLettersAAAYeeeEOOOUU');
        expect(Strings.camelify('a,bunch.of.value^together')).toBe('aBunchOfValueTogether');
        expect(Strings.camelify('Comma,sEParated,values')).toBe('commaSEParatedValues');
        expect(Strings.camelify('dot.notation.knows.BEST...right')).toBe('dotNotationKnowsBESTRight');
        expect(Strings.camelify('[john].[jumped[')).toBe('johnJumped');
        expect(Strings.camelify('[acro.NYM].[OK[')).toBe('acroNYMOK');
        expect(Strings.camelify(null)).toBe(null);
        expect(Strings.camelify('')).toBe('');
    });
});

describe('.indent', () => {
    it('indents a single line.', () => {
        expect(Strings.indent('hello')).toBe('    hello');
        expect(Strings.indent('hello', 0, 0, '---')).toBe('---hello');
    });
    it('indents all lines.', () => {
        expect(Strings.indent('hello\nworld\n    howdy')).toBe('    hello\n    world\n        howdy');
        expect(Strings.indent('hello\nworld\n    howdy', null, null, '♡♡♡♡')).toBe('♡♡♡♡hello\n♡♡♡♡world\n♡♡♡♡    howdy');
    });
    it('indents specific lines.', () => {
        expect(Strings.indent('hello\nworld\n    howdy', 2)).toBe('hello\nworld\n        howdy');
        expect(Strings.indent('hello\nworld\n    howdy', 1, 1)).toBe('hello\n    world\n    howdy');
        expect(Strings.indent('hello\nworld\n    howdy', 1, 2, '**')).toBe('hello\n**world\n**    howdy');
    });
});