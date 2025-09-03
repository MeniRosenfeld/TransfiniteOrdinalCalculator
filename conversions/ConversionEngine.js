// ConversionEngine.js
// Universal conversion engine using computed paths

/**
 * Universal conversion engine that can convert any ordinal to any other type
 * using the shortest path computed by ConversionRegistry.
 */
class ConversionEngine {
    constructor(registry) {
        this.registry = registry;
    }

    /**
     * Converts an ordinal to the target type using the shortest available path.
     * @param {OrdinalBase} ordinal - The ordinal to convert
     * @param {string} targetTypeName - The target type name
     * @returns {OrdinalBase} - The converted ordinal
     */
    convert(ordinal, targetTypeName) {
        if (!ordinal || !ordinal.isOrdinal || !ordinal.isOrdinal()) {
            throw new Error('ConversionEngine.convert: Invalid ordinal object');
        }

        const sourceTypeName = ordinal.constructor.getTypeName();

        // Identity conversion
        if (sourceTypeName === targetTypeName) {
            return ordinal.clone();
        }

        // Get conversion path
        const path = this.registry.getConversionPath(sourceTypeName, targetTypeName);
        if (!path) {
            throw new Error(`No conversion path from ${sourceTypeName} to ${targetTypeName}`);
        }

        // Apply conversions along the path
        let current = ordinal;
        for (const stepType of path) {
            current = current.convertTo(stepType);
        }

        return current;
    }

    /**
     * Returns true if conversion is possible.
     */
    canConvert(ordinal, targetTypeName) {
        if (!ordinal || !ordinal.isOrdinal || !ordinal.isOrdinal()) {
            return false;
        }

        const sourceTypeName = ordinal.constructor.getTypeName();
        return this.registry.canConvert(sourceTypeName, targetTypeName);
    }

    /**
     * Converts an ordinal to the "best" type for a given operation.
     * This implements a priority system for choosing target types.
     */
    convertToBestType(ordinal, preferredTypes = ['ENF', 'CNF']) {
        for (const preferredType of preferredTypes) {
            if (this.canConvert(ordinal, preferredType)) {
                return this.convert(ordinal, preferredType);
            }
        }

        // If no preferred type works, return as-is
        return ordinal;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ConversionEngine;
} else {
    // Browser global
    window.ConversionEngine = ConversionEngine;
}
