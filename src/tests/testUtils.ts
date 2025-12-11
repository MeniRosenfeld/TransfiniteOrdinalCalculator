/**
 * Shared DOM helpers for browser-based test pages.
 */
export function requireElementById<T extends HTMLElement = HTMLElement>(id: string): T {
    const element = document.getElementById(id);
    if (!element) {
        throw new Error(`Element with id="${id}" was not found in the document.`);
    }
    return element as T;
}

export function requireQuerySelector<T extends Element = HTMLElement>(
    root: ParentNode,
    selector: string,
): T {
    const element = root.querySelector(selector);
    if (!element) {
        throw new Error(`Selector "${selector}" was not found within the provided root.`);
    }
    return element as T;
}

export function createStatusElement(text: string, statusClass: 'status-passed' | 'status-failed'): HTMLParagraphElement {
    const paragraph = document.createElement('p');
    paragraph.textContent = text;
    paragraph.className = statusClass;
    return paragraph;
}

export function assertInstanceOf<T>(
    value: unknown,
    constructor: new (...args: never[]) => T,
    message: string,
): T {
    if (!(value instanceof constructor)) {
        throw new Error(message);
    }
    return value;
}

