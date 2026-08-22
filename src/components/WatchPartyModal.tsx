import React, { useState, useEffect } from 'react';
import { 
  X, 
  Users, 
  Send, 
  Copy, 
  Check, 
  Smile, 
  Play, 
  Sparkles, 
  Radio, 
  Volume2 
} from 'lucide-react';
import { MovieItem, WatchPartyMessage } from '../types';

interface WatchPartyModalProps {
  movie: MovieItem;
  onClose: () => void;
  onStartWatchMovie: (movie: MovieItem) => void;
}

const INITIAL_MESSAGES: WatchPartyMessage[] = [
  { id: 'm1', user: 'CinemaHost_Alex', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80', text: 'Welcome everyone to tonight 4K premiere! Audio is set to Dolby Atmos 7.1.', timestamp: '19:40', isHost: true },
  { id: 'm2', user: 'Sarah_K', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80', text: 'Got my popcorn ready 🍿 The cinematography in this is mindblowing!', timestamp: '19:41' },
  { id: 'm3', user: 'Marcus_HDR', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80', text: 'The bitrate transfer looks crisp on the OLED screen 🔥', timestamp: '19:42' },
];

export const WatchPartyModal: React.FC<WatchPartyModalProps> = ({
  movie,
  onClose,
  onStartWatchMovie
}) => {
  const [messages, setMessages] = useState<WatchPartyMessage[]>(INITIAL_MESSAGES);
  const [inputMsg, setInputMsg] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [popcornCount, setPopcornCount] = useState(84);
  const [floatingEmojis, setFloatingEmojis] = useState<{ id: number; emoji: string }[]>([]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;

    const newMsg: WatchPartyMessage = {
      id: `msg-${Date.now()}`,
      user: 'You',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
      text: inputMsg.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages([...messages, newMsg]);
    setInputMsg('');
  };

  const sendEmojiReaction = (emoji: string) => {
    const emojiId = Date.now() + Math.random();
    setFloatingEmojis(prev => [...prev, { id: emojiId, emoji }]);
    if (emoji === '🍿') setPopcornCount(c => c + 1);

    setTimeout(() => {
      setFloatingEmojis(prev => prev.filter(e => e.id !== emojiId));
    }, 2500);
  };

  const copyRoomLink = () => {
    navigator.clipboard.writeText(`https://cinexus-hd.app/party/${movie.id}-room-${Date.now().toString().slice(-4)}`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  return (
    <div 
      id="watch-party-modal-overlay"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        id="watch-party-modal-content"
        className="relative w-full max-w-4xl bg-[#0c1017] border border-indigo-500/30 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row h-[85vh] max-h-[750px]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Floating Emoji Animations Container */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-40">
          {floatingEmojis.map((item) => (
            <div
              key={item.id}
              className="absolute bottom-20 right-1/4 text-3xl animate-bounce"
              style={{
                left: `${30 + Math.random() * 40}%`,
                animation: 'fadeUp 2s ease-out forwards',
              }}
            >
              {item.emoji}
            </div>
          ))}
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 p-2 rounded-full bg-slate-900/80 border border-slate-700 text-slate-300 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Left Side: Video Preview & Room Status */}
        <div className="flex-1 flex flex-col justify-between p-6 bg-gradient-to-b from-indigo-950/30 via-[#0c1017] to-[#07090e] border-b md:border-b-0 md:border-r border-slate-800">
          
          {/* Header */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 font-bold text-[11px]">
                <Radio className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                <span>LIVE CINEMA ROOM</span>
              </span>
              <span className="flex items-center gap-1 text-emerald-400 font-mono text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                12 Watchers Sync
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black font-cinema text-white">
              {movie.title}
            </h2>
            <p className="text-xs text-slate-400">
              Host: <span className="text-slate-200 font-semibold">CinemaHost_Alex</span> • Dolby 5.1 Synced Stream
            </p>
          </div>

          {/* Video Preview Card */}
          <div className="my-4 relative aspect-video rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-xl group">
            <img src={movie.backdropUrl} alt={movie.title} className="w-full h-full object-cover opacity-80" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-white">
                  <span className="px-2 py-0.5 rounded bg-red-600 font-bold">LIVE SYNC</span>
                  <span className="font-mono">00:42:15</span>
                </div>
                <button
                  id="join-stream-player-btn"
                  onClick={() => onStartWatchMovie(movie)}
                  className="px-4 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-red-900/50"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Enter Fullscreen Player</span>
                </button>
              </div>
            </div>
          </div>

          {/* Room Controls & Invite Link */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
              <div className="text-xs">
                <span className="text-slate-400 block font-medium">Invite Friends</span>
                <span className="text-slate-200 font-mono text-[11px]">cinexus-hd.app/party/{movie.id}</span>
              </div>
              <button
                onClick={copyRoomLink}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  copiedLink 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md'
                }`}
              >
                {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            {/* Quick Emoji Reaction Dock */}
            <div className="flex items-center justify-between px-2 pt-1">
              <span className="text-xs text-slate-400 font-medium">Reactions:</span>
              <div className="flex items-center gap-2">
                {['🍿', '🔥', '😱', '👏', '❤️'].map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => sendEmojiReaction(emoji)}
                    className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:scale-125 transition-transform text-lg"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* Right Side: Live Party Chat Stream */}
        <div className="w-full md:w-80 flex flex-col justify-between bg-[#0c1017] p-4">
          
          {/* Chat Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Party Chat & Vibes
              </h3>
            </div>
            <div className="flex items-center gap-1 text-xs text-amber-400 font-semibold">
              <span>🍿 {popcornCount}</span>
            </div>
          </div>

          {/* Message Stream */}
          <div className="flex-1 overflow-y-auto space-y-3 py-3 pr-1 text-xs">
            {messages.map((m) => (
              <div key={m.id} className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <img src={m.avatar} alt={m.user} className="w-5 h-5 rounded-full object-cover border border-slate-700" />
                  <span className={`font-bold ${m.isHost ? 'text-indigo-400' : 'text-slate-200'}`}>
                    {m.user} {m.isHost && '👑'}
                  </span>
                  <span className="text-[10px] text-slate-500">{m.timestamp}</span>
                </div>
                <p className="text-slate-300 pl-6 leading-relaxed bg-slate-900/40 p-1.5 rounded-xl border border-slate-800/40">
                  {m.text}
                </p>
              </div>
            ))}
          </div>

          {/* Message Input Box */}
          <form onSubmit={handleSendMessage} className="pt-2 border-t border-slate-800 flex items-center gap-2">
            <input
              type="text"
              placeholder="Chat with watch party..."
              value={inputMsg}
              onChange={(e) => setInputMsg(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

        </div>

      </div>
    </div>
  );
};
