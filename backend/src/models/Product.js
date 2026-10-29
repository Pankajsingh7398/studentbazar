import mongoose, { Schema } from 'mongoose';

const productSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  slug: {
    type: String,
    required: [true, 'Product slug is required'],
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  description: {
    type: String,
    required: [true, 'Product description is required']
  },
  shortDescription: {
    type: String,
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  compareAtPrice: {
    type: Number,
    min: [0, 'Compare-at price cannot be negative']
  },
  SKU: {
    type: String,
    required: [true, 'SKU is required'],
    unique: true,
    uppercase: true,
    trim: true
  },
  category: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category reference is required']
  },
  categorySlug: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true
  },
  images: {
    type: [String],
    default: []
  },
  mockupStyle: {
    type: String,
    default: '' // CSS classes used to render the realistic notebook cover
  },
  badge: {
    type: String,
    default: '' // Bestseller, Popular, Eco-Friendly, Pro Choice, etc.
  },
  badgeColor: {
    type: String,
    default: ''
  },
  coverSnippet: {
    type: String,
    default: '' // Text rendered on the notebook cover visualization
  },
  stock: {
    type: Number,
    required: [true, 'Stock count is required'],
    min: [0, 'Stock cannot be negative'],
    default: 100
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  featured: {
    type: Boolean,
    default: false,
    index: true
  },
  tags: {
    type: [String],
    default: [],
    index: true
  },
  specifications: {
    type: Map,
    of: String,
    default: {}
  }
}, { timestamps: true });

// Text search index
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ categorySlug: 1, isActive: 1, price: 1 });

export const Product = mongoose.model('Product', productSchema);
