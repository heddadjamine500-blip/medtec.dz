import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  User, 
  Phone, 
  MapPin, 
  Calendar, 
  Stethoscope, 
  Building2, 
  Award, 
  AlertCircle, 
  Loader2, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import type { UserRole } from './ProfileSelector';

export interface ProfileRegistrationFormProps {
  role: UserRole;
  onSubmit: (formData: Record<string, any>) => Promise<void>;
  isLoading: boolean;
  serverError: string | null;
}

const MEDICAL_SPECIALTIES = [
  'Médecine Générale',
  'Cardiologie',
  'Pédiatrie',
  'Dermatologie',
  'Neurologie',
  'Gynécologie Médicale',
  'Ophtalmologie',
  'Psychiatrie',
  'Radiologie',
  'Chirurgie Orthopédique',
  'Autre Spécialité',
];

export const ProfileRegistrationForm: React.FC<ProfileRegistrationFormProps> = ({
  role,
  onSubmit,
  isLoading,
  serverError,
}) => {
  // Shared fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  // Patient / Doctor specific
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState('');

  // Doctor specific
  const [specialty, setSpecialty] = useState('Médecine Générale');
  const [licenseNb, setLicenseNb] = useState('');

  // Pharmacy specific
  const [pharmacyName, setPharmacyName] = useState('');

  // Local client-side error
  const [clientError, setClientError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setClientError(null);

    // Validation checks
    if (!email.trim() || !password) {
      setClientError('Veuillez renseigner un email et un mot de passe.');
      return;
    }

    if (!email.includes('@') || !email.includes('.')) {
      setClientError('Veuillez entrer une adresse email valide.');
      return;
    }

    if (password.length < 6) {
      setClientError('Le mot de passe doit comporter au moins 6 caractères.');
      return;
    }

    if (password !== passwordConfirm) {
      setClientError('Les mots de passe ne correspondent pas.');
      return;
    }

    // Role-specific validation
    if (role === 'PATIENT') {
      if (!firstName.trim() || !lastName.trim()) {
        setClientError('Veuillez renseigner votre prénom et votre nom.');
        return;
      }
    } else if (role === 'DOCTOR') {
      if (!firstName.trim() || !lastName.trim()) {
        setClientError('Veuillez renseigner votre prénom et votre nom de praticien.');
        return;
      }
      if (!licenseNb.trim()) {
        setClientError('Veuillez renseigner votre numéro d’autorisation RPPS ou ADELI.');
        return;
      }
    } else if (role === 'PHARMACY') {
      if (!pharmacyName.trim()) {
        setClientError('Veuillez renseigner la dénomination de votre officine.');
        return;
      }
      if (!address.trim()) {
        setClientError('Veuillez indiquer l’adresse physique de l’officine.');
        return;
      }
    }

    // Prepare payload matching backend contract
    const payload: Record<string, any> = {
      email: email.trim().toLowerCase(),
      password,
      role,
      phone: phone.trim() || undefined,
      address: address.trim() || undefined,
    };

    if (role === 'PATIENT') {
      payload.firstName = firstName.trim();
      payload.lastName = lastName.trim();
      payload.birthDate = birthDate || undefined;
    } else if (role === 'DOCTOR') {
      payload.firstName = firstName.trim();
      payload.lastName = lastName.trim();
      payload.specialty = specialty;
      payload.licenseNb = licenseNb.trim();
    } else if (role === 'PHARMACY') {
      payload.name = pharmacyName.trim();
    }

    await onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Alert Messages */}
      <AnimatePresence>
        {(clientError || serverError) && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 flex items-center gap-2.5 font-medium"
          >
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{clientError || serverError}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Role Notice */}
      {role === 'DOCTOR' && (
        <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span>
            <strong>Vérification praticien :</strong> Vos coordonnées professionnelles et votre numéro RPPS seront validés auprès de l'Ordre National des Médecins.
          </span>
        </div>
      )}

      {role === 'PHARMACY' && (
        <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-2xl text-xs text-blue-800 flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <span>
            <strong>Vérification officine :</strong> L'accès aux ordonnances sécurisées requiert l'agrément de votre établissement pharmaceutique.
          </span>
        </div>
      )}

      {/* Profile specific form fields */}
      {role === 'PATIENT' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Prénom *</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Anis"
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2585D8] focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Nom *</label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Brahimi"
                className="w-full px-4 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2585D8] focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Date de naissance</label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2585D8] focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Téléphone</label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="05 55 88 12 34"
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2585D8] focus:bg-white"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Adresse postale</label>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="14 Rue Didouche Mourad, Alger Centre"
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2585D8] focus:bg-white"
              />
            </div>
          </div>
        </div>
      )}

      {role === 'DOCTOR' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Prénom *</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Dr. Amine"
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#20B8A5] focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Nom *</label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Benali"
                className="w-full px-4 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#20B8A5] focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Spécialité *</label>
              <div className="relative">
                <Stethoscope className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#20B8A5] focus:bg-white"
                >
                  {MEDICAL_SPECIALTIES.map((spec) => (
                    <option key={spec} value={spec}>{spec}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">N° RPPS / Licence *</label>
              <div className="relative">
                <Award className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  required
                  value={licenseNb}
                  onChange={(e) => setLicenseNb(e.target.value)}
                  placeholder="ORD-ALGER-16042"
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#20B8A5] focus:bg-white"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Téléphone professionnel</label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="05 50 12 34 56"
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#20B8A5] focus:bg-white"
              />
            </div>
          </div>
        </div>
      )}

      {role === 'PHARMACY' && (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Nom de la pharmacie *</label>
            <div className="relative">
              <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                required
                value={pharmacyName}
                onChange={(e) => setPharmacyName(e.target.value)}
                placeholder="Pharmacie Centrale El Chiffa"
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#123B65] focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Téléphone officine</label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="021 73 45 67"
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#123B65] focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Adresse de l'officine *</label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="18 Boulevard Colonel Amirouche, Alger Centre"
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#123B65] focus:bg-white"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Account Credentials (Email + Password) */}
      <div className="pt-2 border-t border-gray-100 space-y-4">
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Adresse Email *</label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="contact@exemple.com"
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2585D8] focus:bg-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Mot de passe *</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 6 caractères"
                className="w-full pl-10 pr-10 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2585D8] focus:bg-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Confirmer mot de passe *</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                placeholder="Répétez le mot de passe"
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2585D8] focus:bg-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="pt-2">
        <motion.button
          whileHover={{ scale: 1.008 }}
          whileTap={{ scale: 0.99 }}
          type="submit"
          disabled={isLoading}
          className="w-full py-3 px-6 bg-gradient-to-r from-[#123B65] via-[#2585D8] to-[#20B8A5] text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Création du compte en cours...</span>
            </>
          ) : (
            <>
              <span>Valider l'inscription</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </motion.button>
      </div>
    </form>
  );
};

export default ProfileRegistrationForm;
