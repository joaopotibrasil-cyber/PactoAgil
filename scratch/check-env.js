
console.log('--- ENV CHECK ---');
console.log('DATABASE_URL (process):', process.env.DATABASE_URL ? 'DEFINED' : 'UNDEFINED');
console.log('DATABASE_URL (import.meta):', 'Astro env vars are not directly accessible in plain node scripts unless using dotenv');
console.log('--- END CHECK ---');
