import { Navigate, Route, Routes } from 'react-router-dom';
import RequireRole from './auth/RequireRole';
import { useAuth } from './auth/AuthProvider';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import StudentDashboard from './pages/StudentDashboard';
import StudentLessonPage from './pages/StudentLessonPage';
import TeacherDashboard from './pages/TeacherDashboard';
import TeacherLessonEditor from './pages/TeacherLessonEditor';
import TeacherResultsPage from './pages/TeacherResultsPage';

export default function App(){const {user,profile,loading,configured}=useAuth();if(loading)return <div className="grid min-h-screen place-items-center bg-[#f6f3ed] text-sm font-bold text-[#4a6b8c]">Memuat TemuKata...</div>;const home=user&&profile?(profile.role==='teacher'?'/teacher':'/student'):'/login';return <Routes><Route path="/" element={<Navigate to={home} replace/>}/><Route path="/login" element={<LoginPage/>}/><Route path="/register" element={<RegisterPage/>}/><Route element={<RequireRole role="student"/>}><Route path="/student" element={<StudentDashboard/>}/><Route path="/student/lessons/:id" element={<StudentLessonPage/>}/></Route><Route element={<RequireRole role="teacher"/>}><Route path="/teacher" element={<TeacherDashboard/>}/><Route path="/teacher/lessons/new" element={<TeacherLessonEditor/>}/><Route path="/teacher/results" element={<TeacherResultsPage/>}/></Route><Route path="*" element={<Navigate to={configured?home:'/login'} replace/>}/></Routes>}
