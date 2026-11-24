import React, { useState, useEffect } from 'react';
import { 
  Stethoscope, 
  UserPlus, 
  Search, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  X
} from 'lucide-react';
import { apiService } from '../../api/client';

export const DoctorManagement: React.FC = () => {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal Create
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [createForm, setCreateForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    specialty: 'Médecine Générale',
    licenseNb: '',
    phone: '',
  });

  // Modal Edit
  const [isEditOpen, setIsEditOpen] = useState<boolean>(false);
  const [editingDoctor, setEditingDoctor] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    specialty: '',
    phone: '',
    isActive: true,
  });

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const res = await apiService.getAdminDoctors({
        search,
        status: statusFilter,
        page,
        pageSize: 15,
      });
      setDoctors(res.doctors || []);
      setTotalPages(res.totalPages || 1);
    } catch (err: any) {
      console.error('Erreur chargement médecins:', err);
      setFeedback({ type: 'error', text: 'Impossible de charger la liste des praticiens.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, [search, statusFilter, page]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setFeedback(null);
      await apiService.createAdminDoctor(createForm);
      setFeedback({ type: 'success', text: `Dr. ${createForm.firstName} ${createForm.lastName} enregistré avec succès.` });
      setIsCreateOpen(false);
      setCreateForm({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        specialty: 'Médecine Générale',
        licenseNb: '',
        phone: '',
      });
      fetchDoctors();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Erreur lors de la création du médecin.',
      });
    }
  };

  const handleOpenEdit = (doc: any) => {
    setEditingDoctor(doc);
    setEditForm({
      firstName: doc.firstName,
      lastName: doc.lastName,
      specialty: doc.specialty,
      phone: doc.phone || '',
      isActive: doc.user?.isActive ?? true,
    });
    setIsEditOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoctor) return;

    try {
      setFeedback(null);
      await apiService.updateAdminDoctor(editingDoctor.id, editForm);
      setFeedback({ type: 'success', text: 'Informations du praticien mises à jour avec succès.' });
      setIsEditOpen(false);
      fetchDoctors();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Erreur lors de la mise à jour.',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#123B65]">Corps Médical & Spécialistes</h2>
          <p className="text-xs text-gray-500">Supervision des comptes médecins, affectation et spécialités</p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#123B65] hover:bg-[#0e2c4d] text-white rounded-2xl text-xs font-bold transition shadow-sm cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          Ajouter un Médecin
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

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher nom, spécialité, licence..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-xs text-gray-800 outline-none focus:border-[#2585D8]"
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 font-medium text-gray-700 outline-none"
          >
            <option value="ALL">Tous les statuts</option>
            <option value="ACTIVE">Actif (autorisé)</option>
            <option value="INACTIVE">Désactivé</option>
          </select>

          <button
            onClick={fetchDoctors}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-50 transition cursor-pointer"
            title="Actualiser"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center text-gray-400 text-xs">
            <RefreshCw className="w-6 h-6 animate-spin mb-2 text-[#2585D8]" />
            Chargement des praticiens...
          </div>
        ) : doctors.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-xs">
            Aucun médecin trouvé.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50 text-gray-400 uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-6">Praticien</th>
                  <th className="py-3.5 px-4">Spécialité</th>
                  <th className="py-3.5 px-4">N° Licence / Ordre</th>
                  <th className="py-3.5 px-4">Téléphone</th>
                  <th className="py-3.5 px-4">État Compte</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {doctors.map((doc) => {
                  const isActive = doc.user?.isActive;

                  return (
                    <tr key={doc.id} className="hover:bg-gray-50/60 transition">
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs">
                            <Stethoscope className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold text-gray-900 block">
                              Dr. {doc.firstName} {doc.lastName}
                            </span>
                            <span className="text-[11px] text-gray-400">{doc.user?.email}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded-md text-[11px]">
                          {doc.specialty}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-gray-600 text-[11px]">
                        {doc.licenseNb}
                      </td>

                      <td className="py-3.5 px-4 text-gray-600">
                        {doc.phone || <span className="text-gray-300">-</span>}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {isActive ? 'Actif' : 'Désactivé'}
                        </span>
                      </td>

                      <td className="py-3.5 px-6 text-right">
                        <button
                          onClick={() => handleOpenEdit(doc)}
                          className="px-3 py-1.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 font-bold text-xs transition cursor-pointer"
                        >
                          Modifier
                        </button>
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
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 text-base">Enregistrer un Médecin</h3>
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
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Nom *</label>
                  <input
                    type="text"
                    required
                    value={createForm.lastName}
                    onChange={(e) => setCreateForm({ ...createForm, lastName: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Email professionnel *</label>
                  <input
                    type="email"
                    required
                    placeholder="dr.nom@medtec.com"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Mot de Passe *</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Spécialité Médicale *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Cardiologie, Pédiatrie, Chirurgie"
                  value={createForm.specialty}
                  onChange={(e) => setCreateForm({ ...createForm, specialty: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">N° Ordre / Licence *</label>
                  <input
                    type="text"
                    required
                    placeholder="ORD-ALGER-..."
                    value={createForm.licenseNb}
                    onChange={(e) => setCreateForm({ ...createForm, licenseNb: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Téléphone</label>
                  <input
                    type="text"
                    placeholder="+213..."
                    value={createForm.phone}
                    onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs"
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
                  Créer le Compte Médecin
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
              <h3 className="font-bold text-gray-900 text-base">Modifier Praticien</h3>
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

              <div>
                <label className="font-bold text-gray-700 block mb-1">Spécialité</label>
                <input
                  type="text"
                  value={editForm.specialty}
                  onChange={(e) => setEditForm({ ...editForm, specialty: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Téléphone</label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Statut du Compte</label>
                  <select
                    value={editForm.isActive ? 'true' : 'false'}
                    onChange={(e) => setEditForm({ ...editForm, isActive: e.target.value === 'true' })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs"
                  >
                    <option value="true">Actif (autorisé)</option>
                    <option value="false">Désactivé (bloqué)</option>
                  </select>
                </div>
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
    </div>
  );
};

export default DoctorManagement;
