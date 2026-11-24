import React, { useState, useEffect } from 'react';
import { 
  UserPlus, 
  Search, 
  RefreshCw, 
  Edit2, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Calendar
} from 'lucide-react';
import { apiService } from '../../api/client';

export const EmployeeManagement: React.FC = () => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [jobTitleFilter, setJobTitleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal Create
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [createForm, setCreateForm] = useState({
    email: '',
    password: '',
    employeeCode: '',
    firstName: '',
    lastName: '',
    jobTitle: 'NURSE',
    department: 'Soins Généraux',
    phone: '',
    status: 'ACTIVE',
    notes: '',
  });

  // Modal Edit
  const [isEditOpen, setIsEditOpen] = useState<boolean>(false);
  const [editingEmployee, setEditingEmployee] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    jobTitle: 'NURSE',
    department: '',
    phone: '',
    status: 'ACTIVE',
    isActive: true,
    notes: '',
  });

  // Drawer Detail
  const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await apiService.getEmployees({
        search,
        jobTitle: jobTitleFilter,
        status: statusFilter,
        page,
        pageSize: 15,
      });
      setEmployees(res.employees || []);
      setTotalPages(res.totalPages || 1);
    } catch (err: any) {
      console.error('Erreur chargement employés:', err);
      setFeedback({ type: 'error', text: 'Impossible de charger la liste des employés.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [search, jobTitleFilter, statusFilter, page]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setFeedback(null);
      await apiService.createEmployee(createForm);
      setFeedback({ type: 'success', text: `Collaborateur "${createForm.firstName} ${createForm.lastName}" créé avec succès !` });
      setIsCreateOpen(false);
      setCreateForm({
        email: '',
        password: '',
        employeeCode: '',
        firstName: '',
        lastName: '',
        jobTitle: 'NURSE',
        department: 'Soins Généraux',
        phone: '',
        status: 'ACTIVE',
        notes: '',
      });
      fetchEmployees();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Erreur lors de la création de l’employé.',
      });
    }
  };

  const handleOpenEdit = (emp: any) => {
    setEditingEmployee(emp);
    setEditForm({
      firstName: emp.firstName,
      lastName: emp.lastName,
      jobTitle: emp.jobTitle,
      department: emp.department || '',
      phone: emp.phone || '',
      status: emp.status,
      isActive: emp.user?.isActive ?? true,
      notes: emp.notes || '',
    });
    setIsEditOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee) return;

    try {
      setFeedback(null);
      await apiService.updateEmployee(editingEmployee.id, editForm);
      setFeedback({ type: 'success', text: 'Fiche employé mise à jour avec succès.' });
      setIsEditOpen(false);
      fetchEmployees();
      if (selectedEmployee?.id === editingEmployee.id) {
        handleViewDetail(editingEmployee.id);
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Erreur lors de la mise à jour.',
      });
    }
  };

  const handleViewDetail = async (id: string) => {
    try {
      setDetailLoading(true);
      const res = await apiService.getEmployeeById(id);
      setSelectedEmployee(res);
    } catch (err) {
      console.error('Erreur chargement détail employé:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#123B65]">Gestion des Employés & Personnel</h2>
          <p className="text-xs text-gray-500">Infirmiers, techniciens, secrétaires et agents administratifs</p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#123B65] hover:bg-[#0e2c4d] text-white rounded-2xl text-xs font-bold transition shadow-sm cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          Nouvel Employé
        </button>
      </div>

      {feedback && (
        <div className={`p-4 rounded-2xl text-xs font-medium flex items-center justify-between ${
          feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-rose-50 text-rose-800 border border-rose-100'
        }`}>
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
            <span>{feedback.text}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-gray-400 hover:text-gray-600">×</button>
        </div>
      )}

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-[240px]">
          <div className="relative w-full max-w-sm">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher nom, matricule, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-xs text-gray-800 outline-none focus:border-[#2585D8]"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={jobTitleFilter}
            onChange={(e) => setJobTitleFilter(e.target.value)}
            className="text-xs bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 font-medium text-gray-700 outline-none"
          >
            <option value="ALL">Tous les postes</option>
            <option value="NURSE">Infirmier(e)</option>
            <option value="ANESTHESIOLOGIST">Anesthésiste</option>
            <option value="RECEPTIONIST">Accueil / Réception</option>
            <option value="TECHNICIAN">Technicien(ne)</option>
            <option value="PHARMACIST_ASSISTANT">Préparateur en pharmacie</option>
            <option value="ADMIN_STAFF">Personnel Administratif</option>
            <option value="SECURITY">Sécurité</option>
            <option value="CLEANING">Hygiène & Entretien</option>
            <option value="OTHER">Autre</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 font-medium text-gray-700 outline-none"
          >
            <option value="ALL">Tous les statuts</option>
            <option value="ACTIVE">Actif</option>
            <option value="ON_LEAVE">En congé</option>
            <option value="SUSPENDED">Suspendu</option>
            <option value="TERMINATED">Fin de contrat</option>
          </select>

          <button
            onClick={fetchEmployees}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-50 transition cursor-pointer"
            title="Actualiser"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center text-gray-400 text-xs">
            <RefreshCw className="w-6 h-6 animate-spin mb-2 text-[#2585D8]" />
            Chargement des collaborateurs...
          </div>
        ) : employees.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-xs">
            Aucun employé ne correspond aux critères de recherche.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50 text-gray-400 uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-6">Employé</th>
                  <th className="py-3.5 px-4">Matricule</th>
                  <th className="py-3.5 px-4">Poste & Département</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">Statut</th>
                  <th className="py-3.5 px-4">Compte</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {employees.map((emp) => {
                  const isActive = emp.user?.isActive;

                  return (
                    <tr key={emp.id} className="hover:bg-gray-50/60 transition">
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold text-xs">
                            {emp.firstName[0]}{emp.lastName[0]}
                          </div>
                          <div>
                            <span className="font-bold text-gray-900 block">
                              {emp.firstName} {emp.lastName}
                            </span>
                            <span className="text-[11px] text-gray-400">{emp.user?.email}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-gray-700 text-[11px]">
                        {emp.employeeCode}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-bold text-gray-800 block">{emp.jobTitle}</span>
                        <span className="text-[11px] text-gray-400">{emp.department || 'Non assigné'}</span>
                      </td>

                      <td className="py-3.5 px-4 text-gray-600">
                        {emp.phone || <span className="text-gray-300">-</span>}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          emp.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          emp.status === 'ON_LEAVE' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                          emp.status === 'SUSPENDED' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {emp.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {isActive ? 'Actif' : 'Désactivé'}
                        </span>
                      </td>

                      <td className="py-3.5 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleViewDetail(emp.id)}
                            className="px-2.5 py-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold text-xs transition cursor-pointer"
                            title="Voir la fiche"
                          >
                            Détails
                          </button>
                          <button
                            onClick={() => handleOpenEdit(emp)}
                            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                            title="Modifier"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-gray-100 text-xs">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 cursor-pointer"
                >
                  Précédent
                </button>
                <span className="text-gray-500">Page {page} sur {totalPages}</span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 cursor-pointer"
                >
                  Suivant
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* CREATE MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 text-base">Créer un Profil Collaborateur</h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Prénom *</label>
                  <input
                    type="text"
                    required
                    value={createForm.firstName}
                    onChange={(e) => setCreateForm({ ...createForm, firstName: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 outline-none focus:border-[#2585D8]"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Nom *</label>
                  <input
                    type="text"
                    required
                    value={createForm.lastName}
                    onChange={(e) => setCreateForm({ ...createForm, lastName: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 outline-none focus:border-[#2585D8]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Adresse Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="nom@medtec.com"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 outline-none focus:border-[#2585D8]"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Mot de Passe Initial *</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="Min 6 caractères"
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 outline-none focus:border-[#2585D8]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Matricule Unique *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: EMP-1042"
                    value={createForm.employeeCode}
                    onChange={(e) => setCreateForm({ ...createForm, employeeCode: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 outline-none focus:border-[#2585D8]"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Téléphone</label>
                  <input
                    type="text"
                    placeholder="+213 550..."
                    value={createForm.phone}
                    onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 outline-none focus:border-[#2585D8]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Poste (Rôle)</label>
                  <select
                    value={createForm.jobTitle}
                    onChange={(e) => setCreateForm({ ...createForm, jobTitle: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 outline-none"
                  >
                    <option value="NURSE">Infirmier(e)</option>
                    <option value="ANESTHESIOLOGIST">Anesthésiste</option>
                    <option value="RECEPTIONIST">Accueil / Réception</option>
                    <option value="TECHNICIAN">Technicien(ne)</option>
                    <option value="PHARMACIST_ASSISTANT">Préparateur Pharmacie</option>
                    <option value="ADMIN_STAFF">Personnel Administratif</option>
                    <option value="SECURITY">Sécurité</option>
                    <option value="CLEANING">Entretien</option>
                    <option value="OTHER">Autre</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Département</label>
                  <input
                    type="text"
                    placeholder="Ex: Cardiologie, Urgences"
                    value={createForm.department}
                    onChange={(e) => setCreateForm({ ...createForm, department: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#123B65] text-white font-bold hover:bg-[#0e2c4d] cursor-pointer"
                >
                  Créer l'Employé
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 text-base">Modifier Collaborateur</h3>
              <button onClick={() => setIsEditOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Prénom</label>
                  <input
                    type="text"
                    value={editForm.firstName}
                    onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Nom</label>
                  <input
                    type="text"
                    value={editForm.lastName}
                    onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Poste</label>
                  <select
                    value={editForm.jobTitle}
                    onChange={(e) => setEditForm({ ...editForm, jobTitle: e.target.value as any })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs"
                  >
                    <option value="NURSE">Infirmier(e)</option>
                    <option value="ANESTHESIOLOGIST">Anesthésiste</option>
                    <option value="RECEPTIONIST">Accueil / Réception</option>
                    <option value="TECHNICIAN">Technicien(ne)</option>
                    <option value="PHARMACIST_ASSISTANT">Préparateur Pharmacie</option>
                    <option value="ADMIN_STAFF">Personnel Administratif</option>
                    <option value="SECURITY">Sécurité</option>
                    <option value="CLEANING">Entretien</option>
                    <option value="OTHER">Autre</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Département</label>
                  <input
                    type="text"
                    value={editForm.department}
                    onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Statut Employé</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs"
                  >
                    <option value="ACTIVE">Actif</option>
                    <option value="ON_LEAVE">En Congé</option>
                    <option value="SUSPENDED">Suspendu</option>
                    <option value="TERMINATED">Fin de Contrat (TERMINATED)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Accès au Compte</label>
                  <select
                    value={editForm.isActive ? 'true' : 'false'}
                    onChange={(e) => setEditForm({ ...editForm, isActive: e.target.value === 'true' })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs"
                  >
                    <option value="true">Activé (Connexion autorisée)</option>
                    <option value="false">Désactivé (Bloqué)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Téléphone</label>
                <input
                  type="text"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#123B65] text-white font-bold hover:bg-[#0e2c4d] cursor-pointer"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAIL DRAWER / MODAL */}
      {selectedEmployee && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-gray-100 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-lg">
                  {selectedEmployee.firstName[0]}{selectedEmployee.lastName[0]}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">
                    {selectedEmployee.firstName} {selectedEmployee.lastName}
                  </h3>
                  <p className="text-xs text-gray-500">
                    Matricule: {selectedEmployee.employeeCode} &bull; {selectedEmployee.jobTitle}
                  </p>
                </div>
              </div>

              <button onClick={() => setSelectedEmployee(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <div>
                  <span className="text-gray-400 block text-[11px]">Email</span>
                  <span className="font-bold text-gray-800">{selectedEmployee.user?.email}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[11px]">Téléphone</span>
                  <span className="font-bold text-gray-800">{selectedEmployee.phone || 'Non renseigné'}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[11px]">Département</span>
                  <span className="font-bold text-gray-800">{selectedEmployee.department || 'Général'}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[11px]">Statut</span>
                  <span className="font-bold text-emerald-700">{selectedEmployee.status}</span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  Derniers Pointages de Présence
                </h4>

                {detailLoading ? (
                  <div className="py-8 flex justify-center text-gray-400">
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  </div>
                ) : !selectedEmployee.user?.attendances || selectedEmployee.user.attendances.length === 0 ? (
                  <div className="py-6 text-center text-gray-400 bg-gray-50 rounded-2xl">
                    Aucun historique de pointage pour le moment.
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {selectedEmployee.user.attendances.map((att: any) => (
                      <div key={att.id} className="p-2.5 rounded-xl border border-gray-100 bg-white flex items-center justify-between text-xs">
                        <span className="font-bold text-gray-800">{att.date}</span>
                        <span className="text-gray-600">
                          {new Date(att.checkInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {att.checkOutAt ? ` → ${new Date(att.checkOutAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ' (en cours)'}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          att.status === 'PRESENT' ? 'bg-emerald-50 text-emerald-700' :
                          att.status === 'LATE' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'
                        }`}>
                          {att.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => handleOpenEdit(selectedEmployee)}
                className="px-4 py-2 rounded-xl bg-[#123B65] text-white font-bold hover:bg-[#0e2c4d] text-xs cursor-pointer"
              >
                Modifier cette Fiche
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeManagement;
