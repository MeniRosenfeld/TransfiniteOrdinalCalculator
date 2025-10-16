// OrdinalBase.ts
// Base contract that all ordinal types must implement

import { OperationTracer } from '../OperationTracer.js';
import { getOperations } from '../operations/OperationsSingleton.js';
import { 
    createFiniteOrdinal,
    getZeroOrdinal,
    getOneOrdinal,
    createEpsilonNumber,
    createZetaZero,
    createEpsilonTunnelOrdinal
} from './OrdinalFactory.js';

/**
 * Base class defining the contract for all ordinal types.
 * This is an abstract base - all methods must be implemented by subclasses.
 */
export abstract class OrdinalBase {
    private readonly _ordinalBrand: symbol;

    constructor() {
        this._ordinalBrand = Symbol.for('TransfiniteOrdinal.OrdinalBrand');
        // Consume operation for construction using global tracer
        OperationTracer.consume(1);
    }

    // === REQUIRED UNARY METHODS ===

    /**
     * Returns true if this ordinal equals zero.
     * Zero is the additive identity: α + 0 = 0 + α = α
     * 
     * @returns True if α = 0, false otherwise
     * @complexity O(1)
     * @example
     * new FiniteOrdinal(0).isZero()  // true
     * new FiniteOrdinal(5).isZero()  // false
     * new OmegaOrdinal().isZero()    // false
     */
    abstract isZero(): boolean;

    /**
     * Returns true if this ordinal is a finite natural number (less than ω).
     * 
     * @returns True if α < ω, false otherwise
     * @complexity O(1)
     * @example
     * new FiniteOrdinal(42).isFinite()  // true
     * new OmegaOrdinal().isFinite()     // false
     * new CNFOrdinal([...]).isFinite()  // depends on structure
     */
    abstract isFinite(): boolean;

    /**
     * Returns the finite value as a BigInt.
     * 
     * @returns The finite value as BigInt
     * @throws {Error} If this ordinal is not finite (α ≥ ω)
     * @precondition isFinite() must return true
     * @complexity O(1) for simple types, O(n) for sum types
     * @example
     * new FiniteOrdinal(42).getFiniteBigInt()  // 42n
     * new OmegaOrdinal().getFiniteBigInt()     // throws Error
     * @see isFinite() - check before calling this method
     */
    abstract getFiniteBigInt(): bigint;

    /**
     * Returns the finite additive part of this ordinal (0 if none).
     * For α = β + n where β is a limit ordinal and n is finite, returns n.
     * 
     * @returns The finite part as BigInt (0n if no finite part)
     * @complexity O(1) for most types
     * @example
     * new FiniteOrdinal(42).getFinitePart()    // 42n
     * new OmegaOrdinal().getFinitePart()       // 0n
     * (ω+5).getFinitePart()                    // 5n
     * (ω*2+3).getFinitePart()                  // 3n
     */
    abstract getFinitePart(): bigint;

    /**
     * Returns true if this ordinal needs parentheses when used as an exponent.
     * Used for proper mathematical notation in string representations.
     * 
     * @returns True if parentheses needed in ω^α notation
     * @complexity O(1)
     * @example
     * (ω+1).needsParenthesesAsExponent()  // true → ω^(ω+1)
     * ω.needsParenthesesAsExponent()      // false → ω^ω
     * 5.needsParenthesesAsExponent()      // false → ω^5
     */
    abstract needsParenthesesAsExponent(): boolean;

    /**
     * Returns the next rank in the ordinal hierarchy [0, 1, ω, ε₀, ε₁, ...].
     * The rank is the smallest "basic" ordinal greater than this ordinal.
     * 
     * @returns The next higher rank
     * @complexity O(1) to O(log n) depending on type
     * @example
     * 0.nextRank()      // 1
     * 5.nextRank()      // ω
     * ω^ω.nextRank()    // ε₀
     * ε₅.nextRank()     // ε₆
     * @see rank() for the current rank
     */
    abstract nextRank(): OrdinalBase;

    /**
     * Returns true if this ordinal equals 1.
     * One is the multiplicative identity: α * 1 = 1 * α = α
     * 
     * @returns True if α = 1, false otherwise
     * @complexity O(1)
     * @example
     * new FiniteOrdinal(1).isOne()  // true
     * new FiniteOrdinal(0).isOne()  // false
     * new OmegaOrdinal().isOne()    // false
     */
    abstract isOne(): boolean;

