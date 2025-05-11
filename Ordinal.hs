-- An implementation in Haskell of some ordinals (up to the countable
-- collapse of Ω_ω) and operations thereon.

-- Written by David A. Madore around 2012-12-17 (commented and
-- published on 2025-05-08).  Public Domain.

{-# LANGUAGE ForeignFunctionInterface #-}

module Ordinal (Ordinal, compareOrd, makeOrd, usualPlus, usualSum,
                isZero, isSuccessor, successor, predecessor,
                isFinite, finiteValue, finitePart, infinitePart,
                isCountable, countablePart, uncountablePart, cardinal,
                cantorNormalForm, omegaPower_, omegaPower, unCantorNormalForm,
                usualTimes, usualProduct, finitePower, usualPower,
                epsilon,
                standardSequence,
                slowGrowing, fastGrowing,
                zero, one, two, omega, omegaPlusOne, omegaTwo,
                omegaSquared, omegaOmega,
                epsilon0, epsilon1, epsilonOmega, epsilonEpsilon0,
                zeta0, omegath0, fefermanSchuette, smallVeblen, largeVeblen,
                bachmannHoward,

                -- Wasm Exports for testing
                allocate_memory_for_string,
                free_memory_for_string,
                hs_add_from_strings,
                hs_multiply_from_strings,
                hs_power_from_strings) where

import qualified Data.List as L
import Foreign.C.String (CString, CChar, newCString, peekCString)
import Foreign.C.Types (CInt(..))
import Foreign.Marshal.Alloc (mallocBytes, free)
import Foreign.Ptr (Ptr)
import System.IO.Unsafe (unsafePerformIO)

type Ordinal = OrdImpl

-- The ordinal notation system used here is essentially that of the
-- paper by W. Buchholz, "A New System of Proof-Theoretic Ordinal
-- Functions", Ann. Pure. Appl. Logic 32 (1986) 195-207, except that
-- the collapsing functions ψ_i are only defined for i<ω.

-- (To give a few examples, ψ_0(γ) equals ω^γ for γ<ε_0, but then it
-- is undefined until the (uncountable!) Ω_1 = ψ_1(0), at which point
-- it takes the value ε_0, then ψ_0(Ω_1 + γ) equals ε_0·ω^γ for γ<ε_1
-- and ψ_0(Ω_1·(1+γ)) equals ε_γ up to the first fixed point of that
-- function.)

-- An ordinal is implemented as a list of triplets (i,x,v) (subject to
-- certain conditions that are checked by makeOrd) where i and v are
-- integers (v>0) and x is another ordinal: this represents the sum of
-- the ψ_i(x)·v (which are supposed to be a decreasing sequence).
type OrdTerm = (Integer,Ordinal,Integer)
data OrdImpl = O [OrdTerm]

showsOrd :: Ordinal -> ShowS
showsOrd (O[]) = ("zero"++)
showsOrd (O[(0,O[],v)]) = ("nat "++) . shows v
showsOrd (O l) = ('O':) . shows l

instance Show OrdImpl where
  showsPrec _ x = showsOrd x

-- Comparison of ordinals: the main one is compareOrd.

-- Compare ψ_i(x) with ψ_j(y):
compareMono :: (Integer,Ordinal) -> (Integer,Ordinal) -> Ordering
compareMono (i,x) (j,y) =
  if not (i == j) then compare i j
  else compareOrd x y

-- Compare ψ_i(x)·v with ψ_j(y)·w:
compareTerm :: OrdTerm -> OrdTerm -> Ordering
compareTerm (i,x,v) (j,y,w) =
  let cmp = compareMono (i,x) (j,y)
  in if not (cmp == EQ) then cmp else compare v w

-- Compare two ordinals:
compareOrd :: Ordinal -> Ordinal -> Ordering
compareOrd (O[]) (O[]) = EQ
compareOrd (O[]) (O l') = LT
compareOrd (O l) (O[]) = GT
compareOrd (O l) (O l') =
  let t = head l
      t' = head l'
  in let cmp = compareTerm t t'
     in if not (cmp == EQ)
        then cmp
        else compareOrd (O(tail l)) (O(tail l'))

instance Eq OrdImpl where
  x == y = (compareOrd x y == EQ)

instance Ord OrdImpl where
  compare x y = compareOrd x y

-- Check that ψ_i(x) makes sense:
validPsiArgument :: Integer -> Ordinal -> Bool
validPsiArgument i x = check x
  where check (O l) = checkList l
        checkList [] = True
        checkList ((j,y,w):ls) =
          (if j>i then check y else True)
          && (if j>=i then (compare y x == LT) else True)
          && checkList ls

-- Create an ordinal from its description, making sure it is
-- well-formed:
makeOrd :: [(Integer,OrdImpl,Integer)] -> Ordinal
makeOrd l = O(checkList l)
  where checkList [] = []
        checkList ((i,x,v):ls) =
          if v<0 || i < 0
          then error "makeOrd: negative coefficient in ordinal"
          else if not (validPsiArgument i x)
               then error ("makeOrd: uncanonical argument to psi: "++(show x))
               else let ls' = case ls of
                          [] -> []
                          (j,y,w):lss ->
                            if compareMono (i,x) (j,y) == GT
                            then checkList ls
                            else error "makeOrd: wrongly ordered series"
                    in if v == 0 then ls'
                       else (i,x,v):ls'

-- Usual addition of ordinals:
usualPlus :: Ordinal -> Ordinal -> Ordinal
usualPlus (O l) (O p) = O(foldr addTerm p l)
  where addTerm t@(i,x,v) [] = [t]
        addTerm t@(i,x,v) l@((j,y,w):ls) =
          case compareMono (i,x) (j,y) of
            LT -> l
            EQ -> (j,y,v+w):ls
            GT -> t:l

-- Usual sum of a list of ordinals:
usualSum :: [Ordinal] -> Ordinal
usualSum l = foldl usualPlus (O[]) l

-- Test whether an ordinal is zero:
isZero :: Ordinal -> Bool
isZero (O[]) = True
isZero _ = False

-- Test whether an ordinal is successor:
isSuccessor :: Ordinal -> Bool
isSuccessor (O[]) = False
isSuccessor (O l) =
  let (i,x,v) = last l in i==0 && isZero x

-- Return the successor of an ordinal:
successor :: Ordinal -> Ordinal
successor (O[]) = O[(0,O[],1)]
successor (O l) =
  let (i,x,v) = last l
      li = init l
  in if i==0 && isZero x then makeOrd(li++[(i,x,v+1)])
     else makeOrd(l++[(0,O[],1)])

-- Return the predecessor of an ordinal (or an error if it doesn't exist):
predecessor :: Ordinal -> Ordinal
predecessor (O[]) = error "predecessor: zero"
predecessor (O l) =
  let (i,x,v) = last l
      li = init l
  in if i==0 && isZero x then makeOrd(li++[(i,x,v-1)])
     else error "predecessor: limit ordinal"

-- Test whether an ordinal is <ω:
isFinite :: Ordinal -> Bool
isFinite (O[]) = True
isFinite (O[(i,x,v)]) = i==0 && isZero x
isFinite (O l) = False

-- Convert an ordinal to an integer if it is <ω (or raise an error otherwise):
finiteValue :: Ordinal -> Integer
finiteValue (O[]) = 0
finiteValue (O[(i,x,v)]) | i==0 && isZero x = v
finiteValue (O l) = error "finiteValue: infinite"

-- Return the finite part (remainder of division by ω):
finitePart :: Ordinal -> Ordinal
finitePart (O l) = O(filter (\ (i,x,v) -> i==0 && isZero x) l)

-- Return the infinite part (ordinal minus its finite part):
infinitePart :: Ordinal -> Ordinal
infinitePart (O l) = O(filter (\ (i,x,v) -> not (i==0 && isZero x)) l)

-- Test whether the ordinal is countable:
isCountable :: Ordinal -> Bool
isCountable (O[]) = True
isCountable (O((i,x,v):ls)) = i==0

-- Return the countable part (remainder of division by Ω_1):
countablePart :: Ordinal -> Ordinal
countablePart (O l) = O(filter (\ (i,x,v) -> i==0) l)

-- Return the uncountable part (ordinal minus its countable part):
uncountablePart :: Ordinal -> Ordinal
uncountablePart (O l) = O(filter (\ (i,x,v) -> not (i==0)) l)

-- Return i such that the cardinality of this ordinal is aleph_i (0 if
-- finite or countable):
cardinal :: Ordinal -> Integer
cardinal (O[]) = 0
cardinal (O((i,x,v):ls)) = i

-- Return the Cantor Normal Form of the given ordinal: this is a list
-- of (t,v) with v>0 integer, such that the ordinal is the decreasing
-- sum of the ω^t·v:
cantorNormalForm :: Ordinal -> [(Ordinal,Integer)]
cantorNormalForm (O l) = [(omegaLogPsi(i,x),v) | (i,x,v) <- l]
  where omegaLogPsi (i,x) =
          let (O l) = x
              l1 = (filter (\ (j,y,w) -> j>i) l)
              l0 = (filter (\ (j,y,w) -> j<=i) l)
              z = if i==0 && (null l1) then O[] else makeOrd [(i,(O l1),1)]
          in usualPlus z (O l0)

-- Return ω^t·v from t and v:
omegaPower_ :: Ordinal -> Integer -> Ordinal
omegaPower_ (O[]) u = makeOrd [(0,O[],u)]
omegaPower_ t@(O l) u =
  let ((i,x,v):ls) = l
      (O p) = x
      p1 = (filter (\ (j,y,w) -> j>i) p)
      p0 = (filter (\ (j,y,w) -> j<=i) p)
      vbar = if (not (null p0)) || (i==0 && (null p1)) then v else v-1
      q = p1 ++ [(i,x,vbar)] ++ ls
  in makeOrd [(i, (makeOrd q), u)]

-- Return ω^t:
omegaPower :: Ordinal -> Ordinal
omegaPower t = omegaPower_ t 1

-- Create an ordinal from its CNF:
unCantorNormalForm :: [(Ordinal,Integer)] -> Ordinal
unCantorNormalForm l =
  let opv (e,v) = omegaPower_ e v
  in usualSum $ map opv l

-- Usual multiplication of ordinals:
usualTimes :: Ordinal -> Ordinal -> Ordinal
usualTimes x y =
  let cy = cantorNormalForm y
      cx = cantorNormalForm x
      fc (e,v) = if isZero e
                 then case cx of [] -> []
                                 ((ex,u):s) -> ((ex,u*v):s)
                 else case cx of [] -> []
                                 ((ex,u):s) -> [(ex `usualPlus` e,v)]
      cxy = concat $ map fc cy
  in unCantorNormalForm cxy

-- Usual product of a list of ordinals:
usualProduct :: [Ordinal] -> Ordinal
usualProduct l = foldl usualTimes (O[(0,O[],1)]) l

-- Raise an ordinal to a finite power:
finitePower :: Ordinal -> Integer -> Ordinal
finitePower x 0 = O[(0,O[],1)]
finitePower x k | isFinite x = nat ((finiteValue x) ^ k)
finitePower x k =
  let cx = cantorNormalForm x
      cvx = if isSuccessor x then cx else cx++[(O[],0)]
      (_,n0) = last cvx
      (er,nr) = head cvx
      cmx = init $ tail cvx
      bunch i = let eri = er `usualTimes` (nat i)
                in ((eri `usualPlus` er), if i==k-1 then nr else nr*n0) :
                   (map (\ (e,n) -> ((eri `usualPlus` e), n)) cmx)
      cxk = if n0>0
            then (concat (map bunch $ reverse [0..(k-1)])) ++ [(O[],n0)]
            else bunch (k-1)
  in unCantorNormalForm cxk

-- Usual power operation on ordinals:
usualPower :: Ordinal -> Ordinal -> Ordinal
usualPower x y =
  let cy = cantorNormalForm y
      cx = cantorNormalForm x
      fc (e,v) =
        if isZero e then finitePower x v
        else if isFinite x
             then let n = finiteValue x
                  in if n>=2
                     then if isFinite e
                          then omegaPower $ omegaPower_ (predecessor e) v
                          else omegaPower $ omegaPower_ e v
                     else if n==1 then O[(0,O[],1)] else O[]
             else let (er,nr) = head cx
                  in omegaPower $ usualTimes er $ omegaPower_ e v
  in usualProduct $ map fc cy

-- Epsilon operation on ordinals (returns ε_γ from γ):
epsilon :: Ordinal -> Ordinal
epsilon (O[]) = O[(0,(O[(1,O[],1)]),1)]
epsilon t@(O l) =
  let ((i,x,v):ls) = l
      refOmega = O[((i+1),O[],1)]
      flt (j,y,w) = j>(i+1) || (j==(i+1) && ((cmp==EQ)||(cmp==GT)))
        where cmp = compare y refOmega
      (O p) = x
      p1 = (filter flt p)
      p0 = (filter (\ (j,y,w) -> not (flt (j,y,w))) p)
      vbar = if (not (null p0)) || (i==0 && (null p1)) then v else v-1
      q = usualSum ([makeOrd(p1)]
                    ++ (if (i==0 && (null p1)) then [refOmega] else [])
                    ++ [usualTimes refOmega (makeOrd ((i,x,vbar):ls))])
  in makeOrd [(i, q, 1)]

-- standardSequence below returns an (infinite!) standard sequence of
-- ordinals converging to the given ordinal (which is supposed to be a
-- limit ordinal of countable cofinality).

indexSeq :: Ordinal -> [Integer]
indexSeq (O[]) = []
indexSeq (O l) =
  let (i,x,v) = last l
  in i:(indexSeq x)

subtree :: Int -> Ordinal -> Ordinal
subtree n (O[]) = error "subtree: computing nonexistent subtree"
subtree n (O l) =
  let (i,x,v) = last l
  in if n==0 then O[(i,x,1)] else subtree (n-1) x

graft :: Int -> Ordinal -> Ordinal -> Ordinal
graft n (O[]) _ = error "graft: attempting impossible graft"
graft n (O l) z@(O p) =
  let (i,x,v) = last l
      li = init l
      q = if n==0 then p else [(i, graft (n-1) x z, 1)]
  in makeOrd(li++[(i,x,v-1)]++q)

standardSequence :: Ordinal -> [Ordinal]
standardSequence x =
  let isq = indexSeq x
      dpt = length isq
      k = if dpt == 0 then error "standardSequence: zero"
          else isq !! (dpt-1)
  in if k == 0 then
        if dpt == 1
        then error "standardSequence: successor ordinal"
        else let (j,z) = case subtree (dpt-2) x of
                   O[(j,y,1)] -> (j,predecessor y)
                   _ -> error "standardSequence: this is impossible"
             in map (\r -> graft (dpt-2) x (O[(j,z,r)])) [0..]
     else let bnd = let search b =
                          if b < 0
                          then error "standardSequence: uncountable cofinality"
                          else if (isq!!b)<k
                               then b
                               else search (b-1)
                    in search (dpt-1)
              z = subtree bnd x
              zz = case z of
                O[(j,y,1)] | j<k -> O[(k-1,y,1)]
                _ -> error "standardSequence: this is impossible"
          in map (\t -> graft (dpt-1) x t) $
             iterate (\t -> graft (dpt-bnd-1) zz t) (O[])

-- Compute the slow and fast-growing functions indexed by a given
-- ordinal.  This is impossibly slow because lazy-evaluation gets in
-- the way.

slowGrowing :: Ordinal -> Integer -> Integer
slowGrowing z n =
  if isZero z then 0
  else if isSuccessor z then (slowGrowing (predecessor z) n) + 1
       else let seq = standardSequence z
            in slowGrowing (seq !! (fromInteger n)) n

fastGrowing :: Ordinal -> Integer -> Integer
fastGrowing z n =
  if isZero z then n+1
  else if isSuccessor z then (iterate (fastGrowing (predecessor z)) n) !! (fromInteger n)
       else let seq = standardSequence z
            in fastGrowing (seq !! (fromInteger n)) n

-- Some convenience functions:

-- The ordinal 0:
zero :: Ordinal
zero = makeOrd []

-- The ordinal n (a natural number):
nat :: Integer -> Ordinal
nat n = makeOrd [(0,zero,n)]

-- The ordinal 1:
one :: Ordinal
one = nat 1

-- The ordinal 2:
two :: Ordinal
two = nat 2

-- The function ψ_0:
psi0 :: Ordinal -> Ordinal
psi0 x = makeOrd [(0,x,1)]

-- The function ψ_1:
psi1 :: Ordinal -> Ordinal
psi1 x = makeOrd [(1,x,1)]

-- The ordinal ω:
omega :: Ordinal
omega = makeOrd [(0,one,1)]

-- The ordinal ω·2:
omegaTwo :: Ordinal
omegaTwo = makeOrd [(0,one,2)]

-- The ordinal ω+1:
omegaPlusOne :: Ordinal
omegaPlusOne = makeOrd [(0,one,1),(0,zero,1)]

-- The ordinal ω^2:
omegaSquared :: Ordinal
omegaSquared = makeOrd [(0,two,1)]

-- The ordinal ω^ω:
omegaOmega :: Ordinal
omegaOmega = makeOrd [(0,omega,1)]

-- The ordinal ε_0:
epsilon0 :: Ordinal
epsilon0 = makeOrd [(0,(makeOrd [(1,zero,1)]),1)]

-- The ordinal ε_1:
epsilon1 :: Ordinal
epsilon1 = makeOrd [(0,(makeOrd [(1,zero,2)]),1)]

-- The ordinal ε_ω:
epsilonOmega :: Ordinal
epsilonOmega = makeOrd [(0,(makeOrd [(1,one,1)]),1)]

-- The ordinal ε_{ε_0}:
epsilonEpsilon0 :: Ordinal
epsilonEpsilon0 = makeOrd [(0,(makeOrd [(1,epsilon0,1)]),1)]

-- The smallest ordinal δ such that δ = ε_δ:
zeta0 :: Ordinal
zeta0 = makeOrd [(0,(makeOrd [(1,(makeOrd [(1,zero,1)]),1)]),1)]

-- The ordinal φ(ω,0) where φ is the Veblen function of two variables:
omegath0 :: Ordinal
omegath0 = makeOrd [(0,(makeOrd [(1,(makeOrd [(1,one,1)]),1)]),1)]

-- The Feferman-Schütte ordinal, the smallest ordinal δ such that δ = φ(δ,0):
fefermanSchuette :: Ordinal
fefermanSchuette = makeOrd [(0,(makeOrd [(1,(makeOrd [(1,(makeOrd [(1,zero,1)]),1)]),1)]),1)]

-- The small Veblen ordinal:
smallVeblen :: Ordinal
smallVeblen = makeOrd [(0,(makeOrd [(1,(makeOrd [(1,(makeOrd [(1,one,1)]),1)]),1)]),1)]

-- The large Veblen ordinal:
largeVeblen :: Ordinal
largeVeblen = makeOrd [(0,(makeOrd [(1,(makeOrd [(1,(makeOrd [(1,(makeOrd [(1,zero,1)]),1)]),1)]),1)]),1)]

-- The Bachmann-Howard ordinal:
bachmannHoward :: Ordinal
bachmannHoward = makeOrd [(0,(makeOrd [(2,zero,1)]),1)]

-- The first uncountable ordinal:
bigOmega :: Ordinal
bigOmega = makeOrd [(1,zero,1)]

-- A list of example ordinals:
examples :: [Ordinal]
examples = [zero, one, two, omega, omegaPlusOne, omegaTwo, omegaSquared, omegaOmega, epsilon0, epsilon1, epsilonOmega, epsilonEpsilon0, zeta0, omegath0, fefermanSchuette, smallVeblen, largeVeblen, bachmannHoward]

-- Check that examples are in the correct order:
checkExamples :: Bool
checkExamples = and [compare (examples !! i) (examples !! j) == compare i j | i<-[0..length(examples)-1], j<-[0..length(examples)-1]]

-- START: FFI EXPORTED FUNCTIONS AND HELPERS FOR WASM TESTING --

-- Note: The following parser and stringifier are simplified stubs.
-- For robust testing, they need to be implemented to fully handle
-- arbitrary CNF strings and perfectly match the JS toStringCNF format.

-- STUBBED CNF String to Haskell Ordinal Parser
-- This is highly simplified and only recognizes a few specific strings.
-- A real implementation would need a proper parser (e.g., using Parsec or similar).
unsafeParseCNFStringToHaskellOrdinal :: String -> Ordinal
unsafeParseCNFStringToHaskellOrdinal "0" = zero
unsafeParseCNFStringToHaskellOrdinal "1" = one
unsafeParseCNFStringToHaskellOrdinal "2" = two
unsafeParseCNFStringToHaskellOrdinal "w" = omega
unsafeParseCNFStringToHaskellOrdinal "w+1" = omegaPlusOne
unsafeParseCNFStringToHaskellOrdinal "w*2" = omegaTwo
unsafeParseCNFStringToHaskellOrdinal "w^2" = omegaSquared
unsafeParseCNFStringToHaskellOrdinal "w^w" = omegaOmega
-- Add more basic cases as needed for initial testing
unsafeParseCNFStringToHaskellOrdinal s = error $ "Haskell STUB_PARSE: Unimplemented CNF string input: " ++ s

-- STUBBED Haskell Ordinal to CNF String
-- This is highly simplified and only recognizes a few specific ordinals.
-- Must exactly match JS toStringCNF output format for comparison.
haskellOrdinalToCNFString :: Ordinal -> String
haskellOrdinalToCNFString ord
    | ord == zero         = "0"
    | ord == one          = "1"
    | ord == two          = "2"
    | ord == omega        = "w"
    | ord == omegaPlusOne = "w+1"
    | ord == omegaTwo     = "w*2"
    | ord == omegaSquared = "w^2"
    | ord == omegaOmega   = "w^w"
    -- This default case uses the existing `cantorNormalForm` and a simple formatter.
    -- It's a starting point but likely won't match JS `toStringCNF` for complex exponents
    -- or specific parenthesis rules without further refinement.
    | otherwise           = formatCNF (cantorNormalForm ord)
    where
        formatCNF :: [(Ordinal, Integer)] -> String
        formatCNF [] = "0" -- Should be handled by `ord == zero`
        formatCNF cnfList = L.intercalate " + " $ map formatTerm cnfList

        formatTerm :: (Ordinal, Integer) -> String
        formatTerm (expOrd, coeff)
            | isZero expOrd = show coeff
            | otherwise =
                let expStr = haskellOrdinalToCNFString expOrd -- Recursive call
                    baseStr = if expOrd == one then "w"
                              else if isSimpleExponent expOrd then "w^" ++ expStr
                                   else "w^(" ++ expStr ++ ")"
                in if coeff == 1 then baseStr else baseStr ++ "*" ++ show coeff

        isSimpleExponent :: Ordinal -> Bool
        isSimpleExponent o = isFinite o || o == omega -- Simplified check

-- Exported memory management functions for CStrings
foreign export ccall allocate_memory_for_string :: CInt -> IO (Ptr CChar)
allocate_memory_for_string size = mallocBytes (fromIntegral size)

foreign export ccall free_memory_for_string :: Ptr CChar -> IO ()
free_memory_for_string ptr = free ptr

-- Helper to convert Haskell String to an IO CString (allocates new CString)
toIOCString :: String -> IO CString
toIOCString = newCString

-- Helper to convert CString to an IO Haskell String
fromIOCString :: CString -> IO String
fromIOCString = peekCString

-- Exported arithmetic functions that take and return CStrings
foreign export ccall hs_add_from_strings :: CString -> CString -> IO CString
hs_add_from_strings cs1 cs2 = do
    s1 <- fromIOCString cs1
    s2 <- fromIOCString cs2
    let ord1 = unsafeParseCNFStringToHaskellOrdinal s1
    let ord2 = unsafeParseCNFStringToHaskellOrdinal s2
    let resultOrd = ord1 `usualPlus` ord2
    toIOCString (haskellOrdinalToCNFString resultOrd)

foreign export ccall hs_multiply_from_strings :: CString -> CString -> IO CString
hs_multiply_from_strings cs1 cs2 = do
    s1 <- fromIOCString cs1
    s2 <- fromIOCString cs2
    let ord1 = unsafeParseCNFStringToHaskellOrdinal s1
    let ord2 = unsafeParseCNFStringToHaskellOrdinal s2
    let resultOrd = ord1 `usualTimes` ord2
    toIOCString (haskellOrdinalToCNFString resultOrd)

foreign export ccall hs_power_from_strings :: CString -> CString -> IO CString
hs_power_from_strings csBase csExp = do
    sBase <- fromIOCString csBase
    sExp <- fromIOCString csExp
    let ordBase = unsafeParseCNFStringToHaskellOrdinal sBase
    let ordExp  = unsafeParseCNFStringToHaskellOrdinal sExp
    let resultOrd = ordBase `usualPower` ordExp
    toIOCString (haskellOrdinalToCNFString resultOrd)

-- END: FFI EXPORTED FUNCTIONS AND HELPERS --