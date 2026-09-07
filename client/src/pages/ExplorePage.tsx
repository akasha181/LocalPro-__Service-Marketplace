import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import type { Professional, Category, ScoredProfessional } from '../types';
import { DEMO_PROFESSIONALS, DEMO_CATEGORIES, DEMO_RECOMMENDATIONS } from '../services/mockStore';
import { Search, Star, MapPin, CheckCircle, SlidersHorizontal, ArrowRight, ShieldCheck, Sparkles, TrendingUp } from 'lucide-react';

export const ExplorePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || '';

  const [professionals, setProfessionals] = useState<Professional[]>(DEMO_PROFESSIONALS);
  const [categories, setCategories] = useState<Category[]>(DEMO_CATEGORIES);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('rating');
  const [maxPrice, setMaxPrice] = useState<number>(200);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [recommendations, setRecommendations] = useState<ScoredProfessional[]>(DEMO_RECOMMENDATIONS);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState<boolean>(false);

  // Fetch AI Recommendations
  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setIsLoadingRecommendations(true);
        const params: any = { limit: 3 };
        if (selectedCategory) params.category = selectedCategory;
        const res = await api.get('/professionals/recommendations', { params });
        if (res.data?.success && res.data.data?.recommendations?.length > 0) {
          setRecommendations(res.data.data.recommendations);
        } else {
          setRecommendations(DEMO_RECOMMENDATIONS);
        }
      } catch (err) {
        setRecommendations(DEMO_RECOMMENDATIONS);
      } finally {
        setIsLoadingRecommendations(false);
      }
    };
    fetchRecommendations();
  }, [selectedCategory]);

  // Fetch Categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/categories');
        if (res.data?.success && res.data.data?.categories?.length > 0) {
          setCategories(res.data.data.categories);
        } else {
          setCategories(DEMO_CATEGORIES);
        }
      } catch (err) {
        setCategories(DEMO_CATEGORIES);
      }
    };
    fetchCategories();
  }, []);

  // Fetch Professionals matching filters
  useEffect(() => {
    const fetchProfessionals = async () => {
      setIsLoading(true);
      try {
        const params: any = {
          sortBy,
          maxPrice,
        };
        if (selectedCategory) params.category = selectedCategory;
        if (searchQuery.trim()) params.search = searchQuery.trim();

        const res = await api.get('/professionals', { params });
        if (res.data?.success && res.data.data?.professionals?.length > 0) {
          setProfessionals(res.data.data.professionals);
        } else {
          let list = [...DEMO_PROFESSIONALS];
          if (selectedCategory) {
            list = list.filter((p) => p.category.slug === selectedCategory || p.category._id === selectedCategory);
          }
          if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            list = list.filter((p) => p.title.toLowerCase().includes(q) || p.userId.name.toLowerCase().includes(q));
          }
          setProfessionals(list.length > 0 ? list : DEMO_PROFESSIONALS);
        }
      } catch (err) {
        let list = [...DEMO_PROFESSIONALS];
        if (selectedCategory) {
          list = list.filter((p) => p.category.slug === selectedCategory || p.category._id === selectedCategory);
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          list = list.filter((p) => p.title.toLowerCase().includes(q) || p.userId.name.toLowerCase().includes(q));
        }
        setProfessionals(list.length > 0 ? list : DEMO_PROFESSIONALS);
      } finally {
        setIsLoading(false);
      }
    };

    const debounce = setTimeout(fetchProfessionals, 300);
    return () => clearTimeout(debounce);
  }, [selectedCategory, searchQuery, sortBy, maxPrice]);

  const handleCategoryClick = (slug: string) => {
    const newCategory = selectedCategory === slug ? '' : slug;
    setSelectedCategory(newCategory);
    if (newCategory) {
      setSearchParams({ category: newCategory });
    } else {
      setSearchParams({});
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Search & Filter Bar */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Explore Verified Service Professionals
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Browse top-rated licensed specialists with upfront pricing and verified backgrounds
        </p>

        {/* Search & Sort Controls */}
        <div className="mt-6 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by skill, name or trade..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
            <div className="flex items-center gap-2 text-sm text-slate-600 bg-white border border-slate-200 px-3 py-2 rounded-xl shadow-sm">
              <SlidersHorizontal className="w-4 h-4 text-slate-400" />
              <span>Max Rate:</span>
              <span className="font-bold text-slate-900">${maxPrice}/hr</span>
              <input
                type="range"
                min="30"
                max="250"
                step="10"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-24 accent-blue-600 cursor-pointer"
              />
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white border border-slate-200 text-slate-700 text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            >
              <option value="rating">Top Rated</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="newest">Newest Specialists</option>
            </select>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => handleCategoryClick('')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              selectedCategory === ''
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300'
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat._id}
              onClick={() => handleCategoryClick(cat.slug)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                selectedCategory === cat.slug
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* AI Smart Matches Section */}
      {!isLoadingRecommendations && recommendations.length > 0 && !searchQuery.trim() && (
        <div className="mb-10 bg-gradient-to-r from-indigo-900 via-slate-900 to-blue-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-indigo-500/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                AI Smart Rank
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">Recommended Specialists For You</h2>
              <p className="text-xs text-indigo-200 mt-0.5">
                Ranked by multi-factor score: customer satisfaction, job completion reliability, and pricing value.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {recommendations.map((rec) => (
              <div
                key={rec.professional._id}
                className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/15 flex flex-col justify-between hover:bg-white/15 transition group"
              >
                <div>
                  {/* AI Score Badge */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-300 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-md">
                      ★ {rec.score}% Match Score
                    </span>
                    <span className="text-[11px] text-indigo-200 font-medium">
                      ${rec.professional.hourlyRate}/hr
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <img
                      src={rec.professional.userId?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100'}
                      alt={rec.professional.userId?.name}
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-indigo-400/40"
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-sm text-white truncate group-hover:text-indigo-200 transition">
                        {rec.professional.userId?.name}
                      </h3>
                      <p className="text-xs text-indigo-300 truncate">{rec.professional.title}</p>
                    </div>
                  </div>

                  {/* AI Match Reason */}
                  <div className="mt-3 p-2 rounded-xl bg-black/20 border border-white/5 text-[11px] text-indigo-100 flex items-start gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0 mt-0.5" />
                    <span className="leading-tight">{rec.recommendationReason}</span>
                  </div>
                </div>

                <Link
                  to={`/professionals/${rec.professional._id}`}
                  className="mt-4 w-full py-2 rounded-xl text-xs font-semibold bg-indigo-500 hover:bg-indigo-600 text-white text-center shadow-xs transition flex items-center justify-center gap-1"
                >
                  View Profile & Book
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Professionals Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-slate-200 animate-pulse space-y-4">
              <div className="flex gap-4">
                <div className="w-16 h-16 bg-slate-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                  <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                </div>
              </div>
              <div className="h-12 bg-slate-200 rounded"></div>
              <div className="h-8 bg-slate-200 rounded"></div>
            </div>
          ))}
        </div>
      ) : professionals.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No professionals found</h3>
          <p className="text-slate-500 text-sm mt-1">Try adjusting your filters or search terms.</p>
          <button
            onClick={() => {
              setSelectedCategory('');
              setSearchQuery('');
              setMaxPrice(200);
            }}
            className="mt-4 px-4 py-2 text-xs font-semibold bg-blue-600 text-white rounded-xl shadow-sm hover:bg-blue-700"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {professionals.map((pro) => (
            <div
              key={pro._id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition flex flex-col justify-between overflow-hidden group"
            >
              <div className="p-6">
                {/* Pro Avatar & Basic Details */}
                <div className="flex items-start gap-4">
                  <img
                    src={pro.userId?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'}
                    alt={pro.userId?.name}
                    className="w-14 h-14 rounded-full object-cover ring-2 ring-slate-100"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-base font-bold text-slate-900 truncate">
                        {pro.userId?.name}
                      </h3>
                      {pro.isApproved && (
                        <span title="Verified Specialist">
                          <ShieldCheck className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-blue-600 font-medium truncate mt-0.5">{pro.title}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="flex items-center text-amber-500 text-xs font-bold gap-1">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span>{pro.rating.toFixed(2)}</span>
                      </div>
                      <span className="text-slate-300">•</span>
                      <span className="text-xs text-slate-500">{pro.reviewCount} reviews</span>
                    </div>
                  </div>
                </div>

                {/* Bio snippet */}
                <p className="mt-4 text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {pro.bio}
                </p>

                {/* Location & Category Badges */}
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    {pro.location.city}, {pro.location.state}
                  </span>
                  <span className="text-[11px] font-medium text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg">
                    {pro.category?.name}
                  </span>
                  <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                    {pro.experienceYears} yrs exp
                  </span>
                </div>
              </div>

              {/* Card Footer with Rate and CTA */}
              <div className="px-6 py-4 bg-slate-50/75 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500">Starting from</span>
                  <div className="text-base font-bold text-slate-900">
                    ${pro.hourlyRate}<span className="text-xs font-normal text-slate-500">/hr</span>
                  </div>
                </div>
                <Link
                  to={`/professionals/${pro._id}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition group-hover:shadow"
                >
                  View Services
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
