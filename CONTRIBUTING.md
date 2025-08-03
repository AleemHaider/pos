# Contributing to ModernPOS

Thank you for your interest in contributing to ModernPOS! We welcome contributions from the community and are excited to work with you.

## 🚀 Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/your-username/POS-Claude.git
   cd POS-Claude
   ```
3. **Set up the development environment** following the README instructions
4. **Create a new branch** for your feature:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## 🛠️ Development Guidelines

### **Code Style**
- Follow the existing code style and conventions
- Use meaningful variable and function names
- Add comments for complex logic
- Follow the established file and folder structure

### **Frontend (React)**
- Use functional components with hooks
- Follow Material-UI design patterns
- Ensure responsive design for all screen sizes
- Add proper error handling and loading states

### **Backend (Node.js)**
- Follow RESTful API conventions
- Add proper error handling and validation
- Use middleware for common functionality
- Document API endpoints with clear comments

### **Database (MongoDB)**
- Design efficient schemas
- Add proper indexes for performance
- Include data validation in models
- Follow consistent naming conventions

## 🧪 Testing

- Write tests for new features and bug fixes
- Ensure all existing tests pass
- Add integration tests for API endpoints
- Test UI components and user flows

```bash
# Run backend tests
cd backend && npm test

# Run frontend tests  
cd frontend && npm test
```

## 📝 Pull Request Process

1. **Update documentation** if your changes affect the API or user interface
2. **Add tests** for new functionality
3. **Ensure all tests pass** and the application builds successfully
4. **Update the README** if you're adding new features or changing setup
5. **Create a clear PR description** explaining your changes

### **PR Title Format**
- `feat: add new feature description`
- `fix: resolve issue description`
- `docs: update documentation`
- `test: add or update tests`
- `refactor: improve code structure`

### **PR Description Template**
```markdown
## Description
Brief description of the changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Code refactoring

## Testing
- [ ] Tests pass locally
- [ ] Added new tests for changes
- [ ] Manual testing completed

## Screenshots (if applicable)
Add screenshots of UI changes

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Tests added/updated
```

## 🐛 Bug Reports

When reporting bugs, please include:

1. **Clear description** of the issue
2. **Steps to reproduce** the problem
3. **Expected behavior** vs actual behavior
4. **Screenshots or error messages** if applicable
5. **Environment details** (OS, browser, Node.js version)

## 💡 Feature Requests

For new feature suggestions:

1. **Check existing issues** to avoid duplicates
2. **Describe the problem** the feature would solve
3. **Explain the proposed solution** in detail
4. **Consider alternative solutions** and their trade-offs
5. **Provide mockups or examples** if applicable

## 🏗️ Development Setup

### **Backend Setup**
```bash
cd backend
npm install
cp .env.example .env
# Configure your environment variables
npm run dev
```

### **Frontend Setup**
```bash
cd frontend
npm install
npm start
```

### **Database Setup**
```bash
# Using Docker
docker run -d -p 27017:27017 --name mongodb-pos mongo:latest

# Or install MongoDB locally
# Follow MongoDB installation guide for your OS
```

## 📋 Code Review Guidelines

### **For Reviewers**
- Be constructive and respectful in feedback
- Explain the reasoning behind suggestions
- Approve PRs that improve the codebase
- Request changes for issues that need fixing

### **For Contributors**
- Respond to feedback promptly and professionally
- Ask questions if feedback is unclear
- Make requested changes in a timely manner
- Thank reviewers for their time and input

## 🎯 Areas for Contribution

We especially welcome contributions in these areas:

### **High Priority**
- [ ] Mobile responsiveness improvements
- [ ] Accessibility (a11y) enhancements
- [ ] Performance optimizations
- [ ] Test coverage expansion
- [ ] Documentation improvements

### **Feature Requests**
- [ ] Multi-language support (i18n)
- [ ] Advanced reporting features
- [ ] Integration with payment gateways
- [ ] Offline mode capabilities
- [ ] Mobile app development

### **Technical Improvements**
- [ ] TypeScript migration
- [ ] API documentation (Swagger/OpenAPI)
- [ ] Docker containerization
- [ ] CI/CD pipeline setup
- [ ] Security enhancements

## 🤝 Community Guidelines

- **Be respectful** and inclusive in all interactions
- **Help others** learn and improve
- **Share knowledge** and best practices
- **Follow the code of conduct** (coming soon)
- **Have fun** building great software together!

## 📞 Getting Help

If you need help or have questions:

1. **Check the documentation** in the README
2. **Search existing issues** on GitHub
3. **Join discussions** in the repository
4. **Ask questions** in new issues with the "question" label

## 🙏 Recognition

Contributors will be recognized in:
- README contributors section
- Release notes for their contributions
- Special thanks in documentation

---

Thank you for contributing to ModernPOS! Your efforts help make this project better for everyone. 🎉