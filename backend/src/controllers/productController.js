import mongoose from 'mongoose';
import { Product } from '../models/Product.js';
import { Category } from '../models/Category.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getAllProducts = asyncHandler(async (req, res) => {
  const {
    q,
    category,
    sort = 'newest',
    minPrice,
    maxPrice,
    page = 1,
    limit = 12
  } = req.query;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 12));
  const skip = (pageNum - 1) * limitNum;

  const filter = { isActive: true };

  // Category filter
  if (category && category !== 'all') {
    filter.categorySlug = category.toLowerCase().trim();
  }

  // Price range filter
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  // Search filter
  if (q && q.trim()) {
    const searchRegex = new RegExp(q.trim(), 'i');
    filter.$or = [
      { name: searchRegex },
      { description: searchRegex },
      { tags: searchRegex },
      { shortDescription: searchRegex }
    ];
  }

  // Sorting
  const sortMap = {
    newest: { createdAt: -1 },
    price_asc: { price: 1 },
    price_desc: { price: -1 },
    popular: { stock: -1 }
  };
  const sortOption = sortMap[sort] || { createdAt: -1 };

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate('category', 'name slug icon')
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum),
    Product.countDocuments(filter)
  ]);

  return res.status(200).json(
    new ApiResponse(200, 'Products retrieved successfully.', {
      products,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    })
  );
});

export const getFeaturedProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ isActive: true, featured: true })
    .populate('category', 'name slug icon')
    .sort({ createdAt: -1 })
    .limit(8);

  return res
    .status(200)
    .json(new ApiResponse(200, 'Featured products fetched.', { products }));
});

export const getProductBySlugOrId = asyncHandler(async (req, res) => {
  const { identifier } = req.params;

  let query = { slug: identifier.toLowerCase() };
  if (mongoose.Types.ObjectId.isValid(identifier)) {
    query = { _id: identifier };
  }

  const product = await Product.findOne(query).populate('category', 'name slug icon');
  if (!product || !product.isActive) {
    throw new ApiError(404, 'Product not found.');
  }

  return res
    .status(200)
    .json(new ApiResponse(200, 'Product details fetched.', { product }));
});

export const createProduct = asyncHandler(async (req, res) => {
  const {
    name,
    description,
    shortDescription,
    price,
    compareAtPrice,
    SKU,
    categorySlug,
    mockupStyle,
    badge,
    badgeColor,
    stock = 100,
    featured = false,
    tags = [],
    specifications = {},
    coverSnippet
  } = req.body;

  if (!name || price === undefined || price === null || price === '') {
    throw new ApiError(400, 'Product name and price are required.');
  }

  // Resolve Category flexibly: by slug, name regex, category ID, or first available category
  let category = null;
  if (categorySlug) {
    category = await Category.findOne({ slug: categorySlug.toLowerCase().trim() });
    if (!category) {
      category = await Category.findOne({ name: new RegExp(`^${categorySlug.trim()}$`, 'i') });
    }
  }
  if (!category && req.body.category) {
    category = await Category.findById(req.body.category).catch(() => null);
  }
  if (!category) {
    category = await Category.findOne({ isActive: true }) || await Category.findOne();
  }
  if (!category) {
    category = await Category.create({
      name: 'Notebooks',
      slug: 'notebooks',
      icon: 'menu_book',
      description: 'Standard campus notebook edition'
    });
  }

  // Collision-free slug generation
  const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'product';
  let slug = baseSlug;
  let slugAttempts = 1;
  while (await Product.findOne({ slug })) {
    slug = `${baseSlug}-${Date.now().toString().slice(-4)}${slugAttempts > 1 ? `-${slugAttempts}` : ''}`;
    slugAttempts++;
  }

  // Auto-generate unique SKU if not provided
  let finalSKU = SKU && SKU.trim() ? SKU.toUpperCase().trim() : '';
  if (!finalSKU) {
    const catCode = (category.slug || 'NB').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3) || 'NB';
    finalSKU = `SB-${catCode}-${Math.floor(100 + Math.random() * 900)}`;
    while (await Product.findOne({ SKU: finalSKU })) {
      finalSKU = `SB-${catCode}-${Math.floor(1000 + Math.random() * 9000)}`;
    }
  }

  // Aesthetic palettes for notebooks
  const palettes = [
    'bg-[#1C3627] text-amber-200',
    'bg-[#4A6B82] text-white',
    'bg-[#8C4A32] text-amber-100',
    'bg-[#2A3439] text-emerald-300',
    'bg-[#3F3356] text-purple-200',
    'bg-[#7A3E48] text-rose-100'
  ];
  const finalMockupStyle = mockupStyle || palettes[Math.floor(Math.random() * palettes.length)];

  const product = new Product({
    name,
    slug,
    description: description || name,
    shortDescription: shortDescription || `${category.name} • ${stock} Units • Campus Edition`,
    price: Number(price),
    compareAtPrice: compareAtPrice ? Number(compareAtPrice) : undefined,
    SKU: finalSKU,
    category: category._id,
    categorySlug: category.slug,
    mockupStyle: finalMockupStyle,
    coverSnippet: coverSnippet || name,
    badge: badge || '',
    badgeColor: badgeColor || '',
    stock: Number(stock),
    featured: Boolean(featured),
    tags: Array.isArray(tags) ? tags : (tags ? [tags] : []),
    specifications
  });

  await product.save();

  return res
    .status(201)
    .json(new ApiResponse(201, 'Product created successfully.', { product }));
});

export const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const product = await Product.findById(id);
  if (!product) {
    throw new ApiError(404, 'Product not found.');
  }

  const allowedUpdates = [
    'name', 'description', 'shortDescription', 'price',
    'compareAtPrice', 'stock', 'isActive', 'featured',
    'badge', 'badgeColor', 'mockupStyle', 'tags', 'specifications'
  ];

  allowedUpdates.forEach(field => {
    if (req.body[field] !== undefined) {
      product[field] = req.body[field];
    }
  });

  if (req.body.categorySlug) {
    const category = await Category.findOne({ slug: req.body.categorySlug.toLowerCase() });
    if (category) {
      product.category = category._id;
      product.categorySlug = category.slug;
    }
  }

  await product.save();

  return res
    .status(200)
    .json(new ApiResponse(200, 'Product updated successfully.', { product }));
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const product = await Product.findByIdAndUpdate(id, { isActive: false }, { new: true });
  if (!product) {
    throw new ApiError(404, 'Product not found.');
  }

  return res
    .status(200)
    .json(new ApiResponse(200, 'Product deactivated successfully.'));
});
