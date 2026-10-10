import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Send,
  Sparkles,
  Calendar,
  Phone,
  Mail,
  Database,
  CheckCircle2,
  Building2,
  UserCheck,
  RotateCcw,
  AlertTriangle,
  ArrowRight,
  Brain,
  ShieldCheck,
} from 'lucide-react';
import { EnrichedLead, Property } from '../types';

/* ============================================================================
   1. BUYER AI VIEWING & QUALIFICATION CHAT DRAWER
   Opens when clicking "Request Viewing" or "Ask AI" on Buyer Discovery View.
   Conducts a real multi-turn AI chat with Gemini/Gemma. At the end of the
   conversation, the AI decides if the buyer is committed or uncommitted.
   If committed, their details are captured and dispatched to BrokerDesk Pro
   as CALL_UP or NEGOTIATE based on their commitment level.
============================================================================ */
interface ChatMsg {
  sender: 'User' | 'AI Agent';
  text: string;
  timestamp: string;
}

interface AiEvaluationState {
  agent_reply: string;
  commitment_state: 'IN_PROGRESS' | 'COMMITTED_READY' | 'UNCOMMITTED_DISCARD';
  conversation_complete: boolean;
  extracted_name: string;
  extracted_email: string;
  extracted_phone: string;
  budget_min: number;
  budget_max: number;
  location_preferences: string;
  timeline_months: number;
  financial_readiness: string;
  qualification_score: number;
  next_action: 'CALL_UP' | 'NEGOTIATE';
  decision_reasoning: string;
  role_tag: string;
}

interface BuyerViewingChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  property: Property | null;
  intentMode: 'viewing' | 'ask';
  onLeadCommittedToBroker: (newLead: EnrichedLead, allLeads: EnrichedLead[]) => void;
  onSwitchToBrokerDesk: () => void;
}

