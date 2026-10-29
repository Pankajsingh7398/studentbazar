import { Category } from '../models/Category.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({ isActive: true }).sort({ createdAt: 1 });
  return res
    .status(200)
    .json(new ApiResponse(200, 'Categories retrieved successfully.', { categories }));
});

export const createCategory = asyncHandler(async (req, res) => {
  const { name, slug, description, icon } = req.body;
  if (!name || !slug) {
    throw new ApiError(400, 'Category name and slug are required.');
  }

  const existing = await Category.findOne({ slug: slug.toLowerCase() });
  if (existing) {
    throw new ApiError(400, 'Category with this slug already exists.');
  }

  const category = await Category.create({
    name,
    slug: slug.toLowerCase(),
    description,
    icon: icon || 'menu_book'
  });

  return res
    .status(201)
    .json(new ApiResponse(201, 'Category created successfully.', { category }));
});
