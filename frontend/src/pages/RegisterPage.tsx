import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import AuthLayout from '../components/AuthLayout';
import ProfileSelector from '../components/ProfileSelector';
import type { UserRole } from '../components/ProfileSelector';
import ProfileRegistrationForm from '../components/ProfileRegistrationForm';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const showAdmin = searchParams.get('admin') === 'true';

  const { register, isLoading, error } = useAuthStore();
  const [selectedRole, setSelectedRole] = useState<UserRole>('PATIENT');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleRegister = async (payload: Record<string, any>) => {
    try {
      const res = await register(payload);
      setIsSuccess(true);

      setTimeout(() => {
        if (res?.user?.role) {
          const r = res.user.role;
          if (r === 'PATIENT') navigate('/patient', { replace: true });
          else if (r === 'DOCTOR') navigate('/doctor', { replace: true });
          else if (r === 'PHARMACY') navigate('/pharmacy', { replace: true });
          else if (r === 'ADMIN') navigate('/admin', { replace: true });
          else navigate('/', { replace: true });
        } else {
          navigate('/login', { replace: true });
        }
      }, 1500);
    } catch {
      // Error handled by store and displayed by form
    }
  };

  return (
    <AuthLayout
      title="Créer un compte professionnel ou patient"
      subtitle="Rejoignez le réseau médical unifié MEDTEC et accédez à vos services de santé."
    >
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/50 space-y-6">
        <AnimatePresence>
          {isSuccess && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800"
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="text-xs font-bold">Compte créé avec succès !</p>
                <p className="text-[11px] text-emerald-700">Redirection vers votre espace de santé...</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step 1: Interactive Profile Selection */}
        <ProfileSelector
          selectedRole={selectedRole}
          onSelectRole={setSelectedRole}
          showAdmin={showAdmin}
        />

        <div className="h-px bg-gray-100" />

        {/* Step 2: Role-Specific Dynamic Form */}
        <ProfileRegistrationForm
          role={selectedRole}
          onSubmit={handleRegister}
          isLoading={isLoading}
          serverError={error}
        />

        {/* Link back to login */}
        <div className="pt-2 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-500 font-medium">
            Vous disposez déjà d'un compte médical ?{' '}
            <Link
              to="/login"
              className="font-bold text-[#2585D8] hover:text-[#123B65] transition-colors"
            >
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
}
