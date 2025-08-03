const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6
  },
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant'
  },
  tenants: [{
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant'
    },
    role: {
      type: String,
      enum: ['owner', 'admin', 'manager', 'cashier'],
      default: 'cashier'
    },
    permissions: [{
      type: String
    }],
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  role: {
    type: String,
    enum: ['superadmin', 'owner', 'admin', 'cashier', 'manager'],
    default: 'cashier'
  },
  currentTenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  avatar: {
    type: String,
    default: ''
  },
  phone: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  passwordResetToken: String,
  passwordResetExpires: Date,
  lastLogin: Date,
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date
}, {
  timestamps: true
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Check if user has access to a specific tenant
userSchema.methods.hasTenantAccess = function(tenantId) {
  if (this.role === 'superadmin') return true;
  
  return this.tenants.some(t => 
    t.tenant.toString() === tenantId.toString()
  );
};

// Get user's role for a specific tenant
userSchema.methods.getTenantRole = function(tenantId) {
  if (this.role === 'superadmin') return 'superadmin';
  
  const tenantAccess = this.tenants.find(t => 
    t.tenant.toString() === tenantId.toString()
  );
  
  return tenantAccess ? tenantAccess.role : null;
};

// Add user to tenant
userSchema.methods.addToTenant = function(tenantId, role = 'cashier') {
  if (!this.hasTenantAccess(tenantId)) {
    this.tenants.push({
      tenant: tenantId,
      role: role,
      joinedAt: new Date()
    });
  }
};

// Indexes
userSchema.index({ email: 1, tenant: 1 });
userSchema.index({ 'tenants.tenant': 1 });

module.exports = mongoose.model('User', userSchema);