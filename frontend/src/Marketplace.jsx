import { useEffect, useState } from 'react';
import {
Palette,
Search,
ShoppingBag,
ArrowRight,
Plus,
Heart,
Bookmark,
Paintbrush,
Sparkles,
Recycle,
Package,
SlidersHorizontal,
MessageCircle,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import './App.css';
import API_BASE_URL from './api';

const categories = [
'All Supplies',
'Paints',
'Brushes',
'Canvas',
'Drawing',
'Craft Tools',
];

const FALLBACK_IMAGE =
'https://placehold.co/600x450/f3eaff/7041c3?text=ArtLoop';

function Marketplace() {
const [searchTerm, setSearchTerm] = useState('');
const [products, setProducts] = useState([]);
const [loading, setLoading] = useState(true);
const [fetchError, setFetchError] = useState('');
const [activeCategory, setActiveCategory] = useState('All Supplies');
const [unreadCount, setUnreadCount] = useState(0);

// Advanced filter states
const [minPrice, setMinPrice] = useState('');
const [maxPrice, setMaxPrice] = useState('');
const [selectedCondition, setSelectedCondition] =
useState('All Conditions');
const [selectedLocation, setSelectedLocation] = useState('');
const [sortBy, setSortBy] = useState('newest');
const [showFilters, setShowFilters] = useState(false);

const [currentUserId, setCurrentUserId] = useState('');
const [wishlistIds, setWishlistIds] = useState([]);

const navigate = useNavigate();

const getProductId = (product) => product._id || product.id;

// Clear all filters
const clearFilters = () => {
setSearchTerm('');
setActiveCategory('All Supplies');
setMinPrice('');
setMaxPrice('');
setSelectedCondition('All Conditions');
setSelectedLocation('');
setSortBy('newest');
};

// Check whether any advanced filter is active
const hasActiveFilters =
minPrice !== '' ||
maxPrice !== '' ||
selectedCondition !== 'All Conditions' ||
selectedLocation !== '' ||
sortBy !== 'newest';

// Search, filter and sort products
const filteredProducts = products
.filter((product) => {
const name = String(product.name || '');
const category = String(product.category || '');
const location = String(product.location || '');
const condition = String(product.condition || '');

  const query = searchTerm.toLowerCase();

  const matchesSearch =
    name.toLowerCase().includes(query) ||
    category.toLowerCase().includes(query) ||
    location.toLowerCase().includes(query);

  const matchesCategory =
    activeCategory === 'All Supplies' ||
    category === activeCategory;

  const matchesMinPrice =
    minPrice === '' ||
    Number(product.price) >= Number(minPrice);

  const matchesMaxPrice =
    maxPrice === '' ||
    Number(product.price) <= Number(maxPrice);

  const matchesCondition =
    selectedCondition === 'All Conditions' ||
    condition === selectedCondition;

  const matchesLocation = location
    .toLowerCase()
    .includes(selectedLocation.toLowerCase());

  return (
    matchesSearch &&
    matchesCategory &&
    matchesMinPrice &&
    matchesMaxPrice &&
    matchesCondition &&
    matchesLocation
  );
})
.sort((a, b) => {
  if (sortBy === 'priceLow') {
    return Number(a.price) - Number(b.price);
  }

  if (sortBy === 'priceHigh') {
    return Number(b.price) - Number(a.price);
  }

  if (sortBy === 'newest') {
    return (
      new Date(b.createdAt || 0) -
      new Date(a.createdAt || 0)
    );
  }

  return 0;
});

// Like or unlike a product
const toggleFavorite = async (id) => {
const token = localStorage.getItem('artloop_token');

if (!token) {
  navigate('/login');
  return;
}

try {
  const response = await fetch(
    `${API_BASE_URL}/api/products/${id}/like`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Unable to update like.');
  }

  setProducts((current) =>
    current.map((product) =>
      getProductId(product) === id
        ? {
            ...product,
            likes: data.liked
              ? [...(product.likes || []), currentUserId]
              : (product.likes || []).filter(
                  (userId) =>
                    userId.toString() !== currentUserId
                ),
          }
        : product
    )
  );
} catch (error) {
  console.error('Like error:', error);
  alert(error.message);
}

};

// Add or remove a product from wishlist
const toggleWishlist = async (id) => {
const token = localStorage.getItem('artloop_token');

if (!token) {
  navigate('/login');
  return;
}

const alreadySaved = wishlistIds.includes(id);

try {
  const response = await fetch(
    `${API_BASE_URL}/api/products/${id}/wishlist`,
    {
      method: alreadySaved ? 'DELETE' : 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(
      data.message || 'Unable to update wishlist.'
    );
  }

  setWishlistIds((current) =>
    alreadySaved
      ? current.filter((itemId) => itemId !== id)
      : [...current, id]
  );
} catch (error) {
  console.error('Wishlist error:', error);
  alert(error.message);
}

};

// Check unread chat messages periodically
useEffect(() => {
const fetchUnreadCount = async () => {
const token = localStorage.getItem('artloop_token');

  if (!token) {
    setUnreadCount(0);
    return;
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/chats`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (response.ok && data.success) {
      const total = (data.chats || []).reduce(
        (sum, chat) => sum + (chat.unreadCount || 0),
        0
      );

      setUnreadCount(total);
    }
  } catch (error) {
    console.error('Notification error:', error);
  }
};

fetchUnreadCount();

const interval = setInterval(fetchUnreadCount, 5000);

return () => clearInterval(interval);

}, []);

// Load products and user wishlist
useEffect(() => {
const controller = new AbortController();

async function fetchProducts() {
  try {
    setLoading(true);
    setFetchError('');

    const response = await fetch(
      `${API_BASE_URL}/api/products`,
      { signal: controller.signal }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(
        data.message || 'Unable to load products.'
      );
    }

    setProducts(
      Array.isArray(data.products) ? data.products : []
    );
  } catch (error) {
    if (error.name === 'AbortError') return;

    console.error('Error loading products:', error);
    setFetchError(
      'Unable to load products. Please try again.'
    );
  } finally {
    if (!controller.signal.aborted) {
      setLoading(false);
    }
  }
}

const storedUser = JSON.parse(
  localStorage.getItem('artloop_user') || '{}'
);

setCurrentUserId(
  String(storedUser.id || storedUser._id || '')
);

fetchProducts();

const token = localStorage.getItem('artloop_token');

if (token) {
  fetch(
    `${API_BASE_URL}/api/products/my/wishlist`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      signal: controller.signal,
    }
  )
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        setWishlistIds(
          (data.products || []).map((product) =>
            getProductId(product).toString()
          )
        );
      }
    })
    .catch((error) => {
      if (error.name !== 'AbortError') {
        console.error('Wishlist loading error:', error);
      }
    });
}

return () => controller.abort();

}, []);

// Sell item navigation
const handleSell = () => {
const token =
localStorage.getItem('artloop_token') ||
sessionStorage.getItem('artloop_token');

if (token) {
  navigate('/sell');
} else {
  navigate('/login');
}

};

return ( <div className="app"> <header className="navbar"> <Link className="brand" to="/" aria-label="ArtLoop home"> <span className="brand-icon"> <Palette size={25} /> </span>

      <span>
        art<span className="brand-highlight">loop</span>
      </span>
    </Link>

    <nav className="nav-links" aria-label="Main navigation">
      <a className="nav-active" href="#marketplace">
        Marketplace
      </a>

      <a href="#categories">
        Categories
      </a>

      <Link to="/chat" className="chat-nav-link">
        <MessageCircle size={17} />
        Chat

        {unreadCount > 0 && (
          <span className="chat-notification-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </Link>
    </nav>

    <div className="nav-actions">
      <button
        className="login-button"
        onClick={() => navigate('/wishlist')}
      >
        <Heart size={16} />
        Wishlist
      </button>

      <button className="sell-button" onClick={handleSell}>
        <Plus size={17} />
        Sell an item
      </button>

      <button
        className="login-button"
        onClick={() => navigate('/profile')}
      >
        My Profile
      </button>

      <button
        className="login-button"
        onClick={() => {
          localStorage.removeItem('artloop_token');
          localStorage.removeItem('artloop_user');
          navigate('/login');
        }}
      >
        Log Out
      </button>
    </div>
  </header>

  <main>
    <section className="hero">
      <div className="hero-content">
        <div className="eyebrow">
          <Sparkles size={15} />
          <span>MADE FOR CREATIVE MINDS</span>
        </div>

        <h1>
          Your next masterpiece
          <br />
          starts <span>right here.</span>
        </h1>

        <p className="hero-description">
          Discover pre-loved art supplies, give unused materials
          a new home, and make creativity more affordable for everyone.
        </p>

        <div className="hero-actions">
          <a href="#marketplace" className="primary-button">
            Explore supplies <ArrowRight size={18} />
          </a>
        </div>

        <div className="hero-stats">
          <div>
            <strong>Re-use</strong>
            <span>More, waste less</span>
          </div>

          <div>
            <strong>Save</strong>
            <span>On creative tools</span>
          </div>

          <div>
            <strong>Connect</strong>
            <span>With local artists</span>
          </div>
        </div>
      </div>

      <div className="hero-visual">
        <div className="hero-image-frame">
          <img
            src="https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=1000&q=85"
            alt="Colorful art supplies and painting materials"
            onError={(event) => {
              event.currentTarget.src = FALLBACK_IMAGE;
            }}
          />
        </div>

        <div className="hero-decoration"></div>
      </div>
    </section>

    <section className="marketplace-section" id="marketplace">
      <div className="section-heading">
        <div>
          <span className="section-kicker">
            THE CREATIVE MARKET
          </span>

          <h2>Find your next favourite.</h2>

          <p>Great materials deserve a second chance.</p>
        </div>

        <div className="product-search">
          <Search size={19} />

          <input
            type="search"
            placeholder="Search paints, brushes, location..."
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(event.target.value)
            }
            aria-label="Search art supplies"
          />
        </div>
      </div>

      <div className="category-row" id="categories">
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            className={`category-chip ${
              activeCategory === category ? 'selected' : ''
            }`}
            onClick={() => setActiveCategory(category)}
            aria-pressed={activeCategory === category}
          >
            {category === 'All Supplies' && (
              <Package size={16} />
            )}
            {category === 'Paints' && <Palette size={16} />}
            {category === 'Brushes' && (
              <Paintbrush size={16} />
            )}
            {category === 'Canvas' && <Palette size={16} />}
            {category === 'Drawing' && (
              <Paintbrush size={16} />
            )}
            {category === 'Craft Tools' && (
              <Package size={16} />
            )}

            {category}
          </button>
        ))}
      </div>

      {/* COLLAPSIBLE FILTER TOOLBAR */}
      <div className="filter-toolbar">
        <div className="filter-toolbar-text">
          <h3>Explore your style</h3>
          <p>Find exactly what your creativity needs.</p>
        </div>

        <button
          type="button"
          className={`filter-toggle-button ${
            showFilters ? 'filter-active' : ''
          }`}
          onClick={() => setShowFilters(!showFilters)}
          aria-expanded={showFilters}
        >
          <SlidersHorizontal size={17} />
          Filters

          {hasActiveFilters && (
            <span className="filter-count">Active</span>
          )}

          <span className="filter-toggle-icon">
            {showFilters ? '−' : '+'}
          </span>
        </button>
      </div>

      {/* EXPANDABLE FILTER PANEL */}
      {showFilters && (
        <div className="filter-panel">
          <div className="filter-panel-heading">
            <div>
              <h3>Refine your search</h3>
              <p>Make your next creative find.</p>
            </div>

            <button
              type="button"
              className="filter-close-button"
              onClick={() => setShowFilters(false)}
              aria-label="Close filters"
            >
              ×
            </button>
          </div>

          <div className="filter-fields">
            <div className="filter-field">
              <label htmlFor="min-price">
                Minimum price
              </label>

              <input
                id="min-price"
                type="number"
                min="0"
                placeholder="₹ Min"
                value={minPrice}
                onChange={(event) =>
                  setMinPrice(event.target.value)
                }
              />
            </div>

            <div className="filter-field">
              <label htmlFor="max-price">
                Maximum price
              </label>

              <input
                id="max-price"
                type="number"
                min="0"
                placeholder="₹ Max"
                value={maxPrice}
                onChange={(event) =>
                  setMaxPrice(event.target.value)
                }
              />
            </div>

            <div className="filter-field">
              <label htmlFor="condition">
                Condition
              </label>

              <select
                id="condition"
                value={selectedCondition}
                onChange={(event) =>
                  setSelectedCondition(event.target.value)
                }
              >
                <option value="All Conditions">
                  All Conditions
                </option>
                <option value="New">New</option>
                <option value="Like New">Like New</option>
                <option value="Good">Good</option>
                <option value="Fair">Fair</option>
              </select>
            </div>

            <div className="filter-field">
              <label htmlFor="location">
                Location
              </label>

              <input
                id="location"
                type="text"
                placeholder="Enter location"
                value={selectedLocation}
                onChange={(event) =>
                  setSelectedLocation(event.target.value)
                }
              />
            </div>

            <div className="filter-field">
              <label htmlFor="sort-products">
                Sort products
              </label>

              <select
                id="sort-products"
                value={sortBy}
                onChange={(event) =>
                  setSortBy(event.target.value)
                }
              >
                <option value="newest">Newest First</option>
                <option value="priceLow">
                  Price: Low to High
                </option>
                <option value="priceHigh">
                  Price: High to Low
                </option>
              </select>
            </div>
          </div>

          <div className="filter-panel-actions">
            <button
              type="button"
              className="filter-reset-button"
              onClick={clearFilters}
            >
              Clear All
            </button>

            <button
              type="button"
              className="filter-apply-button"
              onClick={() => setShowFilters(false)}
            >
              Apply Filters <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {loading && (
        <p className="loading-message" role="status">
          Loading art supplies...
        </p>
      )}

      {fetchError && (
        <div className="fetch-error" role="alert">
          <p>{fetchError}</p>

          <button
            type="button"
            onClick={() => window.location.reload()}
          >
            Try again
          </button>
        </div>
      )}

      {!loading && !fetchError && (
        <>
          <div className="product-grid">
            {filteredProducts.map((product) => {
              const id = getProductId(product);

              return (
                <article className="product-card" key={id}>
                  <div className="product-image">
                    <img
                      src={product.image || FALLBACK_IMAGE}
                      alt={product.name || 'Art supply'}
                      loading="lazy"
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = FALLBACK_IMAGE;
                      }}
                    />

                    {product.condition && (
                      <span className="condition-badge">
                        {product.condition}
                      </span>
                    )}

                    <button
                      type="button"
                      className={`favorite-button ${
                        (product.likes || []).some(
                          (userId) =>
                            userId.toString() === currentUserId
                        )
                          ? 'favorited'
                          : ''
                      }`}
                      aria-label="Like product"
                      onClick={() => toggleFavorite(id)}
                    >
                      <Heart
                        size={19}
                        fill={
                          (product.likes || []).some(
                            (userId) =>
                              userId.toString() === currentUserId
                          )
                            ? 'currentColor'
                            : 'none'
                        }
                      />
                    </button>

                    <span className="likes-count">
                      {(product.likes || []).length}
                    </span>

                    <button
                      type="button"
                      className={`wishlist-button ${
                        wishlistIds.includes(id.toString())
                          ? 'saved'
                          : ''
                      }`}
                      aria-label="Add to wishlist"
                      title="Add to wishlist"
                      onClick={() =>
                        toggleWishlist(id.toString())
                      }
                    >
                      <Bookmark
                        size={19}
                        fill={
                          wishlistIds.includes(id.toString())
                            ? 'currentColor'
                            : 'none'
                        }
                      />
                    </button>
                  </div>

                  <div className="product-info">
                    <span className="product-category">
                      {product.category}
                    </span>

                    <h3>{product.name}</h3>

                    <p className="product-location">
                      {product.location ||
                        'Location not specified'}
                    </p>

                    <div className="product-footer">
                      <span className="product-price">
                        ₹
                        {Number(
                          product.price || 0
                        ).toLocaleString('en-IN')}
                      </span>

                      <button
                        type="button"
                        className="view-product-button"
                        onClick={() =>
                          navigate(`/product/${id}`)
                        }
                        aria-label={`View ${product.name}`}
                      >
                        <ArrowRight size={19} />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {filteredProducts.length === 0 && (
            <div className="empty-state">
              <Search size={30} />
              <h3>No supplies found</h3>

              <p>
                Try a different search or adjust your filters.
              </p>

              <button
                type="button"
                onClick={clearFilters}
              >
                Clear filters
              </button>
            </div>
          )}
        </>
      )}
    </section>

    <section className="how-section" id="how-it-works">
      <span className="section-kicker">
        SIMPLE. CREATIVE. SUSTAINABLE.
      </span>

      <h2>Good things deserve a second life.</h2>

      <div className="how-grid">
        <article>
          <span className="how-number">01</span>
          <Palette size={25} />
          <h3>Discover</h3>
          <p>
            Find affordable supplies shared by artists in your community.
          </p>
        </article>

        <article>
          <span className="how-number">02</span>
          <ShoppingBag size={25} />
          <h3>Connect</h3>
          <p>
            Talk to sellers, ask questions, and arrange a purchase or swap.
          </p>
        </article>

        <article>
          <span className="how-number">03</span>
          <Recycle size={25} />
          <h3>Create again</h3>
          <p>
            Give useful materials another life and get back to creating.
          </p>
        </article>
      </div>
    </section>
  </main>

  <footer className="footer">
    <Link className="brand footer-brand" to="/">
      <span className="brand-icon">
        <Palette size={22} />
      </span>

      <span>
        art<span className="brand-highlight">loop</span>
      </span>
    </Link>

    <p>A little less waste. A lot more art.</p>
    <span>© 2026 ArtLoop Marketplace</span>
  </footer>
</div>

);
}

export default Marketplace;
