#!/bin/bash

# Setup script for connecting ModernPOS project to GitHub
echo "🚀 Setting up Git repository for ModernPOS..."

# Navigate to project root
cd "$(dirname "$0")"

# Initialize git repository
echo "📝 Initializing Git repository..."
git init

# Set default branch to main
git branch -M main

# Add all files
echo "📁 Adding all project files..."
git add .

# Create initial commit
echo "💾 Creating initial commit..."
git commit -m "🎉 Initial commit: ModernPOS - AI-Powered Point of Sale System

✨ Features implemented:
- Complete MERN stack architecture
- Modern React frontend with Material-UI
- RESTful API with Express.js and MongoDB
- JWT authentication and role-based access control
- Comprehensive POS terminal interface
- Product and inventory management
- Customer relationship management
- Sales transaction processing
- User management with permissions
- Advanced analytics and reporting
- Modern UI/UX with animations and responsive design

🛠️ Tech Stack:
- Frontend: React 18, Material-UI, Recharts
- Backend: Node.js, Express.js, MongoDB, Mongoose
- Authentication: JWT, Bcrypt
- Development: ESLint, Jest, Hot Reloading

🤖 Built with Claude AI assistance
© 2024 ModernPOS. All rights reserved."

echo "✅ Git repository initialized successfully!"
echo ""
echo "🔗 To connect to GitHub, run these commands:"
echo "   git remote add origin https://github.com/YOUR_USERNAME/POS-Claude.git"
echo "   git push -u origin main"
echo ""
echo "📋 Next steps:"
echo "   1. Create a new repository named 'POS-Claude' on GitHub"
echo "   2. Copy the repository URL"
echo "   3. Run the git remote add command above with your URL"
echo "   4. Push to GitHub with: git push -u origin main"
echo ""
echo "🎊 Your ModernPOS project is ready for GitHub!"