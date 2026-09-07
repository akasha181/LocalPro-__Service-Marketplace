import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { Professional, Service } from '../types';
import { BookingModal } from '../components/BookingModal';
import { ChatDrawer } from '../components/ChatDrawer';
import {
  Star,
  MapPin,
  ShieldCheck,
  Clock,
  Briefcase,
  CheckCircle2,
  Calendar,
  ArrowLeft,
  Heart,
  MessageSquare
} from 'lucide-react';

interface ReviewItem {
  _id: string;
  rating: number;
  comment: string;
  createdAt: string;
  customerId: {
    _id: string;
    name: string;
    avatar?: string;
  };
}

export const ProfessionalDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useAuth();
  const [professional, setProfessional] = useState<Professional | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const [isFavoriteLoading, setIsFavoriteLoading] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Booking Modal & Chat State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const [proRes, revRes] = await Promise.all([
          api.get(`/professionals/${id}`),
          api.get(`/reviews/pro/${id}`).catch(() => ({ data: { success: false, data: { reviews: [] } } })),
        ]);

        if (proRes.data?.success && proRes.data.data?.professional) {
          setProfessional(proRes.data.data.professional);
          setServices(proRes.data.data.services || []);
        } else {
          // Robust 24/7 Fallback: Find matching demo professional
          import('../services/mockStore').then(({ DEMO_PROFESSIONALS, DEMO_SERVICES }) => {
            const fallbackPro = DEMO_PROFESSIONALS.find((p) => p._id === id) || DEMO_PROFESSIONALS[0];
            const fallbackServices = DEMO_SERVICES.filter((s) => s.professionalId === fallbackPro._id);
            setProfessional(fallbackPro);
            setServices(fallbackServices.length > 0 ? fallbackServices : DEMO_SERVICES);
          });
        }

        if (revRes.data?.success) {
          setReviews(revRes.data.data.reviews || []);
        }

        // Check if favorited
        if (isAuthenticated) {
          api.get(`/favorites/check/${id}`)
            .then((favRes) => {
              if (favRes.data?.success) {
                setIsFavorite(favRes.data.data.isFavorite);
              }
            })
            .catch(() => {});
        }
      } catch (err: any) {
        // Fallback gracefully on network error when laptop is off
        import('../services/mockStore').then(({ DEMO_PROFESSIONALS, DEMO_SERVICES }) => {
          const fallbackPro = DEMO_PROFESSIONALS.find((p) => p._id === id) || DEMO_PROFESSIONALS[0];
          const fallbackServices = DEMO_SERVICES.filter((s) => s.professionalId === fallbackPro._id);
          setProfessional(fallbackPro);
          setServices(fallbackServices.length > 0 ? fallbackServices : DEMO_SERVICES);
        }).catch(() => {
          setError('Error loading professional');
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchDetails();
  }, [id, isAuthenticated]);

  const handleToggleFavorite = async () => {
    if (!isAuthenticated) return;
    setIsFavoriteLoading(true);
    try {
      const res = await api.post('/favorites/toggle', { professionalId: id });
      if (res.data.success) {
        setIsFavorite(res.data.data.isFavorite);
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
    } finally {
      setIsFavoriteLoading(false);
    }
  };

  const handleBookService = (service: Service) => {
    setSelectedService(service);
    setIsModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !professional) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-slate-900">Professional Not Found</h2>
        <p className="text-slate-500 mt-2">{error || 'This profile does not exist or has been deactivated.'}</p>
        <Link
          to="/explore"
          className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Services
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen pb-16">
      {/* Top Breadcrumb & Profile Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <Link
              to="/explore"
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-blue-600 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Explore
            </Link>

            {isAuthenticated && (
              <button
                onClick={handleToggleFavorite}
                disabled={isFavoriteLoading}
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition ${
                  isFavorite
                    ? 'bg-rose-50 text-rose-600 border-rose-200 shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current text-rose-500' : ''}`} />
                {isFavorite ? 'Saved Specialist' : 'Save to Favorites'}
              </button>
            )}
          </div>

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-start sm:items-center gap-5">
              <img
                src={professional.userId?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300'}
                alt={professional.userId?.name}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover ring-4 ring-slate-100 shadow-sm"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                    {professional.userId?.name}
                  </h1>
                  {professional.isApproved && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Verified
                    </span>
                  )}
                </div>
                <p className="text-base text-blue-600 font-medium mt-1">{professional.title}</p>
                <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-600">
                  <div className="flex items-center gap-1 font-bold text-amber-500">
                    <Star className="w-4 h-4 fill-current" />
                    <span>{professional.rating.toFixed(2)}</span>
                    <span className="text-slate-400 font-normal">({professional.reviewCount} reviews)</span>
                  </div>
                  <span className="text-slate-300">•</span>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span>{professional.location.city}, {professional.location.state}</span>
                  </div>
                  <span className="text-slate-300">•</span>
                  <div className="flex items-center gap-1">
                    <Briefcase className="w-4 h-4 text-slate-400" />
                    <span>{professional.experienceYears} Years Experience</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center">
                <span className="text-xs text-slate-500 block">Base Rate</span>
                <span className="text-2xl font-black text-slate-900">${professional.hourlyRate}</span>
                <span className="text-xs text-slate-500">/hr</span>
              </div>
              {isAuthenticated && (
                <button
                  onClick={() => setIsChatOpen(true)}
                  className="px-5 py-3 rounded-2xl font-semibold text-sm bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm flex items-center justify-center gap-2 transition"
                >
                  <MessageSquare className="w-4 h-4" />
                  Message Specialist
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: About, Services, Reviews & Portfolio */}
        <div className="lg:col-span-2 space-y-8">
          {/* Bio Section */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-4">About the Specialist</h2>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {professional.bio}
            </p>
          </div>

          {/* Services Menu */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Services & Upfront Pricing</h2>
                <p className="text-xs text-slate-500 mt-0.5">Select a service package to book directly</p>
              </div>
              <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                {services.length} Packages Available
              </span>
            </div>

            <div className="space-y-4">
              {services.map((srv) => (
                <div
                  key={srv._id}
                  className="p-5 rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-sm transition flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-slate-50/50"
                >
                  <div className="space-y-1 max-w-lg">
                    <h3 className="font-bold text-slate-900 text-base">{srv.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">{srv.description}</p>
                    <div className="flex items-center gap-3 text-xs text-slate-600 pt-1">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {srv.durationMinutes} mins
                      </span>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-200">
                    <div className="text-xl font-extrabold text-slate-900">${srv.price}</div>
                    <button
                      onClick={() => handleBookService(srv)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      Book Service
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Verified Customer Reviews Section */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold text-slate-900">Verified Customer Reviews</h2>
                <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200">
                  <Star className="w-3 h-3 fill-current" />
                  {professional.rating.toFixed(2)} / 5.0
                </span>
              </div>
              <span className="text-xs text-slate-400">{reviews.length} total reviews</span>
            </div>

            {reviews.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                No customer reviews yet. Reviews can only be submitted following verified completed bookings.
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((rev) => (
                  <div key={rev._id} className="p-4 rounded-xl bg-slate-50/70 border border-slate-100">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={rev.customerId?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100'}
                          alt={rev.customerId?.name}
                          className="w-7 h-7 rounded-full object-cover"
                        />
                        <span className="text-xs font-bold text-slate-900">{rev.customerId?.name}</span>
                      </div>
                      <div className="flex items-center gap-1 text-amber-500 text-xs font-bold">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span>{rev.rating}</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed pl-9.5">
                      "{rev.comment}"
                    </p>
                    <span className="text-[10px] text-slate-400 block mt-2 text-right">
                      Verified Appointment • {new Date(rev.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Portfolio Showcase */}
          {professional.portfolio && professional.portfolio.length > 0 && (
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 mb-6">Recent Work & Portfolio</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {professional.portfolio.map((item, idx) => (
                  <div key={idx} className="rounded-xl overflow-hidden border border-slate-200 group">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-48 object-cover group-hover:scale-105 transition duration-300"
                    />
                    <div className="p-4 bg-white">
                      <h4 className="font-bold text-slate-900 text-sm">{item.title}</h4>
                      {item.description && (
                        <p className="text-xs text-slate-500 mt-1">{item.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar: Guarantees */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-900 text-sm mb-4">LocalPro Guarantee</h3>
            <ul className="space-y-3 text-xs text-slate-600">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span>Background-checked and certified credentials.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span>Protected payments via Stripe test mode sandbox.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span>Direct real-time messaging with your specialist.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {selectedService && (
        <BookingModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          professional={professional}
          service={selectedService}
        />
      )}

      {/* Chat Drawer */}
      <ChatDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        targetUser={professional.userId}
      />
    </div>
  );
};