    /**
     * Returns true if this ordinal is less than ε₀ (epsilon-zero).
     * ε₀ is the first epsilon number, the first fixed point of α ↦ ω^α.
     * Ordinals below ε₀ can be usefully represented in Cantor Normal Form (CNF).
     * 
     * @returns True if α < ε₀, false otherwise
     * @complexity O(1)
     * @example
     * 42.isLessThanEpsilon0()          // true
     * ω^ω^ω.isLessThanEpsilon0()       // true
     * ε₀.isLessThanEpsilon0()          // false
     * ε₁.isLessThanEpsilon0()          // false
     * @see isLessThanZeta0() for the next level
     */
    abstract isLessThanEpsilon0(): boolean;

    /**
     * Returns true if this ordinal equals ω (omega).
     * ω is the first infinite ordinal, the limit of all finite ordinals.
     * 
     * @returns True if α = ω, false otherwise
     * @complexity O(1)
     * @example
     * new OmegaOrdinal().isOmega()               // true
     * new FiniteOrdinal(999999).isOmega()        // false
     * new CNFOrdinal([{exp: 1, coef: 1}]).isOmega()  // true
     */
    abstract isOmega(): boolean;

    /**
     * Returns true if this ordinal is a "basic" ordinal in the hierarchy.
     * Basic ordinals include: 0, 1, ω, ε₀, ε₁, ε₂, ..., ζ₀, etc.
     * These are the fundamental building blocks for representing other ordinals.
     * 
     * @returns True if α is a basic ordinal, false otherwise
     * @complexity O(1)
     * @example
     * 0.isBasic()       // true
     * 1.isBasic()       // true
     * ω.isBasic()       // true
     * ε₀.isBasic()      // true
     * (ω+1).isBasic()   // false
     * ω².isBasic()      // false
     */
    abstract isBasic(): boolean;

    /**
     * Returns true if this ordinal is a limit ordinal.
     * A limit ordinal has no immediate predecessor (cannot be written as β+1).
     * Examples: ω, ω*2, ω², ε₀, etc.
     * 
     * @returns True if α is a limit ordinal, false if α is 0 or a successor
     * @complexity O(1)
     * @example
     * 0.isLimit()       // false (zero is not a limit)
     * 5.isLimit()       // false (successor of 4)
     * ω.isLimit()       // true (limit of finite ordinals)
     * (ω+1).isLimit()   // false (successor of ω)
     * (ω*2).isLimit()   // true (limit ordinal)
     */
    abstract isLimit(): boolean;

    /**
     * Returns true if this ordinal is a tower (repeated exponentiation).
     * Examples: ω^ω^ω, ε₀^ε₀^ε₀, etc.
     * 
     * @returns True if α is a tower structure, false otherwise
     * @complexity O(1)
     * @example
     * ω.isTower()           // false (single omega)
     * ω^ω.isTower()         // false (single power)
     * ω^ω^ω.isTower()       // true (tower)
     * ε₀^ε₀^ε₀.isTower()    // true (epsilon tower)
     */
    abstract isTower(): boolean;

    /**
     * Returns true if this ordinal is an epsilon number ε_α.
     * Epsilon numbers are fixed points of β ↦ ω^β.
     * The first epsilon number is ε₀ = ω^ω^ω^... (infinite tower).
     * 
     * @returns True if α = ε_β for some β, false otherwise
     * @complexity O(1)
     * @example
     * ω.isEpsilonNumber()           // false
     * ε₀.isEpsilonNumber()          // true (ε₀)
     * ε₁.isEpsilonNumber()          // true (ε₁)
     * (ε₀+1).isEpsilonNumber()      // false
     */
    abstract isEpsilonNumber(): boolean;

    /**
     * Returns the index of this epsilon number.
     * For ε_α, returns α. Only meaningful if isEpsilonNumber() is true.
     * 
     * @returns The index α for ε_α
     * @throws {Error} If this ordinal is not an epsilon number
     * @precondition isEpsilonNumber() must return true
     * @complexity O(1)
     * @example
     * ε₀.epsilonIndex()     // 0
     * ε₁.epsilonIndex()     // 1
     * ε_ω.epsilonIndex()    // ω
     * ω.epsilonIndex()      // throws Error
     */
    abstract epsilonIndex(): OrdinalBase;

