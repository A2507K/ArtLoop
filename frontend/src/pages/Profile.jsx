import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Phone,
  Shield,
  ArrowLeft,
  ArrowLeftRight,
  Package,
  Heart,
  Star,
  Trophy
} from 'lucide-react';

import './Profile.css';

function Profile() {
  const navigate = useNavigate();

  const user = JSON.parse(
    localStorage.getItem('artloop_user') || '{}'
  );

  const [myProducts, setMyProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMyListings = async () => {
      try {
        const token = localStorage.getItem('artloop_token');

        const response = await fetch(
          'http://localhost:3000/api/products/my/listings',
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Unable to load your listings.');
        }

        setMyProducts(data.products || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMyListings();

  }, []);

  // Calculate profile statistics
  const totalProducts = myProducts.length;

  const totalLikes = myProducts.reduce(
    (total, product) => total + (product.likes?.length || 0),
    0
  );

  const mostLikedProduct = myProducts.reduce(
    (best, product) =>
      (product.likes?.length || 0) > (best?.likes?.length || 0)
        ? product
        : best,
    null
  );

  return (<div className="profile-page"> <div className="profile-card">


    <button
      className="profile-back"
      onClick={() => navigate('/marketplace')}
    >
      <ArrowLeft size={16} /> Back to Marketplace
    </button>

    <div className="profile-heading">
      <div className="profile-avatar">
        <User size={48} />
      </div>

      <h1>{user.name || 'ArtLoop User'}</h1>
      <p>Welcome to your ArtLoop profile!</p>
    </div>

    <hr className="profile-divider" />

    {/* Account Information */}
    <h2>Account Information</h2>

    <div className="profile-info">
      <User size={22} />
      <div>
        <span>Full Name</span>
        <strong>{user.name || 'Not available'}</strong>
      </div>
    </div>

    <div className="profile-info">
      <Mail size={22} />
      <div>
        <span>Email Address</span>
        <strong>{user.email || 'Not available'}</strong>
      </div>
    </div>

    <div className="profile-info">
      <Phone size={22} />
      <div>
        <span>Phone Number</span>
        <strong>{user.phone || 'Not available'}</strong>
      </div>
    </div>

    <div className="profile-info">
      <Shield size={22} />
      <div>
        <span>Account Type</span>
        <strong>{user.role || 'User'}</strong>
      </div>
    </div>

    {/* Profile Statistics */}
    <div className="profile-stats">
      <div className="stat-card">
        <Package size={26} />
        <h3>{loading ? '...' : totalProducts}</h3>
        <p>Total Products</p>
      </div>

      <div className="stat-card">
        <Heart size={26} />
        <h3>{loading ? '...' : totalLikes}</h3>
        <p>Total Likes</p>
      </div>

      <div className="stat-card">
        <Star size={26} />
        <h3>
          {loading
            ? '...'
            : mostLikedProduct
              ? mostLikedProduct.likes?.length || 0
              : 0}
        </h3>
        <p>Highest Likes</p>
      </div>
    </div>

    {/* Most Popular Product */}
    {!loading && mostLikedProduct && totalLikes > 0 && (
      <div className="popular-product">
        <div className="popular-heading">
          <Trophy size={23} />
          <h2>Your Most Popular Artwork</h2>
        </div>

        <div
          className="popular-product-card"
          onClick={() => navigate(`/product/${mostLikedProduct._id}`)}
        >
          <img
            src={mostLikedProduct.image}
            alt={mostLikedProduct.name}
          />

          <div>
            <h3>{mostLikedProduct.name}</h3>
            <p>₹{Number(mostLikedProduct.price).toLocaleString('en-IN')}</p>
            <span>
              ❤️ {mostLikedProduct.likes?.length || 0} Likes
            </span>
          </div>
        </div>
      </div>
    )}

    {/* My Selling Activity */}
    <div className="my-listings-section">
      <div className="listings-heading">
        <div>
          <h2>My Selling Activity 🎨</h2>
          <p>Products you have listed on ArtLoop.</p>
        </div>

        <span className="listing-count">
          {myProducts.length} Items
        </span>
      </div>

      {loading ? (
        <p className="listings-message">Loading your products...</p>
      ) : error ? (
        <p className="listings-message error-message">{error}</p>
      ) : myProducts.length === 0 ? (
        <div className="empty-listings">
          <Package size={40} />
          <h3>No products listed yet</h3>
          <p>Your listed art supplies will appear here.</p>

          <button onClick={() => navigate('/sell')}>
            Sell Your First Item
          </button>
        </div>
      ) : (
        <div className="my-listings-grid">
          {myProducts.map((product) => (
            <div
              className="my-listing-card"
              key={product._id}
              onClick={() => navigate(`/product/${product._id}`)}
            >
              <img
                src={product.image}
                alt={product.name}
              />

              <div className="my-listing-content">
                <h3>{product.name}</h3>

                <strong>
                  ₹{Number(product.price).toLocaleString('en-IN')}
                </strong>

                <p>{product.category}</p>
                <span>{product.condition}</span>

                <div className="product-likes">
                  <Heart size={16} />
                  {product.likes?.length || 0} Likes
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>

    {/* Creative Space */}
    <div className="profile-extras">
      <h2>Your Creative Space 🎨</h2>

      <div className="profile-action-grid">
        <div
          className="profile-action"
          onClick={() => navigate('/marketplace')}
        >
          <span>🛍️</span>
          <h3>Explore Supplies</h3>
          <p>Discover materials for your next masterpiece.</p>
        </div>

        <div
          className="profile-action"
          onClick={() => navigate('/sell')}
        >
          <span>🎨</span>
          <h3>Sell Your Items</h3>
          <p>Give your unused art supplies a new home.</p>
        </div>

        <div
          className="profile-action"
          onClick={() => navigate('/seller-dashboard')}
        >
          <span>📊</span>
          <h3>Seller Dashboard</h3>
          <p>Track your listings, sales, and customer interest.</p>
        </div>
        <div
  className="profile-action"
  onClick={() => navigate('/swap-requests')}
>
  <span>🔄</span>
  <h3>Swap Requests</h3>
  <p>View sent and received swap requests.</p>
</div>
<button
  className="my-complaints-btn"
  onClick={() => navigate('/my-disputes')}
>
  My Complaints
</button>
      </div>

      <div className="creative-tip">
        <span>💡 Tip of the Day</span>
        <p>
          Creativity grows when we reuse, experiment and share.
          Give old art supplies a new beginning!
        </p>
      </div>
    </div>

  </div>
  </div>

  );
}

export default Profile;
