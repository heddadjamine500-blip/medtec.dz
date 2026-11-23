import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HeartPulse, 
  Users, 
  CalendarDays, 
  Search, 
  LayoutDashboard, 
  FileText, 
  Pill, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Trash2, 
  ArrowLeft,
  LogOut,
  FolderPlus,
  ClipboardList
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { apiService } from '../api/client';
import { useAuthStore } from '../store/authStore';

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'patients' | 'appointments' | 'prescriptions' | 'consultations' | 'pharmacies'>('dashboard');
  const [appointments, setAppointments] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [consultations, setConsultations] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Prescription Modal State
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [prescriptionNotes, setPrescriptionNotes] = useState('');
  const [medicationItems, setMedicationItems] = useState<Array<{ medicationName: string; dosage: string; duration: string }>>([
    { medicationName: 'Doliprane 1000mg', dosage: '1 comprimé toutes les 8h si douleur', duration: '5 jours' }
  ]);
  const [submittingPrescription, setSubmittingPrescription] = useState(false);

  // Consultation Modal State
  const [isConsultationModalOpen, setIsConsultationModalOpen] = useState(false);
  const [consultPatientId, setConsultPatientId] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [consultNotes, setConsultNotes] = useState('');
  const [vitalSigns, setVitalSigns] = useState('TA: 12/8, FC: 72 bpm');
  const [submittingConsultation, setSubmittingConsultation] = useState(false);

  // Toast State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = async () => {
    try {
      const [apptsData, prescsData, patientsData, consultsData, invData] = await Promise.all([
        apiService.getAppointments(),
        apiService.getPrescriptions(),
        apiService.getPatients(),
        apiService.getConsultations().catch(() => []),
        apiService.getInventory(),
      ]);
      setAppointments(apptsData);
      setPrescriptions(prescsData);
      setPatients(patientsData);
      setConsultations(consultsData);
      setInventory(invData);

      if (patientsData.length > 0 && !selectedPatientId) {
        setSelectedPatientId(patientsData[0].id);
        setConsultPatientId(patientsData[0].id);
      }
    } catch (error) {
      console.error('Erreur chargement données médecin:', error);
      showToast('Erreur de synchronisation avec le serveur', 'error');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await apiService.updateAppointmentStatus(id, status);
      showToast(`Rendez-vous marqué comme : ${status}`, 'success');
      await loadData();
    } catch (error) {
      console.error(error);
      showToast('Erreur lors de la mise à jour', 'error');
    }
  };

  const handleAddMedicationLine = () => {
    setMedicationItems([...medicationItems, { medicationName: '', dosage: '1 comprimé par jour', duration: '7 jours' }]);
  };

  const handleRemoveMedicationLine = (index: number) => {
    if (medicationItems.length > 1) {
      setMedicationItems(medicationItems.filter((_, i) => i !== index));
    }
  };

  const handleCreatePrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId || !medicationItems.length || !medicationItems[0].medicationName) {
      showToast('Veuillez renseigner le patient et au moins un médicament', 'error');
      return;
    }

    try {
      setSubmittingPrescription(true);
      await apiService.createPrescription({
        patientId: selectedPatientId,
        notes: prescriptionNotes,
        items: medicationItems,
      });
      showToast('Ordonnance émise et enregistrée avec succès !', 'success');
      setIsPrescriptionModalOpen(false);
      setPrescriptionNotes('');
      setMedicationItems([{ medicationName: '', dosage: '1 comprimé par jour', duration: '7 jours' }]);
      await loadData();
    } catch (error) {
      console.error(error);
      showToast("Erreur lors de la création de l'ordonnance", 'error');
    } finally {
      setSubmittingPrescription(false);
    }
  };

  const handleCreateConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consultPatientId || !diagnosis) {
      showToast('Veuillez sélectionner un patient et saisir un diagnostic', 'error');
      return;
    }

    try {
      setSubmittingConsultation(true);
      await apiService.createConsultation({
        patientId: consultPatientId,
        diagnosis,
        notes: consultNotes,
        vitalSigns,
      });
      showToast('Consultation enregistrée avec succès !', 'success');
      setIsConsultationModalOpen(false);
      setDiagnosis('');
      setConsultNotes('');
      await loadData();
    } catch (error) {
      console.error(error);
      showToast("Erreur lors de l'enregistrement de la consultation", 'error');
    } finally {
      setSubmittingConsultation(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const filteredPatients = patients.filter((p) => {
    const fullName = `${p.firstName} ${p.lastName}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase());
  });

  const criticalInventory = inventory.filter((item) => item.stock < 15);

  const doctorName = user?.doctorInfo 
    ? `Dr. ${user.doctorInfo.firstName} ${user.doctorInfo.lastName}` 
    : user?.email || 'Dr. Médecin';
  const doctorSpecialty = user?.doctorInfo?.specialty || 'Généraliste';
  const doctorLicense = user?.doctorInfo?.licenseNb || 'MED-RPPS';

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
        className="w-64 bg-white border-r border-gray-100 flex flex-col justify-between py-6 px-4 shadow-sm z-20"
      >
        <div>
          <div className="flex items-center px-4 mb-6">
            <HeartPulse className="h-7 w-7 text-[#2585D8] mr-2" strokeWidth={2.5} />
            <span className="text-xl font-black text-[#123B65]">
              MEDTEC
            </span>
          </div>

          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center px-4 py-2.5 rounded-2xl transition-all cursor-pointer ${
                activeTab === 'dashboard' 
                  ? 'bg-emerald-600 shadow-md shadow-emerald-600/20 text-white font-bold' 
                  : 'hover:bg-gray-100 text-gray-600 font-medium'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 mr-3" />
              <span className="text-xs">Tableau de Bord</span>
            </button>

            <button
              onClick={() => setActiveTab('patients')}
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-2xl transition-all cursor-pointer ${
                activeTab === 'patients' 
                  ? 'bg-emerald-600 shadow-md shadow-emerald-600/20 text-white font-bold' 
                  : 'hover:bg-gray-100 text-gray-600 font-medium'
              }`}
            >
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-3" />
                <span className="text-xs">Mes Patients</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                activeTab === 'patients' ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-700'
              }`}>
                {patients.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('appointments')}
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-2xl transition-all cursor-pointer ${
                activeTab === 'appointments' 
                  ? 'bg-emerald-600 shadow-md shadow-emerald-600/20 text-white font-bold' 
                  : 'hover:bg-gray-100 text-gray-600 font-medium'
              }`}
            >
              <div className="flex items-center">
                <CalendarDays className="w-4 h-4 mr-3" />
                <span className="text-xs">Agenda & RDV</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                activeTab === 'appointments' ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-700'
              }`}>
                {appointments.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('consultations')}
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-2xl transition-all cursor-pointer ${
                activeTab === 'consultations' 
                  ? 'bg-emerald-600 shadow-md shadow-emerald-600/20 text-white font-bold' 
                  : 'hover:bg-gray-100 text-gray-600 font-medium'
              }`}
            >
              <div className="flex items-center">
                <ClipboardList className="w-4 h-4 mr-3" />
                <span className="text-xs">Consultations</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                activeTab === 'consultations' ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-700'
              }`}>
                {consultations.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('prescriptions')}
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-2xl transition-all cursor-pointer ${
                activeTab === 'prescriptions' 
                  ? 'bg-emerald-600 shadow-md shadow-emerald-600/20 text-white font-bold' 
                  : 'hover:bg-gray-100 text-gray-600 font-medium'
              }`}
            >
              <div className="flex items-center">
                <FileText className="w-4 h-4 mr-3" />
                <span className="text-xs">Ordonnances</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                activeTab === 'prescriptions' ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-700'
              }`}>
                {prescriptions.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('pharmacies')}
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-2xl transition-all cursor-pointer ${
                activeTab === 'pharmacies' 
                  ? 'bg-emerald-600 shadow-md shadow-emerald-600/20 text-white font-bold' 
                  : 'hover:bg-gray-100 text-gray-600 font-medium'
              }`}
            >
              <div className="flex items-center">
                <Pill className="w-4 h-4 mr-3" />
                <span className="text-xs">Réseau Pharmacie</span>
              </div>
              {criticalInventory.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-red-100 text-red-600">
                  {criticalInventory.length}
                </span>
              )}
            </button>
          </nav>
        </div>
        
        <div className="space-y-2 pt-4 border-t border-gray-100">
          <Link to="/" className="w-full flex items-center px-4 py-2 rounded-xl hover:bg-gray-100 text-gray-600 font-semibold text-xs transition-colors">
            <ArrowLeft className="w-3.5 h-3.5 mr-2" /> Retour Accueil
          </Link>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" /> Déconnexion
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* Top Header */}
        <header className="h-20 bg-white/70 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-8 z-10">
          <div className="relative w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un patient..." 
              className="w-full pl-10 pr-4 py-2 rounded-full bg-gray-100/70 border-none text-xs outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            />
          </div>
          
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setIsConsultationModalOpen(true)}
              className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              <FolderPlus className="w-3.5 h-3.5 mr-1.5" />
              Nouvelle Consultation
            </button>

            <button 
              onClick={() => setIsPrescriptionModalOpen(true)}
              className="flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Rédiger Ordonnance
            </button>

            <div className="flex items-center space-x-3 border-l border-gray-200 pl-4">
              <div className="text-right hidden md:block">
                <p className="text-xs font-bold text-gray-900">{doctorName}</p>
                <p className="text-[11px] text-emerald-600 font-semibold">{doctorSpecialty} &bull; {doctorLicense}</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-xs">
                Dr
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Views */}
        <div className="flex-1 overflow-y-auto p-8">
          
          {/* TAB 1: DASHBOARD OVERVIEW */}
          {activeTab === 'dashboard' && (
            <div>
              <div className="mb-6">
                <h1 className="text-xl font-black text-gray-900">Bienvenue, {doctorName} 👋</h1>
                <p className="text-gray-500 text-xs mt-0.5">Synthèse de votre activité clinique et rendez-vous du jour.</p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Patients Rattachés</p>
                    <h3 className="text-2xl font-black text-gray-900">{patients.length}</h3>
                  </div>
                  <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
                    <Users className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Rendez-vous Programmés</p>
                    <h3 className="text-2xl font-black text-gray-900">{appointments.length}</h3>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
                    <CalendarDays className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Consultations Rédigées</p>
                    <h3 className="text-2xl font-black text-gray-900">{consultations.length}</h3>
                  </div>
                  <div className="p-3 rounded-xl bg-purple-50 text-purple-600">
                    <ClipboardList className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Ordonnances Actives</p>
                    <h3 className="text-2xl font-black text-gray-900">{prescriptions.length}</h3>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
                    <FileText className="w-5 h-5" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Appointments List */}
                <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-5 border-b border-gray-50 flex justify-between items-center">
                    <div>
                      <h2 className="font-bold text-sm text-gray-900">Prochaines Consultations</h2>
                      <p className="text-[11px] text-gray-400">Gérez le statut de vos rendez-vous</p>
                    </div>
                    <button 
                      onClick={() => setActiveTab('appointments')}
                      className="text-[#2585D8] text-xs font-bold hover:underline"
                    >
                      Voir tout ({appointments.length})
                    </button>
                  </div>

                  <div className="divide-y divide-gray-50">
                    {appointments.slice(0, 4).map((appt) => (
                      <div key={appt.id} className="p-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex flex-col items-center justify-center text-emerald-700">
                            <span className="text-[9px] uppercase font-bold">{new Date(appt.date).toLocaleDateString('fr-FR', { weekday: 'short' })}</span>
                            <span className="text-xs font-black">{new Date(appt.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900 text-xs">
                              {appt.patient?.firstName} {appt.patient?.lastName}
                            </h4>
                            <p className="text-[11px] text-gray-400">{appt.patient?.phone || 'Patient enregistré'}</p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            appt.status === 'CONFIRMED' ? 'bg-emerald-50 text-emerald-600' :
                            appt.status === 'COMPLETED' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'
                          }`}>
                            {appt.status}
                          </span>

                          {appt.status === 'PENDING' && (
                            <button
                              onClick={() => handleUpdateStatus(appt.id, 'CONFIRMED')}
                              className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-bold cursor-pointer"
                            >
                              Confirmer
                            </button>
                          )}
                          {appt.status === 'CONFIRMED' && (
                            <button
                              onClick={() => handleUpdateStatus(appt.id, 'COMPLETED')}
                              className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold cursor-pointer"
                            >
                              Terminer
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    {appointments.length === 0 && (
                      <p className="text-xs text-gray-400 py-8 text-center">Aucune consultation programmée</p>
                    )}
                  </div>
                </div>

                {/* Pharmacy Alerts Panel */}
                <div className="bg-gradient-to-br from-[#123B65] to-slate-900 rounded-3xl shadow-xl p-6 text-white flex flex-col justify-between">
                  <div>
                    <div className="flex items-center space-x-2 mb-4">
                      <div className="p-2 bg-white/20 rounded-xl">
                        <Pill className="h-4 w-4 text-amber-400" />
                      </div>
                      <div>
                        <h2 className="font-bold text-sm">Disponibilités Réseau Pharmacie</h2>
                        <p className="text-[11px] text-gray-400">Vérifiez les stocks pour vos prescriptions</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2.5">
                      {criticalInventory.slice(0, 3).map((item) => (
                        <div key={item.id} className="bg-white/10 rounded-xl p-3 border border-white/5">
                          <div className="flex justify-between items-start">
                            <p className="font-bold text-xs">{item.name}</p>
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-red-500/20 text-red-300 rounded">
                              Stock : {item.stock}
                            </span>
                          </div>
                          <p className="text-[10px] text-gray-300 mt-1">{item.supplier}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button 
                    onClick={() => setActiveTab('pharmacies')}
                    className="w-full mt-4 py-2.5 bg-white text-[#123B65] font-bold rounded-xl text-xs hover:bg-gray-100 transition-colors"
                  >
                    Consulter tout l'inventaire
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PATIENTS DIRECTORY */}
          {activeTab === 'patients' && (
            <div className="space-y-4 max-w-5xl">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <h2 className="text-base font-bold text-gray-900">Dossiers Médicaux des Patients Suivis</h2>
                  <p className="text-xs text-gray-500">Patients autorisés pour votre cabinet</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPatients.map((patient) => (
                  <div key={patient.id} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs">
                          {patient.firstName?.[0]}{patient.lastName?.[0]}
                        </div>
                        <div>
                          <h3 className="font-bold text-xs text-gray-900">{patient.firstName} {patient.lastName}</h3>
                          <p className="text-[11px] text-gray-400">{patient.user?.email}</p>
                        </div>
                      </div>

                      <div className="space-y-1 text-[11px] text-gray-600 bg-gray-50 p-2.5 rounded-xl mb-3">
                        <p>📞 {patient.phone || 'Non renseigné'}</p>
                        <p>📍 {patient.address || 'Paris'}</p>
                      </div>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-gray-100">
                      <button
                        onClick={() => {
                          setConsultPatientId(patient.id);
                          setIsConsultationModalOpen(true);
                        }}
                        className="w-full py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                      >
                        + Ajouter consultation
                      </button>
                      <button
                        onClick={() => {
                          setSelectedPatientId(patient.id);
                          setIsPrescriptionModalOpen(true);
                        }}
                        className="w-full py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                      >
                        + Rédiger ordonnance
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: APPOINTMENTS FULL MANAGEMENT */}
          {activeTab === 'appointments' && (
            <div className="space-y-4 max-w-5xl">
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-base font-bold text-gray-900 mb-4">Planning Complet des Rendez-vous</h2>
                <div className="space-y-3">
                  {appointments.map((appt) => (
                    <div key={appt.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-gray-50 border border-gray-100 gap-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-11 h-11 rounded-xl bg-white border border-gray-200 flex flex-col items-center justify-center font-mono">
                          <span className="text-xs font-bold text-gray-900">{new Date(appt.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                          <span className="text-[10px] text-gray-400">{new Date(appt.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}</span>
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 text-xs">{appt.patient?.firstName} {appt.patient?.lastName}</h4>
                          <p className="text-[11px] text-gray-500">Contact: {appt.patient?.phone || 'Patient Medtec'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          appt.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-700' :
                          appt.status === 'COMPLETED' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {appt.status}
                        </span>

                        {appt.status !== 'CONFIRMED' && (
                          <button
                            onClick={() => handleUpdateStatus(appt.id, 'CONFIRMED')}
                            className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 cursor-pointer"
                          >
                            Confirmer
                          </button>
                        )}
                        {appt.status !== 'COMPLETED' && (
                          <button
                            onClick={() => handleUpdateStatus(appt.id, 'COMPLETED')}
                            className="px-2.5 py-1 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 cursor-pointer"
                          >
                            Terminer
                          </button>
                        )}
                        <button
                          onClick={() => handleUpdateStatus(appt.id, 'CANCELLED')}
                          className="px-2.5 py-1 bg-gray-200 text-gray-700 rounded-lg text-xs font-bold hover:bg-red-50 hover:text-red-600 cursor-pointer"
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  ))}
                  {appointments.length === 0 && (
                    <p className="text-xs text-gray-400 py-6 text-center">Aucun rendez-vous</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CONSULTATIONS LIST */}
          {activeTab === 'consultations' && (
            <div className="space-y-4 max-w-5xl">
              <div className="flex justify-between items-center">
                <h2 className="text-base font-bold text-gray-900">Historique des Consultations Réalisées</h2>
                <button
                  onClick={() => setIsConsultationModalOpen(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-full text-xs font-bold shadow-sm cursor-pointer"
                >
                  + Nouvelle Consultation
                </button>
              </div>

              <div className="space-y-3">
                {consultations.map((c) => (
                  <div key={c.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                          Dossier #{c.id.substring(0, 8)}
                        </span>
                        <h4 className="font-bold text-sm text-gray-900 mt-1">
                          Patient : {c.patient?.firstName} {c.patient?.lastName}
                        </h4>
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(c.date).toLocaleDateString('fr-FR')}
                      </span>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-xl space-y-1 text-xs">
                      <p><strong className="text-gray-900">Diagnostic :</strong> {c.diagnosis}</p>
                      {c.notes && <p><strong className="text-gray-900">Notes :</strong> {c.notes}</p>}
                      {c.vitalSigns && <p><strong className="text-gray-900">Signes Vitaux :</strong> {c.vitalSigns}</p>}
                    </div>
                  </div>
                ))}
                {consultations.length === 0 && (
                  <p className="text-xs text-gray-400 py-8 text-center bg-white rounded-2xl">Aucune consultation enregistrée</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: PRESCRIPTIONS LIST */}
          {activeTab === 'prescriptions' && (
            <div className="space-y-4 max-w-5xl">
              <div className="flex justify-between items-center">
                <h2 className="text-base font-bold text-gray-900">Ordonnances Rédigées</h2>
                <button
                  onClick={() => setIsPrescriptionModalOpen(true)}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-full text-xs font-bold shadow-sm cursor-pointer"
                >
                  + Rédiger Ordonnance
                </button>
              </div>

              <div className="space-y-3">
                {prescriptions.map((presc) => (
                  <div key={presc.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                          Ordonnance #{presc.id.substring(0, 8)}
                        </span>
                        <h3 className="text-sm font-bold text-gray-900 mt-1">
                          Patient : {presc.patient?.firstName} {presc.patient?.lastName}
                        </h3>
                        <p className="text-[11px] text-gray-400">Émise le {new Date(presc.createdAt).toLocaleDateString('fr-FR')}</p>
                      </div>
                    </div>

                    {presc.notes && <p className="text-xs italic text-gray-600 mb-3 bg-gray-50 p-2.5 rounded-xl">« {presc.notes} »</p>}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {presc.items?.map((item: any) => (
                        <div key={item.id} className="p-2.5 bg-gray-50 rounded-xl text-xs border border-gray-100 flex items-center gap-2">
                          <span>💊</span>
                          <div>
                            <strong className="text-gray-900">{item.medicationName}</strong>
                            <p className="text-gray-500 text-[11px]">{item.dosage} &bull; {item.duration}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: PHARMACIES & STOCKS */}
          {activeTab === 'pharmacies' && (
            <div className="space-y-4 max-w-5xl">
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <h2 className="text-base font-bold text-gray-900 mb-1">Disponibilités des Stocks Pharmaceutiques</h2>
                <p className="text-xs text-gray-500 mb-4">Consultez les stocks réels du réseau pour vos prescriptions médicales.</p>

                <div className="divide-y divide-gray-50">
                  {inventory.map((item) => (
                    <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <h4 className="font-bold text-gray-900">{item.name}</h4>
                        <p className="text-gray-400 text-[11px]">{item.supplier} &bull; Prix : {item.price} €</p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        item.stock < 10 ? 'bg-red-50 text-red-600' :
                        item.stock < 20 ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                      }`}>
                        {item.stock} boîtes disponibles
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* NEW PRESCRIPTION MODAL */}
      <AnimatePresence>
        {isPrescriptionModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden p-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-black text-gray-900">Rédiger une Ordonnance</h3>
                  <p className="text-xs text-gray-500">Prescription numérique officielle</p>
                </div>
                <button 
                  onClick={() => setIsPrescriptionModalOpen(false)}
                  className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreatePrescription} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Patient Destinataire
                  </label>
                  <select
                    value={selectedPatientId}
                    onChange={(e) => setSelectedPatientId(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                    required
                  >
                    {patients.map((pat) => (
                      <option key={pat.id} value={pat.id}>
                        {pat.firstName} {pat.lastName} ({pat.user?.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Recommandations / Précautions
                  </label>
                  <textarea
                    rows={2}
                    value={prescriptionNotes}
                    onChange={(e) => setPrescriptionNotes(e.target.value)}
                    placeholder="Ex: À prendre au cours du repas..."
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                {/* Medication Items */}
                <div className="space-y-2 pt-1">
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-bold text-gray-700 uppercase">
                      Médicaments
                    </label>
                    <button
                      type="button"
                      onClick={handleAddMedicationLine}
                      className="text-xs text-emerald-600 font-bold hover:underline flex items-center cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" /> Ajouter une ligne
                    </button>
                  </div>

                  {medicationItems.map((item, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-gray-50 border border-gray-200 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-bold text-emerald-700">Ligne #{idx + 1}</span>
                        {medicationItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveMedicationLine(idx)}
                            className="text-red-500 hover:text-red-700 p-0.5 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <input
                          type="text"
                          placeholder="Nom (Doliprane 1000mg)"
                          value={item.medicationName}
                          onChange={(e) => {
                            const copy = [...medicationItems];
                            copy[idx].medicationName = e.target.value;
                            setMedicationItems(copy);
                          }}
                          className="px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs outline-none"
                          required
                        />
                        <input
                          type="text"
                          placeholder="Posologie (1 cp matin et soir)"
                          value={item.dosage}
                          onChange={(e) => {
                            const copy = [...medicationItems];
                            copy[idx].dosage = e.target.value;
                            setMedicationItems(copy);
                          }}
                          className="px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs outline-none"
                          required
                        />
                        <input
                          type="text"
                          placeholder="Durée (7 jours)"
                          value={item.duration}
                          onChange={(e) => {
                            const copy = [...medicationItems];
                            copy[idx].duration = e.target.value;
                            setMedicationItems(copy);
                          }}
                          className="px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs outline-none"
                          required
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsPrescriptionModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={submittingPrescription}
                    className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 hover:bg-emerald-700 transition-all cursor-pointer"
                  >
                    {submittingPrescription ? 'Émission...' : "Émettre l'ordonnance"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* NEW CONSULTATION MODAL */}
      <AnimatePresence>
        {isConsultationModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden p-6"
            >
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-black text-gray-900">Enregistrer une Consultation</h3>
                  <p className="text-xs text-gray-500">Compte-rendu médical officiel</p>
                </div>
                <button 
                  onClick={() => setIsConsultationModalOpen(false)}
                  className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateConsultation} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Patient
                  </label>
                  <select
                    value={consultPatientId}
                    onChange={(e) => setConsultPatientId(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  >
                    {patients.map((pat) => (
                      <option key={pat.id} value={pat.id}>
                        {pat.firstName} {pat.lastName} ({pat.user?.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Diagnostic Clinique
                  </label>
                  <input
                    type="text"
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    placeholder="Ex: Rhinopharyngite aiguë, HTA stade 1..."
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Signes Vitaux & Constantes
                  </label>
                  <input
                    type="text"
                    value={vitalSigns}
                    onChange={(e) => setVitalSigns(e.target.value)}
                    placeholder="Ex: TA: 12/8, FC: 72 bpm, SpO2: 99%"
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Notes & Observations Médicales
                  </label>
                  <textarea
                    rows={3}
                    value={consultNotes}
                    onChange={(e) => setConsultNotes(e.target.value)}
                    placeholder="Observations cliniques, examens complémentaires prescrits..."
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsConsultationModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={submittingConsultation}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition-all cursor-pointer"
                  >
                    {submittingConsultation ? 'Enregistrement...' : 'Enregistrer la consultation'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
