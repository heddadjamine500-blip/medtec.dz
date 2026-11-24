import React, { useState, useEffect } from 'react';
import { 
  DoorClosed, 
  Plus, 
  Calendar, 
  Trash2, 
  Edit2, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Clock, 
  X,
  Filter
} from 'lucide-react';
import { apiService } from '../../api/client';

export const RoomManagement: React.FC = () => {
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modals state
  const [isRoomModalOpen, setIsRoomModalOpen] = useState<boolean>(false);
  const [editingRoom, setEditingRoom] = useState<any | null>(null);
  const [roomFormData, setRoomFormData] = useState({
    name: '',
    type: 'CONSULTATION',
    floor: 0,
    capacity: 1,
    status: 'AVAILABLE',
    notes: '',
  });

  // Booking Modal state
  const [isBookingModalOpen, setIsBookingModalOpen] = useState<boolean>(false);
  const [bookingRoom, setBookingRoom] = useState<any | null>(null);
  const [bookingFormData, setBookingFormData] = useState({
    startAt: '',
    endAt: '',
    purpose: '',
  });

  // Schedule View Modal
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState<boolean>(false);
  const [selectedRoomSchedule, setSelectedRoomSchedule] = useState<any | null>(null);
  const [roomBookings, setRoomBookings] = useState<any[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState<boolean>(false);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const res = await apiService.getRooms({
        type: typeFilter,
        status: statusFilter,
      });
      setRooms(res || []);
    } catch (err: any) {
      console.error('Erreur chargement salles:', err);
      setFeedback({ type: 'error', text: 'Impossible de charger la liste des salles.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, [typeFilter, statusFilter]);

  const handleOpenRoomModal = (room?: any) => {
    if (room) {
      setEditingRoom(room);
      setRoomFormData({
        name: room.name,
        type: room.type,
        floor: room.floor ?? 0,
        capacity: room.capacity ?? 1,
        status: room.status,
        notes: room.notes || '',
      });
    } else {
      setEditingRoom(null);
      setRoomFormData({
        name: '',
        type: 'CONSULTATION',
        floor: 1,
        capacity: 2,
        status: 'AVAILABLE',
        notes: '',
      });
    }
    setIsRoomModalOpen(true);
  };

  const handleSaveRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setFeedback(null);
      if (editingRoom) {
        await apiService.updateRoom(editingRoom.id, {
          ...roomFormData,
          floor: Number(roomFormData.floor),
          capacity: Number(roomFormData.capacity),
        });
        setFeedback({ type: 'success', text: 'Salle mise à jour avec succès.' });
      } else {
        await apiService.createRoom({
          ...roomFormData,
          floor: Number(roomFormData.floor),
          capacity: Number(roomFormData.capacity),
        });
        setFeedback({ type: 'success', text: 'Nouvelle salle créée avec succès.' });
      }
      setIsRoomModalOpen(false);
      fetchRooms();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Erreur lors de la sauvegarde de la salle.',
      });
    }
  };

  const handleDeleteRoom = async (room: any) => {
    if (!window.confirm(`Confirmez-vous la suppression de la salle "${room.name}" ?`)) return;
    try {
      setFeedback(null);
      await apiService.deleteRoom(room.id);
      setFeedback({ type: 'success', text: 'Salle supprimée avec succès.' });
      fetchRooms();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Erreur lors de la suppression.',
      });
    }
  };

  const handleOpenBookingModal = (room: any) => {
    setBookingRoom(room);
    const now = new Date();
    // Default: Next full hour
    const start = new Date(now.getTime() + 3600000);
    start.setMinutes(0, 0, 0);
    const end = new Date(start.getTime() + 3600000);

    setBookingFormData({
      startAt: start.toISOString().slice(0, 16),
      endAt: end.toISOString().slice(0, 16),
      purpose: '',
    });
    setIsBookingModalOpen(true);
  };

  const handleSaveBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingRoom) return;

    try {
      setFeedback(null);
      await apiService.createRoomBooking({
        roomId: bookingRoom.id,
        startAt: new Date(bookingFormData.startAt).toISOString(),
        endAt: new Date(bookingFormData.endAt).toISOString(),
        purpose: bookingFormData.purpose,
      });
      setFeedback({ type: 'success', text: `Réservation confirmée pour la salle ${bookingRoom.name}.` });
      setIsBookingModalOpen(false);
      fetchRooms();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Erreur lors de la réservation (chevauchement ou indisponibilité).',
      });
    }
  };

  const handleViewSchedule = async (room: any) => {
    setSelectedRoomSchedule(room);
    setIsScheduleModalOpen(true);
    try {
      setScheduleLoading(true);
      const res = await apiService.getRoomBookings({ roomId: room.id });
      setRoomBookings(res.bookings || []);
    } catch (err) {
      console.error('Erreur chargement planning:', err);
    } finally {
      setScheduleLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!window.confirm('Voulez-vous vraiment annuler cette réservation ?')) return;
    try {
      await apiService.cancelRoomBooking(bookingId);
      setFeedback({ type: 'success', text: 'Réservation annulée avec succès.' });
      if (selectedRoomSchedule) {
        handleViewSchedule(selectedRoomSchedule);
      }
      fetchRooms();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.response?.data?.message || 'Erreur annulation' });
    }
  };

  const stats = {
    total: rooms.length,
    available: rooms.filter(r => r.displayStatus === 'AVAILABLE').length,
    occupied: rooms.filter(r => r.displayStatus === 'OCCUPIED').length,
    maintenance: rooms.filter(r => r.displayStatus === 'MAINTENANCE' || r.displayStatus === 'CLOSED').length,
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#123B65]">Gestion des Salles & Blocs</h2>
          <p className="text-xs text-gray-500">Planification des blocs opératoires, cabinets de consultation et unités de soin</p>
        </div>

        <button
          onClick={() => handleOpenRoomModal()}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#123B65] hover:bg-[#0e2c4d] text-white rounded-2xl text-xs font-bold transition shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Ajouter une Salle
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Total Salles</span>
          <span className="text-2xl font-black text-[#123B65]">{stats.total}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">Disponibles</span>
          <span className="text-2xl font-black text-emerald-600">{stats.available}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block">Occupées</span>
          <span className="text-2xl font-black text-blue-600">{stats.occupied}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider block">Maintenance / Fermé</span>
          <span className="text-2xl font-black text-amber-600">{stats.maintenance}</span>
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
          <button onClick={() => setFeedback(null)} className="text-gray-400 hover:text-gray-600 text-sm">×</button>
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-bold text-gray-500 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5" /> Filtres :
          </span>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 font-medium text-gray-700 outline-none focus:border-[#2585D8]"
          >
            <option value="ALL">Tous les types</option>
            <option value="CONSULTATION">Consultation</option>
            <option value="OPERATING">Bloc Opératoire</option>
            <option value="WARD">Hospitalisation (Ward)</option>
            <option value="EMERGENCY">Urgences</option>
            <option value="ICU">Soins Intensifs (ICU)</option>
            <option value="LAB">Laboratoire</option>
            <option value="OTHER">Autre</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 font-medium text-gray-700 outline-none focus:border-[#2585D8]"
          >
            <option value="ALL">Tous les statuts</option>
            <option value="AVAILABLE">Disponible</option>
            <option value="OCCUPIED">Occupée (En cours)</option>
            <option value="MAINTENANCE">Maintenance</option>
            <option value="CLOSED">Fermée</option>
          </select>
        </div>

        <button
          onClick={fetchRooms}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl transition cursor-pointer"
          title="Actualiser"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Rooms Grid */}
      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center text-gray-400 text-xs">
          <RefreshCw className="w-6 h-6 animate-spin mb-2 text-[#2585D8]" />
          Chargement des salles...
        </div>
      ) : rooms.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 text-gray-400 text-xs">
          Aucune salle trouvée. Cliquez sur "Ajouter une Salle" pour commencer.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room) => {
            const isOccupied = room.displayStatus === 'OCCUPIED';
            const isAvailable = room.displayStatus === 'AVAILABLE';

            return (
              <div
                key={room.id}
                className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold ${
                        isAvailable ? 'bg-emerald-50 text-emerald-600' :
                        isOccupied ? 'bg-blue-50 text-[#2585D8]' : 'bg-amber-50 text-amber-600'
                      }`}>
                        <DoorClosed className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-base">{room.name}</h3>
                        <p className="text-xs text-gray-500">
                          Étage {room.floor ?? 0} &bull; Capacité: {room.capacity || 1} pers.
                        </p>
                      </div>
                    </div>

                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      isAvailable ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      isOccupied ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                      'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {room.displayStatus}
                    </span>
                  </div>

                  <div className="bg-gray-50 rounded-2xl p-3 text-xs mb-4 space-y-1">
                    <div className="flex justify-between text-gray-500">
                      <span>Type d'activité:</span>
                      <span className="font-semibold text-gray-700">{room.type}</span>
                    </div>
                    {room.notes && (
                      <div className="text-[11px] text-gray-400 italic pt-1">
                        "{room.notes}"
                      </div>
                    )}
                    {isOccupied && room.currentBooking && (
                      <div className="pt-2 border-t border-gray-200/60 mt-2 text-[11px] text-blue-800">
                        <span className="font-bold flex items-center gap-1">
                          <Clock className="w-3 h-3 text-blue-600" />
                          Réservation en cours:
                        </span>
                        <div className="font-medium text-gray-600">
                          {room.currentBooking.purpose}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleViewSchedule(room)}
                      className="px-3 py-1.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold text-xs flex items-center gap-1 transition cursor-pointer"
                    >
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      Planning
                    </button>
                    <button
                      onClick={() => handleOpenBookingModal(room)}
                      disabled={room.status !== 'AVAILABLE'}
                      className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#2585D8] font-bold text-xs disabled:opacity-40 transition cursor-pointer"
                    >
                      Réserver
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenRoomModal(room)}
                      className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-50 transition cursor-pointer"
                      title="Modifier"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteRoom(room)}
                      className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                      title="Supprimer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE / EDIT ROOM MODAL */}
      {isRoomModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-gray-900 text-base">
                {editingRoom ? 'Modifier la Salle' : 'Ajouter une Nouvelle Salle'}
              </h3>
              <button onClick={() => setIsRoomModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRoom} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Nom / Identifiant de la Salle *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Salle 204 - Bloc Cardiaque"
                  value={roomFormData.name}
                  onChange={(e) => setRoomFormData({ ...roomFormData, name: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs text-gray-800 outline-none focus:border-[#2585D8]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Type de Salle</label>
                  <select
                    value={roomFormData.type}
                    onChange={(e) => setRoomFormData({ ...roomFormData, type: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 outline-none focus:border-[#2585D8]"
                  >
                    <option value="CONSULTATION">Consultation</option>
                    <option value="OPERATING">Bloc Opératoire</option>
                    <option value="WARD">Hospitalisation</option>
                    <option value="EMERGENCY">Urgences</option>
                    <option value="ICU">Soins Intensifs</option>
                    <option value="LAB">Laboratoire</option>
                    <option value="OTHER">Autre</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Statut Initial</label>
                  <select
                    value={roomFormData.status}
                    onChange={(e) => setRoomFormData({ ...roomFormData, status: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 outline-none focus:border-[#2585D8]"
                  >
                    <option value="AVAILABLE">Disponible</option>
                    <option value="MAINTENANCE">Maintenance</option>
                    <option value="CLOSED">Fermée</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Étage</label>
                  <input
                    type="number"
                    value={roomFormData.floor}
                    onChange={(e) => setRoomFormData({ ...roomFormData, floor: Number(e.target.value) })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 outline-none focus:border-[#2585D8]"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Capacité (personnes)</label>
                  <input
                    type="number"
                    min="1"
                    value={roomFormData.capacity}
                    onChange={(e) => setRoomFormData({ ...roomFormData, capacity: Number(e.target.value) })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 outline-none focus:border-[#2585D8]"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Notes & Équipements</label>
                <textarea
                  rows={2}
                  placeholder="Équipements spécifiques, précautions..."
                  value={roomFormData.notes}
                  onChange={(e) => setRoomFormData({ ...roomFormData, notes: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 outline-none focus:border-[#2585D8]"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsRoomModalOpen(false)}
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

      {/* BOOKING MODAL */}
      {isBookingModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-gray-900 text-base">Réserver la Salle</h3>
                <p className="text-xs text-gray-500 font-medium">{bookingRoom?.name}</p>
              </div>
              <button onClick={() => setIsBookingModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBooking} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Date et Heure de Début *</label>
                <input
                  type="datetime-local"
                  required
                  value={bookingFormData.startAt}
                  onChange={(e) => setBookingFormData({ ...bookingFormData, startAt: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 outline-none focus:border-[#2585D8]"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Date et Heure de Fin *</label>
                <input
                  type="datetime-local"
                  required
                  value={bookingFormData.endAt}
                  onChange={(e) => setBookingFormData({ ...bookingFormData, endAt: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 outline-none focus:border-[#2585D8]"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Motif de la Réservation *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Intervention chirurgicale d'urgence"
                  value={bookingFormData.purpose}
                  onChange={(e) => setBookingFormData({ ...bookingFormData, purpose: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs text-gray-800 outline-none focus:border-[#2585D8]"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsBookingModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#2585D8] text-white font-bold hover:bg-[#1d6fb8] cursor-pointer"
                >
                  Confirmer la Réservation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SCHEDULE VIEW MODAL */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-gray-100 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-gray-900 text-base">Planning des Réservations</h3>
                <p className="text-xs text-gray-500">{selectedRoomSchedule?.name}</p>
              </div>
              <button onClick={() => setIsScheduleModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4">
              {scheduleLoading ? (
                <div className="py-12 flex justify-center text-gray-400 text-xs">
                  <RefreshCw className="w-5 h-5 animate-spin" />
                </div>
              ) : roomBookings.length === 0 ? (
                <div className="py-12 text-center text-gray-400 text-xs">
                  Aucune réservation enregistrée pour cette salle.
                </div>
              ) : (
                <div className="space-y-3">
                  {roomBookings.map((b) => {
                    const start = new Date(b.startAt);
                    const end = new Date(b.endAt);
                    const isCancelled = b.status === 'CANCELLED';

                    return (
                      <div
                        key={b.id}
                        className={`p-4 rounded-2xl border text-xs flex items-center justify-between ${
                          isCancelled ? 'bg-gray-50 border-gray-200 opacity-60' : 'bg-blue-50/40 border-blue-100'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-gray-900">{b.purpose}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isCancelled ? 'bg-gray-200 text-gray-600' : 'bg-blue-100 text-blue-700'
                            }`}>
                              {b.status}
                            </span>
                          </div>
                          <p className="text-gray-500 text-[11px]">
                            Du {start.toLocaleDateString()} {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} au {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          {b.bookedByUser && (
                            <p className="text-gray-400 text-[10px] mt-0.5">
                              Réservé par: {b.bookedByUser.email}
                            </p>
                          )}
                        </div>

                        {!isCancelled && (
                          <button
                            onClick={() => handleCancelBooking(b.id)}
                            className="px-3 py-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold text-xs transition cursor-pointer"
                          >
                            Annuler
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomManagement;
