-- Migration: Create price_history table
-- Version: 001
-- Date: 2025-11-23

BEGIN;

-- Check if table already exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'price_history') THEN
    -- Enable UUID extension
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

    -- Create price_history table
    CREATE TABLE price_history (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      product_id UUID NOT NULL,
      product_name VARCHAR(255) NOT NULL,
      store_id VARCHAR(100) NOT NULL,
      store_name VARCHAR(255) NOT NULL,
      prix DECIMAL(10, 2) NOT NULL,
      prix_unitaire DECIMAL(10, 4),
      unite VARCHAR(50),
      valid_from DATE NOT NULL,
      valid_to DATE,
      source VARCHAR(50) NOT NULL CHECK (source IN ('circulaire', 'crowdsource', 'manual', 'admin')),
      confidence DECIMAL(3, 2) DEFAULT 1.0 CHECK (confidence >= 0 AND confidence <= 1),
      verified_by UUID,
      verified_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      CONSTRAINT valid_period CHECK (valid_to IS NULL OR valid_to >= valid_from)
    );

    -- Create indexes
    CREATE INDEX idx_price_history_product ON price_history(product_id, valid_from DESC);
    CREATE INDEX idx_price_history_store ON price_history(store_id, valid_from DESC);
    CREATE INDEX idx_price_history_validity ON price_history(valid_from, valid_to) WHERE valid_to IS NULL;
    CREATE INDEX idx_price_history_source ON price_history(source);

    -- Create updated_at trigger
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $func$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $func$ LANGUAGE plpgsql;

    CREATE TRIGGER update_price_history_updated_at
    BEFORE UPDATE ON price_history
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

    RAISE NOTICE 'price_history table created successfully';
  ELSE
    RAISE NOTICE 'price_history table already exists, skipping';
  END IF;
END $$;

COMMIT;
