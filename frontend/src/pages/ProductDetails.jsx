import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './ProductDetails.css';

function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [markingSold, setMarkingSold] = useState(false);

  // Review states
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewMessage, setReviewMessage] = useState('');

  // Swap request states
  const [myProducts, setMyProducts] = useState([]);
  const [showSwapForm, setShowSwapForm] = useState(false);
  const [selectedOfferedProduct, setSelectedOfferedProduct] = useState('');
  const [swapMessage, setSwapMessage] = useState('');
  const [submittingSwap, setSubmittingSwap] = useState(false);
  const [swapFeedback, setSwapFeedback] = useState('');

  // Dispute states
const [showDisputeForm, setShowDisputeForm] = useState(false);
const [disputeReason, setDisputeReason] = useState('Scam');
const [disputeDescription, setDisputeDescription] = useState('');
const [submittingDispute, setSubmittingDispute] = useState(false);
const [disputeFeedback, setDisputeFeedback] = useState('');

  const token = localStorage.getItem('artloop_token');

  let currentUser = null;

  try {
    currentUser = JSON.parse(localStorage.getItem('artloop_user'));
  } catch {
    currentUser = null;
  }

  // Fetch product details
  const fetchProduct = async () => {
    try {
      const response = await fetch(
        `http://localhost:3000/api/products/${id}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Product not found');
      }

      setProduct(data.product);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProduct();
  }, [id]);

  // Mark product as sold
  const handleMarkAsSold = async () => {
    if (!window.confirm('Are you sure you want to mark this product as sold?')) {
      return;
    }

    try {
      setMarkingSold(true);

      const response = await fetch(
        `http://localhost:3000/api/products/${id}/sold`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to mark product as sold.');
      }

      setProduct((previous) => ({
        ...previous,
        ...data.product,
        seller: previous.seller,
      }));

      alert('Product marked as sold successfully!');
    } catch (err) {
      alert(err.message);
    } finally {
      setMarkingSold(false);
    }
  };

  // Load user's available products for swapping
  const openSwapForm = async () => {
    if (!token) {
      alert('Please login to request a swap.');
      navigate('/login');
      return;
    }

    try {
      setSwapFeedback('');

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
        throw new Error(data.message || 'Unable to load your products.');
      }

      const availableProducts = (data.products || []).filter(
        (item) => !item.isSold && item._id !== id
      );

      setMyProducts(availableProducts);
      setShowSwapForm(true);
    } catch (err) {
      setSwapFeedback(err.message);
    }
  };

  // Submit swap request
  const handleSubmitSwap = async (e) => {
    e.preventDefault();

    setSwapFeedback('');

    if (!token) {
      navigate('/login');
      return;
    }

    if (!selectedOfferedProduct) {
      setSwapFeedback('Please select a product to offer.');
      return;
    }

    try {
      setSubmittingSwap(true);

      const response = await fetch(
        'http://localhost:3000/api/swaps',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            requestedProductId: id,
            offeredProductId: selectedOfferedProduct,
            message: swapMessage,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to send swap request.');
      }

      setSwapFeedback('Swap request sent successfully! 🎉');
      setSelectedOfferedProduct('');
      setSwapMessage('');
      setShowSwapForm(false);
    } catch (err) {
      setSwapFeedback(err.message);
    } finally {
      setSubmittingSwap(false);
    }
  };
