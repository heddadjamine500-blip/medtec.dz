import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  Users, 
  Server, 
  Activity, 
  ArrowLeft, 
  RefreshCw, 
  UserCheck, 
  UserX, 
  Edit2, 
  X, 
  CheckCircle2, 
  AlertCircle,
  LogOut,
  Loader2,
  DoorClosed,
  Stethoscope,
  Clock,
  Briefcase
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { apiService } from '../api/client';
import { useAuthStore } from '../store/authStore';

import RoomManagement from './admin/RoomManagement';
import EmployeeManagement from './admin/EmployeeManagement';
import DoctorManagement from './admin/DoctorManagement';
import PatientAdminManagement from './admin/PatientAdminManagement';
import AttendanceManagement from './admin/AttendanceManagement';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const [activeTab, setActiveTab] = useState<
    'monitoring' | 'rooms' | 'employees' | 'doctors' | 'patients' | 'attendance' | 'users' | 'system'
  >('monitoring');
  const [stats, setStats] = useState<any>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit User Modal State
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [editRole, setEditRole] = useState('PATIENT');
  const [editIsActive, setEditIsActive] = useState(true);
  const [savingUser, setSavingUser] = useState(false);

  // Toast State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, allUsersData] = await Promise.all([
        apiService.getStats(),
        apiService.getUsers().catch(() => []),
      ]);
      setStats(statsData);
      setUsersList(allUsersData);
    } catch (error) {
      console.error('Erreur admin:', error);
      showToast('Erreur chargement des données', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleEditClick = (u: any) => {
    setEditingUser(u);
    setEditRole(u.role);
    setEditIsActive(u.isActive !== false);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      setSavingUser(true);
      await apiService.updateUser(editingUser.id, {
        role: editRole,
        isActive: editIsActive,
      });
      showToast('Utilisateur mis à jour avec succès', 'success');
      setEditingUser(null);
      await loadData();
    } catch (error) {
      console.error(error);
      showToast('Erreur lors de la mise à jour', 'error');
    } finally {
      setSavingUser(false);
    }
  };

  const handleToggleActive = async (u: any) => {
    try {
      const newStatus = !u.isActive;
      await apiService.updateUser(u.id, { isActive: newStatus });
      showToast(`Compte ${newStatus ? 'activé' : 'désactivé'}`, 'info');
      await loadData();
    } catch (error) {
      console.error(error);
      showToast('Erreur lors de la modification du statut', 'error');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-[#F5F8FC] overflow-hidden font-sans text-gray-800">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl text-white font-medium text-xs ${
              toast.type === 'success' ? 'bg-emerald-600 shadow-emerald-500/20' : 
              toast.type === 'error' ? 'bg-red-600 shadow-red-500/20' : 'bg-purple-600 shadow-purple-500/20'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside 
        initial={{ x: -250 }}
        animate={{ x: 0 }}
        className="w-64 bg-[#123B65] border-r border-slate-800 flex flex-col justify-between py-6 px-4 text-white z-20"
      >
        <div>
          <div className="flex items-center px-4 mb-6">
            <Shield className="h-7 w-7 text-purple-400 mr-2" strokeWidth={2.5} />
            <span className="text-xl font-black tracking-wider text-white">
              ADMIN-MED
            </span>
          </div>

          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('monitoring')}
              className={`w-full flex items-center px-4 py-2.5 rounded-2xl transition-all cursor-pointer ${
                activeTab === 'monitoring' 
                  ? 'bg-purple-600 text-white font-bold shadow-md shadow-purple-600/30' 
                  : 'hover:bg-white/10 text-gray-300 font-medium'
              }`}
            >
              <Activity className="w-4 h-4 mr-3" />
              <span className="text-xs">Monitoring Global</span>
            </button>

            <button
              onClick={() => setActiveTab('rooms')}
              className={`w-full flex items-center px-4 py-2.5 rounded-2xl transition-all cursor-pointer ${
                activeTab === 'rooms' 
                  ? 'bg-purple-600 text-white font-bold shadow-md shadow-purple-600/30' 
                  : 'hover:bg-white/10 text-gray-300 font-medium'
              }`}
            >
              <DoorClosed className="w-4 h-4 mr-3" />
              <span className="text-xs">Salles & Blocs</span>
            </button>

            <button
              onClick={() => setActiveTab('employees')}
              className={`w-full flex items-center px-4 py-2.5 rounded-2xl transition-all cursor-pointer ${
                activeTab === 'employees' 
                  ? 'bg-purple-600 text-white font-bold shadow-md shadow-purple-600/30' 
                  : 'hover:bg-white/10 text-gray-300 font-medium'
              }`}
            >
              <Briefcase className="w-4 h-4 mr-3" />
              <span className="text-xs">Employés & Personnel</span>
            </button>

            <button
              onClick={() => setActiveTab('doctors')}
              className={`w-full flex items-center px-4 py-2.5 rounded-2xl transition-all cursor-pointer ${
                activeTab === 'doctors' 
                  ? 'bg-purple-600 text-white font-bold shadow-md shadow-purple-600/30' 
                  : 'hover:bg-white/10 text-gray-300 font-medium'
              }`}
            >
              <Stethoscope className="w-4 h-4 mr-3" />
              <span className="text-xs">Corps Médical</span>
            </button>

            <button
              onClick={() => setActiveTab('patients')}
              className={`w-full flex items-center px-4 py-2.5 rounded-2xl transition-all cursor-pointer ${
                activeTab === 'patients' 
                  ? 'bg-purple-600 text-white font-bold shadow-md shadow-purple-600/30' 
                  : 'hover:bg-white/10 text-gray-300 font-medium'
              }`}
            >
              <Users className="w-4 h-4 mr-3" />
              <span className="text-xs">Patients (Administratif)</span>
            </button>

            <button
              onClick={() => setActiveTab('attendance')}
              className={`w-full flex items-center px-4 py-2.5 rounded-2xl transition-all cursor-pointer ${
                activeTab === 'attendance' 
                  ? 'bg-purple-600 text-white font-bold shadow-md shadow-purple-600/30' 
                  : 'hover:bg-white/10 text-gray-300 font-medium'
              }`}
            >
              <Clock className="w-4 h-4 mr-3" />
              <span className="text-xs">Pointage & Horaires</span>
            </button>

            <button
              onClick={() => setActiveTab('users')}
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-2xl transition-all cursor-pointer ${
                activeTab === 'users' 
                  ? 'bg-purple-600 text-white font-bold shadow-md shadow-purple-600/30' 
                  : 'hover:bg-white/10 text-gray-300 font-medium'
              }`}
            >
              <div className="flex items-center">
                <Shield className="w-4 h-4 mr-3" />
                <span className="text-xs">Tous les Comptes</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-white/20 text-white">
                {usersList.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('system')}
              className={`w-full flex items-center px-4 py-2.5 rounded-2xl transition-all cursor-pointer ${
                activeTab === 'system' 
                  ? 'bg-purple-600 text-white font-bold shadow-md shadow-purple-600/30' 
                  : 'hover:bg-white/10 text-gray-300 font-medium'
              }`}
            >
              <Server className="w-4 h-4 mr-3" />
              <span className="text-xs">Système & Sécurité</span>
            </button>
          </nav>
        </div>

        <div className="space-y-2 pt-4 border-t border-white/10">
          <Link to="/" className="w-full flex items-center px-4 py-2 rounded-xl hover:bg-white/10 text-gray-300 font-semibold text-xs transition-colors">
            <ArrowLeft className="w-3.5 h-3.5 mr-2" /> Retour Accueil
          </Link>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" /> Déconnexion
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#F5F8FC]">
        
        <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-8">
          <div>
            <h1 className="text-xl font-bold text-[#123B65]">Centre de Supervision MEDTEC</h1>
            <p className="text-xs text-gray-500">Superviseur système : {user?.email}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-3.5 py-1.5 bg-emerald-50 text-emerald-700 font-bold rounded-full text-xs flex items-center">
              <div className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></div>
              Système Opérationnel (Prisma SQLite)
            </div>
            <button
              onClick={loadData}
              className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors cursor-pointer"
              title="Actualiser les données"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          
          {loading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
            </div>
          )}

          {/* TAB 1: MONITORING */}
          {!loading && activeTab === 'monitoring' && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Patients Enregistrés</p>
                  <h3 className="text-2xl font-black text-gray-900">{stats?.totalPatients || 0}</h3>
                  <p className="text-[11px] text-emerald-600 mt-1 font-bold">Dossiers actifs</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Médecins Agréés</p>
                  <h3 className="text-2xl font-black text-gray-900">{stats?.totalDoctors || 0}</h3>
                  <p className="text-[11px] text-purple-600 mt-1 font-bold">En exercice</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Consultations & RDV</p>
                  <h3 className="text-2xl font-black text-gray-900">{stats?.totalAppointments || 0}</h3>
                  <p className="text-[11px] text-blue-600 mt-1 font-bold">{stats?.pendingAppointments || 0} en attente</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Références Pharmacie</p>
                  <h3 className="text-2xl font-black text-gray-900">{stats?.totalInventoryItems || 0}</h3>
                  <p className="text-[11px] text-amber-600 mt-1 font-bold">{stats?.criticalStockCount || 0} alertes stock</p>
                </div>
              </div>

              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                <h2 className="font-bold text-sm text-gray-900 mb-4 flex items-center">
                  <Activity className="w-4 h-4 mr-2 text-purple-500"/>
                  Journaux de Contrôle Système
                </h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 text-xs">
                    <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">BDD</span>
                    <span className="text-gray-700">Base SQLite locale connectée et synchronisée avec Prisma 7.</span>
                    <span className="text-gray-400 font-mono text-[10px]">Actif</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 text-xs">
                    <span className="font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">AUTH</span>
                    <span className="text-gray-700">Authentification JWT avec vérification des rôles côté serveur opérationnelle.</span>
                    <span className="text-gray-400 font-mono text-[10px]">Sécurisé</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 text-xs">
                    <span className="font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded">ROLES</span>
                    <span className="text-gray-700">{usersList.length} comptes utilisateurs gérés (Patients, Médecins, Pharmacies, Admins).</span>
                    <span className="text-gray-400 font-mono text-[10px]">Synchronisé</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: ROOMS */}
          {!loading && activeTab === 'rooms' && (
            <RoomManagement />
          )}

          {/* TAB: EMPLOYEES */}
          {!loading && activeTab === 'employees' && (
            <EmployeeManagement />
          )}

          {/* TAB: DOCTORS */}
          {!loading && activeTab === 'doctors' && (
            <DoctorManagement />
          )}

          {/* TAB: PATIENTS */}
          {!loading && activeTab === 'patients' && (
            <PatientAdminManagement />
          )}

          {/* TAB: ATTENDANCE */}
          {!loading && activeTab === 'attendance' && (
            <AttendanceManagement />
          )}

          {/* TAB 2: USERS CRUD */}
          {!loading && activeTab === 'users' && (
            <div className="space-y-4 max-w-5xl">
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-5 border-b border-gray-50 flex justify-between items-center">
                  <div>
                    <h2 className="font-bold text-sm text-gray-900">Gestion des Comptes et Rôles Utilisateurs</h2>
                    <p className="text-[11px] text-gray-400">Modifier les rôles ou activer/désactiver les accès</p>
                  </div>
                  <span className="text-xs font-bold text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
                    {usersList.length} Utilisateurs
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-gray-50 text-gray-500 uppercase tracking-wider font-bold">
                        <th className="p-3.5">Utilisateur</th>
                        <th className="p-3.5">Profil Associé</th>
                        <th className="p-3.5">Rôle</th>
                        <th className="p-3.5">Statut</th>
                        <th className="p-3.5">Création</th>
                        <th className="p-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {usersList.map((u) => {
                        let profileName = 'Non défini';
                        if (u.role === 'PATIENT' && u.patientInfo) profileName = `${u.patientInfo.firstName} ${u.patientInfo.lastName}`;
                        else if (u.role === 'DOCTOR' && u.doctorInfo) profileName = `Dr. ${u.doctorInfo.firstName} ${u.doctorInfo.lastName} (${u.doctorInfo.specialty})`;
                        else if (u.role === 'PHARMACY' && u.pharmacyInfo) profileName = u.pharmacyInfo.name;
                        else if (u.role === 'ADMIN') profileName = 'Administrateur Système';

                        return (
                          <tr key={u.id} className="hover:bg-gray-50/50">
                            <td className="p-3.5">
                              <span className="font-bold text-gray-900">{u.email}</span>
                            </td>
                            <td className="p-3.5 text-gray-600">{profileName}</td>
                            <td className="p-3.5">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                                u.role === 'DOCTOR' ? 'bg-emerald-100 text-emerald-700' :
                                u.role === 'PHARMACY' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                              }`}>
                                {u.role}
                              </span>
                            </td>
                            <td className="p-3.5">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                u.isActive !== false ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                              }`}>
                                {u.isActive !== false ? 'Actif' : 'Désactivé'}
                              </span>
                            </td>
                            <td className="p-3.5 text-gray-400 font-mono text-[10px]">
                              {new Date(u.createdAt).toLocaleDateString('fr-FR')}
                            </td>
                            <td className="p-3.5 text-right space-x-1">
                              <button
                                onClick={() => handleEditClick(u)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer"
                                title="Modifier le rôle"
                              >
                                <Edit2 className="w-3.5 h-3.5 inline" />
                              </button>
                              <button
                                onClick={() => handleToggleActive(u)}
                                className={`p-1.5 rounded-lg cursor-pointer ${
                                  u.isActive !== false ? 'text-red-500 hover:bg-red-50' : 'text-emerald-600 hover:bg-emerald-50'
                                }`}
                                title={u.isActive !== false ? 'Désactiver le compte' : 'Réactiver le compte'}
                              >
                                {u.isActive !== false ? <UserX className="w-3.5 h-3.5 inline" /> : <UserCheck className="w-3.5 h-3.5 inline" />}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SYSTEM */}
          {!loading && activeTab === 'system' && (
            <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm max-w-4xl space-y-4">
              <h3 className="text-base font-bold text-gray-900">Paramètres et Architecture MEDTEC</h3>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-gray-50 rounded-2xl">
                  <p className="text-gray-400 font-bold uppercase text-[10px]">Serveur Express</p>
                  <p className="font-bold text-emerald-600 mt-1 text-sm">Opérationnel sur le port 10000</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-2xl">
                  <p className="text-gray-400 font-bold uppercase text-[10px]">Interface Frontend</p>
                  <p className="font-bold text-[#2585D8] mt-1 text-sm">Vite + React 19 (Port 5173)</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-2xl">
                  <p className="text-gray-400 font-bold uppercase text-[10px]">Base de Données</p>
                  <p className="font-bold text-gray-900 mt-1 text-sm">Prisma 7 + SQLite (dev.db)</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-2xl">
                  <p className="text-gray-400 font-bold uppercase text-[10px]">Sécurité & JWT</p>
                  <p className="font-bold text-purple-700 mt-1 text-sm">Bcrypt 10 rounds + RBAC Server-Side</p>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* EDIT USER MODAL */}
      <AnimatePresence>
        {editingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden p-6"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-base font-black text-gray-900">Modifier l'Utilisateur</h3>
                <button 
                  onClick={() => setEditingUser(null)}
                  className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveUser} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-gray-700 uppercase mb-1">Email</label>
                  <input
                    type="email"
                    value={editingUser.email}
                    disabled
                    className="w-full px-3.5 py-2 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 uppercase mb-1">Rôle Système</label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="PATIENT">PATIENT</option>
                    <option value="DOCTOR">DOCTOR</option>
                    <option value="PHARMACY">PHARMACY</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActiveCheck"
                    checked={editIsActive}
                    onChange={(e) => setEditIsActive(e.target.checked)}
                    className="w-4 h-4 text-purple-600 rounded cursor-pointer"
                  />
                  <label htmlFor="isActiveCheck" className="font-bold text-gray-700 cursor-pointer">
                    Compte Actif (Autorisé à se connecter)
                  </label>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="px-4 py-2 font-bold text-gray-600 hover:bg-gray-100 rounded-xl"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={savingUser}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-sm cursor-pointer"
                  >
                    {savingUser ? 'Enregistrement...' : 'Enregistrer'}
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
