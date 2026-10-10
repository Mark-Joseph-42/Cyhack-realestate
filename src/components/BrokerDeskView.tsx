import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Building2,
  Phone,
  Mail,
  Home,
  BarChart2,
  Brain,
  MessageSquare,
  ListPlus,
  Calendar,
  Send,
  Database,
  CheckCircle2,
  Sparkles,
  FileJson,
  ArrowRight,
  SlidersHorizontal,
  Bell,
  Users,
} from 'lucide-react';
import { EnrichedLead, Property } from '../types';

interface BrokerDeskViewProps {
  leads: EnrichedLead[];
  properties: Property[];
  selectedLead: EnrichedLead | null;
  onSelectLead: (lead: EnrichedLead) => void;
  onSwitchView: () => void;
  onSendMessage: (leadId: number, message: string) => Promise<void>;
  onSaveNote: (leadId: number, noteText: string) => Promise<void>;
  onOpenTourModal: (lead: EnrichedLead, propertyId?: number) => void;
  onOpenCallModal: (lead: EnrichedLead) => void;
  onOpenEmailModal: (lead: EnrichedLead) => void;
  onOpenSchemaModal: () => void;
  isSendingAi: boolean;
}

export const BrokerDeskView: React.FC<BrokerDeskViewProps> = ({
  leads,
  selectedLead,
  onSelectLead,
  onSwitchView,
  onSendMessage,
  onSaveNote,
  onOpenTourModal,
  onOpenCallModal,
  onOpenEmailModal,
  onOpenSchemaModal,
  isSendingAi,
}) => {
  const [filterTab, setFilterTab] = useState<'ALL' | 'CALL_UP' | 'NEGOTIATE' | 'AMBIGUOUS'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [topSearch, setTopSearch] = useState('');
  const [noteInput, setNoteInput] = useState('');
  const [buyerSimInput, setBuyerSimInput] = useState('');
  const [showJsonSummary, setShowJsonSummary] = useState(false);
  const [noteSavedToast, setNoteSavedToast] = useState(false);

  const transcriptEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedLead?.conversation_logs?.length]);

  const combinedQuery = (searchQuery || topSearch).toLowerCase().trim();

  const filteredLeads = leads.filter((lead) => {
    if (filterTab === 'CALL_UP' && lead.next_action !== 'CALL_UP') return false;
    if (filterTab === 'NEGOTIATE' && (lead.next_action !== 'NEGOTIATE' || lead.status === 'AMBIGUOUS'))
      return false;
    if (filterTab === 'AMBIGUOUS' && lead.status !== 'AMBIGUOUS') return false;

    if (combinedQuery) {
      const hay = `${lead.name} ${lead.email} ${lead.property_title || ''} ${lead.location_preferences || ''} ${
        lead.parsed_summary?.role_tag || ''
      }`.toLowerCase();
      return hay.includes(combinedQuery);
    }
    return true;
  });

  const callUpCount = leads.filter((l) => l.next_action === 'CALL_UP').length;
  const negotiateCount = leads.filter((l) => l.next_action === 'NEGOTIATE' && l.status === 'QUALIFIED').length;
  const ambiguousCount = leads.filter((l) => l.status === 'AMBIGUOUS').length;

  const handleSaveBrokerNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead || !noteInput.trim()) return;
    await onSaveNote(selectedLead.id, noteInput);
    setNoteInput('');
    setNoteSavedToast(true);
    setTimeout(() => setNoteSavedToast(false), 2500);
  };

  const handleSendBuyerMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead || !buyerSimInput.trim() || isSendingAi) return;
    const text = buyerSimInput;
    setBuyerSimInput('');
    await onSendMessage(selectedLead.id, text);
  };

  const askingPrice = selectedLead?.property_price || 850000;
  const buyerMax = selectedLead?.budget_max || 0;
  const delta = buyerMax - askingPrice;
  const deltaPct = askingPrice > 0 ? ((delta / askingPrice) * 100).toFixed(1) : '0.0';

  const initials = selectedLead
    ? selectedLead.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'MB';

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0F172A]">
      {/* Top Dark Emerald System Bar */}
      <div className="bg-[#081C15] text-emerald-400/90 px-5 py-1.5 flex items-center justify-between text-[11px] font-mono border-b border-[#163C32]">
        <div className="flex items-center gap-2 truncate">
          <span className="text-emerald-400 font-semibold tracking-wider">SYSTEM ACTIVE</span>
          <span className="text-emerald-700">|</span>
          <span className="text-emerald-300/75 truncate">
            Real Estate Underwriting Core · Live inbound parser synced with Buyer AI Concierge
          </span>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <button
            onClick={onOpenSchemaModal}
            className="text-emerald-300/80 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Database className="w-3 h-3" />
            <span>SQLite Inspector ({leads.length} Leads)</span>
          </button>
          <span className="text-emerald-800">|</span>
          <button
            onClick={onSwitchView}
            className="text-emerald-300 hover:text-white font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>Switch to Buyer Discovery View</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Header Bar */}
      <header className="bg-white border-b border-[#E2E8F0] px-6 py-3 flex items-center justify-between gap-6">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-[#0F2922] flex items-center justify-center text-white shadow-xs">
              <Building2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="text-[17px] font-bold tracking-tight text-[#0F172A] leading-tight">
                BrokerDesk Pro
              </div>
              <div className="text-[10px] font-mono tracking-widest text-[#64748B] uppercase">
                PRIMEESTATES PRO SUITE
              </div>
            </div>
          </div>

          {/* Global Search Input */}
          <div className="relative hidden md:block w-80">
            <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={topSearch}
              onChange={(e) => setTopSearch(e.target.value)}
              placeholder="Search leads, escrow, properties..."
              className="w-full h-9 pl-8 pr-12 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-md text-[#0F172A] placeholder:text-[#64748B] focus:outline-none focus:border-[#0F2922] focus:bg-white transition-colors"
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-[#64748B] bg-white px-1.5 py-0.5 rounded border border-[#E2E8F0]">
              ⌘K
            </span>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={onSwitchView}
            className="h-8 px-3 rounded-md bg-[#ECFDF5] hover:bg-[#D1FAE5] text-[#065F46] border border-[#A7F3D0] text-xs font-mono font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Open Buyer View to Generate AI Leads</span>
          </button>

          <button
            onClick={onOpenSchemaModal}
            title="Inspect SQLite Database & JSON Output"
            className="w-8 h-8 rounded-md border border-[#E2E8F0] hover:bg-[#F8FAFC] flex items-center justify-center text-[#475569] relative cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            {leads.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-[#E11D48] absolute top-1.5 right-1.5" />
            )}
          </button>

          <button
            onClick={() => setShowJsonSummary(!showJsonSummary)}
            title="Toggle Structured JSON Lead Summary"
            className={`w-8 h-8 rounded-md border flex items-center justify-center transition-colors cursor-pointer ${
              showJsonSummary
                ? 'bg-[#0F2922] text-white border-[#0F2922]'
                : 'border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#475569]'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>

          <div className="w-8 h-8 rounded-full bg-[#0F2922] text-white font-mono text-xs font-semibold flex items-center justify-center">
            MB
          </div>
        </div>
      </header>

      {/* Main Two-Column Workstation */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0">
        {/* LEFT COLUMN: Lead Directory */}
        <aside className="lg:col-span-4 xl:col-span-3 bg-white border-r border-[#E2E8F0] flex flex-col">
          <div className="p-4 border-b border-[#E2E8F0]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#0F172A]">Lead Directory</h2>
                <span className="px-2 py-0.5 text-[11px] font-mono font-medium rounded bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0] tabular-nums">
                  {leads.length} Active
                </span>
              </div>
              <span className="text-[11px] font-mono font-medium text-[#059669] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                Live AI
              </span>
            </div>

            {/* Filter Input */}
            <div className="relative mb-3">
              <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter leads, properties, budget..."
                className="w-full h-8 pl-8 pr-3 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-md text-[#0F172A] placeholder:text-[#64748B] focus:outline-none focus:border-[#0F2922]"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
              <button
                onClick={() => setFilterTab('ALL')}
                className={`px-2.5 py-1 rounded text-[11px] font-mono font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  filterTab === 'ALL'
                    ? 'bg-[#0F2922] text-white'
                    : 'bg-[#F8FAFC] text-[#475569] border border-[#E2E8F0] hover:bg-slate-100'
                }`}
              >
                All ({leads.length})
              </button>
              <button
                onClick={() => setFilterTab('CALL_UP')}
                className={`px-2.5 py-1 rounded text-[11px] font-mono font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  filterTab === 'CALL_UP'
                    ? 'bg-[#0F2922] text-white'
                    : 'bg-[#F8FAFC] text-[#475569] border border-[#E2E8F0] hover:bg-slate-100'
                }`}
              >
                Call-Up ({callUpCount})
              </button>
              <button
                onClick={() => setFilterTab('NEGOTIATE')}
                className={`px-2.5 py-1 rounded text-[11px] font-mono font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  filterTab === 'NEGOTIATE'
                    ? 'bg-[#0F2922] text-white'
                    : 'bg-[#F8FAFC] text-[#475569] border border-[#E2E8F0] hover:bg-slate-100'
                }`}
              >
                Negotiate ({negotiateCount})
              </button>
              {ambiguousCount > 0 && (
                <button
                  onClick={() => setFilterTab('AMBIGUOUS')}
                  className={`px-2.5 py-1 rounded text-[11px] font-mono font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    filterTab === 'AMBIGUOUS'
                      ? 'bg-[#9F1239] text-white'
                      : 'bg-[#FFF1F2] text-[#9F1239] border border-[#FECDD3] hover:bg-rose-100'
                  }`}
                >
                  Ambiguous ({ambiguousCount})
                </button>
              )}
            </div>
          </div>

          {/* Lead Feed Cards (or Empty State when 0 leads) */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#E2E8F0]">
            {leads.length === 0 ? (
              <div className="p-6 text-center space-y-3 my-8">
                <div className="w-10 h-10 rounded-full bg-[#F1F5F9] text-[#64748B] flex items-center justify-center mx-auto">
                  <Users className="w-5 h-5" />
                </div>
                <div className="text-xs font-bold text-[#0F172A]">
                  No Qualified Leads Yet
                </div>
                <p className="text-[11px] text-[#64748B] leading-relaxed">
                  The BrokerDesk queue starts empty. Switch to the <strong>Buyer Discovery View</strong>, click <strong>Request Viewing</strong> on any property, and complete the Gemini/Gemma AI qualification chat.
                </p>
                <button
                  onClick={onSwitchView}
                  className="mt-2 h-8 px-3 rounded-md bg-[#0F2922] hover:bg-[#163C32] text-white text-[11px] font-mono font-medium inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Go to Buyer View</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            ) : (
              filteredLeads.map((lead) => {
                const isSelected = selectedLead?.id === lead.id;
                const isCallUp = lead.next_action === 'CALL_UP' && lead.status === 'QUALIFIED';
                const isAmbiguous = lead.status === 'AMBIGUOUS';

                return (
                  <div
                    key={lead.id}
                    onClick={() => onSelectLead(lead)}
                    className={`p-4 transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#ECFDF5]/60 border-l-3 border-l-[#059669]'
                        : 'bg-white hover:bg-[#F8FAFC]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            isCallUp
                              ? 'bg-[#059669]'
                              : isAmbiguous
                              ? 'bg-[#E11D48]'
                              : 'bg-[#D97706]'
                          }`}
                        />
                        <span className="font-bold text-sm text-[#0F172A] truncate">
                          {lead.name}
                        </span>
                      </div>

                      {isCallUp ? (
                        <span className="px-2 py-0.5 text-[10px] font-mono font-semibold rounded bg-[#059669] text-white tabular-nums shrink-0">
                          CALL_UP · {Math.round(lead.qualification_score)}
                        </span>
                      ) : isAmbiguous ? (
                        <span className="px-2 py-0.5 text-[10px] font-mono font-semibold rounded bg-[#FFF1F2] text-[#9F1239] border border-[#FECDD3] tabular-nums shrink-0">
                          AMBIGUOUS · {Math.round(lead.qualification_score)}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-[10px] font-mono font-semibold rounded bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A] tabular-nums shrink-0">
                          NEGOTIATE · {Math.round(lead.qualification_score)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-[#475569] mb-1.5">
                      <Home className="w-3 h-3 text-[#64748B] shrink-0" />
                      <span className="truncate">
                        {lead.property_title || `Target: ${lead.location_preferences || 'Unmatched Inventory'}`}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs mb-2.5">
                      <span className="font-mono font-bold text-[#0F172A] tabular-nums">
                        {lead.property_price
                          ? `$${Number(lead.property_price).toLocaleString()}`
                          : `Cap: $${Number(lead.budget_max || 0).toLocaleString()}`}
                      </span>
                      <span className="text-[11px] font-mono text-[#64748B]">
                        {lead.parsed_summary?.time_ago || 'Just now'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="px-1.5 py-0.5 text-[10px] font-mono bg-[#F1F5F9] text-[#334155] rounded">
                        {lead.timeline_months <= 1
                          ? '<30 Days'
                          : lead.timeline_months === 2
                          ? '60d Close'
                          : `${lead.timeline_months * 30}d Close`}
                      </span>
                      {lead.parsed_summary?.financial_readiness && (
                        <span
                          className={`px-1.5 py-0.5 text-[10px] font-mono rounded ${
                            isCallUp
                              ? 'bg-[#ECFDF5] text-[#065F46]'
                              : isAmbiguous
                              ? 'bg-[#FFF1F2] text-[#9F1239]'
                              : 'bg-[#FFFBEB] text-[#92400E]'
                          }`}
                        >
                          {lead.parsed_summary.financial_readiness}
                        </span>
                      )}
                      {lead.parsed_summary?.role_tag && (
                        <span className="px-1.5 py-0.5 text-[10px] font-mono bg-[#F8FAFC] text-[#475569] border border-[#E2E8F0] rounded">
                          {lead.parsed_summary.role_tag}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Directory Footer */}
          <div className="px-4 py-3 border-t border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between text-[11px] font-mono text-[#64748B]">
            <span>
              Showing {filteredLeads.length} of {leads.length}
            </span>
            <span className="text-[#059669] font-semibold">Sorted by Score</span>
          </div>
        </aside>

        {/* RIGHT COLUMN: Lead Dossier & AI Underwriting Workstation */}
        <main className="lg:col-span-8 xl:col-span-9 flex flex-col bg-white">
          {!selectedLead ? (
            /* Empty Workstation State when BrokerDesk starts with 0 leads */
            <div className="flex-1 flex flex-col items-center justify-center p-10 text-center max-w-xl mx-auto space-y-5">
              <div className="w-14 h-14 rounded-xl bg-[#0F2922] text-emerald-400 flex items-center justify-center shadow-md">
                <Brain className="w-7 h-7" />
              </div>
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0] text-[11px] font-mono font-bold uppercase">
                  <span>Awaiting Committed Buyer Dossiers</span>
                </div>
                <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">
                  BrokerDesk Pro Starts Empty — Ready for Live Buyer AI Intake
                </h1>
                <p className="text-xs text-[#475569] leading-relaxed">
                  Unqualified inquiries never clutter your broker workstation. When a prospective buyer clicks{' '}
                  <strong>Request Viewing</strong> on the Buyer Discovery portal, the Gemini/Gemma AI Qualifier engages them in a live chat, evaluates their budget, timeline, and commitment, and automatically populates committed buyers here as{' '}
                  <span className="font-mono font-bold text-[#059669]">CALL_UP</span> or{' '}
                  <span className="font-mono font-bold text-[#D97706]">NEGOTIATE</span>.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={onSwitchView}
                  className="h-10 px-5 rounded-lg bg-[#056C49] hover:bg-[#04563A] text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Switch to Buyer Discovery View & Request a Viewing</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={onOpenSchemaModal}
                  className="h-10 px-4 rounded-lg bg-white hover:bg-[#F8FAFC] text-[#0F172A] border border-[#CBD5E1] text-xs font-mono font-medium flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Database className="w-4 h-4 text-[#059669]" />
                  <span>Open SQLite Inspector</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Dossier Top Header */}
              <div className="p-6 border-b border-[#E2E8F0] flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2.5 mb-2">
                    <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">
                      {selectedLead.name}
                    </h1>

                    {selectedLead.status === 'QUALIFIED' ? (
                      <span className="px-2.5 py-0.5 text-xs font-mono font-semibold rounded bg-[#059669] text-white tabular-nums">
                        QUALIFIED {Math.round(selectedLead.qualification_score)}/100
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 text-xs font-mono font-semibold rounded bg-[#E11D48] text-white tabular-nums">
                        AMBIGUOUS {Math.round(selectedLead.qualification_score)}/100
                      </span>
                    )}

                    <span
                      className={`px-2.5 py-0.5 text-xs font-mono font-semibold rounded border ${
                        selectedLead.next_action === 'CALL_UP'
                          ? 'bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0]'
                          : 'bg-[#FFFBEB] text-[#92400E] border-[#FDE68A]'
                      }`}
                    >
                      ACTION: {selectedLead.next_action}
                    </span>
                  </div>

                  {/* Contact Metadata Line */}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-[#64748B] font-mono">
                    <span className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-[#94A3B8]" />
                      {selectedLead.email}
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1.5 text-[#059669] font-medium">
                      <Phone className="w-3.5 h-3.5" />
                      {selectedLead.phone} (Direct Cell)
                    </span>
                    <span>·</span>
                    <span>
                      CASE {selectedLead.parsed_summary?.case_id || `#LD-8941${selectedLead.id}`}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => onOpenCallModal(selectedLead)}
                    className="h-9 px-4 rounded-md bg-[#0F5132] hover:bg-[#0A3622] text-white text-xs font-medium flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call Now</span>
                  </button>
                  <button
                    onClick={() => onOpenEmailModal(selectedLead)}
                    className="h-9 px-4 rounded-md bg-white hover:bg-[#F8FAFC] text-[#0F172A] border border-[#CBD5E1] text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Mail className="w-3.5 h-3.5 text-[#475569]" />
                    <span>Send Email</span>
                  </button>
                </div>
              </div>

              {/* Scrollable Dossier Body */}
              <div className="flex-1 p-6 space-y-6 overflow-y-auto">
                {/* 1. Matched Target Property Banner */}
                <div className="p-4 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-md bg-[#0F2922] text-white flex items-center justify-center shrink-0">
                      <Building2 className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <div className="text-[10px] font-mono uppercase tracking-wider text-[#64748B] font-semibold">
                        MATCHED TARGET PROPERTY
                      </div>
                      {selectedLead.property_title ? (
                        <>
                          <div className="text-base font-bold text-[#0F172A]">
                            {selectedLead.property_title}{' '}
                            {selectedLead.matched_property_id === 1 ? '(Unit 4402)' : ''}
                          </div>
                          <div className="text-xs text-[#475569] mt-0.5">
                            {selectedLead.property_location} · {selectedLead.property_bedrooms} Bed /{' '}
                            {selectedLead.property_type} · Verified Inventory Match
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="text-base font-bold text-[#9F1239]">
                            No Viable Inventory Match (Severe Budget Disconnect)
                          </div>
                          <div className="text-xs text-[#64748B] mt-0.5">
                            Requested {selectedLead.location_preferences} at $
                            {Number(selectedLead.budget_max).toLocaleString()} max
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Financial Comparison Right Side */}
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="text-[10px] font-mono uppercase text-[#64748B]">
                        LISTING ASKING
                      </div>
                      <div className="text-lg font-mono font-bold text-[#059669] tabular-nums">
                        {selectedLead.property_price
                          ? `$${Number(selectedLead.property_price).toLocaleString()}`
                          : 'N/A'}
                      </div>
                    </div>

                    <div className="h-8 w-px bg-[#E2E8F0]" />

                    <div className="text-right">
                      <div className="text-[10px] font-mono uppercase text-[#64748B]">
                        BUYER BUDGET CAP
                      </div>
                      <div className="text-lg font-mono font-bold text-[#0F172A] tabular-nums">
                        ${Number(selectedLead.budget_max || 0).toLocaleString()}
                      </div>
                      <div
                        className={`text-[11px] font-mono font-medium tabular-nums ${
                          delta >= 0 ? 'text-[#059669]' : 'text-[#D97706]'
                        }`}
                      >
                        {selectedLead.property_price
                          ? delta >= 0
                            ? `+$${Math.round(delta / 1000)}k Headroom`
                            : `-$${Math.abs(Math.round(delta / 1000))}k Gap (${deltaPct}%)`
                          : 'Below Minimum Threshold'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Structured Lead Intelligence Section */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <BarChart2 className="w-4 h-4 text-[#059669]" />
                      <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#0F172A]">
                        STRUCTURED LEAD INTELLIGENCE
                      </h3>
                    </div>
                    <button
                      onClick={() => setShowJsonSummary(!showJsonSummary)}
                      className="text-[11px] font-mono text-[#059669] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <FileJson className="w-3.5 h-3.5" />
                      <span>
                        {showJsonSummary ? 'Hide Raw JSON Summary' : 'Inspect SQLite lead_summary JSON'}
                      </span>
                    </button>
                  </div>

                  {showJsonSummary && (
                    <div className="mb-4 p-3.5 rounded-md bg-[#0F172A] text-emerald-300 font-mono text-xs overflow-x-auto border border-[#1E293B]">
                      <div className="text-[10px] text-slate-400 mb-1 uppercase">
                        lead_qualifications.lead_summary (Structured Output):
                      </div>
                      <pre className="leading-relaxed">
                        {JSON.stringify(selectedLead.parsed_summary, null, 2)}
                      </pre>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                    <div className="p-3.5 rounded-md bg-[#F8FAFC] border border-[#E2E8F0]">
                      <div className="text-[10px] font-mono uppercase text-[#64748B] mb-1">
                        BUDGET BRACKET
                      </div>
                      <div className="text-sm font-mono font-bold text-[#0F172A] tabular-nums">
                        ${Number(selectedLead.budget_min || 0).toLocaleString()} – $
                        {Number(selectedLead.budget_max || 0).toLocaleString()}
                      </div>
                      <div className="text-xs font-mono text-[#059669] mt-1">
                        {selectedLead.parsed_summary?.financial_readiness || 'Verified Liquid & Financed'}
                      </div>
                    </div>

                    <div className="p-3.5 rounded-md bg-[#F8FAFC] border border-[#E2E8F0]">
                      <div className="text-[10px] font-mono uppercase text-[#64748B] mb-1">
                        URGENCY TIMELINE
                      </div>
                      <div className="text-sm font-bold text-[#0F172A]">
                        {selectedLead.timeline_months <= 1
                          ? '< 30 Days (Acute)'
                          : selectedLead.timeline_months === 2
                          ? '60 Days (Medium)'
                          : `${selectedLead.timeline_months} Months`}
                      </div>
                      <div className="text-xs font-mono text-[#059669] mt-1">
                        {selectedLead.parsed_summary?.target_location || selectedLead.location_preferences}
                      </div>
                    </div>

                    <div className="p-3.5 rounded-md bg-[#F8FAFC] border border-[#E2E8F0]">
                      <div className="text-[10px] font-mono uppercase text-[#64748B] mb-1">
                        VARIANCE CAP
                      </div>
                      <div className="text-sm font-mono font-bold text-[#0F172A] tabular-nums">
                        {selectedLead.property_price
                          ? delta >= 0
                            ? '0.0% / Zero Risk'
                            : `${deltaPct}% Variance`
                          : 'Non-Viable Cap'}
                      </div>
                      <div
                        className={`text-xs font-mono mt-1 ${
                          selectedLead.property_price && delta >= 0
                            ? 'text-[#059669]'
                            : 'text-[#D97706]'
                        }`}
                      >
                        {selectedLead.property_price
                          ? delta >= 0
                            ? 'Asking fully covered'
                            : 'Requires seller counter-offer'
                          : 'Requires budget calibration'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. AI Underwriting Rationale Callout */}
                <div
                  className={`p-4 rounded-md border ${
                    selectedLead.status === 'QUALIFIED'
                      ? 'bg-[#ECFDF5]/50 border-[#A7F3D0] border-l-4 border-l-[#059669]'
                      : 'bg-[#FFF1F2]/60 border-[#FECDD3] border-l-4 border-l-[#E11D48]'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <Brain
                      className={`w-4 h-4 ${
                        selectedLead.status === 'QUALIFIED' ? 'text-[#059669]' : 'text-[#E11D48]'
                      }`}
                    />
                    <span
                      className={`text-[11px] font-mono font-bold uppercase tracking-wider ${
                        selectedLead.status === 'QUALIFIED' ? 'text-[#065F46]' : 'text-[#9F1239]'
                      }`}
                    >
                      AI UNDERWRITING RATIONALE
                    </span>
                  </div>

                  <p className="text-xs italic text-[#1E293B] leading-relaxed mb-3">
                    "{selectedLead.decision_reasoning}"
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-emerald-200/60 text-[11px] font-mono">
                    <span className="text-[#475569] tabular-nums">
                      CONFIDENCE FACTOR: {selectedLead.parsed_summary?.confidence_factor || '0.984'}
                    </span>
                    <span
                      className={`font-bold uppercase ${
                        selectedLead.next_action === 'CALL_UP' ? 'text-[#059669]' : 'text-[#D97706]'
                      }`}
                    >
                      RECOMMENDATION:{' '}
                      {selectedLead.next_action === 'CALL_UP'
                        ? 'CALL_UP WITHIN 15 MIN'
                        : 'NEGOTIATE COUNTER-OFFER WITH SELLER'}
                    </span>
                  </div>
                </div>

                {/* 4. Full AI Concierge Transcript */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-[#475569]" />
                      <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#0F172A]">
                        FULL AI CONCIERGE TRANSCRIPT
                      </h3>
                    </div>
                    <span className="text-[11px] font-mono text-[#64748B]">
                      Synced Today · ({selectedLead.conversation_logs.length} messages)
                    </span>
                  </div>

                  <div className="rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] p-4 space-y-3.5 max-h-80 overflow-y-auto">
                    {selectedLead.conversation_logs.map((log, idx) => {
                      const isAi = log.sender === 'AI Agent';
                      const timeStr =
                        log.created_at && log.created_at.includes(' ')
                          ? log.created_at.split(' ')[1].slice(0, 8)
                          : `09:1${idx + 4}:10 AM`;

                      if (isAi) {
                        return (
                          <div key={log.id || idx} className="flex items-start gap-3">
                            <div className="w-7 h-7 rounded bg-[#0F2922] text-white font-mono text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                              AI
                            </div>
                            <div className="max-w-2xl bg-white border border-[#E2E8F0] rounded-lg p-3 shadow-2xs">
                              <div className="text-[10px] font-mono text-[#64748B] mb-1">
                                {timeStr} · AI Intake Bot
                              </div>
                              <p className="text-xs text-[#0F172A] leading-relaxed">
                                {log.message_text}
                              </p>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div key={log.id || idx} className="flex items-start justify-end gap-3">
                          <div className="max-w-2xl bg-[#0B211A] text-white rounded-lg p-3 shadow-xs">
                            <div className="text-[10px] font-mono text-emerald-300/70 text-right mb-1">
                              {timeStr} · {selectedLead.name}
                            </div>
                            <p className="text-xs text-white/95 leading-relaxed">
                              {log.message_text}
                            </p>
                          </div>
                          <div className="w-7 h-7 rounded bg-[#059669] text-white font-mono text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                            {initials}
                          </div>
                        </div>
                      );
                    })}
                    <div ref={transcriptEndRef} />
                  </div>

                  {/* Follow-up simulator */}
                  <form
                    onSubmit={handleSendBuyerMessage}
                    className="mt-2.5 flex items-center gap-2 bg-[#F1F5F9] p-2 rounded-md border border-[#E2E8F0]"
                  >
                    <Sparkles className="w-4 h-4 text-[#059669] ml-1.5 shrink-0" />
                    <input
                      type="text"
                      value={buyerSimInput}
                      onChange={(e) => setBuyerSimInput(e.target.value)}
                      disabled={isSendingAi}
                      placeholder={`Send follow-up message as ${selectedLead.name} to re-evaluate...`}
                      className="flex-1 bg-white h-8 px-3 rounded border border-[#CBD5E1] text-xs text-[#0F172A] placeholder:text-[#64748B] focus:outline-none focus:border-[#0F2922]"
                    />
                    <button
                      type="submit"
                      disabled={isSendingAi || !buyerSimInput.trim()}
                      className="h-8 px-3.5 rounded bg-[#0F2922] hover:bg-[#163C32] disabled:opacity-50 text-white text-xs font-mono font-medium flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                    >
                      <Send className="w-3 h-3" />
                      <span>{isSendingAi ? 'Underwriting...' : 'Send & Re-Qualify'}</span>
                    </button>
                  </form>
                </div>

                {/* Internal Broker Notes List */}
                {selectedLead.broker_notes && selectedLead.broker_notes.length > 0 && (
                  <div className="pt-2 border-t border-[#E2E8F0]">
                    <div className="text-[10px] font-mono uppercase text-[#64748B] font-semibold mb-2">
                      INTERNAL BROKER UNDERWRITING NOTES ({selectedLead.broker_notes.length})
                    </div>
                    <div className="space-y-2">
                      {selectedLead.broker_notes.map((n) => (
                        <div
                          key={n.id}
                          className="p-2.5 rounded bg-[#F8FAFC] border border-[#E2E8F0] text-xs flex items-start justify-between gap-4"
                        >
                          <span className="text-[#334155]">{n.note_text}</span>
                          <span className="text-[10px] font-mono text-[#64748B] shrink-0">
                            {n.author}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Pinned Action Bar */}
              <div className="px-6 py-3.5 border-t border-[#E2E8F0] bg-white flex flex-wrap items-center gap-3">
                <form onSubmit={handleSaveBrokerNote} className="flex-1 flex items-center gap-2.5 min-w-[260px]">
                  <ListPlus className="w-4 h-4 text-[#64748B] shrink-0" />
                  <input
                    type="text"
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    placeholder="Add internal broker underwriting note or prep talking point..."
                    className="flex-1 h-9 px-3 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded-md text-[#0F172A] placeholder:text-[#64748B] focus:outline-none focus:border-[#0F2922] focus:bg-white"
                  />
                  <button
                    type="submit"
                    className="h-9 px-4 rounded-md bg-white hover:bg-[#F8FAFC] text-[#0F172A] border border-[#CBD5E1] text-xs font-medium transition-colors cursor-pointer shrink-0"
                  >
                    {noteSavedToast ? 'Saved ✓' : 'Save Note'}
                  </button>
                </form>

                <button
                  onClick={() =>
                    onOpenTourModal(selectedLead, selectedLead.matched_property_id || 1)
                  }
                  className="h-9 px-4 rounded-md bg-[#0F5132] hover:bg-[#0A3622] text-white text-xs font-medium flex items-center gap-2 shadow-xs transition-colors cursor-pointer shrink-0"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Schedule Tour</span>
                </button>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};
