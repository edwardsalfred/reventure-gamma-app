export interface User {
  id: number;
  username: string;
  email?: string;
  password_hash: string;
  role: "user" | "admin";
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

export interface Presentation {
  id: number;
  user_id: number;
  meeting_id: string;
  meeting_title: string;
  gamma_generation_id: string;
  gamma_url: string | null;
  status: "pending" | "processing" | "completed" | "failed";
  proposal_text: string | null;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
}
