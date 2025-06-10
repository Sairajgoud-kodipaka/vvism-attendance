import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LogOut, Search, Users, Clock, Calendar, Check, X, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';

interface Student {
  id: number;
  name: string;
  hall_ticket: string;
}

interface AttendanceRecord {
  student_id: number;
  status: 'present' | 'absent';
}

const TIME_SLOTS = [
  '9:30-10:30',
  '10:30-11:30',
  '12:00-1:00',
  '2:00-3:00',
  '3:00-4:00'
];

export function AttendanceApp() {
  const { user, signOut } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(TIME_SLOTS[0]);
  const [attendance, setAttendance] = useState<Record<number, 'present' | 'absent'>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Load students on component mount
  useEffect(() => {
    loadStudents();
  }, []);

  // Initialize attendance as all present when students load
  useEffect(() => {
    if (students.length > 0) {
      const initialAttendance: Record<number, 'present' | 'absent'> = {};
      students.forEach(student => {
        initialAttendance[student.id] = 'present';
      });
      setAttendance(initialAttendance);
    }
  }, [students]);

  const loadStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('hall_ticket');

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Error loading students:', error);
      toast({
        title: "Error",
        description: "Failed to load students. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = useMemo(() => {
    if (!searchTerm) return students;
    
    const term = searchTerm.toLowerCase();
    return students.filter(student => 
      student.name.toLowerCase().includes(term) ||
      student.hall_ticket.toLowerCase().includes(term)
    );
  }, [students, searchTerm]);

  const attendanceStats = useMemo(() => {
    const presentCount = Object.values(attendance).filter(status => status === 'present').length;
    const absentCount = Object.values(attendance).filter(status => status === 'absent').length;
    const totalStudents = students.length;

    return { presentCount, absentCount, totalStudents };
  }, [attendance, students.length]);

  const handleAttendanceChange = (studentId: number, status: 'present' | 'absent') => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const markAllPresent = () => {
    const allPresent: Record<number, 'present' | 'absent'> = {};
    students.forEach(student => {
      allPresent[student.id] = 'present';
    });
    setAttendance(allPresent);
    toast({
      title: "Success",
      description: "All students marked as present"
    });
  };

  const submitAttendance = async () => {
    if (!user) return;

    setSubmitting(true);
    try {
      // Records for Supabase database
      const recordsForSupabase = Object.entries(attendance).map(([studentId, status]) => ({
        student_id: parseInt(studentId),
        date: selectedDate,
        time_slot: selectedTimeSlot,
        status,
        marked_by: user.id,
      }));

      // Records for Google Sheets sync (includes student name and hall ticket)
      const recordsForGoogleSheets = Object.entries(attendance).map(([studentId, status]) => ({
        student_id: parseInt(studentId),
        date: selectedDate,
        time_slot: selectedTimeSlot,
        status,
        // Also include student_name and hall_ticket for Google Sheets sync
        student_name: students.find(s => s.id === parseInt(studentId))?.name || '',
        hall_ticket: students.find(s => s.id === parseInt(studentId))?.hall_ticket || '',
      }));

      // 1. Save to Supabase first
      const { error } = await supabase
        .from('attendance')
        .upsert(recordsForSupabase, { 
          onConflict: 'student_id,date,time_slot'
        });

      if (error) throw error;

      // 2. Sync to Google Sheets
      try {
        await syncToGoogleSheets(recordsForGoogleSheets, selectedDate, selectedTimeSlot);
        toast({
          title: "Attendance Saved Successfully!",
          description: `${attendanceStats.presentCount} present, ${attendanceStats.absentCount} absent out of ${students.length} students. Synced to Google Sheets.`
        });
      } catch (syncError) {
        console.error('Google Sheets sync failed:', syncError);
        toast({
          title: "Attendance Saved!",
          description: "Attendance saved to database. Google Sheets sync failed.",
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error('Error submitting attendance:', error);
      toast({
        title: "Error",
        description: "Failed to save attendance. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Add this function for Google Sheets integration
  async function syncToGoogleSheets(attendanceData: any[], date: string, timeSlot: string) {
    try {
      const { data, error } = await supabase.functions.invoke('sync-to-sheets', {
        body: {
          attendanceData: attendanceData.map(record => ({
            student_name: record.student_name,
            hall_ticket: record.hall_ticket,
            status: record.status,
            date: date,
            time_slot: timeSlot
          }))
        }
      });
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Sync to Google Sheets failed:', error);
      throw error;
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading students...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white sticky top-0 z-10 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8" />
              <div>
                <h1 className="text-xl font-bold">VV Attendance</h1>
                <p className="text-blue-100 text-sm">Faculty: {user?.email}</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={signOut}
              className="text-white hover:bg-blue-700"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Session Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Session Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Date</label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Time Slot</label>
                <select 
                  value={selectedTimeSlot}
                  onChange={(e) => setSelectedTimeSlot(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  {TIME_SLOTS.map(slot => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Attendance Summary */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Badge variant="outline" className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  Present: {attendanceStats.presentCount}
                </Badge>
                <Badge variant="outline" className="flex items-center gap-2">
                  <X className="h-4 w-4 text-red-600" />
                  Absent: {attendanceStats.absentCount}
                </Badge>
                <Badge variant="outline">
                  Total: {attendanceStats.totalStudents}
                </Badge>
              </div>
              <Button 
                onClick={markAllPresent}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                All Present
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search by name or hall ticket..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Student List */}
        <Card>
          <CardHeader>
            <CardTitle>
              Student Attendance ({filteredStudents.length} students)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-96 overflow-y-auto">
              {filteredStudents.map((student) => (
                <div 
                  key={student.id}
                  className="flex items-center justify-between p-4 border-b hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{student.name}</div>
                    <div className="text-sm text-gray-500">{student.hall_ticket}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={attendance[student.id] === 'present' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleAttendanceChange(student.id, 'present')}
                      className="min-w-20"
                    >
                      Present
                    </Button>
                    <Button
                      variant={attendance[student.id] === 'absent' ? 'destructive' : 'outline'}
                      size="sm"
                      onClick={() => handleAttendanceChange(student.id, 'absent')}
                      className="min-w-20"
                    >
                      Absent
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <Button 
          onClick={submitAttendance}
          disabled={submitting}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-lg"
        >
          {submitting ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Saving Attendance...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5" />
              Save Attendance ({attendanceStats.presentCount}P / {attendanceStats.absentCount}A)
            </div>
          )}
        </Button>
      </div>
    </div>
  );
}
