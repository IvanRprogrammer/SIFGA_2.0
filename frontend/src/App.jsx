import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import LoginPage from './pages/auth/LoginPage';
import AdminPage from './pages/admin/AdminPage';
import VendorPage from './pages/vendor/VendorPage';
import ClientPage from './pages/client/ClientPage';
import { ToastContainer } from 'react-toastify';

const App = () => {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin/*" element={
          <ProtectedRoute roles={[1]}>
            <AdminPage />
          </ProtectedRoute>
        } />
        <Route path="/vendedor/*" element={
          <ProtectedRoute roles={[2]}>
            <VendorPage />
          </ProtectedRoute>
        } />
        <Route path="/cliente/*" element={
          <ProtectedRoute roles={[3]}>
            <ClientPage />
          </ProtectedRoute>
        } />
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar newestOnTop closeOnClick />
    </AuthProvider>
  );
};

export default App;
