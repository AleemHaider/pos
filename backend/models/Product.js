const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  sku: {
    type: String,
    required: [true, 'SKU is required'],
    trim: true
  },
  barcode: {
    type: String,
    sparse: true,
    trim: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: 0
  },
  costPrice: {
    type: Number,
    required: [true, 'Cost price is required'],
    min: 0
  },
  stock: {
    type: Number,
    required: [true, 'Stock quantity is required'],
    min: 0,
    default: 0
  },
  minStock: {
    type: Number,
    default: 5
  },
  maxStock: {
    type: Number,
    default: 1000
  },
  unit: {
    type: String,
    default: 'piece',
    trim: true
  },
  images: [{
    type: String
  }],
  tags: [{
    type: String,
    trim: true
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  weight: {
    type: Number,
    min: 0
  },
  dimensions: {
    length: Number,
    width: Number,
    height: Number
  },
  supplier: {
    name: String,
    contact: String,
    email: String
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

productSchema.index({ tenant: 1, name: 'text', description: 'text', sku: 'text' });
productSchema.index({ tenant: 1, sku: 1 }, { unique: true });
productSchema.index({ tenant: 1, barcode: 1 }, { unique: true, sparse: true });

productSchema.virtual('profit').get(function() {
  return this.price - this.costPrice;
});

productSchema.virtual('profitMargin').get(function() {
  return ((this.price - this.costPrice) / this.price * 100).toFixed(2);
});

module.exports = mongoose.model('Product', productSchema);