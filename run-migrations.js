import { supabase } from '../src/integrations/supabase/client';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigrations() {
  try {
    console.log('Reading database schema...');
    const schemaPath = join(__dirname, '..', 'database_schema.sql');
    const schema = readFileSync(schemaPath, 'utf-8');

    console.log('Executing database migrations...');

    // Split the schema into individual statements
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`Executing: ${statement.substring(0, 50)}...`);
        const { error } = await supabase.rpc('exec_sql', { sql: statement });

        if (error) {
          console.error('Error executing statement:', error);
          console.error('Statement was:', statement);
        } else {
          console.log('✓ Statement executed successfully');
        }
      }
    }

    console.log('Database migrations completed!');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

runMigrations();