/* eslint-disable */
import StashKu from '@appku/stashku';
import './index.html';

function component() {
    const element = document.createElement('div');

    // Lodash, currently included via a script, is required for this line to work
    element.innerHTML =['Hello', 'webpack'].join(' ');

    return element;
}

document.body.appendChild(component());

window.StashKu = StashKu;