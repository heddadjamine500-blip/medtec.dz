import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { apiService } from '../api/client';
import ClockInCard from './ClockInCard';
import MedicalLogo from './MedicalLogo';
import { 
  Calendar, 
  LogOut, 
  ShieldCheck, 
  Briefcase, 
  Building2, 
  RefreshCw 
} from 'lucide-react';

export const EmployeeDashboard: React.FC = () => {
  const { user, logout } = useAuthStore();
  const [attendances, setAttendances] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await apiService.getMyAttendances({ page, pageSize: 15 });
      setAttendances(res.attendances || []);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      console.error('Erreur chargement historique pointage:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [page]);

  const emp = user?.employeeInfo;

  return (
    <div className="min-h-screen bg-[#F5F8FC] font-sans">
      {/* Top Navigation */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MedicalLogo size={36} showText={true} />
            <span className="hidden sm:inline-block px-3 py-1 bg-purple-50 text-purple-700 font-bold text-xs rounded-full border border-purple-100">
              Espace Personnel & Collaborateur
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <span className="block text-xs font-bold text-gray-900">
                {emp?.firstName ? `${emp.firstName} ${emp.lastName}` : user?.email}
              </span>
              <span className="block text-[11px] text-gray-500 font-medium">
                Matricule: {emp?.employeeCode || 'N/A'} &bull; {emp?.jobTitle || 'EMPLOYÉ'}
              </span>
            </div>

            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 text-gray-600 hover:text-rose-600 hover:border-rose-200 text-xs font-bold transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Quitter</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Employee Profile Summary */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xl">
                  {emp?.firstName ? emp.firstName[0] : 'E'}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#123B65]">
                    {emp?.firstName ? `${emp.firstName} ${emp.lastName}` : 'Collaborateur'}
                  </h2>
                  <p className="text-xs text-gray-500 font-medium">{user?.email}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs py-2 border-b border-gray-50">
                  <span className="text-gray-500 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-gray-400" /> Poste
                  </span>
                  <span className="font-bold text-gray-800">{emp?.jobTitle || 'N/A'}</span>
                </div>

                <div className="flex items-center justify-between text-xs py-2 border-b border-gray-50">
                  <span className="text-gray-500 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-gray-400" /> Département
                  </span>
                  <span className="font-bold text-gray-800">{emp?.department || 'Général'}</span>
                </div>

                <div className="flex items-center justify-between text-xs py-2 border-b border-gray-50">
                  <span className="text-gray-500 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" /> Statut contrat
                  </span>
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded-md text-[11px]">
                    {emp?.status || 'ACTIF'}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 text-[11px] text-gray-400 text-center">
              Compte hospitalier MEDTEC sécurisé
            </div>
          </div>

          {/* Clock In/Out Live Card (Takes 2 cols on lg) */}
          <div className="lg:col-span-2">
            <ClockInCard />
          </div>
        </div>

        {/* History of attendances */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#123B65] flex items-center justify-center">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-base">Historique de vos Pointages</h3>
                <p className="text-xs text-gray-500">Heures d'arrivée, de départ et état de présence</p>
              </div>
            </div>

            <button
              onClick={fetchHistory}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-bold transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Actualiser</span>
            </button>
          </div>

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-gray-400 text-xs">
              <RefreshCw className="w-6 h-6 animate-spin mb-2 text-[#2585D8]" />
              Chargement de votre historique...
            </div>
          ) : attendances.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-xs">
              Aucun enregistrement de pointage pour le moment.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Arrivée</th>
                    <th className="py-3 px-4">Départ</th>
                    <th className="py-3 px-4">Durée</th>
                    <th className="py-3 px-4">Statut</th>
                    <th className="py-3 px-4">Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {attendances.map((item) => {
                    const checkIn = new Date(item.checkInAt);
                    const checkOut = item.checkOutAt ? new Date(item.checkOutAt) : null;
                    let durationMinutes = 0;
                    if (checkOut) {
                      durationMinutes = Math.round((checkOut.getTime() - checkIn.getTime()) / (1000 * 60));
                    }
                    const hours = Math.floor(durationMinutes / 60);
                    const mins = durationMinutes % 60;

                    return (
                      <tr key={item.id} className="hover:bg-gray-50/50 transition">
                        <td className="py-3 px-4 font-bold text-gray-800">{item.date}</td>
                        <td className="py-3 px-4 text-gray-600">
                          {checkIn.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {checkOut ? checkOut.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (
                            <span className="text-emerald-600 font-bold">En cours...</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-gray-600 font-medium">
                          {checkOut ? `${hours}h ${mins}m` : '-'}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            item.status === 'PRESENT' ? 'bg-emerald-50 text-emerald-700' :
                            item.status === 'LATE' ? 'bg-amber-50 text-amber-700' :
                            item.status === 'ABSENT' ? 'bg-rose-50 text-rose-700' : 'bg-blue-50 text-blue-700'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-400">
                          {item.source}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 text-xs">
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
      </main>
    </div>
  );
};

export default EmployeeDashboard;
