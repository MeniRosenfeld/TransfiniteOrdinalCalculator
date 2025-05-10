// script.js

// Assumes calculateOrdinalCNF (from ordinal_calculator.js) and
// renderOrdinalGraphical (from ordinal_graphical_renderer.js) are globally available.
// Assumes Ordinal and OperationTracer (from ordinal_types.js) are available if needed directly here,
// though mostly they are used internally by the calculator.

document.addEventListener('DOMContentLoaded', () => {
    const ordinalInputElement = document.getElementById('ordinalInput');
    const calculateButton = document.getElementById('calculateButton');
    const shareUrlButton = document.getElementById('shareUrlButton');
    const linearResultTextElement = document.getElementById('ordinalResultText');
    const graphicalResultArea = document.getElementById('graphicalResultArea');
    const errorMessageArea = document.getElementById('errorMessageArea');
    const copyTextBtn = document.getElementById('copyTextBtn');
    const copyImageBtn = document.getElementById('copyImageBtn');

    const placeholderText = "Result will appear here.";

    function calculateAndDisplay() {
        const inputString = ordinalInputElement.value;

        // Clear previous results and errors
        linearResultTextElement.textContent = placeholderText;
        linearResultTextElement.className = 'value placeholder-text';
        graphicalResultArea.innerHTML = `<span class="placeholder-text">${placeholderText}</span>`;
        errorMessageArea.textContent = ''; // Clear previous errors
        errorMessageArea.style.display = 'none';


        if (inputString.trim() === "") {
            // Don't show error if input is empty due to no URL param and page just loaded
            // Only show error if user actively tried to calculate an empty string.
            // This logic might need refinement if calculateAndDisplay is called ONLY by user action or URL param.
            // For now, if it's called by URL param and param is empty, it will just show placeholder.
            // If called by button with empty, then show error.
            // The current check is fine if calculateAndDisplay() is only called after some input is present.
            // Let's assume for now the URL param will ensure inputString is not empty if param exists.
            // If called via URL param that IS empty, it will effectively do nothing, showing placeholders.
            // If called by button click and it's empty, it will show the error.

            // If triggered by URL param, and param value is empty, we might not want an error,
            // just the default state. The current check is okay but consider the source of the call.
            // For simplicity with auto-calculation, if the param is there but empty, it will proceed
            // and effectively clear to placeholder. If no param, it also does nothing initially.
            // The error for "Please enter an expression" is more for direct user interaction.
            // So, let's ensure this error message is conditional if we want to avoid it on initial load with empty param.
            // However, if inputString.trim() IS empty when called, the rest of the function handles it gracefully.
            // Let's keep it, as calculateOrdinalCNF("") returns "0".

            // Re-evaluating: if called by URL param, we want to calculate. calculateOrdinalCNF("") is "0".
            // So, we don't need a special error for URL params if they are empty.
            // The original error message is fine for button clicks.
             if (document.activeElement === calculateButton || (event && event.type === 'keypress')) {
                 errorMessageArea.textContent = "Please enter an expression.";
                 errorMessageArea.style.display = 'block';
                 return;
             } else if (inputString.trim() === "" && !hasUrlParam()) { // Only show error if user tries to calculate empty explicitly
                 // If no URL param and user didn't click (i.e. initial load with no param)
                 // then do nothing, just show placeholders.
                 // This part is tricky. Let's simplify: if calculateAndDisplay is called, it processes current input.
             }
             // If input is empty (e.g. from empty URL param), calculateOrdinalCNF will handle it (returns "0").
        }

        let ordinalResultObject; // To store the Ordinal object
        try {
            const cnfStringOrError = calculateOrdinalCNF(inputString /*, optionalMaxOperations */);

            if (typeof cnfStringOrError === 'string' && cnfStringOrError.startsWith("Error:")) {
                 throw new Error(cnfStringOrError.substring("Error: ".length)); 
            }
            
            const tempTracer = new OperationTracer(10000000); 
            const tempParser = new OrdinalParser(inputString, tempTracer);
            ordinalResultObject = tempParser.parse(); 

            linearResultTextElement.textContent = cnfStringOrError; 
            linearResultTextElement.classList.remove('placeholder-text');

            graphicalResultArea.innerHTML = renderOrdinalGraphical(ordinalResultObject);
            graphicalResultArea.querySelector('.placeholder-text')?.remove();

        } catch (e) {
            errorMessageArea.textContent = `Error: ${e.message}`;
            errorMessageArea.style.display = 'block';
            linearResultTextElement.textContent = placeholderText;
            linearResultTextElement.className = 'value placeholder-text';
            graphicalResultArea.innerHTML = `<span class="placeholder-text" style="color: #c00;">Error in calculation.</span>`;
        }
    }

    // Helper function to check if a specific URL param was used (for conditional error message)
    // This might not be strictly necessary with the revised logic but could be useful.
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
            backgroundColor: '#FFFFFF', // White background for the image
            scale: 2 // Increase scale for better resolution
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
        // alert("Image download initiated (could not copy directly)."); // Alert can be annoying here
    }

    // --- New code to handle URL parameter ---
    function processUrlParameters() {
        const urlParams = new URLSearchParams(window.location.search);
        const ordinalExpression = urlParams.get('expr'); // Using 'expr' as the parameter name

        if (ordinalExpression !== null) { // Check if 'expr' parameter exists
            // URLSearchParams.get already decodes the parameter value
            ordinalInputElement.value = ordinalExpression;
            calculateAndDisplay(); // Automatically calculate
        }
    }

    processUrlParameters(); // Call this function when the DOM is ready
    // --- End of new code ---

    // --- New code for Share URL Button ---
    if (shareUrlButton) {
        shareUrlButton.addEventListener('click', function() {
            const currentExpression = ordinalInputElement.value;
            if (currentExpression.trim() === "") {
                alert("Please enter an ordinal expression first to share.");
                return;
            }

            const encodedExpression = encodeURIComponent(currentExpression);
            // Construct the base URL (protocol, host, pathname)
            const baseUrl = window.location.origin + window.location.pathname;
            const shareableUrl = `${baseUrl}?expr=${encodedExpression}`;

            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(shareableUrl).then(() => {
                    alert('Shareable link copied to clipboard!\n' + shareableUrl);
                }).catch(err => {
                    console.error('Failed to copy shareable link: ', err);
                    prompt("Copy to clipboard failed. Please copy this link manually:", shareableUrl);
                });
            } else {
                // Fallback for older browsers (less common for this simple text copy)
                prompt("Please copy this link manually (your browser does not support modern clipboard API):", shareableUrl);
            }
        });
    }
    // --- End of new code for Share URL Button ---
});