# ModernPOS - AI-Powered Point of Sale System 🛒

<div align="center">
  <img src="https://img.shields.io/badge/Built%20with-MERN%20Stack-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="MERN Stack">
  <img src="https://img.shields.io/badge/AI%20Powered-Claude-FF6B6B?style=for-the-badge&logo=anthropic&logoColor=white" alt="AI Powered">
  <img src="https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge" alt="License">
</div>

<div align="center">
  <h3>A comprehensive, modern Point of Sale (POS) system built with the MERN stack and enhanced with AI assistance from Claude.</h3>
  <p>Complete business management solution featuring inventory management, sales processing, customer management, user administration, and advanced analytics.</p>
</div>

## 🌟 Features

### 🛍️ **Point of Sale Terminal**
- **Modern Interface**: Intuitive touch-friendly design optimized for retail environments
- **Product Management**: Visual product catalog with search and category filtering
- **Smart Cart**: Real-time cart management with quantity controls
- **Multiple Payment Methods**: Cash, card, and mobile payment support
- **Receipt Generation**: Automated receipt printing and email functionality
- **Barcode Support**: Ready for barcode scanner integration

### 📊 **Comprehensive Dashboard**
- **Real-time Analytics**: Live sales metrics and performance indicators
- **Interactive Charts**: Beautiful data visualizations using Recharts
- **Sales Trends**: Historical data analysis and trending insights
- **Inventory Alerts**: Low stock notifications and inventory tracking
- **Quick Actions**: Fast access to common operations

### 🏪 **Inventory Management**
- **Product Catalog**: Complete product database with categories
- **Stock Management**: Real-time inventory tracking and alerts
- **Pricing Control**: Dynamic pricing with cost tracking
- **Category Organization**: Hierarchical product categorization
- **Bulk Operations**: Import/export functionality for large inventories

### 👥 **Customer Management**
- **Customer Database**: Comprehensive customer profiles
- **Purchase History**: Complete transaction tracking per customer
- **Loyalty Programs**: Customer tier system based on spending
- **Contact Management**: Email, phone, and address management
- **Analytics**: Customer behavior and preference analysis

### 📈 **Sales Management**
- **Transaction History**: Complete sales record with search and filtering
- **Receipt Management**: View, reprint, and email receipts
- **Refund Processing**: Secure refund workflow with audit trails
- **Sales Analytics**: Detailed sales performance metrics
- **Report Generation**: Comprehensive sales reports and exports

### 👤 **User Management**
- **Role-Based Access**: Admin, Manager, and Cashier roles
- **Permission System**: Granular permission controls
- **User Profiles**: Complete staff management system
- **Authentication**: Secure JWT-based authentication
- **Activity Logging**: User action audit trails

### ⚙️ **Settings & Configuration**
- **System Settings**: Complete POS system configuration
- **Theme Customization**: Modern UI theme options
- **Hardware Integration**: POS hardware configuration
- **Backup & Restore**: Data backup and recovery systems
- **Security Settings**: Advanced security configurations

## 🚀 Tech Stack

### **Frontend**
- **React 18**: Modern React with hooks and functional components
- **Material-UI (MUI)**: Professional component library with custom theming
- **React Hot Toast**: Beautiful notification system
- **Recharts**: Interactive charts and data visualization
- **Axios**: HTTP client for API communications

### **Backend**
- **Node.js**: JavaScript runtime environment
- **Express.js**: Fast, minimalist web framework
- **MongoDB**: NoSQL database for flexible data storage
- **Mongoose**: Elegant MongoDB object modeling
- **JWT**: Secure authentication and authorization
- **Bcrypt**: Password hashing and security

### **Development Tools**
- **ESLint**: Code linting and quality assurance
- **Prettier**: Code formatting and style consistency
- **Jest**: Testing framework for robust applications
- **Nodemon**: Development server with hot reloading

## 🏗️ Project Structure

```
mern-app/
├── backend/                 # Node.js/Express API server
│   ├── config/             # Database and environment configuration-
│   ├── middleware/         # Authentication and custom middleware
│   ├── models/            # MongoDB/Mongoose data models
│   ├── routes/            # API route definitions
│   ├── utils/             # Utility functions and helpers
│   ├── server.js          # Main server entry point
│   └── package.json       # Backend dependencies
│
├── frontend/               # React client application
│   ├── public/            # Static assets and HTML template
│   ├── src/
│   │   ├── components/    # Reusable React components
│   │   ├── services/      # API service layer
│   │   ├── __tests__/     # Component and integration tests
│   │   ├── App.js         # Main React application component
│   │   └── index.js       # React application entry point
│   └── package.json       # Frontend dependencies
│
└── README.md              # Project documentation
```

## 🚀 Quick Start

