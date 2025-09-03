// RuleEngine.js
// Rule-based operation execution engine

/**
 * Represents a single operation rule.
 */
class Rule {
    constructor(name, condition, action) {
        this.name = name;
        this.condition = condition; // (a, b) => boolean
        this.action = action;       // (a, b) => result
    }
}

/**
 * Engine for executing rule-based binary operations.
 */
class RuleEngine {
    constructor(conversionEngine) {
        this.rules = [];
        this.conversionEngine = conversionEngine;
    }

    /**
     * Adds a rule to the engine.
     * Rules are applied in the order they are added.
     */
    addRule(rule) {
        this.rules.push(rule);
    }

    /**
     * Adds multiple rules at once.
     */
    addRules(rules) {
        for (const rule of rules) {
            this.addRule(rule);
        }
    }

    /**
 * Executes the operation by finding the first matching rule.
 * Rules are tried in the order they were added.
 */
    execute(a, b, operationName = 'operation') {
        // Ensure both operands are valid ordinals
        if (!a || !a.isOrdinal || !a.isOrdinal()) {
            throw new Error(`${operationName}: First operand is not a valid ordinal`);
        }
        if (!b || !b.isOrdinal || !b.isOrdinal()) {
            throw new Error(`${operationName}: Second operand is not a valid ordinal`);
        }

        // Try each rule in definition order
        for (const rule of this.rules) {
            try {
                if (rule.condition(a, b)) {
                    console.log(`[RuleEngine] ${operationName}: Applied rule "${rule.name}" for ${a.constructor.name} ${operationName} ${b.constructor.name}`);
                    return rule.action(a, b);
                }
            } catch (e) {
                console.warn(`[RuleEngine] ${operationName}: Rule "${rule.name}" threw error:`, e.message);
                // Continue to next rule
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

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Rule, RuleEngine };
} else {
    // Browser globals
    window.Rule = Rule;
    window.RuleEngine = RuleEngine;
}