    /**
     * Returns the rank (critical ordinal) of this ordinal.
     * The rank is the base of the leading factor of the leading term.
     * For most ordinals, this is the largest basic ordinal ≤ α.
     * 
     * @returns The rank ordinal
     * @complexity O(1) for most types
     * @example
     * 0.rank()              // 0
     * 5.rank()              // 1
     * ω^5.rank()            // ω
     * (ω^ω*3+ω*2+5).rank()  // ω
     * ε₁^ε₀.rank()          // ε₁
     * @see nextRank() for the next rank in hierarchy
     */
    abstract rank(): OrdinalBase;

    /**
     * Returns the "logarithm" of this ordinal.
     * For CNF, returns the exponent of the leading omega power.
     * For ENF, returns the exponent of the leading epsilon factor.
     * 
     * @returns The logarithm (typically the exponent of the leading term)
     * @throws {Error} If this ordinal is zero (log(0) undefined)
     * @complexity O(1)
     * @example
     * ω^5.log()         // 5
     * ω^ω.log()         // ω
     * ε₀^ε₁.log()       // ε₁
     * 42.log()          // 0
     * 0.log()           // throws Error
     */
    abstract log(): OrdinalBase;

    /**
     * Returns the iterated logarithm (log* function).
     * Counts how many times log must be applied to reach a finite number.
     * For finite α > 0: log*(α) = 0
     * For α ≥ ω: log*(α) = 1 + log*(log(α))
     * 
     * @returns The iterated logarithm count as BigInt (-1n for zero)
     * @complexity O(height) where height is the nesting depth
     * @example
     * 0.logStar()           // -1n
     * 5.logStar()           // 0n
     * ω.logStar()           // 1n
     * ω^ω.logStar()         // 2n
     * ω^ω^ω.logStar()       // 3n
     * ε₀.logStar()          // ω (infinite tower)
     */
    abstract logStar(): bigint;

    /**
     * Returns the structural complexity of this ordinal.
     * Higher complexity means more nested structure.
     * Used for simplification algorithms and display optimization.
     * 
     * @returns A numeric complexity measure (higher = more complex)
     * @complexity O(n) where n is the number of structural components
     * @example
     * 0.complexity()                 // 0
     * 5.complexity()                 // 1
     * ω.complexity()                 // 1
     * ω^ω.complexity()               // 2
     * (ω^ω^ω*5+ω^2*3+1).complexity() // larger number
     */
    abstract complexity(): number;

    /**
     * Returns the canonical string representation of this ordinal.
     * Uses ASCII notation: w for ω, e_0 for ε₀, etc.
     * 
     * @returns String representation parseable by SimpleParser
     * @complexity O(n) where n is the number of terms
     * @example
     * 0.toString()              // "0"
     * 5.toString()              // "5"
     * ω.toString()              // "w"
     * ω².toString()             // "w^2"
     * (ω+5).toString()          // "w+5"
     * ε₀.toString()             // "e_0"
     * @see toGraphicalHTML() for mathematical notation
     */
    abstract toString(): string;

    /**
     * Returns HTML representation with mathematical notation.
     * Uses proper Unicode symbols: ω, ε, ζ with superscripts/subscripts.
     * 
     * @returns HTML string with mathematical notation
     * @complexity O(n) where n is the number of terms
     * @example
     * ω².toGraphicalHTML()      // "ω<sup>2</sup>"
     * ε₀.toGraphicalHTML()      // "ε<sub>0</sub>"
     * (ω^ω+5).toGraphicalHTML() // "ω<sup>ω</sup>+5"
     * @see toString() for ASCII representation
     */
    abstract toGraphicalHTML(): string;

    /**
     * Creates a deep copy of this ordinal.
     * All ordinal operations preserve immutability - this method exists
     * for explicit cloning when needed.
     * 
     * @returns A new ordinal equal to this one
     * @complexity O(n) where n is the number of structural components
     * @example
     * const alpha = new CNFOrdinal([...]);
     * const beta = alpha.clone();
     * // alpha and beta are equal but separate objects
     */
    abstract clone(): OrdinalBase;

    /**
     * Converts this ordinal to F-format for ordinal-to-real mapping.
     * F-format is used by the f-function to map ordinals to real numbers.
     * 
     * @returns F-format representation (structure varies by type)
     * @complexity O(n) where n is the number of terms
     * @see ordinal_mapping.js for f-function implementation
     * @example
     * 42.toFFormat()    // 42n
     * ω.toFFormat()     // {type: 'pow', k: 1n}
     * ω².toFFormat()    // {type: 'pow', k: 2n}
     */
    abstract toFFormat(): any;

