import React, { useState, useEffect } from 'react';
import { Clock, Play, Square, CheckCircle2, AlertCircle, RefreshCw, Calendar } from 'lucide-react';
import { apiService } from '../api/client';

export const ClockInCard: React.FC = () => {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [durationStr, setDurationStr] = useState<string>('00:00:00');

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await apiService.getMyAttendanceStatus();
      setStatus(res);
    } catch (err: any) {
      console.error('Erreur chargement statut pointage:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  // Live timer if clocked in
  useEffect(() => {
    if (!status?.isClockedIn || !status?.currentAttendance?.checkInAt) {
      setDurationStr('00:00:00');
      return;
    }

    const checkInTime = new Date(status.currentAttendance.checkInAt).getTime();

    const interval = setInterval(() => {
      const diff = Math.max(0, Date.now() - checkInTime);
      const hours = Math.floor(diff / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setDurationStr(
        `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [status]);

  const handleClockIn = async () => {
    try {
      setActionLoading(true);
      setMessage(null);
      await apiService.clockIn();
      setMessage({ type: 'success', text: 'Pointage d’arrivée enregistré avec succès !' });
      await fetchStatus();
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Erreur lors du pointage d’arrivée.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleClockOut = async () => {
    try {
      setActionLoading(true);
      setMessage(null);
      await apiService.clockOut();
      setMessage({ type: 'success', text: 'Pointage de départ enregistré avec succès !' });
      await fetchStatus();
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Erreur lors du pointage de départ.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 relative overflow-hidden">
      {/* Decorative accent */}
      <div className={`absolute top-0 left-0 right-0 h-1.5 ${status?.isClockedIn ? 'bg-emerald-500' : 'bg-slate-300'}`} />

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
            status?.isClockedIn ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-[#123B65]'
          }`}>
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-sm">Système de Pointage</h3>
            <p className="text-xs text-gray-500">Badgeuse horaire sécurisée</p>
          </div>
        </div>

        <button
          onClick={fetchStatus}
          disabled={loading || actionLoading}
          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition cursor-pointer"
          title="Actualiser"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded-2xl text-xs font-medium flex items-center gap-2 ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      {loading && !status ? (
        <div className="py-6 flex flex-col items-center justify-center text-gray-400 text-xs">
          <RefreshCw className="w-5 h-5 animate-spin mb-2 text-[#2585D8]" />
          Chargement du statut...
        </div>
      ) : (
        <div>
          <div className="bg-[#F8FAFC] rounded-2xl p-4 mb-4 flex items-center justify-between border border-gray-100">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-0.5">
                Statut actuel
              </span>
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${status?.isClockedIn ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
                <span className="font-bold text-xs text-gray-800">
                  {status?.isClockedIn ? 'En service (Présent)' : 'Non pointé / Départ effectué'}
                </span>
              </div>
            </div>

            {status?.isClockedIn && (
              <div className="text-right">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-0.5">
                  Durée de service
                </span>
                <span className="font-mono font-bold text-sm text-emerald-600">
                  {durationStr}
                </span>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleClockIn}
              disabled={status?.isClockedIn || actionLoading}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-xs font-bold transition-all shadow-sm ${
                status?.isClockedIn
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20 hover:scale-[1.02] cursor-pointer'
              }`}
            >
              <Play className="w-4 h-4 fill-current" />
              Pointer l'Arrivée
            </button>

            <button
              onClick={handleClockOut}
              disabled={!status?.isClockedIn || actionLoading}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-xs font-bold transition-all shadow-sm ${
                !status?.isClockedIn
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/20 hover:scale-[1.02] cursor-pointer'
              }`}
            >
              <Square className="w-4 h-4 fill-current" />
              Pointer le Départ
            </button>
          </div>

          {/* Today history summary */}
          {status?.todayRecords && status.todayRecords.length > 0 && (
            <div className="mt-4 pt-3 border-t border-gray-100">
              <span className="text-[11px] font-bold text-gray-400 flex items-center gap-1 mb-2">
                <Calendar className="w-3.5 h-3.5" /> Pointages aujourd'hui ({status.todayRecords.length})
              </span>
              <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
                {status.todayRecords.map((r: any) => (
                  <div key={r.id} className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-gray-50 border border-gray-100 text-gray-600">
                    <span className="font-medium">
                      {new Date(r.checkInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {r.checkOutAt ? ` → ${new Date(r.checkOutAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ' → En cours'}
                    </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      r.status === 'LATE' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {r.status === 'LATE' ? 'Retard' : 'À l’heure'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ClockInCard;
