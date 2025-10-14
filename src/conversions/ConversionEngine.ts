// ConversionEngine.ts
// Universal conversion engine using computed paths

import type { OrdinalBase } from '../types/OrdinalBase.js';
import type { ConversionRegistry } from './ConversionRegistry.js';

/**
 * Universal conversion engine that can convert any ordinal to any other type
 * using the shortest path computed by ConversionRegistry.
 */
export class ConversionEngine {
    private registry: ConversionRegistry;

    constructor(registry: ConversionRegistry) {
        this.registry = registry;
    }

    /**
     * Converts an ordinal to the target type using the shortest available path.
     */
    convert(ordinal: OrdinalBase, targetTypeName: string): OrdinalBase {
        if (!ordinal || !ordinal.isOrdinal || !ordinal.isOrdinal()) {
            throw new Error('ConversionEngine.convert: Invalid ordinal object');
        }

        const sourceTypeName = (ordinal.constructor as any).getTypeName();

        // Identity conversion
        if (sourceTypeName === targetTypeName) {
            return ordinal;
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
    canConvert(ordinal: OrdinalBase, targetTypeName: string): boolean {
        if (!ordinal || !ordinal.isOrdinal || !ordinal.isOrdinal()) {
            return false;
        }

        const sourceTypeName = (ordinal.constructor as any).getTypeName();
        return this.registry.canConvert(sourceTypeName, targetTypeName);
    }

    /**
     * Converts an ordinal to the "best" type for a given operation.
     * This implements a priority system for choosing target types.
     */
    convertToBestType(ordinal: OrdinalBase, preferredTypes: string[] = ['ENF', 'CNF']): OrdinalBase {
        for (const preferredType of preferredTypes) {
            if (this.canConvert(ordinal, preferredType)) {
                return this.convert(ordinal, preferredType);
            }
        }

        // If no preferred type works, return as-is
        return ordinal;
    }
}
