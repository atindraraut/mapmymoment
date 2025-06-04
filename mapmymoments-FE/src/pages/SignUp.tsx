import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from 'react-router-dom';
import { apiFetch } from "@/lib/api";

const SignUp = () => {
  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: ''
  });
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'signup' | 'otp'>('signup');
  const [emailForOtp, setEmailForOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // If already logged in, redirect to app
    if (localStorage.getItem('access_token')) {
      navigate('/app');
    }
  }, [navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {

      const res = await apiFetch('/user/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          first_name: form.first_name,
          last_name: form.last_name
        })
      }, false);
      const data = await res.json();
      if (res.ok) {
        setStep('otp');
        setEmailForOtp(form.email);
      } else {
        setError(data.message || 'Signup failed');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch('/user/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailForOtp, otp }),
      },false);
      const data = await res.json();
      if (res.ok) {
        // Store tokens in localStorage
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('refresh_token', data.refresh_token);
        localStorage.setItem('email', data.email);
        localStorage.setItem('first_name', data.first_name);
        localStorage.setItem('last_name', data.last_name);
        // Redirect or update UI as needed
        navigate('/');
      } else {
        setError(data.message || 'OTP verification failed');
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
            <h2 className="text-3xl font-bold text-center text-primary mb-6">{step === 'signup' ? 'Create Your Account' : 'Verify OTP'}</h2>
            {error && <div className="mb-4 text-red-600 text-center">{error}</div>}
            {step === 'signup' ? (
              <form className="space-y-4" onSubmit={handleSignup}>
                <div>
                  <label className="block mb-1 text-sm font-medium text-primary">First Name</label>
                  <input name="first_name" value={form.first_name} onChange={handleChange} className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary" required />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-primary">Last Name</label>
                  <input name="last_name" value={form.last_name} onChange={handleChange} className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary" required />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-primary">Email</label>
                  <input type="email" name="email" value={form.email} onChange={handleChange} className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary" required />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-primary">Password</label>
                  <input type="password" name="password" value={form.password} onChange={handleChange} className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary" required />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-primary">Confirm Password</label>
                  <input type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary" required />
                </div>
                <Button className="w-full bg-primary text-white hover:bg-primary/90 py-2 text-lg rounded" disabled={loading}>{loading ? 'Signing Up...' : 'Sign Up'}</Button>
              </form>
            ) : (
              <form className="space-y-4" onSubmit={handleVerifyOtp}>
                <div>
                  <label className="block mb-1 text-sm font-medium text-primary">Enter OTP sent to your email</label>
                  <input type="text" value={otp} onChange={e => setOtp(e.target.value)} className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary" required />
                </div>
                <Button className="w-full bg-primary text-white hover:bg-primary/90 py-2 text-lg rounded" disabled={loading}>{loading ? 'Verifying...' : 'Verify OTP'}</Button>
              </form>
            )}
            {step === 'signup' && (
              <p className="mt-6 text-center text-sm text-foreground/80">
                <Link to="/" className="text-primary hover:underline mr-4">Home</Link>
                <span>|</span>
                <span> Already have an account?{' '}
                  <Link to="/login" className="text-primary hover:underline">Log In</Link>
                </span>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
