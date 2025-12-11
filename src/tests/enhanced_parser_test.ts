import type { OrdinalBase } from "../types/OrdinalBase.js";
import { OperationTracer } from "../OperationTracer.js";
import { SimpleParser } from "../SimpleParser.js";
import { initializeTestEnvironment } from "./testEnvironment.js";
import { requireElementById } from "./testUtils.js";

type ComparisonOp = "EQ" | "NEQ" | "LT" | "GT" | "LTE" | "GTE" | "COMPARE";
type OperationOp = "add" | "multiply" | "power" | "tetrate" | string;

type ParserBooleanResult = { type: "boolean"; value: boolean };
type ParserStringResult = { type: "string"; value: string };
type ParserComparisonResult = { type: "comparison"; value: -1 | 0 | 1 };
type ParserVariableResult = { type: "variable"; name: string };
type ParserFunctionNode = { type: "function"; name: string; args: ParserValue[] };
type ParserComparisonNode = { type: "comparison_op"; operator: ComparisonOp; left: ParserValue; right: ParserValue };
type ParserEpsilonNode = { type: "epsilon"; index: ParserValue };
type ParserSuccessorNode = { type: "successor"; operand: ParserValue };
type ParserOperationNode = { type: "operation"; operator: OperationOp; left: ParserValue; right: ParserValue };

type ParserValue =
    | OrdinalBase
    | ParserBooleanResult
    | ParserStringResult
    | ParserComparisonResult
    | ParserVariableResult
    | ParserFunctionNode
    | ParserComparisonNode
    | ParserEpsilonNode
    | ParserSuccessorNode
    | ParserOperationNode
    | null
    | undefined;

type ExpectedResult = string | null | ParserValue | ((result: ParserValue) => boolean);

type TestStats = {
    total: number;
    passed: number;
    failed: number;
    errors: number;
};

const hasType = <T extends string>(
    value: ParserValue,
    type: T,
): value is Extract<ParserValue, { type: T }> => {
    return Boolean(value && typeof value === "object" && "type" in value && (value as { type: string }).type === type);
};

const isOrdinal = (value: ParserValue): value is OrdinalBase => {
    return Boolean(value && typeof value === "object" && typeof (value as OrdinalBase).isZero === "function");
};

const isBooleanResult = (value: ParserValue): value is ParserBooleanResult => hasType(value, "boolean");
const isStringResult = (value: ParserValue): value is ParserStringResult => hasType(value, "string");
const isComparisonResult = (value: ParserValue): value is ParserComparisonResult => hasType(value, "comparison");
const isOperationNode = (value: ParserValue): value is ParserOperationNode => hasType(value, "operation");
const isVariableNode = (value: ParserValue): value is ParserVariableResult => hasType(value, "variable");

// Extracted from enhanced_parser_test.html

// Original <scripttype="module">

        initializeTestEnvironment(100000);
        console.log('[Test] Enhanced Parser tests initialized');

    

