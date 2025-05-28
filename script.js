// script.js

// Assumes calculateOrdinalCNF (from ordinal_calculator.js) and
// renderOrdinalGraphical (from ordinal_graphical_renderer.js) are globally available.
// Assumes CNFOrdinal, EpsilonNaughtOrdinal, WTowerOrdinal, and OperationTracer (from ordinal_types.js) are available.
// Assumes f, ORDINAL_ZERO, and convertOrdinalInstanceToFFormat (from ordinal_mapping.js) are globally available.
// Assumes fInverse and convertFFormatToOrdinalInstance (from ordinal_mapping_inverse.js) are globally available.

// The convertOrdinalInstanceToFFormat function that was previously here is now removed.
// Its definition in ordinal_mapping.js will be used.

document.addEventListener('DOMContentLoaded', () => {
    const ordinalInputElement = document.getElementById('ordinalInput');
    const calculateButton = document.getElementById('calculateButton');
    const shareUrlButton = document.getElementById('shareUrlButton');
    const linearResultTextElement = document.getElementById('ordinalResultText');
    const graphicalResultArea = document.getElementById('graphicalResultArea');
    const errorMessageArea = document.getElementById('errorMessageArea');
    const copyTextBtn = document.getElementById('copyTextBtn');
    const copyImageBtn = document.getElementById('copyImageBtn');
    const mappedValueTextElement = document.getElementById('mappedValueText');
    const mappedValueSliderElement = document.getElementById('mappedValueSlider');
    const nudgeControlElement = document.getElementById('nudgeControl'); // Get nudge control
    const placeholderText = "Result will appear here.";
    const simplificationInfoArea = document.getElementById('simplificationInfoArea');
    const graphicalHeaderSimpInfo = document.getElementById('graphicalHeaderSimpInfo');

    // Tooltip logic
    const tooltipTrigger = document.querySelector('.tooltip-trigger');
    console.log('Tooltip Trigger Element:', tooltipTrigger); 
    let customTooltipElement = null; 

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
            mappedValueSliderElement.value = 0;
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
            // const tempTracer = new OperationTracer(10000000); // REMOVE THIS LINE
            
            // Pass the budget number directly
            resultFromCalc = calculateOrdinalCNF(inputString, 10000000); // PASS BUDGET NUMBER

            if (resultFromCalc.error) {
                throw new Error(resultFromCalc.error); 
            }
            
            const originalOrdinalResultObject = resultFromCalc.ordinalObject;
            // const cnfString = resultFromCalc.cnfString; // Original CNF string, not used directly for display anymore

            // --- Simplification Step ---
            const complexityBudget = 1000; // Hardcoded budget
            let simplifiedOrdinalObject = originalOrdinalResultObject; // Default to original
            let remainingBudget = -1; // Not directly used in new message format
            let simplificationMessage = ""; // Initialize as empty
            let originalComplexity = -1;
            let simplifiedComplexity = -1;

            if (originalOrdinalResultObject && typeof originalOrdinalResultObject.simplify === 'function') {
                try {
                    originalComplexity = originalOrdinalResultObject.complexity();
                    const simplifyResult = originalOrdinalResultObject.simplify(complexityBudget, false); 
                    simplifiedOrdinalObject = simplifyResult.simplifiedOrdinal;
                    // remainingBudget = simplifyResult.remainingBudget; // Store if needed elsewhere
                    simplifiedComplexity = simplifiedOrdinalObject.complexity();

                    if (!originalOrdinalResultObject.equals(simplifiedOrdinalObject)) {
                        // Format: "Displayed complexity: G_simp / G_orig"
                        simplificationMessage = `(Displayed complexity: ${simplifiedComplexity} / ${originalComplexity})`; 
                    } else {
                        // No simplification message if they are equal.
                        simplificationMessage = ""; 
                    }
                } catch (simplifyError) {
                    console.error("Error during simplification:", simplifyError);
                    simplificationMessage = "Error during simplification: " + simplifyError.message;
                    // Keep simplifiedOrdinalObject as originalOrdinalResultObject in case of simplification error
                }
            }
            // --- End Simplification Step ---

            const displayOrdinalObject = simplifiedOrdinalObject; // Use simplified for display
            const displayCnfString = displayOrdinalObject.toStringCNF();

            // Update linear and graphical results with the (potentially) simplified ordinal
            linearResultTextElement.textContent = displayCnfString; 
            linearResultTextElement.classList.remove('placeholder-text');

            graphicalResultArea.innerHTML = renderOrdinalGraphical(displayOrdinalObject);
            graphicalResultArea.querySelector('.placeholder-text')?.remove();

            // Update simplification message display (target element will change in HTML)
            // const simplificationInfoArea = document.getElementById('simplificationInfoArea'); // This will be removed/relocated
            if (graphicalHeaderSimpInfo) {
                graphicalHeaderSimpInfo.textContent = simplificationMessage;
                graphicalHeaderSimpInfo.style.display = simplificationMessage ? 'inline' : 'none'; // Show if message exists
            }

            // --- Calculate and Display f(α) for the ORIGINAL ordinal FIRST ---
            if (mappedValueTextElement && originalOrdinalResultObject) { 
                console.log("[fCalc] originalOrdinalResultObject type:", originalOrdinalResultObject.constructor.name);
                try {
                    console.log("[fCalc] Calling convertOrdinalInstanceToFFormat with:", originalOrdinalResultObject);
                    const fFormattedOrdinal = convertOrdinalInstanceToFFormat(originalOrdinalResultObject);
                    console.log("[fCalc] convertOrdinalInstanceToFFormat returned:", fFormattedOrdinal);
                    
                    console.log("[fCalc] Calling f with:", fFormattedOrdinal);
                    const mappedValue = f(fFormattedOrdinal); 
                    console.log("[fCalc] f returned mappedValue:", mappedValue, "(type:", typeof mappedValue, ")");

                    if (typeof mappedValue === 'number' && !isNaN(mappedValue)) {
                        mappedValueTextElement.textContent = mappedValue.toString();
                        if (mappedValueSliderElement) { 
                            mappedValueSliderElement.value = mappedValue;
                        }
                    } else {
                        console.warn("[fCalc] mappedValue is not a valid number. Value:", mappedValue);
                        mappedValueTextElement.textContent = "Invalid f(α)"; // More explicit error
                         if (mappedValueSliderElement) { 
                            mappedValueSliderElement.value = 0;
                        }
                    }
                    mappedValueTextElement.classList.remove('placeholder-text');
                } catch (mapErr) {
                    console.error("[fCalc] Error calculating mapped value f(α):", mapErr.message, mapErr.stack);
                    mappedValueTextElement.textContent = "f(α) Error!"; // More explicit error
                    mappedValueTextElement.classList.add('placeholder-text'); 
                    if (mappedValueSliderElement) { 
                        mappedValueSliderElement.value = 0;
                    }
                }
            }

        } catch (e) {
            // If error came from calculateOrdinalCNF, e.message would be resultFromCalc.error
            // If error is from parsing/calc logic itself, it's e.message.
            // If error is manually thrown above from resultFromCalc.error, then e.message is that error string.
            // To avoid "Error: Error: ...", check if e.message already starts with "Error: "
            const displayErrorMessage = e.message.startsWith("Error: ") ? e.message : `Error: ${e.message}`;
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
                mappedValueSliderElement.value = 0;
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

        // Process URL parameters only if input element exists
        processUrlParameters(); 
    }

    if (copyTextBtn && linearResultTextElement) {
        copyTextBtn.addEventListener('click', function() {
            const textToCopy = linearResultTextElement.textContent;
            if (textToCopy && textToCopy !== placeholderText && linearResultTextElement.classList.contains('placeholder-text') === false) { // Check it's not placeholder
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(textToCopy).then(() => {
                        alert('CNF text copied to clipboard!');
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
        copyImageBtn.addEventListener('click', function() {
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
                backgroundColor: '#FFFFFF', 
                scale: 2 
            }).then(canvas => {
                canvas.toBlob(function(blob) {
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

    function fallbackImageDownload(canvas) {
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
        shareUrlButton.addEventListener('click', function() {
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
        let animationFrameId = null;
        let lastNudgeTimestamp = 0;
        let currentTargetSliderValue = 0; // Internal target value, accumulates fine changes

        const nudgeRateSensitivityPixels = 10000; 

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

        const onMouseMoveNudge = (event) => {
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

    // Event listener for the main slider (to call fInverse etc.)
    if (mappedValueSliderElement && ordinalInputElement && typeof fInverse === 'function' && typeof convertFFormatToOrdinalInstance === 'function') {
        mappedValueSliderElement.addEventListener('input', function() {
            const sliderValue = parseFloat(this.value);
            if (isNaN(sliderValue)) return;

            console.log(`Slider moved to: ${sliderValue}`);

            try {
                const fFormatValue = fInverse(sliderValue);
                console.log(`fInverse returned:`, fFormatValue);

                let ordinalInstance = null;

                if (fFormatValue && typeof fFormatValue === 'object' && fFormatValue.error) {
                    console.warn("fInverse explicitly returned an error object:", fFormatValue.error);
                    // Don't proceed if fInverse itself had an error
                } else if (fFormatValue === undefined || fFormatValue === null) {
                    console.warn("fInverse returned null or undefined.");
                } else {
                    // Pass directly to convertFFormatToOrdinalInstance, assuming it handles all valid types
                    const tracer = new OperationTracer(100000); // Budget for conversion
                    ordinalInstance = convertFFormatToOrdinalInstance(fFormatValue, tracer);
                }

                if (ordinalInstance) {
                    const ordinalString = ordinalInstance.toStringCNF();
                    console.log(`Converted to ordinal string: ${ordinalString}`);
                    if (ordinalString.trim() !== "") {
                        ordinalInputElement.value = ordinalString;
                        calculateAndDisplay();
                    } else {
                        console.warn("Converted ordinal string is empty.");
                    }
                } else if (!(fFormatValue && typeof fFormatValue === 'object' && fFormatValue.error)) {
                    // Only log this if it wasn't an explicit error from fInverse already or null/undefined
                    console.error("Failed to obtain an ordinal instance from fInverse's result. convertFFormatToOrdinalInstance might have failed or fFormatValue was unsuitable.", fFormatValue);
                }
            } catch (err) {
                console.error("Error during fInverse or conversion/update:", err);
            }
        });
    }
});