'use client';

import { motion } from 'framer-motion';
import { ClassIcon } from '@/components/ClassIcons';

export default function SubjectCard({ cls, onClick }) {
  return (
    <motion.div
      layoutId={`subject-${cls.id}`}
      onClick={onClick}
      className="p-5 h-full flex flex-col cursor-pointer group"
    >
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center mb-3 transition-transform duration-300 group-hover:scale-110"
        style={{
          backgroundColor: `${cls.color || '#3B82F6'}12`,
          color: cls.color || '#3B82F6',
        }}
      >
        <ClassIcon name={cls.icon || 'book'} size={22} />
      </div>
      <h3 className="font-bold text-[#f5f5f7] text-sm truncate tracking-tight">
        {cls.name}
      </h3>
      {cls.teacherName && (
        <p className="text-xs text-[#a1a1a6] truncate mt-1">
          {cls.teacherName}
        </p>
      )}
      <p className="text-[11px] text-white/30 truncate mt-auto pt-2 uppercase tracking-wider font-medium">
        {cls.subject}
      </p>
    </motion.div>
  );
}
