'use client';

import { useState, useRef } from 'react';

export default function SyllabusUploader({ classId, qanCode }) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const disabled = !qanCode;

  const handleFile = async (file) => {
    if (disabled) return;
    if (!file || !file.name.toLowerCase().endsWith('.pdf')) {
      setError('Please upload a PDF file.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('File too large. Maximum 10MB.');
      return;
    }

    setError('');
    setUploading(true);
    setPreview(null);

    try {
      const token = localStorage.getItem('newton-auth-token');
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/teacher/ingest-syllabus', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to parse syllabus');
      }

      const data = await res.json();
      setPreview(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const confirmSyllabus = async () => {
    if (!preview) return;
    setSaving(true);
    setError('');

    try {
      const token = localStorage.getItem('newton-auth-token');
      const res = await fetch('/api/teacher/ingest-syllabus', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...preview, classId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save syllabus');
      }
      setSaved(true);
      setTimeout(() => { setSaved(false); setPreview(null); }, 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    if (disabled) return;
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  if (disabled) {
    return (
      <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center opacity-60">
        <svg className="w-10 h-10 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12H9.75m3 0l-3-3m0 0l3-3m-3 3h12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
        <p className="text-sm font-medium text-gray-500">Select a qualification for this class first</p>
        <p className="text-xs text-gray-400 mt-1">A QAN code must be assigned before uploading a syllabus</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
          dragging
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-[3px] border-gray-200 border-t-gray-600 rounded-full animate-spin" />
            <p className="text-sm text-gray-600 font-medium">Parsing syllabus with AI...</p>
            <p className="text-xs text-gray-400">This may take a few seconds</p>
          </div>
        ) : (
          <>
            <svg className="w-10 h-10 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12H9.75m3 0l-3-3m0 0l3-3m-3 3h12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            <p className="text-sm font-medium text-gray-600">Drop a syllabus PDF here</p>
            <p className="text-xs text-gray-400 mt-1">or click to browse (max 10MB)</p>
          </>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Preview */}
      {preview && !saved && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-gray-900">Extracted Syllabus</h4>
              <p className="text-xs text-gray-500 mt-0.5">
                {preview.examBoard} &middot; {preview.qualification} &middot; {preview.topics?.length || 0} topics
              </p>
            </div>
            <button
              onClick={() => setPreview(null)}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              Discard
            </button>
          </div>

          <div className="max-h-48 overflow-y-auto space-y-2">
            {preview.topics?.map((topic, i) => (
              <div key={i} className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-semibold text-gray-700">
                  {topic.code && <span className="text-gray-400 mr-1">{topic.code}</span>}
                  {topic.title}
                </p>
                {topic.subtopics?.length > 0 && (
                  <ul className="mt-1.5 space-y-0.5">
                    {topic.subtopics.map((sub, j) => (
                      <li key={j} className="text-xs text-gray-500 pl-3">&bull; {sub}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={confirmSyllabus}
            disabled={saving}
            className="w-full py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {saving ? 'Saving...' : 'Confirm & Save to Class'}
          </button>
        </div>
      )}

      {saved && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
          <p className="text-sm font-semibold text-emerald-600">Syllabus saved successfully!</p>
        </div>
      )}
    </div>
  );
}