// Start chat with seller
const handleChatWithSeller = async () => {
  if (!token) {
    alert('Please login to chat with the seller.');
    navigate('/login');
    return;
  }

  try {
    const response = await fetch(
      `http://localhost:3000/api/chats/product/${id}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }

    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Unable to start chat.');
    }

    navigate(`/chat?id=${data.chat._id}`);
  } catch (err) {
    alert(err.message);
  }
};

// Submit a dispute against seller
const handleSubmitDispute = async (e) => {
  e.preventDefault();

  if (!token) {
    navigate('/login');
    return;
  }

  if (!disputeDescription.trim()) {
    setDisputeFeedback('Please describe your complaint.');
    return;
  }

  try {
    setSubmittingDispute(true);
    setDisputeFeedback('');

    const response = await fetch(
      'http://localhost:3000/api/disputes',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          againstUser: sellerId,
          product: id,
          reason: disputeReason,
          description: disputeDescription.trim(),
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Unable to submit complaint.');
    }

    setDisputeFeedback('Complaint submitted successfully!');

    setDisputeDescription('');
    setShowDisputeForm(false);

  } catch (err) {
    setDisputeFeedback(err.message);
  } finally {
    setSubmittingDispute(false);
  }
};

  // Submit product review
  const handleSubmitReview = async (e) => {
    e.preventDefault();

    setReviewMessage('');

    if (!token) {
      alert('Please login to submit a review.');
      navigate('/login');
      return;
    }

    if (rating < 1 || rating > 5) {
      setReviewMessage('Please select a star rating.');
      return;
    }

    if (!comment.trim()) {
      setReviewMessage('Please write your review.');
      return;
    }

    try {
      setSubmittingReview(true);

      const response = await fetch(
        `http://localhost:3000/api/products/${id}/reviews`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            rating,
            comment,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to submit review.');
      }

      setComment('');
      setRating(0);
      setReviewMessage('Review submitted successfully!');

      await fetchProduct();
    } catch (err) {
      setReviewMessage(err.message);
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return <p className="details-message">Loading product...</p>;
  }

  if (error) {
    return <p className="details-message">{error}</p>;
  }

  if (!product) return null;

  const seller = product.seller;
  const isSold = product.isSold;

  const currentUserId =
    currentUser?._id || currentUser?.id || currentUser?.userId;

  const sellerId =
    typeof seller === 'object' ? seller?._id : seller;

  const isOwner =
    currentUserId &&
    sellerId &&
    currentUserId.toString() === sellerId.toString();

  const isAdmin = currentUser?.role === 'admin';

  const canMarkAsSold = token && (isOwner || isAdmin);

  // Review information
  const reviews = product.reviews || [];

  const totalReviews = reviews.length;

  const averageRating =
    totalReviews > 0
      ? (
          reviews.reduce(
            (total, review) => total + review.rating,
            0
          ) / totalReviews
        ).toFixed(1)
      : '0.0';

  const alreadyReviewed = reviews.some((review) => {
    const reviewerId =
      typeof review.user === 'object'
        ? review.user?._id
        : review.user;

    return (
      currentUserId &&
      reviewerId?.toString() === currentUserId.toString()
    );
  });

  const canReview =
    token && !isOwner && !isAdmin && !alreadyReviewed;

  // Only buyers can request swaps
  const canRequestSwap =
    !isOwner && !isAdmin && !isSold;

  return (
    <div className="product-details-page">

      <button
        className="back-button"
        onClick={() => navigate('/marketplace')}
      >
        ← Back to Marketplace
      </button>

      <div className="product-details-card">

        <div className="details-image">
          <img src={product.image} alt={product.name} />
        </div>

        <div className="details-content">

          <span className="details-category">
            {product.category}
          </span>

          <h1>{product.name}</h1>

          <h2>
            ₹{Number(product.price).toLocaleString('en-IN')}
          </h2>

          <p>
            <strong>Condition:</strong> {product.condition}
          </p>

          <p>
            <strong>Location:</strong> {product.location}
          </p>

          <p>
            <strong>Status:</strong>{' '}
            <span
              style={{
                color: isSold ? '#c0392b' : '#32845a',
                fontWeight: 'bold',
              }}
            >
              {isSold ? 'Sold' : 'Available'}
            </span>
          </p>

          {/* Mark as Sold */}
          {canMarkAsSold && !isSold && (
            <button
              className="contact-seller-button"
              onClick={handleMarkAsSold}
              disabled={markingSold}
              style={{
                backgroundColor: '#c0392b',
                border: 'none',
                cursor: markingSold ? 'not-allowed' : 'pointer',
                marginBottom: '15px',
              }}
            >
              {markingSold ? 'Updating...' : '✓ Mark as Sold'}
            </button>
          )}

          {canMarkAsSold && isSold && (
            <p style={{ color: '#c0392b', fontWeight: 'bold' }}>
              ✓ You marked this product as sold.
            </p>
          )}

          {/* Request Swap */}
          {canRequestSwap && (
            <div className="swap-product-action">

              <button
                type="button"
                className="contact-seller-button"
                onClick={openSwapForm}
                style={{
                  backgroundColor: '#496b50',
                  border: 'none',
                  marginBottom: '15px',
                  cursor: 'pointer',
                }}
              >
                🔄 Request Swap
              </button>

              {swapFeedback && (
                <p
                  style={{
                    color: swapFeedback.includes('successfully')
                      ? '#32845a'
                      : '#c0392b',
                    fontWeight: '600',
                    marginBottom: '12px',
                  }}
                >
                  {swapFeedback}
                </p>
              )}

              {showSwapForm && (
                <form
                  onSubmit={handleSubmitSwap}
                  style={{
                    padding: '20px',
                    border: '1px solid #dce5da',
                    borderRadius: '12px',
                    backgroundColor: '#f7f8f3',
                    marginBottom: '20px',
                  }}
                >

                  <h3 style={{ color: '#304b38' }}>
                    Request a Product Swap
                  </h3>

                  <p>
                    Select one of your available products to offer
                    in exchange for this item.
                  </p>

                  {myProducts.length === 0 ? (
                    <div>
                      <p>
                        You don't have any available products to offer.
                      </p>

                      <button
                        type="button"
                        className="contact-seller-button"
                        onClick={() => navigate('/sell')}
                      >
                        List a Product
                      </button>
                    </div>
                  ) : (
                    <>
                      <label
                        htmlFor="offeredProduct"
                        style={{
                          display: 'block',
                          marginBottom: '8px',
                          fontWeight: '600',
                        }}
                      >
                        Select Your Product
                      </label>

                      <select
                        id="offeredProduct"
                        value={selectedOfferedProduct}
                        onChange={(e) =>
                          setSelectedOfferedProduct(e.target.value)
                        }
                        required
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: '1px solid #dce5da',
                          borderRadius: '8px',
                          marginBottom: '15px',
                        }}
                      >
                        <option value="">
                          Choose a product
                        </option>

                        {myProducts.map((item) => (
                          <option
                            key={item._id}
                            value={item._id}
                          >
                            {item.name} - ₹
                            {Number(item.price).toLocaleString('en-IN')}
                          </option>
                        ))}
                      </select>

                      <label
                        htmlFor="swapMessage"
                        style={{
                          display: 'block',
                          marginBottom: '8px',
                          fontWeight: '600',
                        }}
                      >
                        Message to Seller (Optional)
                      </label>

                      <textarea
                        id="swapMessage"
                        value={swapMessage}
                        onChange={(e) =>
                          setSwapMessage(e.target.value)
                        }
                        placeholder="Explain why you would like to exchange these products..."
                        maxLength={500}
                        rows={4}
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: '1px solid #dce5da',
                          borderRadius: '8px',
                          marginBottom: '8px',
                          resize: 'vertical',
                        }}
                      />

                      <p style={{ fontSize: '12px' }}>
                        {swapMessage.length}/500 characters
                      </p>

                      <div
                        style={{
                          display: 'flex',
                          gap: '10px',
                          marginTop: '15px',
                        }}
                      >
                        <button
                          type="submit"
                          className="contact-seller-button"
                          disabled={submittingSwap}
                        >
                          {submittingSwap
                            ? 'Sending...'
                            : 'Send Swap Request'}
                        </button>

                        <button
                          type="button"
                          onClick={() => setShowSwapForm(false)}
                          style={{
                            padding: '10px 16px',
                            border: '1px solid #dce5da',
                            borderRadius: '8px',
                            background: 'white',
                            color: '#496b50',
                            cursor: 'pointer',
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </>
                  )}
                </form>
              )}

            </div>
          )}

          <div className="details-description">
            <h3>Description</h3>
            <p>
              {product.description || 'No description provided.'}
            </p>
          </div>

          {/* Seller Information */}
          <div className="seller-contact">

            <h3>Seller Information</h3>

            <p>
              <strong>Name:</strong>{' '}
              {seller?.name || 'Seller'}
            </p>

            {!isOwner && !isAdmin && (
  <button
    type="button"
    onClick={() => {
      if (!token) {
        navigate('/login');
        return;
      }

      setShowDisputeForm(!showDisputeForm);
    }}
    style={{
      backgroundColor: '#fff0ed',
      color: '#c0392b',
      border: '1px solid #e6b8ae',
      padding: '11px 18px',
      borderRadius: '8px',
      cursor: 'pointer',
      marginBottom: '15px',
      fontWeight: '600',
    }}
  >
    🚩 Report Seller
  </button>
)}

