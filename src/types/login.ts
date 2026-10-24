export type AuthProviderId = "google" | "github" | "twitter";

export type AuthProvider = {
  id: AuthProviderId;
  label: string;
  iconPath: string;
};
