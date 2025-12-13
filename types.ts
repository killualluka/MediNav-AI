export enum AgentId {
  NAVIGATOR = 'NAVIGATOR',
  PIA = 'PIA', // Patient Information Agent
  AS = 'AS',   // Appointment Scheduler
  MRA = 'MRA', // Medical Records Agent
  BIA = 'BIA'  // Billing And Insurance Agent
}

export interface AgentConfig {
  id: AgentId;
  name: string;
  role: string;
  description: string;
  icon: string; // Lucide icon name
  color: string;
  systemInstruction: string;
  useSearch?: boolean;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  agentId?: AgentId; // The agent that generated this message
  timestamp: number;
  sources?: Array<{ title: string; uri: string }>;
}

export interface RouterResponse {
  target: AgentId;
  reasoning: string;
  context: string;
}

export enum AppState {
  IDLE = 'IDLE',
  ROUTING = 'ROUTING',
  GENERATING = 'GENERATING',
  ERROR = 'ERROR'
}