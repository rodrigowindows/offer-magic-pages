-- CSV Import Helper Functions
-- Allows dynamic column creation for CSV imports

-- Function to check if a column exists
CREATE OR REPLACE FUNCTION column_exists(
  table_name text,
  column_name text
) RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = $1
    AND column_name = $2
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add a column if it doesn't exist
CREATE OR REPLACE FUNCTION add_column_if_not_exists(
  table_name text,
  column_name text,
  column_type text DEFAULT 'text'
) RETURNS boolean AS $$
DECLARE
  sql_statement text;
BEGIN
  -- Check if column already exists
  IF column_exists(table_name, column_name) THEN
    RETURN false;
  END IF;

  -- Validate column name (alphanumeric and underscore only)
  IF column_name !~ '^[a-z][a-z0-9_]*$' THEN
    RAISE EXCEPTION 'Invalid column name: %. Must start with letter and contain only lowercase letters, numbers, and underscores.', column_name;
  END IF;

  -- Validate table name
  IF table_name !~ '^[a-z][a-z0-9_]*$' THEN
    RAISE EXCEPTION 'Invalid table name: %', table_name;
  END IF;

  -- Validate column type
  IF column_type NOT IN ('text', 'integer', 'numeric', 'boolean', 'timestamp', 'date', 'jsonb') THEN
    RAISE EXCEPTION 'Invalid column type: %. Allowed types: text, integer, numeric, boolean, timestamp, date, jsonb', column_type;
  END IF;

  -- Build and execute ALTER TABLE statement
  sql_statement := format(
    'ALTER TABLE %I ADD COLUMN %I %s',
    table_name,
    column_name,
    column_type
  );

  EXECUTE sql_statement;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all column names for a table
CREATE OR REPLACE FUNCTION get_table_columns(
  p_table_name text
) RETURNS TABLE(
  column_name text,
  data_type text,
  is_nullable text
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.column_name::text,
    c.data_type::text,
    c.is_nullable::text
  FROM information_schema.columns c
  WHERE c.table_schema = 'public'
  AND c.table_name = p_table_name
  ORDER BY c.ordinal_position;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION column_exists(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION add_column_if_not_exists(text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_table_columns(text) TO authenticated;

-- Comment the functions
COMMENT ON FUNCTION column_exists IS 'Check if a column exists in a table';
COMMENT ON FUNCTION add_column_if_not_exists IS 'Add a column to a table if it does not already exist. Only allows safe column types.';
COMMENT ON FUNCTION get_table_columns IS 'Get all columns for a table with their data types';
