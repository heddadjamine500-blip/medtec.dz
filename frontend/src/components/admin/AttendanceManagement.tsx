import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  X, 
  UserX,
  Settings
} from 'lucide-react';
import { apiService, api } from '../../api/client';

export const AttendanceManagement: React.FC = () => {
  const [attendances, setAttendances] = useState<any[]>([]);
  const [summary, setSummary] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'records' | 'summary'>('records');

  // Filters
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Correction Modal
  const [isCorrectionOpen, setIsCorrectionOpen] = useState<boolean>(false);
  const [correctionTarget, setCorrectionTarget] = useState<any | null>(null);
  const [correctionForm, setCorrectionForm] = useState({
    userId: '',
    attendanceId: '',
    date: '',
    checkInAt: '',
    checkOutAt: '',
    status: 'PRESENT',
    note: '',
  });

  // Mark Absence Modal
  const [isAbsenceOpen, setIsAbsenceOpen] = useState<boolean>(false);
  const [absenceForm, setAbsenceForm] = useState({
    userId: '',
    date: new Date().toISOString().split('T')[0],
    status: 'ABSENT',
    note: '',
  });

  // Schedule Config Modal
  const [isScheduleOpen, setIsScheduleOpen] = useState<boolean>(false);
  const [scheduleUser, setScheduleUser] = useState<any | null>(null);
  const [weeklySchedules, setWeeklySchedules] = useState<any[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState<boolean>(false);

  // All staff list for selectors
  const [staffUsers, setStaffUsers] = useState<any[]>([]);

  const fetchStaff = async () => {
    try {
      const [empRes, docRes] = await Promise.all([
        apiService.getEmployees({ pageSize: 100 }),
        apiService.getAdminDoctors({ pageSize: 100 }),
      ]);
      const list = [
        ...(empRes.employees || []).map((e: any) => ({
          id: e.user.id,
          name: `${e.firstName} ${e.lastName} (${e.jobTitle})`,
          role: 'EMPLOYEE',
        })),
        ...(docRes.doctors || []).map((d: any) => ({
          id: d.user.id,
          name: `Dr. ${d.firstName} ${d.lastName} (${d.specialty})`,
          role: 'DOCTOR',
        })),
      ];
      setStaffUsers(list);
    } catch (err) {
      console.error('Erreur chargement personnel:', err);
    }
  };

  const fetchAttendances = async () => {
    try {
      setLoading(true);
      const res = await apiService.getAdminAttendances({
        role: roleFilter,
        status: statusFilter,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        page,
        pageSize: 20,
      });
      setAttendances(res.attendances || []);
      setTotalPages(res.totalPages || 1);
    } catch (err: any) {
      console.error('Erreur chargement pointages:', err);
      setFeedback({ type: 'error', text: 'Impossible de charger les pointages.' });
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const res = await apiService.getAttendanceSummary({
        role: roleFilter,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      setSummary(res || []);
    } catch (err) {
      console.error('Erreur résumé:', err);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  useEffect(() => {
    if (activeTab === 'records') {
      fetchAttendances();
    } else {
      fetchSummary();
    }
  }, [roleFilter, statusFilter, startDate, endDate, page, activeTab]);

  const handleOpenCorrection = (att?: any) => {
    if (att) {
      setCorrectionTarget(att);
      setCorrectionForm({
        userId: att.userId,
        attendanceId: att.id,
        date: att.date,
        checkInAt: new Date(att.checkInAt).toISOString().slice(0, 16),
        checkOutAt: att.checkOutAt ? new Date(att.checkOutAt).toISOString().slice(0, 16) : '',
        status: att.status,
        note: att.note || '',
      });
    } else {
      setCorrectionTarget(null);
      const now = new Date();
      setCorrectionForm({
        userId: staffUsers[0]?.id || '',
        attendanceId: '',
        date: now.toISOString().split('T')[0],
        checkInAt: now.toISOString().slice(0, 16),
        checkOutAt: '',
        status: 'PRESENT',
        note: '',
      });
    }
    setIsCorrectionOpen(true);
  };

  const handleSaveCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctionForm.note.trim()) {
      setFeedback({ type: 'error', text: 'Une note de justification est obligatoire pour toute correction manuelle.' });
      return;
    }

    try {
      setFeedback(null);
      await apiService.correctAttendance({
        userId: correctionForm.userId,
        attendanceId: correctionForm.attendanceId || undefined,
        date: correctionForm.date,
        checkInAt: new Date(correctionForm.checkInAt).toISOString(),
        checkOutAt: correctionForm.checkOutAt ? new Date(correctionForm.checkOutAt).toISOString() : null,
        status: correctionForm.status,
        note: correctionForm.note,
      });
      setFeedback({ type: 'success', text: 'Pointage corrigé et journalisé avec succès.' });
      setIsCorrectionOpen(false);
      fetchAttendances();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Erreur lors de la correction du pointage.',
      });
    }
  };

  const handleSaveAbsence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!absenceForm.note.trim()) {
      setFeedback({ type: 'error', text: 'Un motif d’absence est requis.' });
      return;
    }

    try {
      setFeedback(null);
      await apiService.markAbsence(absenceForm);
      setFeedback({ type: 'success', text: 'Absence / Congé enregistré avec succès.' });
      setIsAbsenceOpen(false);
      fetchAttendances();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Erreur lors de l’enregistrement.',
      });
    }
  };

  const handleOpenSchedules = async (user: any) => {
    setScheduleUser(user);
    setIsScheduleOpen(true);
    try {
      setScheduleLoading(true);
      const existing = await apiService.getWorkSchedules(user.id);
      
      const weekdays = [
        { weekday: 0, label: 'Dimanche' },
        { weekday: 1, label: 'Lundi' },
        { weekday: 2, label: 'Mardi' },
        { weekday: 3, label: 'Mercredi' },
        { weekday: 4, label: 'Jeudi' },
        { weekday: 5, label: 'Vendredi' },
        { weekday: 6, label: 'Samedi' },
      ];

      const filled = weekdays.map(w => {
        const found = (existing || []).find((s: any) => s.weekday === w.weekday);
        return {
          weekday: w.weekday,
          label: w.label,
          startTime: found?.startTime || '08:00',
          endTime: found?.endTime || '16:00',
          isActive: found ? found.isActive : (w.weekday >= 0 && w.weekday <= 4), // Default Sun-Thu
        };
      });

      setWeeklySchedules(filled);
    } catch (err) {
      console.error('Erreur chargement plannings:', err);
    } finally {
      setScheduleLoading(false);
    }
  };

  const handleSaveSchedules = async () => {
    if (!scheduleUser) return;
    try {
      setFeedback(null);
      await apiService.updateWorkSchedules(
        scheduleUser.id,
        weeklySchedules.map(s => ({
          weekday: s.weekday,
          startTime: s.startTime,
          endTime: s.endTime,
          isActive: s.isActive,
        }))
      );
      setFeedback({ type: 'success', text: 'Horaires de travail mis à jour avec succès.' });
      setIsScheduleOpen(false);
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.response?.data?.message || 'Erreur sauvegarde horaires' });
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await api.get('/admin/attendance/export-csv', {
        params: {
          role: roleFilter,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        },
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv;charset=utf-8;' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `pointages_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Erreur export CSV:', err);
      setFeedback({ type: 'error', text: 'Erreur lors du téléchargement du fichier CSV.' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#123B65]">Système de Pointage & Horaires</h2>
          <p className="text-xs text-gray-500">Contrôle des présences, gestion des retards et journalisation des corrections</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-xs border border-emerald-200 transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Exporter CSV
          </button>

          <button
            onClick={() => setIsAbsenceOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-xs border border-rose-200 transition cursor-pointer"
          >
            <UserX className="w-4 h-4" />
            Marquer Absence / Congé
          </button>

          <button
            onClick={() => handleOpenCorrection()}
            className="flex items-center gap-2 px-4 py-2 bg-[#123B65] hover:bg-[#0e2c4d] text-white rounded-2xl text-xs font-bold transition shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Saisie Manuelle
          </button>
        </div>
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

      {/* Tabs & Filters */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('records')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'records' ? 'bg-[#123B65] text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            Enregistrements Détaillés
          </button>
          <button
            onClick={() => setActiveTab('summary')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'summary' ? 'bg-[#123B65] text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            Résumé par Collaborateur
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="text-xs bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-700 outline-none"
          >
            <option value="ALL">Tous les corps (Médecins & Employés)</option>
            <option value="DOCTOR">Médecins uniquement</option>
            <option value="EMPLOYEE">Employés uniquement</option>
          </select>

          {activeTab === 'records' && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-700 outline-none"
            >
              <option value="ALL">Tous les statuts</option>
              <option value="PRESENT">Présent (À l'heure)</option>
              <option value="LATE">En Retard</option>
              <option value="ABSENT">Absent</option>
              <option value="LEAVE">En Congé</option>
            </select>
          )}

          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="text-xs bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1.5 text-gray-700 outline-none"
            title="Date de début"
          />

          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="text-xs bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1.5 text-gray-700 outline-none"
            title="Date de fin"
          />

          <button
            onClick={() => { if (activeTab === 'records') fetchAttendances(); else fetchSummary(); }}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-50 transition cursor-pointer"
            title="Actualiser"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === 'records' ? (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center text-gray-400 text-xs">
              <RefreshCw className="w-6 h-6 animate-spin mb-2 text-[#2585D8]" />
              Chargement des pointages...
            </div>
          ) : attendances.length === 0 ? (
            <div className="p-12 text-center text-gray-400 text-xs">
              Aucun pointage trouvé pour les filtres sélectionnés.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50 text-gray-400 uppercase tracking-wider text-[11px]">
                    <th className="py-3.5 px-6">Collaborateur</th>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4">Arrivée</th>
                    <th className="py-3.5 px-4">Départ</th>
                    <th className="py-3.5 px-4">Statut</th>
                    <th className="py-3.5 px-4">Source</th>
                    <th className="py-3.5 px-4">Justification</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {attendances.map((att) => {
                    const u = att.user;
                    let name = u?.email;
                    let roleTitle = u?.role;
                    if (u?.doctorInfo) {
                      name = `Dr. ${u.doctorInfo.firstName} ${u.doctorInfo.lastName}`;
                      roleTitle = u.doctorInfo.specialty;
                    } else if (u?.employeeInfo) {
                      name = `${u.employeeInfo.firstName} ${u.employeeInfo.lastName}`;
                      roleTitle = `${u.employeeInfo.jobTitle} (${u.employeeInfo.employeeCode})`;
                    }

                    const checkIn = new Date(att.checkInAt);
                    const checkOut = att.checkOutAt ? new Date(att.checkOutAt) : null;

                    return (
                      <tr key={att.id} className="hover:bg-gray-50/60 transition">
                        <td className="py-3.5 px-6">
                          <span className="font-bold text-gray-900 block">{name}</span>
                          <span className="text-[11px] text-gray-400">{roleTitle}</span>
                        </td>

                        <td className="py-3.5 px-4 font-bold text-gray-700">{att.date}</td>

                        <td className="py-3.5 px-4 text-gray-700">
                          {checkIn.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>

                        <td className="py-3.5 px-4 text-gray-700">
                          {checkOut ? checkOut.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (
                            <span className="text-emerald-600 font-bold">En cours...</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            att.status === 'PRESENT' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            att.status === 'LATE' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                            att.status === 'ABSENT' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                            'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}>
                            {att.status}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-gray-500">
                          {att.source === 'ADMIN' ? (
                            <span className="text-purple-600 font-semibold text-[11px]">ADMIN (Corrigé)</span>
                          ) : (
                            <span className="text-gray-400 text-[11px]">SELF (Badge)</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-gray-500 text-[11px] max-w-xs truncate">
                          {att.note || '-'}
                        </td>

                        <td className="py-3.5 px-6 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenCorrection(att)}
                              className="px-2.5 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-700 font-bold text-xs transition cursor-pointer"
                              title="Corriger ce pointage"
                            >
                              Corriger
                            </button>
                            <button
                              onClick={() => handleOpenSchedules(att.user)}
                              className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                              title="Configurer Horaires"
                            >
                              <Settings className="w-3.5 h-3.5" />
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
      ) : (
        /* Summary Table */
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50 text-gray-400 uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-6">Collaborateur</th>
                  <th className="py-3.5 px-4">Rôle</th>
                  <th className="py-3.5 px-4">Jours Présents</th>
                  <th className="py-3.5 px-4">Retards</th>
                  <th className="py-3.5 px-4">Absences</th>
                  <th className="py-3.5 px-4">Congés</th>
                  <th className="py-3.5 px-6 text-right">Total Heures</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {summary.map((item) => (
                  <tr key={item.userId} className="hover:bg-gray-50/60 transition">
                    <td className="py-3.5 px-6 font-bold text-gray-900">
                      {item.name}
                      <span className="block text-[11px] text-gray-400 font-normal">{item.email}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 font-bold text-[10px]">
                        {item.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-emerald-700">{item.daysPresent}</td>
                    <td className="py-3.5 px-4 font-bold text-amber-700">{item.lates}</td>
                    <td className="py-3.5 px-4 font-bold text-rose-700">{item.absences}</td>
                    <td className="py-3.5 px-4 font-bold text-blue-700">{item.leaves}</td>
                    <td className="py-3.5 px-6 text-right font-mono font-bold text-gray-900">
                      {item.totalHours} h
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CORRECTION / MANUAL ENTRY MODAL */}
      {isCorrectionOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 text-base">
                {correctionTarget ? 'Corriger le Pointage' : 'Saisie Manuelle de Pointage'}
              </h3>
              <button onClick={() => setIsCorrectionOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCorrection} className="space-y-3.5 text-xs">
              {!correctionTarget && (
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Collaborateur *</label>
                  <select
                    value={correctionForm.userId}
                    onChange={(e) => setCorrectionForm({ ...correctionForm, userId: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs"
                  >
                    {staffUsers.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="font-bold text-gray-700 block mb-1">Date du Jour * (YYYY-MM-DD)</label>
                <input
                  type="date"
                  required
                  value={correctionForm.date}
                  onChange={(e) => setCorrectionForm({ ...correctionForm, date: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Heure Arrivée *</label>
                  <input
                    type="datetime-local"
                    required
                    value={correctionForm.checkInAt}
                    onChange={(e) => setCorrectionForm({ ...correctionForm, checkInAt: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Heure Départ</label>
                  <input
                    type="datetime-local"
                    value={correctionForm.checkOutAt}
                    onChange={(e) => setCorrectionForm({ ...correctionForm, checkOutAt: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Statut *</label>
                <select
                  value={correctionForm.status}
                  onChange={(e) => setCorrectionForm({ ...correctionForm, status: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs"
                >
                  <option value="PRESENT">PRESENT (Présent à l'heure)</option>
                  <option value="LATE">LATE (En retard)</option>
                  <option value="ABSENT">ABSENT</option>
                  <option value="LEAVE">LEAVE (Congé autorisé)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-rose-700 block mb-1">
                  Motif & Justification Obligatoire * (écrit dans AuditLog)
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Ex: Oubli de badge constaté à la loge, confirmation par le chef de service..."
                  value={correctionForm.note}
                  onChange={(e) => setCorrectionForm({ ...correctionForm, note: e.target.value })}
                  className="w-full bg-rose-50/40 border border-rose-200 rounded-xl px-3 py-2 text-xs text-gray-800 outline-none focus:border-rose-400"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCorrectionOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#123B65] text-white font-bold hover:bg-[#0e2c4d] cursor-pointer"
                >
                  Valider et Journaliser
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MARK ABSENCE MODAL */}
      {isAbsenceOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 text-base">Marquer une Absence ou un Congé</h3>
              <button onClick={() => setIsAbsenceOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAbsence} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Collaborateur *</label>
                <select
                  value={absenceForm.userId}
                  onChange={(e) => setAbsenceForm({ ...absenceForm, userId: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs"
                >
                  <option value="">Sélectionnez un collaborateur...</option>
                  {staffUsers.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={absenceForm.date}
                    onChange={(e) => setAbsenceForm({ ...absenceForm, date: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Type d'état</label>
                  <select
                    value={absenceForm.status}
                    onChange={(e) => setAbsenceForm({ ...absenceForm, status: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs"
                  >
                    <option value="ABSENT">Absence Injustifiée</option>
                    <option value="LEAVE">Congé / Absence Autorisée</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Motif / Justification *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Ex: Arrêt maladie transmis / Congé annuel validé"
                  value={absenceForm.note}
                  onChange={(e) => setAbsenceForm({ ...absenceForm, note: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAbsenceOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700 cursor-pointer"
                >
                  Enregistrer l'Absence
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SCHEDULES CONFIG MODAL */}
      {isScheduleOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-gray-900 text-base">Horaires de Travail Prévus</h3>
                <p className="text-xs text-gray-500">Sert à la détection automatique des retards (+10 min)</p>
              </div>
              <button onClick={() => setIsScheduleOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-3 text-xs">
              {scheduleLoading ? (
                <div className="py-12 flex justify-center text-gray-400">
                  <RefreshCw className="w-5 h-5 animate-spin" />
                </div>
              ) : (
                weeklySchedules.map((day, idx) => (
                  <div key={day.weekday} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={day.isActive}
                        onChange={(e) => {
                          const copy = [...weeklySchedules];
                          copy[idx].isActive = e.target.checked;
                          setWeeklySchedules(copy);
                        }}
                        className="rounded text-[#2585D8]"
                      />
                      <span className="font-bold text-gray-800 w-24">{day.label}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        disabled={!day.isActive}
                        value={day.startTime}
                        onChange={(e) => {
                          const copy = [...weeklySchedules];
                          copy[idx].startTime = e.target.value;
                          setWeeklySchedules(copy);
                        }}
                        className="bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs disabled:opacity-40"
                      />
                      <span className="text-gray-400">à</span>
                      <input
                        type="time"
                        disabled={!day.isActive}
                        value={day.endTime}
                        onChange={(e) => {
                          const copy = [...weeklySchedules];
                          copy[idx].endTime = e.target.value;
                          setWeeklySchedules(copy);
                        }}
                        className="bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs disabled:opacity-40"
                      />
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setIsScheduleOpen(false)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 cursor-pointer"
              >
                Fermer
              </button>
              <button
                onClick={handleSaveSchedules}
                className="px-5 py-2 rounded-xl bg-[#123B65] text-white font-bold hover:bg-[#0e2c4d] cursor-pointer"
              >
                Enregistrer les Horaires
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceManagement;