    /**
     * Converts this ordinal to the specified target type.
     * Part of the type conversion system. Should only implement direct conversions;
     * indirect conversions are handled by ConversionEngine.
     * 
     * @param targetTypeName - The name of the target type (e.g., 'CNF', 'ENF')
     * @returns This ordinal converted to the target type
     * @throws {Error} If direct conversion is not supported
     * @complexity Varies by conversion (typically O(n))
     * @example
     * const cnf = new CNFOrdinal([...]);
     * const enf = cnf.convertTo('ENF');
     * @see ConversionEngine for automatic path finding
     */
    abstract convertTo(targetTypeName: string): OrdinalBase;

    /**
     * Returns true if this ordinal is less than ζ₀ (zeta-zero).
     * ζ₀ is the first zeta number, the first fixed point of α ↦ ε_α.
     * This calculator supports ordinals up to (but not including) ordinals ≥ ζ₀.
     * 
     * @returns True if α < ζ₀ (default: true for all implemented types)
     * @complexity O(1)
     * @example
     * ω.isLessThanZeta0()       // true
     * ε₀.isLessThanZeta0()      // true
     * ε_ε₀.isLessThanZeta0()    // true
     * ζ₀.isLessThanZeta0()      // false
     */
    isLessThanZeta0(): boolean {
        return true;
    }

    /**
     * Coarse rank tier classification for quick comparison optimization.
     * Divides ordinals into tiers: 0 (zero), 1 (finite), 2 (<ε₀), 3 (<ζ₀), 4 (≥ζ₀).
     * Ordinals in different tiers can be compared immediately without detailed analysis.
     * 
     * @returns Rank tier (0-4)
     * @complexity O(1)
     * @example
     * 0.rankTier()      // 0
     * 42.rankTier()     // 1
     * ω^ω.rankTier()    // 2
     * ε₅.rankTier()     // 3
     */
    rankTier(): number {
        if (this.isZero()) return 0;
        if (this.isFinite()) return 1;
        if (this.isLessThanEpsilon0()) return 2;
        if (this.isLessThanZeta0()) return 3;
        return 4;
    }

    /**
     * Returns true if the internal structure is valid and well-formed.
     * Checks structural invariants like strictly decreasing terms, non-negative coefficients, etc.
     * Used for debugging and testing to ensure ordinals maintain mathematical consistency.
     * 
     * @returns True if structure is valid, false if corrupted
     * @complexity O(n) where n is number of structural components
     * @example
     * new CNFOrdinal([...validTerms]).isWellFormed()    // true
     * // Manually constructed invalid structure:
     * new CNFOrdinal([...invalidTerms]).isWellFormed()  // false
     */
    isWellFormed(): boolean {
        return true;
    }

    /**
     * Returns formatted string representation with optional styling.
     * Currently delegates to toString(). Reserved for future display customization.
     * 
     * @param options - Display options (currently unused)
     * @returns Formatted string representation
     * @complexity O(n) where n is number of structural components
     */
    toDisplayString(options: any = {}): string {
        return this.toString();
    }

    /**
     * Returns a string that includes both the runtime type name and the ordinal string representation.
     * Useful for debugging to see which concrete type is being used.
     * 
     * @returns String in format "[TypeName: value]"
     * @complexity O(n) where n is number of terms
     * @example
     * new CNFOrdinal([...]).toStringWithType()    // "[CNFOrdinal: w^w+5]"
     * new FiniteOrdinal(42).toStringWithType()    // "[FiniteOrdinal: 42]"
     */
    toStringWithType(): string {
        const typeName = (this && this.constructor && this.constructor.name)
            ? this.constructor.name
            : 'UnknownType';
        return `[${typeName}: ${this.toString()}]`;
    }

    /**
     * Returns the left predecessor of this ordinal (α - 1 in left subtraction).
     * For finite ordinals: returns α - 1
     * For infinite ordinals: returns α (1 + infinite α = α)
     * 
     * Note: Ordinal subtraction is only defined on the left (left subtraction).
     * Right subtraction is not generally defined.
     * 
     * @returns The left predecessor
     * @throws {Error} If this ordinal is zero (0 has no predecessor)
     * @complexity O(1)
     * @example
     * 5.leftPredecessor()       // 4
     * 1.leftPredecessor()       // 0
     * ω.leftPredecessor()       // ω (limit has no predecessor)
     * (ω+1).leftPredecessor()   // ω
     * 0.leftPredecessor()       // throws Error
     */
    leftPredecessor(): OrdinalBase {
        if (this.isZero()) {
            throw new Error("Cannot take left predecessor of zero");
        }
        if (this.isFinite()) {
            const n = this.getFiniteBigInt();
            return createFiniteOrdinal(n - 1n);
        }
        return this;
    }

