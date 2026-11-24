import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  AlertCircle, 
  Loader2, 
  User, 
  Stethoscope, 
  Pill, 
  Shield,
  HelpCircle
} from 'lucide-react';

export interface LoginFormProps {
  onSubmit: (email: string, password: string, rememberMe: boolean) => Promise<void>;
  isLoading: boolean;
  serverError: string | null;
  onClearError: () => void;
}

export const DEMO_PRESETS = [
  {
    role: 'PATIENT',
    label: 'Patient',
    email: 'patient@medtec.com',
    color: '#2585D8',
    icon: <User className="w-3.5 h-3.5" />,
  },
  {
    role: 'DOCTOR',
    label: 'Médecin',
    email: 'doctor@medtec.com',
    color: '#20B8A5',
    icon: <Stethoscope className="w-3.5 h-3.5" />,
  },
  {
    role: 'PHARMACY',
    label: 'Pharmacie',
    email: 'pharmacy@medtec.com',
    color: '#123B65',
    icon: <Pill className="w-3.5 h-3.5" />,
  },
  {
    role: 'ADMIN',
    label: 'Admin',
    email: 'admin@medtec.com',
    color: '#6B7280',
    icon: <Shield className="w-3.5 h-3.5" />,
  },
];

export const LoginForm: React.FC<LoginFormProps> = ({
  onSubmit,
  isLoading,
  serverError,
  onClearError,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [clientError, setClientError] = useState<string | null>(null);
  const [showForgotModal, setShowForgotModal] = useState(false);

  const handleFillDemo = (demoEmail: string, autoSubmit = false) => {
    setEmail(demoEmail);
    setPassword('password123');
    setClientError(null);
    onClearError();
    if (autoSubmit) {
      onSubmit(demoEmail, 'password123', rememberMe);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setClientError(null);
    onClearError();

    if (!email.trim() || !password) {
      setClientError('Veuillez renseigner votre email et votre mot de passe.');
      return;
    }

    if (!email.includes('@')) {
      setClientError('Format d’adresse email invalide.');
      return;
    }

    await onSubmit(email.trim(), password, rememberMe);
  };

  return (
    <div className="bg-white p-8 sm:p-10 rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/50 space-y-6">
      {/* Demo fast-login badges */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
            Comptes de démonstration
          </span>
          <span className="text-[10px] text-gray-500 font-medium">
            Mot de passe : <span className="text-[#2585D8] font-mono font-bold">password123</span>
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {DEMO_PRESETS.map((p) => (
            <button
              key={p.role}
              type="button"
              onClick={() => handleFillDemo(p.email, true)}
              title={`Connexion instantanée en tant que ${p.label}`}
              className="flex items-center justify-center gap-1.5 py-2 px-2 bg-gray-50 hover:bg-blue-50/80 border border-gray-200 hover:border-[#2585D8]/40 rounded-xl text-xs font-semibold text-gray-700 transition-all cursor-pointer active:scale-95 group"
            >
              <span style={{ color: p.color }}>{p.icon}</span>
              <span className="group-hover:text-[#2585D8] transition-colors">{p.label}</span>
            </button>
          ))}
        </div>
        <p className="text-[10px] text-gray-400 mt-1.5 text-center">
          ⚡ Cliquez sur un profil ci-dessus pour vous connecter instantanément
        </p>
      </div>

      <div className="h-px bg-gray-100" />

      {/* Error alert */}
      <AnimatePresence>
        {(clientError || serverError) && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 flex items-center gap-2.5 font-medium"
          >
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{clientError || serverError}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email Field */}
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
            Adresse Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre.email@medtec.com"
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2585D8] focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Password Field */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold text-gray-700 uppercase">
              Mot de passe
            </label>
            <button
              type="button"
              onClick={() => setShowForgotModal(true)}
              className="text-xs font-bold text-[#2585D8] hover:text-[#123B65] transition-colors"
            >
              Mot de passe oublié ?
            </button>
          </div>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-10 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2585D8] focus:bg-white transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Remember me option */}
        <div className="flex items-center">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded text-[#2585D8] focus:ring-[#2585D8] border-gray-300"
            />
            <span className="text-xs text-gray-600 font-medium">
              Mémoriser ma session sur cet appareil
            </span>
          </label>
        </div>

        {/* Submit Button */}
        <motion.button
          whileHover={{ scale: 1.008 }}
          whileTap={{ scale: 0.99 }}
          type="submit"
          disabled={isLoading}
          className="w-full py-3 px-6 bg-gradient-to-r from-[#123B65] to-[#2585D8] text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Authentification en cours...</span>
            </>
          ) : (
            <>
              <span>Se connecter</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </motion.button>
      </form>

      {/* Switch to Register */}
      <div className="pt-2 border-t border-gray-100 text-center">
        <p className="text-xs text-gray-500 font-medium">
          Vous n'avez pas encore de compte praticien ou patient ?{' '}
          <Link
            to="/register"
            className="font-bold text-[#20B8A5] hover:text-[#123B65] transition-colors"
          >
            Créer un profil
          </Link>
        </p>
      </div>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {showForgotModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white p-6 rounded-2xl max-w-sm w-full shadow-2xl border border-gray-100 space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-50 text-[#2585D8]">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Réinitialisation de compte</h3>
                  <p className="text-xs text-gray-500">Procédure de sécurité médicale</p>
                </div>
              </div>

              <p className="text-xs text-gray-600 leading-relaxed">
                Pour des raisons de secret médical et de conformité HDS, veuillez contacter votre référent d'établissement ou utiliser les comptes de démonstration (mot de passe : <code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono text-gray-800">password123</code>).
              </p>

              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Compris
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LoginForm;
