
import React from 'react';
import { GraduationCap } from 'lucide-react';

const Header = () => {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 shadow-lg">
      <div className="max-w-4xl mx-auto flex items-center justify-center gap-3">
        <GraduationCap size={32} className="text-blue-100" />
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
          VV Attendance
        </h1>
      </div>
      <p className="text-center text-blue-100 mt-2 text-sm md:text-base">
        University Faculty Attendance Management
      </p>
    </div>
  );
};

export default Header;
