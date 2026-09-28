import React from 'react';
import { Link } from 'react-router-dom';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 text-center space-y-4">
      <div className="text-6xl sm:text-8xl font-black text-red-600/30 font-display select-none">
        404
      </div>
      <h1 className="text-xl sm:text-2xl font-bold text-white font-display">
        Cinema Sequence Not Found
      </h1>
      <p className="text-xs text-zinc-400 max-w-sm">
        The route you requested does not exist or has been relocated within the CINEXUS catalog.
      </p>
      <Link
        to="/"
        className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs tracking-wider uppercase transition-colors"
      >
        Return to Home
      </Link>
    </div>
  );
};
