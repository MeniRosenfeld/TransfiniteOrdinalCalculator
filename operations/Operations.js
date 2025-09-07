// Operations.js
// Public API for ordinal arithmetic using rule-based system

/**
 * Main operations manager that coordinates rule engines for different operations.
 */
class Operations {
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
    initialize() {
        if (this.initialized) return;

        console.log('[Operations] Initializing ordinal operations system...');

        // Register all available ordinal types
        const typeClasses = [
            typeof FiniteOrdinal !== 'undefined' ? FiniteOrdinal : null,
            typeof OmegaOrdinal !== 'undefined' ? OmegaOrdinal : null,
            typeof CNFOrdinal !== 'undefined' ? CNFOrdinal : null,
            typeof WTowerOrdinal !== 'undefined' ? WTowerOrdinal : null,
            typeof EpsilonZero !== 'undefined' ? EpsilonZero : null
        ].filter(Boolean);

        for (const typeClass of typeClasses) {
            if (typeClass.getTypeName && typeClass.getDirectConversions) {
                this.registry.registerType(typeClass);
            }
        }

        // Compute conversion paths
        this.registry.computeAllPaths();

        // Load operation rules
        if (typeof createAdditionRules === 'function') {
            this.additionEngine.addRules(createAdditionRules(this.conversionEngine));
        }
        if (typeof createMultiplicationRules === 'function') {
            this.multiplicationEngine.addRules(createMultiplicationRules(this.conversionEngine));
        }
        if (typeof createExponentiationRules === 'function') {
            this.exponentiationEngine.addRules(createExponentiationRules(this.conversionEngine));
        }
        if (typeof createTetrationRules === 'function') {
            this.tetrationEngine.addRules(createTetrationRules(this.conversionEngine));
        }
        if (typeof createComparisonRules === 'function') {
            this.comparisonEngine.addRules(createComparisonRules(this.conversionEngine));
        }

        // TODO: Load other operation rules as they're created

        this.initialized = true;
        console.log('[Operations] Initialization complete');
    }

    /**
     * Adds two ordinals using rule-based system.
     */
    add(a, b) {
        this.ensureInitialized();
        return this.additionEngine.execute(a, b, 'addition');
    }

    /**
     * Multiplies two ordinals using rule-based system.
     */
    multiply(a, b) {
        this.ensureInitialized();
        return this.multiplicationEngine.execute(a, b, 'multiplication');
    }

    /**
     * Exponentiates two ordinals using rule-based system.
     */
    power(a, b) {
        this.ensureInitialized();
        return this.exponentiationEngine.execute(a, b, 'exponentiation');
    }

    /**
     * Tetrates two ordinals using rule-based system.
     */
    tetrate(a, b) {
        this.ensureInitialized();
        return this.tetrationEngine.execute(a, b, 'tetration');
    }

    /**
     * Compares two ordinals using rule-based system.
     * Returns -1 (a < b), 0 (a = b), or 1 (a > b).
     */
    compare(a, b) {
        this.ensureInitialized();
        return this.comparisonEngine.execute(a, b, 'comparison');
    }

    /**
     * Converts an ordinal to the specified target type.
     */
    convert(ordinal, targetTypeName) {
        this.ensureInitialized();
        return this.conversionEngine.convert(ordinal, targetTypeName);
    }

    /**
     * Returns true if conversion is possible.
     */
    canConvert(ordinal, targetTypeName) {
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
const OPERATIONS = new Operations();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Operations, OPERATIONS };
} else {
    // Browser globals
    window.Operations = Operations;
    window.OPERATIONS = OPERATIONS;
}

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
