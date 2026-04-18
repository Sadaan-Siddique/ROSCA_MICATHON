import axios from "axios";
import { toast } from "sonner";

const apiBaseUrl = import.meta.env.VITE_API_URL;
if (!apiBaseUrl && import.meta.env.PROD) {
  throw new Error("Missing VITE_API_URL. Create kameti-pool/.env and set VITE_API_URL.");
}

function safeUserMessage(error: unknown) {
  if (!axios.isAxiosError(error)) return "Request failed";

  const status = error.response?.status;
  const serverMessage = (error.response?.data as { error?: string } | undefined)?.error ?? "";
  const url = typeof error.config?.url === "string" ? error.config.url : "";

  if (status === 429) return "Too many requests. Please try again in a minute.";
  if (status === 404 && url.includes("/committees/by-invite")) return "Invalid invite code.";
  if (status === 404 && serverMessage.toLowerCase().includes("invite")) return "Invalid invite code.";
  if (status === 400 && serverMessage.toLowerCase().includes("otp")) return "Invalid OTP. Please try again.";
  if (status && status >= 500) return "Server error. Please try again.";

  // For common validation failures, don’t leak internal wording.
  if (status === 400) return "Please check your input and try again.";
  if (status === 404) return "Not found.";

  return "Request failed";
}

export const api = axios.create({
  baseURL: apiBaseUrl ?? "http://localhost:4000/api",
  timeout: 10000
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = safeUserMessage(error);
    if (!error?.config?.silentError) {
      toast.error(message);
    }
    return Promise.reject(error);
  }
);
