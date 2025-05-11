# ordinal_mapping.py

import sys

# It's good practice to allow adjusting recursion limit if needed,
# though for typical ε₀ ordinals, default might be okay.
# sys.setrecursionlimit(2000) # Example: Increase recursion limit

memo = {}

# Ordinal Representation Conventions:
# - Finite ordinal n: Python int n (e.g., 0, 1, 2, ...)
# - ω^k: tuple ('pow', k_rep) where k_rep is an ordinal representation for k.
# - ω^β * c + δ: tuple ('sum', beta_rep, c_int, delta_rep)
#   - beta_rep: ordinal representation for β.
#   - c_int: Python int for c (c >= 1).
#   - delta_rep: ordinal representation for δ (use ORDINAL_ZERO if no remainder).
#   - It is assumed that δ < ω^β (not strictly enforced by `f` but crucial for correct CNF).

ORDINAL_ZERO = 0
ORDINAL_ONE = 1

def is_finite_ordinal(ordinal_rep):
    """Checks if the ordinal representation is for a finite ordinal."""
    return isinstance(ordinal_rep, int)

def f_finite(n_int):
    """Computes f(n) for a finite ordinal n (represented as an int)."""
    if not isinstance(n_int, int) or n_int < 0:
        raise ValueError(f"f_finite called with non-integer or negative: {n_int}")
    if n_int == ORDINAL_ZERO:
        return 0.0
    return float(n_int) / (float(n_int) + 1.0)

def add_one_to_ordinal(beta_ord_rep):
    """Computes the ordinal representation for beta + 1."""
    if is_finite_ordinal(beta_ord_rep):
        return beta_ord_rep + 1
    
    # beta_ord_rep is a tuple ('pow', k_exp_rep) or ('sum', b_exp_rep, c_coeff_int, d_rem_rep)
    # This function assumes beta_ord_rep is a simplified/canonical form appropriate for an exponent.
    # A full ordinal addition function would be more complex.
    # For ω^k + 1, if k > 0, it's ω^k*1 + 1. If k=0, ω^0=1, so 1+1=2.
    type_str, *args = beta_ord_rep
    if type_str == 'pow':
        k_exp_rep = args[0]
        if k_exp_rep == ORDINAL_ZERO: # beta = ω^0 = 1. So beta+1 = 2.
            return 2 
        # General case: ω^k_exp + 1 is represented as ω^k_exp * 1 + 1
        return ('sum', k_exp_rep, 1, ORDINAL_ONE)
    elif type_str == 'sum':
        # beta = ω^b_exp * c_coeff + d_rem. beta+1 = ω^b_exp * c_coeff + (d_rem+1).
        b_exp_rep, c_coeff_int, d_rem_rep = args
        # This assumes d_rem + 1 doesn't carry over to change c_coeff or b_exp,
        # which is true if we are just adding 1 to an exponent β in ω^(β+1).
        return ('sum', b_exp_rep, c_coeff_int, add_one_to_ordinal(d_rem_rep))
    else:
        raise TypeError(f"Unknown ordinal tuple type for add_one_to_ordinal: {type_str} in {beta_ord_rep}")

