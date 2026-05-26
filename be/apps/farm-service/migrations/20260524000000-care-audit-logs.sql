-- Migration: 20260524000000-care-audit-logs
-- Creates the care_audit_logs table for tracking create/update/delete events
-- on care_logs rows to support immutability verification (FR-F09).

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS care_audit_logs (
  id          UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  care_log_id UUID         NOT NULL,
  action      VARCHAR(16)  NOT NULL CHECK (action IN ('CREATE', 'UPDATE', 'DELETE')),
  changed_by  VARCHAR(64),
  old_values  JSONB,
  new_values  JSONB,
  changed_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_care_audit_care_log_id ON care_audit_logs (care_log_id);
CREATE INDEX IF NOT EXISTS idx_care_audit_changed_at  ON care_audit_logs (changed_at);
