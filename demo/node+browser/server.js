import express from 'express';
import StashKu from '@appku/stashku';
import fairu from '@appku/fairu';
import bodyParser from 'body-parser';
import qs from 'qs';
import ThemeModel from '../../test/models/theme-model.js';

/**
 * @param {express.Express} app
 */
async function configure(app, config) {
    //setup express
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.json());
    //load memory engine with sample data
    let stash = new StashKu({ engine: 'memory', resources: ['themes', 'products'] });
    stash.engine.data.set('products', (await fairu.with('../../test/memory-engine/data-products.json').format(fairu.Format.json).read())[0].data);
    stash.engine.data.set('themes', (await fairu.with('../../test/memory-engine/data-themes.json').format(fairu.Format.json).read())[0].data);
    app.all('/*', async (req, res) => {
        let method = req.method.toLowerCase();
        res.status(400).send({code: 400, message: 'hi', data: {hello:123}});
        return;
        try {
            let response = await stash.model(ThemeModel)[method](req);
            res.send(response);
        } catch (err) {
            console.error(err);
            res.status(err.code || 500);
            res.send(err.message);
        }
    });
}

export default configure;