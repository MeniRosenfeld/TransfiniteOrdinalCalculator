// Run with: node tests/debug_f_node.mjs
import { f, DEFAULT_F_PARAMS, ORDINAL_ZERO, ORDINAL_ONE } from '../src/ordinal_mapping.js';

console.log('=== Parameter Verification ===');
console.log(`DEFAULT_F_PARAMS:`);
console.log(`  scaleAdd: ${DEFAULT_F_PARAMS.ctx.toNumber(DEFAULT_F_PARAMS.scaleAdd)}`);
console.log(`  scaleMult: ${DEFAULT_F_PARAMS.ctx.toNumber(DEFAULT_F_PARAMS.scaleMult)}`);
console.log(`  scaleExp: ${DEFAULT_F_PARAMS.ctx.toNumber(DEFAULT_F_PARAMS.scaleExp)}`);
console.log(`  scaleTet: ${DEFAULT_F_PARAMS.ctx.toNumber(DEFAULT_F_PARAMS.scaleTet)}`);
console.log(`  scaleEpsilon: ${DEFAULT_F_PARAMS.ctx.toNumber(DEFAULT_F_PARAMS.scaleEpsilon)}`);
console.log('');

console.log('=== Precomputed Values ===');
for (let i = 1; i <= 10; i++) {
    if (DEFAULT_F_PARAMS.precomputed[i]) {
        console.log(`precomputed[${i}] = ${DEFAULT_F_PARAMS.ctx.toNumber(DEFAULT_F_PARAMS.precomputed[i])}`);
    }
}
console.log('');

console.log('=== Test Cases ===');

const testCases = [
    { rep: 0n, name: 'f(0)' },
    { rep: 1n, name: 'f(1)' },
    { rep: 5n, name: 'f(5)' },
    { rep: 10n, name: 'f(10)' },
    { rep: { type: 'pow', k: 0n }, name: 'f(ω^0)' },
    { rep: { type: 'pow', k: 1n }, name: 'f(ω^1)' },
    { rep: { type: 'pow', k: 2n }, name: 'f(ω^2)' },
    { rep: { type: 'sum', beta: 1n, c: 1, delta: 0n }, name: 'f(ω*1+0)' },
    { rep: { type: 'sum', beta: 1n, c: 1, delta: 1n }, name: 'f(ω+1)' },
    { rep: { type: 'sum', beta: 1n, c: 2, delta: 0n }, name: 'f(ω*2)' },
    { rep: { type: 'pow', k: { type: 'pow', k: 1n } }, name: 'f(ω^ω)' },
    { rep: { type: 'w_tower', height: 1 }, name: 'f(ω↑↑1)' },
    { rep: { type: 'w_tower', height: 2 }, name: 'f(ω↑↑2)' },
    { rep: { type: 'epsilon', index: 0n }, name: 'f(ε_0)' },
    { rep: 'E0_TYPE', name: 'f(E0_TYPE)' },
];

for (const testCase of testCases) {
    try {
        const result = f(testCase.rep, DEFAULT_F_PARAMS);
        console.log(`${testCase.name} = ${result}`);
    } catch (error) {
        console.log(`${testCase.name}: ERROR - ${error.message}`);
    }
}
console.log('');

console.log('=== Formula Verification ===');
console.log('Manual f(1) = 1 / (1 + 3) = 0.25');
console.log('Manual f(ω) = 1 + 3 * 4 * f(0) = 1 + 12 * 0 = 1');
console.log('Manual f(ω^2) = 1 + 3 * 4 * f(1) = 1 + 12 * 0.25 = 4');
console.log('Manual f(ε_0) = 1 + 4 * 3 * 4 = 49');
console.log('Manual f(ω↑↑1) = 1 + 48 * f(0) = 1');
console.log('Manual f(ω↑↑2) = 1 + 48 * f(1) = 1 + 48 * 0.25 = 13');
