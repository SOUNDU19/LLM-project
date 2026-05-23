import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Lock, Mail, ArrowRight, Loader2, Info, Sparkles, Sun, Moon } from 'lucide-react';
import Alert from '../components/ui/Alert';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const { toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setError('');
    setSubmitting(true);

    const result = await login(email, password);

    setSubmitting(false);
    if (result.success) {
      navigate('/');
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="min-h-screen w-full flex mesh-bg relative overflow-hidden">
      <div className="absolute top-4 right-4 z-20">
        <button
          type="button"
          onClick={toggleTheme}
          className="btn-secondary p-2.5"
          aria-label="Toggle theme"
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      {/* Left brand panel — desktop */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-12 border-r border-border-subtle">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-500/10 via-transparent to-violet-600/5 pointer-events-none" />
        <div className="relative max-w-md animate-slide-up">
          <div className="inline-flex p-3 rounded-2xl bg-brand-500/15 border border-brand-500/25 mb-6">
            <Sparkles size={28} className="text-brand-500" />
          </div>
          <h1 className="text-4xl font-bold font-display text-content tracking-tight leading-tight">
            Intelligent support,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-500 to-violet-500">
              automated.
            </span>
          </h1>
          <p className="mt-4 text-content-secondary leading-relaxed">
            AegisDesk routes tickets with AI categorization, priority assignment, and RAG-powered resolution suggestions.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-content-muted">
            {['Llama 3 classification', 'ChromaDB RAG suggestions', 'Multi-language support'].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-md z-10 animate-slide-up">
          <div className="text-center lg:text-left mb-8">
            <div className="lg:hidden inline-flex p-3 rounded-2xl bg-brand-500/15 border border-brand-500/25 mb-4">
              <Sparkles size={24} className="text-brand-500" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold font-display text-content tracking-tight">
              Welcome back
            </h2>
            <p className="text-sm text-content-secondary mt-2">
              Sign in to your AegisDesk workspace
            </p>
          </div>

          <div className="glass-panel p-6 sm:p-8 rounded-2xl">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && <Alert variant="error">{error}</Alert>}

              <div className="space-y-2">
                <label htmlFor="login-email" className="text-xs font-semibold uppercase tracking-wider text-content-muted">
                  Email address
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-content-muted" aria-hidden />
                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="glass-input w-full pl-11 pr-4 py-3 rounded-xl text-sm"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="login-password" className="text-xs font-semibold uppercase tracking-wider text-content-muted">
                  Password
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-content-muted" aria-hidden />
                  <input
                    id="login-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="glass-input w-full pl-11 pr-4 py-3 rounded-xl text-sm"
                    autoComplete="current-password"
                    required
                  />
                </div>
              </div>

              <button type="submit" disabled={submitting} className="btn-primary w-full py-3 group">
                {submitting ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>
                    Sign in
                    <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-xs text-content-muted">
              Don&apos;t have an account?{' '}
              <Link to="/register" className="text-brand-500 hover:text-brand-600 font-semibold transition-colors">
                Create an account
              </Link>
            </p>
          </div>

          <div className="glass-card mt-6 p-4 rounded-xl text-xs text-content-secondary flex gap-3">
            <Info size={16} className="text-brand-500 shrink-0 mt-0.5" aria-hidden />
            <div>
              <span className="font-semibold text-content block mb-1.5">Demo credentials</span>
              <ul className="space-y-1 font-mono text-[11px]">
                <li>Admin: admin@helpdesk.com / admin123</li>
                <li>Employee: employee@helpdesk.com / employee123</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
