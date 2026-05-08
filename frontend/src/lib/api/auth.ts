import type { SetupStatus, SetupResponse, TokenPair, User } from "./types";
import { apiClient, rawClient } from "./client";

export interface SetupPayload {
  username: string;
  password: string;
  email?: string;
  display_name?: string;
  humidor_name: string;
  humidor_description?: string;
  humidor_capacity?: number | null;
}

export async function getSetupStatus(): Promise<SetupStatus> {
  const { data } = await rawClient.get<SetupStatus>("/status");
  return data;
}

export async function runSetup(payload: SetupPayload): Promise<SetupResponse> {
  const { data } = await rawClient.post<SetupResponse>("/setup", payload);
  return data;
}

// Login uses application/x-www-form-urlencoded per OAuth2PasswordRequestForm
export async function login(username: string, password: string): Promise<TokenPair> {
  const params = new URLSearchParams();
  params.append("username", username);
  params.append("password", password);
  const { data } = await rawClient.post<TokenPair>("/auth/login", params, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
  return data;
}

export async function refreshTokens(refreshToken: string): Promise<TokenPair> {
  const { data } = await rawClient.post<TokenPair>("/auth/refresh", {
    refresh_token: refreshToken,
  });
  return data;
}

export async function logout(refreshToken: string): Promise<void> {
  await apiClient.post("/auth/logout", { refresh_token: refreshToken });
}

export async function getMe(): Promise<User> {
  const { data } = await apiClient.get<User>("/users/me");
  return data;
}
