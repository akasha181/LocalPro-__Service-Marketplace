import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Calendar,
  Clock,
  DollarSign,
  AlertCircle,
  XCircle,
  CheckCircle,
  Clock3,
  MapPin,
  ArrowRight
} from 'lucide-react';

interface BookingItem {
  _id: string;
  professionalId: {
    _id: string;
    title: string;
    userId: {
      name: string;
      avatar: string;
      phone: string;
      email: string;
    };
  };
  serviceId: {
    _id: string;
    title: string;
    durationMinutes: number;
    price: number;
  };
  date: string;
  startTime: string;
  endTime: string;
  totalPrice: number;
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED';
  notes?: string;
  createdAt: string;
}

export const MyBookingsPage: React.FC = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchBookings = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/bookings/my');
      if (res.data.success) {
        setBookings(res.data.data.bookings);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load bookings');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancelBooking = async (id: string) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    setActionLoading(id);
    try {
      const res = await api.put(`/bookings/${id}/status`, { status: 'CANCELLED' });
      if (res.data.success) {
        setBookings((prev) =>
          prev.map((b) => (b._id === id ? { ...b, status: 'CANCELLED' } : b))
        );
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to cancel booking');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredBookings = bookings.filter((b) => {
    if (filterStatus === 'ALL') return true;
    return b.status === filterStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            <Clock3 className="w-3 h-3" />
            Pending Approval
          </span>
        );
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            <CheckCircle className="w-3 h-3" />
            Confirmed
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle className="w-3 h-3" />
            Completed
          </span>
        );
      case 'CANCELLED':
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3" />
            {status}
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">My Appointments</h1>
          <p className="text-slate-500 text-sm mt-1">
            Track upcoming visits, confirmation status, and service history
          </p>
        </div>
        <Link
          to="/explore"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
        >
          Book Another Service
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6">
        {['ALL', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].map((st) => (
          <button
            key={st}
            onClick={() => setFilterStatus(st)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              filterStatus === st
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {st === 'ALL' ? 'All Bookings' : st}
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
          <h3 className="text-base font-bold text-slate-900">No bookings found</h3>
          <p className="text-xs text-slate-500 mt-1">You do not have any appointments under this status.</p>
          <Link
            to="/explore"
            className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700"
          >
            Find a Professional
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((b) => (
            <div
              key={b._id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:border-blue-200 transition flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              {/* Specialist & Service Details */}
              <div className="flex items-start gap-4">
                <img
                  src={
                    b.professionalId?.userId?.avatar ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'
                  }
                  alt={b.professionalId?.userId?.name}
                  className="w-14 h-14 rounded-2xl object-cover ring-2 ring-slate-100 flex-shrink-0"
                />
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold text-slate-900">
                      {b.serviceId?.title || 'Custom Service'}
                    </h3>
                    {getStatusBadge(b.status)}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Specialist:{' '}
                    <span className="font-semibold text-slate-700">
                      {b.professionalId?.userId?.name}
                    </span>{' '}
                    ({b.professionalId?.title})
                  </p>

                  <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-slate-600">
                    <span className="flex items-center gap-1.5 font-medium text-slate-800">
                      <Calendar className="w-3.5 h-3.5 text-blue-600" />
                      {new Date(b.date).toLocaleDateString(undefined, {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="flex items-center gap-1.5 font-medium text-slate-800">
                      <Clock className="w-3.5 h-3.5 text-blue-600" />
                      {b.startTime} - {b.endTime}
                    </span>
                    {b.notes && (
                      <>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-500 italic max-w-xs truncate">
                          "{b.notes}"
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Price & Action */}
              <div className="flex items-center justify-between md:flex-col md:items-end gap-3 border-t md:border-t-0 pt-4 md:pt-0 border-slate-100">
                <div className="text-left md:text-right">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                    Total Amount
                  </span>
                  <span className="text-xl font-extrabold text-slate-900">
                    ${b.totalPrice}
                  </span>
                </div>

                {(b.status === 'PENDING' || b.status === 'CONFIRMED') && (
                  <button
                    onClick={() => handleCancelBooking(b._id)}
                    disabled={actionLoading === b._id}
                    className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl transition disabled:opacity-50"
                  >
                    {actionLoading === b._id ? 'Cancelling...' : 'Cancel Booking'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
