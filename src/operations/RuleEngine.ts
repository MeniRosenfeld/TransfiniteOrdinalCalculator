// RuleEngine.ts
// Rule-based operation execution engine

import type { OrdinalBase } from '../types/OrdinalBase.js';
import type { ConversionEngine } from '../conversions/ConversionEngine.js';

/**
 * Type for rule condition functions that test if a rule applies.
 * @param a - First operand
 * @param b - Second operand
 * @returns True if the rule should be applied, false otherwise
 */
export type RuleCondition = (a: OrdinalBase, b: OrdinalBase) => boolean;

/**
 * Type for rule action functions that execute the operation.
 * @param a - First operand
 * @param b - Second operand
 * @returns The operation result (OrdinalBase for operations, number for comparison)
 */
export type RuleAction = (a: OrdinalBase, b: OrdinalBase) => OrdinalBase | number;

/**
 * Represents a single operation rule (condition-action pair).
 * 
 * Rules follow a pattern-matching approach:
 * 1. Condition is tested against the operands
 * 2. If condition returns true, action is executed
 * 3. First matching rule wins (order matters!)
 * 
 * @example
 * new Rule("Zero left identity",
 *     (a, b) => a.isZero(),
 *     (a, b) => b)
 */
export class Rule {
    readonly name: string;
    readonly condition: RuleCondition;
    readonly action: RuleAction;

    /**
     * Creates a new operation rule.
     * 
     * @param name - Descriptive name for debugging and error messages
     * @param condition - Function that tests if this rule applies
     * @param action - Function that executes the operation
     */
    constructor(name: string, condition: RuleCondition, action: RuleAction) {
        this.name = name;
        this.condition = condition;
        this.action = action;
    }
}

/**
 * Engine for executing rule-based binary operations.
 * 
 * The RuleEngine implements a pattern-matching system where rules are tried in order
 * until one matches. This provides a clean, extensible way to handle operations
 * across many different ordinal types.
 * 
 * **Key Features:**
 * - Rules tried in definition order (specific before general)
 * - First matching rule wins
 * - Fail-fast error handling (condition errors abort operation)
 * - Automatic type conversion via ConversionEngine
 * - Alertness testing for test suite validation
 * 
 * **Rule Ordering Best Practices:**
 * 1. Identity rules first (a+0, a*1, etc.)
 * 2. Zero/trivial cases next
 * 3. Type-specific optimizations
 * 4. General conversion-based fallbacks last
 * 
 * @example
 * const engine = new RuleEngine(conversionEngine);
 * engine.addRule(new Rule("zero identity", (a,b) => a.isZero(), (a,b) => b));
 * engine.addRule(new Rule("both finite", (a,b) => a.isFinite() && b.isFinite(), addFinite));
 * const result = engine.execute(ordinalA, ordinalB, 'addition');
 */
export class RuleEngine {
    private rules: Rule[] = [];
    private conversionEngine: ConversionEngine;

    /**
     * Creates a new RuleEngine.
     * 
     * @param conversionEngine - Engine for automatic type conversions
     */
    constructor(conversionEngine: ConversionEngine) {
        this.rules = [];
        this.conversionEngine = conversionEngine;
    }

    // === ALERTNESS TESTING SYSTEM ===

    /**
     * Global flag enabling alertness testing.
     * When enabled, randomly introduces intentional errors to verify test suites catch them.
     */
    static alertnessTestEnabled = false;

    /**
     * Probability of introducing an error when alertness testing is enabled.
     * Default: 0.001 (0.1% chance per operation)
     */
    static alertnessTestProbability = 1 / 1000;

    /**
     * Enables alertness testing mode.
     * Randomly introduces intentional errors to validate test suite effectiveness.
     * 
     * **Warning:** This will cause random test failures! Only use for test validation.
     * 
     * @param probability - Probability of error per operation (default: 0.001)
     * @example
     * // Enable for test suite validation
     * RuleEngine.enableAlertnessTest(0.001);
     * // Run tests - they should fail!
     * // Disable when done
     * RuleEngine.disableAlertnessTest();
     */
    static enableAlertnessTest(probability: number = 1 / 1000): void {
        RuleEngine.alertnessTestEnabled = true;
        RuleEngine.alertnessTestProbability = probability;
        console.log(`[RuleEngine] Alertness test ENABLED with probability ${probability}`);
    }

    /**
     * Disables alertness testing mode.
     * Returns to normal operation.
     */
    static disableAlertnessTest(): void {
        RuleEngine.alertnessTestEnabled = false;
        console.log('[RuleEngine] Alertness test DISABLED');
    }

