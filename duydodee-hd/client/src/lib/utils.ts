import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function convertYoutubeUrl(url: string): string {
  const youtubeRegex =
    /^https?:\/\/(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})|^https?:\/\/youtu\.be\/([a-zA-Z0-9_-]{11})/;
  const match = url.match(youtubeRegex);
  if (match) {
    const videoId = match[1] || match[2];
    return `https://www.youtube.com/embed/${videoId}`;
  }
  return url; // Return original url if not a standard YouTube video url
}
