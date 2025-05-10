document.addEventListener('DOMContentLoaded', async () => {
    const resultsContainer = document.getElementById('test-results');
    let wasmExports = null;

    function log(message, className = '') {
        const entry = document.createElement('div');
        entry.textContent = message;
        if (className) entry.classList.add(className);
        resultsContainer.appendChild(entry);
    }

    function logDetail(message) {
        const entry = document.createElement('div');
        entry.textContent = message;
        entry.classList.add('details');
        resultsContainer.appendChild(entry);
    }

    // 1. Load the Wasm module
    try {
        // This is example boilerplate for loading Wasm. Adjust as per your Wasm setup.
        // Ensure 'ordinal_haskell.wasm' is the correct path relative to haskell_comparison_test.html
        const response = await fetch('ordinal_haskell.wasm'); 
        if (!response.ok) {
            throw new Error(`Failed to fetch Wasm module: ${response.status} ${response.statusText}`);
        }
        const buffer = await response.arrayBuffer();
        const module = await WebAssembly.compile(buffer);
        
        // Define helper functions for CString interop if not provided by a tool like Emscripten
        // These are conceptual and need to be robustly implemented based on your Wasm export strategy
        const memory = new WebAssembly.Memory({ initial: 256 }); // Example, might be imported/exported by Wasm
        const importObject = {
            env: {
                memory: memory,
                // Add any other imports your Wasm module expects (e.g., for logging from Wasm, etc.)
                // consoleLogStringFromWasm: (ptr, len) => { /* ... read string from Wasm memory ... */ }
            }
        };

        const instance = await WebAssembly.instantiate(module, importObject);
        wasmExports = instance.exports;
        
        // If your Wasm module exports its own memory, you might need to use wasmExports.memory instead of the one created above.
        // Or if it initializes memory itself via a function like `wasmExports._initialize()`.

        log('Haskell Wasm module loaded successfully.', 'status-passed');

    } catch (e) {
        log(`Error loading Haskell Wasm module: ${e.message}`, 'status-failed');
        console.error(e);
        return; 
    }

    if (!wasmExports || !wasmExports.hs_add_from_strings || !wasmExports.hs_multiply_from_strings || !wasmExports.hs_power_from_strings) {
        log('One or more required Haskell Wasm functions (hs_add_from_strings, hs_multiply_from_strings, hs_power_from_strings) are not exported from ordinal_haskell.wasm.', 'status-failed');
        return;
    }
    
    // --- Test Cases ---
    const testCases = [
        { name: "w + (w+1)", op1_expr: "w", op2_expr: "w+1", op_symbol: "+", hs_func_name: "hs_add_from_strings" },
        { name: "1 + w", op1_expr: "1", op2_expr: "w", op_symbol: "+", hs_func_name: "hs_add_from_strings" },
        { name: "(w+1) + 2", op1_expr: "w+1", op2_expr: "2", op_symbol: "+", hs_func_name: "hs_add_from_strings" },
        { name: "0+w", op1_expr: "0", op2_expr: "w", op_symbol: "+", hs_func_name: "hs_add_from_strings" },
        { name: "w+0", op1_expr: "w", op2_expr: "0", op_symbol: "+", hs_func_name: "hs_add_from_strings" },

        { name: "w * 2", op1_expr: "w", op2_expr: "2", op_symbol: "*", hs_func_name: "hs_multiply_from_strings" },
        { name: "2 * w", op1_expr: "2", op2_expr: "w", op_symbol: "*", hs_func_name: "hs_multiply_from_strings" },
        { name: "(w+1) * w", op1_expr: "w+1", op2_expr: "w", op_symbol: "*", hs_func_name: "hs_multiply_from_strings" },
        { name: "w * (w+1)", op1_expr: "w", op2_expr: "w+1", op_symbol: "*", hs_func_name: "hs_multiply_from_strings" },
        { name: "(w+1)*(w+1)", op1_expr: "w+1", op2_expr: "w+1", op_symbol: "*", hs_func_name: "hs_multiply_from_strings" },
        { name: "w * 0", op1_expr: "w", op2_expr: "0", op_symbol: "*", hs_func_name: "hs_multiply_from_strings" },
        { name: "0 * w", op1_expr: "0", op2_expr: "w", op_symbol: "*", hs_func_name: "hs_multiply_from_strings" },
        { name: "w * 1", op1_expr: "w", op2_expr: "1", op_symbol: "*", hs_func_name: "hs_multiply_from_strings" },
        { name: "1 * w", op1_expr: "1", op2_expr: "w", op_symbol: "*", hs_func_name: "hs_multiply_from_strings" },

        { name: "w ^ 2", op1_expr: "w", op2_expr: "2", op_symbol: "^", hs_func_name: "hs_power_from_strings" },
        { name: "2 ^ w", op1_expr: "2", op2_expr: "w", op_symbol: "^", hs_func_name: "hs_power_from_strings" },
        { name: "(w+1) ^ 2", op1_expr: "w+1", op2_expr: "2", op_symbol: "^", hs_func_name: "hs_power_from_strings" },
        { name: "w ^ 0", op1_expr: "w", op2_expr: "0", op_symbol: "^", hs_func_name: "hs_power_from_strings" },
        { name: "0 ^ w", op1_expr: "0", op2_expr: "w", op_symbol: "^", hs_func_name: "hs_power_from_strings" }, // Expects "0" if w > 0
        { name: "1 ^ w", op1_expr: "1", op2_expr: "w", op_symbol: "^", hs_func_name: "hs_power_from_strings" },
        { name: "w ^ 1", op1_expr: "w", op2_expr: "1", op_symbol: "^", hs_func_name: "hs_power_from_strings" },
        
        // More complex combinations
        { name: "(w*2+1)*(w+3)", op1_expr: "w*2+1", op2_expr: "w+3", op_symbol: "*", hs_func_name: "hs_multiply_from_strings" },
        { name: "w^w", op1_expr: "w", op2_expr: "w", op_symbol: "^", hs_func_name: "hs_power_from_strings" },
        { name: "2^(w+1)", op1_expr: "2", op2_expr: "w+1", op_symbol: "^", hs_func_name: "hs_power_from_strings" },
        { name: "w^(w+1)", op1_expr: "w", op2_expr: "w+1", op_symbol: "^", hs_func_name: "hs_power_from_strings" }
    ];

    // Conceptual: JS string to CString pointer in Wasm memory
    function stringToWasmCString(str, wasmInstance) {
        const encoder = new TextEncoder(); // UTF-8
        const bytes = encoder.encode(str + '\0'); // Null-terminate for C
        const ptr = wasmInstance.exports.allocate_memory_for_string(bytes.length); // Assumes Wasm exports an allocator
        if (ptr === 0) throw new Error("Failed to allocate Wasm memory for string");
        const memoryView = new Uint8Array(wasmInstance.exports.memory.buffer, ptr, bytes.length);
        memoryView.set(bytes);
        return ptr;
    }

    // Conceptual: CString pointer in Wasm memory to JS string
    function wasmCStringToJsString(ptr, wasmInstance) {
        if (ptr === 0) return ""; // Or handle error
        const memoryView = new Uint8Array(wasmInstance.exports.memory.buffer);
        let end = ptr;
        while (memoryView[end] !== 0) { // Find null terminator
            end++;
        }
        const bytes = memoryView.subarray(ptr, end);
        const decoder = new TextDecoder(); // UTF-8
        return decoder.decode(bytes);
    }

    // Conceptual: free memory allocated in Wasm
    function freeWasmCString(ptr, wasmInstance) {
        if (ptr !== 0) {
            wasmInstance.exports.free_memory_for_string(ptr); // Assumes Wasm exports a deallocator
        }
    }


    for (const tc of testCases) {
        log(`Test: ${tc.name}`, 'test-case');
        let hs_result_cnf = "Error: Haskell Wasm function not properly called or returned error.";
        let js_result_cnf = "Error: JavaScript calculation failed.";

        try {
            // JavaScript Calculation
            const js_op1_cnf = calculateOrdinalCNF(tc.op1_expr);
            const js_op2_cnf = calculateOrdinalCNF(tc.op2_expr);
            const js_combined_expr = `(${tc.op1_expr}) ${tc.op_symbol} (${tc.op2_expr})`;
            js_result_cnf = calculateOrdinalCNF(js_combined_expr);
            logDetail(`  JS Input 1 CNF: "${js_op1_cnf}"`);
            logDetail(`  JS Input 2 CNF: "${js_op2_cnf}"`);
            logDetail(`  JS Result for "${js_combined_expr}": "${js_result_cnf}"`);

            // Haskell Calculation
            // This part requires robust CString handling. The conceptual functions above are placeholders.
            // Your Haskell Wasm exports will define how strings are actually passed.
            // Example (if your Haskell function takes and returns CString pointers):
            let ptr1 = 0, ptr2 = 0, resultPtr = 0;
            try {
                // Ensure your Wasm module exports memory management functions like these,
                // or use a higher-level binding generator like Emscripten's.
                if (typeof wasmExports.allocate_memory_for_string !== 'function' ||
                    typeof wasmExports.free_memory_for_string !== 'function') {
                    throw new Error("Wasm module does not export required memory management functions (allocate_memory_for_string, free_memory_for_string).");
                }

                ptr1 = stringToWasmCString(js_op1_cnf, {exports: wasmExports});
                ptr2 = stringToWasmCString(js_op2_cnf, {exports: wasmExports});
                
                const hs_func = wasmExports[tc.hs_func_name];
                if (typeof hs_func !== 'function') {
                    throw new Error(`Haskell Wasm function ${tc.hs_func_name} not found or not a function.`);
                }

                resultPtr = hs_func(ptr1, ptr2);
                hs_result_cnf = wasmCStringToJsString(resultPtr, {exports: wasmExports});

            } finally {
                if (ptr1 !== 0) freeWasmCString(ptr1, {exports: wasmExports});
                if (ptr2 !== 0) freeWasmCString(ptr2, {exports: wasmExports});
                if (resultPtr !== 0) freeWasmCString(resultPtr, {exports: wasmExports}); // Haskell function should return a new CString that JS must free
            }
            logDetail(`  Haskell Result (from inputs "${js_op1_cnf}", "${js_op2_cnf}"): "${hs_result_cnf}"`);


            if (js_result_cnf === hs_result_cnf) {
                log("  Status: PASSED", "status-passed");
            } else {
                log(`  Status: FAILED. JS got "${js_result_cnf}", Haskell got "${hs_result_cnf}"`, "status-failed");
            }
        } catch (e) {
            log(`  Error during test "${tc.name}": ${e.message}`, "status-failed");
            console.error(`Error in test case ${tc.name}:`, e);
            // Log the partially computed results if available
            if (js_result_cnf !== "Error: JavaScript calculation failed.") {
                 logDetail(`  JS Result (partial): "${js_result_cnf}"`);
            }
             if (hs_result_cnf !== "Error: Haskell Wasm function not properly called or returned error.") {
                 logDetail(`  Haskell Result (partial/error): "${hs_result_cnf}"`);
            }
        }
    }
}); 