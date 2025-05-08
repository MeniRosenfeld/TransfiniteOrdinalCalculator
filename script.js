// script.js

// Assumes calculateOrdinalCNF (from ordinal_calculator.js) and
// renderOrdinalGraphical (from ordinal_graphical_renderer.js) are globally available.
// Assumes Ordinal and OperationTracer (from ordinal_types.js) are available if needed directly here,
// though mostly they are used internally by the calculator.

document.addEventListener('DOMContentLoaded', () => {
    const ordinalInputElement = document.getElementById('ordinalInput');
    const calculateButton = document.getElementById('calculateButton');
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
            errorMessageArea.textContent = "Please enter an expression.";
            errorMessageArea.style.display = 'block';
            return;
        }

        let ordinalResultObject; // To store the Ordinal object
        try {
            // calculateOrdinalCNF is defined in ordinal_calculator.js
            // It internally creates OperationTracer and OrdinalParser
            const cnfStringOrError = calculateOrdinalCNF(inputString /*, optionalMaxOperations */);

            if (typeof cnfStringOrError === 'string' && cnfStringOrError.startsWith("Error:")) {
                 throw new Error(cnfStringOrError.substring("Error: ".length)); // Re-throw to be caught below
            }
            
            // If successful, we need the Ordinal object itself for graphical rendering.
            // This requires calculateOrdinalCNF to perhaps return an object {cnfString, ordinalObject, error}
            // OR we re-parse here if we only get a string. For now, let's re-parse for simplicity,
            // though it's less efficient. A better approach would be for calculateOrdinalCNF
            // to return the Ordinal object on success.

            // Temporary re-parse to get Ordinal object for graphical rendering.
            // In a more integrated setup, calculateOrdinalCNF would return the object.
            const tempTracer = new OperationTracer(10000000); // Separate budget for this display parse
            const tempParser = new OrdinalParser(inputString, tempTracer);
            ordinalResultObject = tempParser.parse(); // This might throw if input was invalid for original calc.

            linearResultTextElement.textContent = cnfStringOrError; // This is the string from calculateOrdinalCNF
            linearResultTextElement.classList.remove('placeholder-text');

            graphicalResultArea.innerHTML = renderOrdinalGraphical(ordinalResultObject);
            graphicalResultArea.querySelector('.placeholder-text')?.remove();


        } catch (e) {
            errorMessageArea.textContent = `Error: ${e.message}`;
            errorMessageArea.style.display = 'block';
            // Clear result areas on error
            linearResultTextElement.textContent = placeholderText;
            linearResultTextElement.className = 'value placeholder-text';
            graphicalResultArea.innerHTML = `<span class="placeholder-text" style="color: #c00;">Error in calculation.</span>`;
        }
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
});