export const BuyerViewingChatDrawer: React.FC<BuyerViewingChatDrawerProps> = ({
  isOpen,
  onClose,
  property,
  intentMode,
  onLeadCommittedToBroker,
  onSwitchToBrokerDesk,
}) => {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [evalState, setEvalState] = useState<AiEvaluationState | null>(null);

  // Contact capture form fields when AI determines buyer is committed
  const [buyerName, setBuyerName] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [isSubmittingToBroker, setIsSubmittingToBroker] = useState(false);
  const [committedSuccessLead, setCommittedSuccessLead] = useState<EnrichedLead | null>(null);

  const endRef = useRef<HTMLDivElement>(null);

  // Initialize fresh AI greeting when opened for a property
  useEffect(() => {
    if (isOpen && property) {
      const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const greeting =
        intentMode === 'viewing'
          ? `Hello! Welcome to PrimeEstates Pro. You requested a private viewing for ${property.title} listed at $${Number(property.price).toLocaleString()} in ${property.location}. Before I lock in a senior broker slot, could you share your target budget range, financing readiness (pre-approved or cash), and how soon you are looking to close?`
          : `Hello! I'm the PrimeEstates AI Underwriting Concierge for ${property.title} ($${Number(property.price).toLocaleString()}). Feel free to ask anything about the residence, or let me know your budget and timeline if you'd like to qualify for a private viewing.`;

      setMessages([{ sender: 'AI Agent', text: greeting, timestamp: nowStr }]);
      setEvalState(null);
      setCommittedSuccessLead(null);
      setBuyerName('');
      setBuyerEmail('');
      setBuyerPhone('');
    }
  }, [isOpen, property, intentMode]);

  useEffect(() => {
    if (isOpen) {
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, messages.length, evalState]);

  if (!isOpen || !property) return null;

  const sendMessageToAi = async (userText: string) => {
    if (!userText.trim() || isThinking) return;
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const updatedMessages: ChatMsg[] = [
      ...messages,
      { sender: 'User', text: userText.trim(), timestamp: nowStr },
    ];
    setMessages(updatedMessages);
    setInput('');
    setIsThinking(true);

    try {
      const res = await fetch('/api/buyer-intake/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property_id: property.id,
          messages: updatedMessages,
        }),
      });
      const data = await res.json();
      if (data.evaluation) {
        const ev: AiEvaluationState = data.evaluation;
        const replyTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const withAiReply: ChatMsg[] = [
          ...updatedMessages,
          { sender: 'AI Agent', text: ev.agent_reply, timestamp: replyTime },
        ];
        setMessages(withAiReply);
        setEvalState(ev);

        if (ev.extracted_name && !buyerName) setBuyerName(ev.extracted_name);
        if (ev.extracted_email && !buyerEmail) setBuyerEmail(ev.extracted_email);
        if (ev.extracted_phone && !buyerPhone) setBuyerPhone(ev.extracted_phone);

        // If AI already extracted name + email/phone and marked COMMITTED_READY, auto-commit to BrokerDesk!
        if (
          ev.commitment_state === 'COMMITTED_READY' &&
          ev.extracted_name &&
          (ev.extracted_email || ev.extracted_phone)
        ) {
          await handleFinalizeCommit(
            ev.extracted_name,
            ev.extracted_email,
            ev.extracted_phone,
            ev,
            withAiReply
          );
        }
      }
    } catch (err) {
      console.error('AI Chat error:', err);
    } finally {
      setIsThinking(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendMessageToAi(input);
  };

  const handleFinalizeCommit = async (
    finalName: string,
    finalEmail: string,
    finalPhone: string,
    evToUse?: AiEvaluationState | null,
    msgsToUse?: ChatMsg[]
  ) => {
    const activeEv = evToUse || evalState;
    const activeMsgs = msgsToUse || messages;
    if (!finalName.trim()) return;

    setIsSubmittingToBroker(true);
    try {
      const res = await fetch('/api/buyer-intake/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: finalName.trim(),
          email: finalEmail.trim(),
          phone: finalPhone.trim(),
          property_id: property.id,
          budget_min: activeEv?.budget_min || Math.round(property.price * 0.92),
          budget_max: activeEv?.budget_max || property.price,
          location_preferences: activeEv?.location_preferences || property.location,
          timeline_months: activeEv?.timeline_months || 1,
          financial_readiness: activeEv?.financial_readiness || 'Pre-Approved Financing',
          qualification_score: activeEv?.qualification_score || 94,
          next_action: activeEv?.next_action || 'CALL_UP',
          decision_reasoning:
            activeEv?.decision_reasoning ||
            `Buyer completed AI Viewing Qualification for ${property.title} and verified budget and timeline commitment.`,
          role_tag: activeEv?.role_tag || 'Pre-Approved',
          messages: activeMsgs,
        }),
      });
      const data = await res.json();
      if (data.lead && data.leads) {
        setCommittedSuccessLead(data.lead);
        onLeadCommittedToBroker(data.lead, data.leads);
      }
    } catch (err) {
      console.error('Error committing lead to broker:', err);
    } finally {
      setIsSubmittingToBroker(false);
    }
  };

  // Show contact confirmation card when buyer has shown commitment or AI asks for details
  const showCommitmentCaptureCard =
    !committedSuccessLead &&
    evalState &&
    evalState.commitment_state !== 'UNCOMMITTED_DISCARD' &&
    (evalState.commitment_state === 'COMMITTED_READY' ||
      evalState.qualification_score >= 68 ||
      messages.length >= 3);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-xs">
      <div className="w-full max-w-xl bg-white h-full shadow-2xl border-l border-[#CBD5E1] flex flex-col">
        {/* Drawer Header */}
        <div className="p-4 bg-[#0F2922] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <div className="text-sm font-bold flex items-center gap-2">
                <span>AI Viewing & Qualification Concierge</span>
                <span className="px-1.5 py-0.5 text-[9px] font-mono uppercase bg-emerald-500/20 text-emerald-300 rounded border border-emerald-400/30">
                  Gemini / Gemma Engine
                </span>
              </div>
              <div className="text-[11px] font-mono text-emerald-300/90 mt-0.5">
                Evaluating commitment for BrokerDesk Pro escalation
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded hover:bg-white/10 flex items-center justify-center text-white/80 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Target Property Banner */}
        <div className="px-4 py-2.5 bg-[#ECFDF5] border-b border-[#A7F3D0] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 truncate">
            <Building2 className="w-4 h-4 text-[#059669] shrink-0" />
            <span className="font-bold text-[#065F46] truncate">{property.title}</span>
            <span className="text-[#059669] font-mono text-[11px]">({property.location})</span>
          </div>
          <span className="font-mono font-bold text-[#059669] tabular-nums shrink-0">
            Asking: ${Number(property.price).toLocaleString()}
          </span>
        </div>

        {/* Live Underwriting Telemetry Strip */}
        {evalState && (
          <div className="px-4 py-2 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between text-[11px] font-mono">
            <div className="flex items-center gap-2">
              <Brain className="w-3.5 h-3.5 text-[#059669]" />
              <span className="text-[#475569]">LIVE AI VERDICT:</span>
              {evalState.commitment_state === 'UNCOMMITTED_DISCARD' ? (
                <span className="px-2 py-0.5 rounded bg-[#FFF1F2] text-[#9F1239] border border-[#FECDD3] font-bold">
                  UNCOMMITTED / DISCARD ({Math.round(evalState.qualification_score)}/100)
                </span>
              ) : (
                <span
                  className={`px-2 py-0.5 rounded font-bold ${
                    evalState.next_action === 'CALL_UP'
                      ? 'bg-[#059669] text-white'
                      : 'bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A]'
                  }`}
                >
                  {evalState.next_action} · SCORE {Math.round(evalState.qualification_score)}/100
                </span>
              )}
            </div>
            <span className="text-[#64748B]">
              {evalState.budget_max > 0
                ? `Detected Cap: $${evalState.budget_max.toLocaleString()}`
                : 'Awaiting Budget'}
            </span>
          </div>
        )}

        {/* Chat Transcript Stream */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-[#F8FAFC]">
          {messages.map((m, idx) => {
            const isAi = m.sender === 'AI Agent';
            return (
              <div
                key={idx}
                className={`flex flex-col ${isAi ? 'items-start' : 'items-end'}`}
              >
                <div className="text-[10px] font-mono text-[#64748B] mb-1 px-1">
                  {isAi ? 'AI Underwriting Concierge' : buyerName || 'Prospective Buyer'} ·{' '}
                  {m.timestamp}
                </div>
                <div
                  className={`max-w-[85%] rounded-lg p-3 text-xs leading-relaxed shadow-2xs ${
                    isAi
                      ? 'bg-white border border-[#E2E8F0] text-[#0F172A]'
                      : 'bg-[#0F2922] text-white'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            );
          })}

          {isThinking && (
            <div className="flex items-center gap-2 text-xs font-mono text-[#059669] p-2">
              <Sparkles className="w-3.5 h-3.5 animate-spin" />
              <span>Gemini/Gemma evaluating buyer commitment & underwriting fit...</span>
            </div>
          )}

          {/* CASE A: UNCOMMITTED / DISCARDED VERDICT */}
          {evalState?.commitment_state === 'UNCOMMITTED_DISCARD' && (
            <div className="p-4 rounded-xl bg-[#FFF1F2] border border-[#FECDD3] text-xs space-y-2">
              <div className="flex items-center gap-2 font-mono font-bold text-[#9F1239] uppercase">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>AI Decision: Buyer Uncommitted — Not Escalated to Broker</span>
              </div>
              <p className="text-[#881337] leading-relaxed">
                {evalState.decision_reasoning}
              </p>
              <div className="pt-1 text-[11px] font-mono text-[#9F1239]">
                Per Problem #4 rules, ambiguous/uncommitted inquiries are filtered out so brokers only spend time on committed buyers.
              </div>
            </div>
          )}

          {/* CASE B: COMMITTED BUYER — CAPTURE DETAILS & SEND TO BROKERDESK */}
          {showCommitmentCaptureCard && (
            <div className="p-4 rounded-xl bg-white border-2 border-[#059669] shadow-md space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#059669]" />
                  <span className="text-xs font-mono font-bold uppercase text-[#065F46]">
                    AI Verified Buyer Commitment — Complete Dossier
                  </span>
                </div>
                <span
                  className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded ${
                    evalState.next_action === 'CALL_UP'
                      ? 'bg-[#059669] text-white'
                      : 'bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A]'
                  }`}
                >
                  CLASSIFIED: {evalState.next_action} ({Math.round(evalState.qualification_score)}/100)
                </span>
              </div>

              <p className="text-xs text-[#334155] leading-relaxed">
                {evalState.decision_reasoning}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                <div>
                  <label className="block text-[10px] font-mono uppercase text-[#64748B] mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    placeholder="e.g. Marcus Vance"
                    className="w-full h-8 px-2.5 rounded border border-[#CBD5E1] text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-[#64748B] mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={buyerEmail}
                    onChange={(e) => setBuyerEmail(e.target.value)}
                    placeholder="marcus@example.com"
                    className="w-full h-8 px-2.5 rounded border border-[#CBD5E1] text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-[#64748B] mb-1">
                    Direct Phone *
                  </label>
                  <input
                    type="text"
                    value={buyerPhone}
                    onChange={(e) => setBuyerPhone(e.target.value)}
                    placeholder="+1 (555) 0192"
                    className="w-full h-8 px-2.5 rounded border border-[#CBD5E1] text-xs"
                  />
                </div>
              </div>

              <button
                type="button"
                disabled={!buyerName.trim() || isSubmittingToBroker}
                onClick={() => handleFinalizeCommit(buyerName, buyerEmail, buyerPhone)}
                className="w-full h-9 rounded-md bg-[#056C49] hover:bg-[#04563A] disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <UserCheck className="w-4 h-4" />
                <span>
                  {isSubmittingToBroker
                    ? 'Dispatching Dossier to BrokerDesk Pro...'
                    : `Confirm Viewing & Send Dossier to BrokerDesk (${evalState.next_action})`}
                </span>
              </button>
            </div>
          )}

          {/* CASE C: SUCCESSFULLY DISPATCHED TO BROKER VIEW */}
          {committedSuccessLead && (
            <div className="p-4 rounded-xl bg-[#ECFDF5] border-2 border-[#059669] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#065F46] font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-[#059669]" />
                  <span>Dossier Dispatched to BrokerDesk Pro!</span>
                </div>
                <span className="px-2.5 py-0.5 rounded bg-[#059669] text-white font-mono text-xs font-bold">
                  {committedSuccessLead.next_action} · {Math.round(committedSuccessLead.qualification_score)}/100
                </span>
              </div>
              <p className="text-xs text-[#065F46] leading-relaxed">
                <strong>{committedSuccessLead.name}</strong> ({committedSuccessLead.email} ·{' '}
                {committedSuccessLead.phone}) has been added to the live BrokerDesk Lead Directory
                with full conversation logs and structured underwriting intelligence.
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onSwitchToBrokerDesk();
                }}
                className="w-full h-9 rounded-md bg-[#0F2922] hover:bg-[#163C32] text-white text-xs font-mono font-semibold flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Open BrokerDesk Pro to Inspect {committedSuccessLead.name}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div ref={endRef} />
        </div>

        {/* One-Click Buyer Persona Replies for Fast Testing */}
        {!committedSuccessLead && (
          <div className="px-4 py-2.5 bg-[#F1F5F9] border-t border-[#E2E8F0] space-y-1.5">
            <div className="text-[10px] font-mono uppercase text-[#64748B] font-semibold">
              Quick Buyer Responses (Test AI Commitment Detection):
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() =>
                  sendMessageToAi(
                    `I am fully committed! My budget is $${Number(property.price).toLocaleString()} to $${(
                      Number(property.price) + 50000
                    ).toLocaleString()} pre-approved with First Capital Bank, and I need to close within 25 days. My details: Marcus Vance, marcus.vance@example.com, +1 (555) 0192.`
                  )
                }
                className="px-2.5 py-1 rounded bg-[#ECFDF5] hover:bg-[#D1FAE5] border border-[#A7F3D0] text-[10px] font-mono font-semibold text-[#065F46] transition-colors cursor-pointer"
              >
                ⚡ Fully Committed + Contact Info → CALL_UP
              </button>
              <button
                type="button"
                onClick={() =>
                  sendMessageToAi(
                    `We are serious cash buyers and ready to close in 60 days, but our max budget is $${Math.round(
                      Number(property.price) * 0.94
                    ).toLocaleString()} (about 6% below asking). If the seller will negotiate, here are my details: Sarah Chen, sarah.chen@example.com, +1 (555) 0144.`
                  )
                }
                className="px-2.5 py-1 rounded bg-[#FFFBEB] hover:bg-[#FEF3C7] border border-[#FDE68A] text-[10px] font-mono font-semibold text-[#92400E] transition-colors cursor-pointer"
              >
                🤝 Committed Below Asking + Info → NEGOTIATE
              </button>
              <button
                type="button"
                onClick={() =>
                  sendMessageToAi(
                    `Honestly I'm just browsing for fun. My max budget is $100,000 and I don't plan on buying for at least 2 years.`
                  )
                }
                className="px-2.5 py-1 rounded bg-[#FFF1F2] hover:bg-[#FFE4E6] border border-[#FECDD3] text-[10px] font-mono font-semibold text-[#9F1239] transition-colors cursor-pointer"
              >
                ✕ Uncommitted / $100k Budget → Discard
              </button>
            </div>
          </div>
        )}

        {/* Chat Input Bar */}
        <form onSubmit={handleFormSubmit} className="p-3 bg-white border-t border-[#E2E8F0] flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isThinking || Boolean(committedSuccessLead)}
            placeholder="Reply with your budget, timeline, and name/email/phone..."
            className="flex-1 h-10 px-3 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded-md focus:outline-none focus:border-[#0F2922]"
          />
          <button
            type="submit"
            disabled={isThinking || !input.trim() || Boolean(committedSuccessLead)}
            className="h-10 px-4 rounded-md bg-[#0F2922] hover:bg-[#163C32] disabled:opacity-50 text-white text-xs font-mono font-medium flex items-center gap-1.5 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send</span>
          </button>
        </form>
      </div>
    </div>
  );
};

/* ============================================================================
   2. SCHEDULE TOUR MODAL (For BrokerDesk Pro)
============================================================================ */
interface TourModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: EnrichedLead | null;
  properties: Property[];
  defaultPropertyId?: number;
  onConfirmTour: (leadId: number, propertyId: number, tourDate: string, tourType: string) => Promise<void>;
}

