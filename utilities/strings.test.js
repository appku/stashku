import Strings from './strings.js';

test('.escape escapes for a URI.', () => {
    expect(Strings.escape('why? x=hello world', Strings.EscapeMethod.URI)).toBe('why%3F%20x%3Dhello%20world');
});

test('.escape escapes for a regular expression.', () => {
    expect(Strings.escape('Look! at [this]...', Strings.EscapeMethod.REGEXP)).toBe('Look! at \\[this\\]\\.\\.\\.');
});

test('.some matches correctly against a string test.', () => {
    expect(Strings.some(null, 'aaa')).toBe(false);
    expect(Strings.some(null, null)).toBe(true);
    expect(Strings.some('abcDEFG', 'abcDEFG')).toBe(true);
    expect(Strings.some('abcDEFG', '123')).toBe(false);
    expect(Strings.some('abcDEFG', 'abcdefg', true)).toBe(true);
    expect(Strings.some('abcDEFG', 'abcdefg')).toBe(false);
});

test('.some matches correctly against a string array of tests.', () => {
    expect(Strings.some(null, [])).toBe(false);
    expect(Strings.some(null, ['aaa'])).toBe(false);
    expect(Strings.some('abcDEFG', ['abcDEFG'])).toBe(true);
    expect(Strings.some('abcDEFG', [])).toBe(false);
    expect(Strings.some('abcDEFG', ['123'])).toBe(false);
    expect(Strings.some('abcDEFG', ['abcdefg'], true)).toBe(true);
    expect(Strings.some('abcDEFG', ['abcdefg'])).toBe(false);
});

test('.some matches correctly against a RegExp test.', () => {
    expect(Strings.some(null, /aaa/)).toBe(false);
    expect(Strings.some('abcDEFG', /abcDEFG/)).toBe(true);
    expect(Strings.some('abcDEFG', /123/)).toBe(false);
    expect(Strings.some('abcDEFG', /ABCDEfg/, true)).toBe(true);
    expect(Strings.some('abcDEFG', /abcdefg/)).toBe(false);
    expect(Strings.some('abcDEFG', /abc/)).toBe(true);
});

test('.some matches correctly against a string array of tests.', () => {
    expect(Strings.some(null, [/aaa/])).toBe(false);
    expect(Strings.some('abcDEFG', [/abcDEFG/])).toBe(true);
    expect(Strings.some('abcDEFG', [/123/])).toBe(false);
    expect(Strings.some('abcDEFG', [/abcdefg/], true)).toBe(true);
    expect(Strings.some('abcDEFG', [/abcdefg/])).toBe(false);
});

test('.slugify creates valid slugs.', () => {
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

test('.camelify creates valid camel-case strings.', () => {
    expect(Strings.camelify('ID')).toBe('id');
    expect(Strings.camelify('hello WORLD 123...')).toBe('helloWORLD123');
    expect(Strings.camelify('Lala^**## Stuff')).toBe('lalaStuff');
    expect(Strings.camelify('Lala^**## Stuff', true)).toBe('LalaStuff');
    expect(Strings.camelify('the quick brown fox')).toBe('theQuickBrownFox');
    expect(Strings.camelify('the quick brown fox', false)).toBe('theQuickBrownFox');
    expect(Strings.camelify('the quick brown fox', true)).toBe('TheQuickBrownFox');
    expect(Strings.camelify('OrderID')).toBe('orderID');
    expect(Strings.camelify('Order_ID')).toBe('orderID');
    expect(Strings.camelify('Order_ID', true)).toBe('OrderID');
    expect(Strings.camelify('SQL server')).toBe('SQLServer');
    expect(Strings.camelify('SQL-server')).toBe('SQLServer');
    expect(Strings.camelify('SQL_Server')).toBe('SQLServer');
    expect(Strings.camelify('AddressEntityTypesX3')).toBe('addressEntityTypesX3');
    expect(Strings.camelify('AddressEntityTypesX3', true)).toBe('AddressEntityTypesX3');
    expect(Strings.camelify('vServerStorage')).toBe('vServerStorage');
    expect(Strings.camelify('Crazy-letters:áäâyeeèéóöôùú')).toBe('crazyLettersAaayeeeeooouu');
    expect(Strings.camelify('a,bunch.of.value^together')).toBe('aBunchOfValueTogether');
    expect(Strings.camelify('Comma,sEParated,values')).toBe('commaSEParatedValues');
    expect(Strings.camelify('dot.notation.knows.BEST...right')).toBe('dotNotationKnowsBESTRight');
    expect(Strings.camelify(null)).toBe(null);
    expect(Strings.camelify('')).toBe('');
});
