import React from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '../common/Logo';

export const PublicFooter: React.FC = () => {
  return (
    <footer className="w-full bg-[#040508] border-t border-white/[0.06] text-zinc-500 text-xs py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start justify-between gap-8">
        
        {/* Brand & Legal statement */}
        <div className="space-y-3 max-w-sm">
          <Link to="/" className="inline-block">
            <Logo size="md" showSubtitle={false} />
          </Link>
          <p className="leading-relaxed text-zinc-400">
            Next-generation cinema discovery & streaming experience. Ultra 4K master feeds, lossless Dolby Atmos soundtracks, and synchronized translations.
          </p>
          <p className="text-[11px] text-zinc-500">
            © {new Date().getFullYear()} CINEXUS Entertainment. All distributed feeds require verified licensing.
          </p>
        </div>

        {/* Navigation Columns */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-8">
          <div>
            <h4 className="text-white font-semibold mb-3 tracking-wide uppercase text-[11px]">Explore</h4>
            <ul className="space-y-2">
              <li><Link to="/movies" className="hover:text-white transition-colors">4K Movies</Link></li>
              <li><Link to="/tv" className="hover:text-white transition-colors">TV Series</Link></li>
              <li><Link to="/anime" className="hover:text-white transition-colors">Anime Hub</Link></li>
              <li><Link to="/genres" className="hover:text-white transition-colors">All Genres</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-3 tracking-wide uppercase text-[11px]">Personal</h4>
            <ul className="space-y-2">
              <li><Link to="/watchlist" className="hover:text-white transition-colors">My Watchlist</Link></li>
              <li><Link to="/history" className="hover:text-white transition-colors">Watch History</Link></li>
              <li><Link to="/profile" className="hover:text-white transition-colors">Account Profile</Link></li>
              <li><Link to="/search" className="hover:text-white transition-colors">Search Index</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-3 tracking-wide uppercase text-[11px]">Legal & Info</h4>
            <ul className="space-y-2">
              <li><Link to="/about" className="hover:text-white transition-colors">About Us</Link></li>
              <li><Link to="/contact" className="hover:text-white transition-colors">Contact Support</Link></li>
              <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

      </div>
    </footer>
  );
};
