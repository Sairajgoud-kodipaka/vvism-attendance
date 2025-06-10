
import { AuthProvider } from '@/hooks/useAuth';
import { AuthGuard } from '@/components/AuthGuard';
import { AttendanceApp } from '@/components/AttendanceApp';

const Index = () => {
  return (
    <AuthProvider>
      <AuthGuard>
        <AttendanceApp />
      </AuthGuard>
    </AuthProvider>
  );
};

export default Index;
