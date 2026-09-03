import readline from 'readline';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectDB, isDBConnected } from './db.js';
import User from './models/User.js';
import Asset from './models/Asset.js';
import liveDataStore from './dataStore.js';

dotenv.config();

function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(query, (ans) => {
      rl.close();
      resolve(ans.trim());
    });
  });
}

async function seedAdmin() {
  console.log('\n🌱 ========================================');
  console.log('   GridPulse AI — Admin Seed Utility');
  console.log('========================================\n');

  const connected = await connectDB(1);

  let email = process.env.ADMIN_EMAIL || process.argv[2];
  let password = process.env.ADMIN_PASSWORD || process.argv[3];
  let name = process.env.ADMIN_NAME || 'System Administrator';

  if (!email || !password) {
    if (process.stdin.isTTY) {
      console.log('Please configure initial Admin credentials:');
      name = (await askQuestion('Enter Admin Name (default: System Administrator): ')) || 'System Administrator';
      email = await askQuestion('Enter Admin Email: ');
      password = await askQuestion('Enter Admin Password (min 8 characters): ');
    } else {
      email = 'admin@gridpulse.energy';
      password = 'AdminPassword123!';
      console.log(`[SEED] Using default credentials: ${email}`);
    }
  }

  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    console.error('❌ Invalid email format.');
    process.exit(1);
  }

  if (!password || password.length < 8) {
    console.error('❌ Password must be at least 8 characters long.');
    process.exit(1);
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);

    if (connected && isDBConnected()) {
      const existing = await User.findOne({ email });
      if (existing) {
        existing.name = name;
        existing.passwordHash = passwordHash;
        existing.role = 'admin';
        existing.status = 'active';
        await existing.save();
        console.log(`\n✅ Existing user ${email} updated to ADMIN in MongoDB.`);
      } else {
        await User.create({
          name,
          email,
          passwordHash,
          role: 'admin',
          status: 'active',
        });
        console.log(`\n✅ Created initial ADMIN user in MongoDB: ${email}`);
      }

      // Prompt 15 explicit rule: "leaves Asset collection empty (assets get added through the UI in Prompt 20)"
      const assetCount = await Asset.countDocuments();
      console.log(`ℹ️ [Asset Collection] Current asset count: ${assetCount} (empty state maintained for onboarding).`);
    } else {
      // In-Memory store seeding
      const existing = liveDataStore.users.find((u) => u.email === email);
      if (existing) {
        existing.name = name;
        existing.passwordHash = passwordHash;
        existing.role = 'admin';
        existing.status = 'active';
      } else {
        liveDataStore.users.push({
          _id: 'usr-' + Date.now(),
          name,
          email,
          passwordHash,
          role: 'admin',
          status: 'active',
          createdAt: new Date(),
          lastLogin: null,
        });
      }
      console.log(`\n✅ Seeded initial ADMIN user in Resilient In-Memory Store: ${email}`);
      console.log(`ℹ️ [Asset Collection] In-memory assets: ${liveDataStore.assets.length} (empty state maintained for onboarding).`);
      console.log('   (Note: To persist to MongoDB, start the MongoDB service with: net start MongoDB)');
    }

    console.log('\n========================================');
    console.log('🎉 Seed complete! You can now log in as Admin.');
    console.log(`   Email:    ${email}`);
    console.log(`   Password: ${password}`);
    console.log('========================================\n');
  } catch (err) {
    console.error('❌ Error during admin seed:', err.message);
  } finally {
    if (connected && isDBConnected()) {
      await mongoose.disconnect();
    }
    process.exit(0);
  }
}

seedAdmin();
