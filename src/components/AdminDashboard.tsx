import React, { useState, useEffect } from 'react';
import { api } from '../services/api.ts';
import { AirtableConfigStatus, Destination } from '../types/index.ts';
import {
  Shield,
  Database,
  Users,
  Calendar,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Key,
  ExternalLink,
  Plus,
  Table as TableIcon,
  Download,
  Copy,
  Check,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface AdminDashboardProps {
  onDestinationAdded?: (dest: Destination) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onDestinationAdded }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'moderation' | 'airtable' | 'destinations'>('airtable');
  const [stats, setStats] = useState<any>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [airtableStatus, setAirtableStatus] = useState<AirtableConfigStatus | null>(null);
  const [schemaData, setSchemaData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Airtable config form
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [baseIdInput, setBaseIdInput] = useState('');
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [testingConnection, setTestingConnection] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [copiedSchema, setCopiedSchema] = useState(false);

  // Destination add form
  const [newDest, setNewDest] = useState({
    destinationName: '',
    country: '',
    city: '',
    stateOrRegion: '',
    category: 'Adventure',
    estimatedBudget: 1200,
    recommendedDuration: '5-7 days',
    bestVisitingSeason: 'May - Sep',
    description: '',
    attractions: 'Mountain Trail, Historic Market, Panoramic Viewpoint',
  });

  const loadAdminData = async () => {
    try {
      const [s, r, a, sch] = await Promise.all([
        api.getAdminStats(),
        api.getAdminReports(),
        api.getAirtableConfig(),
        api.getAirtableSchema(),
      ]);
      setStats(s);
      setReports(r.reports);
      setAirtableStatus(a);
      setSchemaData(sch);
      if (a.baseId) setBaseIdInput(a.baseId);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setTestResult(null);
    try {
      const res = await api.testAirtableConnection(apiKeyInput || undefined, baseIdInput || undefined);
      setTestResult(res);
      await loadAdminData();
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || 'Connection failed' });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSaveAirtableConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.updateAirtableConfig({
        apiKey: apiKeyInput,
        baseId: baseIdInput,
      });
      alert('Airtable credentials saved successfully in backend environment.');
      await loadAdminData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSyncPush = async () => {
    setSyncing(true);
    try {
      const res = await api.syncPushAirtable();
      alert(res.message);
      await loadAdminData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleResolveReport = async (reportId: string, status: string, action?: string) => {
    try {
      await api.resolveReport(reportId, status, action);
      await loadAdminData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCreateDestination = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await api.createDestination({
        ...newDest,
        category: newDest.category as any,
        attractions: newDest.attractions.split(',').map(s => s.trim()),
      });
      alert('Destination created and added to directory!');
      onDestinationAdded?.(created.destination);
      setNewDest({
        destinationName: '',
        country: '',
        city: '',
        stateOrRegion: '',
        category: 'Adventure',
        estimatedBudget: 1200,
        recommendedDuration: '5-7 days',
        bestVisitingSeason: 'May - Sep',
        description: '',
        attractions: 'Mountain Trail, Historic Market, Panoramic Viewpoint',
      });
      await loadAdminData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCopySchemaJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(schemaData, null, 2));
    setCopiedSchema(true);
    setTimeout(() => setCopiedSchema(false), 2000);
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#27866A] uppercase tracking-wider">
            <Shield className="w-4 h-4" />
            <span>Admin Console · Role-Based Access Control</span>
          </div>
          <h1 className="text-3xl font-bold font-display text-[#174D3C] tracking-tight mt-1">
            TripMates Operations & Airtable Control
          </h1>
        </div>

        <button
          onClick={loadAdminData}
          className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-[#EFECE3] border border-[#E5E3D8] text-xs font-medium text-[#174D3C] rounded-lg transition-colors cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* KPI Stats Strip */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="p-4 bg-white rounded-xl border border-[#E5E3D8] shadow-xs">
            <div className="text-[11px] text-[#8A9790]">Total Users</div>
            <div className="text-xl font-bold font-mono tabular-nums text-[#174D3C] mt-1">
              {stats.totalUsers}
            </div>
          </div>
          <div className="p-4 bg-white rounded-xl border border-[#E5E3D8] shadow-xs">
            <div className="text-[11px] text-[#8A9790]">Active Trips</div>
            <div className="text-xl font-bold font-mono tabular-nums text-[#27866A] mt-1">
              {stats.activeTrips}
            </div>
          </div>
          <div className="p-4 bg-white rounded-xl border border-[#E5E3D8] shadow-xs">
            <div className="text-[11px] text-[#8A9790]">Destinations</div>
            <div className="text-xl font-bold font-mono tabular-nums text-[#174D3C] mt-1">
              {stats.destinationsCount}
            </div>
          </div>
          <div className="p-4 bg-white rounded-xl border border-[#E5E3D8] shadow-xs">
            <div className="text-[11px] text-[#8A9790]">Community Posts</div>
            <div className="text-xl font-bold font-mono tabular-nums text-[#202824] mt-1">
              {stats.totalPosts}
            </div>
          </div>
          <div className="p-4 bg-white rounded-xl border border-[#E5E3D8] shadow-xs">
            <div className="text-[11px] text-[#8A9790]">Pending Reports</div>
            <div className={`text-xl font-bold font-mono tabular-nums mt-1 ${stats.pendingReports > 0 ? 'text-amber-600' : 'text-[#8A9790]'}`}>
              {stats.pendingReports}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-[#E5E3D8] pb-1 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('airtable')}
          className={`pb-2.5 transition-colors cursor-pointer flex items-center gap-1.5 relative ${
            activeTab === 'airtable'
              ? 'text-[#174D3C] font-bold'
              : 'text-[#8A9790] hover:text-[#5E6963]'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Airtable Base & Schema (10 Tables)</span>
          {activeTab === 'airtable' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#174D3C] rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('moderation')}
          className={`pb-2.5 transition-colors cursor-pointer flex items-center gap-1.5 relative ${
            activeTab === 'moderation'
              ? 'text-[#174D3C] font-bold'
              : 'text-[#8A9790] hover:text-[#5E6963]'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Safety & Moderation Queue ({reports.length})</span>
          {activeTab === 'moderation' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#174D3C] rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('destinations')}
          className={`pb-2.5 transition-colors cursor-pointer flex items-center gap-1.5 relative ${
            activeTab === 'destinations'
              ? 'text-[#174D3C] font-bold'
              : 'text-[#8A9790] hover:text-[#5E6963]'
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Destination</span>
          {activeTab === 'destinations' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#174D3C] rounded-full" />
          )}
        </button>
      </div>

      {/* Tab 1: Airtable Base & Schema Explorer */}
      {activeTab === 'airtable' && (
        <div className="space-y-6">
          {/* Status & Connection Panel */}
          <div className="bg-white p-6 rounded-2xl border border-[#E5E3D8] shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold font-display text-base text-[#174D3C] flex items-center gap-2">
                  <Database className="w-5 h-5 text-[#27866A]" />
                  <span>TripMates Production Database</span>
                </h3>
                <p className="text-xs text-[#5E6963] mt-0.5">
                  Airtable Base linked tables, record counts, and synchronization bridge.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                  airtableStatus?.isConfigured
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border border-amber-200'
                }`}>
                  {airtableStatus?.isConfigured ? 'Airtable Sync Ready' : 'Local Persistence (Ready for Base Token)'}
                </span>
              </div>
            </div>

            {/* Airtable API Configuration Form */}
            <form onSubmit={handleSaveAirtableConfig} className="p-4 bg-[#F8F7F2] rounded-xl border border-[#E5E3D8] space-y-3 text-xs">
              <div className="font-semibold text-[#174D3C]">Airtable API Credentials (Server-Side Storage)</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-[#5E6963] block mb-1">
                    Airtable Personal Access Token (PAT)
                  </label>
                  <input
                    type="password"
                    placeholder="pat..."
                    value={apiKeyInput}
                    onChange={e => setApiKeyInput(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#E5E3D8] rounded-lg font-mono text-xs"
                  />
                  <div className="text-[10px] text-[#8A9790] mt-1">
                    Scopes required: data.records:read, data.records:write
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-[#5E6963] block mb-1">
                    Airtable Base ID
                  </label>
                  <input
                    type="text"
                    placeholder="app..."
                    value={baseIdInput}
                    onChange={e => setBaseIdInput(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#E5E3D8] rounded-lg font-mono text-xs"
                  />
                  <div className="text-[10px] text-[#8A9790] mt-1">
                    Found in your Airtable Base URL: airtable.com/app...
                  </div>
                </div>
              </div>

              {testResult && (
                <div className={`p-3 rounded-lg text-xs font-medium ${
                  testResult.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  {testResult.message}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                <button
                  type="button"
                  disabled={testingConnection}
                  onClick={handleTestConnection}
                  className="px-4 py-2 bg-white hover:bg-[#EFECE3] border border-[#E5E3D8] text-[#174D3C] text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  {testingConnection ? 'Testing...' : 'Test Connection'}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={syncing}
                    onClick={handleSyncPush}
                    className="px-4 py-2 bg-[#27866A] hover:bg-[#1F644E] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    {syncing ? 'Pushing Data...' : 'Sync Push to Airtable'}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#174D3C] hover:bg-[#0F362A] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    Save Credentials
                  </button>
                </div>
              </div>
            </form>

            {/* 10 Linked Tables Grid */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-[#174D3C] uppercase tracking-wider">
                  Configured Airtable Tables (10 Required Entities)
                </h4>
                <button
                  onClick={handleCopySchemaJSON}
                  className="flex items-center gap-1 text-xs font-semibold text-[#27866A] hover:underline cursor-pointer"
                >
                  {copiedSchema ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSchema ? 'Copied Schema JSON' : 'Copy Schema Definition'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {airtableStatus?.tables.map((table, idx) => (
                  <div
                    key={table.tableName}
                    className="p-3 bg-[#F8F7F2] rounded-xl border border-[#E5E3D8] space-y-1"
                  >
                    <div className="text-[10px] text-[#8A9790] font-mono">Table {idx + 1}</div>
                    <div className="text-xs font-bold text-[#174D3C]">{table.tableName}</div>
                    <div className="text-xs font-mono tabular-nums text-[#5E6963]">
                      {table.recordCount} records
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Detailed Table Schemas Inspector */}
            {schemaData && (
              <div className="space-y-4 pt-4 border-t border-[#EFECE3]">
                <h4 className="text-xs font-bold text-[#174D3C] uppercase tracking-wider">
                  Airtable Base Schema Specifications & Field Relationships
                </h4>
                <div className="space-y-3">
                  {schemaData.tables?.map((table: any) => (
                    <div key={table.name} className="p-4 bg-white border border-[#E5E3D8] rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="font-semibold text-xs text-[#174D3C]">
                          Table: {table.name}
                        </div>
                        <span className="text-[11px] text-[#8A9790]">{table.fields.length} fields</span>
                      </div>
                      <p className="text-[11px] text-[#5E6963]">{table.description}</p>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {table.fields.map((f: any) => (
                          <span
                            key={f.name}
                            className="px-2 py-0.5 bg-[#F8F7F2] rounded text-[10px] text-[#202824] border border-[#E5E3D8]"
                          >
                            <span className="font-medium">{f.name}</span>
                            <span className="text-[#8A9790] ml-1">({f.type})</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Safety & Moderation Queue */}
      {activeTab === 'moderation' && (
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-[#E5E3D8] shadow-sm space-y-4">
            <h3 className="font-bold font-display text-base text-[#174D3C]">
              Safety Reports & User Flags
            </h3>
            <p className="text-xs text-[#5E6963]">
              Review reported community posts, spam flags, and user accounts. Administrative actions update
              database moderation statuses in real time.
            </p>

            {reports.length === 0 ? (
              <div className="text-center py-12 text-xs text-[#8A9790]">
                No reports submitted. The travel community is safe and respectful!
              </div>
            ) : (
              <div className="space-y-3">
                {reports.map((r: any) => (
                  <div
                    key={r.id}
                    className="p-4 bg-[#F8F7F2] border border-[#E5E3D8] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#174D3C] font-mono">{r.reportId}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-semibold text-red-700">{r.reason}</span>
                        <span aria-hidden="true">·</span>
                        <span className="text-[#8A9790]">
                          Status: {r.reportStatus}
                        </span>
                      </div>
                      <div className="text-[#202824]">{r.description}</div>
                      <div className="text-[11px] text-[#8A9790]">
                        Reported by: {r.reporterProfile?.fullName || 'Traveler'} · {new Date(r.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        onClick={() => handleResolveReport(r.id, 'dismissed')}
                        className="px-3 py-1.5 bg-white hover:bg-[#EFECE3] border border-[#E5E3D8] text-[#5E6963] rounded-lg transition-colors cursor-pointer"
                      >
                        Dismiss
                      </button>
                      <button
                        onClick={() => handleResolveReport(r.id, 'resolved', 'remove_post')}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors cursor-pointer font-medium"
                      >
                        Remove Content
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Destination Creator */}
      {activeTab === 'destinations' && (
        <form
          onSubmit={handleCreateDestination}
          className="bg-white p-6 rounded-2xl border border-[#E5E3D8] shadow-sm space-y-4 max-w-2xl text-xs"
        >
          <h3 className="font-bold font-display text-base text-[#174D3C]">
            Add Curated Global Destination
          </h3>
          <p className="text-[#5E6963]">
            Add verified tourism hotspots, average budgets, and ideal visiting windows to Airtable.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-[#174D3C] block mb-1">
                Destination Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Swiss Alps & Zermatt Matterhorn"
                value={newDest.destinationName}
                onChange={e => setNewDest({ ...newDest, destinationName: e.target.value })}
                className="w-full px-3 py-2 bg-[#F8F7F2] border border-[#E5E3D8] rounded-lg"
                required
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-[#174D3C] block mb-1">
                Country *
              </label>
              <input
                type="text"
                placeholder="e.g. Switzerland"
                value={newDest.country}
                onChange={e => setNewDest({ ...newDest, country: e.target.value })}
                className="w-full px-3 py-2 bg-[#F8F7F2] border border-[#E5E3D8] rounded-lg"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-[#174D3C] block mb-1">
                Category
              </label>
              <select
                value={newDest.category}
                onChange={e => setNewDest({ ...newDest, category: e.target.value })}
                className="w-full px-3 py-2 bg-[#F8F7F2] border border-[#E5E3D8] rounded-lg"
              >
                <option value="Mountains">Mountains</option>
                <option value="Beaches">Beaches</option>
                <option value="Heritage">Heritage</option>
                <option value="Adventure">Adventure</option>
                <option value="Food">Food</option>
                <option value="Weekend Getaways">Weekend Getaways</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-[#174D3C] block mb-1">
                Est. Budget ($)
              </label>
              <input
                type="number"
                value={newDest.estimatedBudget}
                onChange={e => setNewDest({ ...newDest, estimatedBudget: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-[#F8F7F2] border border-[#E5E3D8] rounded-lg"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-[#174D3C] block mb-1">
                Recommended Duration
              </label>
              <input
                type="text"
                value={newDest.recommendedDuration}
                onChange={e => setNewDest({ ...newDest, recommendedDuration: e.target.value })}
                className="w-full px-3 py-2 bg-[#F8F7F2] border border-[#E5E3D8] rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-[#174D3C] block mb-1">
              Highlights & Attractions (comma separated)
            </label>
            <input
              type="text"
              value={newDest.attractions}
              onChange={e => setNewDest({ ...newDest, attractions: e.target.value })}
              className="w-full px-3 py-2 bg-[#F8F7F2] border border-[#E5E3D8] rounded-lg"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-[#174D3C] block mb-1">
              Description
            </label>
            <textarea
              rows={3}
              value={newDest.description}
              onChange={e => setNewDest({ ...newDest, description: e.target.value })}
              className="w-full px-3 py-2 bg-[#F8F7F2] border border-[#E5E3D8] rounded-lg"
            />
          </div>

          <button
            type="submit"
            className="px-6 py-2.5 bg-[#174D3C] hover:bg-[#1F644E] text-white font-semibold rounded-lg cursor-pointer transition-colors"
          >
            Create Destination
          </button>
        </form>
      )}
    </div>
  );
};
