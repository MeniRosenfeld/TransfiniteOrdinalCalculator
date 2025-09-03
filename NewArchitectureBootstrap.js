// NewArchitectureBootstrap.js
// Bootstraps the new ordinal architecture system

/**
 * Initializes the new ordinal architecture.
 * This file demonstrates how the new system will work.
 */
function initializeNewArchitecture() {
    console.log('[Bootstrap] Initializing new ordinal architecture...');

    // Create global operations instance
    if (typeof OPERATIONS === 'undefined') {
        window.OPERATIONS = new Operations();
    }

    // Register types (as they get migrated)
    const typesToRegister = [
        FiniteOrdinal,  // Migrated
        CNFOrdinal,     // Migrated
        // ENFOrdinal,    // TODO: Migrate
        // EpsilonOrdinal, // TODO: Migrate
        // WTowerOrdinal, // TODO: Migrate
        // EpsilonTowerOrdinal, // TODO: Migrate
        // EpsilonTunnelOrdinal // TODO: Migrate
    ];

    // Initialize static instances for migrated types
    if (typeof CNFOrdinal !== 'undefined' && CNFOrdinal.initializeStatics) {
        CNFOrdinal.initializeStatics();
    }

    for (const typeClass of typesToRegister) {
        if (typeClass && typeClass.getTypeName && typeClass.getDirectConversions) {
            OPERATIONS.registry.registerType(typeClass);
        }
    }

    // Initialize the system
    OPERATIONS.initialize();

    console.log('[Bootstrap] New architecture initialized');
    console.log('[Bootstrap] Diagnostics:', OPERATIONS.getDiagnostics());
}

// Public API functions that will eventually replace the current dispatchers
function addOrdinals(a, b) {
    return OPERATIONS.add(a, b);
}

function multiplyOrdinals(a, b) {
    return OPERATIONS.multiply(a, b);
}

function powerOrdinals(a, b) {
    return OPERATIONS.power(a, b);
}

function tetrateOrdinals(a, b) {
    return OPERATIONS.tetrate(a, b);
}

function convertOrdinal(ordinal, targetTypeName) {
    return OPERATIONS.convert(ordinal, targetTypeName);
}

function canConvertOrdinal(ordinal, targetTypeName) {
    return OPERATIONS.canConvert(ordinal, targetTypeName);
}

// Initialize when DOM is ready
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        // Delay to ensure all scripts are loaded
        setTimeout(() => {
            try {
                initializeNewArchitecture();
            } catch (e) {
                console.error('[Bootstrap] Failed to initialize new architecture:', e);
            }
        }, 200);
    });
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initializeNewArchitecture,
        addOrdinals,
        multiplyOrdinals,
        powerOrdinals,
        tetrateOrdinals,
        convertOrdinal,
        canConvertOrdinal
    };
}
