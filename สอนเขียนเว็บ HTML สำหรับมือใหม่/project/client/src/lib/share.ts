/**
 * Social Media Share Utilities
 * Handles sharing movie information to various social media platforms
 */

export interface ShareData {
  title: string;
  description: string;
  url: string;
  posterUrl?: string;
}

/**
 * Generate share text for social media
 */
export const generateShareText = (data: ShareData): string => {
  return `🎬 ${data.title}\n\n${data.description}\n\n👉 ดูเลยที่: ${data.url}`;
};

/**
 * Share to Facebook
 */
export const shareToFacebook = (data: ShareData): void => {
  const url = new URL("https://www.facebook.com/sharer/sharer.php");
  url.searchParams.append("u", data.url);
  url.searchParams.append("quote", `${data.title} - ${data.description}`);
  window.open(url.toString(), "facebook-share", "width=600,height=400");
};

/**
 * Share to Twitter/X
 */
export const shareToTwitter = (data: ShareData): void => {
  const text = `🎬 ${data.title}\n${data.description}\n`;
  const url = new URL("https://twitter.com/intent/tweet");
  url.searchParams.append("text", text);
  url.searchParams.append("url", data.url);
  url.searchParams.append("hashtags", "ดูหนัง,DUYDODEE,ภาพยนตร์");
  window.open(url.toString(), "twitter-share", "width=600,height=400");
};

/**
 * Share to Line
 */
export const shareToLine = (data: ShareData): void => {
  const url = new URL("https://social-plugins.line.me/web/share");
  url.searchParams.append("url", data.url);
  url.searchParams.append("text", `${data.title} - ${data.description}`);
  window.open(url.toString(), "line-share", "width=600,height=400");
};

/**
 * Share to WhatsApp
 */
export const shareToWhatsApp = (data: ShareData): void => {
  const text = encodeURIComponent(generateShareText(data));
  const url = `https://wa.me/?text=${text}`;
  window.open(url, "whatsapp-share", "width=600,height=400");
};

/**
 * Share to Telegram
 */
export const shareToTelegram = (data: ShareData): void => {
  const text = encodeURIComponent(`${data.title}\n${data.description}`);
  const url = `https://t.me/share/url?url=${encodeURIComponent(data.url)}&text=${text}`;
  window.open(url, "telegram-share", "width=600,height=400");
};

/**
 * Copy to clipboard
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error("Failed to copy to clipboard:", error);
    return false;
  }
};

/**
 * Generate shareable movie URL
 */
export const generateShareableUrl = (movieId: string): string => {
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  return `${baseUrl}/movie/${movieId}`;
};

/**
 * Get social media share URLs
 */
export const getSocialMediaShareUrls = (data: ShareData) => {
  return {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(data.url)}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`${data.title} - ${data.description}`)}&url=${encodeURIComponent(data.url)}`,
    line: `https://social-plugins.line.me/web/share?url=${encodeURIComponent(data.url)}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(generateShareText(data))}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(data.url)}&text=${encodeURIComponent(data.title)}`,
  };
};
