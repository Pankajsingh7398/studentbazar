/**
 * StudentBazaar — Environment Variable Validation (server/src/config/envValidate.js)
 * Ensures all mission-critical production variables are loaded before booting.
 */

export function validateEnvironment() {
  const isProduction = process.env.NODE_ENV === 'production';
  const missing = [];
  const weakSecrets = [];

  const required = [
    'MONGODB_URI',
    'JWT_SECRET',
    'COOKIE_SECRET'
  ];

  if (isProduction) {
    required.push('FRONTEND_URL');
  }

  for (const varName of required) {
    const val = process.env[varName];
    if (!val || val.trim() === '') {
      missing.push(varName);
    } else if (isProduction && (val.includes('secret') || val.length < 16)) {
      weakSecrets.push(varName);
    }
  }

  if (missing.length > 0) {
    console.error('\n❌ [Fatal Configuration Error] Missing required environment variables:');
    missing.forEach(v => console.error(`   - ${v}`));
    if (isProduction) {
      console.error('Server cannot start in production without these variables. Exiting.\n');
      process.exit(1);
    } else {
      console.warn('⚠️ Running in development with fallback defaults.\n');
    }
  }

  if (isProduction && weakSecrets.length > 0) {
    console.warn('⚠️ [Security Warning] The following secrets appear short or default in production:');
    weakSecrets.forEach(v => console.warn(`   - ${v} (Recommendation: Generate with 'openssl rand -base64 32')`));
  }

  return true;
}
