import React, { useState, useEffect, useCallback } from 'react';
import { EnrichedLead, Property } from './types';
import { BrokerDeskView } from './components/BrokerDeskView';
import { BuyerDiscoveryView } from './components/BuyerDiscoveryView';
import {
  BuyerViewingChatDrawer,
  ScheduleTourModal,
  ContactActionModal,
  SchemaInspectorModal,
} from './components/ActionModals';

export default function App() {
  // Default to Buyer Discovery View or Broker View (user can toggle anytime; Broker View starts empty!)
  const [activeView, setActiveView] = useState<'broker' | 'buyer'>('buyer');
  const [leads, setLeads] = useState<EnrichedLead[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSendingAi, setIsSendingAi] = useState<boolean>(false);

  // Buyer Viewing AI Chat Drawer State
  const [chatDrawerOpen, setChatDrawerOpen] = useState(false);
  const [chatProperty, setChatProperty] = useState<Property | null>(null);
  const [chatIntentMode, setChatIntentMode] = useState<'viewing' | 'ask'>('viewing');

  // Broker Modals State
  const [tourModalOpen, setTourModalOpen] = useState(false);
  const [tourPropertyId, setTourPropertyId] = useState<number | undefined>(undefined);
  const [contactModalMode, setContactModalMode] = useState<'call' | 'email' | null>(null);
  const [schemaModalOpen, setSchemaModalOpen] = useState(false);

  const fetchInitialData = useCallback(async () => {
    try {
      const [leadsRes, propsRes] = await Promise.all([
        fetch('/api/leads'),
        fetch('/api/properties'),
      ]);
      const leadsData = await leadsRes.json();
      const propsData = await propsRes.json();

      if (leadsData.leads) {
        setLeads(leadsData.leads);
        if (leadsData.leads.length > 0) {
          setSelectedLeadId(leadsData.leads[0].id);
        } else {
          setSelectedLeadId(null);
        }
      }
      if (propsData.properties) {
        setProperties(propsData.properties);
      }
    } catch (err) {
      console.error('Failed to load SQLite data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const selectedLead: EnrichedLead | null =
    leads.find((l) => l.id === selectedLeadId) || leads[0] || null;

  const handleSendMessage = async (leadId: number, message: string) => {
    setIsSendingAi(true);
    try {
      const res = await fetch(`/api/leads/${leadId}/engage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      const data = await res.json();
      if (data.leads) {
        setLeads(data.leads);
      }
    } catch (err) {
      console.error('Error engaging AI Qualifier:', err);
    } finally {
      setIsSendingAi(false);
    }
  };

  const handleSaveNote = async (leadId: number, noteText: string) => {
    try {
      const res = await fetch(`/api/leads/${leadId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note_text: noteText }),
      });
      const data = await res.json();
      if (data.lead) {
        setLeads((prev) => prev.map((l) => (l.id === leadId ? data.lead : l)));
      }
    } catch (err) {
      console.error('Error saving broker note:', err);
    }
  };

  const handleConfirmTour = async (
    leadId: number,
    propertyId: number,
    tourDate: string,
    tourType: string
  ) => {
    try {
      const res = await fetch(`/api/leads/${leadId}/tours`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property_id: propertyId,
          tour_date: tourDate,
          tour_type: tourType,
        }),
      });
      const data = await res.json();
      if (data.lead) {
        setLeads((prev) => prev.map((l) => (l.id === leadId ? data.lead : l)));
      }
    } catch (err) {
      console.error('Error scheduling tour:', err);
    }
  };

  const handleResetDb = async () => {
    try {
      const res = await fetch('/api/reset-db', { method: 'POST' });
      const data = await res.json();
      setLeads(data.leads || []);
      setSelectedLeadId(null);
      if (data.properties) {
        setProperties(data.properties);
      }
    } catch (err) {
      console.error('Error resetting DB:', err);
    }
  };

  const handleSeedDemoLeads = async () => {
    try {
      const res = await fetch('/api/seed-demo-leads', { method: 'POST' });
      const data = await res.json();
      if (data.leads) {
        setLeads(data.leads);
        if (data.leads.length > 0) setSelectedLeadId(data.leads[0].id);
      }
    } catch (err) {
      console.error('Error seeding demo leads:', err);
    }
  };

  if (loading && properties.length === 0) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 rounded-md bg-[#0F2922] text-emerald-400 font-mono text-xs font-bold flex items-center justify-center mx-auto">
            AI
          </div>
          <div className="text-xs font-mono text-[#475569]">
            Initializing SQLite Underwriting Core...
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {activeView === 'broker' ? (
        <BrokerDeskView
          leads={leads}
          properties={properties}
          selectedLead={selectedLead}
          onSelectLead={(lead) => setSelectedLeadId(lead.id)}
          onSwitchView={() => setActiveView('buyer')}
          onSendMessage={handleSendMessage}
          onSaveNote={handleSaveNote}
          onOpenTourModal={(lead, propId) => {
            setSelectedLeadId(lead.id);
            setTourPropertyId(propId);
            setTourModalOpen(true);
          }}
          onOpenCallModal={(lead) => {
            setSelectedLeadId(lead.id);
            setContactModalMode('call');
          }}
          onOpenEmailModal={(lead) => {
            setSelectedLeadId(lead.id);
            setContactModalMode('email');
          }}
          onOpenSchemaModal={() => setSchemaModalOpen(true)}
          isSendingAi={isSendingAi}
        />
      ) : (
        <BuyerDiscoveryView
          leads={leads}
          properties={properties}
          activeBuyer={selectedLead}
          onSwitchToBroker={() => setActiveView('broker')}
          onRequestViewingChat={(prop, mode) => {
            setChatProperty(prop);
            setChatIntentMode(mode);
            setChatDrawerOpen(true);
          }}
          onLaunchDialer={() => {
            if (selectedLead) {
              setContactModalMode('call');
            } else if (properties[0]) {
              setChatProperty(properties[0]);
              setChatIntentMode('viewing');
              setChatDrawerOpen(true);
            }
          }}
        />
      )}

      {/* Buyer AI Viewing & Qualification Chat Drawer */}
      <BuyerViewingChatDrawer
        isOpen={chatDrawerOpen}
        onClose={() => setChatDrawerOpen(false)}
        property={chatProperty}
        intentMode={chatIntentMode}
        onLeadCommittedToBroker={(newLead, allLeads) => {
          setLeads(allLeads);
          setSelectedLeadId(newLead.id);
        }}
        onSwitchToBrokerDesk={() => setActiveView('broker')}
      />

      <ScheduleTourModal
        isOpen={tourModalOpen}
        onClose={() => setTourModalOpen(false)}
        lead={selectedLead}
        properties={properties}
        defaultPropertyId={tourPropertyId}
        onConfirmTour={handleConfirmTour}
      />

      <ContactActionModal
        mode={contactModalMode}
        onClose={() => setContactModalMode(null)}
        lead={selectedLead}
        onSaveLogNote={handleSaveNote}
      />

      <SchemaInspectorModal
        isOpen={schemaModalOpen}
        onClose={() => setSchemaModalOpen(false)}
        onResetDb={handleResetDb}
        onSeedDemoLeads={handleSeedDemoLeads}
      />
    </>
  );
}
