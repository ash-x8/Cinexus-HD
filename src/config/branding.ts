/**
 * CINEXUS Centralized Branding Configuration
 * All logo assets, watermarks, typography tokens, and brand metadata
 * are controlled from this single source of truth.
 */

export const BRANDING = {
  name: 'CINEXUS',
  tagline: 'STREAM. WATCH. EXPERIENCE.',
  subtitle: 'Ultra 4K Cinema Discovery & Streaming',
  shortName: 'CINEXUS',
  legalNotice: 'CINEXUS Entertainment. All streams and embeds require verified distribution authorization.',
  
  // Theme Color System
  colors: {
    primary: '#e50914',
    primaryGlow: 'rgba(229, 9, 20, 0.4)',
    accentRed: '#ff2a3b',
    deepRed: '#990008',
    darkObsidian: '#07090e',
    deepCarbon: '#0b0f17',
    surfaceCard: '#111722',
    borderMuted: 'rgba(255, 255, 255, 0.08)',
    borderActive: 'rgba(239, 68, 68, 0.5)',
    textPrimary: '#f8fafc',
    textSecondary: '#94a3b8',
  },

  // Player Watermark defaults
  watermark: {
    opacity: 0.75,
    sizeDesktop: 32, // px
    sizeMobile: 22, // px
    position: 'top-right' as const,
  },

  // Authorized Video Providers (security whitelist)
  defaultProviders: [
    { id: 'prov-1', name: 'CINEXUS CDN Secure', domain: 'cdn.cinexus.app', enabled: true },
    { id: 'prov-2', name: 'Google Cloud Media', domain: 'commondatastorage.googleapis.com', enabled: true },
    { id: 'prov-3', name: 'YouTube Embeds (Trailers)', domain: 'youtube.com', enabled: true },
    { id: 'prov-4', name: 'YouTube NoCookie', domain: 'youtube-nocookie.com', enabled: true },
    { id: 'prov-5', name: 'Vimeo Player', domain: 'player.vimeo.com', enabled: true },
    { id: 'prov-6', name: 'Streamtape Player', domain: 'streamtape.com', enabled: true },
    { id: 'prov-7', name: 'VidCloud Master', domain: 'vidcloud9.com', enabled: true },
    { id: 'prov-8', name: 'DoodStream Secure', domain: 'doodstream.com', enabled: true },
    { id: 'prov-9', name: 'SuperEmbed Video', domain: 'multiembed.mov', enabled: true },
    { id: 'prov-10', name: 'EmbedSU Master', domain: 'embed.su', enabled: true }
  ]
};
