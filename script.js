// script.js

// Assumes calculateOrdinalCNF (from ordinal_calculator.js) and
// renderOrdinalGraphical (from ordinal_graphical_renderer.js) are globally available.
// Assumes Ordinal and OperationTracer (from ordinal_types.js) are available if needed directly here,
// though mostly they are used internally by the calculator.
// Assumes f and ORDINAL_ZERO (from ordinal_mapping.js) are globally available.

/**
 * Converts an Ordinal class instance (from ordinal_types.js)
 * to the format expected by the f() function in ordinal_mapping.js.
 * @param {Ordinal} ordInstance - An instance of the Ordinal class.
 * @returns {object|BigInt} The representation for f().
 */
function convertOrdinalInstanceToFFormat(ordInstance) {
    if (!ordInstance || !(ordInstance instanceof Ordinal)) {
        console.error("Invalid input to convertOrdinalInstanceToFFormat:", ordInstance);
        return typeof ORDINAL_ZERO !== 'undefined' ? ORDINAL_ZERO : 0n; 
    }

    if (ordInstance.isZero()) {
        return typeof ORDINAL_ZERO !== 'undefined' ? ORDINAL_ZERO : 0n;
    }
    if (ordInstance.isFinite()) {
        return ordInstance.getFinitePart(); // Returns a BigInt
    }

    const terms = ordInstance.terms; 

    if (terms.length === 1 && terms[0].coefficient === 1n && !terms[0].exponent.isZero()) {
        const k_rep_for_f = convertOrdinalInstanceToFFormat(terms[0].exponent);
        return { type: 'pow', k: k_rep_for_f };
    }

    const firstTerm = terms[0]; 
    const beta_rep_for_f = convertOrdinalInstanceToFFormat(firstTerm.exponent);
    
    const c_from_ordinal = firstTerm.coefficient; // This is BigInt
    let c_int_for_f = Number(c_from_ordinal); // Convert to Number

    // Warning for potential precision loss if original BigInt was very large
    if ((c_from_ordinal > BigInt(Number.MAX_SAFE_INTEGER) || c_from_ordinal < BigInt(Number.MIN_SAFE_INTEGER)) && Number.isFinite(c_int_for_f)) {
        // Only warn if it's still finite after conversion but was outside safe range.
        // If it became Infinity, ordinal_mapping.js handles that.
        console.warn(`Coefficient ${c_from_ordinal} was outside JS Number safe integer range. Converted to ${c_int_for_f} for f() mapping.`);
    }
    // The f() function in ordinal_mapping.js will validate if c_int_for_f is positive.
    // Ordinal terms should have positive coefficients by definition.

    let delta_rep_for_f;
    if (terms.length === 1) {
        delta_rep_for_f = typeof ORDINAL_ZERO !== 'undefined' ? ORDINAL_ZERO : 0n;
    } else {
        const remainderTerms = terms.slice(1).map(t => ({
            exponent: t.exponent.clone(ordInstance._tracer), 
            coefficient: t.coefficient 
        }));
        const remainderOrdinal = new Ordinal(remainderTerms, ordInstance._tracer); 
        delta_rep_for_f = convertOrdinalInstanceToFFormat(remainderOrdinal);
    }
    
    return { type: 'sum', beta: beta_rep_for_f, c: c_int_for_f, delta: delta_rep_for_f };
}

