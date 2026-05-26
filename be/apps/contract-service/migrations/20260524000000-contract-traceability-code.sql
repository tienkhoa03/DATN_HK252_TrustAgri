ALTER TABLE contracts
  ADD COLUMN IF NOT EXISTS traceability_code VARCHAR(32) UNIQUE;

CREATE INDEX IF NOT EXISTS idx_contracts_traceability_code ON contracts(traceability_code);

-- Backfill idempotent: sinh code cho contracts farmer_trader đang hoặc đã active
UPDATE contracts
SET traceability_code = 'LOT-' || REPLACE(SUBSTRING(id::text, 1, 12), '-', '')
WHERE traceability_code IS NULL
  AND contract_type = 'farmer_trader'
  AND status IN ('active', 'pending_change', 'in_settlement', 'completed');
