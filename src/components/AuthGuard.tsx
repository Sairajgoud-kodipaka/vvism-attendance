
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, Users } from 'lucide-react';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, signInWithGoogle } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <GraduationCap className="h-12 w-12 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">VV Attendance</CardTitle>
            <CardDescription>
              University Faculty Attendance Management System
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
              <Users className="h-5 w-5 text-blue-600" />
              <div className="text-sm text-blue-700">
                Manage attendance for 201 students efficiently on mobile devices
              </div>
            </div>
            <Button 
              onClick={signInWithGoogle}
              className="w-full bg-blue-600 hover:bg-blue-700"
              size="lg"
            >
              Sign in with Google
            </Button>
            <p className="text-xs text-gray-500 text-center">
              Only authorized faculty members can access this system
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
