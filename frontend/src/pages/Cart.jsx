import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Cart() {
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);

  useEffect(() => {
    const savedCart = JSON.parse(localStorage.getItem('artloop_cart')) || [];
    setCart(savedCart);
  }, []);

  const removeItem = (id) => {
    const updatedCart = cart.filter(item => item._id !== id);
    setCart(updatedCart);
    localStorage.setItem('artloop_cart', JSON.stringify(updatedCart));
  };

  const total = cart.reduce(
    (sum, item) => sum + Number(item.price),
    0
  );

  return (
    <div style={{ padding: '40px', maxWidth: '1000px', margin: 'auto' }}>
      <button onClick={() => navigate('/marketplace')}>
        ← Continue Shopping
      </button>

      <h1>My Shopping Cart 🛒</h1>

      {cart.length === 0 ? (
        <div>
          <h2>Your cart is empty!</h2>
          <button onClick={() => navigate('/marketplace')}>
            Explore Marketplace
          </button>
        </div>
      ) : (
        <>
          {cart.map(item => (
            <div
              key={item._id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                padding: '20px',
                margin: '15px 0',
                border: '1px solid #ddd',
                borderRadius: '12px'
              }}
            >
              <img
                src={item.image}
                alt={item.name}
                style={{
                  width: '100px',
                  height: '100px',
                  objectFit: 'cover',
                  borderRadius: '8px'
                }}
              />

              <div style={{ flex: 1 }}>
                <h3>{item.name}</h3>
                <p>₹{Number(item.price).toLocaleString('en-IN')}</p>
              </div>

              <button onClick={() => removeItem(item._id)}>
                Remove
              </button>
            </div>
          ))}

          <h2>
            Total: ₹{total.toLocaleString('en-IN')}
          </h2>
        </>
      )}
    </div>
  );
}

export default Cart;