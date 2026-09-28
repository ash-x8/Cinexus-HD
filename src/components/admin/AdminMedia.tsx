import React, { useState, useEffect, useRef } from 'react';
import { Upload, Trash2, Copy, Check, Image, FileVideo, AlertCircle, RefreshCw } from 'lucide-react';
import { uploadMediaFile, deleteMediaFile, getMediaFiles } from '../../services/storage';
import { MediaFile } from '../../types';

export const AdminMedia: React.FC = () => {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadPercent, setUploadPercent] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [category, setCategory] = useState<'poster' | 'backdrop' | 'video' | 'subtitle'>('poster');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadMedia = async () => {
    setLoading(true);
    try {
      const files = await getMediaFiles();
      setMediaFiles(files);
    } catch (e) {
      console.warn('Error loading media:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMedia();
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadPercent(0);
    setErrorMessage(null);

    try {
      const uploaded = await uploadMediaFile(file, category, (percent) => {
        setUploadPercent(percent);
      });
      setMediaFiles((prev) => [uploaded, ...prev]);
    } catch (err: any) {
      setErrorMessage(err.message || 'Media upload failed.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (id: string, path: string) => {
    if (!window.confirm('Permanently delete this media asset from Firebase Storage?')) return;
    try {
      await deleteMediaFile(id, path);
      setMediaFiles((prev) => prev.filter((m) => m.id !== id));
    } catch (err: any) {
      alert(`Delete error: ${err.message}`);
    }
  };

  const copyUrl = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-display">
            Firebase Media Storage
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Upload posters, master backdrops, and authorized video streams directly to Firebase Storage.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as any)}
            className="px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white"
          >
            <option value="poster">Poster Art</option>
            <option value="backdrop">Backdrop Header</option>
            <option value="video">Direct Video Stream</option>
            <option value="subtitle">Subtitle Track</option>
          </select>

          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            className="hidden"
            accept={category === 'video' ? 'video/mp4,video/webm' : 'image/jpeg,image/png,image/webp'}
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-semibold text-white uppercase tracking-wider transition-colors disabled:opacity-50 shadow-lg shadow-red-950/40"
          >
            <Upload className="w-4 h-4" />
            <span>Upload {category}</span>
          </button>
        </div>
      </div>

      {/* Upload Progress Bar */}
      {uploading && (
        <div className="p-4 rounded-2xl bg-zinc-950 border border-red-500/30 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-white font-semibold flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-red-500" /> Uploading to Firebase Storage...
            </span>
            <span className="font-mono text-red-400 font-bold">{uploadPercent}%</span>
          </div>
          <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden">
            <div className="h-full bg-red-600 transition-all duration-150" style={{ width: `${uploadPercent}%` }} />
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 rounded-xl bg-red-600/10 border border-red-500/20 text-xs text-red-400 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Media Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {loading ? (
          <div className="col-span-full py-16 text-center text-zinc-500 text-xs">
            Loading storage assets...
          </div>
        ) : mediaFiles.length === 0 ? (
          <div className="col-span-full py-16 text-center text-zinc-500 text-xs">
            No media assets uploaded to Firebase Storage yet.
          </div>
        ) : (
          mediaFiles.map((file) => (
            <div
              key={file.id}
              className="group p-3 rounded-2xl bg-zinc-950 border border-white/10 hover:border-white/20 transition-all space-y-2.5"
            >
              <div className="aspect-[4/3] w-full rounded-xl overflow-hidden bg-zinc-900 relative">
                {file.contentType.startsWith('image/') ? (
                  <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-zinc-500 p-2">
                    <FileVideo className="w-8 h-8 text-red-500 mb-1" />
                    <span className="text-[10px] text-center truncate max-w-full">{file.name}</span>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <div className="text-xs font-semibold text-white truncate" title={file.name}>
                  {file.name}
                </div>
                <div className="text-[10px] text-zinc-500 flex items-center justify-between uppercase">
                  <span>{file.category}</span>
                  <span>{(file.size / (1024 * 1024)).toFixed(1)} MB</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 pt-1 border-t border-white/10">
                <button
                  onClick={() => copyUrl(file.id, file.url)}
                  className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] text-zinc-300 transition-colors"
                >
                  {copiedId === file.id ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy URL</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleDelete(file.id, file.storagePath)}
                  className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  title="Delete from Storage"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
};
