import React, { useState, useEffect } from 'react';
import { dashboardAPI, productsAPI, salesAPI } from '../services/api';

const Dashboard = ({ user, onLogout }) => {
  const [stats, setStats] = useState({});
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [statsResponse, productsResponse] = await Promise.all([
        dashboardAPI.getStats().catch(() => ({ data: {} })),
        productsAPI.getAll().catch(() => ({ data: [] }))
      ]);
      
      setStats(statsResponse.data || {});
      setProducts(productsResponse.data || []);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    onLogout();
  };

  return (
    <div style={{ padding: '1rem', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{
        backgroundColor: 'white',
        padding: '1rem',
        borderRadius: '8px',
        marginBottom: '1rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div>
          <h1 style={{ margin: 0, color: '#333' }}>POS System Dashboard</h1>
          <p style={{ margin: '0.5rem 0 0 0', color: '#666' }}>
            Welcome, {user.name} ({user.role})
          </p>
        </div>
        <button
          onClick={handleLogout}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#d32f2f',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Logout
        </button>
      </div>

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#1976d2' }}>Total Products</h3>
          <p style={{ fontSize: '2rem', margin: 0, fontWeight: 'bold' }}>
            {products.length || 0}
          </p>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#388e3c' }}>Total Sales</h3>
          <p style={{ fontSize: '2rem', margin: 0, fontWeight: 'bold' }}>
            {stats.totalSales || 0}
          </p>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#f57c00' }}>Revenue</h3>
          <p style={{ fontSize: '2rem', margin: 0, fontWeight: 'bold' }}>
            ${stats.totalRevenue || 0}
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{
        backgroundColor: 'white',
        padding: '1.5rem',
        borderRadius: '8px',
        marginBottom: '2rem',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ margin: '0 0 1rem 0' }}>Quick Actions</h3>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#1976d2',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}>
            New Sale
          </button>
          <button style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#388e3c',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}>
            Add Product
          </button>
          <button style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#f57c00',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}>
            View Reports
          </button>
        </div>
      </div>

      {/* Recent Products */}
      <div style={{
        backgroundColor: 'white',
        padding: '1.5rem',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ margin: '0 0 1rem 0' }}>Products</h3>
        {loading ? (
          <p>Loading...</p>
        ) : products.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f5f5f5' }}>
                  <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #ddd' }}>Name</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #ddd' }}>Price</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #ddd' }}>Stock</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #ddd' }}>Category</th>
                </tr>
              </thead>
              <tbody>
                {products.slice(0, 5).map((product, index) => (
                  <tr key={index}>
                    <td style={{ padding: '0.75rem', border: '1px solid #ddd' }}>
                      {product.name || 'N/A'}
                    </td>
                    <td style={{ padding: '0.75rem', border: '1px solid #ddd' }}>
                      ${product.price || 0}
                    </td>
                    <td style={{ padding: '0.75rem', border: '1px solid #ddd' }}>
                      {product.quantity || 0}
                    </td>
                    <td style={{ padding: '0.75rem', border: '1px solid #ddd' }}>
                      {product.category || 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ color: '#666', textAlign: 'center', padding: '2rem' }}>
            No products found. Start by adding some products to your inventory.
          </p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;