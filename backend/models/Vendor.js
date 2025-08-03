const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({
  vendorNumber: {
    type: String,
    unique: true,
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  companyName: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: true
  },
  alternatePhone: String,
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: {
      type: String,
      default: 'USA'
    }
  },
  taxId: String,
  businessLicense: String,
  category: {
    type: String,
    enum: ['electronics', 'clothing', 'food', 'books', 'home', 'sports', 'automotive', 'medical', 'other'],
    required: true
  },
  paymentTerms: {
    type: String,
    enum: ['net-15', 'net-30', 'net-45', 'net-60', 'cod', 'prepaid'],
    default: 'net-30'
  },
  creditLimit: {
    type: Number,
    default: 0,
    min: 0
  },
  currentBalance: {
    type: Number,
    default: 0
  },
  totalPurchased: {
    type: Number,
    default: 0,
    min: 0
  },
  totalPaid: {
    type: Number,
    default: 0,
    min: 0
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'blacklisted'],
    default: 'active'
  },
  bankDetails: {
    accountName: String,
    accountNumber: String,
    bankName: String,
    routingNumber: String,
    swiftCode: String
  },
  contactPerson: {
    name: String,
    position: String,
    email: String,
    phone: String
  },
  products: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  contracts: [{
    title: String,
    startDate: Date,
    endDate: Date,
    terms: String,
    document: String,
    status: {
      type: String,
      enum: ['active', 'expired', 'terminated'],
      default: 'active'
    }
  }],
  notes: String,
  tags: [String],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Generate vendor number
vendorSchema.pre('save', async function(next) {
  if (!this.vendorNumber) {
    const count = await mongoose.model('Vendor').countDocuments();
    this.vendorNumber = `VN${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Vendor', vendorSchema);