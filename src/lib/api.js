import { getToken } from "./auth";

const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL || "";
const isLocalApiBase = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(
  configuredBaseUrl
);
const baseUrl =
  configuredBaseUrl && !(import.meta.env.PROD && isLocalApiBase)
    ? configuredBaseUrl
    : import.meta.env.DEV
      ? `${window.location.protocol}//${window.location.hostname}:4000`
      : "";

const request = async (path, options = {}) => {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const responseText = await res.text();
    let message = responseText;

    try {
      message = JSON.parse(responseText).error || responseText;
    } catch {
      // Keep the raw response text when the server does not return JSON.
    }

    throw new Error(message || "Request failed");
  }

  return res.json();
};

export const login = (username, password) =>
  request("/api/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });

export const fetchContent = () => request("/api/content");

export const saveContent = (content) =>
  request("/api/content", {
    method: "PUT",
    body: JSON.stringify({ content }),
  });

export const uploadImage = async (file, section) => {
  const formData = new FormData();
  formData.append("file", file);
  if (section) {
    formData.append("section", section);
  }

  const token = getToken();
  const res = await fetch(`${baseUrl}/api/upload`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: formData,
  });

  if (!res.ok) {
    const responseText = await res.text();
    let message = responseText;

    try {
      message = JSON.parse(responseText).error || responseText;
    } catch {
      // Keep the raw response text when the server does not return JSON.
    }

    throw new Error(message || "Upload failed");
  }

  return res.json();
};

export const submitContact = (payload) =>
  request("/api/contact", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const fetchMessages = () => request("/api/messages");
