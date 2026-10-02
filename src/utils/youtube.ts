/**
 * Robust YouTube Extraction & Embedding Utility for Cinexus-HD
 * Handles standard watch URLs, short URLs (youtu.be), embeds, shorts, and raw IDs.
 */

/**
 * Extracts ONLY the clean 11-character YouTube video ID.
 * @param urlOrId Full YouTube URL, embed link, or raw ID
 * @returns 11-character video ID or null if invalid
 */
export function getYouTubeId(urlOrId?: string | null): string | null {
  if (!urlOrId || typeof urlOrId !== 'string') return null;
  const trimmed = urlOrId.trim();
  if (!trimmed) return null;

  // 1. Direct 11-character ID check (YouTube video IDs are exactly 11 characters: [a-zA-Z0-9_-])
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // 2. Comprehensive URL pattern matchers:
  // - https://www.youtube.com/watch?v=VIDEO_ID
  // - https://m.youtube.com/watch?v=VIDEO_ID&feature=...
  // - https://youtu.be/VIDEO_ID?t=10s
  // - https://www.youtube-nocookie.com/embed/VIDEO_ID
  // - https://www.youtube.com/embed/VIDEO_ID
  // - https://www.youtube.com/shorts/VIDEO_ID
  // - https://www.youtube.com/v/VIDEO_ID
  const patterns = [
    /(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([a-zA-Z0-9_-]{11})/i,
    /[?&]v=([a-zA-Z0-9_-]{11})/i,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/i,
    /embed\/([a-zA-Z0-9_-]{11})/i
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match && match[1] && match[1].length === 11) {
      return match[1];
    }
  }

  // 3. Fallback: Search for any 11-character string if string mentions youtube
  if (trimmed.includes('youtube') || trimmed.includes('youtu.be')) {
    const match = trimmed.match(/([a-zA-Z0-9_-]{11})/);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Constructs official, privacy-enhanced YouTube embed URL using youtube-nocookie.com
 * to prevent third-party cookie blocks and playback errors.
 */
export function getYouTubeEmbedUrl(
  urlOrId?: string | null,
  options: {
    autoplay?: boolean;
    mute?: boolean;
    modestbranding?: boolean;
    rel?: boolean;
    controls?: boolean;
    enablejsapi?: boolean;
  } = {}
): string | null {
  const id = getYouTubeId(urlOrId);
  if (!id) return null;

  const {
    autoplay = true,
    mute = false,
    modestbranding = true,
    rel = false,
    controls = true,
    enablejsapi = true
  } = options;

  const params = new URLSearchParams({
    autoplay: autoplay ? '1' : '0',
    mute: mute ? '1' : '0',
    modestbranding: modestbranding ? '1' : '0',
    rel: rel ? '1' : '0',
    controls: controls ? '1' : '0',
    enablejsapi: enablejsapi ? '1' : '0',
    iv_load_policy: '3',
    playsinline: '1',
    origin: typeof window !== 'undefined' ? window.location.origin : ''
  });

  return `https://www.youtube-nocookie.com/embed/${id}?${params.toString()}`;
}

/**
 * Returns YouTube video thumbnail URL
 */
export function getYouTubeThumbnailUrl(
  urlOrId?: string | null,
  quality: 'maxres' | 'hq' | 'mq' | 'default' = 'maxres'
): string | null {
  const id = getYouTubeId(urlOrId);
  if (!id) return null;

  switch (quality) {
    case 'maxres':
      return `https://img.youtube.com/vi/${id}/maxresdefault.jpg`;
    case 'hq':
      return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
    case 'mq':
      return `https://img.youtube.com/vi/${id}/mqdefault.jpg`;
    default:
      return `https://img.youtube.com/vi/${id}/default.jpg`;
  }
}

export default {
  getYouTubeId,
  getYouTubeEmbedUrl,
  getYouTubeThumbnailUrl
};
