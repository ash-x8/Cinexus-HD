import React from 'react';
import { Link } from 'react-router-dom';

export const AboutPage: React.FC = () => (
  <div className="max-w-4xl mx-auto px-4 py-16 space-y-6">
    <h1 className="text-3xl font-bold text-white font-display">About CINEXUS</h1>
    <div className="text-sm text-zinc-300 leading-relaxed space-y-4">
      <p>
        CINEXUS is an ultra-premium cinema discovery and media distribution platform engineered for cinema enthusiasts, audio purists, and high-bitrate streaming demands.
      </p>
      <p>
        Our media ecosystem integrates master-quality feeds, native 4K Ultra HD mastering, and lossless multi-channel sound formats including Dolby Atmos and Dolby Vision HDR.
      </p>
      <h3 className="text-lg font-semibold text-white pt-4">Legal & Content Distribution</h3>
      <p>
        CINEXUS strictly adheres to international copyright protocols. All streams and embeds require verified distribution authority and licensing contracts.
      </p>
    </div>
  </div>
);

export const ContactPage: React.FC = () => (
  <div className="max-w-xl mx-auto px-4 py-16 space-y-6">
    <h1 className="text-3xl font-bold text-white font-display">Contact CINEXUS</h1>
    <p className="text-xs text-zinc-400">Inquiries regarding licensing, technical streaming, or partnerships.</p>
    <div className="p-6 rounded-2xl bg-zinc-950 border border-white/10 space-y-4 text-xs text-zinc-300">
      <div>
        <span className="text-zinc-500 block">General Inquiries</span>
        <span className="text-white font-medium">contact@cinexus.entertainment</span>
      </div>
      <div>
        <span className="text-zinc-500 block">Rights & Licensing</span>
        <span className="text-white font-medium">licensing@cinexus.entertainment</span>
      </div>
      <div>
        <span className="text-zinc-500 block">Studio Headquarters</span>
        <span className="text-white font-medium">CINEXUS Media Group · Los Angeles & Tokyo</span>
      </div>
    </div>
  </div>
);

export const PrivacyPage: React.FC = () => (
  <div className="max-w-4xl mx-auto px-4 py-16 space-y-6">
    <h1 className="text-3xl font-bold text-white font-display">Privacy Policy</h1>
    <div className="text-xs text-zinc-400 leading-relaxed space-y-4">
      <p>Last updated: September 2026</p>
      <p>
        CINEXUS respects user privacy. We store watch history and saved lists strictly to enhance your personalized cross-device streaming experience. No telemetry or watch activity is sold to third parties.
      </p>
    </div>
  </div>
);

export const TermsPage: React.FC = () => (
  <div className="max-w-4xl mx-auto px-4 py-16 space-y-6">
    <h1 className="text-3xl font-bold text-white font-display">Terms of Service</h1>
    <div className="text-xs text-zinc-400 leading-relaxed space-y-4">
      <p>Last updated: September 2026</p>
      <p>
        By accessing CINEXUS, you agree to access content exclusively for authorized personal viewing in accordance with international digital media governance.
      </p>
    </div>
  </div>
);
