/**
 * CINEXUS Centralized Branding Configuration
 * All logo assets, watermarks, typography tokens, and brand metadata
 * are controlled from this single source of truth.
 */

export const BRANDING = {
  name: 'CINEXUS',
  tagline: 'STREAM. WATCH. EXPERIENCE.',
  subtitle: 'Ultra 4K Cinema Discovery & Streaming',
  description: 'Ultra 4K Cinema Discovery & Streaming Platform with master quality feeds.',
  shortName: 'CINEXUS',
  legalNotice: 'CINEXUS Entertainment. All streams and embeds require verified distribution authorization.',
  
  // Official Brand Assets
  logoUrl: 'https://raw.githubusercontent.com/ash-x8/Media-Files/refs/heads/main/file_00000000a72882119fa9566af8cf7b28.png',
  faviconUrl: 'https://raw.githubusercontent.com/ash-x8/Media-Files/refs/heads/main/file_00000000a72882119fa9566af8cf7b28.png',
  
  // Theme Color System (Luxury Dark Cinema Palette)
  colors: {
    primary: '#E5A93C',
    primaryGlow: 'rgba(229, 169, 60, 0.4)',
    accentGold: '#E5A93C',
    accentAmber: '#F59E0B',
    darkObsidian: '#0B0D12',
    deepCarbon: '#0e1117',
    surfaceCard: '#12151E',
    borderMuted: 'rgba(255, 255, 255, 0.08)',
    borderActive: 'rgba(229, 169, 60, 0.5)',
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
