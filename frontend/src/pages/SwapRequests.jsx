import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowLeftRight,
  CheckCircle,
  XCircle,
  Clock,
  Package,
  RefreshCw,
} from 'lucide-react';

import './SwapRequests.css';

function SwapRequests() {
  const navigate = useNavigate();

  const [sentRequests, setSentRequests] = useState([]);
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('received');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState('');

  const token = localStorage.getItem('artloop_token');

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError('');

      const [sentResponse, receivedResponse] = await Promise.all([
        fetch('http://localhost:3000/api/swaps/sent', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('http://localhost:3000/api/swaps/received', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const sentData = await sentResponse.json();
      const receivedData = await receivedResponse.json();

      if (!sentResponse.ok) {
        throw new Error(sentData.message || 'Failed to load sent requests.');
      }

      if (!receivedResponse.ok) {
        throw new Error(
          receivedData.message || 'Failed to load received requests.'
        );
      }

      setSentRequests(sentData.requests || []);
      setReceivedRequests(receivedData.requests || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAction = async (requestId, action) => {
    try {
      setProcessingId(requestId);
      setError('');

      const endpoint =
        action === 'Cancelled'
          ? `http://localhost:3000/api/swaps/${requestId}/cancel`
          : `http://localhost:3000/api/swaps/${requestId}/respond`;

      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        ...(action !== 'Cancelled'
          ? { body: JSON.stringify({ action }) }
          : {}),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to process request.');
      }

      await fetchRequests();
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessingId('');
    }
  };

  const displayedRequests =
    activeTab === 'received' ? receivedRequests : sentRequests;

  const getStatusClass = (status) => {
    return status?.toLowerCase() || 'pending';
  };

  const renderRequest = (request, isReceived) => {
    const requestedProduct = request.requestedProduct;
    const offeredProduct = request.offeredProduct;

    return (
      <div className="swap-request-card" key={request._id}>
        <div className="swap-request-header">
          <span className={`swap-status ${getStatusClass(request.status)}`}>
            {request.status === 'Pending' && <Clock size={14} />}
            {request.status}
          </span>

          <small>
            {new Date(request.createdAt).toLocaleDateString('en-IN')}
          </small>
        </div>

        <div className="swap-products">
          <div className="swap-product">
            <img
              src={requestedProduct?.image}
              alt={requestedProduct?.name || 'Requested product'}
            />
            <span>Requested Item</span>
            <h3>{requestedProduct?.name || 'Product unavailable'}</h3>
            {requestedProduct && (
              <strong>
                ₹{Number(requestedProduct.price).toLocaleString('en-IN')}
              </strong>
            )}
          </div>

          <div className="swap-arrow">
            <ArrowLeftRight size={27} />
          </div>

          <div className="swap-product">
            <img
              src={offeredProduct?.image}
              alt={offeredProduct?.name || 'Offered product'}
            />
            <span>Offered Item</span>
            <h3>{offeredProduct?.name || 'Product unavailable'}</h3>
            {offeredProduct && (
              <strong>
                ₹{Number(offeredProduct.price).toLocaleString('en-IN')}
              </strong>
            )}
          </div>
        </div>

        <div className="swap-request-info">
          <p>
            <strong>{isReceived ? 'From: ' : 'To: '}</strong>
            {isReceived
              ? request.requester?.name || 'Unknown user'
              : request.receiver?.name || 'Unknown user'}
          </p>

          {request.message && (
            <p>
              <strong>Message:</strong> {request.message}
            </p>
          )}
        </div>

        {request.status === 'Pending' && (
          <div className="swap-actions">
            {isReceived ? (
              <>
                <button
                  className="swap-accept-button"
                  disabled={processingId === request._id}
                  onClick={() => handleAction(request._id, 'Accepted')}
                >
                  <CheckCircle size={16} />
                  Accept
                </button>

                <button
                  className="swap-reject-button"
                  disabled={processingId === request._id}
                  onClick={() => handleAction(request._id, 'Rejected')}
                >
                  <XCircle size={16} />
                  Reject
                </button>
              </>
            ) : (
              <button
                className="swap-cancel-button"
                disabled={processingId === request._id}
                onClick={() => handleAction(request._id, 'Cancelled')}
              >
                Cancel Request
              </button>
            )}
          </div>
        )}

        {request.status === 'Accepted' && (
          <p className="swap-success-message">
            <CheckCircle size={16} />
            Swap accepted successfully!
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="swap-requests-page">
      <div className="swap-requests-container">
        <button
          className="swap-back-button"
          onClick={() => navigate('/profile')}
        >
          <ArrowLeft size={17} />
          Back to Profile
        </button>

        <div className="swap-page-header">
          <div>
            <span>ARTLOOP EXCHANGE</span>
            <h1>Swap Requests 🔄</h1>
            <p>Exchange art supplies and give creativity a new life.</p>
          </div>

          <button
            className="swap-refresh-button"
            onClick={fetchRequests}
            disabled={loading}
          >
            <RefreshCw size={17} />
            Refresh
          </button>
        </div>

        <div className="swap-tabs">
          <button
            className={activeTab === 'received' ? 'active' : ''}
            onClick={() => setActiveTab('received')}
          >
            Received ({receivedRequests.length})
          </button>

          <button
            className={activeTab === 'sent' ? 'active' : ''}
            onClick={() => setActiveTab('sent')}
          >
            Sent ({sentRequests.length})
          </button>
        </div>

        {error && <p className="swap-error">{error}</p>}

        {loading ? (
          <p className="swap-loading">Loading swap requests...</p>
        ) : displayedRequests.length === 0 ? (
          <div className="swap-empty">
            <Package size={48} />
            <h2>No swap requests yet</h2>
            <p>
              {activeTab === 'received'
                ? 'You have not received any swap requests.'
                : 'You have not sent any swap requests.'}
            </p>

            <button onClick={() => navigate('/marketplace')}>
              Explore Marketplace
            </button>
          </div>
        ) : (
          <div className="swap-requests-grid">
            {displayedRequests.map((request) =>
              renderRequest(request, activeTab === 'received')
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default SwapRequests;