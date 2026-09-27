import React from 'react';
import { Shield, Mail, Lock, Film, Sparkles, CheckCircle, ArrowLeft } from 'lucide-react';
import { BRANDING } from '../../config/branding';

interface PageProps {
  onBack: () => void;
  onSelectGenre?: (genre: string) => void;
}

export const AboutPage: React.FC<PageProps> = ({ onBack }) => {
  return (
    <div className="pt-24 pb-16 max-w-4xl mx-auto px-4 sm:px-6">
      <button 
        onClick={onBack}
        className="mb-6 flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Cinema Showcase</span>
      </button>

      <div className="bg-[#0b0f17] border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-6">
        <div className="space-y-2 border-b border-slate-800 pb-6">
          <div className="flex items-center gap-2 text-red-500 font-bold text-xs uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>Platform Overview</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black font-display text-white tracking-wide">
            About {BRANDING.name}
          </h1>
          <p className="text-sm text-slate-400">
            {BRANDING.tagline}
          </p>
        </div>

        <div className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <p>
            {BRANDING.name} is a dedicated high-fidelity cinema discovery and streaming platform designed for true cinephiles. Our goal is to bring together international blockbusters, festival winners, prestige television series, anime masters, and nature expeditions in uncompressed 4K Ultra HD.
          </p>
          <p>
            Featuring multi-channel Dolby Atmos 3D audio, dynamic HDR10+ color science, and synchronized Sinhala subtitles, CINEXUS delivers an uncompromising cinematic home theater experience.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
              <span className="font-bold text-white block">Master Bitrates</span>
              <span className="text-xs text-slate-400">Up to 60 Mbps native 4K streams with HLS adaptive bitrates.</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
              <span className="font-bold text-white block">Multi-Language CC</span>
              <span className="text-xs text-slate-400">Synchronized Sinhala translation tracks and multi-language closed captions.</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
              <span className="font-bold text-white block">Zero Ad-Clutter</span>
              <span className="text-xs text-slate-400">Immersive user experience built around clean visual art direction.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ContactPage: React.FC<PageProps> = ({ onBack }) => {
  const [submitted, setSubmitted] = React.useState(false);
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [message, setMessage] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="pt-24 pb-16 max-w-2xl mx-auto px-4 sm:px-6">
      <button 
        onClick={onBack}
        className="mb-6 flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Cinema Showcase</span>
      </button>

      <div className="bg-[#0b0f17] border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-6">
        <div className="space-y-2 border-b border-slate-800 pb-6">
          <div className="flex items-center gap-2 text-red-500 font-bold text-xs uppercase tracking-wider">
            <Mail className="w-4 h-4" />
            <span>Inquiries & Media Distribution</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-display text-white tracking-wide">
            Contact Support & Curators
          </h1>
          <p className="text-xs text-slate-400">
            Have a content request, subtitle sync report, or technical feedback? Get in touch with our operations team.
          </p>
        </div>

        {submitted ? (
          <div className="p-6 rounded-2xl bg-emerald-950/60 border border-emerald-600/40 text-center space-y-2">
            <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto" />
            <h4 className="text-sm font-bold text-white">Message Dispatched</h4>
            <p className="text-xs text-emerald-300">
              Thank you for contacting CINEXUS Support. An operations engineer will review your request within 24 hours.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="text-slate-300 font-semibold">Your Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Morgan"
                className="w-full bg-[#07090e] border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder:text-slate-500 outline-none focus:border-red-500"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-semibold">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@domain.com"
                className="w-full bg-[#07090e] border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder:text-slate-500 outline-none focus:border-red-500"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-semibold">Message & Inquiry</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe your inquiry or stream feedback..."
                rows={4}
                className="w-full bg-[#07090e] border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder:text-slate-500 outline-none focus:border-red-500"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-950/60 cursor-pointer transition-all"
            >
              Submit Dispatch
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export const PrivacyPolicyPage: React.FC<PageProps> = ({ onBack }) => {
  return (
    <div className="pt-24 pb-16 max-w-4xl mx-auto px-4 sm:px-6">
      <button 
        onClick={onBack}
        className="mb-6 flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Cinema Showcase</span>
      </button>

      <div className="bg-[#0b0f17] border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-6">
        <div className="space-y-2 border-b border-slate-800 pb-6">
          <div className="flex items-center gap-2 text-red-500 font-bold text-xs uppercase tracking-wider">
            <Lock className="w-4 h-4" />
            <span>Data Protection & Integrity</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-display text-white tracking-wide">
            Privacy Policy
          </h1>
          <p className="text-xs text-slate-400">
            Last Updated: {new Date().getFullYear()}
          </p>
        </div>

        <div className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <h3 className="text-base font-bold text-white">1. Information We Collect</h3>
          <p>
            When you create a CINEXUS VIP account, we store your email address and display name securely using Firebase Authentication. Watch progress timestamps and watchlist collections are stored in persistent Cloud Firestore documents linked strictly to your authenticated UID.
          </p>

          <h3 className="text-base font-bold text-white">2. Video Playback & Stream Metrics</h3>
          <p>
            We do not sell user data. Video playback telemetry is processed locally to synchronize resume timestamps and quality bitrates across your personal devices.
          </p>

          <h3 className="text-base font-bold text-white">3. Third-Party Feeds & TMDB</h3>
          <p>
            Metadata, cast images, and trailers are cataloged via The Movie Database (TMDB) API and open distribution CDNs. No private user information is transmitted to external providers.
          </p>
        </div>
      </div>
    </div>
  );
};

export const TermsOfServicePage: React.FC<PageProps> = ({ onBack }) => {
  return (
    <div className="pt-24 pb-16 max-w-4xl mx-auto px-4 sm:px-6">
      <button 
        onClick={onBack}
        className="mb-6 flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Cinema Showcase</span>
      </button>

      <div className="bg-[#0b0f17] border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-6">
        <div className="space-y-2 border-b border-slate-800 pb-6">
          <div className="flex items-center gap-2 text-red-500 font-bold text-xs uppercase tracking-wider">
            <Shield className="w-4 h-4" />
            <span>Legal Distribution & Terms</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-display text-white tracking-wide">
            Terms of Service
          </h1>
          <p className="text-xs text-slate-400">
            Last Updated: {new Date().getFullYear()}
          </p>
        </div>

        <div className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <p>
            By accessing {BRANDING.name}, you agree to comply with international copyright laws and service terms. All metadata, film synopses, and promotional artwork are properties of their respective studios and licensors.
          </p>
          <p>
            Streaming feeds are delivered via authorized edge CDNs, promotional media nodes, and official studio embeds. Unauthorized commercial redistribution or automated scraping of CINEXUS feeds is strictly prohibited.
          </p>
        </div>
      </div>
    </div>
  );
};

export const GenresPage: React.FC<PageProps> = ({ onBack, onSelectGenre }) => {
  const GENRES = [
    { name: 'Action', desc: 'High-octane blockbusters, chases, and adrenaline thrillers', count: 18 },
    { name: 'Sci-Fi', desc: 'Space exploration, artificial intelligence, and speculative dimensions', count: 14 },
    { name: 'Adventure', desc: 'Epic planetary journeys and grand cinematic quests', count: 16 },
    { name: 'Drama', desc: 'Prestige character studies and award-winning emotional narratives', count: 20 },
    { name: 'Animation', desc: 'Master anime series and award-winning animated features', count: 12 },
    { name: 'Documentary', desc: 'IMAX planetary expeditions and nature visual feasts', count: 8 },
    { name: 'Crime', desc: 'Underworld sagas, neo-noir thrillers, and detective mysteries', count: 9 },
    { name: 'Fantasy', desc: 'Mythical realms, magic systems, and ancient legends', count: 11 },
    { name: 'Thriller', desc: 'Psychological suspense and edge-of-seat pacing', count: 15 },
    { name: 'Mystery', desc: 'Complex enigmas and puzzle-box narratives', count: 7 }
  ];

  return (
    <div className="pt-24 pb-16 max-w-6xl mx-auto px-4 sm:px-6">
      <button 
        onClick={onBack}
        className="mb-6 flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Cinema Showcase</span>
      </button>

      <div className="space-y-6">
        <div className="border-b border-slate-800 pb-4">
          <h1 className="text-2xl sm:text-3xl font-black font-display text-white tracking-wide flex items-center gap-3">
            <Film className="w-7 h-7 text-red-500" />
            <span>Cinema Genre Directory</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Browse full catalogs filtered by cinematic genres, mood, and visual style.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {GENRES.map((g) => (
            <div
              key={g.name}
              onClick={() => onSelectGenre && onSelectGenre(g.name)}
              className="p-5 rounded-2xl bg-[#0b0f17] border border-slate-800 hover:border-red-500/70 hover:scale-[1.02] transition-all cursor-pointer shadow-lg space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white group-hover:text-red-400 transition-colors">
                  {g.name}
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                  {g.count} Titles
                </span>
              </div>
              <p className="text-xs text-slate-400 line-clamp-2">
                {g.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