{showDisputeForm && (
  <form
    onSubmit={handleSubmitDispute}
    style={{
      padding: '20px',
      background: '#fff8f6',
      border: '1px solid #edc5bb',
      borderRadius: '12px',
      marginBottom: '20px',
    }}
  >
    <h3>Report a Problem</h3>

    <label>Reason for Complaint</label>

    <select
      value={disputeReason}
      onChange={(e) => setDisputeReason(e.target.value)}
      required
      style={{
        display: 'block',
        width: '100%',
        padding: '12px',
        margin: '10px 0',
        borderRadius: '8px',
      }}
    >
      <option value="Scam">Scam / Fraud</option>
      <option value="Payment Issue">Payment Issue</option>
      <option value="Product Issue">Product Issue</option>
      <option value="Other">Other</option>
    </select>

    <label>Describe your complaint</label>

    <textarea
      value={disputeDescription}
      onChange={(e) => setDisputeDescription(e.target.value)}
      placeholder="Explain what happened..."
      maxLength={2000}
      rows={5}
      required
      style={{
        display: 'block',
        width: '100%',
        padding: '12px',
        margin: '10px 0',
        borderRadius: '8px',
        resize: 'vertical',
      }}
    />

    <p>{disputeDescription.length}/2000 characters</p>

    <button
      type="submit"
      disabled={submittingDispute}
      className="contact-seller-button"
    >
      {submittingDispute ? 'Submitting...' : 'Submit Complaint'}
    </button>

    <button
      type="button"
      onClick={() => setShowDisputeForm(false)}
      style={{
        marginLeft: '10px',
        padding: '10px 16px',
        cursor: 'pointer',
      }}
    >
      Cancel
    </button>
  </form>
)}

