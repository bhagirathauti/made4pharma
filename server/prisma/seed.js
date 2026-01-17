const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@made4pharma.com' },
    update: {},
    create: {
      email: 'admin@made4pharma.com',
      password: adminPassword,
      name: 'System Admin',
      role: 'ADMIN',
    },
  });
  console.log('✓ Admin user created:', admin.email);

  // Create a sample store
  const store = await prisma.store.upsert({
    where: { licenseNo: 'LIC-2026-001' },
    update: {},
    create: {
      name: 'HealthCare Pharmacy',
      address: '123 Main Street, Mumbai, Maharashtra 400001',
      phone: '+91 9876543210',
      email: 'info@healthcare.com',
      licenseNo: 'LIC-2026-001',
      gstNo: 'GST-2026-001',
    },
  });
  console.log('✓ Sample store created:', store.name);

  // Create medical owner
  const ownerPassword = await bcrypt.hash('owner123', 10);
  const owner = await prisma.user.upsert({
    where: { email: 'owner@healthcare.com' },
    update: {},
    create: {
      email: 'owner@healthcare.com',
      password: ownerPassword,
      name: 'Rajesh Kumar',
      role: 'MEDICAL_OWNER',
      storeId: store.id,
    },
  });
  console.log('✓ Medical owner created:', owner.email);

  // Create cashier
  const cashierPassword = await bcrypt.hash('cashier123', 10);
  const cashier = await prisma.user.upsert({
    where: { email: 'cashier@healthcare.com' },
    update: {},
    create: {
      email: 'cashier@healthcare.com',
      password: cashierPassword,
      name: 'Priya Sharma',
      role: 'CASHIER',
      storeId: store.id,
    },
  });
  console.log('✓ Cashier created:', cashier.email);

  // Create multiple dummy users (10-20 as requested) - here we create 15
  const dummyPassword = await bcrypt.hash('password123', 10);
  const dummyCount = 15;
  for (let i = 1; i <= dummyCount; i++) {
    const email = `user${i}@healthcare.com`;
    const name = `User ${i}`;
    try {
      const u = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
          email,
          password: dummyPassword,
          name,
          role: 'CASHIER',
          storeId: store.id,
        },
      });
      console.log(`  - Created dummy user: ${u.email}`);
    } catch (err) {
      console.error(`  - Failed creating dummy user ${email}:`, err.message || err);
    }
  }

  // Create sample products
  const products = [
    {
      name: 'Paracetamol 500mg',
      genericName: 'Acetaminophen',
      manufacturer: 'PharmaCorp',
      batchNo: 'BATCH001',
      expiryDate: new Date('2026-12-31'),
      quantity: 500,
      price: 2.5,
      mrp: 3.0,
      discount: 10,
      gstRate: 12,
      storeId: store.id,
    },
    {
      name: 'Amoxicillin 250mg',
      genericName: 'Amoxicillin',
      manufacturer: 'MediLife',
      batchNo: 'BATCH002',
      expiryDate: new Date('2026-10-15'),
      quantity: 300,
      price: 5.0,
      mrp: 6.0,
      discount: 5,
      gstRate: 12,
      storeId: store.id,
    },
    {
      name: 'Cetirizine 10mg',
      genericName: 'Cetirizine HCl',
      manufacturer: 'HealthGen',
      batchNo: 'BATCH003',
      expiryDate: new Date('2027-03-20'),
      quantity: 200,
      price: 1.5,
      mrp: 2.0,
      discount: 15,
      gstRate: 12,
      storeId: store.id,
    },
  ];

  for (const product of products) {
    await prisma.product.create({ data: product });
  }
  console.log('✓ Sample products created');

  console.log('\n=== Seed completed successfully! ===');
  console.log('\nTest credentials:');
  console.log('Admin: admin@made4pharma.com / admin123');
  console.log('Owner: owner@healthcare.com / owner123');
  console.log('Cashier: cashier@healthcare.com / cashier123');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
