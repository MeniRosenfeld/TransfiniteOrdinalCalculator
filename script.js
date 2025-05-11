// script.js

// Assumes calculateOrdinalCNF (from ordinal_calculator.js) and
// renderOrdinalGraphical (from ordinal_graphical_renderer.js) are globally available.
// Assumes Ordinal and OperationTracer (from ordinal_types.js) are available if needed directly here,
// though mostly they are used internally by the calculator.
// Assumes f and ORDINAL_ZERO (from ordinal_mapping.js) are globally available.

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

    /**
     * Converts an Ordinal class instance (from ordinal_types.js)
     * to the format expected by the f() function in ordinal_mapping.js.
     * @param {Ordinal} ordInstance - An instance of the Ordinal class.
     * @returns {object|number} The representation for f().
     */
    function convertOrdinalInstanceToFFormat(ordInstance) {
        if (!ordInstance || !(ordInstance instanceof Ordinal)) {
            console.error("Invalid input to convertOrdinalInstanceToFFormat:", ordInstance);
            // ORDINAL_ZERO should be globally available from ordinal_mapping.js
            return typeof ORDINAL_ZERO !== 'undefined' ? ORDINAL_ZERO : 0;
        }

        if (ordInstance.isZero()) {
            return typeof ORDINAL_ZERO !== 'undefined' ? ORDINAL_ZERO : 0;
        }
        if (ordInstance.isFinite()) {
            return ordInstance.getFinitePart(); // Assumes this returns a number
        }

        // ordInstance is infinite and not zero.
        const terms = ordInstance.terms;

        // Case 1: Represents ω^k (single term, coefficient 1, exponent > 0)
        // The Ordinal class stores ω^k as terms: [{ exponent: k_object, coefficient: 1 }]
        // where k_object itself is an Ordinal.
        if (terms.length === 1 && terms[0].coefficient === 1 && !terms[0].exponent.isZero()) {
            const k_rep_for_f = convertOrdinalInstanceToFFormat(terms[0].exponent);
            return { type: 'pow', k: k_rep_for_f };
        }

        // Case 2: Represents a sum ω^β * c + δ (or just ω^β * c if only one term with c > 1 or exp=0)
        // The first term in CNF is ω^β * c.
        const firstTerm = terms[0]; // This is { exponent: Ordinal, coefficient: number }
        const beta_rep_for_f = convertOrdinalInstanceToFFormat(firstTerm.exponent);
        const c_int_for_f = firstTerm.coefficient;
        let delta_rep_for_f;

        if (terms.length === 1) {
            // This means it was ω^β * c (where c > 1 if β > 0, or β=0 and c is the finite value)
            // If beta_rep_for_f is 0 (from exp being Ordinal.ZERO) and c_int_for_f is finite,
            // then this should have been caught by ordInstance.isFinite().
            // So, we assume beta_rep_for_f corresponds to an exponent > 0 if it's not finite.
            delta_rep_for_f = typeof ORDINAL_ZERO !== 'undefined' ? ORDINAL_ZERO : 0;
        } else {
            // The rest of the terms form delta.
            // Create a new Ordinal instance for the remainder.
            const remainderTerms = terms.slice(1).map(t => ({
                exponent: t.exponent.clone(ordInstance._tracer), // Clone with tracer
                coefficient: t.coefficient
            }));
            // Pass the original tracer; if null, new Ordinal will handle it.
            const remainderOrdinal = new Ordinal(remainderTerms, ordInstance._tracer); 
            delta_rep_for_f = convertOrdinalInstanceToFFormat(remainderOrdinal);
        }
        
        return { type: 'sum', beta: beta_rep_for_f, c: c_int_for_f, delta: delta_rep_for_f };
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
                    mappedValueTextElement.textContent = mappedValue.toString(); 
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