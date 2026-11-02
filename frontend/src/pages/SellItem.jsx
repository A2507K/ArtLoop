import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Palette, ArrowLeft, Plus, Image, X } from 'lucide-react';
import './SellItem.css';

function SellItem() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const editId = searchParams.get('edit');
  const isEditing = Boolean(editId);

  const [formData, setFormData] = useState({
    name: '',
    category: 'Paints',
    price: '',
    condition: 'Like New',
    location: '',
    description: '',
  });

  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [existingImage, setExistingImage] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingProduct, setFetchingProduct] = useState(isEditing);
  const [error, setError] = useState('');

  // LOAD EXISTING PRODUCT FOR EDITING
  useEffect(() => {
    if (!editId) return;

    const fetchProduct = async () => {
      try {
        const token =
          localStorage.getItem('artloop_token') ||
          sessionStorage.getItem('artloop_token');

        if (!token) {
          navigate('/login');
          return;
        }

        const response = await fetch(
          `http://localhost:3000/api/products/${editId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Unable to load product.');
        }

        const product = data.product;

        if (!product) {
          throw new Error('Product details not found.');
        }

        setFormData({
          name: product.name || '',
          category: product.category || 'Paints',
          price: product.price ?? '',
          condition: product.condition || 'Like New',
          location: product.location || '',
          description: product.description || '',
        });

        setExistingImage(product.image || '');

      } catch (err) {
        setError(err.message);
      } finally {
        setFetchingProduct(false);
      }
    };

    fetchProduct();
  }, [editId, navigate]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleImageChange = (event) => {
    const file = event.target.files[0];

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file.');
      event.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5 MB.');
      event.target.value = '';
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setError('');
    setSelectedImage(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const removeImage = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedImage(null);
    setPreviewUrl('');

    const input = document.getElementById('product-image');

    if (input) {
      input.value = '';
    }
  };

  // CREATE OR UPDATE PRODUCT
  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    const token =
      localStorage.getItem('artloop_token') ||
      sessionStorage.getItem('artloop_token');

    if (!token) {
      navigate('/login');
      return;
    }

    if (Number(formData.price) < 0) {
      setError('Price cannot be negative.');
      return;
    }

    if (!isEditing && !selectedImage) {
      setError('Please select a product image.');
      return;
    }

    try {
      setLoading(true);

      const productData = new FormData();

      Object.entries(formData).forEach(([key, value]) => {
        productData.append(key, value);
      });

      // Image is optional while editing.
      if (selectedImage) {
        productData.append('image', selectedImage);
      }

      const response = await fetch(
        isEditing
          ? `http://localhost:3000/api/products/${editId}`
          : 'http://localhost:3000/api/products',
        {
          method: isEditing ? 'PUT' : 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: productData,
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
          (isEditing
            ? 'Unable to update product.'
            : 'Unable to list product.')
        );
      }

      alert(
        isEditing
          ? 'Product updated successfully! 🎉'
          : 'Your item has been listed successfully! 🎉'
      );

      navigate('/seller-dashboard');

    } catch (err) {
      console.error('Product operation error:', err);
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  if (fetchingProduct) {
    return (
      <div className="sell-page">
        <p className="seller-message">Loading product details...</p>
      </div>
    );
  }

  return (
    <div className="sell-page">

      <header className="sell-navbar">

        <Link to="/marketplace" className="sell-brand">
          <Palette size={25} />
          <span>
            art<span>loop</span>
          </span>
        </Link>

        <Link to="/marketplace" className="back-marketplace">
          <ArrowLeft size={17} />
          Back to Marketplace
        </Link>

      </header>

      <main className="sell-container">

        <div className="sell-heading">
          <span className="sell-kicker">
            {isEditing ? 'UPDATE YOUR LISTING' : 'SHARE YOUR CREATIVITY'}
          </span>

          <h1>
            {isEditing ? (
              <>Edit your <span>art supplies.</span></>
            ) : (
              <>Sell your <span>art supplies.</span></>
            )}
          </h1>

          <p>
            {isEditing
              ? 'Update your product details and save your changes.'
              : "Give your unused art materials a new home. Someone's next masterpiece might start with you."}
          </p>
        </div>

        <div className="sell-card">

          <div className="sell-card-heading">
            <div className="sell-icon">
              <Plus size={25} />
            </div>

            <div>
              <h2>Item Information</h2>
              <p>Fill in the details below.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>

            <div className="sell-form-grid">

              <div className="sell-field">
                <label>Product Name *</label>

                <input
                  type="text"
                  name="name"
                  placeholder="e.g. Acrylic Paint Set"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  maxLength={100}
                />
              </div>

              <div className="sell-field">
                <label>Category *</label>

                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                >
                  <option>Paints</option>
                  <option>Brushes</option>
                  <option>Canvas</option>
                  <option>Drawing</option>
                  <option>Craft Tools</option>
                </select>
              </div>

              <div className="sell-field">
                <label>Price (₹) *</label>

                <input
                  type="number"
                  name="price"
                  placeholder="Enter price"
                  value={formData.price}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div className="sell-field">
                <label>Condition *</label>

                <select
                  name="condition"
                  value={formData.condition}
                  onChange={handleChange}
                  required
                >
                  <option>Like New</option>
                  <option>Good</option>
                  <option>Lightly Used</option>
                  <option>Used</option>
                </select>
              </div>

              <div className="sell-field">
                <label>Location *</label>

                <input
                  type="text"
                  name="location"
                  placeholder="e.g. Kerala, India"
                  value={formData.location}
                  onChange={handleChange}
                  required
                />
              </div>

            </div>

            <div className="sell-field description-field">

              <label>Product Image *</label>

              <label
                htmlFor="product-image"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  padding: '20px',
                  border: '2px dashed #b9a9ed',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  background: '#faf8ff',
                }}
              >
                <Image size={22} />

                {selectedImage
                  ? 'Choose another image'
                  : isEditing
                    ? 'Choose a new image (optional)'
                    : 'Click to upload product image'}
              </label>

              <input
                id="product-image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={{ display: 'none' }}
              />

              {(previewUrl || existingImage) && (
                <div
                  style={{
                    position: 'relative',
                    marginTop: '15px',
                    width: '200px',
                  }}
                >
                  <img
                    src={previewUrl || existingImage}
                    alt="Product preview"
                    style={{
                      width: '200px',
                      height: '160px',
                      objectFit: 'cover',
                      borderRadius: '12px',
                    }}
                  />

                  {selectedImage && (
                    <button
                      type="button"
                      onClick={removeImage}
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        border: 'none',
                        borderRadius: '50%',
                        padding: '5px',
                        background: '#fff',
                        cursor: 'pointer',
                      }}
                      aria-label="Remove selected image"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>
              )}

              <small>
                Supported: JPG, PNG and other image formats. Maximum 5 MB.
              </small>

            </div>

            <div className="sell-field description-field">
              <label>Description</label>

              <textarea
                name="description"
                placeholder="Describe your art supply..."
                value={formData.description}
                onChange={handleChange}
                rows="5"
              />
            </div>

            {error && (
              <div className="sell-error">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="publish-button"
              disabled={loading}
            >
              {loading
                ? (isEditing ? 'Saving Changes...' : 'Publishing...')
                : (isEditing ? 'Save Changes' : 'Publish Item')}

              {!loading && <Plus size={19} />}
            </button>

          </form>

        </div>

      </main>

    </div>
  );
}

export default SellItem;