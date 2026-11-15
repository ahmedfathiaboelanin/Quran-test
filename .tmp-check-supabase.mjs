import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#') && line.includes('='))
    .map((line) => {
      const index = line.indexOf('=');
      return [line.slice(0, index), line.slice(index + 1)];
    }),
);

const url = env.VITE_SUPABASE_URL;
const key = env.VITE_SUPABASE_ANON_KEY;
const client = createClient(url, key, { auth: { persistSession: false } });

const { error: signInError } = await client.auth.signInAnonymously();
if (signInError) {
  console.log('SIGNIN_ERROR', signInError.message);
  process.exit(1);
}

const { data, error } = await client
  .from('monthly_records')
  .select('week_1,week_2,week_3,week_4,week_5,monthly_exam,total_mistakes,amount');

if (error) {
  console.log('QUERY_ERROR', error.message);
  process.exit(1);
}

const rows = data ?? [];
const fractional = [];
for (const row of rows) {
  for (const name of ['week_1', 'week_2', 'week_3', 'week_4', 'week_5', 'monthly_exam', 'total_mistakes']) {
    const value = row[name];
    if (typeof value === 'number' && !Number.isInteger(value)) {
      fractional.push({ name, value });
    }
  }
}

console.log('ROW_COUNT', rows.length);
console.log('FRACTIONAL_VALUES', JSON.stringify(fractional.slice(0, 20)));
console.log('SAMPLE', JSON.stringify(rows.slice(0, 5)));
