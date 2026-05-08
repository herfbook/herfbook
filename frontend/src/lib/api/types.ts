export type UUID = string;

export interface User {
  id: UUID;
  username: string;
  email: string | null;
  display_name: string | null;
  is_admin: boolean;
  preferences: Record<string, unknown> | null;
  sharing_defaults: Record<string, unknown> | null;
  created_at: string; // ISO datetime
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: "bearer";
}

export interface SetupStatus {
  setup_required: boolean;
  version: string;
}

export interface SetupResponse {
  user: User;
  access_token: string;
  refresh_token: string;
  token_type: "bearer";
  humidor_id: UUID;
}
