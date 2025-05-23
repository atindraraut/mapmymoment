import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from 'react-router-dom';
import { apiFetch } from "@/lib/api";


const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // If already logged in, redirect to dashboard
    if (localStorage.getItem('access_token')) {
      navigate('/dashboard');
    }
  }, [navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      console.log('Logging in with', form.email);
      const res = await apiFetch('/user/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, password: form.password })
      }, false); // don't auto-refresh on login
      const data = await res.json();
      console.log('Login response:', data);
      if (res.ok) {
        // Store tokens and user info in localStorage
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('refresh_token', data.refresh_token);
        localStorage.setItem('email', data.email);
        localStorage.setItem('first_name', data.first_name);
        localStorage.setItem('last_name', data.last_name);
        navigate('/dashboard');
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-cover bg-center" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1500673922987-e212871fec22?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80")' }}>
      <div className="absolute inset-0 hero-gradient z-0"></div>
      <div className="relative z-10">
        <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-screen">
          <div className="w-full max-w-md bg-white/90 backdrop-blur-md rounded-lg shadow-lg p-8">
            <h2 className="text-3xl font-bold text-center text-primary mb-6">Log In</h2>
            {error && <div className="mb-4 text-red-600 text-center">{error}</div>}
            <form className="space-y-4" onSubmit={handleLogin}>
              <div>
                <label className="block mb-1 text-sm font-medium text-primary">Email</label>
                <input type="email" name="email" value={form.email} onChange={handleChange} className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary" required />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-primary">Password</label>
                <input type="password" name="password" value={form.password} onChange={handleChange} className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary" required />
              </div>
              <Button className="w-full bg-primary text-white hover:bg-primary/90 py-2 text-lg rounded" disabled={loading}>{loading ? 'Logging In...' : 'Log In'}</Button>
            </form>
            <p className="mt-6 text-center text-sm text-foreground/80">
              <Link to="/" className="text-primary hover:underline mr-4">Home</Link>
              <span>|</span>
              <span> New here?{' '}
                <Link to="/signup" className="text-primary hover:underline">Create an account</Link>
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
