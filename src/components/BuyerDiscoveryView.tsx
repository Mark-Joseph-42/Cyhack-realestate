import React, { useState } from 'react';
import {
  Search,
  Building2,
  Phone,
  Bell,
  SlidersHorizontal,
  MapPin,
  Banknote,
  Clock,
  Sparkles,
  CheckCircle2,
  Heart,
  Bookmark,
  Calendar,
  MessageSquare,
  Brain,
  Info,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { EnrichedLead, Property } from '../types';
import { getPropertyMeta } from '../utils/propertyImages';

interface BuyerDiscoveryViewProps {
  leads: EnrichedLead[];
  properties: Property[];
  activeBuyer: EnrichedLead | null;
  onSwitchToBroker: () => void;
  onRequestViewingChat: (property: Property, intentMode: 'viewing' | 'ask') => void;
  onLaunchDialer: () => void;
}

export const BuyerDiscoveryView: React.FC<BuyerDiscoveryViewProps> = ({
  leads,
  properties,
  activeBuyer,
  onSwitchToBroker,
  onRequestViewingChat,
  onLaunchDialer,
}) => {
  const [locationFilter, setLocationFilter] = useState('Downtown / Central, Financial Core');
  const [targetBudget, setTargetBudget] = useState<number>(850000);
  const [timelineOption, setTimelineOption] = useState('< 30 Days (Immediate)');
  const [savedIds, setSavedIds] = useState<number[]>([1]);
  const [showAllInventory, setShowAllInventory] = useState(false);

  const toggleSave = (id: number) => {
    setSavedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const orderedProperties = [...properties].sort((a, b) => {
    const priorityOrder: Record<number, number> = { 1: 1, 6: 2, 7: 3, 3: 4, 5: 5, 2: 6, 4: 7 };
    return (priorityOrder[a.id] || 99) - (priorityOrder[b.id] || 99);
  });

  const filteredProperties = orderedProperties.filter((p) => {
    if (!showAllInventory) {
      if (
        targetBudget >= 800000 &&
        targetBudget <= 950000 &&
        locationFilter.toLowerCase().includes('downtown')
      ) {
        return [1, 6, 7].includes(p.id);
      }
    }
    const matchesBudget = p.price <= targetBudget + 120000;
    const locTerm = locationFilter.split('/')[0].trim().toLowerCase();
    const matchesLoc =
      !locTerm || locTerm === 'all' || locTerm.includes('downtown')
        ? true
        : p.location.toLowerCase().includes(locTerm) || p.title.toLowerCase().includes(locTerm);
    return matchesBudget && matchesLoc;
  });

  const displayProperties =
    filteredProperties.length > 0 ? filteredProperties : orderedProperties.slice(0, 3);

  const activeBuyerName = activeBuyer ? activeBuyer.name : 'Prospective Buyer';
  const activeConfidence = activeBuyer ? Math.round(activeBuyer.qualification_score) : 95;

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0F172A]">
      {/* Top Dark Emerald Live Qualification Sync Bar */}
      <div className="bg-[#081C15] text-emerald-400 px-6 py-1.5 flex items-center justify-between text-[11px] font-mono border-b border-[#163C32]">
        <div className="flex items-center gap-2 truncate">
          <span className="font-semibold text-emerald-400">LIVE QUALIFICATION SYNC:</span>
          <span className="text-emerald-200/90 truncate">
            {activeBuyer
              ? `${activeBuyer.name} dossier evaluated with ${activeConfidence}/100 underwriting confidence (${activeBuyer.next_action}) · ${leads.length} Committed in BrokerDesk`
              : `Click "Request Viewing" on any property to launch the Gemini/Gemma AI Qualifier Chat · (${leads.length} Committed in BrokerDesk)`}
          </span>
        </div>
        <button
          onClick={onSwitchToBroker}
          className="text-emerald-300 hover:text-white font-medium flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
        >
          <span>Switch to Broker Triage View ({leads.length})</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main Header Bar */}
      <header className="bg-white border-b border-[#E2E8F0] px-6 py-3 flex items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-[#0F5132] flex items-center justify-center text-white">
              <Building2 className="w-4 h-4 text-emerald-300" />
            </div>
            <span className="text-lg font-bold tracking-tight text-[#0F172A]">
              PrimeEstates Pro
            </span>
          </div>

          <div className="relative hidden md:block w-72">
            <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              placeholder="Downtown / Central luxury"
              className="w-full h-9 pl-8 pr-11 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-md text-[#0F172A] focus:outline-none focus:border-[#0F2922]"
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-[#64748B] bg-white px-1.5 py-0.5 rounded border border-[#E2E8F0]">
              ⌘K
            </span>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-3.5">
          <button
            onClick={onLaunchDialer}
            className="h-9 px-4 rounded-md bg-[#0F2922] hover:bg-[#163C32] text-white text-xs font-medium flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <Phone className="w-3.5 h-3.5 text-emerald-400" />
            <span>Launch Dialer</span>
          </button>

          <button
            onClick={() => setShowAllInventory(!showAllInventory)}
            title="Toggle Full SQLite Property Inventory"
            className="w-8 h-8 rounded-md border border-[#E2E8F0] hover:bg-[#F8FAFC] flex items-center justify-center text-[#475569] relative cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            <span className="w-2 h-2 rounded-full bg-[#E11D48] absolute top-1.5 right-1.5" />
          </button>

          <button
            onClick={onSwitchToBroker}
            title="Switch to BrokerDesk Pro"
            className="w-8 h-8 rounded-md border border-[#E2E8F0] hover:bg-[#F8FAFC] flex items-center justify-center text-[#475569] cursor-pointer"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>

          <div className="h-6 w-px bg-[#E2E8F0]" />

          {/* Buyer Session Pill */}
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-[#0F2922] text-white font-mono text-xs font-bold flex items-center justify-center border-2 border-[#10B981]">
                {activeBuyerName
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)}
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] border-2 border-white absolute -bottom-0.5 -right-0.5" />
            </div>
            <span className="text-xs font-semibold text-[#0F172A]">{activeBuyerName}</span>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-[1400px] w-full mx-auto px-6 py-6 space-y-5">
        {/* 1. Headline Strip */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="px-3 py-1 rounded-full bg-[#D1FAE5] text-[#065F46] border border-[#6EE7B7] text-[11px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
              <span>⚡ AI UNDERWRITING ACTIVATED</span>
            </span>
            <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">
              Find Your Dream Home in Minutes
            </h1>
            <span className="text-xs text-[#64748B] hidden sm:inline">
              · Click "Request Viewing" to chat with our AI Qualifier & escalate to BrokerDesk
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-[#64748B]">
              Dossier #PRIME-88219
            </span>
            <span className="px-2.5 py-1 rounded bg-[#D1FAE5] text-[#065F46] border border-[#6EE7B7] text-xs font-mono font-bold tabular-nums">
              {activeConfidence}/100 Confidence
            </span>
          </div>
        </div>

        {/* 2. Interactive Filter Control Bar */}
        <div className="p-3 rounded-xl bg-white border border-[#E2E8F0] shadow-2xs grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
          <div className="lg:col-span-5 flex items-center gap-2.5 h-12 px-3.5 rounded-lg border border-[#CBD5E1] bg-white focus-within:border-[#0F2922]">
            <MapPin className="w-4 h-4 text-[#059669] shrink-0" />
            <input
              type="text"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              placeholder="Enter neighborhood, district, or city..."
              className="w-full text-xs font-medium text-[#0F172A] focus:outline-none"
            />
          </div>

          <div className="lg:col-span-3 flex flex-col justify-center h-12 px-3.5 rounded-lg border border-[#CBD5E1] bg-white">
            <div className="flex items-center justify-between text-[10px] font-mono uppercase mb-1">
              <span className="text-[#64748B] flex items-center gap-1">
                <Banknote className="w-3.5 h-3.5 text-[#059669]" />
                TARGET BUDGET
              </span>
              <span className="font-bold text-[#059669] tabular-nums">
                ${targetBudget.toLocaleString()}
              </span>
            </div>
            <input
              type="range"
              min={250000}
              max={1350000}
              step={10000}
              value={targetBudget}
              onChange={(e) => setTargetBudget(Number(e.target.value))}
              className="w-full h-1.5 bg-[#E2E8F0] rounded-lg appearance-none cursor-pointer accent-[#059669]"
            />
          </div>

          <div className="lg:col-span-2 flex items-center justify-between h-12 px-3.5 rounded-lg border border-[#CBD5E1] bg-white relative">
            <div className="flex items-center gap-2 min-w-0">
              <Clock className="w-4 h-4 text-[#64748B] shrink-0" />
              <div className="min-w-0">
                <div className="text-[9px] font-mono uppercase text-[#64748B]">TIMELINE</div>
                <select
                  value={timelineOption}
                  onChange={(e) => setTimelineOption(e.target.value)}
                  className="text-xs font-semibold text-[#0F172A] bg-transparent focus:outline-none cursor-pointer truncate pr-2"
                >
                  <option value="< 30 Days (Immediate)">&lt; 30 Days (Immediate)</option>
                  <option value="60 Days (2 Months)">60 Days (2 Months)</option>
                  <option value="90 Days (3 Months)">90 Days (3 Months)</option>
                  <option value="> 6 Months (Flexible)">&gt; 6 Months (Flexible)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <button
              onClick={() => setShowAllInventory(!showAllInventory)}
              className="w-full h-12 rounded-lg bg-[#0F2922] hover:bg-[#163C32] text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>
                {showAllInventory
                  ? `Showing All (${properties.length})`
                  : 'Curate Matches (18)'}
              </span>
            </button>
          </div>
        </div>

        {/* 3. Curated Sub-Banner Strip */}
        <div className="px-4 py-3 rounded-lg bg-white border border-[#E2E8F0] flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-bold text-[#0F172A]">
              Curated Properties for {activeBuyerName}
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#6EE7B7]/40 text-[#065F46] text-[11px] font-mono font-bold">
              {displayProperties.length} Direct Fits
            </span>
            <span className="flex items-center gap-1 text-xs font-mono text-[#059669]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Pre-Underwritten to $900,000</span>
            </span>
          </div>

          <button
            onClick={() => setShowAllInventory(!showAllInventory)}
            className="text-xs font-mono text-[#059669] hover:underline cursor-pointer"
          >
            {showAllInventory
              ? 'Show Top 3 Curated Dossiers Only'
              : `View All ${properties.length} SQLite Properties →`}
          </button>
        </div>

        {/* 4. Property Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayProperties.map((prop, index) => {
            const meta = getPropertyMeta(prop.id);
            const isTopCard = index === 0;
            const isSaved = savedIds.includes(prop.id);

            const displayTitle =
              prop.id === 1
                ? 'Luxury 3BHK Skyline Penthouse with Private Terrace'
                : prop.title;

            const displayLocation =
              prop.id === 1 ? 'Downtown / Financial Core' : prop.location;

            return (
              <div
                key={prop.id}
                className={`rounded-xl bg-white overflow-hidden flex flex-col transition-all ${
                  isTopCard
                    ? 'border-2 border-[#059669] shadow-sm'
                    : 'border border-[#E2E8F0] hover:border-[#CBD5E1] shadow-2xs'
                }`}
              >
                {/* Image Header */}
                <div className="relative h-56 w-full bg-[#0F172A] overflow-hidden">
                  <img
                    src={meta.image}
                    alt={displayTitle}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/15" />

                  <div className="absolute top-3.5 left-3.5 flex items-center gap-1.5">
                    <span className="px-2.5 py-1 rounded bg-[#081C15]/90 backdrop-blur-xs text-emerald-300 border border-emerald-500/30 text-[11px] font-mono font-semibold flex items-center gap-1 tabular-nums">
                      <span>⚡ {meta.matchScore}% Match</span>
                    </span>
                    <span
                      className={`px-2.5 py-1 rounded text-[11px] font-mono font-bold ${
                        meta.matchBadgeStyle === 'emerald'
                          ? 'bg-[#6EE7B7] text-[#064E3B]'
                          : 'bg-[#FDE68A] text-[#78350F]'
                      }`}
                    >
                      {meta.matchBadge}
                    </span>
                  </div>

                  <button
                    onClick={() => toggleSave(prop.id)}
                    aria-label="Save property"
                    className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-white/95 hover:bg-white text-[#0F172A] flex items-center justify-center shadow-xs transition-colors cursor-pointer"
                  >
                    {isTopCard ? (
                      <Heart
                        className={`w-4 h-4 ${
                          isSaved ? 'fill-[#E11D48] text-[#E11D48]' : 'text-[#0F172A]'
                        }`}
                      />
                    ) : (
                      <Bookmark
                        className={`w-4 h-4 ${
                          isSaved ? 'fill-[#0F2922] text-[#0F2922]' : 'text-[#0F172A]'
                        }`}
                      />
                    )}
                  </button>

                  <div className="absolute bottom-3.5 left-4 right-4 flex items-end justify-between gap-2">
                    <div>
                      <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-300 mb-0.5">
                        {meta.kickerText}
                      </div>
                      <div className="text-2xl font-bold text-white font-sans tracking-tight tabular-nums">
                        ${Number(prop.price).toLocaleString()}
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded bg-black/65 backdrop-blur-xs text-white/90 text-[11px] font-mono tabular-nums border border-white/15">
                      {meta.monthlyEst}
                    </span>
                  </div>
                </div>

                {/* Card Content Body */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs text-[#64748B] mb-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#059669] shrink-0" />
                      <span className="font-medium text-[#334155]">{displayLocation}</span>
                      <span>·</span>
                      <span>{meta.unitAddress}</span>
                    </div>

                    <h3 className="text-base font-bold text-[#0F172A] leading-snug line-clamp-2 min-h-[2.75rem]">
                      {displayTitle}
                    </h3>

                    <div className="mt-3 grid grid-cols-3 divide-x divide-[#E2E8F0] rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] py-2.5 text-center">
                      <div className="px-2">
                        <div className="text-[9px] font-mono uppercase text-[#64748B] mb-0.5">
                          BEDROOMS
                        </div>
                        <div className="text-xs font-bold text-[#0F172A] tabular-nums">
                          {prop.bedrooms} Beds
                        </div>
                      </div>
                      <div className="px-2">
                        <div className="text-[9px] font-mono uppercase text-[#64748B] mb-0.5">
                          BATHROOMS
                        </div>
                        <div className="text-xs font-bold text-[#0F172A] tabular-nums">
                          {meta.bathrooms}
                        </div>
                      </div>
                      <div className="px-2">
                        <div className="text-[9px] font-mono uppercase text-[#64748B] mb-0.5">
                          TOTAL SPACE
                        </div>
                        <div className="text-xs font-bold text-[#0F172A] tabular-nums">
                          {meta.sqft}
                        </div>
                      </div>
                    </div>

                    <div
                      className={`mt-3 p-3 rounded-lg border text-xs leading-relaxed flex items-start gap-2.5 ${
                        meta.insightType === 'ai'
                          ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#065F46]'
                          : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#334155]'
                      }`}
                    >
                      {meta.insightType === 'ai' ? (
                        <Brain className="w-4 h-4 text-[#059669] shrink-0 mt-0.5" />
                      ) : meta.insightType === 'warning' ? (
                        <AlertCircle className="w-4 h-4 text-[#475569] shrink-0 mt-0.5" />
                      ) : (
                        <Info className="w-4 h-4 text-[#475569] shrink-0 mt-0.5" />
                      )}
                      <div>
                        <span className="font-bold">{meta.insightTitle}</span> {meta.insightText}
                      </div>
                    </div>
                  </div>

                  {/* Both "Request Viewing" and "Ask AI" open the live AI Qualification Chat Drawer! */}
                  <div className="grid grid-cols-2 gap-2.5 pt-1">
                    <button
                      onClick={() => onRequestViewingChat(prop, 'viewing')}
                      className="h-10 rounded-lg bg-[#056C49] hover:bg-[#04563A] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Request Viewing</span>
                    </button>
                    <button
                      onClick={() => onRequestViewingChat(prop, 'ask')}
                      className="h-10 rounded-lg bg-[#EEF2FF] hover:bg-[#E0E7FF] text-[#1E1B4B] border border-[#C7D2FE] text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-[#3730A3]" />
                      <span>Ask AI</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
};
