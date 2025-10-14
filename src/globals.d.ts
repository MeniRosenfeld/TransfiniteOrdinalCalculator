// globals.d.ts
// TypeScript declarations for browser globals

import type { OperationTracer } from './OperationTracer';
import type { OrdinalBase } from './types/OrdinalBase';
import type { ZeroOrdinal } from './types/ZeroOrdinal';
import type { OneOrdinal } from './types/OneOrdinal';
import type { FiniteOrdinal } from './types/FiniteOrdinal';
import type { OmegaOrdinal } from './types/OmegaOrdinal';
import type { CNFOrdinal } from './types/CNFOrdinal';
import type { ENFOrdinal } from './types/ENFOrdinal';
import type { ENFTerm } from './types/ENFTerm';
import type { ENFFactor } from './types/ENFFactor';
import type { EpsilonZero } from './types/EpsilonZero';
import type { EpsilonNumber } from './types/EpsilonNumber';
import type { EpsilonTowerOrdinal } from './types/EpsilonTowerOrdinal';
import type { EpsilonTunnelOrdinal } from './types/EpsilonTunnelOrdinal';
import type { WTowerOrdinal } from './types/WTowerOrdinal';
import type { ZetaZero } from './types/ZetaZero';
import type { Operations } from './operations/Operations';
import type { TowerInfo } from './operations/Auxiliary';
import type { ConversionRegistry } from './conversions/ConversionRegistry';
import type { ConversionEngine } from './conversions/ConversionEngine';
import type { Rule, RuleEngine } from './operations/RuleEngine';

declare global {
    interface Window {
        // Tracer
        OperationTracer: typeof OperationTracer;
        
        // Type classes
        OrdinalBase: typeof OrdinalBase;
        ZeroOrdinal: typeof ZeroOrdinal;
        OneOrdinal: typeof OneOrdinal;
        FiniteOrdinal: typeof FiniteOrdinal;
        OmegaOrdinal: typeof OmegaOrdinal;
        CNFOrdinal: typeof CNFOrdinal;
        ENFOrdinal: typeof ENFOrdinal;
        ENFTerm: typeof ENFTerm;
        ENFFactor: typeof ENFFactor;
        EpsilonZero: typeof EpsilonZero;
        EpsilonNumber: typeof EpsilonNumber;
        EpsilonTowerOrdinal: typeof EpsilonTowerOrdinal;
        EpsilonTunnelOrdinal: typeof EpsilonTunnelOrdinal;
        WTowerOrdinal: typeof WTowerOrdinal;
        ZetaZero: typeof ZetaZero;

        // Conversion system
        ConversionRegistry: typeof ConversionRegistry;
        ConversionEngine: typeof ConversionEngine;
        
        // Rule engine
        Rule: typeof Rule;
        RuleEngine: typeof RuleEngine;
        
        // Operations system
        Operations: typeof Operations;
        OPERATIONS: Operations;
        
        // Operation rule creators
        createAdditionRules: (conversionEngine: ConversionEngine) => Rule[];
        createMultiplicationRules: (conversionEngine: ConversionEngine) => Rule[];
        createExponentiationRules: (conversionEngine: ConversionEngine) => Rule[];
        createTetrationRules: (conversionEngine: ConversionEngine) => Rule[];
        createComparisonRules: (conversionEngine: ConversionEngine) => Rule[];
        
        // Numeric contexts and helpers
        Rational: any; // Complex rational number class
        DoubleFloatContext: any;
        RationalContext: any;
        
        // Parser and calculator
        SimpleParser: any; // Still .js, type as any for now
        calculateSimple: any;
        renderOrdinalSimple: any;
        RenderingComponents: any;
        
        // Ordinal-to-real mapping
        FParams: any;
        DEFAULT_F_PARAMS: any;
        OLD_F_PARAMS: any;
        ORDINAL_ZERO: any;
        ORDINAL_ONE: any;
        convertOrdinalInstanceToFFormat: any;
        f: any;
        fInverse: any;
        convertFFormatToOrdinalInstance: any;
        
        // Helper functions
        getTowerInfo?: (exponent: OrdinalBase) => TowerInfo;
    }
}

export { };

