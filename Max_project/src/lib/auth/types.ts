export type AuthMode = "demo" | "clerk" | "supabase";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
};
