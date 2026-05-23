import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { User, Lock, Mail, ArrowRight, Loader2, Sparkles, Sun, Moon, Shield, Users } from 'lucide-react';
import Alert from '../components/ui/Alert';

const Register = () => {
  const [fullname, setFullname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Employee');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { register } = useAuth();
  const { toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fullname || !email || !password) {
      setError('Please fill in all required fields.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setError('');
    setSuccess('');
    setSubmitting(true);

    const result = await register(email, password, fullname, role);

    setSubmitting(false);
    if (result.success) {
      setSuccess('Account created successfully! Redirecting to login...');
      setTimeout(() => navigate('/login'), 1500);
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="min-h-screen w-full flex mesh-bg relative overflow-hidden">
      <div className="absolute top-4 right-4 z-20">
        <button type="button" onClick={toggleTheme} className="btn-secondary p-2.5" aria-label="Toggle theme">
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      <div className="hidden lg:flex lg:w-2/5 relative items-center justify-center p-12 border-r border-border-subtle">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-transparent to-brand-500/5 pointer-events-none" />
        <div className="relative max-w-sm animate-slide-up">
          <div className="inline-flex p-3 rounded-2xl bg-brand-500/15 border border-brand-500/25 mb-6">
            <Sparkles size={28} className="text-brand-500" />
          </div>
          <h1 className="text-3xl font-bold font-display text-content tracking-tight">
            Join AegisDesk
          </h1>
          <p className="mt-3 text-content-secondary text-sm leading-relaxed">
            Create your account and start submitting or managing AI-triaged support tickets.
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-10 sm:px-8 overflow-y-auto">
        <div className="w-full max-w-md z-10 animate-slide-up my-4">
          <div className="text-center lg:text-left mb-6">
            <div className="lg:hidden inline-flex p-3 rounded-2xl bg-brand-500/15 border border-brand-500/25 mb-4">
              <Sparkles size={24} className="text-brand-500" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold font-display text-content tracking-tight">
              Create account
            </h2>
            <p className="text-sm text-content-secondary mt-2">
              Set up your helpdesk profile
            </p>
          </div>

          <div className="glass-panel p-6 sm:p-8 rounded-2xl">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <Alert variant="error">{error}</Alert>}
              {success && <Alert variant="success">{success}</Alert>}

              <div className="space-y-2">
                <label htmlFor="reg-name" className="text-xs font-semibold uppercase tracking-wider text-content-muted">
                  Full name
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-content-muted" />
                  <input
                    id="reg-name"
                    type="text"
                    value={fullname}
                    onChange={(e) => setFullname(e.target.value)}
                    placeholder="Alex Mercer"
                    className="glass-input w-full pl-11 pr-4 py-2.5 rounded-xl text-sm"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="reg-email" className="text-xs font-semibold uppercase tracking-wider text-content-muted">
                  Email address
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-content-muted" />
                  <input
                    id="reg-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex@company.com"
                    className="glass-input w-full pl-11 pr-4 py-2.5 rounded-xl text-sm"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="reg-password" className="text-xs font-semibold uppercase tracking-wider text-content-muted">
                  Password
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-content-muted" />
                  <input
                    id="reg-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    className="glass-input w-full pl-11 pr-4 py-2.5 rounded-xl text-sm"
                    required
                  />
                </div>
              </div>

              <fieldset className="space-y-2">
                <legend className="text-xs font-semibold uppercase tracking-wider text-content-muted">
                  User role
                </legend>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('Employee')}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border text-xs font-medium transition-all duration-200 ${
                      role === 'Employee'
                        ? 'bg-brand-500/15 border-brand-500/40 text-brand-600 dark:text-brand-400 shadow-glow'
                        : 'border-border text-content-muted hover:border-brand-500/30'
                    }`}
                  >
                    <Users size={20} />
                    Employee
                    <span className="text-[10px] font-normal opacity-80">Submit tickets</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('Admin')}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border text-xs font-medium transition-all duration-200 ${
                      role === 'Admin'
                        ? 'bg-brand-500/15 border-brand-500/40 text-brand-600 dark:text-brand-400 shadow-glow'
                        : 'border-border text-content-muted hover:border-brand-500/30'
                    }`}
                  >
                    <Shield size={20} />
                    Admin
                    <span className="text-[10px] font-normal opacity-80">Manage queue</span>
                  </button>
                </div>
              </fieldset>

              <button type="submit" disabled={submitting} className="btn-primary w-full py-3 mt-2 group">
                {submitting ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>
                    Create account
                    <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-xs text-content-muted">
              Already have an account?{' '}
              <Link to="/login" className="text-brand-500 font-semibold hover:text-brand-600 transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
