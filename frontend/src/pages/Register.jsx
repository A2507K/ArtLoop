import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Palette,
  User,
  Mail,
  Lock,
  Phone,
  ArrowRight,
} from 'lucide-react';
import API_BASE_URL from '../api';
import './Auth.css';

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(event) {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError('');
    setSuccess('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must contain at least 8 characters.');
      return;
    }

    if (!/^\+?[0-9\s-]{10,15}$/.test(formData.phone.trim())) {
      setError('Please enter a valid phone number.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/auth/register`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: formData.name.trim(),
            email: formData.email.trim(),
            phone: formData.phone.trim(),
            password: formData.password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed.');
      }

      setSuccess(
        'Account created successfully! Redirecting to login...'
      );

      setTimeout(() => {
        navigate('/login');
      }, 1500);

    } catch (err) {
      setError(
        err.message ||
        'Unable to connect to the server. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <Link to="/" className="auth-brand">
        <span className="auth-brand-icon">
          <Palette size={25} />
        </span>
        <span>ArtLoop</span>
      </Link>

      <section className="auth-card">
        <div className="auth-heading">
          <span className="auth-eyebrow">JOIN THE COMMUNITY</span>
          <h1>Make room for creativity.</h1>
          <p>
            Create an account to buy, sell, and exchange art supplies.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <label htmlFor="name">Full name</label>

          <div className="auth-input">
            <User size={19} />
            <input
              id="name"
              name="name"
              type="text"
              placeholder="Your full name"
              value={formData.name}
              onChange={handleChange}
              autoComplete="name"
              required
            />
          </div>

          <label htmlFor="email">Email address</label>

          <div className="auth-input">
            <Mail size={19} />
            <input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
              required
            />
          </div>

          <label htmlFor="phone">Phone number</label>

          <div className="auth-input">
            <Phone size={19} />
            <input
              id="phone"
              name="phone"
              type="tel"
              placeholder="Enter your phone number"
              value={formData.phone}
              onChange={handleChange}
              autoComplete="tel"
              required
            />
          </div>

          <label htmlFor="password">Password</label>

          <div className="auth-input">
            <Lock size={19} />
            <input
              id="password"
              name="password"
              type="password"
              placeholder="At least 8 characters"
              value={formData.password}
              onChange={handleChange}
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>

          <label htmlFor="confirmPassword">Confirm password</label>

          <div className="auth-input">
            <Lock size={19} />
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="Enter your password again"
              value={formData.confirmPassword}
              onChange={handleChange}
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>

          {error && (
            <p className="error-message" role="alert">
              {error}
            </p>
          )}

          {success && (
            <p className="success-message" role="status">
              {success}
            </p>
          )}

          <button
            className="auth-submit"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Creating account...' : 'Create account'}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        <p className="auth-switch">
          Already a member? <Link to="/login">Sign in</Link>
        </p>

        <Link to="/" className="auth-back">
          ← Back to marketplace
        </Link>
      </section>
    </main>
  );
}

export default Register;