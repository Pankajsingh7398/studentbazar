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
    specifications = {}
  } = req.body;

  if (!name || !price || !SKU || !categorySlug) {
    throw new ApiError(400, 'Name, price, SKU, and category are required.');
  }

  const category = await Category.findOne({ slug: categorySlug.toLowerCase() });
  if (!category) {
    throw new ApiError(400, 'Invalid category selected.');
  }

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const product = new Product({
    name,
    slug,
    description: description || name,
    shortDescription,
    price: Number(price),
    compareAtPrice: compareAtPrice ? Number(compareAtPrice) : undefined,
    SKU: SKU.toUpperCase().trim(),
    category: category._id,
    categorySlug: category.slug,
    mockupStyle: mockupStyle || 'bg-primary-container text-on-primary',
    badge,
    badgeColor,
    stock: Number(stock),
    featured: Boolean(featured),
    tags: Array.isArray(tags) ? tags : [tags],
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
