import React, { useState } from 'react';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';

const RequestReset = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await apiFetch('/user/request-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      }, false);
      const data = await res.json();
      if (res.ok) {
        setMessage('If your email exists, a reset code has been sent.');
        // Automatically redirect to /reset-password after a short delay
        setTimeout(() => {
          navigate('/reset-password', { state: { email } });
        }, 1200);
      } else {
        setError(data.error || 'Failed to send reset code.');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-cover bg-center" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1500673922987-e212871fec22?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80)' }}>
      <div className="absolute inset-0 hero-gradient z-0"></div>
      <div className="relative z-10">
        <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-screen">
          <div className="w-full max-w-md bg-white/90 backdrop-blur-md rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-center text-primary mb-6">Reset Password</h2>
            {message && <div className="mb-4 text-green-600 text-center">{message}</div>}
            {error && <div className="mb-4 text-red-600 text-center">{error}</div>}
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block mb-1 text-sm font-medium text-primary">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary" required />
              </div>
              <Button className="w-full bg-primary text-white hover:bg-primary/90 py-2 text-lg rounded" disabled={loading}>{loading ? 'Sending...' : 'Send Reset Link'}</Button>
            </form>
            {/* Show button to go to reset page if message is shown */}
            {message && (
              <div className="mt-4 text-center">
                <Button variant="outline" onClick={() => navigate('/reset-password', { state: { email } })}>
                  Enter Reset Code
                </Button>
              </div>
            )}
            <p className="mt-6 text-center text-sm text-foreground/80">
              <Link to="/login" className="text-primary hover:underline">Back to Login</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestReset;
