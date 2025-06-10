
import React from 'react';
import { User, CheckCircle, XCircle } from 'lucide-react';

interface StudentCardProps {
  hallTicket: string;
  name: string;
  isPresent: boolean;
  onAttendanceChange: (hallTicket: string, isPresent: boolean) => void;
}

const StudentCard = ({ hallTicket, name, isPresent, onAttendanceChange }: StudentCardProps) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <User size={20} className="text-blue-600" />
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 text-sm md:text-base truncate">
            {name}
          </h3>
          <p className="text-gray-500 text-xs md:text-sm font-mono">
            {hallTicket}
          </p>
        </div>
      </div>
      
      <div className="mt-4 flex gap-2">
        <button
          onClick={() => onAttendanceChange(hallTicket, true)}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium text-sm transition-all duration-200 ${
            isPresent
              ? 'bg-green-500 text-white shadow-sm'
              : 'bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-600'
          }`}
        >
          <CheckCircle size={16} />
          Present
        </button>
        
        <button
          onClick={() => onAttendanceChange(hallTicket, false)}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium text-sm transition-all duration-200 ${
            !isPresent
              ? 'bg-red-500 text-white shadow-sm'
              : 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600'
          }`}
        >
          <XCircle size={16} />
          Absent
        </button>
      </div>
    </div>
  );
};

export default StudentCard;
