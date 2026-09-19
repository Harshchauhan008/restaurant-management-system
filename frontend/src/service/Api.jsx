const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8080/api";

export async function getMenu() {
  const response = await fetch(
    `${API_BASE_URL}/menu`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch menu");
  }

  return response.json();
}

export async function getReviews() {
  const response = await fetch(
    `${API_BASE_URL}/reviews`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch reviews");
  }

  return response.json();
}