### **Prerequisites**
- Node.js (version 16 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn package manager

### **Installation**

1. **Clone the repository**
   ```bash
   git clone git@github.com:AleemHaider/pos.git
   cd POS-Claude
   ```

2. **Install Backend Dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install Frontend Dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Environment Configuration**
   
   Create a `.env` file in the backend directory:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/modernpos
   JWT_SECRET=your-super-secret-jwt-key-here
   JWT_EXPIRES_IN=7d
   ```

5. **Start MongoDB**
   ```bash
   # If using local MongoDB
   mongod
   
   # Or using Docker
   docker run -d -p 27017:27017 --name mongodb-pos mongo:latest
   ```

6. **Start the Development Servers**
   
   **Backend Server:**
   ```bash
   cd backend
   npm run dev
   ```
   
   **Frontend Server:**
   ```bash
   cd frontend
   npm start
   ```

7. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - API Documentation: http://localhost:5000/api/docs (if implemented)

## 👤 Demo Accounts

The system comes with pre-configured demo accounts for testing:

| Role | Email | Password | Access Level |
|------|--------|----------|-------------|
| **Admin** | admin@pos.com | 123456 | Full system access |
| **Manager** | manager@pos.com | 123456 | Sales and inventory management |
| **Cashier** | cashier@pos.com | 123456 | POS terminal and basic operations |

## 🛠️ Development

### **Available Scripts**

**Backend:**
- `npm run dev` - Start development server with hot reloading
- `npm start` - Start production server
- `npm test` - Run backend tests
- `npm run lint` - Run ESLint code analysis

**Frontend:**
- `npm start` - Start development server
- `npm run build` - Build production-ready application
- `npm test` - Run frontend tests
- `npm run eject` - Eject from Create React App (not recommended)

### **API Endpoints**

#### **Authentication**
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user profile

#### **Products**
- `GET /api/products` - Get all products
- `POST /api/products` - Create new product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

#### **Sales**
- `GET /api/sales` - Get all sales
- `POST /api/sales` - Create new sale
- `POST /api/sales/:id/refund` - Process refund

#### **Customers**
- `GET /api/customers` - Get all customers
- `POST /api/customers` - Create new customer
- `PUT /api/customers/:id` - Update customer

#### **Users** (Admin only)
- `GET /api/users` - Get all users
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

## 🧪 Testing

The project includes comprehensive testing suites:

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test ProductManagement.test.js
```

## 🚀 Deployment

### **Production Build**

1. **Build the frontend:**
   ```bash
   cd frontend
   npm run build
   ```

2. **Set production environment variables:**
   ```bash
   NODE_ENV=production
   MONGODB_URI=your-production-mongodb-uri
   JWT_SECRET=your-secure-production-secret
   ```

3. **Deploy using your preferred method:**
   - **Heroku**: Complete deployment guide available
   - **Digital Ocean**: Droplet deployment ready
   - **AWS**: EC2 and RDS compatible
   - **Vercel/Netlify**: Frontend deployment supported

## 🎨 Customization

### **Theming**
The application uses Material-UI's theming system. Customize colors, typography, and components in `frontend/src/App.js`:

```javascript
const theme = createTheme({
  palette: {
    primary: {
      main: '#6366f1', // Customize primary color
    },
    // Add your custom theme here
  },
});
```

### **Branding**
- Update logos in `frontend/public/`
- Modify company information in settings
- Customize receipt templates
- Update color schemes and branding elements

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'Add amazing feature'`
4. **Push to the branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### **Development Guidelines**
- Follow the existing code style
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Claude AI** - AI assistance in development and architecture
- **Material-UI Team** - Beautiful React components
- **MongoDB Team** - Flexible database solution
- **React Team** - Amazing frontend framework
- **Node.js Community** - Robust backend ecosystem

## 🆘 Support

If you encounter any issues or have questions:

1. **Check the documentation** above
2. **Search existing issues** on GitHub
3. **Create a new issue** with detailed information
4. **Join our community** discussions

## 🔮 Roadmap

### **Upcoming Features**
- [ ] **Mobile App**: React Native mobile application
- [ ] **Multi-location**: Support for multiple store locations
- [ ] **Advanced Analytics**: AI-powered sales predictions
- [ ] **Integration APIs**: Third-party service integrations
- [ ] **Offline Mode**: PWA capabilities for offline operation
- [ ] **Voice Commands**: Voice-activated POS operations
- [ ] **Inventory Forecasting**: AI-based stock predictions
- [ ] **Customer App**: Customer-facing mobile application

---

<div align="center">
  <p><strong>Built By Devspots.us</strong></p>
  <p>© 2025 ModernPOS. All rights reserved By Syed Aleem.</p>
</div># pos