def f(alpha_rep):
    """
    Computes f(α) for an ordinal α < ε₀.
    α is represented as per the defined conventions.
    """
    if not isinstance(alpha_rep, (int, tuple)):
        raise TypeError(f"Invalid ordinal representation type: {type(alpha_rep)} for {alpha_rep}")

    memo_key = alpha_rep # Assumes representations are canonical for memoization
    if memo_key in memo:
        return memo[memo_key]

    result = 0.0

    # Rule 1: α is finite n
    if is_finite_ordinal(alpha_rep):
        result = f_finite(alpha_rep)
    else:
        # Alpha is a tuple: ('pow', k_rep) or ('sum', beta_rep, c_int, delta_rep)
        type_str, *args = alpha_rep
        
        if type_str == 'pow': # α = ω^k_rep
            k_rep = args[0]
            # Rule 2a: k_rep is a finite ordinal j >= 0
            if is_finite_ordinal(k_rep):
                j_int = k_rep
                if j_int == ORDINAL_ZERO: # k_rep is 0. α = ω^0 = 1.
                    result = f(ORDINAL_ONE) # f(1)
                else: # k_rep is finite j >= 1. f(ω^j) = 1 + 2f(j-1).
                      # f(j-1) = (j-1)/j
                      # 1 + 2(j-1)/j = (j + 2j - 2)/j = (3j-2)/j
                    result = (3.0 * float(j_int) - 2.0) / float(j_int)
            # Rule 2b: k_rep >= ω (k_rep is a tuple representation)
            else: 
                f_k_rep = f(k_rep) # Recursive call for f(k_rep)
                denominator = 9.0 - f_k_rep
                if abs(denominator) < 1e-9: # Check for near-zero
                    # This implies f(k_rep) approx 9. This should not happen as f(k_rep) < 5 for k_rep < ε₀.
                    raise ValueError(f"Division by near-zero in f(ω^k): f(k)={f_k_rep} for k={k_rep}")
                result = (25.0 - f_k_rep) / denominator
        
        elif type_str == 'sum': # α = ω^beta_rep * c_int + delta_rep
            beta_rep, c_int, delta_rep = args[0], args[1], args[2]

            if not (isinstance(c_int, int) and c_int >= 1):
                raise ValueError(f"Coefficient c_int must be an integer >= 1: {c_int}")

            # Calculate f(ω^beta_rep * c_int) using the formula:
            # f(ω^β * c) = f(ω^β) + (f(ω^(β+1)) - f(ω^β)) * f(c-1)
            
            term_omega_beta = ('pow', beta_rep)
            beta_plus_1_rep = add_one_to_ordinal(beta_rep)
            term_omega_beta_plus_1 = ('pow', beta_plus_1_rep)

            f_omega_beta = f(term_omega_beta)
            f_omega_beta_plus_1 = f(term_omega_beta_plus_1)
            
            if c_int - 1 < 0:
                 raise ValueError(f"c_int-1 is negative for c_int={c_int}")
            f_c_minus_1 = f_finite(c_int - 1)

            f_omega_beta_times_c = f_omega_beta + \
                                   (f_omega_beta_plus_1 - f_omega_beta) * f_c_minus_1
            
            if delta_rep == ORDINAL_ZERO: # α = ω^beta_rep * c_int
                result = f_omega_beta_times_c
            else: # α = ω^beta_rep * c_int + delta_rep, where delta_rep > 0
                  # f(α) = f(ω^βc) + (f(ω^β(c+1)) - f(ω^βc)) * f(δ) / f(ω^β)
                
                # Need f(ω^beta_rep * (c_int+1))
                f_c_int = f_finite(c_int) # f( (c+1)-1 )
                f_omega_beta_times_c_plus_1_coeff = f_omega_beta + \
                                   (f_omega_beta_plus_1 - f_omega_beta) * f_c_int
                
                f_delta_rep = f(delta_rep) # Recursive call for f(δ)

                if abs(f_omega_beta) < 1e-9: # Check for near-zero
                    # f(ω^β) should not be 0 if β is such that ω^β is a standard ordinal term.
                    # f(('pow', ORDINAL_ZERO)) = f(1) = 0.5.
                    # If k >= ω, f(ω^k) >= 25/9.
                    raise ValueError(f"f(ω^beta_rep) is near-zero ({f_omega_beta}) for beta_rep={beta_rep}, which is unexpected in denominator.")

                result = f_omega_beta_times_c + \
                         (f_omega_beta_times_c_plus_1_coeff - f_omega_beta_times_c) * \
                         f_delta_rep / f_omega_beta
        else:
            raise TypeError(f"Unknown ordinal tuple type in f: {type_str}")

    memo[memo_key] = result
    return result

