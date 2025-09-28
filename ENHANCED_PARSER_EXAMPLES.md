# Enhanced Parser Examples

The Transfinite Ordinal Calculator parser has been greatly expanded to support comparison operators, boolean logic, strings, and functions. Here are examples of the new capabilities:

## Comparison Operators

### Basic Comparisons
- `w > 5` → `true`
- `1 = 1` → `true`
- `e_0 <= e_1` → `true`
- `42 != 43` → `true`

### Comparison Operator (?)
Returns comparison symbols `<`, `=`, or `>`:
- `5 ? 10` → `<` (5 < 10)
- `w ? w` → `=` (w = w)
- `e_0 ? w` → `>` (e_0 > w)

**Important**: Comparison results cannot be used in ordinal arithmetic:
- `w + (2 ? 1)` → **Error** (cannot add comparison result to ordinal)
- `(w ? 1) * 2` → **Error** (cannot multiply comparison result)
- Use parentheses to compare arithmetic results: `(w + 1) ? (w + 2)` → `<`

## Boolean Logic

### Boolean Literals
- `true` → `true`
- `false` → `false`
- `TRUE` → `true` (case insensitive)
- `False` → `false` (case insensitive)

### Logical Operators
- `!true` → `false`
- `!false` → `true`
- `!0` → `true` (zero is falsy)
- `!w` → `false` (non-zero ordinals are truthy)
- `(w > 1) && (5 < 10)` → `true`
- `(1 = 2) || (3 = 3)` → `true`
- `true && (w > 5)` → `true`
- `false || (1 = 1)` → `true`

### Implication
- `(1 = 1) -> (2 = 2)` → `true` (true implies true)
- `(1 = 2) -> (3 = 4)` → `true` (false implies anything)
- `(1 = 1) -> (1 = 2)` → `false` (true implies false is false)

## String Literals

### Basic Strings
- `"hello world"` → `"hello world"`
- `""` → `""` (empty string)
- `"say \"hello\""` → `"say "hello""` (escaped quotes)

### String Comparisons
- `"abc" = "abc"` → `true`
- `"abc" < "def"` → `true`
- `"hello" != "world"` → `true`

## Successor Operator

The apostrophe `'` gives the successor of an ordinal (postfix operator):
- `0'` → `1` (successor of zero)
- `5'` → `6` (successor of finite ordinal)
- `w'` → `ω+1` (successor of omega)
- `w''` → `ω+2` (double successor)
- `(w+5)'` → `ω+6` (successor of complex expression)

### With Variables
- `a'/.{a:=w}` → `ω+1` (successor after substitution)
- `a''/.{a:=5}` → `7` (double successor with variable)

## Built-in Functions

### complexity[ordinal]
Returns the structural complexity of an ordinal:
- `complexity[w]` → `1`
- `complexity[w^w]` → `2`
- `complexity[e_0]` → `1`

### toString[value]
Converts any value to its string representation:
- `toString[42]` → `"42"`
- `toString[w+1]` → `"w+1"`
- `toString["hello"]` → `"hello"`
- `toString[true]` → `"true"`
- `toString[false]` → `"false"`

### parse[string]
Recursively parses a string expression:
- `parse["w+1"]` → `w+1`
- `parse["42"]` → `42`
- `parse["e_0^2"]` → `e_0^2`

## Complex Mixed Expressions

### Combining Different Types
- `(w > 1) && (toString[5] = "5")` → `true`
- `complexity[parse["w^2"]] > complexity[w]` → `true`
- `!(w = 0) -> (w > 0)` → `true`

### Nested Functions
- `toString[complexity[w^w]]` → `"2"`
- `parse[toString[e_0]]` → `e_0`
- `complexity[parse["e_0^e_0"]] > 5` → `true`

## Operator Precedence

The parser follows this precedence hierarchy (lowest to highest):

