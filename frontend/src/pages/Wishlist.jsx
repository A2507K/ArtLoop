import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Palette,
  Heart,
  Bookmark,
  Trash2,
  ArrowRight,
  ShoppingBag,
  ArrowLeft,
} from 'lucide-react';

import './Wishlist.css';

const FALLBACK_IMAGE =
  'https://placehold.co/600x450/f3eaff/7041c3?text=ArtLoop';

function Wishlist() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const token = localStorage.getItem('artloop_token');

  useEffect(() => {
    const controller = new AbortController();

    const fetchWishlist = async () => {
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        setLoading(true);
        setError('');

        const response = await fetch(
          'http://localhost:3000/api/products/my/wishlist',
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            signal: controller.signal,
          }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || 'Unable to load wishlist.');
        }

        setProducts(data.products || []);
      } catch (err) {
        if (err.name === 'AbortError') return;

        console.error('Wishlist error:', err);
        setError(err.message || 'Something went wrong.');
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchWishlist();

    return () => controller.abort();
  }, [navigate, token]);

  const removeFromWishlist = async (productId) => {
    try {
      const response = await fetch(
        `http://localhost:3000/api/products/${productId}/wishlist`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Unable to remove product.');
      }

      setProducts((current) =>
        current.filter((product) => product._id !== productId)
      );
    } catch (err) {
      console.error('Remove wishlist error:', err);
      alert(err.message);
    }
  };

  return (
    <div className="wishlist-page">
      <header className="wishlist-navbar">
        <Link to="/" className="wishlist-brand">
          <span className="wishlist-brand-icon">
            <Palette size={24} />
          </span>
          <span>
            art<span>loop</span>
          </span>
        </Link>

        <div className="wishlist-nav-actions">
          <Link to="/marketplace" className="back-marketplace">
            <ArrowLeft size={17} />
            Marketplace
          </Link>

          <Link to="/profile" className="wishlist-profile">
            My Profile
          </Link>
        </div>
      </header>

      <main className="wishlist-container">
        <div className="wishlist-heading">
          <div>
            <span className="wishlist-kicker">
              YOUR CREATIVE COLLECTION
            </span>

            <h1>
              My <span>Wishlist</span>
              <Heart size={29} fill="currentColor" />
            </h1>

            <p>
              Keep your favourite art supplies close and find them whenever
              inspiration strikes.
            </p>
          </div>

          <div className="wishlist-count">
            <Bookmark size={23} />
            <div>
              <strong>{products.length}</strong>
              <span>Saved items</span>
            </div>
          </div>
        </div>

        {loading && (
          <div className="wishlist-loading">
            <Heart size={30} />
            <p>Loading your wishlist...</p>
          </div>
        )}

        {error && !loading && (
          <div className="wishlist-error">
            <p>{error}</p>
            <button onClick={() => window.location.reload()}>
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && products.length === 0 && (
          <div className="wishlist-empty">
            <div className="empty-heart">
              <Heart size={48} />
            </div>

            <h2>Your wishlist is waiting!</h2>

            <p>
              You haven't saved any art supplies yet. Explore the
              marketplace and save something you love.
            </p>

            <Link to="/marketplace" className="explore-wishlist">
              <ShoppingBag size={18} />
              Explore Marketplace
              <ArrowRight size={18} />
            </Link>
          </div>
        )}

        {!loading && !error && products.length > 0 && (
          <div className="wishlist-grid">
            {products.map((product) => (
              <article className="wishlist-card" key={product._id}>
                <div className="wishlist-image">
                  <img
                    src={product.image || FALLBACK_IMAGE}
                    alt={product.name}
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src = FALLBACK_IMAGE;
                    }}
                  />

                  <span className="wishlist-saved-label">
                    <Heart size={13} fill="currentColor" />
                    Saved
                  </span>

                  <button
                    className="wishlist-remove"
                    type="button"
                    title="Remove from wishlist"
                    aria-label={`Remove ${product.name} from wishlist`}
                    onClick={() => removeFromWishlist(product._id)}
                  >
                    <Trash2 size={17} />
                  </button>
                </div>

                <div className="wishlist-card-info">
                  <span className="wishlist-category">
                    {product.category}
                  </span>

                  <h3>{product.name}</h3>

                  <p className="wishlist-condition">
                    {product.condition || 'Condition not specified'}
                  </p>

                  <p className="wishlist-location">
                    {product.location || 'Location not specified'}
                  </p>

                  <div className="wishlist-card-footer">
                    <strong>
                      ₹
                      {Number(product.price || 0).toLocaleString('en-IN')}
                    </strong>

                    <button
                      type="button"
                      onClick={() =>
                        navigate(`/product/${product._id}`)
                      }
                      className="wishlist-view-button"
                    >
                      View <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      <footer className="wishlist-footer">
        <p>
          <Palette size={17} />
          A little less waste. A lot more art.
        </p>
        <span>© 2026 ArtLoop Marketplace</span>
      </footer>
    </div>
  );
}

export default Wishlist;