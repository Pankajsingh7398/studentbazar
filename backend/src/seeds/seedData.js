import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Category } from '../models/Category.js';
import { Product } from '../models/Product.js';
import { Coupon } from '../models/Coupon.js';

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/studentbazaar';

const seedCategories = [
  { name: 'Notebooks', slug: 'notebooks', icon: 'menu_book', description: 'Archival 100 GSM journals, registers, and study draft pads.' },
  { name: 'Pens & Inks', slug: 'pens', icon: 'edit', description: 'Fine liners, archival ink pens, fountain pens, and pastel highlighters.' },
  { name: 'Bags & Totes', slug: 'bags', icon: 'backpack', description: 'Ergonomic waxed canvas backpacks, laptop sleeves, and campus totes.' },
  { name: 'Stationery', slug: 'stationery', icon: 'straighten', description: 'Exam essentials, revision index cards, geometry sets, and drafting kits.' },
  { name: 'Calculators', slug: 'calculators', icon: 'calculate', description: 'Scientific, graphing, and standard engineering calculation devices.' },
  { name: 'Bottles', slug: 'bottles', icon: 'water_bottle', description: 'Insulated thermal water flasks for library and long lecture halls.' },
  { name: 'Essentials', slug: 'essentials', icon: 'grid_view', description: 'Sticky notes, desk organizers, document wallets, and binder clips.' }
];

const seedProducts = [
  {
    name: 'Motivational Notebook',
    slug: 'motivational-notebook',
    SKU: 'SB-NB-001',
    description: 'Archival 100 GSM hardbound notebook designed for intense exam preparation, project notes, and daily scholarship. Features non-bleed ivory pages tested with fountain pens.',
    shortDescription: 'Hardbound • 100 GSM • Single Ruled',
    price: 70,
    compareAtPrice: 100,
    categorySlug: 'notebooks',
    badge: 'Bestseller',
    badgeColor: 'bg-emerald-900 text-emerald-100',
    mockupStyle: 'bg-[#1C3627] text-amber-200',
    coverSnippet: 'Believe in Yourself',
    stock: 250,
    featured: true,
    tags: ['bestseller', 'ruled', 'hardbound', '100gsm', 'notebook'],
    specifications: {
      'Paper Weight': '100 GSM Archival Ivory',
      'Binding': 'Hardbound Case',
      'Pages': '192 Pages',
      'Ruling': 'Single Ruled 8mm',
      'Spine': 'Lay-Flat Thread Bound'
    }
  },
  {
    name: 'Classmate Style Notebook',
    slug: 'classmate-style-notebook',
    SKU: 'SB-NB-002',
    description: 'Lightweight softbound student edition notebook with unruled plain pages. Ideal for mind maps, rapid lecture note-taking, and diagrams.',
    shortDescription: 'Standard A4 • 90 GSM • Unruled Plain',
    price: 65,
    compareAtPrice: 85,
    categorySlug: 'notebooks',
    badge: 'Popular',
    badgeColor: 'bg-secondary-container text-on-secondary-container',
    mockupStyle: 'bg-[#4A6B82] text-white',
    coverSnippet: 'Good Things Take Time',
    stock: 180,
    featured: true,
    tags: ['popular', 'plain', 'unruled', '90gsm', 'a4'],
    specifications: {
      'Paper Weight': '90 GSM Smooth White',
      'Binding': 'Flexible Softbound',
      'Pages': '172 Pages',
      'Ruling': 'Unruled Plain',
      'Dimensions': 'Standard A4 (210 x 297 mm)'
    }
  },
  {
    name: 'Kraft Notebook',
    slug: 'kraft-notebook',
    SKU: 'SB-NB-003',
    description: 'Eco-conscious notebook crafted with 100% post-consumer recycled fiber and warm kraft covers. Subtly printed with dot grids for creative planning.',
    shortDescription: 'Recycled Bond • 90 GSM • Dot Grid',
    price: 60,
    compareAtPrice: 90,
    categorySlug: 'notebooks',
    badge: 'Eco-Friendly',
    badgeColor: 'bg-[#52634f] text-[#f2f7f0]',
    mockupStyle: 'bg-[#C9A979] text-[#2d1c0a]',
    coverSnippet: 'Small Steps Big Dreams',
    stock: 140,
    featured: true,
    tags: ['eco-friendly', 'dotgrid', 'kraft', 'recycled'],
    specifications: {
      'Paper Weight': '90 GSM Recycled Kraft Bond',
      'Binding': 'Thread Sewn Spine',
      'Pages': '160 Pages',
      'Ruling': '5mm Subtle Dot Grid',
      'Eco Certification': 'FSC Certified Recycled'
    }
  },
  {
    name: 'Spiral Notebook (A5)',
    slug: 'spiral-notebook-a5',
    SKU: 'SB-NB-004',
    description: 'Heavyweight matte black wirebound journal with dual micro-perforated squared grid sheets. Designed for architects, lab notes, and analytical students.',
    shortDescription: 'Wirebound • 100 GSM • Squared Grid',
    price: 80,
    compareAtPrice: 110,
    categorySlug: 'notebooks',
    badge: 'Pro Choice',
    badgeColor: 'bg-stone-800 text-stone-100',
    mockupStyle: 'bg-[#242424] text-stone-100',
    coverSnippet: 'NOTES Series 04',
    stock: 120,
    featured: true,
    tags: ['pro choice', 'spiral', 'wirebound', 'a5', 'grid'],
    specifications: {
      'Paper Weight': '100 GSM Heavy Ivory',
      'Binding': 'Double-Loop Metal Spiral',
      'Pages': '160 Pages (Micro-Perforated)',
      'Ruling': '5mm Squared Grid',
      'Dimensions': 'ISO A5 (148 x 210 mm)'
    }
  },
  {
    name: 'Premium Notebook',
    slug: 'premium-notebook',
    SKU: 'SB-NB-005',
    description: 'Luxury academic journal featuring gold foil accents, ribbon bookmark, expandable inner back-pocket, and 120 GSM ink-resistant heavyweight leaves.',
    shortDescription: 'Hardbound Foil • 120 GSM • Lined • Ribbon',
    price: 90,
    compareAtPrice: 120,
    categorySlug: 'notebooks',
    badge: 'Trending',
    badgeColor: 'bg-rose-800 text-rose-50',
    mockupStyle: 'bg-rose-100 text-primary',
    coverSnippet: 'MAKE IT HAPPEN',
    stock: 95,
    featured: true,
    tags: ['trending', 'foil', 'premium', 'ribbon', '120gsm'],
    specifications: {
      'Paper Weight': '120 GSM Ultra-Heavyweight',
      'Binding': 'Hardbound Linen Touch',
      'Pages': '200 Pages',
      'Ruling': 'Single Ruled with Date Header',
      'Extras': 'Satin Ribbon Bookmark + Back Envelope'
    }
  },
  {
    name: 'Engineering Grid Notebook',
    slug: 'engineering-grid-notebook',
    SKU: 'SB-NB-006',
    description: 'Precision drafting notebook engineered with true isometric and Cartesian blueprints. Standard ISO 216 layout tested for fountain and technical pens.',
    shortDescription: 'Flat-Lay Hardcover • 110 GSM • Isometric Grid',
    price: 85,
    compareAtPrice: 115,
    categorySlug: 'notebooks',
    badge: 'Academic',
    badgeColor: 'bg-secondary text-on-secondary',
    mockupStyle: 'bg-[#EFECE6] text-primary',
    coverSnippet: 'DRAFT & DESIGN',
    stock: 110,
    featured: true,
    tags: ['academic', 'engineering', 'isometric', 'drafting', 'blueprint'],
    specifications: {
      'Paper Weight': '110 GSM Technical Bond',
      'Binding': '180° Lay-Flat Hardcover',
      'Pages': '180 Pages',
      'Ruling': '5mm Isometric Grid Scale',
      'Standard': 'ISO 216 Technical Spec'
    }
  }
];

