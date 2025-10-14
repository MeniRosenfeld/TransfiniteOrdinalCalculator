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
import { DoubleFloatContext, RationalContext } from './operations/NumericContexts.js';
import { createAdditionRules } from './operations/AdditionRules.js';
import { createMultiplicationRules } from './operations/MultiplicationRules.js';
import { createExponentiationRules } from './operations/ExponentiationRules.js';
import { createTetrationRules } from './operations/TetrationRules.js';
import { createComparisonRules } from './operations/Comparison.js';
import { Operations, OPERATIONS } from './operations/Operations.js';

// Parser and calculator
import { SimpleParser } from './SimpleParser.js';
import { calculateSimple } from './SimpleCalculator.js';
import { renderOrdinalSimple } from './SimpleRenderer.js';

// Ordinal mapping
import { FParams, DEFAULT_F_PARAMS, OLD_F_PARAMS, ORDINAL_ZERO, ORDINAL_ONE, convertOrdinalInstanceToFFormat, f } from './ordinal_mapping.js';
import { fInverse, convertFFormatToOrdinalInstance } from './ordinal_mapping_inverse.js';

// UI
import { initializeUI } from './script.js';

// Make key classes and functions globally available for backward compatibility
// This allows the existing test files to continue working
window.OperationTracer = OperationTracer;
window.OrdinalBase = OrdinalBase;
window.ZeroOrdinal = ZeroOrdinal;
window.OneOrdinal = OneOrdinal;
window.FiniteOrdinal = FiniteOrdinal;
window.OmegaOrdinal = OmegaOrdinal;
window.EpsilonZero = EpsilonZero;
window.EpsilonNumber = EpsilonNumber;
window.ZetaZero = ZetaZero;
window.ENFFactor = ENFFactor;
window.ENFTerm = ENFTerm;
window.ENFOrdinal = ENFOrdinal;
window.CNFOrdinal = CNFOrdinal;
window.WTowerOrdinal = WTowerOrdinal;
window.EpsilonTowerOrdinal = EpsilonTowerOrdinal;
window.EpsilonTunnelOrdinal = EpsilonTunnelOrdinal;
window.ConversionRegistry = ConversionRegistry;
window.ConversionEngine = ConversionEngine;
window.Rule = Rule;
window.RuleEngine = RuleEngine;
window.getTowerInfo = getTowerInfo;
window.Rational = Rational;
window.DoubleFloatContext = DoubleFloatContext;
window.RationalContext = RationalContext;
window.createAdditionRules = createAdditionRules;
window.createMultiplicationRules = createMultiplicationRules;
window.createExponentiationRules = createExponentiationRules;
window.createTetrationRules = createTetrationRules;
window.createComparisonRules = createComparisonRules;
window.Operations = Operations;
window.OPERATIONS = OPERATIONS;
window.SimpleParser = SimpleParser;
window.calculateSimple = calculateSimple;
window.renderOrdinalSimple = renderOrdinalSimple;
window.RenderingComponents = RenderingComponents;
window.FParams = FParams;
window.DEFAULT_F_PARAMS = DEFAULT_F_PARAMS;
window.OLD_F_PARAMS = OLD_F_PARAMS;
window.ORDINAL_ZERO = ORDINAL_ZERO;
window.ORDINAL_ONE = ORDINAL_ONE;
window.convertOrdinalInstanceToFFormat = convertOrdinalInstanceToFFormat;
window.f = f;
window.fInverse = fInverse;
window.convertFFormatToOrdinalInstance = convertFFormatToOrdinalInstance;

// Initialize global tracer
OperationTracer.setGlobalTracer(10000000); // 10M operations budget
console.log('[GlobalTracer] Main initialized with budget:', OperationTracer.getBudget());

// Initialize OPERATIONS system
if (OPERATIONS && OPERATIONS.initialize) {
    OPERATIONS.initialize();
    console.log('[Main] OPERATIONS system initialized immediately');
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

