'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '../lib/supabase';

const BOARD_COLORS = {
  AQA: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  OCR: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  Pearson: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
};

// Extract clean subject name (used for display and deduplication)
function cleanName(qual) {
  return (qual.short_title || qual.title)
    .replace(/^(AQA|OCR|Pearson|WJEC|Pearson Edexcel)\s*/i, '')
    .replace(/Level \d\/?(Level \d)?\s*/i, '')
    .replace(/GCSE \(9-1\) in\s*/i, '')
    .replace(/Advanced (Subsidiary )?GCE in\s*/i, '')
    .trim();
}

export default function QualificationSelector({ value, onSelect, levelFilter, placeholder }) {
  const [qualifications, setQualifications] = useState([]);
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedQual, setSelectedQual] = useState(null);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Fetch qualifications on mount
  useEffect(() => {
    async function load() {
      let query = supabase
        .from('qualifications')
        .select('qan_code, title, short_title, board, level')
        .order('board')
        .order('title');

      if (levelFilter) {
        query = query.eq('level', levelFilter);
      }

      const { data, error } = await query;
      if (!error && data) {
        // Deduplicate by (board, cleanName, level) — the CSV has multiple QAN codes
        // for the same qualification (different regulatory records/versions)
        // whose raw titles differ slightly but display identically.
        const seen = new Set();
        const unique = data.filter(q => {
          const key = `${q.board}|${cleanName(q)}|${q.level}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        setQualifications(unique);
        // Set selected qual from value prop
        if (value) {
          const found = unique.find(q => q.qan_code === value);
          if (found) setSelectedQual(found);
        }
      }
      setLoading(false);
    }
    load();
  }, [levelFilter, value]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Filter and group results
  const grouped = useMemo(() => {
    const term = search.toLowerCase().trim();
    const filtered = term
      ? qualifications.filter(q =>
          q.title.toLowerCase().includes(term) ||
          q.short_title?.toLowerCase().includes(term) ||
          q.board.toLowerCase().includes(term)
        )
      : qualifications;

    // Only show GCSEs that contain "GCSE" in title for cleaner results
    const gcse = filtered.filter(q => q.level === 2 && /GCSE/i.test(q.title));
    const alevel = filtered.filter(q => q.level === 3 && /GCE|A Level|A-Level/i.test(q.title));
    const other = filtered.filter(q =>
      !(q.level === 2 && /GCSE/i.test(q.title)) &&
      !(q.level === 3 && /GCE|A Level|A-Level/i.test(q.title))
    );

    const groups = [];
    if (gcse.length) groups.push({ label: 'GCSE', items: gcse });
    if (alevel.length) groups.push({ label: 'A-Level', items: alevel });
    if (other.length) groups.push({ label: 'Other', items: other });
    return groups;
  }, [qualifications, search]);

  const totalResults = grouped.reduce((sum, g) => sum + g.items.length, 0);

  function handleSelect(qual) {
    setSelectedQual(qual);
    setSearch('');
    setIsOpen(false);
    onSelect(qual.qan_code);
  }

  function handleClear(e) {
    e.stopPropagation();
    setSelectedQual(null);
    setSearch('');
    onSelect(null);
  }

  const shortName = cleanName;

  return (
    <div ref={containerRef} className="relative">
      {/* Selected state / trigger */}
      {selectedQual && !isOpen ? (
        <div
          onClick={() => { setIsOpen(true); setTimeout(() => inputRef.current?.focus(), 50); }}
          className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-700/50 rounded-2xl cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors border border-neutral-200/50 dark:border-neutral-600/50"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-gradient-to-br from-neutral-800 to-neutral-900 dark:from-neutral-200 dark:to-neutral-300 rounded-xl flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-white dark:text-neutral-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                {shortName(selectedQual)}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${BOARD_COLORS[selectedQual.board]}`}>
                  {selectedQual.board}
                </span>
                <span className="text-xs text-neutral-500 dark:text-neutral-400">
                  {selectedQual.level === 2 ? 'GCSE' : 'A-Level'}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={handleClear}
            className="p-1.5 hover:bg-neutral-200 dark:hover:bg-neutral-600 rounded-lg transition-colors shrink-0"
          >
            <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ) : (
        /* Search input */
        <div
          className={`flex items-center gap-2 px-4 py-3 rounded-2xl border transition-all duration-200 ${
            isOpen
              ? 'bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-500 shadow-lg ring-2 ring-neutral-900/5 dark:ring-white/10'
              : 'bg-neutral-50 dark:bg-neutral-700/50 border-neutral-200/50 dark:border-neutral-600/50 hover:bg-neutral-100 dark:hover:bg-neutral-700 cursor-pointer'
          }`}
          onClick={() => { setIsOpen(true); setTimeout(() => inputRef.current?.focus(), 50); }}
        >
          <svg className="w-4 h-4 text-neutral-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setIsOpen(true)}
            placeholder={placeholder || 'Search qualifications...'}
            className="flex-1 bg-transparent text-sm text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 outline-none"
          />
          {search && (
            <button onClick={(e) => { e.stopPropagation(); setSearch(''); }} className="p-0.5">
              <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-2 w-full bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-2xl overflow-hidden animate-scaleIn"
          style={{ maxHeight: '320px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}
        >
          <div className="overflow-y-auto" style={{ maxHeight: '320px' }}>
            {loading ? (
              <div className="p-6 text-center text-sm text-neutral-500 dark:text-neutral-400">Loading courses...</div>
            ) : totalResults === 0 ? (
              <div className="p-6 text-center text-sm text-neutral-500 dark:text-neutral-400">
                {search ? `No courses matching "${search}"` : 'No courses available'}
              </div>
            ) : (
              grouped.map((group) => (
                <div key={group.label}>
                  <div className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 bg-neutral-50 dark:bg-neutral-800/80 sticky top-0">
                    {group.label} ({group.items.length})
                  </div>
                  {group.items.map((qual) => (
                    <button
                      key={qual.qan_code}
                      onClick={() => handleSelect(qual)}
                      className={`w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors ${
                        value === qual.qan_code ? 'bg-neutral-100 dark:bg-neutral-700' : ''
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                          {shortName(qual)}
                        </p>
                      </div>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0 ${BOARD_COLORS[qual.board]}`}>
                        {qual.board}
                      </span>
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
