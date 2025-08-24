// ordinal_ops.js
// Central operation registry (initial scaffolding). Currently delegates to existing dispatchers
// to avoid any behavior changes. This file provides a single place to evolve dispatch rules
// as the object model matures.

/* global addOrdinals, multiplyOrdinals, powerOrdinals, tetrateOrdinals */

function ordinalAdd(alpha, beta) {
    if (typeof addOrdinals !== 'function') {
        throw new Error('ordinalAdd: addOrdinals is not available');
    }
    return addOrdinals(alpha, beta);
}

function ordinalMultiply(alpha, beta) {
    if (typeof multiplyOrdinals !== 'function') {
        throw new Error('ordinalMultiply: multiplyOrdinals is not available');
    }
    return multiplyOrdinals(alpha, beta);
}

function ordinalPower(base, exponent) {
    if (typeof powerOrdinals !== 'function') {
        throw new Error('ordinalPower: powerOrdinals is not available');
    }
    return powerOrdinals(base, exponent);
}

function ordinalTetrate(base, height) {
    if (typeof tetrateOrdinals !== 'function') {
        throw new Error('ordinalTetrate: tetrateOrdinals is not available');
    }
    return tetrateOrdinals(base, height);
}

// Expose globally (browser script tag use)
if (typeof window !== 'undefined') {
    window.ordinalAdd = ordinalAdd;
    window.ordinalMultiply = ordinalMultiply;
    window.ordinalPower = ordinalPower;
    window.ordinalTetrate = ordinalTetrate;
}


