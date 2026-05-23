import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ticketService } from '../services/api';
import {
  ArrowLeft, Clock, User, Mail, MessageSquare, AlertTriangle,
  CheckCircle2, HelpCircle, ShieldAlert, GitMerge, FileText, Bot,
} from 'lucide-react';
import { StatusBadge, PriorityBadge } from '../components/ui/Badge';
import LoadingScreen from '../components/ui/LoadingScreen';
import AiPanel from '../components/ui/AiPanel';
const TicketDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [category, setCategory] = useState('');
  const [department, setDepartment] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');

  const fetchTicket = async () => {
    try {
      setLoading(true);
      const data = await ticketService.getById(id);
      setTicket(data);
      setStatus(data.status);
      setPriority(data.priority);
      setCategory(data.category);
      setDepartment(data.department);
      setResolutionNotes(data.resolution_notes || '');
    } catch (error) {
      console.error('Error fetching ticket:', error);
      alert('Could not find requested ticket.');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicket();
  }, [id]);

  const handleUpdateTicket = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      const updated = await ticketService.update(id, {
        status,
        priority,
        category,
        department,
        resolution_notes: resolutionNotes || null,
      });
      setTicket(updated);
      alert('Ticket updated successfully.');
    } catch (error) {
      console.error('Error updating ticket:', error);
      alert('Failed to update ticket.');
    } finally {
      setUpdating(false);
    }
  };

  const handleMergeDuplicate = async () => {
    if (!ticket.duplicate_alert?.duplicate_of_id) return;

    const confirmMerge = window.confirm(
      `Are you sure you want to merge this duplicate ticket into Parent Ticket #${ticket.duplicate_alert.duplicate_of_id}? This will close this ticket.`
    );
    if (!confirmMerge) return;

    try {
      setUpdating(true);
      await ticketService.merge(id, ticket.duplicate_alert.duplicate_of_id);
      alert('Tickets merged and duplicate ticket closed successfully.');
      navigate('/');
    } catch (error) {
      console.error('Error merging tickets:', error);
      alert('Failed to merge tickets.');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <LoadingScreen message="Loading ticket details..." />
      </div>
    );
  }

  if (!ticket) return null;

  return (
    <div className="page-container">
      <button
        type="button"
        onClick={() => navigate('/')}
        className="flex items-center gap-2 text-content-secondary hover:text-content text-sm font-medium transition-colors mb-6 group"
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
        Back to dashboard
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        <div className="lg:col-span-8 space-y-6">
          <div className="glass-panel p-6 rounded-2xl animate-slide-up">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <span className="text-xs font-mono text-content-muted">#{ticket.id}</span>
              <div className="flex items-center gap-2">
                <PriorityBadge priority={ticket.priority} size="lg" />
                <StatusBadge status={ticket.status} />
              </div>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold font-display text-content leading-snug">
              {ticket.title}
            </h1>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-border-subtle">
              {[
                { icon: User, label: 'Submitted by', value: ticket.user_fullname },
                { icon: Mail, label: 'Email', value: ticket.user_email },
                { icon: Clock, label: 'Created', value: new Date(ticket.created_at).toLocaleString() },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-2.5">
                  <Icon size={14} className="text-content-muted mt-0.5 shrink-0" />
                  <div>
                    <span className="text-[10px] font-bold text-content-muted uppercase block">{label}</span>
                    <span className="text-sm text-content font-medium break-all">{value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl animate-slide-up stagger-1" style={{ opacity: 0, animationFillMode: 'forwards' }}>
            <h3 className="text-sm font-semibold text-content mb-4 flex items-center gap-2">
              <FileText size={16} className="text-brand-500" />
              Complaint description
            </h3>

            {ticket.language === 'English' ? (
              <p className="text-sm text-content-secondary leading-relaxed p-4 rounded-xl bg-[var(--surface-muted)] border border-border-subtle whitespace-pre-line">
                {ticket.description}
              </p>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-border-subtle bg-[var(--surface-muted)]">
                  <span className="text-[10px] font-bold text-content-muted uppercase tracking-widest block mb-2">
                    Original ({ticket.language})
                  </span>
                  <p className="text-sm text-content-secondary leading-relaxed whitespace-pre-line">{ticket.description}</p>
                </div>
                <div className="p-4 rounded-xl border border-brand-500/20 bg-brand-500/5">
                  <span className="text-[10px] font-bold text-brand-500 uppercase tracking-widest block mb-2 flex items-center gap-1">
                    <Bot size={12} /> AI English translation
                  </span>
                  <p className="text-sm text-content leading-relaxed whitespace-pre-line">{ticket.translated_description}</p>
                </div>
              </div>
            )}

            {ticket.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {ticket.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          <AiPanel title="AI routing diagnostics" className="stagger-2" style={{ opacity: 0, animationFillMode: 'forwards' }}>
            <p className="text-sm text-content-secondary leading-relaxed italic p-4 rounded-xl bg-[var(--surface-muted)] border border-brand-500/15 font-mono">
              &ldquo;{ticket.reasoning}&rdquo;
            </p>
          </AiPanel>

          <div className="glass-panel p-6 rounded-2xl animate-slide-up stagger-3" style={{ opacity: 0, animationFillMode: 'forwards' }}>
            <h3 className="text-sm font-semibold text-content mb-4 flex items-center gap-2">
              <MessageSquare size={16} className="text-brand-500" />
              AI suggested solution
              <span className="text-[10px] font-normal text-content-muted normal-case tracking-normal">(RAG)</span>
            </h3>
            <div className="p-5 rounded-xl border border-border-subtle bg-[var(--surface-muted)] text-sm leading-relaxed text-content-secondary">
              <p className="whitespace-pre-line">{ticket.suggested_solution}</p>
              <div className="mt-4 pt-3 border-t border-border-subtle flex flex-wrap gap-2 justify-between text-[10px] text-brand-500 font-mono">
                <span>Source: ChromaDB</span>
                <span>LangChain RAG · Cosine similarity</span>
              </div>
            </div>
          </div>

          {ticket.resolution_notes && (
            <div className="glass-panel p-6 rounded-2xl border-emerald-500/20 bg-emerald-500/5">
              <h3 className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mb-3 flex items-center gap-2">
                <CheckCircle2 size={16} />
                Resolution details
              </h3>
              <p className="text-sm text-content-secondary leading-relaxed p-4 rounded-xl bg-[var(--surface-muted)] border border-border-subtle">
                {ticket.resolution_notes}
              </p>
            </div>
          )}
        </div>

        <div className="lg:col-span-4 space-y-5">
          {ticket.duplicate_alert?.is_duplicate && (
            <div className="glass-panel p-6 rounded-2xl border-orange-500/30 bg-orange-500/5 glow-effect">
              <div className="flex items-center gap-2 text-orange-500 mb-3">
                <AlertTriangle size={20} />
                <h3 className="font-semibold text-sm">Duplicate detected</h3>
              </div>
              <p className="text-xs text-content-secondary leading-relaxed">
                Semantic match:{' '}
                <span className="text-orange-500 font-bold">{ticket.duplicate_alert.similarity_score}%</span>{' '}
                similarity with an existing ticket.
              </p>
              <div className="mt-4 p-3 rounded-xl bg-[var(--surface-muted)] border border-border-subtle">
                <span className="text-[9px] uppercase tracking-wider text-content-muted font-bold block">Parent ticket</span>
                <Link
                  to={`/tickets/${ticket.duplicate_alert.duplicate_of_id}`}
                  className="text-xs text-brand-500 hover:text-brand-600 font-mono font-bold truncate block hover:underline mt-1"
                >
                  #{ticket.duplicate_alert.duplicate_of_id}
                </Link>
              </div>
              {isAdmin && ticket.status !== 'resolved' && ticket.status !== 'closed' && (
                <button
                  type="button"
                  onClick={handleMergeDuplicate}
                  disabled={updating}
                  className="w-full flex items-center justify-center gap-2 py-2.5 mt-4 bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs uppercase tracking-wider rounded-xl transition-colors disabled:opacity-50"
                >
                  <GitMerge size={14} />
                  Merge & close
                </button>
              )}
            </div>
          )}

          {isAdmin && (
            <div className="glass-panel p-6 rounded-2xl sticky top-24">
              <h3 className="text-sm font-semibold text-content mb-5 flex items-center gap-2">
                <ShieldAlert size={16} className="text-brand-500" />
                Administrative triage
              </h3>

              <form onSubmit={handleUpdateTicket} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-content-muted">Category</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className="glass-input w-full py-2 px-3 rounded-lg text-xs">
                    {['Hardware Issue', 'Software Issue', 'Network Issue', 'Security Issue', 'Login/Authentication', 'HR/Payroll', 'Cloud/Server', 'Email Issue', 'Database Issue'].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-content-muted">Department</label>
                  <select value={department} onChange={(e) => setDepartment(e.target.value)} className="glass-input w-full py-2 px-3 rounded-lg text-xs">
                    {['IT Support', 'HR & Payroll', 'Cybersecurity', 'Database Admin', 'Network Operations', 'Cloud Infrastructure', 'Hardware Operations', 'Software Engineering'].map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-content-muted">Priority</label>
                  <select value={priority} onChange={(e) => setPriority(e.target.value)} className="glass-input w-full py-2 px-3 rounded-lg text-xs">
                    {['Low', 'Medium', 'High', 'Critical'].map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-content-muted">Status</label>
                  <select value={status} onChange={(e) => setStatus(e.target.value)} className="glass-input w-full py-2 px-3 rounded-lg text-xs">
                    {['open', 'in_progress', 'resolved', 'closed'].map((s) => (
                      <option key={s} value={s}>{s.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>

                {(status === 'resolved' || status === 'closed') && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-content-muted">Resolution notes</label>
                    <textarea
                      value={resolutionNotes}
                      onChange={(e) => setResolutionNotes(e.target.value)}
                      placeholder="Describe resolution steps..."
                      rows={3}
                      className="glass-input w-full p-2.5 rounded-lg text-xs resize-y"
                      required
                    />
                  </div>
                )}

                <button type="submit" disabled={updating} className="btn-primary w-full py-2.5 text-xs uppercase tracking-wider">
                  {updating ? 'Saving...' : 'Save changes'}
                </button>
              </form>
            </div>
          )}

          {!isAdmin && (
            <div className="glass-panel p-6 rounded-2xl">
              <h3 className="font-semibold text-sm mb-2 flex items-center gap-2 text-content">
                <HelpCircle size={16} className="text-brand-500" />
                Need assistance?
              </h3>
              <p className="text-xs text-content-secondary leading-relaxed mb-4">
                If the AI suggestion did not resolve your issue, our team is reviewing your ticket. Updates will appear here.
              </p>
              <p className="text-[10px] text-content-muted font-mono">
                Assigned: <span className="text-content-secondary">{ticket.department}</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TicketDetails;
