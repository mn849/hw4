export const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8000";

export type InventoryItem = { size: string; quantity: number };

export type Product = {
  product_id: string;
  name: string;
  garment_type: string;
  description: string;
  colors: string;
  search_tags: string;
  image_file_path: string;
  price: number;
  inventory: InventoryItem[];
};

export type ProductCard = {
  product_id: string;
  name: string;
  price: number;
  short_description: string;
  image_file_path: string;
};

export type User = {
  id: number;
  first_name: string | null;
  last_name: string | null;
  name: string;
  email: string;
  created_at: string;
};

export type ChatReply = {
  reply: string;
  products: ProductCard[];
  suggestions: string[];
  route: "chat";
};

export type PageContext = {
  path?: string;
  product_id?: string;
  product_name?: string;
  description?: string;
  price?: number;
  colors?: string[];
};

export type ChatHistoryMessage = {
  id: number;
  role: "user" | "assistant";
  content: string;
  products: ProductCard[];
  created_at: string;
};

export async function fetchProducts(): Promise<Product[]> {
  const response = await fetch(`${API_BASE}/api/products`);
  if (!response.ok) throw new Error("Could not load products.");
  return response.json();
}

export async function fetchProduct(productId: string): Promise<Product> {
  const response = await fetch(`${API_BASE}/api/products/${encodeURIComponent(productId)}`);
  if (!response.ok) throw new Error("Product not found.");
  return response.json();
}

async function postAuth(path: string, body: Record<string, string>): Promise<{ message: string; user: User }> {
  const response = await fetch(`${API_BASE}/api/auth/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.detail ?? "Authentication request failed.");
  return payload;
}

export function registerAccount(body: { first_name: string; last_name: string; email: string; password: string }) {
  return postAuth("register", body);
}

export function loginAccount(body: { email: string; password: string }) {
  return postAuth("login", body);
}

export async function sendChatMessage(message: string, userId?: number, pageContext?: PageContext): Promise<ChatReply> {
  const response = await fetch(`${API_BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, user_id: userId ?? null, page_context: pageContext ?? null }),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.detail ?? "Chat request failed.");
  return payload;
}

export async function fetchChatHistory(userId: number): Promise<ChatHistoryMessage[]> {
  const response = await fetch(`${API_BASE}/api/chat/history/${userId}`);
  if (!response.ok) throw new Error("Could not load chat history.");
  const payload = await response.json();
  return payload.messages;
}

export function getStoredUser(): User | null {
  try {
    const value = localStorage.getItem("campus_customs_user");
    return value ? JSON.parse(value) as User : null;
  } catch {
    return null;
  }
}

export function imageUrl(path: string): string {
  return `${API_BASE}/images/${path}`;
}

export function parseColors(colors: string): string[] {
  try {
    const parsed = JSON.parse(colors);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
