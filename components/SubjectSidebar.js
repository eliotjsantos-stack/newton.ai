'use client';

const GENERAL_SUBJECT_ID = '00000000-0000-0000-0000-000000000001';

const BOARD_DOTS = {
  AQA: 'bg-purple-400',
  OCR: 'bg-blue-400',
  Pearson: 'bg-emerald-400',
};

export default function SubjectSidebar({ subjects, activeSubjectId, onSelect }) {
  const general = subjects.find(s => s.id === GENERAL_SUBJECT_ID);
  const others = subjects.filter(s => s.id !== GENERAL_SUBJECT_ID);

  return (
    <div className="space-y-1">
      <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400 px-3 py-2">
        Subjects
      </p>

      {/* General — always first */}
      {general && (
        <button
          onClick={() => onSelect(general)}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors duration-200 ${
            activeSubjectId === general.id
              ? 'bg-blue-50 text-blue-600'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
          }`}
        >
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
            activeSubjectId === general.id ? 'bg-blue-100' : 'bg-gray-100'
          }`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <span className="text-sm truncate">General</span>
        </button>
      )}

      {/* Other subjects */}
      {others.map(subject => (
        <button
          key={subject.id}
          onClick={() => onSelect(subject)}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors duration-200 ${
            activeSubjectId === subject.id
              ? 'bg-blue-50 text-blue-600'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
          }`}
        >
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
            activeSubjectId === subject.id ? 'bg-blue-100' : 'bg-gray-100'
          }`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm truncate">{subject.name}</p>
            {subject.board && (
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className={`w-1.5 h-1.5 rounded-full ${BOARD_DOTS[subject.board] || 'bg-gray-300'}`} />
                <span className="text-[10px] text-gray-400">{subject.board}</span>
              </div>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}
