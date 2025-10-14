// SimpleRenderer.ts
// Simple graphical renderer for new architecture ordinals

import type { OrdinalBase } from './types/OrdinalBase.js';
import type { ParseResult } from './parser-types.js';
import { OperationTracer } from './OperationTracer.js';
import { SimpleParser } from './SimpleParser.js';

/**
 * Renders an ordinal to HTML using the new architecture.
 * Each ordinal type implements its own toGraphicalHTML() method.
 */
export function renderOrdinalSimple(ordinal: ParseResult): string {
    if (!ordinal) {
        return '<span class="ordinal-error">Invalid Ordinal</span>';
    }

    // Try type-specific rendering first
    if (typeof (ordinal as any).toGraphicalHTML === 'function') {
        return (ordinal as any).toGraphicalHTML();
    }

    // Fallback to string representation
    if (typeof (ordinal as any).toString === 'function') {
        return `<span class="ordinal-generic">${(ordinal as any).toString()}</span>`;
    }

    return `<span class="ordinal-generic">${JSON.stringify(ordinal)}</span>`;
}

/**
 * Renders an ordinal from its string representation.
 * This maintains compatibility with the existing renderOrdinalGraphicalFromString function.
 */
export function renderOrdinalGraphicalFromStringSimple(ordinalString: string): string {
    try {
        OperationTracer.setGlobalTracer(1000000);
        const parser = new SimpleParser(ordinalString);
        const ordinal = parser.parse();
        return renderOrdinalSimple(ordinal);
    } catch (e: any) {
        console.error('renderOrdinalGraphicalFromStringSimple: failed to parse/render string:', ordinalString, e);
        return `<span class="ordinal-error">Error: ${e.message}</span>`;
    }
}
