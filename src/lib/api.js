import { getToken } from "./auth";

const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

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
    const message = await res.text();
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
