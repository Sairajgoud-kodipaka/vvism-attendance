
import React from 'react';
import { Users, UserCheck, UserX, TrendingUp } from 'lucide-react';

interface AttendanceSummaryProps {
  totalStudents: number;
  presentCount: number;
  absentCount: number;
}

const AttendanceSummary = ({ totalStudents, presentCount, absentCount }: AttendanceSummaryProps) => {
  const attendancePercentage = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp size={20} className="text-blue-600" />
        <h2 className="text-lg font-semibold text-gray-900">Attendance Summary</h2>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-center mb-2">
            <Users size={20} className="text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-blue-600">{totalStudents}</div>
          <div className="text-xs text-blue-600 font-medium">Total</div>
        </div>
        
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="flex items-center justify-center mb-2">
            <UserCheck size={20} className="text-green-600" />
          </div>
          <div className="text-2xl font-bold text-green-600">{presentCount}</div>
          <div className="text-xs text-green-600 font-medium">Present</div>
        </div>
        
        <div className="text-center p-3 bg-red-50 rounded-lg">
          <div className="flex items-center justify-center mb-2">
            <UserX size={20} className="text-red-600" />
          </div>
          <div className="text-2xl font-bold text-red-600">{absentCount}</div>
          <div className="text-xs text-red-600 font-medium">Absent</div>
        </div>
        
        <div className="text-center p-3 bg-purple-50 rounded-lg">
          <div className="flex items-center justify-center mb-2">
            <TrendingUp size={20} className="text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-purple-600">{attendancePercentage}%</div>
          <div className="text-xs text-purple-600 font-medium">Rate</div>
        </div>
      </div>
      
      <div className="mt-4">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Attendance Rate</span>
          <span>{attendancePercentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${attendancePercentage}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceSummary;
