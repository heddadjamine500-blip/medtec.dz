git initimport React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, HeartPulse, Activity } from 'lucide-react';
import MedicalLogo from './MedicalLogo';

export interface AuthLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  title,
  subtitle,
}) => {
  return (
    <div className="min-h-screen bg-[#F5F8FC] flex flex-col lg:flex-row font-sans selection:bg-[#20B8A5]/20 selection:text-[#123B65]">
      {/* LEFT SECTION: Premium Healthcare Branding Panel (Desktop & Tablet) */}
      <div className="relative hidden lg:flex lg:w-5/12 xl:w-1/2 bg-[#123B65] text-white flex-col justify-between p-12 overflow-hidden shadow-2xl">
        {/* Abstract Background Orbs & Grids */}
        <div className="absolute inset-0 bg-[radial-gradient(#20B8A5_1px,transparent_1px)] [background-size:28px_28px] opacity-10 pointer-events-none" />
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-[#2585D8]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-[#20B8A5]/20 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header */}
        <div className="relative z-10 flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-3 group">
            <MedicalLogo size={44} monochrome={false} />
            <div className="flex flex-col">
              <span className="text-2xl font-black tracking-tight text-white leading-none">
                MED<span className="text-[#20B8A5]">TEC</span>
              </span>
              <span className="text-[9px] uppercase font-bold tracking-widest text-cyan-300 mt-1">
                Healthcare, Connected.
              </span>
            </div>
          </Link>
        </div>

        {/* Center Presentation & Medical Illustration */}
        <div className="relative z-10 my-auto py-10 max-w-lg">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/10 text-xs font-semibold text-emerald-300 backdrop-blur-md">
              <Activity className="w-3.5 h-3.5 text-[#20B8A5]" />
              <span>SaaS Médical de Haute Précision</span>
            </div>

            <h1 className="text-4xl xl:text-5xl font-black leading-tight tracking-tight">
              L'avenir du soin, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#20B8A5] via-cyan-300 to-[#2585D8]">
                connecté en temps réel.
              </span>
            </h1>

            <p className="text-sm xl:text-base text-slate-300 leading-relaxed font-normal">
              Plateforme unifiée pour patients, médecins, pharmacies et administrateurs.
              Sécurité clinique de niveau bancaire, prescriptions électroniques infalsifiables et télé-expertise médicale.
            </p>

            {/* Feature highlights */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
              <div className="flex items-start gap-2.5">
                <div className="p-2 rounded-xl bg-white/10 text-[#20B8A5] shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Chiffrement HDS</h4>
                  <p className="text-[11px] text-slate-400">Données de santé conformes RGPD</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="p-2 rounded-xl bg-white/10 text-[#2585D8] shrink-0">
                  <HeartPulse className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Interconnexion Directe</h4>
                  <p className="text-[11px] text-slate-400">Ordonnances & pharmacie instantanées</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 flex items-center justify-between text-xs text-slate-400 border-t border-white/10 pt-4">
          <span>&copy; {new Date().getFullYear()} MEDTEC Inc.</span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Serveurs opérationnels
          </span>
        </div>
      </div>

      {/* RIGHT SECTION: Content Slot (Login, Register, Profiles) */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-8 md:px-12 lg:px-16 py-12 relative overflow-y-auto">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between mb-8 pb-4 border-b border-gray-200">
          <Link to="/" className="inline-flex items-center gap-2">
            <MedicalLogo size={36} />
            <span className="text-xl font-black text-[#123B65]">MEDTEC</span>
          </Link>
        </div>

        <div className="w-full max-w-xl mx-auto">
          {title && (
            <div className="mb-8">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#123B65] tracking-tight">
                {title}
              </h2>
              {subtitle && (
                <p className="mt-2 text-sm text-gray-500 font-medium">
                  {subtitle}
                </p>
              )}
            </div>
          )}

          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
