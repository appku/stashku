/* eslint-disable */
import StashKu from '@appku/stashku';
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

window.StashKu = StashKu;