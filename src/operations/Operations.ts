// Operations.ts
// Public API for ordinal arithmetic using rule-based system

import type { OrdinalBase } from '../types/OrdinalBase.js';
import { ConversionRegistry } from '../conversions/ConversionRegistry.js';
import { ConversionEngine } from '../conversions/ConversionEngine.js';
import { RuleEngine } from './RuleEngine.js';
import { createAdditionRules } from './AdditionRules.js';
import { createMultiplicationRules } from './MultiplicationRules.js';
import { createExponentiationRules } from './ExponentiationRules.js';
import { createTetrationRules } from './TetrationRules.js';
import { createComparisonRules } from './Comparison.js';
import { FiniteOrdinal } from '../types/FiniteOrdinal.js';
import { ZeroOrdinal } from '../types/ZeroOrdinal.js';
import { OneOrdinal } from '../types/OneOrdinal.js';
import { OmegaOrdinal } from '../types/OmegaOrdinal.js';
import { CNFOrdinal } from '../types/CNFOrdinal.js';
import { WTowerOrdinal } from '../types/WTowerOrdinal.js';
import { EpsilonTowerOrdinal } from '../types/EpsilonTowerOrdinal.js';
import { EpsilonTunnelOrdinal } from '../types/EpsilonTunnelOrdinal.js';
import { EpsilonZero } from '../types/EpsilonZero.js';
import { EpsilonNumber } from '../types/EpsilonNumber.js';
import { ENFOrdinal } from '../types/ENFOrdinal.js';
import { ENFTerm } from '../types/ENFTerm.js';
import { ZetaZero } from '../types/ZetaZero.js';

/**
 * Main operations manager that coordinates rule engines for different operations.
 */
export class Operations {
    registry: ConversionRegistry;
    conversionEngine: ConversionEngine;
    private additionEngine: RuleEngine;
    private multiplicationEngine: RuleEngine;
    private exponentiationEngine: RuleEngine;
    private tetrationEngine: RuleEngine;
    private comparisonEngine: RuleEngine;
    private initialized: boolean;

    constructor() {
        this.registry = new ConversionRegistry();
        this.conversionEngine = new ConversionEngine(this.registry);
        this.additionEngine = new RuleEngine(this.conversionEngine);
        this.multiplicationEngine = new RuleEngine(this.conversionEngine);
        this.exponentiationEngine = new RuleEngine(this.conversionEngine);
        this.tetrationEngine = new RuleEngine(this.conversionEngine);
        this.comparisonEngine = new RuleEngine(this.conversionEngine);

        this.initialized = false;
    }

    /**
     * Initializes the operations system by registering types and computing paths.
     * Must be called after all ordinal types are loaded.
     */
    initialize(): void {
        if (this.initialized) return;

        console.log('[Operations] Initializing ordinal operations system...');

        // Register all available ordinal types
        // Note: Order matters for some operations - basic types first, then complex types
        const typeClasses = [
            FiniteOrdinal,
            ZeroOrdinal,
            OneOrdinal,
            OmegaOrdinal,
            CNFOrdinal,
            WTowerOrdinal,
            EpsilonTowerOrdinal,
            EpsilonTunnelOrdinal,
            EpsilonZero,
            EpsilonNumber,
            ENFOrdinal,
            ENFTerm,
            ZetaZero,
        ].filter(Boolean);

        for (const typeClass of typeClasses) {
            if (typeof typeClass.getTypeName === 'function' && typeof typeClass.getDirectConversions === 'function') {
                this.registry.registerType(typeClass);
            }
        }

        // Compute conversion paths
        this.registry.computeAllPaths();

        // Load operation rules
        this.additionEngine.addRules(createAdditionRules(this.conversionEngine));
        this.multiplicationEngine.addRules(createMultiplicationRules(this.conversionEngine));
        this.exponentiationEngine.addRules(createExponentiationRules(this.conversionEngine));
        this.tetrationEngine.addRules(createTetrationRules(this.conversionEngine));
        this.comparisonEngine.addRules(createComparisonRules(this.conversionEngine));

        // TODO: Load other operation rules as they're created

        this.initialized = true;
        console.log('[Operations] Initialization complete');
    }

    /**
     * Adds two ordinals using rule-based system.
     */
    add(a: any, b: any): any {
        this.ensureInitialized();
        return this.additionEngine.execute(a, b, 'addition');
    }

    /**
     * Multiplies two ordinals using rule-based system.
     */
    multiply(a: any, b: any): any {
        this.ensureInitialized();
        return this.multiplicationEngine.execute(a, b, 'multiplication');
    }

    /**
     * Exponentiates two ordinals using rule-based system.
     */
    power(a: any, b: any): any {
        this.ensureInitialized();
        return this.exponentiationEngine.execute(a, b, 'exponentiation');
    }

    /**
     * Tetrates two ordinals using rule-based system.
     */
    tetrate(a: any, b: any): any {
        this.ensureInitialized();
        return this.tetrationEngine.execute(a, b, 'tetration');
    }

    /**
     * Compares two ordinals using rule-based system.
     * Returns -1 (a < b), 0 (a = b), or 1 (a > b).
     */
    compare(a: any, b: any): number {
        this.ensureInitialized();
        return this.comparisonEngine.execute(a, b, 'comparison');
    }

    /**
     * Converts an ordinal to the specified target type.
     */
    convert(ordinal: any, targetTypeName: any): any {
        this.ensureInitialized();
        return this.conversionEngine.convert(ordinal, targetTypeName);
    }

    /**
     * Returns true if conversion is possible.
     */
    canConvert(ordinal: any, targetTypeName: any): boolean {
        this.ensureInitialized();
        return this.conversionEngine.canConvert(ordinal, targetTypeName);
    }

    ensureInitialized() {
        if (!this.initialized) {
            throw new Error('Operations system not initialized. Call initialize() first.');
        }
    }

    /**
     * Returns diagnostic information about the operations system.
     */
    getDiagnostics() {
        return {
            registeredTypes: this.registry.getTypeNames(),
            additionRules: this.additionEngine.getRulesSummary(),
            multiplicationRules: this.multiplicationEngine.getRulesSummary(),
            exponentiationRules: this.exponentiationEngine.getRulesSummary(),
            comparisonRules: this.comparisonEngine.getRulesSummary(),
            // TODO: Add other operation summaries
        };
    }
}

// Global instance
export const OPERATIONS = new Operations();

// Auto-initialize when DOM is ready (in browser)
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        // Delay initialization to ensure all ordinal types are loaded
        setTimeout(() => {
            try {
                OPERATIONS.initialize();
            } catch (e) {
                console.error('[Operations] Failed to initialize:', e);
            }
        }, 100);
    });
}
