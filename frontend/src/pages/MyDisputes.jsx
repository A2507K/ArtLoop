import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, RefreshCw } from 'lucide-react';
import './MyDisputes.css';

const API = 'http://localhost:3000/api';

function MyDisputes() {
const navigate = useNavigate();
const token = localStorage.getItem('artloop_token');

const [disputes, setDisputes] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState('');

const loadDisputes = async () => {
try {
setError('');

  const response = await fetch(`${API}/disputes/my`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Unable to load disputes.');
  }

  setDisputes(data.disputes || []);
} catch (err) {
  setError(err.message);
} finally {
  setLoading(false);
}

};

useEffect(() => {
if (!token) {
navigate('/login');
return;
}

loadDisputes();

}, []);

const getStatusClass = (status) => {
return status.toLowerCase().replace(/\s+/g, '-');
};

return ( <div className="my-disputes-page"> <header className="disputes-header">
<button onClick={() => navigate('/marketplace')}> <ArrowLeft size={18} /> Back </button>

    <h1>My Disputes</h1>

    <button onClick={loadDisputes}>
      <RefreshCw size={16} /> Refresh
    </button>
  </header>

  <main className="disputes-container">
    <div className="disputes-title">
      <FileText size={30} />
      <div>
        <h2>My Complaints</h2>
        <p>Track the progress of your reported problems.</p>
      </div>
    </div>

    {loading ? (
      <p className="disputes-message">Loading complaints...</p>
    ) : error ? (
      <p className="disputes-error">{error}</p>
    ) : disputes.length === 0 ? (
      <div className="disputes-empty">
        <FileText size={48} />
        <h3>No complaints yet</h3>
        <p>Your submitted complaints will appear here.</p>
        <button onClick={() => navigate('/marketplace')}>
          Explore Marketplace
        </button>
      </div>
    ) : (
      <div className="disputes-list">
        {disputes.map((dispute) => (
          <article className="dispute-card" key={dispute._id}>
            <div className="dispute-card-header">
              <h3>{dispute.reason}</h3>

              <span className={`dispute-status ${getStatusClass(dispute.status)}`}>
                {dispute.status}
              </span>
            </div>

            <p>
              <strong>Reported Seller:</strong>{' '}
              {dispute.againstUser?.name || 'Unknown'}
            </p>

            <p>
              <strong>Description:</strong> {dispute.description}
            </p>

            <p>
              <strong>Submitted:</strong>{' '}
              {new Date(dispute.createdAt).toLocaleString()}
            </p>

            {dispute.product && (
              <p>
                <strong>Product:</strong>{' '}
                {dispute.product.name || dispute.product.title || 'Product'}
              </p>
            )}

            {dispute.adminNotes && (
              <div className="admin-resolution">
                <strong>Admin Resolution Notes</strong>
                <p>{dispute.adminNotes}</p>
              </div>
            )}
          </article>
        ))}
      </div>
    )}
  </main>
</div>

);
}

export default MyDisputes;
