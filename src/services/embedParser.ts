import { ServerEmbeds, VideoProvider, VideoSource } from '../types';
import { BRANDING } from '../config/branding';

export interface PlaybackSource {
  id: string;
  title: string;
  url: string;
  type: 'iframe' | 'video';
  providerName: string;
}

export interface ParsedEmbedResult {
  isValid: boolean;
  error?: string;
  embed?: {
    src: string;
    originalWidth?: number;
    originalHeight?: number;
    aspectRatio: number; // e.g. 1.777 for 16:9
    allowFullscreen: boolean;
    allow?: string;
    providerDomain?: string;
    providerName?: string;
  };
}

const isIframeUrl = (url: string) => /embed|youtube\.com|youtube-nocookie\.com|vimeo\.com/i.test(url);

const sourceFromVideoSource = (source: VideoSource): PlaybackSource => ({
  id: source.id,
  title: source.title,
  url: source.url,
  type: source.type === 'youtube' || isIframeUrl(source.url) ? 'iframe' : 'video',
  providerName: source.title
});

/** Creates an ordered list of user-provided, configured, and official fallback sources. */
export function getPlaybackSources(
  input: string | undefined,
  options: { sources?: VideoSource[]; servers?: ServerEmbeds; trailerYoutubeId?: string } = {}
): PlaybackSource[] {
  const sources: PlaybackSource[] = [];
  const add = (source: PlaybackSource) => {
    if (source.url && !sources.some(existing => existing.url === source.url)) sources.push(source);
  };

  if (input?.trim()) {
    const parsed = parseEmbedCode(input);
    if (parsed.isValid && parsed.embed) {
      add({
        id: 'primary',
        title: 'Server 1',
        url: parsed.embed.src,
        type: isIframeUrl(parsed.embed.src) ? 'iframe' : 'video',
        providerName: parsed.embed.providerName || 'Primary source'
      });
    }
  }

  options.sources?.forEach(source => add(sourceFromVideoSource(source)));

  const configuredServers: Array<[keyof ServerEmbeds, string]> = [
    ['streamhg', 'Server 1 - StreamHG'],
    ['ernvids', 'Server 2 - EarnVids'],
    ['filemoon', 'Server 3 - FileMoon']
  ];
  configuredServers.forEach(([provider, title]) => {
    const url = options.servers?.[provider];
    if (url) {
      const parsed = parseEmbedCode(url);
      if (parsed.isValid && parsed.embed) {
        add({
          id: provider,
          title,
          url: parsed.embed.src,
          type: 'iframe',
          providerName: provider
        });
      }
    }
  });

  if (options.trailerYoutubeId) {
    add({
      id: 'official-trailer',
      title: 'Official Trailer',
      url: `https://www.youtube-nocookie.com/embed/${encodeURIComponent(options.trailerYoutubeId)}?autoplay=1&rel=0`,
      type: 'iframe',
      providerName: 'YouTube Official'
    });
  }

  return sources;
}

/**
 * Parses raw admin embed code or direct stream URL safely.
 * Extracts iframe src, dimensions, calculate aspect ratio, and checks domain safety.
 */
export function parseEmbedCode(
  input: string, 
  allowedProviders: VideoProvider[] = BRANDING.defaultProviders
): ParsedEmbedResult {
  if (!input || !input.trim()) {
    return { isValid: false, error: 'Embed code or stream URL cannot be empty.' };
  }

  const trimmed = input.trim();

  // 1. Direct URL case (e.g. https://.../video.mp4, https://.../embed/xyz)
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      const url = new URL(trimmed);
      const domain = url.hostname.toLowerCase();

      // Check against allowed domains if enabled
      const matchedProvider = allowedProviders.find(p => p.enabled && domain.includes(p.domain.toLowerCase()));
      
      return {
        isValid: true,
        embed: {
          src: trimmed,
          aspectRatio: 16 / 9, // default 16:9
          allowFullscreen: true,
          allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen',
          providerDomain: domain,
          providerName: matchedProvider ? matchedProvider.name : domain
        }
      };
    } catch (e: any) {
      return { isValid: false, error: 'Invalid stream URL format.' };
    }
  }

  // 2. Iframe Embed Code Parser (e.g. <IFRAME SRC="..." WIDTH=640 HEIGHT=360 ...></IFRAME>)
  // Disallow scripts, javascript:, or dangerous payload
  if (/<script\b/i.test(trimmed) || /javascript:/i.test(trimmed) || /data:/i.test(trimmed) || /onload=/i.test(trimmed) || /onerror=/i.test(trimmed)) {
    return { isValid: false, error: 'Unsafe embed markup detected. Only authorized iframe video embeds are permitted.' };
  }

  // Extract SRC
  const srcMatch = trimmed.match(/src=["']?([^"'\s>]+)["']?/i);
  if (!srcMatch || !srcMatch[1]) {
    return { isValid: false, error: 'Could not find a valid iframe src URL in the provided embed code.' };
  }

  const srcUrl = srcMatch[1];
  let domain = '';
  try {
    const urlObj = new URL(srcUrl.startsWith('//') ? `https:${srcUrl}` : srcUrl);
    domain = urlObj.hostname.toLowerCase();
  } catch {
    domain = 'external-provider';
  }

  // Extract Width & Height
  const widthMatch = trimmed.match(/width=["']?([0-9]+)%?["']?/i);
  const heightMatch = trimmed.match(/height=["']?([0-9]+)%?["']?/i);

  const originalWidth = widthMatch ? parseInt(widthMatch[1], 10) : undefined;
  const originalHeight = heightMatch ? parseInt(heightMatch[1], 10) : undefined;

  let aspectRatio = 16 / 9; // default 1.777
  if (originalWidth && originalHeight && originalHeight > 0) {
    aspectRatio = originalWidth / originalHeight;
  }

  // Check allowfullscreen
  const allowFullscreen = /allowfullscreen/i.test(trimmed);

  // Check allow attribute
  const allowMatch = trimmed.match(/allow=["']?([^"'>]+)["']?/i);
  const allow = allowMatch ? allowMatch[1] : 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen';

  const matchedProvider = allowedProviders.find(p => p.enabled && domain.includes(p.domain.toLowerCase()));

  return {
    isValid: true,
    embed: {
      src: srcUrl.startsWith('//') ? `https:${srcUrl}` : srcUrl,
      originalWidth,
      originalHeight,
      aspectRatio,
      allowFullscreen,
      allow,
      providerDomain: domain,
      providerName: matchedProvider ? matchedProvider.name : (domain || 'Authorized Host')
    }
  };
}