if __name__ == '__main__':
    print(f"Running test cases for ordinal_mapping.f...")
    # Basic test cases
    print(f"f(0) = {f(ORDINAL_ZERO)}") # Expected: 0.0
    print(f"f(1) = {f(ORDINAL_ONE)}") # Expected: 0.5
    print(f"f(2) = {f(2)}")       # Expected: 2/3 = 0.666...

    # omega^j for finite j
    # f(omega^0) = f(1)
    print(f"f(ω^0) = f( ('pow', ORDINAL_ZERO) ) = {f(('pow', ORDINAL_ZERO))}") # Expected: 0.5 (f(1))
    # f(omega^1) = f(omega)
    omega_rep = ('pow', ORDINAL_ONE)
    print(f"f(ω) = f( {omega_rep} ) = {f(omega_rep)}") # Expected: 1.0
    # f(omega^2)
    omega_sq_rep = ('pow', 2)
    print(f"f(ω^2) = f( {omega_sq_rep} ) = {f(omega_sq_rep)}") # Expected: 2.0
    # f(omega^3)
    omega_cb_rep = ('pow', 3)
    print(f"f(ω^3) = f( {omega_cb_rep} ) = {f(omega_cb_rep)}") # Expected: (3*3-2)/3 = 7/3 = 2.333...

    # f(omega^omega)
    omega_omega_rep = ('pow', omega_rep) # k = omega
    print(f"f(ω^ω) = f( {omega_omega_rep} ) = {f(omega_omega_rep)}") # Expected: 3.0

    # f(omega^omega^omega)
    omega_omega_omega_rep = ('pow', omega_omega_rep) # k = omega^omega
    print(f"f(ω^ω^ω) = f( {omega_omega_omega_rep} ) = {f(omega_omega_omega_rep)}") # Expected: 11/3 = 3.666...

    # Test f(ω*m + k)
    # f(ω*2) ; beta=1, c=2, delta=0
    omega_times_2_rep = ('sum', ORDINAL_ONE, 2, ORDINAL_ZERO)
    # Expected: f(w) + (f(w^2)-f(w))*f(1) = 1 + (2-1)*0.5 = 1.5
    print(f"f(ω*2) = f( {omega_times_2_rep} ) = {f(omega_times_2_rep)}")

    # f(ω*3) ; beta=1, c=3, delta=0
    omega_times_3_rep = ('sum', ORDINAL_ONE, 3, ORDINAL_ZERO)
    # Expected: f(w) + (f(w^2)-f(w))*f(2) = 1 + (2-1)*(2/3) = 1 + 2/3 = 5/3 = 1.666...
    print(f"f(ω*3) = f( {omega_times_3_rep} ) = {f(omega_times_3_rep)}")
    
    # f(ω*2 + 1) ; beta=1, c=2, delta=1
    omega_times_2_plus_1_rep = ('sum', ORDINAL_ONE, 2, ORDINAL_ONE)
    # Expected: f(w*2) + (f(w*3) - f(w*2)) * f(1) / f(w)
    #         = 1.5 + ( (5/3) - 1.5 ) * 0.5 / 1.0 
    #         = 1.5 + ( (10/6) - (9/6) ) * 0.5
    #         = 1.5 + (1/6) * 0.5 = 1.5 + 1/12 = 18/12 + 1/12 = 19/12 = 1.58333...
    print(f"f(ω*2+1) = f( {omega_times_2_plus_1_rep} ) = {f(omega_times_2_plus_1_rep)}")

    # f(ω^2 * 2) ; beta=2, c=2, delta=0
    omega_sq_times_2_rep = ('sum', 2, 2, ORDINAL_ZERO)
    # f(w^2)=2, f(w^3)=7/3. f(c-1)=f(1)=0.5
    # Expected: f(w^2) + (f(w^3) - f(w^2)) * f(1)
    #         = 2 + (7/3 - 2) * 0.5 = 2 + (1/3) * 0.5 = 2 + 1/6 = 13/6 = 2.1666...
    print(f"f(ω^2*2) = f( {omega_sq_times_2_rep} ) = {f(omega_sq_times_2_rep)}")

    # f(ω^2 + ω) representation: ('sum', 2, 1, ('pow', 1))
    omega_sq_plus_omega_rep = ('sum', 2, 1, omega_rep) # ω^2*1 + ω
    # f(w^2*1) = f(w^2) = 2
    # f(w^2*2) = 13/6 (calculated above)
    # f(delta) = f(w) = 1
    # f(w^beta) = f(w^2) = 2
    # Expected: f(w^2) + (f(w^2*2) - f(w^2)) * f(w) / f(w^2)
    #         = 2 + (13/6 - 2) * 1 / 2
    #         = 2 + (1/6) * 1/2 = 2 + 1/12 = 25/12 = 2.08333...
    print(f"f(ω^2+ω) = f( {omega_sq_plus_omega_rep} ) = {f(omega_sq_plus_omega_rep)}")

    print(f"Test cases finished.")

