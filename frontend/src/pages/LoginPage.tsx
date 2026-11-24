import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import AuthLayout from '../components/AuthLayout';
import LoginForm from '../components/LoginForm';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, token, user, isLoading, error, clearError } = useAuthStore();

  // If already authenticated, redirect to appropriate role portal
  useEffect(() => {
    if (token && user) {
      if (user.role === 'PATIENT') navigate('/patient', { replace: true });
      else if (user.role === 'DOCTOR') navigate('/doctor', { replace: true });
      else if (user.role === 'PHARMACY') navigate('/pharmacy', { replace: true });
      else if (user.role === 'ADMIN') navigate('/admin', { replace: true });
      else if (user.role === 'EMPLOYEE') navigate('/employee', { replace: true });
    }
  }, [token, user, navigate]);

  const handleLogin = async (email: string, password: string) => {
    clearError();
    try {
      const loggedUser = await login(email, password);
      if (loggedUser.role === 'PATIENT') navigate('/patient', { replace: true });
      else if (loggedUser.role === 'DOCTOR') navigate('/doctor', { replace: true });
      else if (loggedUser.role === 'PHARMACY') navigate('/pharmacy', { replace: true });
      else if (loggedUser.role === 'ADMIN') navigate('/admin', { replace: true });
      else if (loggedUser.role === 'EMPLOYEE') navigate('/employee', { replace: true });
      else navigate('/', { replace: true });
    } catch {
      // Handled in store and displayed in form
    }
  };

  return (
    <AuthLayout
      title="Connexion Sécurisée"
      subtitle="Accédez à vos dossiers cliniques, ordonnances électroniques et outils de santé."
    >
      <LoginForm
        onSubmit={handleLogin}
        isLoading={isLoading}
        serverError={error}
        onClearError={clearError}
      />
    </AuthLayout>
  );
}
