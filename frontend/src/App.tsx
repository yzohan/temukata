import { Navigate, Route, Routes } from 'react-router-dom';
import RequireRole from './auth/RequireRole';
import { useAuth } from './auth/AuthProvider';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import StudentDashboard from './pages/StudentDashboard';
import StudentLeaderboardPage from './pages/StudentLeaderboardPage';
import StudentLessonPage from './pages/StudentLessonPage';
import TeacherDashboard from './pages/TeacherDashboard';
import TeacherLessonEditor from './pages/TeacherLessonEditor';
import TeacherResultsPage from './pages/TeacherResultsPage';

export default function App() {
  const { user, profile, loading, configured } = useAuth();
  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#f7f9fd] text-sm font-bold text-[#2f4f7f]">
        Memuat TemuKata...
      </div>
    );
  }
  const home = user && profile ? (profile.role === 'teacher' ? '/teacher' : '/student') : '/login';

  return (
    <Routes>
      <Route path="/" element={<Navigate to={home} replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Student Routes */}
      <Route element={<RequireRole role="student" />}>
        <Route path="/student" element={<StudentDashboard tab="beranda" />} />
        <Route path="/student/materi" element={<StudentDashboard tab="materi" />} />
        <Route path="/student/toko" element={<StudentDashboard tab="toko" />} />
        <Route path="/student/koleksi" element={<StudentDashboard tab="koleksi" />} />
        <Route path="/student/progres" element={<StudentDashboard tab="progres" />} />
        <Route path="/student/peringkat" element={<StudentLeaderboardPage />} />
        <Route path="/student/akun" element={<StudentDashboard tab="akun" />} />
        <Route path="/student/lessons/:id" element={<StudentLessonPage />} />
      </Route>

      {/* Teacher Routes */}
      <Route element={<RequireRole role="teacher" />}>
        <Route path="/teacher" element={<TeacherDashboard />} />
        <Route path="/teacher/lessons/new" element={<TeacherLessonEditor />} />
        <Route path="/teacher/results" element={<TeacherResultsPage />} />
      </Route>

      <Route path="*" element={<Navigate to={configured ? home : '/login'} replace />} />
    </Routes>
  );
}
