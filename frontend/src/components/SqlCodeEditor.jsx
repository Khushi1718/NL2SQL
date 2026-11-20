import React, { useState } from 'react';
import { Copy, Check, Sparkles, Code } from 'lucide-react';

export default function SqlCodeEditor({
  value,
  onChange,
  onExecute,
  isExecuting = false,
  readOnly = false,
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatSQL = () => {
    if (!value) return;
    let formatted = value
      .replace(/\s+/g, ' ')
      .replace(/\b(SELECT|FROM|WHERE|JOIN|LEFT JOIN|INNER JOIN|RIGHT JOIN|GROUP BY|ORDER BY|HAVING|LIMIT|UNION|AS|AND|OR|DESC|ASC|ON)\b/gi, (match) => match.toUpperCase())
      .replace(/\s+(FROM|WHERE|JOIN|LEFT JOIN|INNER JOIN|GROUP BY|ORDER BY|HAVING|LIMIT)\b/g, '\n$1')
      .trim();
    onChange(formatted);
  };

  const lineCount = (value || '').split('\n').length;
  const lineNumbers = Array.from({ length: Math.max(lineCount, 3) }, (_, i) => i + 1);

  return (
    <div className="rounded-2xl border border-zinc-800/80 bg-[#0c0c10] overflow-hidden shadow-[0_20px_45px_-10px_rgba(0,0,0,0.18)] flex flex-col font-mono text-sm transition-all duration-300">
      {/* Editor Header Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-900/60 border-b border-zinc-800 text-xs text-zinc-400">
        <div className="flex items-center gap-2">
          <Code className="w-3.5 h-3.5 text-zinc-300" />
          <span className="font-semibold text-white">SQLite Query Editor</span>
          <span className="text-[10px] bg-zinc-800 border border-zinc-700 px-2 py-0.5 rounded-full text-zinc-300">
            {lineCount} {lineCount === 1 ? 'line' : 'lines'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={formatSQL}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 hover:text-white border border-white/10 transition-all text-[11px]"
            title="Auto-format SQL keywords"
          >
            <Sparkles className="w-3 h-3 text-white" />
            <span>Format</span>
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 hover:text-white border border-white/10 transition-all text-[11px]"
            title="Copy SQL to Clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400 font-semibold">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Editor Body */}
      <div className="flex min-h-[140px] max-h-[300px] overflow-auto bg-transparent">
        {/* Line numbers gutter */}
        <div className="py-3 px-3 bg-white/[0.015] text-zinc-600 select-none text-right font-mono text-xs border-r border-white/[0.06] shrink-0">
          {lineNumbers.map((num) => (
            <div key={num} className="leading-6">
              {num}
            </div>
          ))}
        </div>

        {/* Textarea */}
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          readOnly={readOnly}
          rows={Math.max(lineCount, 4)}
          placeholder="-- Generated SQL query will appear here. You can freely edit before executing."
          className="w-full py-3 px-4 bg-transparent text-emerald-300 focus:outline-none resize-none font-mono text-xs leading-6 selection:bg-white selection:text-black placeholder-zinc-600"
          spellCheck={false}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
              e.preventDefault();
              if (onExecute && !isExecuting) onExecute();
            }
          }}
        />
      </div>

      {/* Footer helper */}
      <div className="px-4 py-2 bg-white/[0.02] border-t border-white/[0.06] flex items-center justify-between text-[11px] text-zinc-500">
        <span>Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/15 text-zinc-300 text-[10px] font-sans font-semibold">⌘ / Ctrl + Enter</kbd> to execute</span>
        <span className="text-zinc-500">Strictly read-only SELECT queries</span>
      </div>
    </div>
  );
}
