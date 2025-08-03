import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Alert,
  CircularProgress,
  Button,
  Divider
} from '@mui/material';
import { productsAPI, categoriesAPI } from '../services/api';

const ProductDebug = () => {
  const [state, setState] = useState({
    products: [],
    categories: [],
    loading: false,
    error: null,
    debugInfo: {}
  });

  const runDiagnostics = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      console.log('🔍 Starting Product Management Diagnostics...');
      
      // Test 1: Check token
      const token = localStorage.getItem('token');
      console.log('🔑 Token status:', token ? 'Present' : 'Missing');
      
      // Test 2: Fetch categories
      console.log('📂 Fetching categories...');
      const categoriesResponse = await categoriesAPI.getAll();
      console.log('📂 Categories response:', categoriesResponse);
      
      // Test 3: Fetch products
      console.log('📦 Fetching products...');
      const productsResponse = await productsAPI.getAll();
      console.log('📦 Products response:', productsResponse);
      
      // Test 4: Data structure analysis
      const products = productsResponse.data || [];
      const categories = categoriesResponse.data || [];
      
      const debugInfo = {
        tokenPresent: !!token,
        categoriesCount: categories.length,
        productsCount: products.length,
        sampleProduct: products[0] || null,
        sampleCategory: categories[0] || null,
        categoryStructure: products.map(p => ({
          productName: p.name,
          categoryType: typeof p.category,
          categoryValue: p.category,
          hasId: !!p.category?._id,
          hasName: !!p.category?.name
        }))
      };
      
      console.log('🔬 Debug Info:', debugInfo);
      
      setState(prev => ({
        ...prev,
        products,
        categories,
        debugInfo,
        loading: false
      }));
      
      console.log('✅ Diagnostics completed successfully');
      
    } catch (error) {
      console.error('❌ Diagnostics failed:', error);
      setState(prev => ({
        ...prev,
        error: error.message,
        loading: false
      }));
    }
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const renderProductAnalysis = (product) => {
    if (!product) return null;
    
    return (
      <Box>
        <Typography variant="h6">Sample Product Analysis:</Typography>
        <Typography variant="body2">Name: {product.name}</Typography>
        <Typography variant="body2">SKU: {product.sku}</Typography>
        <Typography variant="body2">Category Type: {typeof product.category}</Typography>
        <Typography variant="body2">
          Category Value: {JSON.stringify(product.category, null, 2)}
        </Typography>
        <Typography variant="body2">
          Category Name Resolution: {
            product.category?.name || 
            state.categories.find(c => c._id === (product.category?._id || product.category))?.name || 
            'Unknown'
          }
        </Typography>
      </Box>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        🔧 Product Management Debug Console
      </Typography>
      
      <Button 
        variant="contained" 
        onClick={runDiagnostics}
        disabled={state.loading}
        sx={{ mb: 2 }}
      >
        {state.loading ? <CircularProgress size={20} /> : '🔄 Run Diagnostics'}
      </Button>

      {state.error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Error: {state.error}
        </Alert>
      )}

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>System Status</Typography>
          <Typography variant="body2">
            ✅ Token: {state.debugInfo.tokenPresent ? 'Present' : 'Missing'}
          </Typography>
          <Typography variant="body2">
            📂 Categories Loaded: {state.debugInfo.categoriesCount || 0}
          </Typography>
          <Typography variant="body2">
            📦 Products Loaded: {state.debugInfo.productsCount || 0}
          </Typography>
        </CardContent>
      </Card>

      {state.debugInfo.sampleProduct && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            {renderProductAnalysis(state.debugInfo.sampleProduct)}
          </CardContent>
        </Card>
      )}

      {state.debugInfo.categoryStructure && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>Category Structure Analysis</Typography>
            {state.debugInfo.categoryStructure.map((item, index) => (
              <Box key={index} sx={{ mb: 1, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="body2">
                  Product: <strong>{item.productName}</strong>
                </Typography>
                <Typography variant="body2">
                  Category Type: <strong>{item.categoryType}</strong>
                </Typography>
                <Typography variant="body2">
                  Has ID: <strong>{item.hasId ? '✅' : '❌'}</strong>
                </Typography>
                <Typography variant="body2">
                  Has Name: <strong>{item.hasName ? '✅' : '❌'}</strong>
                </Typography>
              </Box>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>Raw Data</Typography>
          <Typography variant="body2" component="pre" sx={{ fontSize: '0.75rem', overflow: 'auto' }}>
            {JSON.stringify(state.debugInfo, null, 2)}
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ProductDebug;