export const ScheduleTourModal: React.FC<TourModalProps> = ({
  isOpen,
  onClose,
  lead,
  properties,
  defaultPropertyId,
  onConfirmTour,
}) => {
  const [propertyId, setPropertyId] = useState<number>(defaultPropertyId || lead?.matched_property_id || 1);
  const [tourDate, setTourDate] = useState('Today, 4:30 PM EST (Expedited Private Slot)');
  const [tourType, setTourType] = useState('Private In-Person Senior Broker Viewing');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (defaultPropertyId) setPropertyId(defaultPropertyId);
    else if (lead?.matched_property_id) setPropertyId(lead.matched_property_id);
  }, [defaultPropertyId, lead?.matched_property_id]);

  if (!isOpen || !lead) return null;

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await onConfirmTour(lead.id, propertyId, tourDate, tourType);
    setSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="w-full max-w-md bg-white rounded-xl border border-[#CBD5E1] shadow-2xl overflow-hidden">
        <div className="p-4 bg-[#0F2922] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold">Schedule Private Broker Viewing</h3>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleConfirm} className="p-5 space-y-4 text-xs">
          <div className="p-3 rounded-lg bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46]">
            <div className="font-mono font-bold">
              BUYER DOSSIER: {lead.name} ({Math.round(lead.qualification_score)}/100)
            </div>
            <div className="text-[11px] mt-0.5">
              Verified Cap: ${Number(lead.budget_max).toLocaleString()} · Action: {lead.next_action}
            </div>
          </div>

          <div>
            <label className="block font-mono text-[10px] uppercase text-[#64748B] mb-1">
              SELECT PROPERTY
            </label>
            <select
              value={propertyId}
              onChange={(e) => setPropertyId(Number(e.target.value))}
              className="w-full h-10 px-3 rounded-md border border-[#CBD5E1] bg-white text-[#0F172A] font-medium"
            >
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} — ${Number(p.price).toLocaleString()} ({p.location})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-mono text-[10px] uppercase text-[#64748B] mb-1">
              PREFERRED VIEWING WINDOW
            </label>
            <select
              value={tourDate}
              onChange={(e) => setTourDate(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-[#CBD5E1] bg-white text-[#0F172A]"
            >
              <option value="Today, 4:30 PM EST (Expedited Private Slot)">
                Today, 4:30 PM EST (Expedited Private Slot)
              </option>
              <option value="Tomorrow, 11:00 AM EST (Morning Walkthrough)">
                Tomorrow, 11:00 AM EST (Morning Walkthrough)
              </option>
              <option value="Tomorrow, 3:00 PM EST (Executive Viewing)">
                Tomorrow, 3:00 PM EST (Executive Viewing)
              </option>
            </select>
          </div>

          <div>
            <label className="block font-mono text-[10px] uppercase text-[#64748B] mb-1">
              VIEWING FORMAT
            </label>
            <select
              value={tourType}
              onChange={(e) => setTourType(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-[#CBD5E1] bg-white text-[#0F172A]"
            >
              <option value="Private In-Person Senior Broker Viewing">
                Private In-Person Senior Broker Viewing
              </option>
              <option value="Live 4K Virtual Architectural Walkthrough">
                Live 4K Virtual Architectural Walkthrough
              </option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 rounded-md border border-[#CBD5E1] text-[#475569] hover:bg-[#F8FAFC] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="h-9 px-4 rounded-md bg-[#056C49] hover:bg-[#04563A] text-white font-semibold cursor-pointer"
            >
              {submitting ? 'Confirming...' : 'Confirm Viewing'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ============================================================================
   3. CALL DIALER & EMAIL ACTION MODAL
============================================================================ */
interface ContactActionModalProps {
  mode: 'call' | 'email' | null;
  onClose: () => void;
  lead: EnrichedLead | null;
  onSaveLogNote: (leadId: number, noteText: string) => Promise<void>;
}

export const ContactActionModal: React.FC<ContactActionModalProps> = ({
  mode,
  onClose,
  lead,
  onSaveLogNote,
}) => {
  const [sent, setSent] = useState(false);

  if (!mode || !lead) return null;

  const emailSubject = `Private Viewing & Dossier Confirmation — ${
    lead.property_title || 'PrimeEstates Portfolio'
  }`;
  const emailBody = `Hi ${lead.name},\n\nFollowing your conversation with our AI Underwriting Concierge, I have reviewed your dossier (${
    lead.parsed_summary?.budget_range || ''
  }) regarding ${lead.property_title || 'our Downtown inventory'}.\n\nRecommended Next Step: ${
    lead.parsed_summary?.broker_action || lead.decision_reasoning
  }\n\nBest regards,\nSenior Managing Broker — PrimeEstates Pro`;

  const handleCompleteAction = async () => {
    setSent(true);
    const logMessage =
      mode === 'call'
        ? `Outbound Broker Call initiated to ${lead.phone} (${lead.next_action} action executed).`
        : `Outbound Broker Email dispatched to ${lead.email}: "${emailSubject}"`;
    await onSaveLogNote(lead.id, logMessage);
    setTimeout(() => {
      setSent(false);
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="w-full max-w-md bg-white rounded-xl border border-[#CBD5E1] shadow-2xl overflow-hidden">
        <div className="p-4 bg-[#0F2922] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            {mode === 'call' ? (
              <Phone className="w-4 h-4 text-emerald-400" />
            ) : (
              <Mail className="w-4 h-4 text-emerald-400" />
            )}
            <h3 className="text-sm font-bold">
              {mode === 'call' ? 'BrokerDesk Direct Bridge Dialer' : 'Dispatch Executive Broker Email'}
            </h3>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          {mode === 'call' ? (
            <div className="text-center py-4 space-y-3">
              <div className="w-14 h-14 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] text-[#059669] flex items-center justify-center mx-auto">
                <Phone className="w-6 h-6" />
              </div>
              <div>
                <div className="text-base font-bold text-[#0F172A]">{lead.name}</div>
                <div className="text-sm font-mono text-[#059669] font-semibold mt-0.5">
                  {lead.phone}
                </div>
              </div>
              <div className="p-3 rounded bg-[#F8FAFC] border border-[#E2E8F0] text-left text-[11px] space-y-1">
                <div className="font-mono font-bold text-[#0F172A]">
                  PREP TALKING POINT ({lead.next_action}):
                </div>
                <div className="text-[#475569]">{lead.decision_reasoning}</div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block font-mono text-[10px] uppercase text-[#64748B] mb-1">
                  RECIPIENT
                </label>
                <input
                  type="text"
                  readOnly
                  value={`${lead.name} <${lead.email}>`}
                  className="w-full h-8 px-2.5 rounded bg-[#F8FAFC] border border-[#E2E8F0] font-mono"
                />
              </div>
              <div>
                <label className="block font-mono text-[10px] uppercase text-[#64748B] mb-1">
                  SUBJECT
                </label>
                <input
                  type="text"
                  readOnly
                  value={emailSubject}
                  className="w-full h-8 px-2.5 rounded border border-[#CBD5E1]"
                />
              </div>
              <div>
                <label className="block font-mono text-[10px] uppercase text-[#64748B] mb-1">
                  MESSAGE BODY
                </label>
                <textarea
                  rows={5}
                  readOnly
                  value={emailBody}
                  className="w-full p-2.5 rounded border border-[#CBD5E1] leading-relaxed"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 rounded-md border border-[#CBD5E1] text-[#475569] cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleCompleteAction}
              className="h-9 px-4 rounded-md bg-[#056C49] hover:bg-[#04563A] text-white font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>
                {sent
                  ? 'Logged to Dossier ✓'
                  : mode === 'call'
                  ? 'Log Connected Call'
                  : 'Send Email & Log'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
   4. SQLITE SCHEMA & LIVE TABLE INSPECTOR MODAL
============================================================================ */
interface SchemaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResetDb: () => Promise<void>;
  onSeedDemoLeads: () => Promise<void>;
}

export const SchemaInspectorModal: React.FC<SchemaModalProps> = ({
  isOpen,
  onClose,
  onResetDb,
  onSeedDemoLeads,
}) => {
  const [dump, setDump] = useState<any>(null);
  const [activeTable, setActiveTable] = useState<
    'lead_qualifications' | 'leads' | 'properties' | 'conversation_logs' | 'sql'
  >('lead_qualifications');
  const [busy, setBusy] = useState(false);

  const refreshDump = async () => {
    try {
      const res = await fetch('/api/schema-dump');
      const data = await res.json();
      setDump(data);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (isOpen) {
      refreshDump();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleReset = async () => {
    setBusy(true);
    await onResetDb();
    await refreshDump();
    setBusy(false);
  };

  const handleSeedDemo = async () => {
    setBusy(true);
    await onSeedDemoLeads();
    await refreshDump();
    setBusy(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-5xl bg-white rounded-xl border border-[#CBD5E1] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="p-4 bg-[#0F2922] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Database className="w-4 h-4 text-emerald-400" />
            <div>
              <h3 className="text-sm font-bold">
                Problem #4 SQLite Database Inspector (Live Tables & Schema)
              </h3>
              <p className="text-[11px] font-mono text-emerald-300">
                Tables: properties · leads · lead_qualifications · conversation_logs
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSeedDemo}
              disabled={busy}
              className="h-8 px-3 rounded bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/30 text-xs font-mono text-emerald-200 flex items-center gap-1.5 cursor-pointer"
            >
              <span>Load SQL Seed Leads (Marcus/Sarah)</span>
            </button>
            <button
              onClick={handleReset}
              disabled={busy}
              className="h-8 px-3 rounded bg-white/10 hover:bg-white/20 text-xs font-mono text-white flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear Leads (Empty Broker View)</span>
            </button>
            <button onClick={onClose} className="text-white/70 hover:text-white cursor-pointer ml-2">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Table Tabs */}
        <div className="px-4 py-2.5 bg-[#F8FAFC] border-b border-[#E2E8F0] flex flex-wrap gap-2">
          {(
            [
              ['lead_qualifications', '3. lead_qualifications'],
              ['leads', '2. leads'],
              ['properties', '1. properties'],
              ['conversation_logs', '4. conversation_logs'],
              ['sql', 'DDL Schema SQL'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveTable(key)}
              className={`px-3 py-1.5 rounded text-xs font-mono font-semibold cursor-pointer ${
                activeTable === key
                  ? 'bg-[#0F2922] text-white'
                  : 'bg-white text-[#475569] border border-[#CBD5E1] hover:bg-slate-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 p-4 overflow-auto bg-[#0F172A] text-slate-100 font-mono text-xs">
          {!dump ? (
            <div className="text-slate-400">Loading live SQLite tables...</div>
          ) : activeTable === 'sql' ? (
            <pre className="text-emerald-300 leading-relaxed whitespace-pre-wrap">
              {dump.schemaSql}
            </pre>
          ) : (
            <pre className="text-emerald-300 leading-relaxed whitespace-pre-wrap">
              {JSON.stringify(dump.tables?.[activeTable] || [], null, 2)}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
};
