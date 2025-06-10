
-- Create students table
CREATE TABLE public.students (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  hall_ticket TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create attendance table
CREATE TABLE public.attendance (
  id SERIAL PRIMARY KEY,
  student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time_slot TEXT NOT NULL CHECK (time_slot IN ('9:30-10:30', '10:30-11:30', '12:00-1:00', '2:00-3:00', '3:00-4:00')),
  status TEXT NOT NULL CHECK (status IN ('present', 'absent')),
  marked_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one attendance record per student per session
  UNIQUE(student_id, date, time_slot)
);

-- Add indexes for performance
CREATE INDEX idx_students_hall_ticket ON students(hall_ticket);
CREATE INDEX idx_students_name ON students USING gin(to_tsvector('english', name));
CREATE INDEX idx_attendance_date_timeslot ON attendance(date, time_slot);
CREATE INDEX idx_attendance_student_date ON attendance(student_id, date);

-- Create view for attendance with student details
CREATE VIEW attendance_with_students AS
SELECT 
  a.id,
  a.date,
  a.time_slot,
  a.status,
  a.created_at,
  a.updated_at,
  a.marked_by,
  s.name as student_name,
  s.hall_ticket,
  s.id as student_id
FROM attendance a
JOIN students s ON s.id = a.student_id;

-- Enable Row Level Security
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Students: Allow authenticated users to read
CREATE POLICY "Students are viewable by authenticated users" 
ON public.students FOR SELECT 
TO authenticated 
USING (true);

-- Attendance: Users can read all records
CREATE POLICY "Attendance records are viewable by authenticated users" 
ON public.attendance FOR SELECT 
TO authenticated 
USING (true);

-- Attendance: Users can insert records
CREATE POLICY "Users can insert attendance records" 
ON public.attendance FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = marked_by);

-- Attendance: Users can update records
CREATE POLICY "Users can update attendance records" 
ON public.attendance FOR UPDATE 
TO authenticated 
USING (auth.uid() = marked_by)
WITH CHECK (auth.uid() = marked_by);

-- Insert sample student data (first 10 students as example)
INSERT INTO public.students (name, hall_ticket) VALUES
('ANIVENI RANIKA', '217023026001'),
('AKIREDDY SPANDANA', '217023026002'),
('ARUKALA SUMANTH', '217023026003'),
('AVINASH SHARMA', '217023026004'),
('BADAM MOUNIKA DEVI', '217023026005'),
('BHAVANI SHANKAR', '217023026006'),
('CHANDANA REDDY', '217023026007'),
('DEEPIKA SHARMA', '217023026008'),
('ESWAR KUMAR', '217023026009'),
('GANGA DEVI', '217023026010');
