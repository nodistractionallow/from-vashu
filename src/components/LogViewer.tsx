import { useEffect, useState } from 'react';
import { logger } from '../utils/logger';

interface LogViewerProps {
  onClose: () => void;
}

export default function LogViewer({ onClose }: LogViewerProps) {
  const [text, setText] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setText(logger.getAllAsText());
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleClear = () => {
    if (confirm('Clear ALL session logs? This cannot be undone.')) {
      logger.clear();
      setText('No sessions recorded yet.');
    }
  };

  const handleDownload = () => {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vashu_logs_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(8px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-2xl rounded-2xl bg-gray-950 border border-pink-500/30 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-gray-900 border-b border-pink-500/20">
          <div>
            <h2 className="text-lg font-bold text-pink-400">📋 Session Logs</h2>
            <p className="text-xs text-gray-500 mt-0.5">All recorded interactions</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="rounded-lg px-3 py-1.5 text-sm font-medium bg-pink-500/20 text-pink-300 hover:bg-pink-500/30 transition-colors"
            >
              {copied ? '✓ Copied' : 'Copy'}
            </button>
            <button
              onClick={handleDownload}
              className="rounded-lg px-3 py-1.5 text-sm font-medium bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 transition-colors"
            >
              .txt
            </button>
            <button
              onClick={handleClear}
              className="rounded-lg px-3 py-1.5 text-sm font-medium bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-colors"
            >
              Clear
            </button>
            <button
              onClick={onClose}
              className="rounded-lg px-3 py-1.5 text-sm font-medium bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Log content */}
        <div className="overflow-y-auto flex-1 p-4">
          <pre className="text-xs text-green-300 font-mono whitespace-pre-wrap leading-relaxed">
            {text || 'No sessions recorded yet.'}
          </pre>
        </div>

        {/* Footer hint */}
        <div className="px-5 py-2 bg-gray-900 border-t border-pink-500/10">
          <p className="text-xs text-gray-600 text-center">
            Triggered by typing <span className="text-pink-500 font-bold">VASHU</span> on keyboard · Click outside to close
          </p>
        </div>
      </div>
    </div>
  );
}