1. **Variable Substitution** (`/.`) ← **LOWEST**
2. **Implication** (`->`)
3. **Logical OR** (`||`)
4. **Logical AND** (`&&`)
5. **Comparisons** (`=`, `!=`, `<`, `>`, `<=`, `>=`, `?`)
6. **Ordinal Addition** (`+`)
7. **Ordinal Multiplication** (`*`)
8. **Ordinal Tetration** (`^^`)
9. **Ordinal Exponentiation** (`^`)
10. **Successor operator** (`'`) ← **POSTFIX**
11. **Unary operators** (`!`)
12. **Function calls** and primary expressions

### Precedence Examples
- `1 = 1 && 2 = 2` → `true` (comparison before AND)
- `1 = 2 || 2 = 2 && 3 = 3` → `true` (AND before OR)
- `!1 = 1` → `false` (NOT before comparison)
- `1 + 2 * 3` → `7` (multiplication before addition)

## Error Handling

The parser provides clear error messages for invalid expressions:
- `complexity[]` → Error: Function expects exactly 1 argument
- `complexity["hello"]` → Error: Function expects an ordinal argument
- `unknownFunction[1]` → Error: Unknown function
- `1 + 2 = 3 * 4` → Error: Cannot mix arithmetic and comparison

## Testing

Use `tests/enhanced_parser_test.html` to test all these features interactively. The test suite includes:
- Basic ordinal expressions (backward compatibility)
- All comparison operators
- Boolean logic combinations
- String literal parsing and operations
- Function calls with various arguments
- Complex mixed expressions
- Operator precedence verification
- Error handling validation

## Integration

The enhanced parser is fully integrated with the main calculator interface:
- Ordinal results display normally with graphical rendering
- Boolean results show as `true`/`false` with blue styling
- String results show in green with quotation marks
- Non-ordinal results don't have f-mapping (shows "N/A")
- All result types support copy functionality

## Variable Substitution

### Basic Syntax
Variables are identifiers that can be substituted with values using the `/.{...}` operator:
- `a/.{a:=w}` → `w` (substitute variable `a` with omega)
- `x/.{x:=42}` → `42` (substitute variable `x` with 42)

### Multiple Variables
- `a+b/.{a:=w,b:=1}` → `w+1` (substitute both `a` and `b`)
- `a*b+c/.{a:=e_0,b:=2,c:=5}` → `e_0*2+5`

### Complex Expressions
- `e_a/.{a:=0}` → `e_0` (variable in epsilon index)
- `(a+b)^c/.{a:=w,b:=1,c:=2}` → `(w+1)^2` (variables in complex expression)
- `toString[a]/.{a:="hello"}` → `"hello"` (variable in function call)

### Comparison with Variables
- `a > b/.{a:=w,b:=5}` → `true` (variable comparison)
- `a ? b/.{a:=e_0,b:=w}` → `>` (comparison operator with variables)

### Partial Substitution
The system supports partial substitution where unassigned variables remain as variables:
- `a+b/.{a:=w}` → `w+b` (substitute `a`, leave `b` as variable)
- `a*b+c/.{b:=2}` → `a*2+c` (substitute `b`, leave `a` and `c`)
- `a/.{b:=w}` → `a` (no substitution for `a`, so it remains)
- `a+b/.{}` → `a+b` (empty substitution block)

### Error Cases
- `a+w` → **Error** (unsubstituted variable without substitution operator)
- `w+a/.{a:=1}` → **Error** (variable outside substitution scope)

### Operator Precedence
The substitution operator `/.` has the **lowest precedence**, so it applies to the entire left expression:
- `a+1/.{a:=w}` → `w+1` (substitutes in the entire expression `a+1`)
- `a*b+c/.{a:=w,b:=2,c:=5}` → `w*2+5` (substitutes in `a*b+c`)
- `(a+1)*b/.{a:=w,b:=2}` → `(w+1)*2` (substitutes in `(a+1)*b`)

**Important**: Variables must be substituted before they can be used in arithmetic operations or comparisons. The substitution operator `/.` applies to the entire expression on its left side.

This expansion transforms the calculator from a simple ordinal arithmetic tool into a comprehensive expression evaluator supporting multiple data types, operations, and variable substitution.
