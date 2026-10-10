export interface ConversationLog {
  id: number;
  lead_id: number;
  lead_name: string;
  sender: 'User' | 'AI Agent';
  message_text: string;
  created_at: string;
}

export interface BrokerNote {
  id: number;
  lead_id: number;
  note_text: string;
  author: string;
  created_at: string;
}

export interface ScheduledTour {
  id: number;
  lead_id: number;
  property_id: number;
  property_title?: string;
  tour_date: string;
  tour_type: string;
  status: string;
}

export interface ParsedLeadSummary {
  buyer_name?: string;
  budget_range?: string;
  target_location?: string;
  timeline?: string;
  financial_readiness?: string;
  matched_property?: string | null;
  verdict?: 'HOT_LEAD' | 'QUALIFIED_NEGOTIATION' | 'AMBIGUOUS_LEAD' | string;
  broker_action?: string;
  role_tag?: string;
  time_ago?: string;
  case_id?: string;
  confidence_factor?: number;
}

export interface EnrichedLead {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: 'QUALIFIED' | 'AMBIGUOUS';
  created_at: string;
  budget_min: number;
  budget_max: number;
  location_preferences: string;
  timeline_months: number;
  qualification_score: number;
  next_action: 'CALL_UP' | 'NEGOTIATE';
  decision_reasoning: string;
  lead_summary: string;
  matched_property_id: number | null;
  property_title?: string;
  property_price?: number;
  property_location?: string;
  property_bedrooms?: number;
  property_type?: string;
  property_description?: string;
  parsed_summary: ParsedLeadSummary;
  conversation_logs: ConversationLog[];
  broker_notes: BrokerNote[];
  scheduled_tours: ScheduledTour[];
}

export interface Property {
  id: number;
  title: string;
  price: number;
  location: string;
  bedrooms: number;
  property_type: string;
  description: string;
  is_available: number;
  created_at: string;
}
