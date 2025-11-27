import { OperationTracer } from '../OperationTracer.js';
import { OPERATIONS } from '../operations/Operations.js';
import {
    initializeOperations,
    isOperationsInitialized,
} from '../operations/OperationsSingleton.js';
import {
    initializeOrdinalFactory,
    isFactoryInitialized,
} from '../types/OrdinalFactory.js';
import { FiniteOrdinal } from '../types/FiniteOrdinal.js';
import { ZeroOrdinal } from '../types/ZeroOrdinal.js';
import { OneOrdinal } from '../types/OneOrdinal.js';
import { EpsilonNumber } from '../types/EpsilonNumber.js';
import { ZetaZero } from '../types/ZetaZero.js';
import { EpsilonTunnelOrdinal } from '../types/EpsilonTunnelOrdinal.js';

/**
 * Ensures the shared OPERATIONS instance and tracer are ready for browser tests.
 */
export function initializeTestEnvironment(tracerBudget = 1_000_000): void {
    if (!isFactoryInitialized()) {
        initializeOrdinalFactory({
            FiniteOrdinal,
            ZeroOrdinal,
            OneOrdinal,
            EpsilonNumber,
            ZetaZero,
            EpsilonTunnelOrdinal,
        });
    }

    OPERATIONS.initialize();

    if (!isOperationsInitialized()) {
        initializeOperations(OPERATIONS);
    }

    OperationTracer.setGlobalTracer(tracerBudget);
}

export function getOperationsForTests() {
    initializeTestEnvironment();
    return OPERATIONS;
}

