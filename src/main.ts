// main.js
// Main entry point for the Transfinite Ordinal Calculator

// Import all dependencies
// Note: These will become actual imports when we enable full module support
import { OperationTracer } from './OperationTracer.js';
import { RenderingComponents } from './RenderingComponents.js';

// Type system
import { OrdinalBase } from './types/OrdinalBase.js';
import { ZeroOrdinal } from './types/ZeroOrdinal.js';
import { OneOrdinal } from './types/OneOrdinal.js';
import { FiniteOrdinal } from './types/FiniteOrdinal.js';
import { OmegaOrdinal } from './types/OmegaOrdinal.js';
import { EpsilonZero } from './types/EpsilonZero.js';
import { EpsilonNumber } from './types/EpsilonNumber.js';
import { ZetaZero } from './types/ZetaZero.js';
import { ENFFactor } from './types/ENFFactor.js';
import { ENFTerm } from './types/ENFTerm.js';
import { ENFOrdinal } from './types/ENFOrdinal.js';
import { CNFOrdinal } from './types/CNFOrdinal.js';
import { WTowerOrdinal } from './types/WTowerOrdinal.js';
import { EpsilonTowerOrdinal } from './types/EpsilonTowerOrdinal.js';
import { EpsilonTunnelOrdinal } from './types/EpsilonTunnelOrdinal.js';

// Conversion system
import { ConversionRegistry } from './conversions/ConversionRegistry.js';
import { ConversionEngine } from './conversions/ConversionEngine.js';

// Operations
import { Rule, RuleEngine } from './operations/RuleEngine.js';
import { getTowerInfo } from './operations/Auxiliary.js';
import { Rational } from './operations/Rational.js';
import { DoubleFloatContext } from './operations/NumericContexts.js';
import { createAdditionRules } from './operations/AdditionRules.js';
import { createMultiplicationRules } from './operations/MultiplicationRules.js';
import { createExponentiationRules } from './operations/ExponentiationRules.js';
import { createTetrationRules } from './operations/TetrationRules.js';
import { createComparisonRules } from './operations/Comparison.js';
import { Operations, OPERATIONS } from './operations/Operations.js';
import { initializeOperations } from './operations/OperationsSingleton.js';
import { initializeOrdinalFactory } from './types/OrdinalFactory.js';

// Parser and calculator
import { SimpleParser } from './SimpleParser.js';
import { calculateSimple } from './SimpleCalculator.js';
import { renderOrdinalSimple } from './SimpleRenderer.js';

// Ordinal mapping - New typed implementation
import {
    fTyped,
    addOneToOrdinal,
    ORDINAL_ZERO,
    ORDINAL_ONE,
    type OrdinalRepresentation
} from './ordinal_mapping/OrdinalMapping.js';

import {
    fInverseTyped
} from './ordinal_mapping/OrdinalMappingInverse.js';

import {
    FParams
} from './ordinal_mapping/FParams.js';

import {
    DoubleContext,
    RationalContext
} from './ordinal_mapping/Contexts.js';

import {
    Interval
} from './ordinal_mapping/Interval.js';

// Legacy compatibility layer (for tests and old code)
import {
    DEFAULT_F_PARAMS,
    OLD_F_PARAMS,
    convertOrdinalInstanceToFFormat,
    convertFFormatToOrdinalInstance,
    f,
    fInverse
} from './ordinal_mapping/OrdinalMappingCompat.js';

// UI
import { initializeUI } from './script.js';

// Initialize global tracer
OperationTracer.setGlobalTracer(10000000); // 10M operations budget
console.log('[GlobalTracer] Main initialized with budget:', OperationTracer.getBudget());

// Initialize OrdinalFactory to avoid circular dependencies
initializeOrdinalFactory({
    FiniteOrdinal,
    ZeroOrdinal,
    OneOrdinal,
    EpsilonNumber,
    ZetaZero,
    EpsilonTunnelOrdinal
});
console.log('[Main] OrdinalFactory initialized');

// Initialize OPERATIONS system
if (OPERATIONS && OPERATIONS.initialize) {
    OPERATIONS.initialize();
    console.log('[Main] OPERATIONS system initialized immediately');

    // Initialize the modern singleton pattern
    initializeOperations(OPERATIONS);
    console.log('[Main] Operations singleton initialized');
} else {
    console.error('[Main] OPERATIONS not available or missing initialize method');
}

// Initialize UI when DOM is ready
// Note: With module scripts (type="module"), the script is deferred by default
// So DOM is usually already loaded. We check both cases.
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initializeUI();
    });
} else {
    // DOM already loaded - call immediately
    initializeUI();
}

// =============================================================================
// ES6 MODULE EXPORTS
// =============================================================================
// Export all public APIs for ES6 module consumers.
// This enables proper IDE navigation (F12 Go to Definition) and type checking.
// =============================================================================

// Type system
export {
    OrdinalBase,
    ZeroOrdinal,
    OneOrdinal,
    FiniteOrdinal,
    OmegaOrdinal,
    EpsilonZero,
    EpsilonNumber,
    ZetaZero,
    ENFFactor,
    ENFTerm,
    ENFOrdinal,
    CNFOrdinal,
    WTowerOrdinal,
    EpsilonTowerOrdinal,
    EpsilonTunnelOrdinal
};

// Conversion system
export {
    ConversionRegistry,
    ConversionEngine
};

// Operations
export {
    Rule,
    RuleEngine,
    getTowerInfo,
    Rational,
    DoubleFloatContext,
    RationalContext,
    createAdditionRules,
    createMultiplicationRules,
    createExponentiationRules,
    createTetrationRules,
    createComparisonRules,
    Operations,
    OPERATIONS,
    initializeOperations,
    OperationTracer
};

// Parser and calculator
export {
    SimpleParser,
    calculateSimple,
    renderOrdinalSimple,
    RenderingComponents
};

// New typed ordinal mapping
export {
    fTyped,
    fInverseTyped,
    FParams,
    DoubleContext,
    Interval,
    addOneToOrdinal,
    ORDINAL_ZERO,
    ORDINAL_ONE
};

// Legacy ordinal mapping (for backward compatibility)
export {
    DEFAULT_F_PARAMS,
    OLD_F_PARAMS,
    convertOrdinalInstanceToFFormat,
    convertFFormatToOrdinalInstance,
    f,
    fInverse
};

// UI initialization
export {
    initializeUI
};

