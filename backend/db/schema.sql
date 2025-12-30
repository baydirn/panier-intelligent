-- ============================================
-- PRICE HISTORY SCHEMA
-- Tracks all price changes over time with provenance
-- ============================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Price history table (central DB)
CREATE TABLE price_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL,
  product_name VARCHAR(255) NOT NULL,  -- Denormalized for performance
  store_id VARCHAR(100) NOT NULL,
  store_name VARCHAR(255) NOT NULL,    -- Denormalized
  
  -- Price information
  prix DECIMAL(10, 2) NOT NULL,
  prix_unitaire DECIMAL(10, 4),
  unite VARCHAR(50),                    -- 'kg', 'L', '100g', etc.
  
  -- Validity period
  valid_from DATE NOT NULL,
  valid_to DATE,                        -- NULL = still valid
  
  -- Provenance & quality
  source VARCHAR(50) NOT NULL CHECK (source IN ('circulaire', 'crowdsource', 'manual', 'admin')),
  confidence DECIMAL(3, 2) DEFAULT 1.0 CHECK (confidence >= 0 AND confidence <= 1),  -- 0-1 OCR quality
  
  -- Validation & audit
  verified_by UUID,                     -- Admin user ID who validated
  verified_at TIMESTAMP,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_period CHECK (valid_to IS NULL OR valid_to >= valid_from)
);

-- Indexes for performance
CREATE INDEX idx_price_history_product ON price_history(product_id, valid_from DESC);
CREATE INDEX idx_price_history_store ON price_history(store_id, valid_from DESC);
CREATE INDEX idx_price_history_validity ON price_history(valid_from, valid_to) WHERE valid_to IS NULL;
CREATE INDEX idx_price_history_source ON price_history(source);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_price_history_updated_at
BEFORE UPDATE ON price_history
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- View for current prices only
CREATE VIEW current_prices AS
SELECT 
  product_id,
  product_name,
  store_id,
  store_name,
  prix,
  prix_unitaire,
  unite,
  source,
  confidence,
  valid_from,
  created_at
FROM price_history
WHERE valid_to IS NULL OR valid_to >= CURRENT_DATE
ORDER BY valid_from DESC;

-- Materialized view for price trends (performance optimization)
CREATE MATERIALIZED VIEW price_trends AS
SELECT 
  product_id,
  product_name,
  store_id,
  store_name,
  COUNT(*) as num_changes,
  MIN(prix) as min_price,
  MAX(prix) as max_price,
  AVG(prix) as avg_price,
  STDDEV(prix) as price_volatility,
  MIN(valid_from) as first_seen,
  MAX(valid_from) as last_update
FROM price_history
GROUP BY product_id, product_name, store_id, store_name;

CREATE INDEX idx_price_trends_product ON price_trends(product_id);
CREATE INDEX idx_price_trends_store ON price_trends(store_id);

-- Function to refresh materialized view (call daily via cron)
CREATE OR REPLACE FUNCTION refresh_price_trends()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY price_trends;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Get current price for a product at a store
CREATE OR REPLACE FUNCTION get_current_price(
  p_product_id UUID,
  p_store_id VARCHAR(100)
)
RETURNS TABLE (
  prix DECIMAL(10, 2),
  prix_unitaire DECIMAL(10, 4),
  unite VARCHAR(50),
  source VARCHAR(50),
  valid_from DATE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ph.prix,
    ph.prix_unitaire,
    ph.unite,
    ph.source,
    ph.valid_from
  FROM price_history ph
  WHERE ph.product_id = p_product_id
    AND ph.store_id = p_store_id
    AND (ph.valid_to IS NULL OR ph.valid_to >= CURRENT_DATE)
  ORDER BY ph.valid_from DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Detect stale prices (older than 30 days)
CREATE OR REPLACE FUNCTION detect_stale_prices(days_threshold INT DEFAULT 30)
RETURNS TABLE (
  product_id UUID,
  product_name VARCHAR(255),
  store_id VARCHAR(100),
  store_name VARCHAR(255),
  last_update DATE,
  days_old INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ph.product_id,
    ph.product_name,
    ph.store_id,
    ph.store_name,
    ph.valid_from as last_update,
    (CURRENT_DATE - ph.valid_from)::INT as days_old
  FROM price_history ph
  WHERE ph.valid_to IS NULL
    AND (CURRENT_DATE - ph.valid_from) > days_threshold
  ORDER BY days_old DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SAMPLE DATA (for testing)
-- ============================================
-- Uncomment to insert sample data
/*
INSERT INTO price_history (product_id, product_name, store_id, store_name, prix, prix_unitaire, unite, valid_from, source, confidence)
VALUES 
  (uuid_generate_v4(), 'Lait 2L Natrel', 'metro-001', 'Metro Jean-Talon', 5.99, 2.995, 'L', '2025-11-01', 'circulaire', 0.95),
  (uuid_generate_v4(), 'Lait 2L Natrel', 'metro-001', 'Metro Jean-Talon', 4.99, 2.495, 'L', '2025-11-15', 'circulaire', 0.98),
  (uuid_generate_v4(), 'Pommes Gala 1kg', 'iga-001', 'IGA Laurier', 3.99, 3.99, 'kg', '2025-11-10', 'manual', 1.0);
*/