    /**
     * Adds a rule to the engine.
     * Rules are applied in the order they are added - add specific rules before general ones.
     * 
     * @param rule - The rule to add
     * @example
     * engine.addRule(new Rule("identity", (a,b) => a.isZero(), (a,b) => b));
     */
    addRule(rule: Rule): void {
        this.rules.push(rule);
    }

    /**
     * Adds multiple rules at once.
     * Convenience method for bulk rule registration.
     * 
     * @param rules - Array of rules to add
     * @example
     * const additionRules = createAdditionRules(conversionEngine);
     * engine.addRules(additionRules);
     */
    addRules(rules: Rule[]): void {
        for (const rule of rules) {
            this.addRule(rule);
        }
    }

    /**
     * Executes the operation by finding and applying the first matching rule.
     * 
     * **Algorithm:**
     * 1. Validate operands are ordinals
     * 2. Apply alertness testing (if enabled)
     * 3. Try each rule's condition in order
     * 4. Execute first matching rule's action
     * 5. Throw error if no rule matches
     * 
     * **Error Handling:**
     * - Condition errors: Operation aborts (fail-fast)
     * - Action errors: Propagated immediately
     * - No match: Throws descriptive error
     * 
     * **Important:** Rules are tried in definition order. More specific rules
     * should be added before general ones.
     * 
     * @param a - First operand
     * @param b - Second operand
     * @param operationName - Name for error messages (default: 'operation')
     * @returns Operation result (OrdinalBase or number for comparison)
     * @throws {Error} If operands are invalid
     * @throws {Error} If rule condition fails (fail-fast)
     * @throws {Error} If no rule matches
     * @example
     * const result = additionEngine.execute(ordinalA, ordinalB, 'addition');
     */
    execute(a: OrdinalBase, b: OrdinalBase, operationName = 'operation'): OrdinalBase | number {
        // Ensure both operands are valid ordinals
        if (!a || !a.isOrdinal || !a.isOrdinal()) {
            throw new Error(`${operationName}: First operand is not a valid ordinal`);
        }
        if (!b || !b.isOrdinal || !b.isOrdinal()) {
            throw new Error(`${operationName}: Second operand is not a valid ordinal`);
        }

        // Alertness test: randomly introduce errors to verify test suites catch them
        if (RuleEngine.alertnessTestEnabled && Math.random() < RuleEngine.alertnessTestProbability) {
            console.warn(`[RuleEngine] ALERTNESS TEST: Introducing intentional error in ${operationName}`);

            if (operationName === 'comparison') {
                // For comparison, return random -1, 0, or 1
                const randomResult = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
                console.warn(`[RuleEngine] ALERTNESS TEST: Returning random comparison result: ${randomResult}`);
                return randomResult;
            } else {
                // For other operations, randomly return a or b
                const randomChoice = Math.random() < 0.5 ? a : b;
                console.warn(`[RuleEngine] ALERTNESS TEST: Returning random operand: ${randomChoice.toString()}`);
                return randomChoice;
            }
        }

        // Try each rule in definition order
        // IMPORTANT: More specific rules should be added before general ones
        for (const rule of this.rules) {
            let matched = false;
            try {
                matched = !!rule.condition(a, b);
            } catch (condErr: unknown) {
                // CRITICAL FIX: If rule condition throws, the entire operation is unreliable
                // We cannot safely continue to other rules as they may give incorrect results
                throw new Error(`${operationName}: Rule "${rule.name}" condition failed with error: ${(condErr as Error).message}. Operation cannot proceed safely.`);
            }

            if (matched) {
                //console.log(`[RuleEngine] ${operationName}: Applied rule "${rule.name}" for ${a.constructor.name} ${operationName} ${b.constructor.name}`);
                try {
                    return rule.action(a, b);
                } catch (actErr) {
                    // If a matching rule's action throws, propagate immediately
                    throw actErr;
                }
            }
        }

        throw new Error(`${operationName}: No rule matched for ${a.constructor.name} ${operationName} ${b.constructor.name}`);
    }

    /**
     * Returns a summary of all registered rules.
     * Useful for debugging and understanding rule order.
     * 
     * @returns Array of objects with rule order and name
     * @example
     * const summary = engine.getRulesSummary();
     * console.log(summary);
     * // [{order: 1, name: "Zero identity"}, {order: 2, name: "Both finite"}, ...]
     */
    getRulesSummary() {
        return this.rules.map((rule, index) => ({
            order: index + 1,
            name: rule.name
        }));
    }
}
