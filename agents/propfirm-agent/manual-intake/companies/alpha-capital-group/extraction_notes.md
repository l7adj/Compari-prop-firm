# Alpha Capital Group - extraction notes

## Status
Extracted from uploaded ZIP screenshots. Visible data was converted into `extracted_matrix.csv` and quality flags were recorded in `data_quality_flags.csv`.

## Candidate data
- Alpha Pro 6% — 2 Step — 5K, 10K, 25K, 50K, 100K, 200K.
- Alpha Pro 8% — 2 Step — 5K, 10K, 25K, 50K, 100K, 200K.
- Alpha Three — 3 Step — 10K only.

## Important visible rules
- Trading environment is demo/simulated.
- Website notice says all accounts are demo accounts with simulated funds, and trading/revenue/profit references are virtual.
- Commission shown as $0 commission.
- Unlimited trading days shown as a general feature and in the program tables.
- Partner ACG Markets mentioned as providing institutional trading environment, market liquidity/depth, and sub-70ms targeted execution speeds.

## Missing / not imported
- 1 Step account details were not captured.
- Alpha Pro10% details were not captured.
- Swing details were not captured.
- 3 Step account sizes other than 10K were not captured.
- Platform names were not visible. Do not infer MT4/MT5/etc.

## Decision
Partial import is acceptable for visible 2-step Alpha Pro 6% and Alpha Pro 8% data. Other visible but uncaptured options must stay as data-quality flags until additional screenshots are provided.