// Original <script> tag

        // Global variables and functions
        let testStats: TestStats = {
            total: 0,
            passed: 0,
            failed: 0,
            errors: 0
        };

        function resetStats(): void {
            testStats = { total: 0, passed: 0, failed: 0, errors: 0 };
        }

        function updateStats(): void {
            const statsDiv = requireElementById<HTMLDivElement>('test-stats');
            const passRate = testStats.total > 0 ? ((testStats.passed / testStats.total) * 100).toFixed(1) : 0;

            statsDiv.innerHTML = `
                <strong>Total Tests:</strong> ${testStats.total}<br>
                <strong>Passed:</strong> ${testStats.passed} (${passRate}%)<br>
                <strong>Failed:</strong> ${testStats.failed}<br>
                <strong>Errors:</strong> ${testStats.errors}
            `;
        }

        function runTest(expression: string, expectedResult: ExpectedResult, description: string, sectionId: string): void {
            testStats.total++;

            try {
                OperationTracer.reset(10000); // Fresh budget for each test
                const parser = new SimpleParser(expression);
                const result = parser.parse() as ParserValue;

                let resultStr = formatResult(result);
                let passed = false;

                if (typeof expectedResult === 'function') {
                    // Custom validation function
                    passed = expectedResult(result);
                } else if (typeof expectedResult === 'string') {
                    // String comparison
                    passed = resultStr === expectedResult;
                } else {
                    // Direct comparison
                    passed = deepEqual(result, expectedResult);
                }

                const testDiv = document.createElement('div');
                testDiv.className = passed ? 'test-pass' : 'test-fail';

                if (passed) {
                    testStats.passed++;
                    testDiv.innerHTML = `✓ ${description}<br>Expression: <code>${expression}</code><br>Result: <code>${resultStr}</code>`;
                } else {
                    testStats.failed++;
                    testDiv.innerHTML = `✗ ${description}<br>Expression: <code>${expression}</code><br>Expected: <code>${expectedResult}</code><br>Got: <code>${resultStr}</code>`;
                }

                requireElementById<HTMLElement>(sectionId).appendChild(testDiv);

            } catch (error) {
                testStats.errors++;
                const testDiv = document.createElement('div');
                testDiv.className = 'test-error';
                const message = error instanceof Error ? error.message : String(error);
                testDiv.innerHTML = `⚠ ${description}<br>Expression: <code>${expression}</code><br>Error: <code>${message}</code>`;
                requireElementById<HTMLElement>(sectionId).appendChild(testDiv);
            }

            updateStats();
        }

        function formatResult(result: ParserValue): string {
            if (isOrdinal(result)) {
                return result.toString();
            }
            if (hasType(result, "string")) {
                return `"${result.value}"`;
            }
            if (hasType(result, "boolean")) {
                return result.value.toString();
            }
            if (hasType(result, "comparison")) {
                switch (result.value) {
                    case -1: return '<';
                    case 0: return '=';
                    case 1: return '>';
                    default: return result.value.toString();
                }
            }
            if (hasType(result, "variable")) {
                return result.name;
            }
            if (hasType(result, "operation")) {
                return formatOperationTree(result);
            }
            if (hasType(result, "function")) {
                return formatFunctionTree(result);
            }
            if (hasType(result, "comparison_op")) {
                return formatComparisonTree(result);
            }
            if (hasType(result, "epsilon")) {
                return `e_${formatOperationValue(result.index)}`;
            }
            if (hasType(result, "successor")) {
                return `${formatOperationValue(result.operand)}'`;
            }
            return String(result);
        }

        function formatOperationTree(operation: ParserValue): string {
            if (!hasType(operation, "operation")) {
                return String(operation);
            }

            const leftStr = formatOperationValue(operation.left);
            const rightStr = formatOperationValue(operation.right);

            switch (operation.operator) {
                case 'add': return `${leftStr}+${rightStr}`;
                case 'multiply': return `${leftStr}*${rightStr}`;
                case 'power': return `${leftStr}^${rightStr}`;
                case 'tetrate': return `${leftStr}^^${rightStr}`;
                default: return `${leftStr} ${operation.operator} ${rightStr}`;
            }
        }

        function formatOperationValue(value: ParserValue): string {
            if (isOrdinal(value)) {
                return value.toString();
            }
            if (!value || typeof value !== 'object') {
                return String(value);
            }

            if (hasType(value, "variable")) {
                return value.name;
            }
            if (hasType(value, "operation")) {
                return `(${formatOperationTree(value)})`;
            }
            if (hasType(value, "function")) {
                return formatFunctionTree(value);
            }
            if (hasType(value, "comparison_op")) {
                return formatComparisonTree(value);
            }
            if (hasType(value, "epsilon")) {
                return `e_${formatOperationValue(value.index)}`;
            }
            if (hasType(value, "successor")) {
                return `${formatOperationValue(value.operand)}'`;
            }
            if (hasType(value, "string")) {
                return `"${value.value}"`;
            }
            if (hasType(value, "boolean")) {
                return value.value.toString();
            }
            return String(value);
        }

        function formatFunctionTree(func: ParserValue): string {
            if (!hasType(func, "function")) {
                return String(func);
            }
            const argsStr = func.args.map(arg => formatOperationValue(arg)).join(',');
            return `${func.name}[${argsStr}]`;
        }

        function formatComparisonTree(comp: ParserValue): string {
            if (!hasType(comp, "comparison_op")) {
                return String(comp);
            }
            const leftStr = formatOperationValue(comp.left);
            const rightStr = formatOperationValue(comp.right);
            const opStr = comparisonOperatorToString(comp.operator);
            return `(${leftStr} ${opStr} ${rightStr})`;
        }

        function comparisonOperatorToString(operator: ComparisonOp): string {
            switch (operator) {
                case 'EQ': return '=';
                case 'NEQ': return '!=';
                case 'LT': return '<';
                case 'GT': return '>';
                case 'LTE': return '<=';
                case 'GTE': return '>=';
                case 'COMPARE': return '?';
                default: return operator;
            }
        }

        function deepEqual(a: ParserValue, b: ParserValue): boolean {
            if (a === b) return true;

            // Handle ordinal objects
            if (isOrdinal(a) && isOrdinal(b) && typeof a.equals === 'function') {
                return a.equals(b);
            }

            // Handle our custom objects
            if (hasType(a, "boolean") && hasType(b, "boolean")) {
                return a.value === b.value;
            }
            if (hasType(a, "string") && hasType(b, "string")) {
                return a.value === b.value;
            }
            if (hasType(a, "comparison") && hasType(b, "comparison")) {
                return a.value === b.value;
            }
            if (hasType(a, "variable") && hasType(b, "variable")) {
                return a.name === b.name;
            }

            return false;
        }

        function clearResults(): void {
            const sections = ['basic-ordinals', 'comparison-tests', 'boolean-tests', 'string-tests',
                'function-tests', 'complex-tests', 'precedence-tests', 'variable-tests', 'error-tests'];

            sections.forEach(sectionId => {
                const section = requireElementById<HTMLElement>(sectionId);
                // Remove all test result divs
                const testDivs = section.querySelectorAll('.test-result, .test-pass, .test-fail, .test-error');
                testDivs.forEach(div => div.remove());
            });
        }

        function runAllTests(): void {
            clearResults();
            resetStats();

            // Basic ordinal expressions (should still work)
            runTest('0', '0', 'Zero ordinal', 'basic-ordinals');
            runTest('1', '1', 'One ordinal', 'basic-ordinals');
            runTest('42', '42', 'Finite ordinal', 'basic-ordinals');
            runTest('w', 'w', 'Omega ordinal', 'basic-ordinals');
            runTest('e_0', 'e_0', 'Epsilon zero', 'basic-ordinals');
            runTest('e_1', 'e_1', 'Epsilon one', 'basic-ordinals');
            runTest('w+1', 'w+1', 'Ordinal addition', 'basic-ordinals');
            runTest('w*2', 'w*2', 'Ordinal multiplication', 'basic-ordinals');
            runTest('w^2', 'w^2', 'Ordinal exponentiation', 'basic-ordinals');
            runTest('2^^3', '16', 'Finite tetration', 'basic-ordinals');
            runTest('0\'', '1', 'Successor of zero', 'basic-ordinals');
            runTest('5\'', '6', 'Successor of finite', 'basic-ordinals');
            runTest('w\'', 'w+1', 'Successor of omega', 'basic-ordinals');
            runTest('w\'\'', 'w+2', 'Double successor', 'basic-ordinals');

            // Comparison operators
            runTest('1 = 1', (r) => isBooleanResult(r) && r.value === true, 'Equal comparison (true)', 'comparison-tests');
            runTest('1 = 2', (r) => isBooleanResult(r) && r.value === false, 'Equal comparison (false)', 'comparison-tests');
            runTest('w > 5', (r) => isBooleanResult(r) && r.value === true, 'Greater than (true)', 'comparison-tests');
            runTest('5 > w', (r) => isBooleanResult(r) && r.value === false, 'Greater than (false)', 'comparison-tests');
            runTest('w >= w', (r) => isBooleanResult(r) && r.value === true, 'Greater than or equal', 'comparison-tests');
            runTest('1 < w', (r) => isBooleanResult(r) && r.value === true, 'Less than', 'comparison-tests');
            runTest('w <= e_0', (r) => isBooleanResult(r) && r.value === true, 'Less than or equal', 'comparison-tests');
            runTest('1 != 2', (r) => isBooleanResult(r) && r.value === true, 'Not equal (true)', 'comparison-tests');
            runTest('5 != 5', (r) => isBooleanResult(r) && r.value === false, 'Not equal (false)', 'comparison-tests');

            // Comparison operator ?
            runTest('1 ? 2', (r) => isComparisonResult(r) && r.value === -1, 'Compare operator (less)', 'comparison-tests');
            runTest('5 ? 5', (r) => isComparisonResult(r) && r.value === 0, 'Compare operator (equal)', 'comparison-tests');
            runTest('w ? 1', (r) => isComparisonResult(r) && r.value === 1, 'Compare operator (greater)', 'comparison-tests');

            // Boolean logic
            runTest('true', (r) => isBooleanResult(r) && r.value === true, 'Boolean literal true', 'boolean-tests');
            runTest('false', (r) => isBooleanResult(r) && r.value === false, 'Boolean literal false', 'boolean-tests');
            runTest('TRUE', (r) => isBooleanResult(r) && r.value === true, 'Boolean literal TRUE (case insensitive)', 'boolean-tests');
            runTest('False', (r) => isBooleanResult(r) && r.value === false, 'Boolean literal False (case insensitive)', 'boolean-tests');
            runTest('!true', (r) => isBooleanResult(r) && r.value === false, 'Logical NOT true', 'boolean-tests');
            runTest('!false', (r) => isBooleanResult(r) && r.value === true, 'Logical NOT false', 'boolean-tests');
            runTest('!0', (r) => isBooleanResult(r) && r.value === true, 'Logical NOT zero', 'boolean-tests');
            runTest('!w', (r) => isBooleanResult(r) && r.value === false, 'Logical NOT omega', 'boolean-tests');

            runTest('(1=1) && (2=2)', (r) => isBooleanResult(r) && r.value === true, 'Logical AND (true)', 'boolean-tests');
            runTest('(1=1) && (1=2)', (r) => isBooleanResult(r) && r.value === false, 'Logical AND (false)', 'boolean-tests');
            runTest('(1=2) || (2=2)', (r) => isBooleanResult(r) && r.value === true, 'Logical OR (true)', 'boolean-tests');
            runTest('(1=2) || (2=3)', (r) => isBooleanResult(r) && r.value === false, 'Logical OR (false)', 'boolean-tests');

            runTest('(1=2) -> (3=4)', (r) => isBooleanResult(r) && r.value === true, 'Implication (false->false)', 'boolean-tests');
            runTest('(1=1) -> (2=2)', (r) => isBooleanResult(r) && r.value === true, 'Implication (true->true)', 'boolean-tests');
            runTest('(1=1) -> (1=2)', (r) => isBooleanResult(r) && r.value === false, 'Implication (true->false)', 'boolean-tests');

            // String literals
            runTest('"hello"', (r) => isStringResult(r) && r.value === 'hello', 'Simple string', 'string-tests');
            runTest('"hello world"', (r) => isStringResult(r) && r.value === 'hello world', 'String with space', 'string-tests');
            runTest('""', (r) => isStringResult(r) && r.value === '', 'Empty string', 'string-tests');
            runTest('"say \\"hello\\""', (r) => isStringResult(r) && r.value === 'say "hello"', 'String with escaped quotes', 'string-tests');

            runTest('"abc" = "abc"', (r) => isBooleanResult(r) && r.value === true, 'String equality (true)', 'string-tests');
            runTest('"abc" = "def"', (r) => isBooleanResult(r) && r.value === false, 'String equality (false)', 'string-tests');
            runTest('"abc" < "def"', (r) => isBooleanResult(r) && r.value === true, 'String comparison', 'string-tests');

            // Function calls
            runTest('complexity[w]', (r) => isOrdinal(r) && r.toString() === '1', 'Complexity of omega', 'function-tests');
            runTest('complexity[w^w]', (r) => isOrdinal(r) && parseInt(r.toString()) > 1, 'Complexity of omega^omega', 'function-tests');
            runTest('toString[42]', (r) => isStringResult(r) && r.value === '42', 'toString of finite', 'function-tests');
            runTest('toString[w+1]', (r) => isStringResult(r) && r.value === 'w+1', 'toString of ordinal', 'function-tests');
            runTest('toString["hello"]', (r) => isStringResult(r) && r.value === 'hello', 'toString of string', 'function-tests');

            runTest('parse["w+1"]', 'w+1', 'Parse string to ordinal', 'function-tests');
            runTest('parse["42"]', '42', 'Parse string to finite', 'function-tests');

            // Complex mixed expressions
            runTest('(w > 1) && (toString[5] = "5")', (r) => isBooleanResult(r) && r.value === true, 'Mixed ordinal and string', 'complex-tests');
            runTest('complexity[parse["w^2"]] > complexity[w]', (r) => isBooleanResult(r) && r.value === true, 'Nested functions with comparison', 'complex-tests');
            runTest('!(w = 0) -> (w > 0)', (r) => isBooleanResult(r) && r.value === true, 'Complex boolean logic', 'complex-tests');
            runTest('true && (w > 5)', (r) => isBooleanResult(r) && r.value === true, 'Boolean literal with ordinal comparison', 'complex-tests');
            runTest('false || toString[true] = "true"', (r) => isBooleanResult(r) && r.value === true, 'Boolean literal with function call', 'complex-tests');

            // Operator precedence
            runTest('1 + 2 * 3', '7', 'Arithmetic precedence', 'precedence-tests');
            runTest('1 = 1 && 2 = 2', (r) => isBooleanResult(r) && r.value === true, 'Comparison before AND', 'precedence-tests');
            runTest('1 = 2 || 2 = 2 && 3 = 3', (r) => isBooleanResult(r) && r.value === true, 'AND before OR', 'precedence-tests');
            runTest('1 = 2 -> 3 = 3 || 4 = 5', (r) => isBooleanResult(r) && r.value === true, 'OR before implication', 'precedence-tests');
            runTest('!1 = 1', (r) => isBooleanResult(r) && r.value === false, 'NOT before comparison', 'precedence-tests');

            // Variable substitution
            runTest('a/.{a:=w}', 'w', 'Simple variable substitution', 'variable-tests');
            runTest('a/.{a:=42}', '42', 'Variable with finite value', 'variable-tests');
            runTest('a+b/.{a:=w,b:=1}', 'w+1', 'Multiple variable substitution', 'variable-tests');
            runTest('a+1/.{a:=w}', 'w+1', 'Variable in addition (left precedence test)', 'variable-tests');
            runTest('e_a/.{a:=0}', 'e_0', 'Variable in epsilon index', 'variable-tests');
            runTest('a*b/.{a:=w,b:=2}', 'w*2', 'Variable in multiplication', 'variable-tests');
            runTest('a^b/.{a:=w,b:=2}', 'w^2', 'Variable in exponentiation', 'variable-tests');
            runTest('(a+b)*c/.{a:=w,b:=1,c:=2}', 'w*2+1', 'Complex expression with variables', 'variable-tests');
            runTest('parse[a]/.{a:="e_4*e_3"}', "e_4*e_3", 'Variable in function call', 'variable-tests');
            runTest('a > b/.{a:=w,b:=5}', (r) => isBooleanResult(r) && r.value === true, 'Variable in comparison', 'variable-tests');
            runTest('a ? b/.{a:=w,b:=1}', (r) => isComparisonResult(r) && r.value === 1, 'Variable in comparison operator', 'variable-tests');

            // Partial substitution tests
            runTest('a+b/.{a:=w}', (r) => isOperationNode(r) && formatOperationTree(r) === 'w+b', 'Partial substitution (one variable)', 'variable-tests');
            runTest('a*b+c/.{b:=2}', (r) => isOperationNode(r) && formatOperationTree(r) === '(a*2)+c', 'Partial substitution (middle variable)', 'variable-tests');
            runTest('a^b/.{a:=e_0}', (r) => isOperationNode(r) && formatOperationTree(r) === 'e_0^b', 'Partial substitution in exponentiation', 'variable-tests');
            runTest('(a+b)*c/.{c:=w}', (r) => isOperationNode(r) && formatOperationTree(r) === '(a+b)*w', 'Partial substitution (complex expression)', 'variable-tests');
            runTest('a/.{b:=w}', (r) => isVariableNode(r) && r.name === 'a', 'Variable with no substitution', 'variable-tests');
            runTest('a+b/.{}', (r) => isOperationNode(r) && formatOperationTree(r) === 'a+b', 'Empty substitution block', 'variable-tests');
            runTest('a\'/.{a:=w}', 'w+1', 'Successor with variable substitution', 'variable-tests');
            runTest('a\'\'/.{a:=5}', '7', 'Double successor with variable', 'variable-tests');
            runTest('a\'+b/.{a:=w,b:=2}', 'w+3', 'Successor in complex expression', 'variable-tests');

            // Error handling
            runTest('complexity[]', null, 'Function with no arguments (should error)', 'error-tests');
            runTest('complexity[1, 2]', null, 'Function with too many arguments (should error)', 'error-tests');
            runTest('complexity["hello"]', null, 'Function with wrong argument type (should error)', 'error-tests');
            runTest('unknownFunction[1]', null, 'Unknown function (should error)', 'error-tests');
            runTest('parse[42]', null, 'Parse with non-string argument (should error)', 'error-tests');
            runTest('"unterminated string', null, 'Unterminated string (should error)', 'error-tests');
            runTest('1 +', null, 'Incomplete expression (should error)', 'error-tests');
            runTest('w+(2?1)', null, 'Addition with comparison result (should error)', 'error-tests');
            runTest('(w?1)*2', null, 'Multiplication with comparison result (should error)', 'error-tests');
            runTest('2^(w?1)', null, 'Exponentiation with comparison result (should error)', 'error-tests');
            //runTest('a+w', null, 'Unsubstituted variable (should error)', 'error-tests');
            runTest('1 + 2 = 3 * 4', (r) => isBooleanResult(r) && r.value === false, 'Mixed arithmetic and comparison (should not error)', 'complex-tests');
        }

        function testInteractive(): void {
            const inputElement = requireElementById<HTMLInputElement>('interactive-input');
            const resultDiv = requireElementById<HTMLDivElement>('interactive-result');
            const input = inputElement.value.trim();

            if (!input) {
                resultDiv.innerHTML = '<div class="test-error">Please enter an expression to test</div>';
                return;
            }

            try {
                OperationTracer.reset(10000);
                const parser = new SimpleParser(input);
                const result = parser.parse() as ParserValue;
                const resultStr = formatResult(result);

                resultDiv.innerHTML = `<div class="test-pass">✓ Expression: <code>${input}</code><br>Result: <code>${resultStr}</code><br>Type: ${getResultType(result)}</div>`;
            } catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                resultDiv.innerHTML = `<div class="test-error">⚠ Expression: <code>${input}</code><br>Error: <code>${message}</code></div>`;
            }
        }

        function getResultType(result: ParserValue): string {
            if (isOrdinal(result)) {
                return 'Ordinal (' + result.constructor.name + ')';
            } else if (result && typeof result === 'object' && 'type' in result && typeof (result as { type?: string }).type === 'string') {
                const typeName = (result as { type: string }).type;
                return typeName.charAt(0).toUpperCase() + typeName.slice(1);
            } else {
                return 'Unknown';
            }
        }

        const initializeControls = (): void => {
            console.log('[Enhanced Parser Test] DOM ready');

            const runButton = document.getElementById('runAllTestsBtn');
            runButton?.addEventListener('click', () => {
                runAllTests();
            });

            const testButton = document.getElementById('testExpressionBtn');
            testButton?.addEventListener('click', () => {
                testInteractive();
            });

            const inputElement = document.getElementById('interactive-input') as HTMLInputElement | null;
            inputElement?.addEventListener('keypress', (event: KeyboardEvent) => {
                if (event.key === 'Enter') {
                    testInteractive();
                }
            });

            console.log('Enhanced Parser Test Suite loaded successfully');
        };

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initializeControls, { once: true });
        } else {
            initializeControls();
        }

