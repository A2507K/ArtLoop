import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  MessageCircle,
  Send,
  Package,
  User,
  RefreshCw,
} from 'lucide-react';
import './Chat.css';
import API_BASE_URL from '../api';

const API = `${API_BASE_URL}/api`;

function Chat() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const messagesEndRef = useRef(null);

  const token = localStorage.getItem('artloop_token');

  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const currentUser = JSON.parse(
    localStorage.getItem('artloop_user') || '{}'
  );

  const currentUserId = currentUser._id || currentUser.id;

  const request = async (url, options = {}) => {
    const response = await fetch(`${API}${url}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Something went wrong.');
    }

    return data;
  };

  const loadChats = async () => {
    try {
      setError('');

      const data = await request('/chats');

      setChats(data.chats || []);

      const chatId = searchParams.get('id');

      if (chatId) {
        const selected = (data.chats || []).find(
          (chat) => chat._id === chatId
        );

        if (selected) {
          await openChat(selected._id);
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const openChat = async (chatId) => {
    try {
      setError('');

      const data = await request(`/chats/${chatId}`);

      setActiveChat(data.chat);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!message.trim() || !activeChat || sending) return;

    try {
      setSending(true);

      const data = await request(
        `/chats/${activeChat._id}/messages`,
        {
          method: 'POST',
          body: JSON.stringify({ text: message }),
        }
      );

      setActiveChat(data.chat);
      setMessage('');

      const updatedChats = await request('/chats');
      setChats(updatedChats.chats || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    loadChats();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
    });
  }, [activeChat?.messages]);

  useEffect(() => {
    if (!activeChat?._id) return;

    const interval = setInterval(async () => {
      try {
        const data = await request(`/chats/${activeChat._id}`);
        setActiveChat(data.chat);
      } catch (err) {
        console.error('Chat refresh error:', err);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [activeChat?._id]);

  const getOtherParticipant = (chat) => {
    return chat.participants?.find(
      (participant) => participant._id !== currentUserId
    );
  };

  if (loading) {
    return <div className="chat-loading">Loading conversations...</div>;
  }

  return (
    <div className="chat-page">
      <header className="chat-header">
        <button
          className="chat-back-button"
          onClick={() => navigate('/marketplace')}
        >
          <ArrowLeft size={18} />
          Back
        </button>

        <h1>
          <MessageCircle size={25} />
          Messages
        </h1>
      </header>

      {error && <div className="chat-error">{error}</div>}

      <div className="chat-layout">
        <aside className="chat-sidebar">
          <div className="chat-sidebar-heading">
            <h2>Conversations</h2>

            <button onClick={loadChats} title="Refresh">
              <RefreshCw size={17} />
            </button>
          </div>

          {chats.length === 0 ? (
            <div className="chat-empty">
              <MessageCircle size={35} />
              <p>No conversations yet.</p>
              <span>Contact a seller to start chatting.</span>
            </div>
          ) : (
            chats.map((chat) => {
              const otherUser = getOtherParticipant(chat);

              return (
                <button
                  key={chat._id}
                  className={`chat-list-item ${
                    activeChat?._id === chat._id ? 'active' : ''
                  }`}
                  onClick={() => openChat(chat._id)}
                >
                  <div className="chat-avatar">
                    <User size={20} />
                  </div>

                  <div className="chat-list-info">
                    <strong>
                      {otherUser?.name || 'User'}
                    </strong>

                    <span>
                      {chat.product?.name || 'Product conversation'}
                    </span>

                    <small>
                      {chat.messages?.length
                        ? chat.messages[chat.messages.length - 1].text
                        : 'Start a conversation'}
                    </small>
                  </div>
                </button>
              );
            })
          )}
        </aside>

        <main className="chat-main">
          {!activeChat ? (
            <div className="chat-welcome">
              <MessageCircle size={55} />
              <h2>Your Messages</h2>
              <p>Select a conversation to start chatting.</p>
            </div>
          ) : (
            <>
              <div className="chat-conversation-header">
                <div className="chat-avatar">
                  <User size={20} />
                </div>

                <div>
                  <h3>
                    {getOtherParticipant(activeChat)?.name || 'User'}
                  </h3>

                  <span>
                    {activeChat.product?.name || 'Product discussion'}
                  </span>
                </div>

                {activeChat.product?._id && (
                  <button
                    className="chat-product-button"
                    onClick={() =>
                      navigate(`/product/${activeChat.product._id}`)
                    }
                  >
                    <Package size={16} />
                    View Product
                  </button>
                )}
              </div>

              <div className="chat-messages">
                {activeChat.messages?.length === 0 ? (
                  <div className="chat-first-message">
                    Start your conversation!
                  </div>
                ) : (
                  activeChat.messages?.map((msg) => {
                    const isMine =
                      msg.sender?._id === currentUserId ||
                      msg.sender === currentUserId;

                    return (
                      <div
                        key={msg._id}
                        className={`chat-message ${
                          isMine ? 'sent' : 'received'
                        }`}
                      >
                        <div className="chat-message-bubble">
                          <p>{msg.text}</p>

                          <small>
                            {msg.createdAt
                              ? new Date(msg.createdAt).toLocaleString()
                              : ''}
                          </small>
                        </div>
                      </div>
                    );
                  })
                )}

                <div ref={messagesEndRef} />
              </div>

              <form
                className="chat-input-form"
                onSubmit={handleSendMessage}
              >
                <input
                  type="text"
                  placeholder="Type your message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  maxLength={2000}
                />

                <button
                  type="submit"
                  disabled={!message.trim() || sending}
                >
                  <Send size={19} />
                  {sending ? 'Sending...' : 'Send'}
                </button>
              </form>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default Chat;