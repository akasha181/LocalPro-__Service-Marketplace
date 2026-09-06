import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Shield,
  Users,
  Briefcase,
  Calendar,
  DollarSign,
  CheckCircle,
  XCircle,
  Search,
  Plus,
  AlertCircle,
  UserCheck,
  UserX,
  Sparkles
} from 'lucide-react';

interface AdminStats {
  totalUsers: number;
  totalPros: number;
  pendingApprovals: number;
  totalBookings: number;
  totalRevenue: number;
}

interface UserItem {
  _id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  isActive: boolean;
  createdAt: string;
}

interface ProItem {
  _id: string;
  title: string;
  hourlyRate: number;
  experienceYears: number;
  isApproved: boolean;
  category: {
    _id: string;
    name: string;
  };
  userId: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  location: {
    city: string;
    state: string;
  };
}

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [professionals, setProfessionals] = useState<ProItem[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'pros' | 'users' | 'categories'>('overview');
  const [userSearch, setUserSearch] = useState<string>('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // New Category State
  const [catName, setCatName] = useState<string>('');
  const [catDesc, setCatDesc] = useState<string>('');
  const [catSuccess, setCatSuccess] = useState<string | null>(null);

  const fetchAdminData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, usersRes, prosRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users'),
        api.get('/admin/professionals'),
      ]);

      if (statsRes.data.success) setStats(statsRes.data.data.stats);
      if (usersRes.data.success) setUsers(usersRes.data.data.users);
      if (prosRes.data.success) setProfessionals(prosRes.data.data.professionals);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleToggleProApproval = async (proId: string, currentStatus: boolean) => {
    try {
      const res = await api.patch(`/admin/professionals/${proId}/approval`, {
        isApproved: !currentStatus,
      });
      if (res.data.success) {
        setProfessionals((prev) =>
          prev.map((p) => (p._id === proId ? { ...p, isApproved: !currentStatus } : p))
        );
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update approval status');
    }
  };

  const handleToggleUserStatus = async (userId: string) => {
    try {
      const res = await api.patch(`/admin/users/${userId}/status`);
      if (res.data.success) {
        setUsers((prev) =>
          prev.map((u) => (u._id === userId ? { ...u, isActive: !u.isActive } : u))
        );
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update user status');
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setCatSuccess(null);
    try {
      const res = await api.post('/categories', {
        name: catName,
        description: catDesc,
        icon: 'Sparkles',
      });
      if (res.data.success) {
        setCatSuccess(`Category "${catName}" created successfully!`);
        setCatName('');
        setCatDesc('');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create category');
    }
  };

  const filteredUsers = users.filter((u) => {
    if (userRoleFilter !== 'ALL' && u.role !== userRoleFilter) return false;
    if (userSearch.trim()) {
      const q = userSearch.toLowerCase();
      return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Admin Portal Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold mb-2">
            <Shield className="w-3.5 h-3.5" />
            Platform Governance & Moderation
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Admin Control Center</h1>
          <p className="text-slate-500 text-sm mt-1">
            System overview, specialist credentials verification, and account oversight.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {[
            { id: 'overview', label: 'Platform Stats' },
            { id: 'pros', label: `Specialists (${professionals.length})` },
            { id: 'users', label: `Users (${users.length})` },
            { id: 'categories', label: 'Taxonomies' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                activeTab === tab.id
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">Platform Volume</span>
          <div className="text-2xl font-black text-slate-900 mt-1">${stats?.totalRevenue || 0}</div>
          <span className="text-[11px] text-emerald-600 font-medium mt-1 block">Gross Merchandise Value</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">Registered Users</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{stats?.totalUsers || 0}</div>
          <span className="text-[11px] text-slate-400 font-medium mt-1 block">Platform accounts</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">Active Specialists</span>
          <div className="text-2xl font-black text-blue-600 mt-1">{stats?.totalPros || 0}</div>
          <span className="text-[11px] text-slate-400 font-medium mt-1 block">Approved & verified</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">Total Bookings</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{stats?.totalBookings || 0}</div>
          <span className="text-[11px] text-slate-400 font-medium mt-1 block">All appointments</span>
        </div>
      </div>

      {/* Tab: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-900 text-base mb-4">Quick Governance Actions</h3>
            <div className="space-y-3">
              <button
                onClick={() => setActiveTab('pros')}
                className="w-full p-4 rounded-xl border border-slate-200 hover:border-blue-300 transition flex items-center justify-between text-left"
              >
                <div>
                  <h4 className="font-semibold text-slate-900 text-sm">Review Specialist Credentials</h4>
                  <p className="text-xs text-slate-500">Approve trade licenses, ratings, and portfolio uploads</p>
                </div>
                <Briefcase className="w-5 h-5 text-blue-600" />
              </button>

              <button
                onClick={() => setActiveTab('users')}
                className="w-full p-4 rounded-xl border border-slate-200 hover:border-blue-300 transition flex items-center justify-between text-left"
              >
                <div>
                  <h4 className="font-semibold text-slate-900 text-sm">Manage User Accounts</h4>
                  <p className="text-xs text-slate-500">Search customer/pro accounts and toggle access status</p>
                </div>
                <Users className="w-5 h-5 text-slate-600" />
              </button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-900 text-base mb-4">Security & RBAC Enforcement</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Every sensitive endpoint is strictly wrapped with JWT Bearer verification and <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-600 font-mono">authorizeRoles('admin')</code> middleware. Suspended accounts are barred at both the JWT authentication middleware and login gate.
            </p>
          </div>
        </div>
      )}

      {/* Tab: Professionals Management */}
      {activeTab === 'pros' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Specialist Approvals & Moderation</h2>
            <span className="text-xs text-slate-500">{professionals.length} specialists registered</span>
          </div>

          <div className="divide-y divide-slate-100">
            {professionals.map((pro) => (
              <div key={pro._id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <img
                    src={pro.userId?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'}
                    alt={pro.userId?.name}
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-slate-100"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-sm">{pro.userId?.name}</h4>
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700">
                        {pro.category?.name}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">{pro.title}</p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                      <span>Rate: ${pro.hourlyRate}/hr</span>
                      <span>•</span>
                      <span>Experience: {pro.experienceYears} yrs</span>
                      <span>•</span>
                      <span>{pro.location?.city}, {pro.location?.state}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                      pro.isApproved
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    {pro.isApproved ? 'Approved' : 'Pending Verification'}
                  </span>

                  <button
                    onClick={() => handleToggleProApproval(pro._id, pro.isApproved)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                      pro.isApproved
                        ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                        : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm'
                    }`}
                  >
                    {pro.isApproved ? 'Revoke Approval' : 'Approve Specialist'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Users Management */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2">
              {['ALL', 'customer', 'professional', 'admin'].map((role) => (
                <button
                  key={role}
                  onClick={() => setUserRoleFilter(role)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition ${
                    userRoleFilter === role
                      ? 'bg-slate-900 text-white'
                      : 'bg-white text-slate-600 border border-slate-200'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3 font-semibold">User</th>
                  <th className="px-6 py-3 font-semibold">Role</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                  <th className="px-6 py-3 font-semibold">Registered</th>
                  <th className="px-6 py-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      <div>{u.name}</div>
                      <div className="text-[11px] font-normal text-slate-400">{u.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="uppercase font-bold text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`font-semibold px-2 py-0.5 rounded-full text-[10px] ${
                          u.isActive
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {u.isActive ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {u.role !== 'admin' && (
                        <button
                          onClick={() => handleToggleUserStatus(u._id)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                            u.isActive
                              ? 'text-rose-600 hover:bg-rose-50'
                              : 'text-emerald-600 hover:bg-emerald-50'
                          }`}
                        >
                          {u.isActive ? 'Suspend' : 'Reactivate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Categories */}
      {activeTab === 'categories' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 max-w-lg shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-1">Add Marketplace Category</h2>
          <p className="text-xs text-slate-500 mb-6">Create a new service taxonomy visible on the public discovery catalog</p>

          {catSuccess && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700">
              {catSuccess}
            </div>
          )}

          <form onSubmit={handleCreateCategory} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Pest Control & Extermination"
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
              <textarea
                rows={3}
                placeholder="Describe services offered under this taxonomy..."
                value={catDesc}
                onChange={(e) => setCatDesc(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
            >
              Add Category Taxonomy
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
