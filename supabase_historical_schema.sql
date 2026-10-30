-- ==============================================================================
-- AGRITWIN: 5-Minute Historical Sensor Readings & 6-Month Retention Schema
-- Execute in Supabase SQL Editor (https://app.supabase.com -> SQL Editor)
-- ==============================================================================

-- 1. Create dedicated historical_sensor_readings table
CREATE TABLE IF NOT EXISTS public.historical_sensor_readings (
  id TEXT PRIMARY KEY,
  node_id TEXT NOT NULL,
  sensor_name TEXT NOT NULL,
  sensor_key TEXT NOT NULL,
  sensor_value NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  sampled_at TIMESTAMPTZ NOT NULL,
  device_timestamp TIMESTAMPTZ,
  received_at TIMESTAMPTZ DEFAULT NOW(),
  quality_status TEXT DEFAULT 'VALID',
  data_source TEXT DEFAULT 'PHYSICAL_SENSOR',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Performance indexes for efficient slicing and analytics
CREATE INDEX IF NOT EXISTS idx_hist_node_id ON public.historical_sensor_readings(node_id);
CREATE INDEX IF NOT EXISTS idx_hist_sensor_key ON public.historical_sensor_readings(sensor_key);
CREATE INDEX IF NOT EXISTS idx_hist_sampled_at ON public.historical_sensor_readings(sampled_at DESC);
CREATE INDEX IF NOT EXISTS idx_hist_node_sensor_time ON public.historical_sensor_readings(node_id, sensor_key, sampled_at DESC);

-- 3. Composite unique constraint to prevent duplicate 5-minute snapshots
-- (Same node, same sensor, same sampled_at bucket)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_hist_node_sensor_sampled'
  ) THEN
    ALTER TABLE public.historical_sensor_readings
      ADD CONSTRAINT uq_hist_node_sensor_sampled UNIQUE (node_id, sensor_key, sampled_at);
  END IF;
END $$;

-- 4. Automated 6-Month (180 days) Data Retention Cleanup Function
CREATE OR REPLACE FUNCTION public.cleanup_expired_sensor_readings()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.historical_sensor_readings
  WHERE sampled_at < NOW() - INTERVAL '180 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- 5. Enable Supabase Realtime for historical updates (optional for live subscribers)
ALTER PUBLICATION supabase_realtime ADD TABLE public.historical_sensor_readings;
