import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Package,
  CheckCircle,
  ShoppingBag,
  Heart,
  PlusCircle,
  Eye,
  Pencil,
  Trash2,
} from 'lucide-react';

import './SellerDashboard.css';

function SellerDashboard() {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      const token = localStorage.getItem('artloop_token');

      const response = await fetch(
        'http://localhost:3000/api/products/my/listings',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to load listings.');
      }

      setProducts(data.products || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId, productName) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${productName}"?`
    );

    if (!confirmed) return;

    try {
      const token = localStorage.getItem('artloop_token');

      const response = await fetch(
        `http://localhost:3000/api/products/${productId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to delete product.');
      }

      setProducts((previous) =>
        previous.filter((product) => product._id !== productId)
      );

      alert('Product deleted successfully!');
    } catch (err) {
      alert(err.message);
    }
  };

  const activeProducts = products.filter(
    (product) => !product.isSold
  );

  const soldProducts = products.filter(
    (product) => product.isSold
  );

  const totalLikes = products.reduce(
    (total, product) => total + (product.likes?.length || 0),
    0
  );

  return (
    <div className="seller-dashboard">
      <div className="seller-dashboard-container">

        <button
          className="seller-back-button"
          onClick={() => navigate('/profile')}
        >
          <ArrowLeft size={17} />
          Back to Profile
        </button>

        <div className="seller-dashboard-header">
          <div>
            <span className="seller-eyebrow">ARTLOOP SELLER SPACE</span>
            <h1>Seller Dashboard 🎨</h1>
            <p>Manage your listings and track your selling activity.</p>
          </div>

          <button
            className="seller-add-button"
            onClick={() => navigate('/sell')}
          >
            <PlusCircle size={18} />
            Sell New Item
          </button>
        </div>

        {loading ? (
          <p className="seller-message">Loading your dashboard...</p>
        ) : error ? (
          <p className="seller-message seller-error">{error}</p>
        ) : (
          <>
            <div className="seller-stats-grid">

              <div className="seller-stat-card">
                <div className="seller-stat-icon">
                  <Package size={25} />
                </div>
                <h2>{products.length}</h2>
                <p>Total Listings</p>
              </div>

              <div className="seller-stat-card">
                <div className="seller-stat-icon">
                  <ShoppingBag size={25} />
                </div>
                <h2>{activeProducts.length}</h2>
                <p>Active Products</p>
              </div>

              <div className="seller-stat-card">
                <div className="seller-stat-icon">
                  <CheckCircle size={25} />
                </div>
                <h2>{soldProducts.length}</h2>
                <p>Products Sold</p>
              </div>

              <div className="seller-stat-card">
                <div className="seller-stat-icon">
                  <Heart size={25} />
                </div>
                <h2>{totalLikes}</h2>
                <p>Total Likes</p>
              </div>

            </div>

            <div className="seller-listings-section">
              <div className="seller-section-heading">
                <div>
                  <h2>Your Listings</h2>
                  <p>Keep track of the art supplies you're selling.</p>
                </div>

                <span>{products.length} Items</span>
              </div>

              {products.length === 0 ? (
                <div className="seller-empty-state">
                  <Package size={45} />
                  <h3>No listings yet</h3>
                  <p>Start selling your unused art supplies on ArtLoop.</p>
                  <button onClick={() => navigate('/sell')}>
                    List Your First Item
                  </button>
                </div>
              ) : (
                <div className="seller-products-grid">
                  {products.map((product) => (
                    <div className="seller-product-card" key={product._id}>
                      <img
                        src={product.image}
                        alt={product.name}
                      />

                      <div className="seller-product-content">
                        <div className="seller-product-title">
                          <h3>{product.name}</h3>

                          <span
                            className={
                              product.isSold
                                ? 'sold-status'
                                : 'active-status'
                            }
                          >
                            {product.isSold ? 'Sold' : 'Active'}
                          </span>
                        </div>

                        <strong>
                          ₹{Number(product.price).toLocaleString('en-IN')}
                        </strong>

                        <p>{product.category}</p>

                        <div className="seller-product-footer">
                          <span>
                            <Heart size={15} />
                            {product.likes?.length || 0} Likes
                          </span>

                          <button
                            onClick={() =>
                              navigate(`/product/${product._id}`)
                            }
                          >
                            <Eye size={16} />
                            View
                          </button>

                          <button
                            onClick={() =>
                              navigate(`/sell?edit=${product._id}`)
                            }
                          >
                            <Pencil size={16} />
                            Edit
                          </button>

                          <button
                            onClick={() =>
                              handleDelete(product._id, product.name)
                            }
                          >
                            <Trash2 size={16} />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default SellerDashboard;