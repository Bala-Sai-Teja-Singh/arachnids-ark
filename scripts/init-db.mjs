import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

// Manually parse .env.local
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = Object.fromEntries(
  envContent.split('\n')
    .filter(line => line.includes('='))
    .map(line => {
      const [key, ...rest] = line.split('=');
      return [key.trim(), rest.join('=').trim()];
    })
);

const MONGODB_URI = env.MONGODB_URI;
const ADMIN_EMAIL = env.ADMIN_EMAIL || 'arachnidsark.store@gmail.com';

if (!MONGODB_URI) {
  console.error('MONGODB_URI is not defined in .env.local');
  process.exit(1);
}

async function initDb() {
  console.log('Connecting to MongoDB...');
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB Connected Successfully!');
    
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    const existingNames = collections.map(c => c.name);

    const modelsToInit = [
      'users', 'products', 'orders', 'courses', 'enrollments', 
      'bookings', 'notifications', 'reviews', 'care-guides', 
      'system-settings', 'consultation-settings', 'revenues'
    ];

    console.log('\nInitializing Collections...');
    for (const collectionName of modelsToInit) {
        if (existingNames.includes(collectionName)) {
            console.log(`- Collection already exists: ${collectionName}`);
        } else {
            try {
                await db.createCollection(collectionName);
                console.log(`- Created collection: ${collectionName}`);
            } catch (e) {
                console.error(`- Error creating ${collectionName}:`, e.message);
            }
        }
    }

    console.log('\nChecking for Admin User...');
    const usersCollection = db.collection('users');
    const adminExists = await usersCollection.findOne({ role: 'admin' });

    if (adminExists) {
        console.log(`- Admin user already exists: ${adminExists.email}`);
    } else {
        const hashedPassword = await bcrypt.hash('ArachnidsAdmin123!', 12);
        await usersCollection.insertOne({
            _id: `admin-${Date.now()}`,
            name: 'Arachnids Ark Admin',
            email: ADMIN_EMAIL,
            password: hashedPassword,
            role: 'admin',
            createdAt: new Date(),
            updatedAt: new Date()
        });
        console.log(`- ✅ Created initial admin user: ${ADMIN_EMAIL}`);
        console.log(`  Password: ArachnidsAdmin123!`);
    }

    console.log('\nChecking for Test User...');
    const testUserEmail = 'testuser@gmail.com';
    const testUserExists = await usersCollection.findOne({ email: testUserEmail });

    if (testUserExists) {
        console.log(`- Test user already exists: ${testUserEmail}`);
    } else {
        const hashedTestPassword = await bcrypt.hash('TestUser123!', 12);
        await usersCollection.insertOne({
            _id: `user-${Date.now()}`,
            name: 'Test User',
            email: testUserEmail,
            password: hashedTestPassword,
            role: 'user',
            phone: '9876543210',
            createdAt: new Date(),
            updatedAt: new Date()
        });
        console.log(`- ✅ Created initial test user: ${testUserEmail}`);
        console.log(`  Password: TestUser123!`);
    }

    console.log('\nChecking for Consultation Settings...');
    const consultSettingsCol = db.collection('consultation-settings');
    const consultSettings = await consultSettingsCol.findOne({ _id: 'default' });
    if (consultSettings) {
        console.log('- Consultation settings already exist.');
    } else {
        await consultSettingsCol.insertOne({
            _id: 'default',
            pricing: [
                { duration: 30, basePrice: 500, label: '30 Minutes' },
                { duration: 60, basePrice: 900, label: '60 Minutes' }
            ],
            urgencyMultipliers: [
                { urgency: 'normal', multiplier: 1, label: 'Normal (Within 24h)' },
                { urgency: 'priority', multiplier: 1.5, label: 'Priority (Within 6h)' },
                { urgency: 'emergency', multiplier: 2.5, label: 'Emergency (Instant)' }
            ],
            slots: [],
            createdAt: new Date(),
            updatedAt: new Date()
        });
        console.log('- ✅ Created default Consultation Settings.');
    }

    console.log('\nChecking for System Settings...');
    const systemSettingsCol = db.collection('system-settings');
    const systemSettings = await systemSettingsCol.findOne({ _id: 'default' });
    if (systemSettings) {
        console.log('- System settings already exist.');
    } else {
        await systemSettingsCol.insertOne({
            _id: 'default',
            upiIds: [
                { id: 'upi-1', label: 'Primary UPI', value: 'example@upi', isDefault: true }
            ],
            bankDetails: 'Bank: Example Bank\nAcc: 123456789\nIFSC: EXAMP0001',
            paymentInstructions: 'Please send the screenshot of your payment to our WhatsApp or Email.',
            emailNotifications: {
                orderConfirmations: true,
                paymentVerification: true,
                consultationReminders: true
            },
            storeStatus: {
                maintenanceMode: false,
                acceptingConsultations: true
            },
            modules: {
                showCourses: true,
                showProducts: true,
                showConsultations: true
            },
            shippingSettings: {
                rules: [
                    { id: 'rule-1', minQuantity: 1, maxQuantity: 5, charge: 150 },
                    { id: 'rule-2', minQuantity: 6, maxQuantity: 10, charge: 250 }
                ],
                disclaimer: 'Live arrival guaranteed only if unboxing video is provided.'
            },
            createdAt: new Date(),
            updatedAt: new Date()
        });
        console.log('- ✅ Created default System Settings.');
    }

    console.log('\n✅ Database initialization complete.');
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    process.exit(1);
  }
}

initDb();
