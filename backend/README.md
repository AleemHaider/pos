# POS System Backend API

A comprehensive Point of Sale (POS) system backend built with Node.js, Express, and MongoDB.

## Features

### Core Functionality
- **User Management**: Role-based authentication (Admin, Manager, Cashier)
- **Product Management**: Complete CRUD operations with inventory tracking
- **Category Management**: Organize products by categories
- **Customer Management**: Customer profiles with loyalty points
- **Sales Processing**: Complete transaction handling with receipt generation
- **Inventory Management**: Stock tracking with low-stock alerts
- **Dashboard Analytics**: Real-time sales and inventory statistics
- **Reporting**: Comprehensive sales and inventory reports

### Key Features
- JWT-based authentication and authorization
- Real-time inventory updates during sales
- Automatic loyalty points calculation
- Receipt generation with detailed transaction info
- Low stock alerts and inventory management
- Sales void functionality with stock restoration
- Advanced search and filtering
- Comprehensive analytics and reporting

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **Validation**: express-validator
- **Environment Variables**: dotenv
- **CORS**: Cross-origin resource sharing support

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables in `.env`:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/pos_system
   JWT_SECRET=your_jwt_secret_key_here_change_in_production
   JWT_EXPIRE=7d
   NODE_ENV=development
   ```

4. Start MongoDB service on your machine

5. Run the application:
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/change-password` - Change password

### User Management
- `GET /api/users` - Get all users (Admin/Manager only)
- `POST /api/users` - Create new user (Admin/Manager only)
- `PUT /api/users/:id` - Update user (Admin/Manager only)
- `DELETE /api/users/:id` - Delete user (Admin only)

### Categories
- `GET /api/categories` - Get all categories
- `GET /api/categories/:id` - Get category by ID
- `POST /api/categories` - Create category (Admin/Manager only)
- `PUT /api/categories/:id` - Update category (Admin/Manager only)
- `DELETE /api/categories/:id` - Delete category (Admin/Manager only)

### Products
- `GET /api/products` - Get all products with filtering
- `GET /api/products/low-stock` - Get low stock products
- `GET /api/products/search/:query` - Search products
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create product (Admin/Manager only)
- `PUT /api/products/:id` - Update product (Admin/Manager only)
- `PATCH /api/products/:id/stock` - Update product stock (Admin/Manager only)
- `DELETE /api/products/:id` - Delete product (Admin/Manager only)

### Customers
- `GET /api/customers` - Get all customers
- `GET /api/customers/search/:query` - Search customers
- `GET /api/customers/top-customers` - Get top customers
- `GET /api/customers/:id` - Get customer by ID
- `GET /api/customers/:id/sales` - Get customer sales history
- `POST /api/customers` - Create customer
- `PUT /api/customers/:id` - Update customer
- `PATCH /api/customers/:id/loyalty` - Update loyalty points (Admin/Manager only)
- `DELETE /api/customers/:id` - Delete customer (Admin/Manager only)

### Sales
- `GET /api/sales` - Get all sales with filtering
- `GET /api/sales/today` - Get today's sales
- `GET /api/sales/:id` - Get sale by ID
- `GET /api/sales/receipt/:id` - Get receipt data
- `POST /api/sales` - Process new sale
- `PUT /api/sales/:id/void` - Void sale (Admin/Manager only)

### Dashboard & Analytics
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/sales-chart` - Get sales chart data
- `GET /api/dashboard/top-products` - Get top-selling products
- `GET /api/dashboard/recent-sales` - Get recent sales
- `GET /api/dashboard/payment-methods` - Get payment method statistics
- `GET /api/dashboard/reports/inventory` - Get inventory reports (Admin/Manager only)
- `GET /api/dashboard/reports/sales` - Get sales reports (Admin/Manager only)

## Database Schema

### User Model
- Authentication and role-based access control
- Roles: admin, manager, cashier
- Password hashing with bcrypt

### Product Model
- Complete product information with SKU and barcode
- Stock management with min/max thresholds
- Category association and pricing

### Category Model
- Product categorization
- Active/inactive status

### Customer Model
- Customer profiles with contact information
- Loyalty points system
- Purchase history tracking

### Sale Model
- Complete transaction records
- Item details with pricing
- Payment information and receipt generation
- Void functionality

## Security Features

- JWT-based authentication
- Role-based authorization
- Password hashing
- Input validation and sanitization
- CORS protection

## Business Logic

### Inventory Management
- Automatic stock updates during sales
- Low stock alerts
- Stock adjustment tracking

### Loyalty System
- Automatic points calculation (1 point per $10 spent)
- Points redemption during checkout
- Customer lifetime value tracking

### Sales Processing
- Real-time inventory validation
- Automatic receipt generation
- Transaction history maintenance
- Void/refund capability with stock restoration

## Development

The system is designed with scalability and maintainability in mind:
- Modular route structure
- Comprehensive error handling
- Data validation at multiple levels
- Clean separation of concerns

## License

ISC License