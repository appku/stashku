import express from 'express';
import StashKu from '@appku/stashku';
import fairu from '@appku/fairu';
import bodyParser from 'body-parser';
import qs from 'qs';

/**
 * @param {express.Express} app
 */
async function configure(app, config) {
    //setup express
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.json());
    //load memory engine with sample data
    let stash = new StashKu({ engine: 'memory', resources: ['themes', 'products'] });
    stash.engine.data.set('products', (await fairu.with('../memory-engine/data-products.json').format(fairu.Format.json).read())[0].data);
    stash.engine.data.set('themes', (await fairu.with('../memory-engine/data-themes.json').format(fairu.Format.json).read())[0].data);
    app.all('/*', async (req, res) => {
        let method = req.method.toLowerCase();
        try {
            let response = await stash[method](req);
            res.send(response);
        } catch (err) {
            console.error(err);
            res.status(err.code || 500);
            res.send(err.message);
        }
    });
}

export default configure;