    /**
     * Returns the successor of this ordinal (α + 1).
     * Every ordinal has a unique successor, which is the smallest ordinal greater than α.
     * 
     * @returns The successor ordinal α + 1
     * @complexity Depends on addition implementation
     * @example
     * 0.successor()       // 1
     * 5.successor()       // 6
     * ω.successor()       // ω + 1
     * ε₀.successor()      // ε₀ + 1
     * @see leftPredecessor() for the inverse operation
     */
    successor(): OrdinalBase {
        return this.add(getOneOrdinal());
    }

    /**
     * Tunnel operation: creates deeply nested epsilon structures ε_ε_ε_...
     * For finite n, creates n-deep nesting: ε_ε_..._0 (n epsilon subscripts).
     * Tunnel notation: ε↓↓n
     * 
     * Mathematical definition:
     * - tunnel(0) = 0
     * - tunnel(n+1) = ε_{tunnel(n)}
     * - tunnel(∞) = ζ₀
     * 
     * @returns The deeply nested epsilon structure
     * @throws {Error} If called on non-finite ordinal
     * @complexity O(n) for small n ≤ 10, O(1) for large n (uses compact representation)
     * @example
     * 0.tunnel()    // 0
     * 1.tunnel()    // ε_0
     * 2.tunnel()    // ε_ε_0
     * 3.tunnel()    // ε_ε_ε_0
     * ω.tunnel()    // ζ₀
     */
    tunnel(): OrdinalBase {
        if (!this.isFinite()) {
            return createZetaZero();
        }

        const n = this.getFiniteBigInt();

        if (n === 0n) {
            return getZeroOrdinal();
        }

        if (n > 0n && n <= 10n) {
            let result: OrdinalBase = getZeroOrdinal();
            for (let i = 0n; i < n; i++) {
                result = createEpsilonNumber(result);
            }
            return result;
        }

        return createEpsilonTunnelOrdinal(n);
    }

    /**
     * Simplifies this ordinal within the given complexity budget.
     * Attempts to find a simpler representation with lower complexity.
     * Used for display optimization and reducing computational overhead.
     * 
     * @param complexityBudget - Maximum complexity allowed for simplification attempts
     * @param skipMyOwnMPTFCheck - Internal flag for optimization (default: false)
     * @returns Object with simplified ordinal and remaining budget
     * @throws {Error} If not implemented by subclass
     * @complexity O(complexityBudget)
     * @example
     * // Large ordinal expression might simplify to more compact form
     * const result = largeOrdinal.simplify(1000);
     * // result.simplifiedOrdinal is simpler (or same if no simplification needed)
     * // result.remainingBudget shows how much budget remains
     */
    simplify(complexityBudget: number, skipMyOwnMPTFCheck: boolean = false): { simplifiedOrdinal: OrdinalBase; remainingBudget: number } {
        throw new Error(`${this.constructor.name} must implement simplify()`);
    }

    // === ARITHMETIC OPERATIONS ===

    /**
     * Tests equality with another ordinal (α = β).
     * 
     * @param other - The ordinal to compare with
     * @returns True if this ordinal equals other, false otherwise
     * @complexity Varies by type (typically O(n) where n is number of terms)
     * @example
     * new FiniteOrdinal(5).equals(new FiniteOrdinal(5))  // true
     * new OmegaOrdinal().equals(new FiniteOrdinal(999))  // false
     */
    equals(other: OrdinalBase): boolean {
        return getOperations().compare(this, other) === 0;
    }

    /**
     * Compares this ordinal with another (α ? β).
     * 
     * @param other - The ordinal to compare with
     * @returns -1 if α < β, 0 if α = β, 1 if α > β
     * @complexity Varies by type (typically O(n) where n is number of terms)
     * @example
     * new FiniteOrdinal(5).compareTo(new FiniteOrdinal(10))  // -1
     * new OmegaOrdinal().compareTo(new OmegaOrdinal())       // 0
     * new OmegaOrdinal().compareTo(new FiniteOrdinal(999))   // 1
     */
    compareTo(other: OrdinalBase): number {
        return getOperations().compare(this, other);
    }

