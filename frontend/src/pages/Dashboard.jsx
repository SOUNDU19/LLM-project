import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ticketService } from '../services/api';
import { 
  PlusCircle, Search, AlertCircle, CheckCircle2, Clock, 
  ArrowRight, ShieldAlert, BadgeAlert, RefreshCw, Send, HelpCircle, Globe 
} from 'lucide-react';

const Dashboard = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  // Tickets lists
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Form states (Employee)
  const [description, setDescription] = useState('');
  const [language, setLanguage] = useState('English');
  const [submittingTicket, setSubmittingTicket] = useState(false);
  const [aiStep, setAiStep] = useState('');

  // Search/Filter states (Admin)
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Load tickets on mount
  const fetchTickets = async () => {
    try {
      setRefreshing(true);
      const data = await ticketService.getAll();
      setTickets(data);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  // Handle ticket submission
  const handleSubmitTicket = async (e) => {
    e.preventDefault();
    if (!description.trim() || description.length < 10) {
      alert('Please enter a detailed description (minimum 10 characters).');
      return;
    }

    setSubmittingTicket(true);
    
    // AI Pipeline simulation loading steps
    const steps = [
      'Detecting language & translating to English...',
      'Running Llama 3 classification model...',
      'Assigning priorities & routing departments...',
      'Calculating cosine similarity vector duplicates...',
      'Pulling reference context from ChromaDB (RAG)...',
      'Synthesizing troubleshooting suggestions...',
      'Persisting records inside helpdesk logs...'
    ];

    let currentStep = 0;
    setAiStep(steps[0]);
    const stepInterval = setInterval(() => {
      currentStep++;
      if (currentStep < steps.length) {
        setAiStep(steps[currentStep]);
      }
    }, 700);

    try {
      await ticketService.create(description, language);
      clearInterval(stepInterval);
      setDescription('');
      fetchTickets();
    } catch (error) {
      console.error('Error creating ticket:', error);
      alert('Failed to submit ticket. Please check backend connection.');
    } finally {
      clearInterval(stepInterval);
      setSubmittingTicket(false);
      setAiStep('');
    }
  };

  // Status Badge Helper
  const renderStatusBadge = (status) => {
    const configs = {
      open: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
      in_progress: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      resolved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      closed: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    };
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border ${configs[status] || configs.open}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  // Priority Badge Helper
  const renderPriorityBadge = (priority) => {
    const configs = {
      Low: 'bg-slate-500/10 text-slate-300 border-slate-800',
      Medium: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      High: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
      Critical: 'bg-rose-500/10 text-rose-400 border-rose-500/20 animate-pulse',
    };
    return (
      <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${configs[priority] || configs.Medium}`}>
        {priority}
      </span>
    );
  };

  // Filter logic (Admin)
  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = 
      ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.user_fullname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.id.includes(searchTerm);
      
    const matchesCategory = categoryFilter === 'All' || ticket.category === categoryFilter;
    const matchesPriority = priorityFilter === 'All' || ticket.priority === priorityFilter;
    const matchesStatus = statusFilter === 'All' || ticket.status === statusFilter;

    return matchesSearch && matchesCategory && matchesPriority && matchesStatus;
  });

  // KPI Calculations (Admin)
  const openCount = tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length;
  const criticalCount = tickets.filter(t => t.priority === 'Critical').length;
  const duplicateAlerts = tickets.filter(t => t.duplicate_alert?.is_duplicate).length;
  const slaRisks = tickets.filter(t => t.sla_risk_level === 'High' || t.priority === 'Critical').length;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Dashboard
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Welcome back, <span className="text-indigo-400 font-semibold">{user.fullname}</span>. 
            {isAdmin ? " Monitor and triage system support requests." : " Access AI automated resolutions."}
          </p>
        </div>
        
        <button
          onClick={fetchTickets}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-slate-100 bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-700 transition-all duration-300 disabled:opacity-50"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          Sync Queue
        </button>
      </div>

      {/* ADMIN STATS SUMMARY PANEL */}
      {isAdmin && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Open Tickets</span>
              <span className="text-3xl font-bold text-white mt-2 block font-mono">{openCount}</span>
            </div>
            <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400 border border-indigo-500/20">
              <Clock size={22} />
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Critical Incidents</span>
              <span className="text-3xl font-bold text-rose-400 mt-2 block font-mono">{criticalCount}</span>
            </div>
            <div className="p-3 bg-rose-500/10 rounded-xl text-rose-400 border border-rose-500/20">
              <AlertCircle size={22} className="animate-pulse" />
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Duplicate Warnings</span>
              <span className="text-3xl font-bold text-orange-400 mt-2 block font-mono">{duplicateAlerts}</span>
            </div>
            <div className="p-3 bg-orange-500/10 rounded-xl text-orange-400 border border-orange-500/20">
              <BadgeAlert size={22} />
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">SLA Breaches Risk</span>
              <span className="text-3xl font-bold text-amber-500 mt-2 block font-mono">{slaRisks}</span>
            </div>
            <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500 border border-amber-500/20">
              <ShieldAlert size={22} />
            </div>
          </div>
        </div>
      )}

      {/* LAYOUT BODY */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* EMPLOYEE PORTAL - SUBMIT TICKET FORM (LEFT COLUMN) */}
        {!isAdmin && (
          <div className="lg:col-span-4 space-y-6">
            <div className="glass-panel p-6 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
              
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2 mb-4">
                <PlusCircle size={20} className="text-indigo-400" />
                Submit AI Complaint
              </h2>

              <form onSubmit={handleSubmitTicket} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Globe size={12} className="text-slate-500" />
                    Input Language
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="glass-input w-full py-2.5 px-3.5 rounded-xl text-slate-200 text-sm focus:border-indigo-500/60"
                  >
                    <option value="English">English</option>
                    <option value="Hindi">Hindi (हिंदी)</option>
                    <option value="Kannada">Kannada (ಕನ್ನಡ)</option>
                    <option value="Auto-Detect">Auto-Detect / Translate</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <HelpCircle size={12} className="text-slate-500" />
                    Explain Your Problem
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide a detailed complaint (e.g. My payroll software crashes and shows memory allocation error every time I try to view my monthly payslip on the HR dashboard.)"
                    rows={6}
                    className="glass-input w-full p-4 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:border-indigo-500/60 leading-relaxed font-sans"
                    required
                  />
                  <span className="text-[10px] text-slate-500 block text-right">
                    Min 10 characters. Accepts English, Hindi, and Kannada.
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={submittingTicket || !description.trim()}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl font-semibold text-sm transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50"
                >
                  {submittingTicket ? (
                    <RefreshCw size={16} className="animate-spin" />
                  ) : (
                    <>
                      Submit Ticket
                      <Send size={14} />
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* AI pipeline tracking screen */}
            {submittingTicket && (
              <div className="glass-panel p-5 rounded-2xl border border-indigo-500/30 bg-indigo-950/20 shadow-lg glow-effect transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-ping" />
                  <span className="text-xs font-bold text-indigo-300 uppercase tracking-widest">Aegis AI Engine Running</span>
                </div>
                <p className="text-xs text-slate-300 font-mono mt-3 animate-pulse">{aiStep}</p>
                <div className="w-full bg-slate-900 h-1.5 rounded-full mt-4 overflow-hidden border border-slate-800">
                  <div className="bg-indigo-500 h-full rounded-full animate-[shimmer_2s_infinite]" style={{width: '60%'}}></div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TICKET LIST PANEL (RIGHT COLUMN / MAIN AREA) */}
        <div className={isAdmin ? 'lg:col-span-12' : 'lg:col-span-8'}>
          {/* SEARCH & FILTER CONTROLS (ADMIN ONLY) */}
          {isAdmin && (
            <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative w-full md:w-96">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <Search size={16} />
                </span>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search description, employee name, or ticket ID..."
                  className="glass-input w-full pl-11 pr-4 py-2 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:border-indigo-500/60"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Category</span>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="glass-input py-1.5 px-3 rounded-lg text-xs text-slate-200"
                  >
                    <option value="All">All Categories</option>
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

                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Priority</span>
                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="glass-input py-1.5 px-3 rounded-lg text-xs text-slate-200"
                  >
                    <option value="All">All Priorities</option>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>

                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</span>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="glass-input py-1.5 px-3 rounded-lg text-xs text-slate-200"
                  >
                    <option value="All">All Statuses</option>
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* LIST VIEWS */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500">
              <RefreshCw size={36} className="animate-spin text-indigo-500 mb-4" />
              <span>Fetching system ticket database...</span>
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="glass-panel text-center py-16 px-6 rounded-3xl border border-slate-800/80">
              <span className="text-4xl block mb-3">📭</span>
              <h3 className="text-lg font-bold text-white">No Tickets Found</h3>
              <p className="text-slate-400 text-xs mt-1 max-w-sm mx-auto leading-relaxed">
                We couldn't find any complaints matching your request. 
                {isAdmin ? " Change filters or search terms." : " Submit a new support complaint on the left."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center px-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Queued Items ({filteredTickets.length})
                </span>
                {!isAdmin && (
                  <span className="text-xs text-slate-400 font-medium">
                    Select a ticket to inspect AI troubleshooting suggestions
                  </span>
                )}
              </div>

              {/* Grid cards for Employee; Detailed rows / layout for Admin */}
              <div className="grid grid-cols-1 gap-4">
                {filteredTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    onClick={() => navigate(`/tickets/${ticket.id}`)}
                    className="glass-panel p-5 rounded-2xl border border-slate-800/80 hover:border-indigo-500/40 cursor-pointer shadow-md hover:shadow-indigo-500/5 transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                  >
                    <div className="space-y-2 max-w-2xl">
                      <div className="flex flex-wrap items-center gap-2">
                        {renderPriorityBadge(ticket.priority)}
                        <span className="text-[10px] font-semibold font-mono bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-slate-400">
                          {ticket.category}
                        </span>
                        
                        {/* Duplicate Alert Flag indicator */}
                        {ticket.duplicate_alert?.is_duplicate && (
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded flex items-center gap-1 animate-pulse">
                            <BadgeAlert size={10} />
                            DUPLICATE ALERT ({ticket.duplicate_alert.similarity_score}%)
                          </span>
                        )}

                        {ticket.sla_risk_level === 'High' && ticket.status !== 'resolved' && ticket.status !== 'closed' && (
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded flex items-center gap-1">
                            ⚠️ SLA RISK
                          </span>
                        )}
                      </div>

                      <h3 className="font-bold text-slate-100 group-hover:text-indigo-400 transition-colors tracking-tight text-base">
                        {ticket.title}
                      </h3>
                      
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {ticket.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-slate-500 font-medium">
                        <span>By: <span className="text-slate-400">{ticket.user_fullname}</span></span>
                        <span>•</span>
                        <span>Dept: <span className="text-slate-400">{ticket.department}</span></span>
                        <span>•</span>
                        <span>Date: <span className="text-slate-400">{new Date(ticket.created_at).toLocaleDateString()}</span></span>
                        {ticket.language !== 'English' && (
                          <>
                            <span>•</span>
                            <span className="text-indigo-400 font-mono">Translated from {ticket.language}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex md:flex-col items-start md:items-end justify-between md:justify-center gap-2 border-t md:border-t-0 pt-3 md:pt-0 border-slate-900">
                      <div className="md:text-right">
                        {renderStatusBadge(ticket.status)}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono hidden md:flex items-center gap-1 group-hover:text-indigo-400 transition-colors">
                        Inspect Detail
                        <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
