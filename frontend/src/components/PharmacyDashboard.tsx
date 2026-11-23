import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Pill, 
  Package, 
  AlertTriangle, 
  Search, 
  LayoutDashboard, 
  ShoppingCart, 
  Plus, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Edit3, 
  Trash2, 
  FileCheck, 
  Calendar,
  LogOut,
  Loader2
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { apiService } from '../api/client';
import { useAuthStore } from '../store/authStore';

export default function PharmacyDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'inventory' | 'orders' | 'prescriptions' | 'ruptures'>('dashboard');
  const [inventory, setInventory] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // New Item Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemSupplier, setNewItemSupplier] = useState('');
  const [newItemStock, setNewItemStock] = useState('25');
  const [newItemPrice, setNewItemPrice] = useState('4.50');
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemExpiry, setNewItemExpiry] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Edit Item Modal State
  const [editingItem, setEditingItem] = useState<any | null>(null);

  // Toast State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [invData, ordersData, prescsData] = await Promise.all([
        apiService.getInventory(),
        apiService.getOrders(),
        apiService.getPrescriptions().catch(() => []),
      ]);
      setInventory(invData);
      setOrders(ordersData);
      setPrescriptions(prescsData);
    } catch (error) {
      console.error('Erreur pharmacie:', error);
      showToast('Erreur chargement inventaire', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateStock = async (id: string, delta: number) => {
    try {
      await apiService.updateStock(id, delta);
      showToast(`Stock mis à jour (${delta > 0 ? '+' : ''}${delta} boîtes)`, 'success');
      await loadData();
    } catch (error) {
      console.error(error);
      showToast('Erreur lors de la mise à jour du stock', 'error');
    }
  };

  const handleDeliverOrder = async (orderId: string) => {
    try {
      await apiService.updateOrderStatus(orderId, 'DÉLIVRÉ');
      showToast('Commande validée et médicaments délivrés ! Stock décrémenté.', 'success');
      await loadData();
    } catch (error) {
      console.error(error);
      showToast('Erreur lors de la délivrance', 'error');
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName || !newItemPrice) {
      showToast('Nom et prix requis', 'error');
      return;
    }

    try {
      setSubmitting(true);
      await apiService.addInventoryItem({
        name: newItemName,
        supplier: newItemSupplier || 'Laboratoire Partenaire',
        stock: parseInt(newItemStock, 10) || 0,
        price: parseFloat(newItemPrice) || 0,
        description: newItemDesc,
        expiryDate: newItemExpiry || undefined,
      });
      showToast('Nouveau médicament ajouté au catalogue !', 'success');
      setIsModalOpen(false);
      setNewItemName('');
      setNewItemSupplier('');
      setNewItemDesc('');
      setNewItemExpiry('');
      await loadData();
    } catch (error) {
      console.error(error);
      showToast("Erreur lors de l'ajout", 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    try {
      setSubmitting(true);
      await apiService.updateInventoryItem(editingItem.id, {
        name: editingItem.name,
        supplier: editingItem.supplier,
        price: parseFloat(editingItem.price),
        description: editingItem.description,
        expiryDate: editingItem.expiryDate || undefined,
      });
      showToast('Médicament modifié avec succès !', 'success');
      setEditingItem(null);
      await loadData();
    } catch (error) {
      console.error(error);
      showToast('Erreur lors de la modification', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteItem = async (id: string, name: string) => {
    if (!window.confirm(`Confirmez-vous la suppression de ${name} du stock ?`)) return;

    try {
      await apiService.deleteInventoryItem(id);
      showToast('Médicament retiré du stock', 'info');
      await loadData();
    } catch (error) {
      console.error(error);
      showToast('Erreur lors de la suppression', 'error');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const filteredInventory = inventory.filter((item) => {
    const text = `${item.name} ${item.supplier || ''}`.toLowerCase();
    return text.includes(searchQuery.toLowerCase());
  });

  const criticalItems = inventory.filter((i) => i.stock < 10);
  const expiringItems = inventory.filter((i) => i.isExpired || i.isExpiringSoon);

  const pharmacyName = user?.pharmacyInfo?.name || 'Pharmacie Centrale';
  const pharmacyAddress = user?.pharmacyInfo?.address || '12 Boulevard Saint-Germain, Paris';

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
              toast.type === 'error' ? 'bg-red-600 shadow-red-500/20' : 'bg-amber-600 shadow-amber-500/20'
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
            <Pill className="h-7 w-7 text-amber-500 mr-2" strokeWidth={2.5} />
            <span className="text-xl font-black text-[#123B65]">
              PHARMA-TEC
            </span>
          </div>

          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center px-4 py-2.5 rounded-2xl transition-all cursor-pointer ${
                activeTab === 'dashboard' 
                  ? 'bg-amber-500 text-white font-bold shadow-md shadow-amber-500/20' 
                  : 'hover:bg-gray-100 text-gray-600 font-medium'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 mr-3" />
              <span className="text-xs">Tableau de Bord</span>
            </button>

            <button
              onClick={() => setActiveTab('inventory')}
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-2xl transition-all cursor-pointer ${
                activeTab === 'inventory' 
                  ? 'bg-amber-500 text-white font-bold shadow-md shadow-amber-500/20' 
                  : 'hover:bg-gray-100 text-gray-600 font-medium'
              }`}
            >
              <div className="flex items-center">
                <Package className="w-4 h-4 mr-3" />
                <span className="text-xs">Inventaire & Stock</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                activeTab === 'inventory' ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-700'
              }`}>
                {inventory.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-2xl transition-all cursor-pointer ${
                activeTab === 'orders' 
                  ? 'bg-amber-500 text-white font-bold shadow-md shadow-amber-500/20' 
                  : 'hover:bg-gray-100 text-gray-600 font-medium'
              }`}
            >
              <div className="flex items-center">
                <ShoppingCart className="w-4 h-4 mr-3" />
                <span className="text-xs">Commandes</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                activeTab === 'orders' ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-700'
              }`}>
                {orders.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('prescriptions')}
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-2xl transition-all cursor-pointer ${
                activeTab === 'prescriptions' 
                  ? 'bg-amber-500 text-white font-bold shadow-md shadow-amber-500/20' 
                  : 'hover:bg-gray-100 text-gray-600 font-medium'
              }`}
            >
              <div className="flex items-center">
                <FileCheck className="w-4 h-4 mr-3" />
                <span className="text-xs">Vérif. Ordonnances</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                activeTab === 'prescriptions' ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-700'
              }`}>
                {prescriptions.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('ruptures')}
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-2xl transition-all cursor-pointer ${
                activeTab === 'ruptures' 
                  ? 'bg-amber-500 text-white font-bold shadow-md shadow-amber-500/20' 
                  : 'hover:bg-gray-100 text-gray-600 font-medium'
              }`}
            >
              <div className="flex items-center">
                <AlertTriangle className="w-4 h-4 mr-3" />
                <span className="text-xs">Alertes Rupture</span>
              </div>
              {criticalItems.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-red-100 text-red-600">
                  {criticalItems.length}
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
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* Top Header */}
        <header className="h-20 bg-white/70 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-8 z-10">
          <div className="relative w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher médicament, laboratoire..." 
              className="w-full pl-10 pr-4 py-2 rounded-full bg-gray-100/70 border-none text-xs outline-none focus:ring-2 focus:ring-amber-500 transition-all"
            />
          </div>

          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-full text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" /> Ajouter Médicament
            </button>

            <div className="flex items-center space-x-3 border-l border-gray-200 pl-4">
              <div className="text-right hidden md:block">
                <p className="text-xs font-bold text-gray-900">{pharmacyName}</p>
                <p className="text-[11px] text-amber-600 font-semibold">{pharmacyAddress}</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800 font-black text-xs">
                PH
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Views */}
        <div className="flex-1 overflow-y-auto p-8">
          
          {loading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
            </div>
          )}

          {/* TAB 1: DASHBOARD */}
          {!loading && activeTab === 'dashboard' && (
            <div>
              <div className="mb-6">
                <h1 className="text-xl font-black text-gray-900">{pharmacyName}</h1>
                <p className="text-gray-500 text-xs mt-0.5">Supervision des stocks, réapprovisionnements et commandes patients.</p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Références Stockées</p>
                    <h3 className="text-2xl font-black text-gray-900">{inventory.length}</h3>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
                    <Package className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Alertes Rupture</p>
                    <h3 className="text-2xl font-black text-red-600">{criticalItems.length}</h3>
                  </div>
                  <div className="p-3 rounded-xl bg-red-50 text-red-600">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Alertes Péremption</p>
                    <h3 className="text-2xl font-black text-orange-600">{expiringItems.length}</h3>
                  </div>
                  <div className="p-3 rounded-xl bg-orange-50 text-orange-600">
                    <Calendar className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Commandes En Cours</p>
                    <h3 className="text-2xl font-black text-blue-600">{orders.filter(o => o.status !== 'DÉLIVRÉ').length}</h3>
                  </div>
                  <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
                    <ShoppingCart className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Critical Table */}
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-5 border-b border-gray-50 flex justify-between items-center">
                  <div>
                    <h2 className="font-bold text-sm text-gray-900">Articles en Stock Critique (&lt; 10 boîtes)</h2>
                    <p className="text-[11px] text-gray-400">Nécessitent un réapprovisionnement immédiat</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('inventory')}
                    className="text-xs font-bold text-amber-600 hover:underline"
                  >
                    Voir tout le stock
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-gray-50 text-gray-500 uppercase tracking-wider font-bold">
                        <th className="p-3.5">Médicament</th>
                        <th className="p-3.5">Fournisseur</th>
                        <th className="p-3.5">Stock</th>
                        <th className="p-3.5 text-right">Réapprovisionner</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {criticalItems.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50/50">
                          <td className="p-3.5 font-bold text-gray-900">{item.name}</td>
                          <td className="p-3.5 text-gray-500">{item.supplier}</td>
                          <td className="p-3.5 font-mono font-bold text-red-600">{item.stock} boîtes</td>
                          <td className="p-3.5 text-right space-x-1.5">
                            <button
                              onClick={() => handleUpdateStock(item.id, 20)}
                              className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg font-bold cursor-pointer transition-colors"
                            >
                              +20
                            </button>
                            <button
                              onClick={() => handleUpdateStock(item.id, 50)}
                              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold cursor-pointer transition-colors"
                            >
                              +50
                            </button>
                          </td>
                        </tr>
                      ))}
                      {criticalItems.length === 0 && (
                        <tr>
                          <td colSpan={4} className="p-6 text-center text-gray-400">Aucun produit en stock critique</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: INVENTORY TABLE */}
          {!loading && activeTab === 'inventory' && (
            <div className="space-y-4 max-w-5xl">
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-5 border-b border-gray-50 flex justify-between items-center">
                  <div>
                    <h2 className="font-bold text-sm text-gray-900">Catalogue & Inventaire</h2>
                    <p className="text-[11px] text-gray-400">{filteredInventory.length} références répertoriées</p>
                  </div>
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="px-3.5 py-1.5 bg-amber-500 text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer"
                  >
                    + Nouveau Produit
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-gray-50 text-gray-500 uppercase tracking-wider font-bold">
                        <th className="p-3.5">Médicament</th>
                        <th className="p-3.5">Laboratoire</th>
                        <th className="p-3.5">Prix</th>
                        <th className="p-3.5">Stock</th>
                        <th className="p-3.5">Péremption</th>
                        <th className="p-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredInventory.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50/50">
                          <td className="p-3.5">
                            <div className="font-bold text-gray-900">{item.name}</div>
                            {item.description && <div className="text-[10px] text-gray-400">{item.description}</div>}
                          </td>
                          <td className="p-3.5 text-gray-600">{item.supplier}</td>
                          <td className="p-3.5 font-bold text-gray-900">{item.price.toFixed(2)} €</td>
                          <td className="p-3.5 font-mono font-bold">
                            <span className={item.stock < 10 ? 'text-red-600' : 'text-gray-900'}>{item.stock}</span>
                          </td>
                          <td className="p-3.5">
                            {item.expiryDate ? (
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                item.isExpired ? 'bg-red-100 text-red-700' :
                                item.isExpiringSoon ? 'bg-amber-100 text-amber-700' : 'text-gray-500'
                              }`}>
                                {new Date(item.expiryDate).toLocaleDateString('fr-FR')}
                              </span>
                            ) : (
                              <span className="text-gray-400 text-[10px]">-</span>
                            )}
                          </td>
                          <td className="p-3.5 text-right space-x-1">
                            <button
                              onClick={() => handleUpdateStock(item.id, 10)}
                              className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded font-bold cursor-pointer"
                              title="Ajouter 10 boîtes"
                            >
                              +10
                            </button>
                            <button
                              onClick={() => setEditingItem(item)}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded cursor-pointer"
                              title="Modifier"
                            >
                              <Edit3 className="w-3.5 h-3.5 inline" />
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item.id, item.name)}
                              className="p-1 text-red-500 hover:bg-red-50 rounded cursor-pointer"
                              title="Supprimer"
                            >
                              <Trash2 className="w-3.5 h-3.5 inline" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ORDERS */}
          {!loading && activeTab === 'orders' && (
            <div className="space-y-4 max-w-5xl">
              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                <h2 className="text-base font-bold text-gray-900 mb-3">Commandes Patients & Délivrances</h2>
                
                {orders.length === 0 ? (
                  <p className="text-xs text-gray-400 py-8 text-center">Aucune commande en attente.</p>
                ) : (
                  <div className="space-y-3">
                    {orders.map((order) => (
                      <div key={order.id} className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              order.status === 'DÉLIVRÉ' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                            }`}>
                              {order.status}
                            </span>
                            <span className="text-xs text-gray-400">
                              {new Date(order.createdAt).toLocaleDateString('fr-FR')} &bull; {order.totalPrice?.toFixed(2)} €
                            </span>
                          </div>
                          <h4 className="font-bold text-xs text-gray-900 mt-1">
                            Patient : {order.patient?.firstName} {order.patient?.lastName} ({order.patient?.phone || 'Contact'})
                          </h4>
                        </div>

                        {order.status !== 'DÉLIVRÉ' && (
                          <button
                            onClick={() => handleDeliverOrder(order.id)}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer transition-colors"
                          >
                            Valider & Délivrer les médicaments
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: PRESCRIPTIONS VERIFICATION */}
          {!loading && activeTab === 'prescriptions' && (
            <div className="space-y-4 max-w-5xl">
              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                <h2 className="text-base font-bold text-gray-900 mb-1">Vérification des Ordonnances Médicales</h2>
                <p className="text-xs text-gray-500 mb-4">Consultez l'authenticité des ordonnances délivrées par les médecins du réseau.</p>

                <div className="space-y-3">
                  {prescriptions.map((presc) => (
                    <div key={presc.id} className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="text-[10px] font-bold text-[#2585D8] bg-blue-50 px-2 py-0.5 rounded-full">
                            Ordonnance #{presc.id.substring(0, 8)}
                          </span>
                          <h4 className="font-bold text-xs text-gray-900 mt-1">
                            Patient : {presc.patient?.firstName} {presc.patient?.lastName}
                          </h4>
                          <p className="text-[11px] text-gray-500">
                            Médecin prescripteur : Dr. {presc.doctor?.firstName} {presc.doctor?.lastName} ({presc.doctor?.specialty})
                          </p>
                        </div>
                        <span className="text-[11px] text-gray-400">
                          {new Date(presc.createdAt).toLocaleDateString('fr-FR')}
                        </span>
                      </div>

                      <div className="mt-2 space-y-1">
                        {presc.items?.map((item: any) => (
                          <div key={item.id} className="text-xs bg-white p-2 rounded-lg border border-gray-100 flex items-center justify-between">
                            <span className="font-bold text-gray-800">💊 {item.medicationName}</span>
                            <span className="text-[11px] text-gray-500">{item.dosage} &bull; {item.duration}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  {prescriptions.length === 0 && (
                    <p className="text-xs text-gray-400 py-6 text-center">Aucune ordonnance disponible</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: RUPTURES */}
          {!loading && activeTab === 'ruptures' && (
            <div className="space-y-4 max-w-5xl">
              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 bg-red-50 text-red-600 rounded-2xl">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-gray-900">Alertes de Rupture & Seuil Critique</h2>
                    <p className="text-xs text-gray-500">Médicaments dont le stock est inférieur à 10 unités</p>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {criticalItems.map((item) => (
                    <div key={item.id} className="p-3.5 bg-red-50/50 border border-red-100 rounded-2xl flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-xs text-gray-900">{item.name}</h4>
                        <p className="text-[11px] text-gray-500">Fournisseur : {item.supplier} &bull; Reste : <strong className="text-red-600">{item.stock} boîtes</strong></p>
                      </div>
                      <button
                        onClick={() => handleUpdateStock(item.id, 50)}
                        className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer transition-colors"
                      >
                        Commander Réapprovisionnement (+50)
                      </button>
                    </div>
                  ))}
                  {criticalItems.length === 0 && (
                    <p className="text-xs text-emerald-600 py-6 text-center font-bold">Aucune alerte de rupture ! Stocks sous contrôle.</p>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* NEW ITEM MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden p-6"
            >
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-black text-gray-900">Ajouter un Médicament</h3>
                  <p className="text-xs text-gray-500">Ajout au stock pharmaceutique</p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddItem} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Nom du médicament
                  </label>
                  <input
                    type="text"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder="Ex: Paracétamol 1000mg"
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Laboratoire / Fournisseur
                  </label>
                  <input
                    type="text"
                    value={newItemSupplier}
                    onChange={(e) => setNewItemSupplier(e.target.value)}
                    placeholder="Ex: Sanofi, Biogaran..."
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                      Stock Initial
                    </label>
                    <input
                      type="number"
                      value={newItemStock}
                      onChange={(e) => setNewItemStock(e.target.value)}
                      className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-amber-500"
                      min={0}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                      Prix Unitaire (€)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={newItemPrice}
                      onChange={(e) => setNewItemPrice(e.target.value)}
                      className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-amber-500"
                      min={0}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Date de péremption
                  </label>
                  <input
                    type="date"
                    value={newItemExpiry}
                    onChange={(e) => setNewItemExpiry(e.target.value)}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Description / Dosage
                  </label>
                  <input
                    type="text"
                    value={newItemDesc}
                    onChange={(e) => setNewItemDesc(e.target.value)}
                    placeholder="Boîte de 16 comprimés"
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-3.5 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-sm"
                  >
                    {submitting ? 'Ajout...' : 'Ajouter au catalogue'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EDIT ITEM MODAL */}
      <AnimatePresence>
        {editingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden p-6"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-black text-gray-900">Modifier {editingItem.name}</h3>
                <button 
                  onClick={() => setEditingItem(null)}
                  className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleEditItem} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Nom du médicament
                  </label>
                  <input
                    type="text"
                    value={editingItem.name}
                    onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Fournisseur
                  </label>
                  <input
                    type="text"
                    value={editingItem.supplier || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, supplier: e.target.value })}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Prix (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingItem.price}
                    onChange={(e) => setEditingItem({ ...editingItem, price: e.target.value })}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingItem(null)}
                    className="px-3.5 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-sm"
                  >
                    {submitting ? 'Sauvegarde...' : 'Enregistrer'}
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
