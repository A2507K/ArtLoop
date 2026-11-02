import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Palette, Mail, Lock, ArrowRight } from 'lucide-react';
import './Auth.css';

function Login() {
const navigate = useNavigate();

const [formData, setFormData] = useState({
email: '',
password: '',
});

const [loading, setLoading] = useState(false);
const [error, setError] = useState('');

function handleChange(event) {
setFormData({
...formData,
[event.target.name]: event.target.value,
});
}

async function handleSubmit(event) {
event.preventDefault();

setError('');
setLoading(true);

try {
  const response = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: formData.email.trim(),
      password: formData.password,
    }),
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Login failed. Please try again.');
  }

  // Save the authentication token and user information.
  localStorage.setItem('artloop_token', data.token);
  localStorage.setItem('artloop_user', JSON.stringify(data.user));

// Redirect based on the user's role.
if (data.user.role === 'admin') {
  navigate('/admin');
} else {
  navigate('/marketplace');
}

} catch (err) {
  setError(
    err.message === 'Failed to fetch'
      ? 'Unable to connect to the server. Please make sure the backend is running.'
      : err.message || 'Something went wrong. Please try again.'
  );
} finally {
  setLoading(false);
}

}

return ( <main className="auth-page"> <Link to="/" className="auth-brand"> <span className="auth-brand-icon"> <Palette size={25} /> </span> <span>ArtLoop</span> </Link>

  <section className="auth-card">
    <div className="auth-heading">
      <span className="auth-eyebrow">WELCOME BACK</span>
      <h1>Good to see you again.</h1>
      <p>Sign in to discover art supplies and connect with artists.</p>
    </div>

    <form onSubmit={handleSubmit}>
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

      <label htmlFor="password">Password</label>

      <div className="auth-input">
        <Lock size={19} />
        <input
          id="password"
          name="password"
          type="password"
          placeholder="Enter your password"
          value={formData.password}
          onChange={handleChange}
          autoComplete="current-password"
          required
        />
      </div>

      {error && (
        <p role="alert" style={{ color: '#dc2626', marginTop: '12px' }}>
          {error}
        </p>
      )}

      <button className="auth-submit" type="submit" disabled={loading}>
        {loading ? 'Signing in...' : 'Sign in'}
        {!loading && <ArrowRight size={18} />}
      </button>
    </form>

    <p className="auth-switch">
      New to ArtLoop? <Link to="/register">Create an account</Link>
    </p>

    <Link to="/" className="auth-back">
      ← Back to marketplace
    </Link>
  </section>
</main>

);
}

export default Login;
