// script.js

import { OperationTracer } from './OperationTracer.js';
import { calculateSimple } from './SimpleCalculator.js';
import { renderOrdinalSimple, renderOrdinalGraphicalFromStringSimple } from './SimpleRenderer.js';

// New typed ordinal mapping implementation
import { fTyped, type OrdinalRepresentation } from './ordinal_mapping/OrdinalMapping.js';
import { fInverseTyped } from './ordinal_mapping/OrdinalMappingInverse.js';
import { FParams } from './ordinal_mapping/FParams.js';
import { DoubleContext } from './ordinal_mapping/Contexts.js';
import { Interval } from './ordinal_mapping/Interval.js';

// Conversion utilities (from new implementation)
import {
    convertOrdinalInstanceToFFormat,
    convertFFormatToOrdinalInstance
} from './ordinal_mapping/OrdinalMappingCompat.js';

// Create a shared context and params for all f/fInverse operations
const doubleContext = new DoubleContext();
const fParams = FParams.default(doubleContext);

/**
 * Initializes the UI event handlers and interactive elements.
 * This function should be called after the DOM is ready.
 */
export function initializeUI() {
    // Pretty-print floating numbers by rounding to 13 decimals and trimming trailing zeros
    function formatFloat13(n: number): string {
        if (typeof n !== 'number' || !isFinite(n)) return String(n);
        const rounded = Math.round(n * 1e13) / 1e13;
        let s = rounded.toFixed(13);
        // Trim trailing zeros after the last non-zero decimal digit
        s = s.replace(/(\.\d*?[1-9])0+$/, '$1');
        // If all decimals are zeros, drop the decimal part entirely
        s = s.replace(/\.0+$/, '');
        return s;
    }
    const ordinalInputElement = document.getElementById('ordinalInput') as HTMLInputElement;
    const calculateButton = document.getElementById('calculateButton') as HTMLButtonElement;
    const shareUrlButton = document.getElementById('shareUrlButton') as HTMLButtonElement;
    const linearResultTextElement = document.getElementById('ordinalResultText');
    const graphicalResultArea = document.getElementById('graphicalResultArea');
    const errorMessageArea = document.getElementById('errorMessageArea');
    const copyTextBtn = document.getElementById('copyTextBtn') as HTMLButtonElement;
    const copyImageBtn = document.getElementById('copyImageBtn') as HTMLButtonElement;
    const mappedValueTextElement = document.getElementById('mappedValueText');
    const mappedValueSliderElement = document.getElementById('mappedValueSlider') as HTMLInputElement;
    const nudgeControlElement = document.getElementById('nudgeControl'); // Get nudge control
    const placeholderText = "Result will appear here.";
    const simplificationInfoArea = document.getElementById('simplificationInfoArea');
    const graphicalHeaderSimpInfo = document.getElementById('graphicalHeaderSimpInfo');

    // Tooltip logic
    const tooltipTrigger = document.querySelector('.tooltip-trigger');
    console.log('Tooltip Trigger Element:', tooltipTrigger);
    let customTooltipElement: HTMLElement | null = null;

    if (tooltipTrigger) {
        console.log('Tooltip trigger found. Attaching listeners.');
        const tooltipText = tooltipTrigger.getAttribute('data-tooltip');
        console.log('Tooltip text from data-attribute:', tooltipText);

        tooltipTrigger.addEventListener('mouseover', (event) => {
            console.log('Mouseover event fired.');
            if (!tooltipText) {
                console.log('No tooltip text, exiting mouseover.');
                return;
            }

            if (!customTooltipElement) {
                customTooltipElement = document.createElement('div');
                // Apply class FIRST, then set content, then append
                customTooltipElement.className = 'custom-tooltip';
                customTooltipElement.textContent = tooltipText;
                document.body.appendChild(customTooltipElement);
                console.log('Custom tooltip element CREATED, class set, content set, and appended.');
            } else {
                customTooltipElement.textContent = tooltipText; // Update text if reused
                customTooltipElement.className = 'custom-tooltip'; // Ensure class is still there
                console.log('Custom tooltip element REUSED, content set, class ensured.');
            }

            // Ensure it's part of the layout flow but invisible for measurement
            customTooltipElement.style.visibility = 'hidden'; // Use hidden, not 'visible' with opacity 0 yet
            customTooltipElement.style.opacity = '0';
            customTooltipElement.style.position = 'absolute'; // Make sure position is absolute for offsetWidth to work correctly for non-static elements
            customTooltipElement.style.left = '-9999px';
            customTooltipElement.style.top = '-9999px';
            // Explicitly set the width via JS to see if it helps the measurement
            customTooltipElement.style.width = '250px';
            console.log('Tooltip prepped for measurement: JS width set to 250px, class applied.');


            requestAnimationFrame(() => {
                if (!customTooltipElement) return;
                const rect = tooltipTrigger.getBoundingClientRect();
                // Read dimensions *after* being in DOM and styled (hopefully)
                const tooltipWidth = customTooltipElement.offsetWidth;
                const tooltipHeight = customTooltipElement.offsetHeight;

                console.log('--- Inside requestAnimationFrame ---');
                console.log('Trigger rect:', JSON.stringify(rect));
                console.log('Tooltip measured: width=', tooltipWidth, 'height=', tooltipHeight);
                console.log('Tooltip computed style width:', getComputedStyle(customTooltipElement).width);


                if (tooltipWidth === 0 || tooltipHeight === 0 || tooltipWidth > 800 /* sanity check for still being body width */) {
                    console.error(`Tooltip dimensions problematic (w:${tooltipWidth}, h:${tooltipHeight}). Hiding. Check CSS.`);
                    customTooltipElement.style.visibility = 'hidden'; // Ensure it's hidden if dimensions are bad
                    return;
                }

                const Gutter = 5; // Space between trigger and tooltip
                let newLeft = rect.left + window.scrollX;
                let newTop = rect.top + window.scrollY - tooltipHeight - Gutter; // Position above trigger

                // Adjust if tooltip goes off-screen to the top
                if (newTop < window.scrollY) {
                    newTop = rect.bottom + window.scrollY + Gutter; // Position below trigger
                }

                // Adjust if tooltip goes off-screen to the left
                if (newLeft < window.scrollX) {
                    newLeft = window.scrollX + Gutter;
                }

                // Adjust if tooltip goes off-screen to the right
                const viewportWidth = document.documentElement.clientWidth;
                if (newLeft + tooltipWidth > viewportWidth + window.scrollX) {
                    newLeft = viewportWidth + window.scrollX - tooltipWidth - Gutter;
                }

                customTooltipElement.style.left = `${newLeft}px`;
                customTooltipElement.style.top = `${newTop}px`;
                customTooltipElement.style.visibility = 'visible';
                customTooltipElement.style.opacity = '1';
                customTooltipElement.classList.add('show'); // If you use the .show class for transitions

                console.log('Tooltip positioned: left=', customTooltipElement.style.left, 'top=', customTooltipElement.style.top);
                console.log('Tooltip final state: visibility=', getComputedStyle(customTooltipElement).visibility, 'opacity=', getComputedStyle(customTooltipElement).opacity);
                console.log('--- Exiting requestAnimationFrame ---');
            });
        });

        tooltipTrigger.addEventListener('mouseout', () => {
            console.log('Mouseout event fired.');
            if (customTooltipElement) {
                customTooltipElement.style.visibility = 'hidden';
                customTooltipElement.style.opacity = '0';
                // Optional: reset conceptual classes
                // customTooltipElement.classList.remove('tooltip-above', 'tooltip-below');
                console.log('Tooltip set to hidden.');
            }
        });
    } else {
        console.log('Tooltip trigger element NOT found.');
    }

    // --- Set slider max based on fParams --- BEGIN
    if (mappedValueSliderElement && fParams.precomputed && fParams.precomputed.length > 5) {
        const omegaPow5Value = fParams.precomputed[5]; // This is a numeric value in the context
        if (omegaPow5Value) {
            const sliderMaxValue = omegaPow5Value.toNumber();
            mappedValueSliderElement.max = String(sliderMaxValue);
            // If you have a text element displaying the max range, update it here too.
            // For example: document.getElementById('sliderMaxRangeDisplay').textContent = sliderMaxValue.toFixed(3);
            console.log(`Slider max attribute set to: ${sliderMaxValue}`);
        }
    } else {
        console.warn('Could not set slider max value dynamically. fParams.precomputed[5] is not available. Slider will use its HTML default max.');
    }
    // --- Set slider max based on fParams --- END

    function calculateAndDisplay() {
        // Ensure elements exist before proceeding, especially ordinalInputElement
        if (!ordinalInputElement || !linearResultTextElement || !graphicalResultArea || !errorMessageArea) {
            console.warn("Calculator UI elements missing. calculateAndDisplay() will not run. This is expected on test pages.");
            return;
        }

        const inputString = ordinalInputElement.value;

        linearResultTextElement.textContent = placeholderText;
        linearResultTextElement.className = 'value placeholder-text';
        graphicalResultArea.innerHTML = `<span class="placeholder-text">${placeholderText}</span>`;
        if (mappedValueTextElement) {
            mappedValueTextElement.textContent = placeholderText;
            mappedValueTextElement.className = 'value placeholder-text';
        }
        if (mappedValueSliderElement) {
            mappedValueSliderElement.value = '0';
        }
        errorMessageArea.textContent = '';
        errorMessageArea.style.display = 'none';

        if (inputString.trim() === "") {
            if (document.activeElement === calculateButton || (event && event.type === 'keypress')) {
                errorMessageArea.textContent = "Please enter an expression.";
                errorMessageArea.style.display = 'block';
                return;
            }
        }

        let resultFromCalc;
        try {
            // Reset global tracer for each calculation
            OperationTracer.setGlobalTracer(10000000); // 10M operations budget

            // Use new simple calculator (finite ordinals + addition only)
            resultFromCalc = calculateSimple(inputString, 10000000);

            if (resultFromCalc.error) {
                throw new Error(resultFromCalc.error);
            }

            const originalResultObject = resultFromCalc.result;
            const resultType = resultFromCalc.resultType;
            // Use simple result string
            const nativeString = resultFromCalc.resultString;

            // --- Simplification Step (only for ordinals) ---
            const complexityBudget = 1000; // Hardcoded budget
            let simplifiedOrdinalObject = originalResultObject; // Default to original
            let remainingBudget = -1; // Not directly used in new message format
            let simplificationMessage = ""; // Initialize as empty
            let originalComplexity = -1;
            let simplifiedComplexity = -1;

            // Only attempt simplification for ordinal results
            if (resultType === 'ordinal' && originalResultObject && 'simplify' in originalResultObject && typeof originalResultObject.simplify === 'function') {
                try {
                    if ('complexity' in originalResultObject && typeof originalResultObject.complexity === 'function') {
                        originalComplexity = originalResultObject.complexity();
                    }
                    const simplifyResult = originalResultObject.simplify(complexityBudget, false);
                    simplifiedOrdinalObject = simplifyResult.simplifiedOrdinal;
                    // remainingBudget = simplifyResult.remainingBudget; // Store if needed elsewhere
                    if (simplifiedOrdinalObject && 'complexity' in simplifiedOrdinalObject && typeof simplifiedOrdinalObject.complexity === 'function') {
                        simplifiedComplexity = simplifiedOrdinalObject.complexity();
                    }

                    if ('equals' in originalResultObject && typeof originalResultObject.equals === 'function' && !originalResultObject.equals(simplifiedOrdinalObject)) {
                        // Format: "Displayed complexity: G_simp / G_orig"
                        simplificationMessage = `(Displayed complexity: ${simplifiedComplexity} / ${originalComplexity})`;
                    } else {
                        // Always show complexity, even if not simplified.
                        simplificationMessage = `(Complexity: ${originalComplexity})`;
                    }
                } catch (simplifyError) {
                    console.error("Error during simplification:", simplifyError);
                    const errorMessage = simplifyError instanceof Error ? simplifyError.message : String(simplifyError);
                    simplificationMessage = "Error during simplification: " + errorMessage;
                    // Keep simplifiedOrdinalObject as originalOrdinalResultObject in case of simplification error
                }
            }
            // --- End Simplification Step ---

            // Handle different result types for display
            let displayString, displayObject;
            const linearResultHeader = document.querySelector('.linear-result-section h3');

            if (resultType === 'ordinal') {
                displayObject = simplifiedOrdinalObject; // Use simplified for display
                displayString = displayObject ? displayObject.toString() : '';
                if (linearResultHeader) linearResultHeader.textContent = "Linear String Representation:";

                // Render graphical view using new simple renderer
                if (typeof renderOrdinalGraphicalFromStringSimple === 'function') {
                    graphicalResultArea.innerHTML = renderOrdinalGraphicalFromStringSimple(displayString);
                } else if (typeof renderOrdinalSimple === 'function' && displayObject) {
                    graphicalResultArea.innerHTML = renderOrdinalSimple(displayObject);
                } else {
                    graphicalResultArea.innerHTML = `<span class="ordinal-generic">${displayString}</span>`;
                }
            } else {
                // Non-ordinal results (strings, booleans, etc.)
                displayString = nativeString; // Use the formatted result string
                displayObject = originalResultObject;

                // Update header based on result type
                if (linearResultHeader) {
                    switch (resultType) {
                        case 'string':
                            linearResultHeader.textContent = "String Result:";
                            break;
                        case 'boolean':
                            linearResultHeader.textContent = "Boolean Result:";
                            break;
                        case 'comparison':
                            linearResultHeader.textContent = "Comparison Result:";
                            break;
                        case 'operation':
                            linearResultHeader.textContent = "Expression Result:";
                            break;
                        case 'variable':
                            linearResultHeader.textContent = "Variable:";
                            break;
                        case 'successor':
                            linearResultHeader.textContent = "Successor Expression:";
                            break;
                        case 'comparison_op':
                            linearResultHeader.textContent = "Comparison Expression:";
                            break;
                        case 'function':
                            linearResultHeader.textContent = "Function Expression:";
                            break;
                        case 'epsilon':
                            linearResultHeader.textContent = "Epsilon Expression:";
                            break;
                        case 'logical_op':
                            linearResultHeader.textContent = "Logical Expression:";
                            break;
                        default:
                            linearResultHeader.textContent = "Result:";
                    }
                }

                // Simple text display for non-ordinal results
                graphicalResultArea.innerHTML = `<span class="result-${resultType}">${displayString}</span>`;
            }

            // --- Output Format Selection ---
            linearResultTextElement.textContent = displayString;
            // --- End Output Format Selection ---

            // Update linear results
            linearResultTextElement.classList.remove('placeholder-text');
            graphicalResultArea.querySelector('.placeholder-text')?.remove();

            // Update simplification message display (target element will change in HTML)
            // const simplificationInfoArea = document.getElementById('simplificationInfoArea'); // This will be removed/relocated
            if (graphicalHeaderSimpInfo) {
                graphicalHeaderSimpInfo.textContent = simplificationMessage;
                graphicalHeaderSimpInfo.style.display = simplificationMessage ? 'inline' : 'none'; // Show if message exists
            }

            // --- Calculate and Display f(α) for the ORIGINAL ordinal FIRST (only for ordinal results) ---
            if (mappedValueTextElement && resultType === 'ordinal' && originalResultObject) {
                console.log("[fCalc] originalResultObject type:", originalResultObject.constructor.name);
                try {
                    console.log("[fCalc] Calling convertOrdinalInstanceToFFormat with:", originalResultObject);
                    // The mapping logic is now handled by the toFFormat method on each ordinal type.
                    // We can now directly convert the result object.
                    const fFormattedOrdinal = convertOrdinalInstanceToFFormat(originalResultObject);
                    console.log("[fCalc] convertOrdinalInstanceToFFormat returned:", fFormattedOrdinal);

                    console.log("[fCalc] Calling fTyped with:", fFormattedOrdinal, "and params:", fParams);
                    const mappedValueTyped = fTyped(fFormattedOrdinal as OrdinalRepresentation, fParams);
                    const mappedValue = mappedValueTyped.toNumber();
                    console.log("[fCalc] fTyped returned mappedValue:", mappedValue, "(type:", typeof mappedValue, ")");

                    if (typeof mappedValue === 'number' && !isNaN(mappedValue)) {
                        const str = formatFloat13(mappedValue);
                        mappedValueTextElement.textContent = str;
                        if (mappedValueSliderElement) {
                            mappedValueSliderElement.value = String(mappedValue);
                        }
                    } else {
                        console.warn("[fCalc] mappedValue is not a valid number. Value:", mappedValue);
                        mappedValueTextElement.textContent = "Invalid f(α)"; // More explicit error
                        if (mappedValueSliderElement) {
                            mappedValueSliderElement.value = '0';
                        }
                    }
                    mappedValueTextElement.classList.remove('placeholder-text');
                } catch (mapErr) {
                    const errorMsg = mapErr instanceof Error ? mapErr.message : String(mapErr);
                    const errorStack = mapErr instanceof Error ? mapErr.stack : undefined;
                    console.error("[fCalc] Error calculating mapped value f(α):", errorMsg, errorStack);
                    // For non-critical errors, leave any text we might have set; otherwise show a friendly message
                    if (!mappedValueTextElement.textContent || mappedValueTextElement.textContent === placeholderText) {
                        mappedValueTextElement.textContent = "f(α) unavailable";
                        mappedValueTextElement.classList.add('placeholder-text');
                        if (mappedValueSliderElement) {
                            mappedValueSliderElement.value = '0';
                        }
                    }
                }
            } else if (mappedValueTextElement) {
                // Non-ordinal results don't have f-mapping
                mappedValueTextElement.textContent = "N/A (non-ordinal)";
                mappedValueTextElement.classList.add('placeholder-text');
                if (mappedValueSliderElement) {
                    mappedValueSliderElement.value = '0';
                }
            }

        } catch (e) {
            // If error came from calculateOrdinalCNF, e.message would be resultFromCalc.error
            // If error is from parsing/calc logic itself, it's e.message.
            // If error is manually thrown above from resultFromCalc.error, then e.message is that error string.
            // To avoid "Error: Error: ...", check if e.message already starts with "Error: "
            const errorMessage = e instanceof Error ? e.message : String(e);
            const displayErrorMessage = errorMessage.startsWith("Error: ") ? errorMessage : `Error: ${errorMessage}`;
            errorMessageArea.textContent = displayErrorMessage;
            errorMessageArea.style.display = 'block';
            linearResultTextElement.textContent = placeholderText;
            linearResultTextElement.className = 'value placeholder-text';
            graphicalResultArea.innerHTML = `<span class="placeholder-text" style="color: #c00;">Error in calculation.</span>`;
            if (mappedValueTextElement) {
                mappedValueTextElement.textContent = placeholderText;
                mappedValueTextElement.className = 'value placeholder-text';
            }
            if (mappedValueSliderElement) {
                mappedValueSliderElement.value = '0';
            }
            if (simplificationInfoArea) { // Clear old simplification message area if it still exists
                simplificationInfoArea.textContent = '';
                simplificationInfoArea.style.display = 'none';
            }
            if (graphicalHeaderSimpInfo) {
                graphicalHeaderSimpInfo.textContent = '';
                graphicalHeaderSimpInfo.style.display = 'none';
            }
        }
    }

    // Helper function to check if a specific URL param was used (for conditional error message)
    function hasUrlParam(paramName = 'expr') {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.has(paramName);
    }

    // Only add event listeners if the elements exist (they won't on the test page)
    if (calculateButton) {
        calculateButton.addEventListener('click', calculateAndDisplay);
    }

    if (ordinalInputElement) {
        ordinalInputElement.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                calculateAndDisplay();
            }
        });

        // Add event listeners to radio buttons to recalculate on change
        document.querySelectorAll('input[name="outputFormat"]').forEach(radio => {
            radio.addEventListener('change', calculateAndDisplay);
        });

        // Process URL parameters only if input element exists
        processUrlParameters();
    }

    if (copyTextBtn && linearResultTextElement) {
        copyTextBtn.addEventListener('click', function () {
            const textToCopy = linearResultTextElement.textContent;
            if (textToCopy && textToCopy !== placeholderText && linearResultTextElement.classList.contains('placeholder-text') === false) { // Check it's not placeholder
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(textToCopy).then(() => {
                        alert('Text copied to clipboard!');
                    }).catch(err => {
                        console.error('Failed to copy text: ', err);
                        prompt("Copy to clipboard failed. Please copy manually:", textToCopy);
                    });
                } else {
                    // Fallback for older browsers
                    const textArea = document.createElement("textarea");
                    textArea.value = textToCopy;
                    document.body.appendChild(textArea);
                    textArea.focus(); textArea.select();
                    try { document.execCommand('copy'); alert('CNF text copied (fallback)!'); }
                    catch (err) { prompt("Copy to clipboard failed. Please copy manually:", textToCopy); }
                    document.body.removeChild(textArea);
                }
            } else {
                alert("Nothing to copy.");
            }
        });
    }

    if (copyImageBtn && graphicalResultArea) {
        copyImageBtn.addEventListener('click', function () {
            if (graphicalResultArea.childElementCount === 0 ||
                (graphicalResultArea.firstElementChild && graphicalResultArea.firstElementChild.classList.contains('placeholder-text'))) {
                alert("Nothing to copy as image yet.");
                return;
            }

            if (typeof html2canvas === 'undefined') {
                alert("Error: html2canvas library is not loaded. Cannot copy as image.");
                return;
            }

            html2canvas(graphicalResultArea, {
                background: '#FFFFFF',
                scale: 2
            } as any).then(canvas => {
                canvas.toBlob(function (blob) {
                    if (!blob) {
                        alert("Error creating image blob.");
                        return;
                    }
                    if (navigator.clipboard && navigator.clipboard.write) {
                        navigator.clipboard.write([
                            new ClipboardItem({ 'image/png': blob })
                        ]).then(() => {
                            alert('Graphical ordinal copied as image!');
                        }).catch(err => {
                            console.error('Failed to copy image directly: ', err);
                            fallbackImageDownload(canvas);
                        });
                    } else {
                        console.warn('Clipboard API for images not fully supported. Falling back to download.');
                        fallbackImageDownload(canvas);
                    }
                }, 'image/png');
            }).catch(err => {
                console.error("html2canvas failed:", err);
                alert("Error generating image for copying.");
            });
        });
    }

    function fallbackImageDownload(canvas: HTMLCanvasElement) {
        const imageURL = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = imageURL;
        link.download = 'ordinal_cnf_render.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    function processUrlParameters() {
        // Ensure ordinalInputElement exists before trying to use it
        if (!ordinalInputElement) return;

        const urlParams = new URLSearchParams(window.location.search);
        const ordinalExpression = urlParams.get('expr');

        if (ordinalExpression !== null) {
            ordinalInputElement.value = ordinalExpression;
            calculateAndDisplay();
        }
    }

    if (shareUrlButton && ordinalInputElement) {
        const originalShareButtonText = shareUrlButton.textContent;
        shareUrlButton.addEventListener('click', function () {
            const currentExpression = ordinalInputElement.value;
            if (currentExpression.trim() === "") {
                alert("Please enter an ordinal expression first to share.");
                return;
            }

            const encodedExpression = encodeURIComponent(currentExpression);
            const baseUrl = window.location.origin + window.location.pathname;
            const shareableUrl = `${baseUrl}?expr=${encodedExpression}`;

            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(shareableUrl).then(() => {
                    shareUrlButton.textContent = 'Link Copied!';
                    shareUrlButton.classList.add('success');
                    setTimeout(() => {
                        shareUrlButton.textContent = originalShareButtonText;
                        shareUrlButton.classList.remove('success');
                    }, 2000);
                }).catch(err => {
                    console.error('Failed to copy shareable link: ', err);
                    prompt("Copy to clipboard failed. Please copy this link manually:", shareableUrl);
                });
            } else {
                prompt("Please copy this link manually (your browser does not support modern clipboard API):", shareableUrl);
            }
        });
    }

    // --- Nudge Control Logic (Rate-based with internal target) ---
    if (nudgeControlElement && mappedValueSliderElement) {
        let isNudging = false;
        let nudgeStartX = 0;
        let currentNudgeRate = 0;
        let animationFrameId: number | null = null;
        let lastNudgeTimestamp = 0;
        let currentTargetSliderValue = 0; // Internal target value, accumulates fine changes

        const nudgeRateSensitivityPixels = 1000;

        function updateSliderContinuous() {
            if (!isNudging && currentNudgeRate === 0) {
                if (animationFrameId) cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
                return;
            }

            const now = performance.now();
            const deltaTime = (lastNudgeTimestamp && animationFrameId) ? (now - lastNudgeTimestamp) / 1000.0 : 0;
            lastNudgeTimestamp = now;

            if (deltaTime > 0) {
                const changeInValue = currentNudgeRate * deltaTime;
                currentTargetSliderValue += changeInValue;

                const min = parseFloat(mappedValueSliderElement.min);
                const max = parseFloat(mappedValueSliderElement.max);
                if (currentTargetSliderValue < min) currentTargetSliderValue = min;
                if (currentTargetSliderValue > max) currentTargetSliderValue = max;

                // Set the slider's value to the precise target. 
                // The slider's own 'input' event listener will then process this, call fInverse,
                // get an ordinal, and then update the slider to f(ordinal), causing the snap.
                mappedValueSliderElement.value = currentTargetSliderValue.toString();
                const inputEvent = new Event('input', { bubbles: true });
                mappedValueSliderElement.dispatchEvent(inputEvent);
            }

            if (isNudging) { // Continue animation only if actively nudging
                animationFrameId = requestAnimationFrame(updateSliderContinuous);
            } else {
                if (animationFrameId) cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
                currentNudgeRate = 0; // Ensure rate is zeroed if not nudging
            }
        }

        const onMouseMoveNudge = (event: MouseEvent) => {
            if (!isNudging) return;
            const deltaX = event.clientX - nudgeStartX;
            currentNudgeRate = deltaX / nudgeRateSensitivityPixels;
        };

        const onMouseUpNudge = () => {
            if (!isNudging) return;
            isNudging = false;
            // currentNudgeRate is not immediately zeroed here, allowing the animation loop 
            // to make one final update if needed, then it will stop due to isNudging being false.
            // Or, we can zero it: currentNudgeRate = 0; which will stop updates faster.
            // Let's zero it for a more immediate stop on mouse release.
            currentNudgeRate = 0;
            document.removeEventListener('mousemove', onMouseMoveNudge);
            document.removeEventListener('mouseup', onMouseUpNudge);
            document.body.style.cursor = 'default';
            // The animation loop will stop itself as isNudging is false and rate is 0.
        };

        nudgeControlElement.addEventListener('mousedown', (event) => {
            isNudging = true;
            nudgeStartX = event.clientX;
            currentTargetSliderValue = parseFloat(mappedValueSliderElement.value); // Initialize target from current slider
            currentNudgeRate = 0;
            lastNudgeTimestamp = performance.now();
            event.preventDefault();

            document.addEventListener('mousemove', onMouseMoveNudge);
            document.addEventListener('mouseup', onMouseUpNudge);
            document.body.style.cursor = 'ew-resize';

            if (animationFrameId) cancelAnimationFrame(animationFrameId);
            animationFrameId = requestAnimationFrame(updateSliderContinuous);
        });
    }

    // Event listener for the main slider (to call fInverseTyped etc.)
    if (mappedValueSliderElement && ordinalInputElement && typeof convertFFormatToOrdinalInstance === 'function') {
        mappedValueSliderElement.addEventListener('input', function () {
            const sliderValue = parseFloat(this.value);
            if (isNaN(sliderValue)) return;

            console.log(`Slider moved to: ${sliderValue}`);

            try {
                console.log("[fInverseCalc] Starting with sliderValue:", sliderValue);
                console.log("[fInverseCalc] doubleContext:", doubleContext);
                console.log("[fInverseCalc] fParams:", fParams);
                console.log("[fInverseCalc] Interval:", Interval);

                // Wrap the slider value in a small interval [value - 1e-14, value + 1e-14]
                // This provides tolerance for the inverse calculation
                const epsilon = 1e-14;
                const lowerValue = doubleContext.fromNumber(Math.max(0, sliderValue - epsilon));
                const upperValue = doubleContext.fromNumber(sliderValue + epsilon);
                console.log("[fInverseCalc] lowerValue:", lowerValue, "upperValue:", upperValue);

                const sliderInterval = new Interval(lowerValue, upperValue);
                console.log("[fInverseCalc] sliderInterval:", sliderInterval);

                console.log("[fInverseCalc] Calling fInverseTyped...");
                const ordinalRepFromInverse = fInverseTyped(sliderInterval, fParams);
                console.log("[fInverseCalc] fInverseTyped returned:", ordinalRepFromInverse);

                const ordinalInstanceFromInverse = convertFFormatToOrdinalInstance(ordinalRepFromInverse); // Uses global tracer
                console.log("[fInverseCalc] convertFFormatToOrdinalInstance returned:", ordinalInstanceFromInverse);

                const sliderDisplayString = ordinalInstanceFromInverse.toString();
                if (linearResultTextElement) {
                    linearResultTextElement.textContent = sliderDisplayString;
                }
                if (typeof renderOrdinalGraphicalFromStringSimple === 'function') {
                    const textForInverse = ordinalInstanceFromInverse.toString();
                    if (graphicalResultArea) {
                        graphicalResultArea.innerHTML = renderOrdinalGraphicalFromStringSimple(textForInverse);
                    }
                } else if (typeof renderOrdinalSimple === 'function') {
                    if (graphicalResultArea) {
                        graphicalResultArea.innerHTML = renderOrdinalSimple(ordinalInstanceFromInverse);
                    }
                } else {
                    if (graphicalResultArea) {
                        graphicalResultArea.innerHTML = `<span class="ordinal-generic">${sliderDisplayString}</span>`;
                    }
                }
                if (linearResultTextElement) {
                    linearResultTextElement.classList.remove('placeholder-text');
                }
                if (graphicalResultArea) {
                    graphicalResultArea.querySelector('.placeholder-text')?.remove();
                }

                // Update the f(α) text for the new ordinal from slider
                const fFormattedOrdinalFromInverse = convertOrdinalInstanceToFFormat(ordinalInstanceFromInverse);
                console.log("[fInverseCalc] Recalculating f for verification. Calling fTyped with:", fFormattedOrdinalFromInverse, "and params:", fParams);
                const mappedValueVerifyTyped = fTyped(fFormattedOrdinalFromInverse as OrdinalRepresentation, fParams);
                const mappedValueVerify = mappedValueVerifyTyped.toNumber();
                console.log("[fInverseCalc] fTyped returned for verification:", mappedValueVerify);
                if (mappedValueTextElement) {
                    mappedValueTextElement.textContent = typeof mappedValueVerify === 'number' && !isNaN(mappedValueVerify) ? formatFloat13(mappedValueVerify) : "N/A";
                    mappedValueTextElement.classList.remove('placeholder-text');
                }

                // Update the main input box with the linear string representation
                const linearStringForInput = sliderDisplayString;
                if (ordinalInputElement && typeof linearStringForInput === 'string') {
                    ordinalInputElement.value = linearStringForInput;
                }

                // Clear any previous calculation error messages if slider interaction is successful
                if (errorMessageArea) {
                    errorMessageArea.textContent = '';
                    errorMessageArea.style.display = 'none';
                }
                // Clear simplification message when using slider
                if (graphicalHeaderSimpInfo) {
                    graphicalHeaderSimpInfo.textContent = "";
                    graphicalHeaderSimpInfo.style.display = 'none';
                }

                if (window.Worker) { // Use Web Worker for rendering if available
                    // ... existing code ...
                }

            } catch (err) {
                console.error("Error updating ordinal from slider:", err);
                const errorMessage = err instanceof Error ? err.message : String(err);
                if (errorMessageArea) {
                    errorMessageArea.textContent = `Error from slider: ${errorMessage}`;
                    errorMessageArea.style.display = 'block';
                }
                // Optionally clear or set placeholder text for results if inverse fails
                if (linearResultTextElement) {
                    linearResultTextElement.textContent = "Error";
                }
                if (graphicalResultArea) {
                    graphicalResultArea.innerHTML = `<span class="placeholder-text">Error</span>`;
                }
                if (mappedValueTextElement) {
                    mappedValueTextElement.textContent = "Error";
                }
                // Also clear the input field on error, or set to a placeholder
                if (ordinalInputElement) {
                    ordinalInputElement.value = "Error in slider mapping";
                }
            }
        });
    }
}

// Note: This function will be called from main.js after DOM is loaded