document.addEventListener('DOMContentLoaded', () => {
    const ordinalInputElement = document.getElementById('ordinalInput');
    const calculateButton = document.getElementById('calculateButton');
    const shareUrlButton = document.getElementById('shareUrlButton');
    const linearResultTextElement = document.getElementById('ordinalResultText');
    const graphicalResultArea = document.getElementById('graphicalResultArea');
    const errorMessageArea = document.getElementById('errorMessageArea');
    const copyTextBtn = document.getElementById('copyTextBtn');
    const copyImageBtn = document.getElementById('copyImageBtn');

    // New element for f(alpha)
    const mappedValueTextElement = document.getElementById('mappedValueText');

    const placeholderText = "Result will appear here.";

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
        const inputString = ordinalInputElement.value;

        // Clear previous results and errors
        linearResultTextElement.textContent = placeholderText;
        linearResultTextElement.className = 'value placeholder-text';
        graphicalResultArea.innerHTML = `<span class="placeholder-text">${placeholderText}</span>`;
        if (mappedValueTextElement) { 
            mappedValueTextElement.textContent = placeholderText;
            mappedValueTextElement.className = 'value placeholder-text';
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

        let ordinalResultObject; 
        try {
            const tempTracer = new OperationTracer(10000000); 
            const tempParser = new OrdinalParser(inputString, tempTracer);
            ordinalResultObject = tempParser.parse(); 

            const cnfString = ordinalResultObject.toStringCNF();
            linearResultTextElement.textContent = cnfString; 
            linearResultTextElement.classList.remove('placeholder-text');

            graphicalResultArea.innerHTML = renderOrdinalGraphical(ordinalResultObject);
            graphicalResultArea.querySelector('.placeholder-text')?.remove();

            if (mappedValueTextElement && ordinalResultObject) {
                try {
                    const fFormattedOrdinal = convertOrdinalInstanceToFFormat(ordinalResultObject);
                    const mappedValue = f(fFormattedOrdinal); 
                    // Display with full precision (JavaScript's default string conversion for numbers)
                    if (typeof mappedValue === 'number' && !isNaN(mappedValue)) {
                        mappedValueTextElement.textContent = mappedValue.toString();
                    } else {
                        mappedValueTextElement.textContent = mappedValue.toString();
                    }
                    mappedValueTextElement.classList.remove('placeholder-text');
                } catch (mapErr) {
                    console.error("Error calculating mapped value f(α):", mapErr);
                    mappedValueTextElement.textContent = "Error";
                    mappedValueTextElement.classList.add('placeholder-text'); 
                }
            }

        } catch (e) {
            errorMessageArea.textContent = `Error: ${e.message}`;
            errorMessageArea.style.display = 'block';
            linearResultTextElement.textContent = placeholderText;
            linearResultTextElement.className = 'value placeholder-text';
            graphicalResultArea.innerHTML = `<span class="placeholder-text" style="color: #c00;">Error in calculation.</span>`;
            if (mappedValueTextElement) {
                mappedValueTextElement.textContent = placeholderText;
                mappedValueTextElement.className = 'value placeholder-text';
            }
        }
    }

    // Helper function to check if a specific URL param was used (for conditional error message)
    function hasUrlParam(paramName = 'expr') {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.has(paramName);
    }

    calculateButton.addEventListener('click', calculateAndDisplay);
    ordinalInputElement.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            calculateAndDisplay();
        }
    });

    copyTextBtn.addEventListener('click', function() {
        const textToCopy = linearResultTextElement.textContent;
        if (textToCopy && textToCopy !== placeholderText) {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(textToCopy).then(() => {
                    alert('CNF text copied to clipboard!');
                }).catch(err => {
                    console.error('Failed to copy text: ', err);
                    prompt("Copy to clipboard failed. Please copy manually:", textToCopy);
                });
            } else {
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

    copyImageBtn.addEventListener('click', function() {
        const graphicalArea = document.getElementById('graphicalResultArea');
        if (graphicalArea.childElementCount === 0 || 
            (graphicalArea.firstElementChild && graphicalArea.firstElementChild.classList.contains('placeholder-text'))) {
            alert("Nothing to copy as image yet.");
            return;
        }

        if (typeof html2canvas === 'undefined') {
            alert("Error: html2canvas library is not loaded. Cannot copy as image.");
            return;
        }

        html2canvas(graphicalArea, {
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
        const urlParams = new URLSearchParams(window.location.search);
        const ordinalExpression = urlParams.get('expr'); 

        if (ordinalExpression !== null) { 
            ordinalInputElement.value = ordinalExpression;
            calculateAndDisplay(); 
        }
    }

    processUrlParameters(); 

    if (shareUrlButton) {
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
});