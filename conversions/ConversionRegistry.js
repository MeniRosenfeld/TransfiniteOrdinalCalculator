// ConversionRegistry.js
// Manages the conversion DAG between ordinal types

/**
 * Registry for managing conversions between ordinal types.
 * Builds a DAG of direct conversions and computes indirect paths.
 */
class ConversionRegistry {
    constructor() {
        this.directConversions = new Map(); // typeName -> Set<targetTypeNames>
        this.conversionPaths = new Map();   // "source->target" -> [path]
        this.typeClasses = new Map();       // typeName -> class constructor
    }

    /**
     * Registers an ordinal type and its direct conversion capabilities.
     */
    registerType(typeClass) {
        const typeName = typeClass.getTypeName();
        const directTargets = new Set(typeClass.getDirectConversions());

        this.directConversions.set(typeName, directTargets);
        this.typeClasses.set(typeName, typeClass);

        console.log(`[ConversionRegistry] Registered ${typeName} with direct conversions to:`, Array.from(directTargets));
    }

    /**
     * Computes all possible conversion paths using Floyd-Warshall algorithm.
     * Must be called after all types are registered.
     */
    computeAllPaths() {
        console.log('[ConversionRegistry] Computing conversion paths...');

        const typeNames = Array.from(this.directConversions.keys());
        const n = typeNames.length;

        // Initialize distance matrix
        const dist = new Map();
        const next = new Map();

        // Initialize with direct conversions (distance 1)
        for (const source of typeNames) {
            for (const target of typeNames) {
                const key = `${source}->${target}`;
                if (source === target) {
                    dist.set(key, 0);
                    next.set(key, []);
                } else if (this.directConversions.get(source).has(target)) {
                    dist.set(key, 1);
                    next.set(key, [target]);
                } else {
                    dist.set(key, Infinity);
                    next.set(key, null);
                }
            }
        }

        // Floyd-Warshall: find shortest paths
        for (const k of typeNames) {
            for (const i of typeNames) {
                for (const j of typeNames) {
                    const ikKey = `${i}->${k}`;
                    const kjKey = `${k}->${j}`;
                    const ijKey = `${i}->${j}`;

                    const distIK = dist.get(ikKey);
                    const distKJ = dist.get(kjKey);
                    const distIJ = dist.get(ijKey);

                    if (distIK + distKJ < distIJ) {
                        dist.set(ijKey, distIK + distKJ);
                        const pathIK = next.get(ikKey) || [];
                        const pathKJ = next.get(kjKey) || [];
                        next.set(ijKey, [...pathIK, ...pathKJ]);
                    }
                }
            }
        }

        // Store computed paths
        this.conversionPaths = next;

        // Log results
        let pathCount = 0;
        for (const [key, path] of this.conversionPaths) {
            if (path && path.length > 0) {
                pathCount++;
                console.log(`[ConversionRegistry] ${key}: ${path.join(' -> ')}`);
            }
        }
        console.log(`[ConversionRegistry] Computed ${pathCount} conversion paths`);
    }

    /**
     * Gets the conversion path from source type to target type.
     * Returns null if no path exists.
     */
    getConversionPath(sourceTypeName, targetTypeName) {
        const key = `${sourceTypeName}->${targetTypeName}`;
        return this.conversionPaths.get(key);
    }

    /**
     * Returns true if conversion from source to target is possible.
     */
    canConvert(sourceTypeName, targetTypeName) {
        const path = this.getConversionPath(sourceTypeName, targetTypeName);
        return path !== null && path !== undefined;
    }

    /**
     * Gets the class constructor for a type name.
     */
    getTypeClass(typeName) {
        return this.typeClasses.get(typeName);
    }

    /**
     * Gets all registered type names.
     */
    getTypeNames() {
        return Array.from(this.typeClasses.keys());
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ConversionRegistry;
} else {
    // Browser global
    window.ConversionRegistry = ConversionRegistry;
}
