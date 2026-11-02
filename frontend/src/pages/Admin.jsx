import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Admin.css';

function Admin() {
  const navigate = useNavigate();

  const API = 'http://localhost:3000/api';

  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [disputes, setDisputes] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadingDisputes, setLoadingDisputes] = useState(false);
  const [error, setError] = useState('');

  const [activeSection, setActiveSection] = useState('Dashboard');

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');

  const [showProductForm, setShowProductForm] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const [replacementImage, setReplacementImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [updatingDispute, setUpdatingDispute] = useState(null);
  const [disputeEdits, setDisputeEdits] = useState({});

  const [toast, setToast] = useState(null);

  const [productForm, setProductForm] = useState({
    name: '',
    category: 'Paints',
    price: '',
    condition: 'Like New',
    location: '',
    image: '',
    description: '',
  });

  // Automatically hide notifications
  useEffect(() => {
    if (!toast) return;

    const timer = setTimeout(() => {
      setToast(null);
    }, 3500);

    return () => clearTimeout(timer);
  }, [toast]);

  // Load dashboard data
  useEffect(() => {
    async function loadDashboard() {
      const token = localStorage.getItem('artloop_token');

      try {
        const response = await fetch(`${API}/products`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Unable to load products.');
        }

        setProducts(Array.isArray(data.products) ? data.products : []);
      } catch (err) {
        setError(err.message || 'Unable to load dashboard.');
      }

      if (token) {
        // Load users
        try {
          const response = await fetch(`${API}/admin/users`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.message || 'Unable to load users.');
          }

          setUsers(Array.isArray(data.users) ? data.users : []);
        } catch (err) {
          console.error('Unable to load users:', err);
        }

        // Load disputes
        try {
          setLoadingDisputes(true);

          const response = await fetch(`${API}/disputes`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.message || 'Unable to load disputes.');
          }

          const loadedDisputes = Array.isArray(data.disputes)
            ? data.disputes
            : [];

          setDisputes(loadedDisputes);

          const edits = {};

          loadedDisputes.forEach((dispute) => {
            edits[dispute._id] = {
              status: dispute.status,
              adminNotes: dispute.adminNotes || '',
            };
          });

          setDisputeEdits(edits);
        } catch (err) {
          console.error('Unable to load disputes:', err);
        } finally {
          setLoadingDisputes(false);
        }
      }

      setLoading(false);
    }

    loadDashboard();
  }, []);

  // Logout
  function logout() {
    localStorage.removeItem('artloop_token');
    localStorage.removeItem('artloop_user');
    navigate('/login');
  }

  // Product form changes
  function updateProductForm(event) {
    const { name, value } = event.target;

    setProductForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  // Filter products
  const filteredProducts = products.filter((product) => {
    const search = searchTerm.toLowerCase().trim();

    const matchesSearch =
      product.name?.toLowerCase().includes(search) ||
      product.category?.toLowerCase().includes(search) ||
      product.location?.toLowerCase().includes(search);

    const matchesCategory =
      categoryFilter === 'All Categories' ||
      product.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  // Open edit product modal
  function handleEditProduct(product) {
    setEditingProduct({
      ...product,
      price: String(product.price ?? ''),
    });

    setReplacementImage(null);
    setImagePreview(product.image || '');
    setShowProductForm(false);
  }

  // Close edit modal
  function closeEditModal() {
    if (savingProduct) return;

    setEditingProduct(null);
    setReplacementImage(null);
    setImagePreview('');
  }

  // Update product
  async function handleUpdateProduct(event) {
    event.preventDefault();

    if (!editingProduct?._id) {
      setToast({
        type: 'error',
        message: 'Product ID is missing.',
      });
      return;
    }

    const token = localStorage.getItem('artloop_token');

    if (!token) {
      setToast({
        type: 'error',
        message: 'Please log in again.',
      });
      return;
    }

    const price = Number(editingProduct.price);

    if (!editingProduct.name?.trim()) {
      setToast({
        type: 'error',
        message: 'Please enter a product name.',
      });
      return;
    }

    if (!Number.isFinite(price) || price <= 0) {
      setToast({
        type: 'error',
        message: 'Please enter a valid price.',
      });
      return;
    }

    try {
      setSavingProduct(true);

      const formData = new FormData();

      formData.append('name', editingProduct.name.trim());
      formData.append('category', editingProduct.category);
      formData.append('price', String(price));
      formData.append('condition', editingProduct.condition);
      formData.append('location', editingProduct.location || '');
      formData.append('description', editingProduct.description || '');

      // Attach a new image only if the admin selected one
      if (replacementImage) {
        formData.append('image', replacementImage);
      }

      const response = await fetch(
        `${API}/products/${editingProduct._id}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok || !data.product) {
        throw new Error(data.message || 'Unable to update product.');
      }

      // Update the product in the table immediately
      setProducts((previousProducts) =>
        previousProducts.map((product) =>
          product._id === data.product._id ? data.product : product
        )
      );

      setEditingProduct(null);
      setReplacementImage(null);
      setImagePreview('');

      setToast({
        type: 'success',
        message: 'Product updated successfully!',
      });
    } catch (err) {
      console.error('Update product error:', err);

      setToast({
        type: 'error',
        message: err.message || 'Unable to update product.',
      });
    } finally {
      setSavingProduct(false);
    }
  }

  // Open delete confirmation
  function handleDeleteProduct(productId) {
    setDeletingProductId(productId);
    setShowDeleteModal(true);
  }

  // Delete product
  async function confirmDeleteProduct() {
    if (!deletingProductId || deleting) return;

    const token = localStorage.getItem('artloop_token');

    if (!token) {
      setToast({
        type: 'error',
        message: 'Please log in again.',
      });
      return;
    }

    setDeleting(true);

    try {
      const response = await fetch(
        `${API}/products/${deletingProductId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok || data.success === false) {
        throw new Error(data.message || 'Failed to delete product.');
      }

      setProducts((previousProducts) =>
        previousProducts.filter(
          (product) => product._id !== deletingProductId
        )
      );

      setShowDeleteModal(false);
      setDeletingProductId(null);

      setToast({
        type: 'success',
        message: 'Product deleted successfully!',
      });
    } catch (err) {
      setToast({
        type: 'error',
        message: err.message || 'Failed to delete product.',
      });
    } finally {
      setDeleting(false);
    }
  }

  // Add product
  async function handleAddProduct(event) {
    event.preventDefault();

    const token = localStorage.getItem('artloop_token');

    if (!token) {
      setToast({
        type: 'error',
        message: 'Please log in as an administrator.',
      });
      return;
    }

    const price = Number(productForm.price);

    if (
      !productForm.name.trim() ||
      productForm.price.trim() === '' ||
      !Number.isFinite(price) ||
      price < 0
    ) {
      setToast({
        type: 'error',
        message: 'Enter a valid product name and price.',
      });
      return;
    }

    setSavingProduct(true);

    try {
      const response = await fetch(`${API}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...productForm,
          name: productForm.name.trim(),
          price,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success || !data.product) {
        throw new Error(data.message || 'Unable to add product.');
      }

      setProducts((previousProducts) => [
        data.product,
        ...previousProducts,
      ]);

      setProductForm({
        name: '',
        category: 'Paints',
        price: '',
        condition: 'Like New',
        location: '',
        image: '',
        description: '',
      });

      setShowProductForm(false);
      setActiveSection('Product Listings');

      setToast({
        type: 'success',
        message: 'Product added successfully!',
      });
    } catch (err) {
      setToast({
        type: 'error',
        message: err.message || 'Unable to add product.',
      });
    } finally {
      setSavingProduct(false);
    }
  }

  // Change dispute form values
  function updateDisputeEdit(disputeId, field, value) {
    setDisputeEdits((previous) => ({
      ...previous,
      [disputeId]: {
        ...previous[disputeId],
        [field]: value,
      },
    }));
  }

  // Update dispute status and admin notes
  async function handleUpdateDispute(disputeId) {
    const token = localStorage.getItem('artloop_token');
    const edit = disputeEdits[disputeId];

    if (!token || !edit || updatingDispute) return;

    try {
      setUpdatingDispute(disputeId);

      const response = await fetch(`${API}/disputes/${disputeId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: edit.status,
          adminNotes: edit.adminNotes,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.dispute) {
        throw new Error(data.message || 'Unable to update complaint.');
      }

      setDisputes((previousDisputes) =>
        previousDisputes.map((dispute) =>
          dispute._id === disputeId ? data.dispute : dispute
        )
      );

      setDisputeEdits((previous) => ({
        ...previous,
        [disputeId]: {
          status: data.dispute.status,
          adminNotes: data.dispute.adminNotes || '',
        },
      }));

      setToast({
        type: 'success',
        message: 'Complaint updated successfully!',
      });
    } catch (err) {
      setToast({
        type: 'error',
        message: err.message || 'Unable to update complaint.',
      });
    } finally {
      setUpdatingDispute(null);
    }
  }

  // Refresh disputes
  async function refreshDisputes() {
    const token = localStorage.getItem('artloop_token');

    if (!token) {
      setToast({
        type: 'error',
        message: 'Please log in again.',
      });
      return;
    }

    try {
      setLoadingDisputes(true);

      const response = await fetch(`${API}/disputes`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to refresh disputes.');
      }

      const refreshedDisputes = Array.isArray(data.disputes)
        ? data.disputes
        : [];

      setDisputes(refreshedDisputes);

      const edits = {};

      refreshedDisputes.forEach((dispute) => {
        edits[dispute._id] = {
          status: dispute.status,
          adminNotes: dispute.adminNotes || '',
        };
      });

      setDisputeEdits(edits);
    } catch (err) {
      setToast({
        type: 'error',
        message: err.message || 'Unable to refresh disputes.',
      });
    } finally {
      setLoadingDisputes(false);
    }
  }

  const menuItems = [
    { label: 'Dashboard', icon: '▦' },
    { label: 'Product Listings', icon: '▣' },
    { label: 'User Management', icon: '♙' },
    { label: 'Dispute Management', icon: '⚖' },
    { label: 'Settings', icon: '⚙' },
  ];

  if (loading) {
    return (
      <div className="admin-empty">
        Loading admin dashboard...
      </div>
    );
  }

  return (
    <div className="admin-page">

      {/* Sidebar */}
      <aside className="admin-sidebar">
        <h2 className="admin-brand">
          Art<span>Loop</span>
        </h2>

        <p className="admin-sidebar-subtitle">
          MARKETPLACE MANAGEMENT
        </p>

        <p className="admin-nav-label">MAIN MENU</p>

        {menuItems.map((item) => (
          <button
            key={item.label}
            type="button"
            className={`admin-nav-item ${
              activeSection === item.label ? 'active' : ''
            }`}
            onClick={() => setActiveSection(item.label)}
          >
            <span aria-hidden="true">{item.icon}</span>
            &nbsp; {item.label}
          </button>
        ))}

        <button
          type="button"
          className="admin-nav-item"
          onClick={logout}
        >
          <span aria-hidden="true">⇥</span>
          &nbsp; Logout
        </button>
      </aside>

      {/* Main content */}
      <main className="admin-main">

        <header className="admin-topbar">
          <div className="admin-heading">
            <h1>
              {activeSection === 'Dashboard'
                ? 'Admin Dashboard'
                : activeSection}
            </h1>

            <p>
              {activeSection === 'Dashboard'
                ? 'Welcome to your ArtLoop marketplace overview.'
                : `Manage ${activeSection.toLowerCase()} in ArtLoop.`}
            </p>
          </div>
        </header>

        {error && (
          <p className="admin-error" role="alert">
            {error}
          </p>
        )}

        {activeSection === 'Dashboard' && (
          <section className="admin-stats">

            <div className="admin-stat-card">
              <div className="admin-stat-icon">🎨</div>
              <p className="admin-stat-label">Total Products</p>
              <h2 className="admin-stat-value">{products.length}</h2>
            </div>

            <div className="admin-stat-card">
              <div className="admin-stat-icon">👥</div>
              <p className="admin-stat-label">Registered Users</p>
              <h2 className="admin-stat-value">{users.length}</h2>
            </div>

            <div className="admin-stat-card">
              <div className="admin-stat-icon">⚖</div>
              <p className="admin-stat-label">Total Complaints</p>
              <h2 className="admin-stat-value">{disputes.length}</h2>
            </div>

            <div className="admin-stat-card">
              <div className="admin-stat-icon">🟢</div>
              <p className="admin-stat-label">Marketplace Status</p>
              <h2 className="admin-stat-value">Active</h2>
            </div>

          </section>
        )}

        {activeSection === 'Product Listings' && (
          <>

            {showProductForm && (
              <section
                className="admin-table-card"
                style={{
                  padding: '24px',
                  marginBottom: '24px',
                }}
              >
                <h2>Add New Product</h2>

                <p>
                  Enter the details of the art supply you want to list.
                </p>

                <form
                  onSubmit={handleAddProduct}
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '16px',
                    marginTop: '20px',
                  }}
                >
                  <label>
                    Product Name
                    <input
                      required
                      name="name"
                      value={productForm.name}
                      onChange={updateProductForm}
                      placeholder="e.g. Acrylic Paint Set"
                    />
                  </label>

                  <label>
                    Category
                    <select
                      name="category"
                      value={productForm.category}
                      onChange={updateProductForm}
                    >
                      <option>Paints</option>
                      <option>Brushes</option>
                      <option>Canvas</option>
                      <option>Drawing</option>
                      <option>Craft Tools</option>
                    </select>
                  </label>

                  <label>
                    Price (₹)
                    <input
                      required
                      name="price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={productForm.price}
                      onChange={updateProductForm}
                      placeholder="e.g. 450"
                    />
                  </label>

                  <label>
                    Condition
                    <select
                      name="condition"
                      value={productForm.condition}
                      onChange={updateProductForm}
                    >
                      <option>Like New</option>
                      <option>Good</option>
                      <option>Lightly Used</option>
                      <option>Used</option>
                    </select>
                  </label>

                  <label>
                    Location
                    <input
                      required
                      name="location"
                      value={productForm.location}
                      onChange={updateProductForm}
                      placeholder="e.g. Kochi"
                    />
                  </label>

                  <label>
                    Image URL
                    <input
                      required
                      name="image"
                      type="url"
                      value={productForm.image}
                      onChange={updateProductForm}
                      placeholder="https://example.com/image.jpg"
                    />
                  </label>

                  <label style={{ gridColumn: '1 / -1' }}>
                    Description
                    <textarea
                      required
                      name="description"
                      rows="4"
                      value={productForm.description}
                      onChange={updateProductForm}
                      placeholder="Describe the product..."
                    />
                  </label>

                  <div
                    style={{
                      gridColumn: '1 / -1',
                      display: 'flex',
                      gap: '12px',
                    }}
                  >
                    <button
                      className="admin-add-button"
                      type="submit"
                      disabled={savingProduct}
                    >
                      {savingProduct ? 'Saving...' : 'Save Product'}
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowProductForm(false)}
                      disabled={savingProduct}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </section>
            )}

            <section className="admin-table-card">

              <div className="admin-table-header">
                <div>
                  <h2>Product Listings</h2>
                  <p>Products currently available in ArtLoop.</p>
                </div>

                <div className="admin-product-toolbar">

                  <input
                    type="search"
                    className="admin-search-input"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(event) =>
                      setSearchTerm(event.target.value)
                    }
                  />

                  <select
                    className="admin-category-filter"
                    aria-label="Filter products by category"
                    value={categoryFilter}
                    onChange={(event) =>
                      setCategoryFilter(event.target.value)
                    }
                  >
                    <option value="All Categories">All Categories</option>
                    <option value="Paints">Paints</option>
                    <option value="Brushes">Brushes</option>
                    <option value="Canvas">Canvas</option>
                    <option value="Drawing">Drawing</option>
                    <option value="Craft Tools">Craft Tools</option>
                  </select>

                  <button
                    type="button"
                    className="admin-add-button"
                    onClick={() => {
                      setEditingProduct(null);
                      setShowProductForm(true);
                    }}
                  >
                    + Add Product
                  </button>

                </div>
              </div>

              <div className="admin-results-info">
                Showing {filteredProducts.length} of {products.length} products
              </div>

              {filteredProducts.length === 0 ? (
                <div className="admin-empty">
                  {searchTerm || categoryFilter !== 'All Categories'
                    ? 'No matching products found.'
                    : 'No products found.'}
                </div>
              ) : (
                <div className="admin-table-wrap">
                  <table className="admin-table">

                    <thead>
                      <tr>
                        <th>Image</th>
                        <th>Product</th>
                        <th>Category</th>
                        <th>Price</th>
                        <th>Condition</th>
                        <th>Location</th>
                        <th>Actions</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredProducts.map((product) => (
                        <tr key={product._id}>

                          <td>
                            <img
                              src={product.image}
                              alt={product.name}
                              style={{
                                width: '58px',
                                height: '58px',
                                objectFit: 'cover',
                                borderRadius: '10px',
                              }}
                              onError={(event) => {
                                event.currentTarget.style.visibility = 'hidden';
                              }}
                            />
                          </td>

                          <td className="admin-product-name">
                            {product.name}
                          </td>

                          <td>{product.category}</td>

                          <td className="admin-price">
                            ₹{product.price}
                          </td>

                          <td>
                            <span className="admin-badge">
                              {product.condition}
                            </span>
                          </td>

                          <td>{product.location}</td>

                          <td>
                            <div className="admin-product-actions">

                              <button
                                type="button"
                                className="admin-edit-button"
                                onClick={() => handleEditProduct(product)}
                              >
                                Edit
                              </button>

                              <button
                                type="button"
                                className="admin-delete-button"
                                onClick={() =>
                                  handleDeleteProduct(product._id)
                                }
                              >
                                Delete
                              </button>

                            </div>
                          </td>

                        </tr>
                      ))}
                    </tbody>

                  </table>
                </div>
              )}

            </section>
          </>
        )}

        {activeSection === 'User Management' && (
          <section className="admin-table-card">

            <div className="admin-table-header">
              <div>
                <h2>Registered Users</h2>
                <p>Users registered with ArtLoop.</p>
              </div>

              <span className="admin-badge">
                {users.length} users
              </span>
            </div>

            {users.length === 0 ? (
              <div className="admin-empty">
                No user records are available.
              </div>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table">

                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                    </tr>
                  </thead>

                  <tbody>
                    {users.map((user) => (
                      <tr key={user._id}>
                        <td>{user.name || '—'}</td>
                        <td>{user.email || '—'}</td>
                        <td>
                          <span className="admin-badge">
                            {user.role || 'user'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>

                </table>
              </div>
            )}

          </section>
        )}

        {activeSection === 'Dispute Management' && (
          <section className="admin-table-card">

            <div className="admin-table-header">
              <div>
                <h2>Reported Complaints</h2>
                <p>Review complaints submitted by ArtLoop users.</p>
              </div>

              <button
                type="button"
                className="admin-add-button"
                onClick={refreshDisputes}
                disabled={loadingDisputes}
              >
                {loadingDisputes ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>

            <div className="admin-results-info">
              Total complaints: {disputes.length}
            </div>

            {loadingDisputes ? (
              <div className="admin-empty">
                Loading complaints...
              </div>
            ) : disputes.length === 0 ? (
              <div className="admin-empty">
                No complaints have been submitted yet.
              </div>
            ) : (
              <div className="admin-disputes-list">

                {disputes.map((dispute) => {
                  const edit = disputeEdits[dispute._id] || {
                    status: dispute.status,
                    adminNotes: dispute.adminNotes || '',
                  };

                  return (
                    <article
                      className="admin-dispute-card"
                      key={dispute._id}
                    >

                      <div className="admin-dispute-header">
                        <div>
                          <h3>{dispute.reason}</h3>
                          <small>
                            Submitted:{' '}
                            {new Date(dispute.createdAt).toLocaleString()}
                          </small>
                        </div>

                        <span
                          className={`admin-dispute-status ${
                            (edit.status || dispute.status)
                              ?.toLowerCase()
                              .replace(/\s+/g, '-')
                          }`}
                        >
                          {edit.status || dispute.status}
                        </span>
                      </div>

                      <div className="admin-dispute-details">
                        <p>
                          <strong>Reported By:</strong>{' '}
                          {dispute.reportedBy?.name || 'Unknown'}
                        </p>

                        <p>
                          <strong>Buyer Email:</strong>{' '}
                          {dispute.reportedBy?.email || '—'}
                        </p>

                        <p>
                          <strong>Reported Seller:</strong>{' '}
                          {dispute.againstUser?.name || 'Unknown'}
                        </p>

                        <p>
                          <strong>Seller Email:</strong>{' '}
                          {dispute.againstUser?.email || '—'}
                        </p>

                        <p>
                          <strong>Product:</strong>{' '}
                          {dispute.product?.name ||
                            dispute.product?.title ||
                            'Not specified'}
                        </p>

                        <p>
                          <strong>Description:</strong>{' '}
                          {dispute.description}
                        </p>
                      </div>

                      <div className="admin-dispute-controls">

                        <label>
                          Complaint Status

                          <select
                            value={edit.status}
                            onChange={(event) =>
                              updateDisputeEdit(
                                dispute._id,
                                'status',
                                event.target.value
                              )
                            }
                          >
                            <option value="Pending">Pending</option>
                            <option value="Under Review">Under Review</option>
                            <option value="Resolved">Resolved</option>
                            <option value="Rejected">Rejected</option>
                          </select>
                        </label>

                        <label>
                          Admin Resolution Notes

                          <textarea
                            rows="3"
                            maxLength="2000"
                            value={edit.adminNotes}
                            onChange={(event) =>
                              updateDisputeEdit(
                                dispute._id,
                                'adminNotes',
                                event.target.value
                              )
                            }
                            placeholder="Enter your review or resolution notes..."
                          />
                        </label>

                        <button
                          type="button"
                          className="admin-add-button"
                          disabled={updatingDispute === dispute._id}
                          onClick={() =>
                            handleUpdateDispute(dispute._id)
                          }
                        >
                          {updatingDispute === dispute._id
                            ? 'Saving...'
                            : 'Save Complaint Update'}
                        </button>

                      </div>

                    </article>
                  );
                })}

              </div>
            )}

          </section>
        )}

        {activeSection === 'Settings' && (
          <section
            className="admin-table-card"
            style={{ padding: '24px' }}
          >
            <h2>Settings</h2>
            <p>ArtLoop marketplace settings.</p>

            <button
              type="button"
              className="admin-logout"
              onClick={() => navigate('/marketplace')}
            >
              Return to Marketplace
            </button>
          </section>
        )}

        <footer className="admin-footer">
          ArtLoop Admin Panel · Marketplace Management
        </footer>

        {editingProduct && (
          <div
            className="admin-modal-overlay"
            onClick={closeEditModal}
          >
            <div
              className="admin-modal"
              onClick={(event) => event.stopPropagation()}
            >

              <div className="admin-modal-header">
                <div>
                  <h2>Edit Product</h2>
                  <p>Update your marketplace listing.</p>
                </div>

                <button
                  type="button"
                  className="admin-modal-close"
                  disabled={savingProduct}
                  onClick={closeEditModal}
                >
                  &times;
                </button>
              </div>

              <form
                onSubmit={handleUpdateProduct}
                className="admin-product-form"
              >

                <label>
                  Product Name
                  <input
                    type="text"
                    value={editingProduct.name || ''}
                    onChange={(event) =>
                      setEditingProduct({
                        ...editingProduct,
                        name: event.target.value,
                      })
                    }
                    required
                  />
                </label>

                <label>
                  Category
                  <select
                    value={editingProduct.category || 'Paints'}
                    onChange={(event) =>
                      setEditingProduct({
                        ...editingProduct,
                        category: event.target.value,
                      })
                    }
                  >
                    <option value="Paints">Paints</option>
                    <option value="Brushes">Brushes</option>
                    <option value="Canvas">Canvas</option>
                    <option value="Drawing">Drawing</option>
                    <option value="Craft Tools">Craft Tools</option>
                  </select>
                </label>

                <label>
                  Price (₹)
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={editingProduct.price}
                    onChange={(event) =>
                      setEditingProduct({
                        ...editingProduct,
                        price: event.target.value,
                      })
                    }
                    required
                  />
                </label>

                <label>
                  Condition
                  <select
                    value={editingProduct.condition || 'Like New'}
                    onChange={(event) =>
                      setEditingProduct({
                        ...editingProduct,
                        condition: event.target.value,
                      })
                    }
                  >
                    <option value="Like New">Like New</option>
                    <option value="Good">Good</option>
                    <option value="Lightly Used">Lightly Used</option>
                    <option value="Used">Used</option>
                  </select>
                </label>

                <label>
                  Location
                  <input
                    type="text"
                    value={editingProduct.location || ''}
                    onChange={(event) =>
                      setEditingProduct({
                        ...editingProduct,
                        location: event.target.value,
                      })
                    }
                  />
                </label>

                <label style={{ gridColumn: '1 / -1' }}>
                  Product Image

                  {imagePreview && (
                    <img
                      src={imagePreview}
                      alt="Product preview"
                      style={{
                        width: '150px',
                        height: '150px',
                        objectFit: 'cover',
                        borderRadius: '12px',
                        display: 'block',
                        marginBottom: '12px',
                      }}
                    />
                  )}

                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => {
                      const file = event.target.files?.[0];

                      if (!file) return;

                      if (!file.type.startsWith('image/')) {
                        alert('Please select a valid image.');
                        event.target.value = '';
                        return;
                      }

                      if (file.size > 5 * 1024 * 1024) {
                        alert('Image size must be less than 5 MB.');
                        event.target.value = '';
                        return;
                      }

                      setReplacementImage(file);
                      setImagePreview(URL.createObjectURL(file));
                    }}
                  />

                  <small>Leave empty to keep the current image.</small>
                </label>

                <label style={{ gridColumn: '1 / -1' }}>
                  Description
                  <textarea
                    rows="3"
                    value={editingProduct.description || ''}
                    onChange={(event) =>
                      setEditingProduct({
                        ...editingProduct,
                        description: event.target.value,
                      })
                    }
                  />
                </label>

                <div className="admin-modal-actions">
                  <button
                    type="button"
                    className="admin-cancel-button"
                    disabled={savingProduct}
                    onClick={closeEditModal}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="admin-save-button"
                    disabled={savingProduct}
                  >
                    {savingProduct ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>

              </form>
            </div>
          </div>
        )}

        {showDeleteModal && (
          <div
            className="admin-modal-overlay"
            onClick={() => {
              if (!deleting) {
                setShowDeleteModal(false);
                setDeletingProductId(null);
              }
            }}
          >
            <div
              className="admin-delete-modal"
              onClick={(event) => event.stopPropagation()}
            >

              <div className="admin-delete-icon">!</div>

              <h2>Delete Product?</h2>

              <p>
                Are you sure you want to delete this product?
                This action cannot be undone.
              </p>

              <div className="admin-modal-actions">
                <button
                  type="button"
                  className="admin-cancel-button"
                  disabled={deleting}
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeletingProductId(null);
                  }}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="admin-confirm-delete-button"
                  disabled={deleting}
                  onClick={confirmDeleteProduct}
                >
                  {deleting ? 'Deleting...' : 'Delete Product'}
                </button>
              </div>

            </div>
          </div>
        )}

        {toast && (
          <div
            className={`admin-toast admin-toast-${toast.type}`}
            role="status"
            aria-live="polite"
          >
            <span className="admin-toast-icon">
              {toast.type === 'success' ? '✓' : '!'}
            </span>

            <span>{toast.message}</span>

            <button
              type="button"
              className="admin-toast-close"
              aria-label="Dismiss notification"
              onClick={() => setToast(null)}
            >
              &times;
            </button>
          </div>
        )}

      </main>
    </div>
  );
}

export default Admin;