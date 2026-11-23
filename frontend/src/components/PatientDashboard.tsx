import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  Clock, 
  FileText, 
  CalendarCheck, 
  MapPin, 
  Plus, 
  CheckCircle2, 
  X, 
  AlertCircle, 
  ArrowLeft,
  Calendar,
  ShoppingBag,
  Heart,
  Search,
  UserCheck,
  Phone,
  Stethoscope,
  LogOut,
  Save,
  Loader2,
  FolderHeart,
  FileImage,
  UploadCloud,
  Eye,
  Download,
  Trash2
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { apiService } from '../api/client';
import { useAuthStore } from '../store/authStore';

export default function PatientDashboard() {
  const navigate = useNavigate();
  const { user, logout, updateProfile } = useAuthStore();

  const [activeTab, setActiveTab] = useState<'summary' | 'appointments' | 'doctors' | 'prescriptions' | 'records' | 'imaging' | 'profile'>('summary');
  const [appointments, setAppointments] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [consultations, setConsultations] = useState<any[]>([]);
  const [imagings, setImagings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Imaging Form & Modal States
  const [isImagingModalOpen, setIsImagingModalOpen] = useState(false);
  const [selectedImagingPreview, setSelectedImagingPreview] = useState<any | null>(null);
  const [imagingFilter, setImagingFilter] = useState<'ALL' | 'XRAY' | 'CT_SCAN' | 'MRI' | 'ULTRASOUND' | 'OTHER'>('ALL');

  const [imagingTitle, setImagingTitle] = useState('');
  const [imagingType, setImagingType] = useState('XRAY');
  const [imagingDate, setImagingDate] = useState(new Date().toISOString().split('T')[0]);
  const [imagingBodyPart, setImagingBodyPart] = useState('');
  const [imagingFacility, setImagingFacility] = useState('');
  const [imagingNotes, setImagingNotes] = useState('');
  const [imagingFileUrl, setImagingFileUrl] = useState('');
  const [imagingFileName, setImagingFileName] = useState('');
  const [imagingFileType, setImagingFileType] = useState('');
  const [submittingImaging, setSubmittingImaging] = useState(false);

  // Search doctors
  const [doctorSearch, setDoctorSearch] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('');

  // Modal State for New Appointment
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('10:30');
  const [submitting, setSubmitting] = useState(false);

  // Profile Edit Form State
  const [editFirstName, setEditFirstName] = useState(user?.patientInfo?.firstName || '');
  const [editLastName, setEditLastName] = useState(user?.patientInfo?.lastName || '');
  const [editPhone, setEditPhone] = useState(user?.patientInfo?.phone || '');
  const [editAddress, setEditAddress] = useState(user?.patientInfo?.address || '');
  const [editBirthDate, setEditBirthDate] = useState(user?.patientInfo?.birthDate ? user.patientInfo.birthDate.split('T')[0] : '');
  const [savingProfile, setSavingProfile] = useState(false);

  // Toast State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [apptsData, prescsData, docsData, consultsData, imagingsData] = await Promise.all([
        apiService.getAppointments(),
        apiService.getPrescriptions(),
        apiService.getDoctors(),
        apiService.getConsultations().catch(() => []),
        apiService.getImagings().catch(() => []),
      ]);
      setAppointments(apptsData);
      setPrescriptions(prescsData);
      setDoctors(docsData);
      setConsultations(consultsData);
      setImagings(imagingsData || []);
      if (docsData.length > 0 && !selectedDoctorId) {
        setSelectedDoctorId(docsData[0].id);
      }
    } catch (error) {
      console.error('Erreur chargement données patient:', error);
      showToast('Erreur lors du chargement des données', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      showToast('Le fichier ne doit pas dépasser 25 Mo', 'error');
      return;
    }

    setImagingFileName(file.name);
    setImagingFileType(file.type);

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setImagingFileUrl(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCreateImaging = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imagingTitle.trim() || !imagingFileUrl) {
      showToast('Veuillez renseigner le titre et sélectionner le fichier de la radio/scanner', 'error');
      return;
    }

    try {
      setSubmittingImaging(true);
      await apiService.createImaging({
        title: imagingTitle.trim(),
        type: imagingType,
        date: imagingDate,
        bodyPart: imagingBodyPart.trim() || undefined,
        facility: imagingFacility.trim() || undefined,
        notes: imagingNotes.trim() || undefined,
        fileUrl: imagingFileUrl,
        fileName: imagingFileName || undefined,
        fileType: imagingFileType || undefined,
      });

      showToast("Examen d'imagerie enregistré avec succès !", 'success');
      setIsImagingModalOpen(false);
      setImagingTitle('');
      setImagingBodyPart('');
      setImagingFacility('');
      setImagingNotes('');
      setImagingFileUrl('');
      setImagingFileName('');
      setImagingFileType('');
      const updated = await apiService.getImagings();
      setImagings(updated);
    } catch (error) {
      console.error(error);
      showToast("Erreur lors de l'enregistrement de l'examen", 'error');
    } finally {
      setSubmittingImaging(false);
    }
  };

  const handleDeleteImaging = async (id: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet examen d'imagerie ?")) return;
    try {
      await apiService.deleteImaging(id);
      showToast('Examen supprimé avec succès', 'info');
      setImagings((prev) => prev.filter((img) => img.id !== id));
      if (selectedImagingPreview?.id === id) {
        setSelectedImagingPreview(null);
      }
    } catch (error) {
      console.error(error);
      showToast("Erreur lors de la suppression", 'error');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (user?.patientInfo) {
      setEditFirstName(user.patientInfo.firstName || '');
      setEditLastName(user.patientInfo.lastName || '');
      setEditPhone(user.patientInfo.phone || '');
      setEditAddress(user.patientInfo.address || '');
      if (user.patientInfo.birthDate) {
        setEditBirthDate(user.patientInfo.birthDate.split('T')[0]);
      }
    }
  }, [user]);

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctorId || !appointmentDate) {
      showToast('Veuillez sélectionner un médecin et une date', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const fullDate = `${appointmentDate}T${appointmentTime}:00`;
      await apiService.createAppointment({
        doctorId: selectedDoctorId,
        date: fullDate,
        status: 'CONFIRMED',
      });
      showToast('Rendez-vous réservé avec succès !', 'success');
      setIsModalOpen(false);
      setAppointmentDate('');
      await loadData();
    } catch (error) {
      console.error(error);
      showToast('Erreur lors de la prise de rendez-vous', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelAppointment = async (id: string) => {
    try {
      await apiService.deleteAppointment(id);
      showToast('Rendez-vous annulé.', 'info');
      await loadData();
    } catch (error) {
      console.error(error);
      showToast("Erreur lors de l'annulation", 'error');
    }
  };

  const handleOrderPrescription = async (presc: any) => {
    try {
      await apiService.createOrder({
        items: presc.items.map((i: any) => ({
          medicationName: i.medicationName,
          quantity: 1,
        })),
        totalPrice: 14.80,
      });
      showToast('Ordonnance transmise à la Pharmacie Centrale !', 'success');
    } catch (error) {
      console.error(error);
      showToast('Erreur lors de la commande', 'error');
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      await updateProfile({
        firstName: editFirstName,
        lastName: editLastName,
        phone: editPhone,
        address: editAddress,
        birthDate: editBirthDate || undefined,
      });
      showToast('Profil mis à jour avec succès !', 'success');
    } catch (err: any) {
      showToast(err.message || 'Erreur lors de la mise à jour', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const nextAppointment = appointments.find((a) => new Date(a.date) > new Date()) || appointments[0];

  const filteredDoctors = doctors.filter((doc) => {
    const fullName = `${doc.firstName} ${doc.lastName} ${doc.specialty}`.toLowerCase();
    const matchesSearch = fullName.includes(doctorSearch.toLowerCase());
    const matchesSpec = specialtyFilter ? doc.specialty.toLowerCase().includes(specialtyFilter.toLowerCase()) : true;
    return matchesSearch && matchesSpec;
  });

  const patientName = user?.patientInfo 
    ? `${user.patientInfo.firstName} ${user.patientInfo.lastName}` 
    : user?.email || 'Patient';

  return (
    <div className="flex h-screen bg-[#F5F8FC] overflow-hidden font-sans text-gray-800">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl text-white font-medium ${
              toast.type === 'success' ? 'bg-emerald-600 shadow-emerald-500/20' : 
              toast.type === 'error' ? 'bg-red-600 shadow-red-500/20' : 'bg-[#2585D8] shadow-blue-500/20'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside 
        initial={{ x: -250 }}
        animate={{ x: 0 }}
        className="w-72 bg-white border-r border-gray-100 flex flex-col justify-between py-6 px-5 shadow-sm z-20"
      >
        <div className="w-full flex flex-col items-center">
          {/* Back & Logo */}
          <div className="w-full flex justify-between items-center mb-6">
            <Link to="/" className="inline-flex items-center text-xs font-bold text-gray-500 hover:text-[#2585D8] transition-colors">
              <ArrowLeft className="w-4 h-4 mr-1" /> Accueil
            </Link>
            <span className="text-[10px] font-extrabold px-2.5 py-0.5 bg-blue-50 text-[#2585D8] rounded-full uppercase">
              Patient
            </span>
          </div>

          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-[#123B65] to-[#2585D8] flex items-center justify-center text-white text-2xl font-black shadow-md shadow-blue-500/20">
            {user?.patientInfo?.firstName?.[0] || 'P'}{user?.patientInfo?.lastName?.[0] || ''}
          </div>
          
          <h2 className="mt-3 text-lg font-extrabold text-[#123B65] text-center truncate max-w-full">
            {patientName}
          </h2>
          <p className="text-xs text-gray-500 flex items-center mt-0.5 truncate max-w-full">
            <MapPin className="w-3.5 h-3.5 mr-1 text-gray-400 shrink-0" />
            {user?.patientInfo?.address || 'France'}
          </p>
          <span className="mt-1 text-[11px] font-mono font-medium text-gray-400">
            {user?.email}
          </span>

          {/* Navigation Links */}
          <nav className="w-full mt-6 space-y-1.5">
            <button
              onClick={() => setActiveTab('summary')}
              className={`w-full flex items-center px-4 py-2.5 rounded-2xl transition-all cursor-pointer ${
                activeTab === 'summary' 
                  ? 'bg-[#2585D8] text-white font-bold shadow-md shadow-blue-500/20' 
                  : 'hover:bg-gray-100 text-gray-600 font-medium'
              }`}
            >
              <Activity className="w-4 h-4 mr-3" />
              <span className="text-xs font-bold">Mon Tableau de Bord</span>
            </button>

            <button
              onClick={() => setActiveTab('appointments')}
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-2xl transition-all cursor-pointer ${
                activeTab === 'appointments' 
                  ? 'bg-[#2585D8] text-white font-bold shadow-md shadow-blue-500/20' 
                  : 'hover:bg-gray-100 text-gray-600 font-medium'
              }`}
            >
              <div className="flex items-center">
                <CalendarCheck className="w-4 h-4 mr-3" />
                <span className="text-xs font-bold">Rendez-vous</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                activeTab === 'appointments' ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-700'
              }`}>
                {appointments.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('doctors')}
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-2xl transition-all cursor-pointer ${
                activeTab === 'doctors' 
                  ? 'bg-[#2585D8] text-white font-bold shadow-md shadow-blue-500/20' 
                  : 'hover:bg-gray-100 text-gray-600 font-medium'
              }`}
            >
              <div className="flex items-center">
                <Stethoscope className="w-4 h-4 mr-3" />
                <span className="text-xs font-bold">Trouver un Médecin</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                activeTab === 'doctors' ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-700'
              }`}>
                {doctors.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('prescriptions')}
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-2xl transition-all cursor-pointer ${
                activeTab === 'prescriptions' 
                  ? 'bg-[#2585D8] text-white font-bold shadow-md shadow-blue-500/20' 
                  : 'hover:bg-gray-100 text-gray-600 font-medium'
              }`}
            >
              <div className="flex items-center">
                <FileText className="w-4 h-4 mr-3" />
                <span className="text-xs font-bold">Ordonnances</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                activeTab === 'prescriptions' ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-700'
              }`}>
                {prescriptions.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('records')}
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-2xl transition-all cursor-pointer ${
                activeTab === 'records' 
                  ? 'bg-[#2585D8] text-white font-bold shadow-md shadow-blue-500/20' 
                  : 'hover:bg-gray-100 text-gray-600 font-medium'
              }`}
            >
              <div className="flex items-center">
                <FolderHeart className="w-4 h-4 mr-3" />
                <span className="text-xs font-bold">Dossier Médical</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                activeTab === 'records' ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-700'
              }`}>
                {consultations.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('imaging')}
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-2xl transition-all cursor-pointer ${
                activeTab === 'imaging' 
                  ? 'bg-[#2585D8] text-white font-bold shadow-md shadow-blue-500/20' 
                  : 'hover:bg-gray-100 text-gray-600 font-medium'
              }`}
            >
              <div className="flex items-center">
                <FileImage className="w-4 h-4 mr-3" />
                <span className="text-xs font-bold">Radios & Scanners</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                activeTab === 'imaging' ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-700'
              }`}>
                {imagings.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center px-4 py-2.5 rounded-2xl transition-all cursor-pointer ${
                activeTab === 'profile' 
                  ? 'bg-[#2585D8] text-white font-bold shadow-md shadow-blue-500/20' 
                  : 'hover:bg-gray-100 text-gray-600 font-medium'
              }`}
            >
              <UserCheck className="w-4 h-4 mr-3" />
              <span className="text-xs font-bold">Mon Profil & Santé</span>
            </button>
          </nav>
        </div>

        {/* Footer with logout */}
        <div className="w-full space-y-3">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" /> Déconnexion
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-gradient-to-br from-[#F5F8FC] via-white to-[#F5F8FC]">
        
        {/* Header */}
        <header className="h-20 px-8 flex items-center justify-between border-b border-gray-100 bg-white/70 backdrop-blur-md">
          <div>
            <h1 className="text-2xl font-black text-[#123B65]">
              {activeTab === 'summary' && 'Mon Dossier Santé'}
              {activeTab === 'appointments' && 'Mes Rendez-vous'}
              {activeTab === 'doctors' && 'Praticiens & Disponibilités'}
              {activeTab === 'prescriptions' && 'Mes Ordonnances'}
              {activeTab === 'records' && 'Historique Clinique & Consultations'}
              {activeTab === 'profile' && 'Informations Personnelles'}
            </h1>
            <p className="text-gray-500 text-xs font-medium">
              Plateforme Médicale MEDTEC &bull; Connecté en tant que patient
            </p>
          </div>
          
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center bg-[#2585D8] hover:bg-[#1d6fb8] text-white px-5 py-2.5 rounded-full text-xs font-bold shadow-md shadow-blue-500/25 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Prendre un Rendez-vous
          </button>
        </header>

        {/* Dynamic Views */}
        <div className="flex-1 overflow-y-auto p-8">
          
          {loading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-[#2585D8] animate-spin" />
            </div>
          )}

          {/* TAB 1: SUMMARY */}
          {!loading && activeTab === 'summary' && (
            <div className="space-y-6 max-w-5xl">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Prochain RDV Card */}
                {nextAppointment ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 15 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    className="p-6 bg-gradient-to-br from-[#123B65] to-[#2585D8] text-white rounded-3xl shadow-xl shadow-blue-500/10 relative overflow-hidden flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-blue-200 uppercase tracking-widest text-[10px] mb-1">Prochain Rendez-vous</p>
                          <h2 className="text-2xl font-black mb-0.5">
                            {new Date(nextAppointment.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                          </h2>
                          <p className="text-lg text-blue-100 font-semibold">
                            à {new Date(nextAppointment.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-wider">
                          {nextAppointment.status}
                        </span>
                      </div>
                      
                      <div className="mt-6 bg-white/10 rounded-2xl p-4 backdrop-blur-md border border-white/10">
                        <p className="font-bold text-base">
                          Dr. {nextAppointment.doctor?.firstName} {nextAppointment.doctor?.lastName}
                        </p>
                        <p className="text-xs text-blue-200 mt-0.5 flex items-center">
                          <Stethoscope className="w-3.5 h-3.5 mr-1 text-blue-300" />
                          Spécialité : {nextAppointment.doctor?.specialty || 'Médecin'}
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 flex gap-3">
                      <button 
                        onClick={() => setActiveTab('appointments')}
                        className="px-4 py-2 bg-white text-[#123B65] font-bold rounded-xl text-xs hover:bg-blue-50 transition-colors"
                      >
                        Gérer mes rendez-vous
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <div className="p-8 bg-white rounded-3xl border border-gray-100 flex flex-col items-center justify-center text-center shadow-sm">
                    <Calendar className="w-12 h-12 text-gray-300 mb-3" />
                    <p className="font-bold text-gray-700">Aucun rendez-vous à venir</p>
                    <button 
                      onClick={() => setIsModalOpen(true)}
                      className="mt-3 text-[#2585D8] font-bold text-xs hover:underline"
                    >
                      Prendre un rendez-vous maintenant
                    </button>
                  </div>
                )}

                {/* Ordonnances Actives */}
                <motion.div 
                  initial={{ opacity: 0, y: 15 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ delay: 0.05 }} 
                  className="p-6 bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-lg text-gray-900">Dernières Prescriptions</h3>
                        <p className="text-xs text-gray-400">Délivrées par vos praticiens</p>
                      </div>
                      <FileText className="text-[#2585D8] w-5 h-5" />
                    </div>

                    <div className="space-y-2.5">
                      {prescriptions.flatMap((p) => p.items).slice(0, 3).map((item: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 border border-gray-100">
                          <div className="flex items-center">
                            <span className="text-lg mr-2.5">💊</span>
                            <div>
                              <h4 className="font-bold text-gray-900 text-xs">{item.medicationName}</h4>
                              <p className="text-[11px] text-gray-500">{item.dosage} &bull; {item.duration}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                      {prescriptions.length === 0 && (
                        <p className="text-xs text-gray-400 py-4 text-center">Aucune ordonnance active</p>
                      )}
                    </div>
                  </div>

                  <button 
                    onClick={() => setActiveTab('prescriptions')}
                    className="w-full mt-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition-colors"
                  >
                    Voir toutes les ordonnances ({prescriptions.length})
                  </button>
                </motion.div>
              </div>

              {/* Quick Health Status Card */}
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-red-50 text-red-500 rounded-2xl">
                    <Heart className="w-6 h-6 fill-red-500" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-gray-900">Suivi Clinique & Antécédents</h4>
                    <p className="text-xs text-gray-500 mt-0.5">Dossier médical numérique sécurisé avec historique des consultations</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('records')}
                  className="px-4 py-2 bg-blue-50 text-[#2585D8] rounded-xl text-xs font-bold hover:bg-blue-100 transition-colors"
                >
                  Consulter mon historique
                </button>
              </div>

              {/* Quick Imaging Card */}
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl shrink-0">
                    <FileImage className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-gray-900">Radiographies, Scanners & Imagerie ({imagings.length})</h4>
                    <p className="text-xs text-gray-500 mt-0.5">Consultez et ajoutez vos radios, scanners TDM, IRM et comptes-rendus</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    onClick={() => {
                      setActiveTab('imaging');
                      setIsImagingModalOpen(true);
                    }}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm shadow-indigo-500/20 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Ajouter un scan
                  </button>
                  <button
                    onClick={() => setActiveTab('imaging')}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-200 transition-colors cursor-pointer"
                  >
                    Voir tout
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: APPOINTMENTS */}
          {!loading && activeTab === 'appointments' && (
            <div className="max-w-5xl space-y-4">
              <div className="flex justify-between items-center mb-2">
                <p className="text-xs text-gray-500 font-medium">
                  {appointments.length} consultation{appointments.length > 1 ? 's' : ''} enregistrée{appointments.length > 1 ? 's' : ''}
                </p>
              </div>

              {appointments.length === 0 ? (
                <div className="p-12 bg-white rounded-3xl text-center border border-gray-100 shadow-sm">
                  <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-gray-800">Aucun rendez-vous planifié</h3>
                  <button 
                    onClick={() => setIsModalOpen(true)}
                    className="mt-3 px-5 py-2.5 bg-[#2585D8] text-white rounded-full font-bold text-xs shadow-md"
                  >
                    Prendre un rendez-vous
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {appointments.map((appt) => (
                    <div
                      key={appt.id}
                      className="p-5 bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex justify-between items-start mb-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            appt.status === 'CONFIRMED' ? 'bg-emerald-50 text-emerald-600' :
                            appt.status === 'PENDING' ? 'bg-amber-50 text-amber-600' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {appt.status}
                          </span>
                          <span className="text-xs text-gray-400 font-mono">
                            {new Date(appt.date).toLocaleDateString('fr-FR')}
                          </span>
                        </div>

                        <h3 className="text-base font-bold text-gray-900">
                          Dr. {appt.doctor?.firstName} {appt.doctor?.lastName}
                        </h3>
                        <p className="text-xs font-semibold text-[#2585D8]">
                          {appt.doctor?.specialty}
                        </p>
                        <p className="text-xs text-gray-500 mt-2 flex items-center">
                          <Clock className="w-3.5 h-3.5 mr-1 text-gray-400" />
                          {new Date(appt.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
                        <span className="text-[11px] text-gray-400">Cabinet Médical</span>
                        <button
                          onClick={() => handleCancelAppointment(appt.id)}
                          className="text-xs font-bold text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1 rounded-lg transition-colors cursor-pointer"
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: FIND DOCTORS */}
          {!loading && activeTab === 'doctors' && (
            <div className="max-w-5xl space-y-6">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={doctorSearch}
                    onChange={(e) => setDoctorSearch(e.target.value)}
                    placeholder="Rechercher par nom de médecin..."
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-2xl text-xs font-medium outline-none focus:ring-2 focus:ring-[#2585D8]"
                  />
                </div>
                <select
                  value={specialtyFilter}
                  onChange={(e) => setSpecialtyFilter(e.target.value)}
                  className="px-4 py-2.5 bg-white border border-gray-200 rounded-2xl text-xs font-bold outline-none"
                >
                  <option value="">Toutes les spécialités</option>
                  <option value="Cardiologie">Cardiologie</option>
                  <option value="Générale">Médecine Générale</option>
                  <option value="Pédiatrie">Pédiatrie</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredDoctors.map((doc) => (
                  <div key={doc.id} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm mb-3">
                        <Stethoscope className="w-6 h-6" />
                      </div>
                      <h4 className="font-bold text-sm text-gray-900">Dr. {doc.firstName} {doc.lastName}</h4>
                      <p className="text-xs font-semibold text-emerald-600 mt-0.5">{doc.specialty}</p>
                      <p className="text-[11px] text-gray-400 font-mono mt-1">RPPS: {doc.licenseNb}</p>
                      {doc.phone && (
                        <p className="text-xs text-gray-500 mt-2 flex items-center">
                          <Phone className="w-3 h-3 mr-1" /> {doc.phone}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        setSelectedDoctorId(doc.id);
                        setIsModalOpen(true);
                      }}
                      className="w-full mt-4 py-2 bg-[#2585D8] hover:bg-[#1d6fb8] text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
                    >
                      Prendre rendez-vous
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: PRESCRIPTIONS */}
          {!loading && activeTab === 'prescriptions' && (
            <div className="max-w-5xl space-y-4">
              {prescriptions.map((presc) => (
                <div
                  key={presc.id}
                  className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-gray-100 gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 bg-blue-50 text-[#2585D8] text-[10px] font-bold rounded-full">
                          Ordonnance Numérique
                        </span>
                        <span className="text-xs text-gray-400">
                          Émise le {new Date(presc.createdAt).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-gray-900 mt-1">
                        Prescrit par le Dr. {presc.doctor?.lastName || 'Médecin'} ({presc.doctor?.specialty || 'Généraliste'})
                      </h3>
                      {presc.notes && (
                        <p className="text-xs text-gray-500 mt-1 italic">« {presc.notes} »</p>
                      )}
                    </div>

                    <button
                      onClick={() => handleOrderPrescription(presc)}
                      className="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
                    >
                      <ShoppingBag className="w-3.5 h-3.5 mr-1.5" />
                      Commander en pharmacie
                    </button>
                  </div>

                  <div className="mt-4 space-y-2">
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      Médicaments prescrits
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {presc.items?.map((item: any) => (
                        <div key={item.id} className="p-3 rounded-2xl bg-gray-50 border border-gray-100 flex items-start gap-2.5">
                          <span className="text-lg">💊</span>
                          <div>
                            <p className="font-bold text-gray-900 text-xs">{item.medicationName}</p>
                            <p className="text-[11px] text-gray-600">{item.dosage}</p>
                            <span className="inline-block mt-1 text-[10px] font-bold bg-white px-2 py-0.5 rounded border border-gray-200 text-gray-500">
                              Durée: {item.duration}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
              {prescriptions.length === 0 && (
                <div className="p-12 bg-white rounded-3xl text-center border border-gray-100">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm font-bold text-gray-700">Aucune ordonnance disponible</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: MEDICAL RECORDS (CONSULTATIONS) */}
          {!loading && activeTab === 'records' && (
            <div className="max-w-5xl space-y-4">
              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                <h3 className="font-bold text-base text-gray-900 mb-1">Historique des Consultations Médicales</h3>
                <p className="text-xs text-gray-500 mb-4">Diagnostics et comptes-rendus rédigés par vos praticiens</p>

                {consultations.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-8">Aucun compte-rendu de consultation pour le moment.</p>
                ) : (
                  <div className="space-y-3">
                    {consultations.map((c) => (
                      <div key={c.id} className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs font-bold text-[#2585D8]">
                            Dr. {c.doctor?.firstName} {c.doctor?.lastName} ({c.doctor?.specialty})
                          </span>
                          <span className="text-[11px] text-gray-400">
                            {new Date(c.date).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-gray-900">Diagnostic : {c.diagnosis}</p>
                        {c.notes && <p className="text-xs text-gray-600 mt-1 italic">Notes : {c.notes}</p>}
                        {c.vitalSigns && <p className="text-[11px] text-gray-500 mt-1">Signes vitaux : {c.vitalSigns}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: IMAGING (RADIOS & SCANNERS) */}
          {!loading && activeTab === 'imaging' && (
            <div className="max-w-5xl space-y-6">
              {/* Header Banner */}
              <div className="bg-gradient-to-r from-[#123B65] via-[#1a4f85] to-[#2585D8] rounded-3xl p-6 text-white shadow-lg shadow-blue-900/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-wider text-blue-100">
                      Imagerie Médicale
                    </span>
                    <span className="text-xs text-blue-200">
                      {imagings.length} document{imagings.length > 1 ? 's' : ''} enregistré{imagings.length > 1 ? 's' : ''}
                    </span>
                  </div>
                  <h3 className="text-xl font-black">Radiographies, Scanners & IRM</h3>
                  <p className="text-xs text-blue-100 mt-1 max-w-xl">
                    Importez et archivez en toute sécurité vos clichés de radiologie, tomodensitométries (scanner), résonances magnétiques et échographies avec leurs comptes-rendus.
                  </p>
                </div>
                <button
                  onClick={() => setIsImagingModalOpen(true)}
                  className="inline-flex items-center self-start md:self-auto px-5 py-3 bg-white text-[#123B65] hover:bg-blue-50 text-xs font-black rounded-2xl shadow-md transition-all cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4 mr-2 text-[#2585D8]" />
                  Ajouter une radio / scan
                </button>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { id: 'ALL', label: 'Tous les examens', icon: '📁' },
                  { id: 'XRAY', label: 'Radiographies (X-Ray)', icon: '🩻' },
                  { id: 'CT_SCAN', label: 'Scanners (TDM)', icon: '🧬' },
                  { id: 'MRI', label: 'IRM', icon: '🧠' },
                  { id: 'ULTRASOUND', label: 'Échographies', icon: '🩺' },
                  { id: 'OTHER', label: 'Autres', icon: '📄' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setImagingFilter(f.id as any)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      imagingFilter === f.id
                        ? 'bg-[#123B65] text-white shadow-sm'
                        : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-100'
                    }`}
                  >
                    <span>{f.icon}</span>
                    <span>{f.label}</span>
                    {f.id !== 'ALL' && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-1 ${
                        imagingFilter === f.id ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {imagings.filter((i) => i.type === f.id).length}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Grid of Scans */}
              {imagings.filter((img) => imagingFilter === 'ALL' || img.type === imagingFilter).length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm">
                  <div className="w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-500 flex items-center justify-center mx-auto mb-4">
                    <FileImage className="w-8 h-8" />
                  </div>
                  <h4 className="font-bold text-base text-gray-800">Aucun examen d'imagerie trouvé</h4>
                  <p className="text-xs text-gray-500 max-w-md mx-auto mt-1 mb-6">
                    Vous n'avez pas encore téléversé de clichés ou de scanner dans cette catégorie.
                  </p>
                  <button
                    onClick={() => setIsImagingModalOpen(true)}
                    className="inline-flex items-center px-5 py-2.5 bg-[#2585D8] hover:bg-[#1d6fb8] text-white rounded-full text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4 mr-1.5" />
                    Téléverser un premier examen
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {imagings
                    .filter((img) => imagingFilter === 'ALL' || img.type === imagingFilter)
                    .map((item) => {
                      const isPdf = item.fileType?.includes('pdf') || item.fileName?.toLowerCase().endsWith('.pdf');
                      const typeLabel = 
                        item.type === 'XRAY' ? 'Radiographie' :
                        item.type === 'CT_SCAN' ? 'Scanner (TDM)' :
                        item.type === 'MRI' ? 'IRM' :
                        item.type === 'ULTRASOUND' ? 'Échographie' : 'Imagerie';

                      const typeColor = 
                        item.type === 'XRAY' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        item.type === 'CT_SCAN' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                        item.type === 'MRI' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                        item.type === 'ULTRASOUND' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        'bg-gray-50 text-gray-700 border-gray-200';

                      return (
                        <div
                          key={item.id}
                          className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between group"
                        >
                          <div>
                            {/* Visual Preview Header */}
                            <div 
                              onClick={() => setSelectedImagingPreview(item)}
                              className="relative h-44 bg-gray-900 cursor-pointer overflow-hidden flex items-center justify-center group-hover:brightness-95 transition-all"
                            >
                              {!isPdf && item.fileUrl ? (
                                <img
                                  src={item.fileUrl}
                                  alt={item.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                              ) : (
                                <div className="flex flex-col items-center justify-center text-gray-400 p-4">
                                  <FileText className="w-12 h-12 text-blue-400 mb-2" />
                                  <span className="text-xs font-mono font-bold text-gray-300 truncate max-w-[200px]">
                                    {item.fileName || 'Document PDF'}
                                  </span>
                                </div>
                              )}
                              
                              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />
                              
                              {/* Type Badge */}
                              <span className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider backdrop-blur-md border ${typeColor}`}>
                                {typeLabel}
                              </span>

                              {/* Hover Eye Icon */}
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 backdrop-blur-[2px]">
                                <span className="p-3 bg-white/90 text-gray-900 rounded-2xl shadow-lg flex items-center gap-1.5 text-xs font-bold">
                                  <Eye className="w-4 h-4 text-[#2585D8]" />
                                  Agrandir
                                </span>
                              </div>

                              {/* Anatomical Region Badge */}
                              {item.bodyPart && (
                                <span className="absolute bottom-3 left-3 px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-black/60 text-white backdrop-blur-md">
                                  📍 {item.bodyPart}
                                </span>
                              )}
                            </div>

                            {/* Card Content */}
                            <div className="p-5">
                              <div className="flex items-center justify-between text-[11px] text-gray-400 font-medium mb-1.5">
                                <span>📅 {new Date(item.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                {item.facility && <span className="truncate max-w-[140px]">🏥 {item.facility}</span>}
                              </div>

                              <h4 className="font-extrabold text-sm text-gray-900 line-clamp-1 mb-1">
                                {item.title}
                              </h4>

                              {item.notes ? (
                                <p className="text-xs text-gray-500 line-clamp-2 italic bg-gray-50 p-2.5 rounded-xl border border-gray-100 mt-2">
                                  « {item.notes} »
                                </p>
                              ) : (
                                <p className="text-[11px] text-gray-400 mt-2">Aucun compte-rendu textuel joint.</p>
                              )}
                            </div>
                          </div>

                          {/* Action Buttons Footer */}
                          <div className="px-5 pb-5 pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
                            <button
                              onClick={() => setSelectedImagingPreview(item)}
                              className="flex-1 py-2 bg-blue-50 hover:bg-blue-100 text-[#2585D8] rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              Visualiser
                            </button>

                            <a
                              href={item.fileUrl}
                              download={item.fileName || `examen-${item.type}-${item.id}.jpg`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-2 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl transition-colors cursor-pointer"
                              title="Télécharger l'original"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>

                            <button
                              onClick={() => handleDeleteImaging(item.id)}
                              className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-colors cursor-pointer"
                              title="Supprimer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}

          {/* TAB 6: PROFILE */}
          {!loading && activeTab === 'profile' && (
            <div className="max-w-3xl bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-1">Édition du Profil Patient</h3>
              <p className="text-xs text-gray-500 mb-6">Mettez à jour vos coordonnées médicales et de contact</p>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Prénom</label>
                    <input
                      type="text"
                      value={editFirstName}
                      onChange={(e) => setEditFirstName(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-[#2585D8]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Nom</label>
                    <input
                      type="text"
                      value={editLastName}
                      onChange={(e) => setEditLastName(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-[#2585D8]"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Téléphone</label>
                    <input
                      type="tel"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-[#2585D8]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Date de naissance</label>
                    <input
                      type="date"
                      value={editBirthDate}
                      onChange={(e) => setEditBirthDate(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-[#2585D8]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Adresse postale</label>
                  <input
                    type="text"
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-[#2585D8]"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="px-6 py-2.5 bg-[#2585D8] hover:bg-[#1d6fb8] text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm transition-all"
                  >
                    {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Enregistrer les modifications
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>
      </main>

      {/* NEW APPOINTMENT MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden p-6"
            >
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-black text-gray-900">Prendre un Rendez-vous</h3>
                  <p className="text-xs text-gray-500">Choisissez votre praticien et votre créneau</p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateAppointment} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Médecin Praticien
                  </label>
                  <select
                    value={selectedDoctorId}
                    onChange={(e) => setSelectedDoctorId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#2585D8] outline-none"
                    required
                  >
                    {doctors.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        Dr. {doc.firstName} {doc.lastName} - {doc.specialty}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                      Date
                    </label>
                    <input
                      type="date"
                      value={appointmentDate}
                      onChange={(e) => setAppointmentDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#2585D8] outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                      Heure
                    </label>
                    <select
                      value={appointmentTime}
                      onChange={(e) => setAppointmentTime(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#2585D8] outline-none"
                    >
                      <option value="09:00">09:00</option>
                      <option value="09:30">09:30</option>
                      <option value="10:00">10:00</option>
                      <option value="10:30">10:30</option>
                      <option value="11:15">11:15</option>
                      <option value="14:00">14:00</option>
                      <option value="15:30">15:30</option>
                      <option value="16:45">16:45</option>
                    </select>
                  </div>
                </div>

                <div className="pt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 bg-[#2585D8] hover:bg-[#1d6fb8] text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                  >
                    {submitting ? 'Validation...' : 'Confirmer le Rendez-vous'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* NEW IMAGING (RADIO / SCANNER) MODAL */}
      <AnimatePresence>
        {isImagingModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden p-6 my-8"
            >
              <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-100">
                <div>
                  <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                    <FileImage className="w-5 h-5 text-indigo-600" />
                    Ajouter une Radio ou un Scanner
                  </h3>
                  <p className="text-xs text-gray-500">Archivez vos clichés d'imagerie et comptes-rendus</p>
                </div>
                <button
                  onClick={() => setIsImagingModalOpen(false)}
                  className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateImaging} className="space-y-4">
                {/* File Upload Zone */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Cliché ou document d'imagerie (Image ou PDF) *
                  </label>
                  
                  {!imagingFileUrl ? (
                    <label className="border-2 border-dashed border-gray-300 hover:border-indigo-500 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer bg-gray-50 hover:bg-indigo-50/30 transition-all group">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                        <UploadCloud className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-bold text-gray-800">Cliquez pour sélectionner votre fichier</span>
                      <span className="text-[11px] text-gray-400 mt-0.5">Formats acceptés : JPG, PNG, WEBP, PDF (max 25 Mo)</span>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={handleFileChange}
                        className="hidden"
                        required
                      />
                    </label>
                  ) : (
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-3 overflow-hidden">
                        {imagingFileType?.includes('pdf') ? (
                          <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                            <FileText className="w-6 h-6" />
                          </div>
                        ) : (
                          <img
                            src={imagingFileUrl}
                            alt="Aperçu"
                            className="w-12 h-12 rounded-xl object-cover border border-gray-200 shrink-0"
                          />
                        )}
                        <div className="overflow-hidden">
                          <p className="text-xs font-bold text-gray-900 truncate">{imagingFileName || 'Fichier sélectionné'}</p>
                          <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Fichier prêt pour l'envoi
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setImagingFileUrl('');
                          setImagingFileName('');
                          setImagingFileType('');
                        }}
                        className="p-1.5 hover:bg-gray-200 text-gray-500 rounded-lg transition-colors cursor-pointer"
                        title="Changer de fichier"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Title & Type */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                      Titre de l'examen *
                    </label>
                    <input
                      type="text"
                      placeholder="ex: Radio Thoracique Face"
                      value={imagingTitle}
                      onChange={(e) => setImagingTitle(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                      Type d'examen *
                    </label>
                    <select
                      value={imagingType}
                      onChange={(e) => setImagingType(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value="XRAY">🩻 Radiographie standard (X-Ray)</option>
                      <option value="CT_SCAN">🧬 Scanner / Tomodensitométrie (TDM)</option>
                      <option value="MRI">🧠 IRM (Résonance Magnétique)</option>
                      <option value="ULTRASOUND">🩺 Échographie</option>
                      <option value="OTHER">📄 Autre imagerie</option>
                    </select>
                  </div>
                </div>

                {/* Date & Anatomical Region */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                      Date de l'examen *
                    </label>
                    <input
                      type="date"
                      value={imagingDate}
                      onChange={(e) => setImagingDate(e.target.value)}
                      max={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                      Région anatomique
                    </label>
                    <input
                      type="text"
                      placeholder="ex: Thorax, Crâne, Rachis lombaire"
                      value={imagingBodyPart}
                      onChange={(e) => setImagingBodyPart(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>

                {/* Facility / Clinic */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Centre d'imagerie / Hôpital
                  </label>
                  <input
                    type="text"
                    placeholder="ex: Centre d'Imagerie Médicale Alger / Clinique El Chifa"
                    value={imagingFacility}
                    onChange={(e) => setImagingFacility(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                {/* Notes / Conclusion */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Compte-rendu ou conclusion médicale
                  </label>
                  <textarea
                    rows={2}
                    placeholder="ex: Cliché normal, absence de lésion pleuro-parenchymateuse évolutive..."
                    value={imagingNotes}
                    onChange={(e) => setImagingNotes(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                {/* Actions */}
                <div className="pt-3 flex justify-end gap-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsImagingModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={submittingImaging}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    {submittingImaging ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Enregistrement...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Enregistrer l'examen
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* RADIOLOGY LIGHTBOX / FULLSCREEN PREVIEW MODAL */}
      <AnimatePresence>
        {selectedImagingPreview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/90 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-gray-950 text-white w-full max-w-5xl max-h-[92vh] rounded-3xl shadow-2xl border border-gray-800 flex flex-col overflow-hidden"
            >
              {/* PACS Top Bar */}
              <div className="px-6 py-4 bg-gray-900 border-b border-gray-800 flex items-center justify-between gap-4 shrink-0">
                <div className="flex items-center gap-3 overflow-hidden">
                  <span className="p-2 bg-indigo-950 text-indigo-400 rounded-xl border border-indigo-800/50">
                    <FileImage className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="font-black text-sm text-gray-100 truncate">
                      {selectedImagingPreview.title}
                    </h3>
                    <p className="text-[11px] text-gray-400 flex items-center gap-2">
                      <span>Examen du {new Date(selectedImagingPreview.date).toLocaleDateString('fr-FR')}</span>
                      {selectedImagingPreview.bodyPart && <span>&bull; Région: {selectedImagingPreview.bodyPart}</span>}
                      {selectedImagingPreview.facility && <span>&bull; {selectedImagingPreview.facility}</span>}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={selectedImagingPreview.fileUrl}
                    download={selectedImagingPreview.fileName || `examen-${selectedImagingPreview.id}.jpg`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Télécharger
                  </a>

                  <button
                    onClick={() => setSelectedImagingPreview(null)}
                    className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-xl transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Lightbox Main Content View */}
              <div className="flex-1 overflow-y-auto p-6 flex flex-col lg:flex-row gap-6 items-center lg:items-start justify-center">
                {/* Cliché / Image Viewer */}
                <div className="flex-1 flex items-center justify-center bg-black/60 rounded-2xl border border-gray-800/60 p-4 min-h-[380px] w-full overflow-hidden">
                  {selectedImagingPreview.fileType?.includes('pdf') || selectedImagingPreview.fileName?.toLowerCase().endsWith('.pdf') ? (
                    <div className="text-center p-8 space-y-4">
                      <FileText className="w-20 h-20 text-red-400 mx-auto" />
                      <p className="text-sm font-bold text-gray-200">{selectedImagingPreview.fileName || 'Document PDF médical'}</p>
                      <a
                        href={selectedImagingPreview.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2585D8] hover:bg-[#1d6fb8] text-white rounded-xl text-xs font-bold shadow-lg"
                      >
                        Ouvrir le document PDF
                      </a>
                    </div>
                  ) : (
                    <img
                      src={selectedImagingPreview.fileUrl}
                      alt={selectedImagingPreview.title}
                      className="max-h-[65vh] w-auto max-w-full object-contain rounded-lg shadow-2xl"
                    />
                  )}
                </div>

                {/* Details & Report Sidebar */}
                <div className="w-full lg:w-80 shrink-0 space-y-4 text-xs">
                  <div className="p-4 bg-gray-900 rounded-2xl border border-gray-800 space-y-2.5">
                    <h4 className="font-bold text-gray-300 uppercase tracking-wider text-[10px]">
                      Données de l'examen
                    </h4>
                    <div className="space-y-1.5 text-gray-300">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Type :</span>
                        <span className="font-bold text-indigo-400">{selectedImagingPreview.type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Date :</span>
                        <span className="font-medium">{new Date(selectedImagingPreview.date).toLocaleDateString('fr-FR')}</span>
                      </div>
                      {selectedImagingPreview.bodyPart && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Région :</span>
                          <span className="font-medium">{selectedImagingPreview.bodyPart}</span>
                        </div>
                      )}
                      {selectedImagingPreview.facility && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Centre :</span>
                          <span className="font-medium truncate max-w-[150px]">{selectedImagingPreview.facility}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedImagingPreview.notes && (
                    <div className="p-4 bg-gray-900 rounded-2xl border border-gray-800 space-y-1.5">
                      <h4 className="font-bold text-gray-300 uppercase tracking-wider text-[10px]">
                        Compte-Rendu Médical
                      </h4>
                      <p className="text-gray-300 leading-relaxed italic bg-gray-950/60 p-3 rounded-xl border border-gray-800/60">
                        {selectedImagingPreview.notes}
                      </p>
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      onClick={() => handleDeleteImaging(selectedImagingPreview.id)}
                      className="w-full py-2.5 bg-red-950/40 hover:bg-red-900/40 text-red-400 border border-red-800/40 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Supprimer cet examen
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
