import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string, formatString: string = "PPP"): string {
  return format(new Date(date), formatString);
}

export function formatTime(date: Date | string, formatString: string = "h:mm a"): string {
  return format(new Date(date), formatString);
}

export function formatDateTime(datetime: string | Date): string {
  const date = new Date(datetime);
  return date.toLocaleString("en-US", {
    timeZone: "UTC",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

// Generate a random username (8-digit number)
export function generateUsername(): string {
  return Math.floor(10000000 + Math.random() * 90000000).toString();
}

// Format assessment score with color indicators
export function getScoreColor(score: number): string {
  if (score < 30) return "text-green-500";
  if (score < 50) return "text-blue-500";
  if (score < 70) return "text-yellow-500";
  return "text-red-500";
}

// WebSocket utilities
export function createWebSocketConnection() {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const wsUrl = `${protocol}//${window.location.host}/ws`;
  return new WebSocket(wsUrl);
}

// Create initials avatar from username
export function getInitials(username: string): string {
  if (username.length === 8 && /^\d+$/.test(username)) {
    // For 8-digit usernames, use first 2 digits
    return username.substring(0, 2);
  }
  
  return username.substring(0, 2).toUpperCase();
}

// Handle API errors
export function handleApiError(error: any): string {
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return "An unexpected error occurred";
}

// Get relative time string (e.g. "2 hours ago")
export function getRelativeTimeString(date: Date | string): string {
  const now = new Date();
  const then = new Date(date);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);
  
  if (seconds < 60) {
    return "just now";
  }
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  }
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  }
  
  const days = Math.floor(hours / 24);
  if (days < 30) {
    return `${days} day${days === 1 ? "" : "s"} ago`;
  }
  
  const months = Math.floor(days / 30);
  if (months < 12) {
    return `${months} month${months === 1 ? "" : "s"} ago`;
  }
  
  const years = Math.floor(months / 12);
  return `${years} year${years === 1 ? "" : "s"} ago`;
}

// Truncate text with ellipsis if it exceeds the specified length
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

export function toEmbedUrl(raw: string): string {
  try {
    const url = new URL(raw);
    let id: string | null = null;

    // standard YouTube watch URL
    if (
      url.hostname.includes("youtube.com") &&
      (id = url.searchParams.get("v"))
    ) {
      return `https://www.youtube.com/embed/${id}`;
    }
    // short YouTube URL
    if (url.hostname.includes("youtu.be")) {
      id = url.pathname.slice(1);
      return `https://www.youtube.com/embed/${id}`;
    }

    // fallback to whatever was passed
    return raw;
  } catch {
    return raw;
  }
}
