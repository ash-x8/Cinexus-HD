import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { BRANDING } from '../config/branding';

export interface BrandingConfig {
  siteTitle: string;
  logoUrl: string;
  faviconUrl: string;
  primaryColor: string;
  secondaryColor: string;
  tagline: string;
  brandDescription: string;
  watermarkEnabled: boolean;
  watermarkOpacity: number;
}

export const DEFAULT_BRANDING: BrandingConfig = {
  siteTitle: 'CINEXUS-HD | Ultra-High-Bitrate Cinema',
  logoUrl: BRANDING.logoUrl || 'https://raw.githubusercontent.com/ash-x8/Media-Files/refs/heads/main/file_00000000a72882119fa9566af8cf7b28.png',
  faviconUrl: BRANDING.faviconUrl || 'https://raw.githubusercontent.com/ash-x8/Media-Files/refs/heads/main/file_00000000a72882119fa9566af8cf7b28.png',
  primaryColor: '#D4AF37', // Bespoke Dark Gold
  secondaryColor: '#F59E0B', // Amber
  tagline: BRANDING.tagline || 'STREAM. WATCH. EXPERIENCE.',
  brandDescription: BRANDING.description || 'Ultra-High-Bitrate 4K Cinema Discovery & Streaming Platform.',
  watermarkEnabled: true,
  watermarkOpacity: 0.75
};

interface BrandContextType {
  branding: BrandingConfig;
  isLoading: boolean;
  updateBranding: (updates: Partial<BrandingConfig>) => Promise<void>;
  resetToDefault: () => Promise<void>;
}

const BrandContext = createContext<BrandContextType>({
  branding: DEFAULT_BRANDING,
  isLoading: true,
  updateBranding: async () => {},
  resetToDefault: async () => {}
});

export const BrandProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [branding, setBranding] = useState<BrandingConfig>(DEFAULT_BRANDING);
  const [isLoading, setIsLoading] = useState(true);

  // Real-time synchronization with Firestore document settings/branding
  useEffect(() => {
    const brandingRef = doc(db, 'settings', 'branding');
    const unsubscribe = onSnapshot(
      brandingRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setBranding((prev) => ({
            siteTitle: data.siteTitle || data.siteName || prev.siteTitle,
            logoUrl: data.logoUrl || prev.logoUrl,
            faviconUrl: data.faviconUrl || prev.faviconUrl,
            primaryColor: data.primaryColor || prev.primaryColor || '#D4AF37',
            secondaryColor: data.secondaryColor || prev.secondaryColor || '#F59E0B',
            tagline: data.tagline || data.siteTagline || prev.tagline,
            brandDescription: data.brandDescription || data.siteDescription || prev.brandDescription,
            watermarkEnabled: data.watermarkEnabled !== undefined ? data.watermarkEnabled : prev.watermarkEnabled,
            watermarkOpacity: data.watermarkOpacity !== undefined ? data.watermarkOpacity : prev.watermarkOpacity
          }));
        }
        setIsLoading(false);
      },
      (error) => {
        console.warn('[BrandContext] Falling back to default branding:', error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Synchronize document title and favicon dynamically in the HTML head
  useEffect(() => {
    if (typeof document !== 'undefined') {
      // Dynamic Title
      if (branding.siteTitle) {
        document.title = branding.siteTitle;
      }

      // Dynamic Favicon
      if (branding.faviconUrl) {
        let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
        if (!link) {
          link = document.createElement('link');
          link.rel = 'shortcut icon';
          document.getElementsByTagName('head')[0].appendChild(link);
        }
        link.href = branding.faviconUrl;
      }

      // Inject Dark Gold root CSS variable for brand harmony
      document.documentElement.style.setProperty('--cinexus-gold', branding.primaryColor || '#D4AF37');
      document.documentElement.style.setProperty('--cinexus-amber', branding.secondaryColor || '#F59E0B');
    }
  }, [branding]);

  const updateBranding = async (updates: Partial<BrandingConfig>) => {
    const merged: BrandingConfig = {
      ...branding,
      ...updates
    };
    setBranding(merged);

    try {
      const brandingRef = doc(db, 'settings', 'branding');
      await setDoc(brandingRef, {
        ...merged,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      // Also sync siteName in settings/general for legacy consumers
      const generalSettingsRef = doc(db, 'settings', 'general');
      await setDoc(generalSettingsRef, {
        siteName: merged.siteTitle.split('|')[0].trim() || 'CINEXUS',
        logoUrl: merged.logoUrl,
        faviconUrl: merged.faviconUrl,
        siteTagline: merged.tagline,
        siteDescription: merged.brandDescription,
        watermarkEnabled: merged.watermarkEnabled,
        watermarkOpacity: merged.watermarkOpacity,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (err) {
      console.error('[BrandContext] Failed to save branding to Firestore:', err);
      throw err;
    }
  };

  const resetToDefault = async () => {
    await updateBranding(DEFAULT_BRANDING);
  };

  return (
    <BrandContext.Provider value={{ branding, isLoading, updateBranding, resetToDefault }}>
      {children}
    </BrandContext.Provider>
  );
};

export const useBrand = () => useContext(BrandContext);
export default BrandContext;
