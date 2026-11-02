import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import Marketplace from './Marketplace';
import Login from './pages/Login';
import Register from './pages/Register';
import Admin from './pages/Admin';
import SellItem from './pages/SellItem';
import ProductDetails from './pages/ProductDetails';
import Cart from './pages/Cart';
import Profile from './pages/Profile';
import Wishlist from './pages/Wishlist';
import SellerDashboard from './pages/SellerDashboard';
import SwapRequests from './pages/SwapRequests';
import Chat from './pages/Chat';
import MyDisputes from './pages/MyDisputes';

// Admin-only route protection
function AdminRoute({ children }) {
  const token =
    localStorage.getItem('artloop_token') ||
    sessionStorage.getItem('artloop_token');

  const storedUser =
    localStorage.getItem('artloop_user') ||
    sessionStorage.getItem('artloop_user');

  if (!token || !storedUser) {
    return <Navigate to="/login" replace />;
  }

  let user;

  try {
    user = JSON.parse(storedUser);
  } catch {
    return <Navigate to="/" replace />;
  }

  if (user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Marketplace />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Admin-only access */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <Admin />
            </AdminRoute>
          }
        />

        <Route path="/sell" element={<SellItem />} />
        <Route path="/product/:id" element={<ProductDetails />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/wishlist" element={<Wishlist />} />
        <Route path="/seller-dashboard" element={<SellerDashboard />} />
        <Route path="/swap-requests" element={<SwapRequests />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/my-disputes" element={<MyDisputes />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;