import { randomInt } from "crypto";

export function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function randomPrice(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

export async function fetchPexelsImages(query: string, perPage = 3): Promise<string[]> {
  const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
  const PEXELS_API_URL = "https://api.pexels.com/v1/search";
  
  if (!PEXELS_API_KEY) {
    console.warn("PEXELS_API_KEY not set. Using placeholder images.");
    return [];
  }

  try {
    const res = await fetch(
      `${PEXELS_API_URL}?query=${encodeURIComponent(query)}&per_page=${perPage}`,
      {
        headers: {
          Authorization: PEXELS_API_KEY,
        },
      }
    );
    
    if (!res.ok) throw new Error(`Pexels API error: ${res.statusText}`);
    const data = await res.json();
    return data.photos.map((photo: any) => photo.src.large);
  } catch (error) {
    console.error("Error fetching images from Pexels:", error);
    return [];
  }
}
