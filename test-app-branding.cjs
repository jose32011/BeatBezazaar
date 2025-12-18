const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');

// Import the schema
const schema = require('./shared/schema.ts');
const { appBrandingSettings } = schema;

const postgresUri = process.env.DATABASE_URL;
if (!postgresUri) {
  console.log('No DATABASE_URL found');
  process.exit(1);
}

const pgClient = postgres(postgresUri);
const db = drizzle(pgClient, { schema });

async function testAppBranding() {
  try {
    console.log('Testing app branding settings...');
    
    // Try to select from the table
    const result = await db.select().from(appBrandingSettings).limit(1);
    console.log('✓ App branding settings table exists');
    console.log('Current settings:', result);
    
    // Try to insert a test record if none exists
    if (result.length === 0) {
      console.log('No settings found, creating default...');
      const newSettings = {
        id: `app-branding-${Date.now()}`,
        appName: 'Test App',
        appLogo: '',
        heroTitle: 'Test Hero Title',
        heroSubtitle: 'Test Hero Subtitle',
        heroImage: '',
        heroButtonText: 'Test Button',
        heroButtonLink: '/test',
        heroBannerData: '',
        loginTitle: 'Test Login',
        loginSubtitle: 'Test Login Subtitle',
        loginImage: '',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await db.insert(appBrandingSettings).values(newSettings);
      console.log('✓ Test settings created');
      
      // Verify the insert
      const newResult = await db.select().from(appBrandingSettings).limit(1);
      console.log('New settings:', newResult);
    }
    
  } catch (error) {
    console.error('✗ Error:', error.message);
    console.error('Full error:', error);
  } finally {
    await pgClient.end();
  }
}

testAppBranding();