async function seedDatabase() {
  try {
    console.log('[Seed] Connecting to database...');
    await mongoose.connect(mongoUri);

    console.log('[Seed] Clearing existing demo data...');
    await Promise.all([
      Category.deleteMany({}),
      Product.deleteMany({}),
      Coupon.deleteMany({})
    ]);

    console.log('[Seed] Inserting categories...');
    const createdCategories = await Category.insertMany(seedCategories);
    const categoryMap = new Map();
    createdCategories.forEach(cat => categoryMap.set(cat.slug, cat._id));

    console.log('[Seed] Inserting archival products...');
    const productsWithCategoryIds = seedProducts.map(p => ({
      ...p,
      category: categoryMap.get(p.categorySlug)
    }));
    await Product.insertMany(productsWithCategoryIds);

    console.log('[Seed] Creating demo promotional coupons...');
    await Coupon.create({
      code: 'EXAM25',
      discountType: 'flat',
      discountValue: 25,
      minimumOrderValue: 100,
      validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      isActive: true
    });

    console.log('[Seed] Checking / creating admin & demo user accounts...');
    const adminEmail = 'admin@studentbazaar.in';
    const scholarEmail = 'scholar@studentbazaar.in';

    const existingAdmin = await User.findOne({ email: adminEmail });
    if (!existingAdmin) {
      const admin = new User({
        name: 'Campus Store Admin',
        email: adminEmail,
        passwordHash: 'AdminPass123!',
        phone: '9876543210',
        role: 'admin',
        emailVerified: true
      });
      await admin.save();
      console.log(`[Seed] Admin user created: ${adminEmail} (Password: AdminPass123!)`);
    }

    const existingScholar = await User.findOne({ email: scholarEmail });
    if (!existingScholar) {
      const scholar = new User({
        name: 'Arjun Scholar',
        email: scholarEmail,
        passwordHash: 'ScholarPass123!',
        phone: '9876543211',
        role: 'customer',
        emailVerified: true,
        addresses: [{
          fullName: 'Arjun Scholar',
          phone: '9876543211',
          hostelOrBuilding: 'Hostel 4, Room 218',
          campusName: 'North Campus University',
          city: 'New Delhi',
          state: 'Delhi',
          pinCode: '110007',
          isDefault: true
        }]
      });
      await scholar.save();
      console.log(`[Seed] Demo customer created: ${scholarEmail} (Password: ScholarPass123!)`);
    }

    console.log('[Seed] Database successfully seeded with categories, archival notebooks, coupons, and accounts!');
    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]:', error);
    process.exit(1);
  }
}

seedDatabase();
