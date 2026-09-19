export type Role = "citizen" | "field_officer" | "department_officer" | "admin";

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export interface AIAnalysis {
  category: string;
  subcategory: string;
  severity: string;
  symptoms: string[];
  department: string;
  confidence: number;
  summary: string;
}

export interface Incident {
  id: string;
  reference: string;
  title: string;
  category: string;
  area: string;
  lat: number;
  lon: number;
  complaints: number;
  affected: number;
  velocity: number;
  priority: number;
  severity: "critical" | "high" | "medium" | "low" | string;
  status: string;
  department: string;
  sla_deadline: string;
  sla_breached: boolean;
  root_cause: string;
  confidence: number;
}

export interface Complaint {
  id: string;
  description: string;
  category: string;
  status: string;
  incident_id: string | null;
  department: string;
  priority: number;
  lat: number;
  lon: number;
  submitted_at: string;
  ai: AIAnalysis | null;
}

export interface WorkOrder {
  id: string;
  incident_id: string;
  action: string;
  status: string;
}

export interface AuditLog {
  id: string;
  action: string;
  entity_id: string;
  created_at: string;
}

export interface DashboardOverview {
  total_complaints: number;
  active_incidents: number;
  critical_incidents: number;
  citizens_affected: number;
  sla_breaches: number;
  resolution_rate: number;
}

export interface Hotspot {
  id: string;
  lat: number;
  lon: number;
  priority: number;
  severity: string;
}
