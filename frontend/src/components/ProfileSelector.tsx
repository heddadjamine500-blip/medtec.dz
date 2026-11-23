import React from 'react';
import { motion } from 'framer-motion';
import { User, Stethoscope, Pill, Shield, CheckCircle2 } from 'lucide-react';

export type UserRole = 'PATIENT' | 'DOCTOR' | 'PHARMACY' | 'ADMIN';

export interface ProfileCardData {
  role: UserRole;
  title: string;
  description: string;
  accent: string;
  bgLight: string;
  icon: React.ReactNode;
}

export const PROFILES: ProfileCardData[] = [
  {
    role: 'PATIENT',
    title: 'Patient',
    description: 'Accédez à votre carnet de santé, vos ordonnances et planifiez vos téléconsultations.',
    accent: '#2585D8', // Medical Blue
    bgLight: 'rgba(37, 133, 216, 0.08)',
    icon: <User className="w-6 h-6" />,
  },
  {
    role: 'DOCTOR',
    title: 'Médecin / Praticien',
    description: 'Gérez votre patientèle, rédigez des ordonnances sécurisées et vos consultations.',
    accent: '#20B8A5', // Turquoise
    bgLight: 'rgba(32, 184, 165, 0.08)',
    icon: <Stethoscope className="w-6 h-6" />,
  },
  {
    role: 'PHARMACY',
    title: 'Pharmacie',
    description: 'Délivrez les ordonnances numériques, gérez votre inventaire et vos stocks en temps réel.',
    accent: '#123B65', // Navy Blue
    bgLight: 'rgba(18, 59, 101, 0.08)',
    icon: <Pill className="w-6 h-6" />,
  },
  {
    role: 'ADMIN',
    title: 'Administration',
    description: 'Supervision globale de l’infrastructure, audit de conformité et gestion des rôles.',
    accent: '#6B7280', // Neutral Slate
    bgLight: 'rgba(107, 114, 128, 0.08)',
    icon: <Shield className="w-6 h-6" />,
  },
];

export interface ProfileSelectorProps {
  selectedRole: UserRole;
  onSelectRole: (role: UserRole) => void;
  showAdmin?: boolean;
}

export const ProfileSelector: React.FC<ProfileSelectorProps> = ({
  selectedRole,
  onSelectRole,
  showAdmin = false,
}) => {
  const visibleProfiles = showAdmin
    ? PROFILES
    : PROFILES.filter((p) => p.role !== 'ADMIN');

  return (
    <div className="space-y-3">
      <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
        Sélectionnez votre profil d'accès
      </label>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {visibleProfiles.map((p) => {
          const isSelected = selectedRole === p.role;

          return (
            <motion.button
              key={p.role}
              type="button"
              whileHover={{ y: -3, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelectRole(p.role)}
              className={`relative flex flex-col items-start p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                isSelected
                  ? 'bg-white shadow-lg border-2'
                  : 'bg-white/70 hover:bg-white border-gray-200/90 hover:border-gray-300 shadow-sm'
              }`}
              style={{
                borderColor: isSelected ? p.accent : undefined,
                boxShadow: isSelected ? `0 10px 25px -5px ${p.accent}25` : undefined,
              }}
            >
              {isSelected && (
                <div
                  className="absolute top-3 right-3 rounded-full p-0.5"
                  style={{ color: p.accent }}
                >
                  <CheckCircle2 className="w-5 h-5 fill-current text-white" />
                </div>
              )}

              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center mb-3 transition-colors"
                style={{
                  backgroundColor: p.bgLight,
                  color: p.accent,
                }}
              >
                {p.icon}
              </div>

              <h3
                className="text-sm font-extrabold"
                style={{ color: isSelected ? p.accent : '#1E293B' }}
              >
                {p.title}
              </h3>

              <p className="mt-1 text-[11px] text-gray-500 leading-relaxed font-normal line-clamp-2">
                {p.description}
              </p>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default ProfileSelector;