    /**
     * Adds another ordinal to this one (α + β).
     * 
     * Note: Ordinal addition is NOT commutative.
     * Example: 1 + ω = ω, but ω + 1 ≠ ω
     * 
     * @param other - The ordinal to add
     * @returns The sum α + β
     * @complexity Varies by type (typically O(n+m))
     * @example
     * new FiniteOrdinal(5).add(new FiniteOrdinal(3))    // 8
     * new FiniteOrdinal(1).add(new OmegaOrdinal())      // ω
     * new OmegaOrdinal().add(new FiniteOrdinal(1))      // ω + 1
     */
    add(other: OrdinalBase): OrdinalBase {
        return getOperations().add(this, other);
    }

    /**
     * Multiplies this ordinal by another (α * β).
     * 
     * Note: Ordinal multiplication is NOT commutative.
     * Example: 2 * ω = ω, but ω * 2 = ω + ω ≠ ω
     * 
     * @param other - The ordinal to multiply by
     * @returns The product α * β
     * @complexity Varies by type (typically O(n*m))
     * @example
     * new FiniteOrdinal(5).multiply(new FiniteOrdinal(3))  // 15
     * new FiniteOrdinal(2).multiply(new OmegaOrdinal())    // ω
     * new OmegaOrdinal().multiply(new FiniteOrdinal(2))    // ω * 2
     */
    multiply(other: OrdinalBase): OrdinalBase {
        return getOperations().multiply(this, other);
    }

    /**
     * Raises this ordinal to the power of another (α ^ β).
     * 
     * Note: Ordinal exponentiation follows special rules.
     * Example: 2^ω = ω, ω^2 = ω*ω, ω^ω is much larger
     * 
     * @param other - The exponent
     * @returns The power α ^ β
     * @complexity Varies significantly by operands
     * @example
     * new FiniteOrdinal(2).power(new FiniteOrdinal(3))   // 8
     * new FiniteOrdinal(2).power(new OmegaOrdinal())     // ω
     * new OmegaOrdinal().power(new FiniteOrdinal(2))     // ω²
     * new OmegaOrdinal().power(new OmegaOrdinal())       // ω^ω
     */
    power(other: OrdinalBase): OrdinalBase {
        return getOperations().power(this, other);
    }

    /**
     * Tetrates this ordinal (repeated exponentiation): α ^^ β.
     * Tetration: α^^0 = 1, α^^1 = α, α^^2 = α^α, α^^3 = α^(α^α), etc.
     * 
     * Special cases:
     * - 0^^n: 1 if n even, 0 if n odd; undefined for n = ∞
     * - 1^^n: always 1
     * - ω^^n: creates omega towers, ω^^∞ = ε₀
     * - ε_k^^n: creates epsilon towers, ε_k^^∞ = ε_{k+1}
     * 
     * @param other - The tetration height
     * @returns The tetration result α ^^ β
     * @complexity Varies significantly; may create tower structures
     * @example
     * new FiniteOrdinal(2).tetrate(new FiniteOrdinal(3))  // 2^2^2 = 16
     * new OmegaOrdinal().tetrate(new FiniteOrdinal(2))    // ω^ω
     * new OmegaOrdinal().tetrate(new FiniteOrdinal(3))    // ω^ω^ω
     * new OmegaOrdinal().tetrate(new OmegaOrdinal())      // ε₀
     */
    tetrate(other: OrdinalBase): OrdinalBase {
        return getOperations().tetrate(this, other);
    }

    // === STATIC METHODS ===

    /**
     * Returns the list of type names that this type can directly convert to.
     * Part of the type conversion system. Subclasses must implement.
     * 
     * @returns Array of type names for direct conversions
     * @throws {Error} If not implemented by subclass
     * @example
     * CNFOrdinal.getDirectConversions()  // ['ENF', 'WTower']
     */
    static getDirectConversions(): string[] {
        throw new Error(`${this.name} must implement getDirectConversions()`);
    }

    /**
     * Returns the type name used for conversion registry.
     * Part of the type conversion system. Subclasses must implement.
     * 
     * @returns The type name string
     * @throws {Error} If not implemented by subclass
     * @example
     * CNFOrdinal.getTypeName()  // 'CNF'
     */
    static getTypeName(): string {
        throw new Error(`${this.name} must implement getTypeName()`);
    }

    // === UTILITY METHODS ===

    /**
     * Returns true if this object is a valid ordinal.
     * Used internally to verify ordinal type before operations.
     * 
     * @returns Always true for proper OrdinalBase instances
     * @complexity O(1)
     */
    isOrdinal(): boolean {
        return this._ordinalBrand === Symbol.for('TransfiniteOrdinal.OrdinalBrand');
    }
}
