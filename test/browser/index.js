/* eslint-disable */
import StashKu from '@appku/stashku';
import ThemeModel from './models/theme.js';
import ProductModel from './models/product.js';
import './index.html';
import './favicon.ico'

document.addEventListener('DOMContentLoaded', function () {
    function component() {
        const d = document.createElement('div');
        d.innerHTML = 'This message indicates you are running javascript and the test for @AppKu/StashKu';
        return d;
    }
    document.body.appendChild(component());
}, false);

//add some globals for running in console.
window.StashKu = StashKu;
window.ThemeModel = ThemeModel;
window.ProductModel = ProductModel;