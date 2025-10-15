/**
 * OrdinalFactory - Factory pattern to avoid circular dependencies
 * 
 * OrdinalBase needs to create instances of concrete ordinal types,
 * but cannot import them directly without creating circular dependencies.
 * This factory is initialized after all types are loaded.
 */

import type { OrdinalBase } from './OrdinalBase.js';

interface OrdinalConstructors {
    FiniteOrdinal: new (n: bigint) => OrdinalBase;
    ZeroOrdinal: { instance(): OrdinalBase };
    OneOrdinal: { instance(): OrdinalBase };
    EpsilonNumber: new (base: OrdinalBase) => OrdinalBase;
    ZetaZero: new () => OrdinalBase;
    EpsilonTunnelOrdinal: new (depth: bigint) => OrdinalBase;
}

let constructors: OrdinalConstructors | null = null;

/**
 * Initialize the factory with concrete ordinal type constructors.
 * Should be called once during application startup.
 */
export function initializeOrdinalFactory(ctors: OrdinalConstructors): void {
    if (constructors) {
        console.warn('OrdinalFactory already initialized. Replacing existing constructors.');
    }
    constructors = ctors;
}

/**
 * Check if factory has been initialized.
 */
export function isFactoryInitialized(): boolean {
    return constructors !== null;
}

/**
 * Create a FiniteOrdinal instance.
 */
export function createFiniteOrdinal(n: bigint): OrdinalBase {
    if (!constructors) {
        throw new Error('OrdinalFactory not initialized. Call initializeOrdinalFactory() first.');
    }
    return new constructors.FiniteOrdinal(n);
}

/**
 * Get the ZeroOrdinal singleton instance.
 */
export function getZeroOrdinal(): OrdinalBase {
    if (!constructors) {
        throw new Error('OrdinalFactory not initialized. Call initializeOrdinalFactory() first.');
    }
    return constructors.ZeroOrdinal.instance();
}

/**
 * Get the OneOrdinal singleton instance.
 */
export function getOneOrdinal(): OrdinalBase {
    if (!constructors) {
        throw new Error('OrdinalFactory not initialized. Call initializeOrdinalFactory() first.');
    }
    return constructors.OneOrdinal.instance();
}

/**
 * Create an EpsilonNumber instance.
 */
export function createEpsilonNumber(base: OrdinalBase): OrdinalBase {
    if (!constructors) {
        throw new Error('OrdinalFactory not initialized. Call initializeOrdinalFactory() first.');
    }
    return new constructors.EpsilonNumber(base);
}

/**
 * Create a ZetaZero instance.
 */
export function createZetaZero(): OrdinalBase {
    if (!constructors) {
        throw new Error('OrdinalFactory not initialized. Call initializeOrdinalFactory() first.');
    }
    return new constructors.ZetaZero();
}

/**
 * Create an EpsilonTunnelOrdinal instance.
 */
export function createEpsilonTunnelOrdinal(depth: bigint): OrdinalBase {
    if (!constructors) {
        throw new Error('OrdinalFactory not initialized. Call initializeOrdinalFactory() first.');
    }
    return new constructors.EpsilonTunnelOrdinal(depth);
}
