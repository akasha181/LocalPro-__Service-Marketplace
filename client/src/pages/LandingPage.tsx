import React from 'react';
import { Link } from 'react-router-dom';
import { Search, Star, ShieldCheck, Zap, ArrowRight, Sparkles } from 'lucide-react';

export const LandingPage: React.FC = () => {
  const categories = [
    { name: 'Home Cleaning', icon: '🧹', count: '140+ pros', desc: 'Deep cleaning, sanitization & move-in cleans' },
    { name: 'Electrical & Wiring', icon: '⚡', count: '85+ pros', desc: 'Certified electricians for repairs & setups' },
    { name: 'Plumbing & Pipe', icon: '🔧', count: '110+ pros', desc: 'Leaks, unclogging & pipe installations' },
    { name: 'Carpentry & Handyman', icon: '🪚', count: '95+ pros', desc: 'Furniture assembly, repairs & woodwork' },
    { name: 'Painting & Decor', icon: '🎨', count: '70+ pros', desc: 'Interior, exterior wall painting & refinishing' },
    { name: 'Appliance Repair', icon: '🛠️', count: '120+ pros', desc: 'Refrigerators, washers, ovens & HVAC' },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/50 via-white to-white py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              Next-Gen Local Service Marketplace
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Expert Home & Commercial Services, <span className="text-blue-600">On Demand</span>.
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-slate-600 leading-relaxed">
              Find verified, vetted local professionals with live calendar availability, upfront pricing, secure Stripe payments, and real-time chat.
            </p>

            {/* Quick Search Bar */}
            <div className="mt-10 max-w-2xl mx-auto flex flex-col sm:flex-row gap-2 p-2 bg-white rounded-2xl shadow-xl border border-slate-200">
              <div className="flex items-center gap-2 px-3 flex-1">
                <Search className="w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="What service do you need? (e.g. Electrician, Plumbing)"
                  className="w-full py-2 bg-transparent text-slate-900 text-sm focus:outline-none"
                />
              </div>
              <Link
                to="/register"
                className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition shadow-md"
              >
                Find Pros
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Stats / Trust Badges */}
            <div className="mt-12 grid grid-cols-3 gap-6 max-w-lg mx-auto text-center border-t border-slate-100 pt-8">
              <div>
                <div className="text-2xl font-bold text-slate-900">10,000+</div>
                <div className="text-xs text-slate-500 mt-1">Completed Bookings</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">4.9 / 5.0</div>
                <div className="text-xs text-slate-500 mt-1">Average Pro Rating</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">100%</div>
                <div className="text-xs text-slate-500 mt-1">Verified Backgrounds</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Categories Grid */}
      <section className="py-16 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Popular Service Categories</h2>
              <p className="text-slate-500 text-sm mt-1">Explore top-rated services delivered right to your doorstep</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((cat, i) => (
              <div
                key={i}
                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-400 transition cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-3xl">{cat.icon}</span>
                  <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
                    {cat.count}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition">
                  {cat.name}
                </h3>
                <p className="text-sm text-slate-500 mt-1">{cat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose LocalPro */}
      <section className="py-16 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-bold text-slate-900">Built For Trust & Frictionless Booking</h2>
            <p className="text-slate-500 text-sm mt-2">Every feature designed to give you peace of mind</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-blue-50/50 border border-blue-100">
              <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center mb-4 shadow-md">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Vetted Professionals</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                All specialists undergo rigorous document & license checks by platform administrators before accepting jobs.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-emerald-50/50 border border-emerald-100">
              <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center mb-4 shadow-md">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Real-Time Scheduling</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Inspect live calendar slots with automatic conflict detection, eliminating double bookings and back-and-forth calls.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-amber-50/50 border border-amber-100">
              <div className="w-12 h-12 rounded-xl bg-amber-600 text-white flex items-center justify-center mb-4 shadow-md">
                <Star className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Verified Reviews</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Only customers with confirmed, completed bookings can submit reviews, ensuring authentic feedback and ratings.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center sm:text-left flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <span className="text-lg font-bold text-white">Local<span className="text-blue-500">Pro</span></span>
            <p className="text-xs text-slate-400 mt-1">Full-Stack Multi-Role Service Marketplace</p>
          </div>
          <div className="text-xs text-slate-500">
            &copy; 2026 LocalPro Platform. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};
