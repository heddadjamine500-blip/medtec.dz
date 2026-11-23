import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, 
  Activity, 
  User, 
  Stethoscope, 
  Pill, 
  Shield, 
  ArrowRight,
  LogIn,
  LogOut
} from 'lucide-react';

import DoctorDashboard from './components/DoctorDashboard';
import PatientDashboard from './components/PatientDashboard';
import PharmacyDashboard from './components/PharmacyDashboard';
import AdminDashboard from './components/AdminDashboard';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuthStore } from './store/authStore';
import MedicalLogo from './components/MedicalLogo';
import LogoIntroOverlay from './components/LogoIntroOverlay';

function WelcomePage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, token, logout } = useAuthStore();

  const getMyPortalLink = () => {
    if (!user) return '/login';
    if (user.role === 'PATIENT') return '/patient';
    if (user.role === 'DOCTOR') return '/doctor';
    if (user.role === 'PHARMACY') return '/pharmacy';
    if (user.role === 'ADMIN') return '/admin';
    return '/';
  };

  return (
    <div className="min-h-screen bg-[#F5F8FC] flex flex-col font-sans relative overflow-hidden">
      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-3xl opacity-60"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-3xl opacity-60"></div>

      {/* Navigation Bar */}
      <header className="relative z-20 w-full px-8 py-6 flex items-center justify-between">
        <Link to="/" className="flex items-center group">
          <MedicalLogo size={42} showText={true} />
        </Link>
        
        <nav className="flex items-center space-x-4">
          {token && user ? (
            <div className="flex items-center space-x-3">
              <Link
                to={getMyPortalLink()}
                className="flex items-center px-5 py-2.5 bg-[#2585D8] hover:bg-[#1d6fb8] text-white rounded-full font-bold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer"
              >
                Mon Espace ({user.role})
              </Link>
              <button
                onClick={logout}
                className="flex items-center px-4 py-2 bg-white border border-gray-200 text-gray-700 hover:text-red-600 rounded-full font-bold text-xs shadow-sm transition-all cursor-pointer"
                title="Déconnexion"
              >
                <LogOut className="w-3.5 h-3.5 mr-1" /> Quitter
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <Link
                to="/login"
                className="flex items-center px-5 py-2.5 bg-[#123B65] hover:bg-[#0d2a4a] text-white rounded-full font-bold text-xs shadow-md shadow-slate-900/10 transition-all cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5 mr-1.5" /> Connexion
              </Link>
              <Link
                to="/register"
                className="flex items-center px-5 py-2.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-full font-bold text-xs shadow-sm transition-all cursor-pointer"
              >
                Inscription
              </Link>
            </div>
          )}

          <div className="relative">
            <button 
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center px-4 py-2.5 bg-white border border-gray-200 shadow-sm rounded-full font-bold text-xs text-gray-800 hover:shadow-md transition-all cursor-pointer"
            >
              Portails <ChevronDown className="w-3.5 h-3.5 ml-1.5 text-gray-400" />
            </button>

            <AnimatePresence>
              {menuOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-3 w-64 bg-white/95 backdrop-blur-xl border border-gray-100 shadow-2xl rounded-2xl overflow-hidden flex flex-col p-2 z-50"
                >
                  <PortalLink to="/patient" title="Portail Patient" activeBg="hover:bg-blue-50" textCol="text-blue-600" desc="Dossier santé & RDV" icon={<User className="w-4 h-4 text-blue-600" />} />
                  <PortalLink to="/doctor" title="Portail Médecin" activeBg="hover:bg-emerald-50" textCol="text-emerald-600" desc="Consultations & Ordonnances" icon={<Stethoscope className="w-4 h-4 text-emerald-600" />} />
                  <PortalLink to="/pharmacy" title="Portail Pharmacie" activeBg="hover:bg-amber-50" textCol="text-amber-600" desc="Stocks & Délivrances" icon={<Pill className="w-4 h-4 text-amber-600" />} />
                  <div className="h-px bg-gray-100 my-1 mx-2"></div>
                  <PortalLink to="/admin" title="Administration" activeBg="hover:bg-purple-50" textCol="text-purple-600" desc="Supervision globale" icon={<Shield className="w-4 h-4 text-purple-600" />} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center relative z-10 px-6 py-12">
        <div className="max-w-4xl text-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center px-4 py-2 bg-white/80 backdrop-blur-md rounded-full border border-gray-200 text-xs font-bold text-gray-700 mb-8 shadow-sm"
          >
            <Activity className="w-4 h-4 text-emerald-500 mr-2" /> Plateforme Clinique Complète &bull; Authentification Sécurisée
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-7xl font-black text-[#123B65] leading-tight mb-6"
          >
            L'Écosystème Médical <br/> 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2585D8] via-cyan-500 to-[#20B8A5]">
              Unifié & Opérationnel.
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto mb-10 font-medium"
          >
            Gestion des rendez-vous, rédaction d'ordonnances en direct, suivi d'inventaire pharmaceutique et dossier médical partagé.
          </motion.p>

          {/* Quick Direct Portal Cards */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto"
          >
            <Link to="/patient" className="p-6 bg-white hover:bg-blue-50/50 rounded-3xl border border-gray-200 hover:border-blue-300 shadow-sm hover:shadow-md transition-all text-left group">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#2585D8] flex items-center justify-center font-bold mb-4 group-hover:scale-110 transition-transform">
                <User className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-gray-900 group-hover:text-[#2585D8] flex items-center justify-between">
                Espace Patient <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h3>
              <p className="text-xs text-gray-500 mt-1">Prendre RDV, ordonnances & suivi santé</p>
            </Link>

            <Link to="/doctor" className="p-6 bg-white hover:bg-emerald-50/50 rounded-3xl border border-gray-200 hover:border-emerald-300 shadow-sm hover:shadow-md transition-all text-left group">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold mb-4 group-hover:scale-110 transition-transform">
                <Stethoscope className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-gray-900 group-hover:text-emerald-600 flex items-center justify-between">
                Espace Médecin <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h3>
              <p className="text-xs text-gray-500 mt-1">Consultations, patients & ordonnances</p>
            </Link>

            <Link to="/pharmacy" className="p-6 bg-white hover:bg-amber-50/50 rounded-3xl border border-gray-200 hover:border-amber-300 shadow-sm hover:shadow-md transition-all text-left group">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold mb-4 group-hover:scale-110 transition-transform">
                <Pill className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-gray-900 group-hover:text-amber-600 flex items-center justify-between">
                Pharmacie <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h3>
              <p className="text-xs text-gray-500 mt-1">Stock de médicaments & commandes</p>
            </Link>

            <Link to="/admin" className="p-6 bg-white hover:bg-purple-50/50 rounded-3xl border border-gray-200 hover:border-purple-300 shadow-sm hover:shadow-md transition-all text-left group">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold mb-4 group-hover:scale-110 transition-transform">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-gray-900 group-hover:text-purple-600 flex items-center justify-between">
                Administration <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h3>
              <p className="text-xs text-gray-500 mt-1">Monitoring, serveurs & utilisateurs</p>
            </Link>
          </motion.div>
        </div>
      </main>
    </div>
  );
}

function PortalLink({ to, title, desc, activeBg, textCol, icon }: any) {
  return (
    <Link to={to} className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${activeBg} group`}>
      <div className="p-2 rounded-lg bg-gray-50 group-hover:bg-white transition-colors">
        {icon}
      </div>
      <div>
        <h4 className={`text-sm font-bold text-gray-900 group-hover:${textCol}`}>{title}</h4>
        <p className="text-xs text-gray-500 font-medium">{desc}</p>
      </div>
    </Link>
  );
}

function App() {
  const { loadUser, token } = useAuthStore();
  
  // Show intro only at the very first start of the session
  const [showIntro, setShowIntro] = useState<boolean>(() => {
    return !sessionStorage.getItem('medtec_intro_dismissed');
  });

  const handleCloseIntro = () => {
    sessionStorage.setItem('medtec_intro_dismissed', 'true');
    setShowIntro(false);
  };

  useEffect(() => {
    if (token) {
      loadUser();
    }
  }, [token, loadUser]);

  return (
    <>
      {/* Intro Animation at the very beginning of the app (only Skip button inside) */}
      <LogoIntroOverlay isOpen={showIntro} onClose={handleCloseIntro} />

      <Router>
        <Routes>
          <Route path="/" element={<WelcomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route 
            path="/patient" 
            element={
              <ProtectedRoute requiredRole="PATIENT">
                <PatientDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/doctor" 
            element={
              <ProtectedRoute requiredRole="DOCTOR">
                <DoctorDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/pharmacy" 
            element={
              <ProtectedRoute requiredRole="PHARMACY">
                <PharmacyDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
