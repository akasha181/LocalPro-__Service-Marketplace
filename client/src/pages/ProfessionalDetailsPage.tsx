import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import type { Professional, Service } from '../types';
import {
  Star,
  MapPin,
  ShieldCheck,
  Clock,
  Briefcase,
  CheckCircle2,
  Calendar,
  ArrowLeft,
  DollarSign
} from 'lucide-react';

export const ProfessionalDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [professional, setProfessional] = useState<Professional | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await api.get(`/professionals/${id}`);
        if (res.data.success) {
          setProfessional(res.data.data.professional);
          setServices(res.data.data.services);
        } else {
          setError(res.data.message || 'Professional not found');
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Error loading professional');
      } finally {
        setIsLoading(false);
      }
    };
    fetchDetails();
  }, [id]);

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
          to="/"
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
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-blue-600 mb-6 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Explore
          </Link>

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
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: About & Portfolio */}
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
                <h2 className="text-lg font-bold text-slate-900">Services & Pricing</h2>
                <p className="text-xs text-slate-500 mt-0.5">Select a service package to book directly</p>
              </div>
              <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                {services.length} Options Available
              </span>
            </div>

            {services.length === 0 ? (
              <div className="text-center py-8 text-sm text-slate-500">
                No specific service packages listed currently. You can request a custom appointment.
              </div>
            ) : (
              <div className="space-y-4">
                {services.map((srv) => (
                  <div
                    key={srv._id}
                    className="p-5 rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-sm transition flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-slate-50/50"
                  >
                    <div className="space-y-1 max-w-lg">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900 text-base">{srv.title}</h3>
                      </div>
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
                        onClick={() => alert(`Phase 3 Booking modal for service "${srv.title}" ($${srv.price}) will launch next!`)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        Book Service
                      </button>
                    </div>
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

        {/* Right Sidebar: Quick Highlights & Guarantee */}
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
    </div>
  );
};
