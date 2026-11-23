import React from 'react';
import { NavLink } from 'react-router-dom';
import { User, Stethoscope, Pharmacy, UserCog } from 'lucide-react';
import { cn } from '../utils/cn'; // assume a classnames helper exists; otherwise fallback to simple concat

/** Role identifiers matching backend enum */
export type UserRole = 'PATIENT' | 'DOCTOR' | 'PHARMACY' | 'ADMIN';

/** Accent colours per role – tuned from the brand palette */
export const ROLE_ACCENT: Record<UserRole, string> = {
  PATIENT: '#2585D8', // medical blue
  DOCTOR: '#20B8A5', // turquoise
  PHARMACY: '#123B65', // navy
  ADMIN: '#6B7280', // neutral gray (Tailwind gray-500)
};

/** Simple mapping of role to icon component */
export const ROLE_ICON: Record<UserRole, React.ComponentType<any>> = {
  PATIENT: User,
  DOCTOR: Stethoscope,
  PHARMACY: Pharmacy,
  ADMIN: UserCog,
};

/**
 * Profile selector component used on the registration page.
 * Displays four interactive cards – clicking a card selects the role.
 * The selected card receives a highlighted border and its accent colour.
 */
export const ProfileSelector: React.FC<{
  selected: UserRole | null;
  onSelect: (role: UserRole) => void;
  /** If true, hide the ADMIN card (default false) */
  hideAdmin?: boolean;
}> = ({ selected, onSelect, hideAdmin = false }) => {
  const roles: UserRole[] = hideAdmin
    ? ['PATIENT', 'DOCTOR', 'PHARMACY']
+    : (['PATIENT', 'DOCTOR', 'PHARMACY', 'ADMIN'] as UserRole[]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {roles.map((role) => {
        const Icon = ROLE_ICON[role];
        const isSelected = selected === role;
        const accent = ROLE_ACCENT[role];
        return (
          <button
            key={role}
            type="button"
            onClick={() => onSelect(role)}
            className={cn(
              'flex flex-col items-center p-4 rounded-lg border transition-transform duration-200',
              isSelected ? `border-2` : 'border-gray-200',
              isSelected ? `shadow-md` : 'shadow-sm',
              `hover:scale-105`,
            )}
            style={isSelected ? { borderColor: accent, boxShadow: `0 0 8px ${accent}` } : undefined}
          >
            <Icon size={48} color={accent} />
            <span className="mt-2 text-lg font-medium" style={{ color: accent }}>
              {role.charAt(0) + role.slice(1).toLowerCase()}
            </span>
            <p className="mt-1 text-sm text-gray-600 text-center">
              {role === 'PATIENT' && 'I am a patient looking for care'}
              {role === 'DOCTOR' && 'I am a doctor managing patients'}
              {role === 'PHARMACY' && 'I run a pharmacy'}
              {role === 'ADMIN' && 'System administrator'}
            </p>
          </button>
        );
      })}
    </div>
  );
};

export default ProfileSelector;
