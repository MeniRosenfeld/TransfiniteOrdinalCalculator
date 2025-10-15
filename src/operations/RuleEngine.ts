// RuleEngine.ts
// Rule-based operation execution engine

import type { OrdinalBase } from '../types/OrdinalBase.js';
import type { ConversionEngine } from '../conversions/ConversionEngine.js';

export type RuleCondition = (a: OrdinalBase, b: OrdinalBase) => boolean;
export type RuleAction = (a: OrdinalBase, b: OrdinalBase) => OrdinalBase | number;

/**
 * Represents a single operation rule.
 */
export class Rule {
    readonly name: string;
    readonly condition: RuleCondition;
    readonly action: RuleAction;

    constructor(name: string, condition: RuleCondition, action: RuleAction) {
        this.name = name;
        this.condition = condition;
        this.action = action;
    }
}

/**
 * Engine for executing rule-based binary operations.
 */
export class RuleEngine {
    private rules: Rule[] = [];
    private conversionEngine: ConversionEngine;

    constructor(conversionEngine: ConversionEngine) {
        this.rules = [];
        this.conversionEngine = conversionEngine;
    }

    /**
     * Global alertness test system - when enabled, randomly introduces errors
     * to verify that test suites actually catch problems.
     */
    static alertnessTestEnabled = false;
    static alertnessTestProbability = 1 / 1000; // 0.1% chance of error

    static enableAlertnessTest(probability: number = 1 / 1000): void {
        RuleEngine.alertnessTestEnabled = true;
        RuleEngine.alertnessTestProbability = probability;
        console.log(`[RuleEngine] Alertness test ENABLED with probability ${probability}`);
    }

    static disableAlertnessTest(): void {
        RuleEngine.alertnessTestEnabled = false;
        console.log('[RuleEngine] Alertness test DISABLED');
    }

    /**
     * Adds a rule to the engine.
     * Rules are applied in the order they are added.
     */
    addRule(rule: Rule): void {
        this.rules.push(rule);
    }

    /**
     * Adds multiple rules at once.
     */
    addRules(rules: Rule[]): void {
        for (const rule of rules) {
            this.addRule(rule);
        }
    }

    /**
 * Executes the operation by finding the first matching rule.
 * Rules are tried in the order they were added.
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
 */
    getRulesSummary() {
        return this.rules.map((rule, index) => ({
            order: index + 1,
            name: rule.name
        }));
    }
}
