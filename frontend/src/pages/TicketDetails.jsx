import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ticketService } from '../services/api';
import { 
  ArrowLeft, Clock, User, Mail, Sparkles, MessageSquare, AlertTriangle, 
  CheckSquare, Check, HelpCircle, ShieldAlert, GitMerge, FileText 
} from 'lucide-react';

const TicketDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Administrative controls states
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [department, setDepartment] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [showResolveModal, setShowResolveModal] = useState(false);

  const fetchTicket = async () => {
    try {
      setLoading(true);
      const data = await ticketService.getById(id);
      setTicket(data);
      setStatus(data.status);
      setPriority(data.priority);
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
        department,
        resolution_notes: resolutionNotes || null
      });
      setTicket(updated);
      setShowResolveModal(false);
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

  // Status Badge Helper
  const renderStatusBadge = (statusVal) => {
    const configs = {
      open: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
      in_progress: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      resolved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      closed: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    };
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border ${configs[statusVal] || configs.open}`}>
        {statusVal.replace('_', ' ')}
      </span>
    );
  };

  // Priority Badge Helper
  const renderPriorityBadge = (prioVal) => {
    const configs = {
      Low: 'bg-slate-500/10 text-slate-300 border-slate-800',
      Medium: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      High: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
      Critical: 'bg-rose-500/10 text-rose-400 border-rose-500/20 animate-pulse',
    };
    return (
      <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider border ${configs[prioVal] || configs.Medium}`}>
        {prioVal}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 text-slate-500">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
        <span>Loading ticket details...</span>
      </div>
    );
  }

  if (!ticket) return null;

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Back button */}
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 text-slate-400 hover:text-white text-sm font-medium transition-colors mb-6 group"
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        Back to Dashboard
      </button>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: TICKET DATA (8 COLS) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Header Ticket Summary Card */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 shadow-lg">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <span className="text-xs font-semibold text-slate-500 font-mono">
                TICKET ID: #{ticket.id}
              </span>
              <div className="flex items-center gap-2">
                {renderPriorityBadge(ticket.priority)}
                {renderStatusBadge(ticket.status)}
              </div>
            </div>

            <h1 className="text-2xl font-extrabold text-white tracking-tight leading-snug">
              {ticket.title}
            </h1>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-900 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <User size={14} className="text-slate-500" />
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-bold">Submitted By</span>
                  <span className="text-slate-200 font-semibold">{ticket.user_fullname}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Mail size={14} className="text-slate-500" />
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-bold">Email</span>
                  <span className="text-slate-200 font-semibold">{ticket.user_email}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Clock size={14} className="text-slate-500" />
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-bold">Created On</span>
                  <span className="text-slate-200 font-semibold">
                    {new Date(ticket.created_at).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Description & Translation Card */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 shadow-md">
            <h3 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
              <FileText size={16} className="text-indigo-400" />
              Complaint Description
            </h3>

            {ticket.language === 'English' ? (
              <p className="text-sm text-slate-200 leading-relaxed font-sans bg-slate-950/40 border border-slate-900 p-4 rounded-xl whitespace-pre-line">
                {ticket.description}
              </p>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-slate-900 bg-slate-950/40">
                  <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block mb-1">
                    Original Description ({ticket.language})
                  </span>
                  <p className="text-sm text-slate-300 leading-relaxed font-sans whitespace-pre-line">
                    {ticket.description}
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-indigo-900/20 bg-indigo-950/10">
                  <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest block mb-1">
                    AI English Translation
                  </span>
                  <p className="text-sm text-slate-200 leading-relaxed font-sans whitespace-pre-line">
                    {ticket.translated_description}
                  </p>
                </div>
              </div>
            )}

            {/* AI Tags */}
            {ticket.tags && ticket.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {ticket.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* AI REASONING / ROOT CAUSE DIAGNOSTIC */}
          <div className="glass-panel p-6 rounded-3xl border border-indigo-500/10 bg-gradient-to-r from-slate-950 via-indigo-950/10 to-slate-950 shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={16} className="text-indigo-400 glow-effect" />
              <h3 className="text-sm font-bold text-indigo-300 tracking-wider uppercase font-mono">
                Aegis AI Routing Diagnostics & Explainability
              </h3>
            </div>
            <p className="text-sm text-slate-200 leading-relaxed font-sans italic bg-indigo-950/20 border border-indigo-500/15 p-4 rounded-xl font-mono">
              "{ticket.reasoning}"
            </p>
          </div>

          {/* RAG SUGGESTED SOLUTION */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 shadow-md">
            <h3 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
              <MessageSquare size={16} className="text-indigo-400 font-semibold" />
              AI Suggested Solution (RAG Synthesized)
            </h3>
            <div className="p-5 rounded-2xl border border-slate-900 bg-slate-900/30 text-sm leading-relaxed text-slate-200 relative">
              <p className="whitespace-pre-line font-sans">{ticket.suggested_solution}</p>
              
              <div className="mt-4 pt-3 border-t border-slate-900 flex items-center justify-between text-[10px] text-indigo-400 font-mono">
                <span>Retrieval Source: ChromaDB Knowledge Base</span>
                <span>Algorithm: LangChain RAG & Cosine Similarity</span>
              </div>
            </div>
          </div>

          {/* ADMIN RESOLUTION LOG DISPLAY (IF TICKET IS RESOLVED) */}
          {ticket.resolution_notes && (
            <div className="glass-panel p-6 rounded-3xl border border-emerald-500/20 bg-emerald-950/5 shadow-md">
              <h3 className="text-sm font-bold text-emerald-400 mb-2 flex items-center gap-2">
                <CheckCircle2 size={16} />
                Resolution Details
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed bg-slate-950/40 p-4 rounded-xl border border-slate-900 font-sans">
                {ticket.resolution_notes}
              </p>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: ACTION CONTROLS (4 COLS) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* DUPLICATE ALERTS PANEL */}
          {ticket.duplicate_alert?.is_duplicate && (
            <div className="glass-panel p-6 rounded-3xl border border-orange-500/30 bg-orange-950/15 glow-effect text-slate-200">
              <div className="flex items-center gap-2 text-orange-400 mb-2">
                <AlertTriangle size={20} className="animate-bounce" />
                <h3 className="font-bold text-sm">Duplicate Ticket Alert</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Our semantic embedding match detected a duplicate rate of{' '}
                <span className="text-orange-400 font-bold">{ticket.duplicate_alert.similarity_score}%</span> with a previously submitted ticket.
              </p>

              <div className="mt-4 p-3 bg-slate-950/80 border border-slate-900 rounded-xl space-y-1">
                <span className="text-[9px] uppercase tracking-wider text-slate-500 block font-bold">Duplicate Match ID</span>
                <Link
                  to={`/tickets/${ticket.duplicate_alert.duplicate_of_id}`}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-mono font-bold block truncate hover:underline"
                >
                  #{ticket.duplicate_alert.duplicate_of_id}
                </Link>
              </div>

              {isAdmin && ticket.status !== 'resolved' && ticket.status !== 'closed' && (
                <button
                  onClick={handleMergeDuplicate}
                  disabled={updating}
                  className="w-full flex items-center justify-center gap-2 py-2.5 mt-4 bg-orange-500 hover:bg-orange-600 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-all duration-300"
                >
                  <GitMerge size={14} />
                  Merge & Close
                </button>
              )}
            </div>
          )}

          {/* ADMIN TRIAGE / ACTION CARD */}
          {isAdmin && (
            <div className="glass-panel p-6 rounded-3xl border border-slate-800 shadow-lg">
              <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
                <ShieldAlert size={16} className="text-indigo-400" />
                Administrative Triage
              </h3>

              <form onSubmit={handleUpdateTicket} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Category Routing
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="glass-input w-full py-2 px-3 rounded-lg text-xs text-slate-200 focus:border-indigo-500/60"
                  >
                    <option value="Hardware Issue">Hardware Issue</option>
                    <option value="Software Issue">Software Issue</option>
                    <option value="Network Issue">Network Issue</option>
                    <option value="Security Issue">Security Issue</option>
                    <option value="Login/Authentication">Login/Authentication</option>
                    <option value="HR/Payroll">HR/Payroll</option>
                    <option value="Cloud/Server">Cloud/Server</option>
                    <option value="Email Issue">Email Issue</option>
                    <option value="Database Issue">Database Issue</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Routing Department
                  </label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="glass-input w-full py-2 px-3 rounded-lg text-xs text-slate-200 focus:border-indigo-500/60"
                  >
                    <option value="IT Support">IT Support</option>
                    <option value="HR & Payroll">HR & Payroll</option>
                    <option value="Cybersecurity">Cybersecurity</option>
                    <option value="Database Admin">Database Admin</option>
                    <option value="Network Operations">Network Operations</option>
                    <option value="Cloud Infrastructure">Cloud Infrastructure</option>
                    <option value="Hardware Operations">Hardware Operations</option>
                    <option value="Software Engineering">Software Engineering</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Adjust Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="glass-input w-full py-2 px-3 rounded-lg text-xs text-slate-200 focus:border-indigo-500/60"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Ticket Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="glass-input w-full py-2 px-3 rounded-lg text-xs text-slate-200 focus:border-indigo-500/60"
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                {/* Show resolution notes inline if resolving */}
                {(status === 'resolved' || status === 'closed') && (
                  <div className="space-y-1 pt-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                      Resolution Notes
                    </label>
                    <textarea
                      value={resolutionNotes}
                      onChange={(e) => setResolutionNotes(e.target.value)}
                      placeholder="Explain what steps were taken to resolve this problem..."
                      rows={3}
                      className="glass-input w-full p-2.5 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500/60"
                      required
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={updating}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 shadow-md"
                >
                  {updating ? 'Applying Changes...' : 'Save Settings'}
                </button>
              </form>
            </div>
          )}

          {/* EMPLOYEE ASSISTANCE HELPER CARD */}
          {!isAdmin && (
            <div className="glass-panel p-6 rounded-3xl border border-slate-800 text-slate-200 shadow-md">
              <h3 className="font-bold text-sm mb-2 flex items-center gap-2">
                <HelpCircle size={16} className="text-indigo-400" />
                Need Assistance?
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                If the RAG suggested troubleshooting solution on the left did not resolve your issue, please wait. 
                Our IT Support Administrators are reviewing your ticket. You will receive updates here directly.
              </p>
              <div className="text-[10px] text-slate-500 font-mono">
                Current Assigned Dept: <span className="text-slate-400">{ticket.department}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TicketDetails;
