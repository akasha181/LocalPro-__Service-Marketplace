import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { Professional, Service } from '../types';
import { Calendar, Clock, DollarSign, X, AlertCircle, CheckCircle2 } from 'lucide-react';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  professional: Professional;
  service: Service | null;
}

interface Slot {
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  professional,
  service,
}) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [notes, setNotes] = useState<string>('');
  const [slots, setSlots] = useState<Slot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch available slots whenever date or professional changes
  useEffect(() => {
    if (!isOpen || !professional) return;

    const fetchSlots = async () => {
      setIsLoadingSlots(true);
      setError(null);
      try {
        const res = await api.get(`/bookings/availability/${professional._id}?date=${selectedDate}`);
        if (res.data?.success && res.data.data?.slots) {
          setSlots(res.data.data.slots);
        } else {
          // Fallback slots
          setSlots([
            { startTime: '09:00', endTime: '10:00', isAvailable: true },
            { startTime: '10:00', endTime: '11:00', isAvailable: true },
            { startTime: '11:00', endTime: '12:00', isAvailable: true },
            { startTime: '13:00', endTime: '14:00', isAvailable: true },
            { startTime: '14:00', endTime: '15:00', isAvailable: true },
            { startTime: '15:00', endTime: '16:00', isAvailable: true },
          ]);
        }
      } catch (err: any) {
        // Fallback slots for 24/7 offline cloud demo
        setSlots([
          { startTime: '09:00', endTime: '10:00', isAvailable: true },
          { startTime: '10:00', endTime: '11:00', isAvailable: true },
          { startTime: '11:00', endTime: '12:00', isAvailable: true },
          { startTime: '13:00', endTime: '14:00', isAvailable: true },
          { startTime: '14:00', endTime: '15:00', isAvailable: true },
          { startTime: '15:00', endTime: '16:00', isAvailable: true },
        ]);
      } finally {
        setIsLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [isOpen, professional, selectedDate]);

  if (!isOpen || !service) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!selectedSlot) {
      setError('Please select an available time slot.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await api.post('/bookings', {
        professionalId: professional._id,
        serviceId: service._id,
        date: selectedDate,
        startTime: selectedSlot,
        notes,
      });

      if (res.data.success) {
        setSuccessMessage('Appointment booked successfully!');
        setTimeout(() => {
          onClose();
          navigate('/customer/bookings');
        }, 1200);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to complete booking');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-bold text-slate-900">Schedule Service Appointment</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Booking with <span className="font-semibold text-slate-700">{professional.userId?.name}</span>
        </p>

        {/* Service Summary Card */}
        <div className="mt-4 p-4 rounded-2xl bg-blue-50/70 border border-blue-100 flex items-center justify-between">
          <div>
            <h4 className="font-bold text-slate-900 text-sm">{service.title}</h4>
            <div className="flex items-center gap-3 text-xs text-blue-700 mt-1">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {service.durationMinutes} mins
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Total</span>
            <span className="text-lg font-extrabold text-blue-700">${service.price}</span>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs text-rose-700">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-xs text-emerald-700">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Date Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              Select Date
            </label>
            <input
              type="date"
              min={todayStr}
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setSelectedSlot(null);
              }}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>

          {/* Time Slot Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              Available Time Slots
            </label>

            {isLoadingSlots ? (
              <div className="grid grid-cols-3 gap-2 py-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-9 bg-slate-100 rounded-xl animate-pulse"></div>
                ))}
              </div>
            ) : slots.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-50 text-center text-xs text-slate-500">
                No slots available on this date. Please pick another day.
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2 max-h-44 overflow-y-auto pr-1">
                {slots.map((slot, idx) => (
                  <button
                    key={idx}
                    type="button"
                    disabled={!slot.isAvailable}
                    onClick={() => setSelectedSlot(slot.startTime)}
                    className={`py-2 px-2 text-xs font-semibold rounded-xl border transition text-center ${
                      !slot.isAvailable
                        ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed line-through'
                        : selectedSlot === slot.startTime
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-blue-400'
                    }`}
                  >
                    {slot.startTime}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Notes for Specialist (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Ring apartment 4B, please check the main kitchen fuse."
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || !selectedSlot}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? 'Confirming Appointment...' : `Book Appointment • $${service.price}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