{disputeFeedback && (
  <p style={{ color: '#c0392b', fontWeight: '600' }}>
    {disputeFeedback}
  </p>
)}

            {!isSold && !isOwner && !isAdmin && (
  <button
    type="button"
    className="contact-seller-button"
    onClick={handleChatWithSeller}
    style={{
      backgroundColor: '#496b50',
      border: 'none',
      cursor: 'pointer',
      marginBottom: '12px',
    }}
  >
    💬 Chat with Seller
  </button>
)}

            {isSold ? (
              <p>This product has already been sold.</p>
            ) : (
              <>
                {seller?.phone && (
                  <>
                    <a
                      className="contact-seller-button"
                      href={`tel:${seller.phone}`}
                    >
                      📞 Call Seller
                    </a>

                    <a
                      className="contact-seller-button whatsapp-button"
                      href={`https://wa.me/${seller.phone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      💬 Contact on WhatsApp
                    </a>
                  </>
                )}

                {seller?.email && (
                  <a
                    className="contact-seller-button"
                    href={`mailto:${seller.email}?subject=${encodeURIComponent(
                      `Enquiry about ${product.name}`
                    )}`}
                  >
                    ✉️ Email Seller
                  </a>
                )}

                {!seller?.phone && !seller?.email && (
                  <p>Seller contact information unavailable.</p>
                )}
              </>
            )}

          </div>

        </div>
      </div>

      {/* PRODUCT REVIEWS SECTION */}
      <div className="reviews-section">

        <h2>Customer Reviews ⭐</h2>

        <div className="average-rating">

          <h1>{averageRating} / 5</h1>

          <div className="rating-stars">
            {'★'.repeat(Math.round(Number(averageRating)))}
            {'☆'.repeat(5 - Math.round(Number(averageRating)))}
          </div>

          <p>
            Based on {totalReviews} review
            {totalReviews !== 1 ? 's' : ''}
          </p>

        </div>

        {/* Review Form */}
        {canReview && (
          <form
            className="review-form"
            onSubmit={handleSubmitReview}
          >

            <h3>Write a Review</h3>

            <p>How would you rate this product?</p>

            <div className="star-rating-input">

              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  style={{
                    color: star <= rating ? '#f5a623' : '#ccc',
                    background: 'none',
                    border: 'none',
                    fontSize: '32px',
                    cursor: 'pointer',
                  }}
                >
                  ★
                </button>
              ))}

            </div>

            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience with this product..."
              maxLength={1000}
              rows={4}
            />

            <p>{comment.length}/1000 characters</p>

            <button
              type="submit"
              className="contact-seller-button"
              disabled={submittingReview}
            >
              {submittingReview ? 'Submitting...' : 'Submit Review'}
            </button>

            {reviewMessage && (
              <p>{reviewMessage}</p>
            )}

          </form>
        )}

        {!token && (
          <p>
            Please{' '}
            <button onClick={() => navigate('/login')}>
              login
            </button>
            {' '}to write a review.
          </p>
        )}

        {isOwner && (
          <p>You cannot review your own product.</p>
        )}

        {isAdmin && (
          <p>Admin accounts cannot submit product reviews.</p>
        )}

        {alreadyReviewed && (
          <p>You have already reviewed this product. Thank you!</p>
        )}

        {/* Display Reviews */}
        <div className="reviews-list">

          <h3>All Reviews ({totalReviews})</h3>

          {totalReviews === 0 ? (
            <p>No reviews yet. Be the first to review this product!</p>
          ) : (
            reviews.map((review) => (
              <div className="review-card" key={review._id}>

                <div className="review-header">

                  <strong>
                    {review.user?.name || 'ArtLoop User'}
                  </strong>

                  <span>
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>

                </div>

                <div className="review-stars">
                  {'★'.repeat(review.rating)}
                  {'☆'.repeat(5 - review.rating)}
                </div>

                <p>{review.comment}</p>

              </div>
            ))
          )}

        </div>

      </div>

    </div>
  );
}

export default ProductDetails;