import jest from 'jest-mock';

describe('#export', () => {
    afterAll(async () => {
        await Files.including('./test/exports').unlink(true);
    });
    class TestTheme {
        static get ID() { return { pk: true }; }
        static get Name() { return 'Name'; }
        static get HexCode() { return 'HexCode'; }
    }
    let formats = [undefined, 'json', 'yaml', 'toml'];
    it('throws when the first argument is missing..', async () => {
        let stash = new StashKu();
        await expect(stash.export(undefined, './test/lalala')).rejects.toThrow(/first.+required/i);
        await expect(stash.export(null, './test/lalala')).rejects.toThrow(/first.+required/i);
    });
    it('throws when the exportPath argument is missing..', async () => {
        let stash = new StashKu();
        await expect(stash.export({})).rejects.toThrow(/exportPath.+required/i);
        await expect(stash.export({}, null)).rejects.toThrow(/exportPath.+required/i);
        await expect(stash.export({}, '')).rejects.toThrow(/exportPath.+required/i);
    });
    it('exports a model instance to file to a directory and returns the path.', async () => {
        let stash = new StashKu();
        let m = new TestTheme();
        m.ID = 123;
        m.Name = 'horse';
        for (let f of formats) {
            let files = await stash.export(m, './test/exports/', f);
            expect(files).toBeInstanceOf(Array);
            expect(files.length).toBe(1);
            expect(files[0]).toBe(Files.resolve(`./test/exports/123.${f ?? 'json'}`));
        }
    });
    it('exports a model instance to a specific file path.', async () => {
        let stash = new StashKu();
        let m = new TestTheme();
        m.ID = 123;
        m.Name = 'horse';
        for (let f of formats) {
            let filePath = `./test/exports/test-model-export.${f ?? 'default.json'}`;
            let files = await stash.export(m, filePath, f);
            expect(files).toBeInstanceOf(Array);
            expect(files.length).toBe(1);
            expect(files[0]).toBe(Files.resolve(filePath));
        }
    });
});