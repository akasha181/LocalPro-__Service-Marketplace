import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { Service } from '../types';
import {
  Briefcase,
  DollarSign,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  Trash2,
  AlertCircle,
  User,
  Phone,
  Mail,
  Clock3,
  MessageSquare,
  Upload,
  Image as ImageIcon
} from 'lucide-react';
import { ChatDrawer } from '../components/ChatDrawer';

interface BookingRequest {
  _id: string;
  customerId: {
    _id: string;
    name: string;
    email: string;
    phone: string;
    avatar?: string;
  };
  serviceId: {
    _id: string;
    title: string;
    price: number;
    durationMinutes: number;
  };
  date: string;
  startTime: string;
  endTime: string;
  totalPrice: number;
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED';
  notes?: string;
}

export const ProfessionalDashboard: React.FC = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [professional, setProfessional] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'requests' | 'services' | 'portfolio'>('requests');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'CONFIRMED' | 'COMPLETED'>('PENDING');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // New Service Modal State
  const [isAddServiceOpen, setIsAddServiceOpen] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newDesc, setNewDesc] = useState<string>('');
  const [newPrice, setNewPrice] = useState<string>('');
  const [newDuration, setNewDuration] = useState<string>('60');
  const [serviceError, setServiceError] = useState<string | null>(null);

  // Portfolio Upload State
  const [portfolioTitle, setPortfolioTitle] = useState<string>('');
  const [portfolioDesc, setPortfolioDesc] = useState<string>('');
  const [portfolioImageBase64, setPortfolioImageBase64] = useState<string>('');
  const [isUploadingPortfolio, setIsUploadingPortfolio] = useState<boolean>(false);
  const [portfolioSuccess, setPortfolioSuccess] = useState<string | null>(null);

  // Chat Drawer State
  const [activeChatBooking, setActiveChatBooking] = useState<BookingRequest | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [bookingsRes, profileRes] = await Promise.all([
        api.get('/bookings/my'),
        api.get('/professionals/profile/me').catch(() => ({ data: { success: false } })),
      ]);

      if (bookingsRes.data.success) {
        setBookings(bookingsRes.data.data.bookings);
      }

      if (profileRes.data.success && profileRes.data.data.professional) {
        const pro = profileRes.data.data.professional;
        setProfessional(pro);
        const srvRes = await api.get(`/services?professionalId=${pro._id}`);
        if (srvRes.data.success) {
          setServices(srvRes.data.data.services);
        }
      }
    } catch (err) {
      console.error('Error loading professional dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPortfolioImageBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddPortfolio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!portfolioTitle.trim() || !portfolioImageBase64) {
      alert('Please provide a title and select an image.');
      return;
    }

    setIsUploadingPortfolio(true);
    setPortfolioSuccess(null);
    try {
      const res = await api.post('/uploads/portfolio', {
        title: portfolioTitle,
        description: portfolioDesc,
        image: portfolioImageBase64,
      });

      if (res.data.success) {
        setPortfolioSuccess('Portfolio work published successfully!');
        setPortfolioTitle('');
        setPortfolioDesc('');
        setPortfolioImageBase64('');
        fetchData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to upload portfolio');
    } finally {
      setIsUploadingPortfolio(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateStatus = async (bookingId: string, newStatus: string) => {
    setActionLoading(bookingId);
    try {
      const res = await api.put(`/bookings/${bookingId}/status`, { status: newStatus });
      if (res.data.success) {
        setBookings((prev) =>
          prev.map((b) => (b._id === bookingId ? { ...b, status: newStatus as any } : b))
        );
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update booking status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    setServiceError(null);
    try {
      const res = await api.post('/services', {
        title: newTitle,
        description: newDesc,
        price: Number(newPrice),
        durationMinutes: Number(newDuration),
      });

      if (res.data.success) {
        setServices((prev) => [...prev, res.data.data.service]);
        setIsAddServiceOpen(false);
        setNewTitle('');
        setNewDesc('');
        setNewPrice('');
      }
    } catch (err: any) {
      setServiceError(err.response?.data?.message || 'Failed to create service');
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!window.confirm('Delete this service package?')) return;
    try {
      const res = await api.delete(`/services/${id}`);
      if (res.data.success) {
        setServices((prev) => prev.filter((s) => s._id !== id));
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete service');
    }
  };

  // KPIs
  const totalRevenue = bookings
    .filter((b) => b.status === 'CONFIRMED' || b.status === 'COMPLETED')
    .reduce((sum, b) => sum + (b.totalPrice || 0), 0);
  const pendingCount = bookings.filter((b) => b.status === 'PENDING').length;
  const completedCount = bookings.filter((b) => b.status === 'COMPLETED').length;

  const filteredBookings = bookings.filter((b) => {
    if (statusFilter === 'ALL') return true;
    return b.status === statusFilter;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Professional Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">
            Welcome back, <span className="font-semibold text-slate-800">{user?.name}</span>. Manage your appointments and services.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition ${
              activeTab === 'requests'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-slate-700 border border-slate-200'
            }`}
          >
            Appointments & Requests
          </button>
          <button
            onClick={() => setActiveTab('services')}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition ${
              activeTab === 'services'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-slate-700 border border-slate-200'
            }`}
          >
            My Services ({services.length})
          </button>
          <button
            onClick={() => setActiveTab('portfolio')}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition ${
              activeTab === 'portfolio'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-slate-700 border border-slate-200'
            }`}
          >
            Portfolio & Gallery ({professional?.portfolio?.length || 0})
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">Earned Revenue</span>
          <div className="text-2xl font-black text-slate-900 mt-1">${totalRevenue}</div>
          <span className="text-[11px] text-emerald-600 font-medium mt-1 block">Confirmed & Completed</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">Pending Requests</span>
          <div className="text-2xl font-black text-amber-600 mt-1">{pendingCount}</div>
          <span className="text-[11px] text-slate-400 font-medium mt-1 block">Requires confirmation</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">Completed Jobs</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{completedCount}</div>
          <span className="text-[11px] text-slate-400 font-medium mt-1 block">Jobs fulfilled</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">Total Bookings</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{bookings.length}</div>
          <span className="text-[11px] text-slate-400 font-medium mt-1 block">Lifetime requests</span>
        </div>
      </div>

      {/* Tab 1: Bookings Management */}
      {activeTab === 'requests' && (
        <div>
          {/* Status Filter Tabs */}
          <div className="flex items-center gap-2 mb-6">
            {(['PENDING', 'CONFIRMED', 'COMPLETED', 'ALL'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                  statusFilter === st
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {st === 'PENDING'
                  ? `Pending (${pendingCount})`
                  : st === 'CONFIRMED'
                  ? 'Upcoming Confirmed'
                  : st === 'COMPLETED'
                  ? 'Completed'
                  : 'All Appointments'}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl p-6 border border-slate-200 animate-pulse h-32"></div>
              ))}
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-900">No appointments under this tab</h3>
              <p className="text-xs text-slate-500 mt-1">Incoming booking requests from customers will appear here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredBookings.map((b) => (
                <div
                  key={b._id}
                  className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:border-blue-200 transition flex flex-col md:flex-row md:items-center justify-between gap-6"
                >
                  <div className="flex items-start gap-4">
                    <img
                      src={
                        b.customerId?.avatar ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'
                      }
                      alt={b.customerId?.name}
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-slate-100 flex-shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-bold text-slate-900">{b.serviceId?.title}</h3>
                        <span
                          className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                            b.status === 'PENDING'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : b.status === 'CONFIRMED'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : b.status === 'COMPLETED'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {b.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 font-medium mt-1">
                        Customer: <span className="text-slate-900 font-semibold">{b.customerId?.name}</span>
                      </p>

                      <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-600">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-blue-600" />
                          {new Date(b.date).toLocaleDateString(undefined, {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-blue-600" />
                          {b.startTime} - {b.endTime}
                        </span>
                        {b.customerId?.phone && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" />
                              {b.customerId.phone}
                            </span>
                          </>
                        )}
                      </div>

                      {b.notes && (
                        <div className="mt-2 text-xs text-slate-500 bg-slate-50 p-2 rounded-lg max-w-lg">
                          <span className="font-semibold text-slate-700">Customer Note:</span> "{b.notes}"
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col items-start md:items-end gap-3 border-t md:border-t-0 pt-4 md:pt-0 border-slate-100">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Price</span>
                      <span className="text-xl font-black text-slate-900">${b.totalPrice}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setActiveChatBooking(b)}
                        className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        Chat
                      </button>

                      {b.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(b._id, 'CONFIRMED')}
                            disabled={actionLoading === b._id}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition disabled:opacity-50"
                          >
                            {actionLoading === b._id ? 'Updating...' : 'Accept Job'}
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(b._id, 'REJECTED')}
                            disabled={actionLoading === b._id}
                            className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold transition disabled:opacity-50"
                          >
                            Decline
                          </button>
                        </>
                      )}

                      {b.status === 'CONFIRMED' && (
                        <button
                          onClick={() => handleUpdateStatus(b._id, 'COMPLETED')}
                          disabled={actionLoading === b._id}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition disabled:opacity-50 flex items-center gap-1.5"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          Mark as Completed
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Service Packages Manager */}
      {activeTab === 'services' && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Your Service Offerings</h2>
              <p className="text-xs text-slate-500">Packages that customers can directly book on your profile</p>
            </div>
            <button
              onClick={() => setIsAddServiceOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              Add Service Package
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {services.map((s) => (
              <div
                key={s._id}
                className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-slate-900 text-base">{s.title}</h3>
                    <span className="text-lg font-black text-slate-900">${s.price}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">{s.description}</p>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    Duration: {s.durationMinutes} minutes
                  </span>
                  <button
                    onClick={() => handleDeleteService(s._id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    title="Delete service"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add Service Modal */}
          {isAddServiceOpen && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100">
                <h2 className="text-lg font-bold text-slate-900">Add Service Package</h2>
                <p className="text-xs text-slate-500 mt-0.5">Describe your service offering and upfront pricing</p>

                {serviceError && (
                  <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{serviceError}</span>
                  </div>
                )}

                <form onSubmit={handleCreateService} className="mt-4 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Service Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Breaker Panel Diagnostic"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Detail what is included in this service..."
                      value={newDesc}
                      onChange={(e) => setNewDesc(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Price ($ USD)</label>
                      <input
                        type="number"
                        required
                        min="5"
                        placeholder="120"
                        value={newPrice}
                        onChange={(e) => setNewPrice(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Duration (Mins)</label>
                      <select
                        value={newDuration}
                        onChange={(e) => setNewDuration(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                      >
                        <option value="30">30 mins</option>
                        <option value="60">60 mins (1 hr)</option>
                        <option value="90">90 mins</option>
                        <option value="120">120 mins (2 hrs)</option>
                        <option value="180">180 mins (3 hrs)</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddServiceOpen(false)}
                      className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 shadow-sm"
                    >
                      Save Package
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Portfolio & Gallery Manager */}
      {activeTab === 'portfolio' && (
        <div className="space-y-8">
          {/* Upload New Portfolio Item Card */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Upload className="w-5 h-5 text-blue-600" />
              Upload Work Portfolio & Showcase Images
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Add photos of your completed projects, repair jobs, and trade craftsmanship to attract more customers.
            </p>

            {portfolioSuccess && (
              <div className="mt-4 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl font-medium">
                ✓ {portfolioSuccess}
              </div>
            )}

            <form onSubmit={handleAddPortfolio} className="mt-6 space-y-4 max-w-2xl">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Project Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Master Bathroom Copper Piping Replacement"
                  value={portfolioTitle}
                  onChange={(e) => setPortfolioTitle(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Completed within 4 hours with full pressure testing..."
                  value={portfolioDesc}
                  onChange={(e) => setPortfolioDesc(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Work Photo *
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition cursor-pointer"
                />
              </div>

              {portfolioImageBase64 && (
                <div className="mt-2">
                  <span className="text-[11px] text-slate-400 block mb-1">Image Preview:</span>
                  <img
                    src={portfolioImageBase64}
                    alt="Preview"
                    className="w-48 h-32 object-cover rounded-xl border border-slate-200 shadow-xs"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={isUploadingPortfolio || !portfolioTitle.trim() || !portfolioImageBase64}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition disabled:opacity-50 flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                {isUploadingPortfolio ? 'Uploading to Cloud...' : 'Publish to Portfolio'}
              </button>
            </form>
          </div>

          {/* Current Portfolio Items Grid */}
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-4">
              Published Works ({professional?.portfolio?.length || 0})
            </h3>
            {!professional?.portfolio || professional.portfolio.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
                <ImageIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h4 className="font-bold text-slate-800 text-sm">No portfolio items yet</h4>
                <p className="text-xs text-slate-500 mt-1">Upload photos above to showcase your work to prospective clients.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {professional.portfolio.map((item: any, idx: number) => (
                  <div key={idx} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs group">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-44 object-cover group-hover:scale-105 transition duration-300"
                    />
                    <div className="p-4">
                      <h4 className="font-bold text-slate-900 text-sm">{item.title}</h4>
                      {item.description && (
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Chat Drawer */}
      {activeChatBooking && (
        <ChatDrawer
          isOpen={!!activeChatBooking}
          onClose={() => setActiveChatBooking(null)}
          targetUser={activeChatBooking.customerId as any}
          bookingId={activeChatBooking._id}
        />
      )}
    </div>
  );
};
