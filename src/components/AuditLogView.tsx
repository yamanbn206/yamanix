import React, { useState, useEffect } from 'react';
import { storage } from '../lib/storage';
import { Language, t } from '../lib/i18n';
import { History, Search, Filter, Calendar, User, Table, Clock, RefreshCw, Trash2 } from 'lucide-react';

interface AuditLogViewProps {
  lang?: Language;
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({ lang = 'en' }) => {
  const isAr = lang === 'ar';
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState<string>('all');
  const [filterTable, setFilterTable] = useState<string>('all');

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await storage.getAuditLogs();
      setLogs(data);
    } catch (error) {
      console.error('Failed to load audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionBadge = (action: string) => {
    const colors: Record<string, string> = {
      save: 'bg-emerald-100 text-emerald-800',
      save_failed: 'bg-rose-100 text-rose-800',
      delete: 'bg-rose-100 text-rose-800',
      update: 'bg-blue-100 text-blue-800',
      insert: 'bg-emerald-100 text-emerald-800',
    };
    return colors[action] || 'bg-slate-100 text-slate-800';
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.table_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction = filterAction === 'all' || log.action === filterAction;
    const matchesTable = filterTable === 'all' || log.table_name === filterTable;
    return matchesSearch && matchesAction && matchesTable;
  });

  const uniqueTables = [...new Set(logs.map(l => l.table_name))];
  const uniqueActions = [...new Set(logs.map(l => l.action))];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <History className="w-6 h-6 text-blue-600" />
            {isAr ? 'سجل العمليات والتدقيق' : 'Audit Log & Activity History'}
          </h2>
          <p className="text-xs text-slate-500">
            {isAr ? 'سجل كامل لجميع عمليات الإضافة والتعديل والحذف في النظام' : 'Complete record of all add, edit, and delete operations'}
          </p>
        </div>
        <button
          onClick={loadLogs}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow transition flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          {isAr ? 'تحديث' : 'Refresh'}
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={isAr ? 'بحث...' : 'Search...'}
            className="w-full pr-10 pl-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm"
          />
        </div>

        <select
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm"
        >
          <option value="all">{isAr ? 'جميع الإجراءات' : 'All Actions'}</option>
          {uniqueActions.map(action => (
            <option key={action} value={action}>{action}</option>
          ))}
        </select>

        <select
          value={filterTable}
          onChange={(e) => setFilterTable(e.target.value)}
          className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm"
        >
          <option value="all">{isAr ? 'جميع الجداول' : 'All Tables'}</option>
          {uniqueTables.map(table => (
            <option key={table} value={table}>{table}</option>
          ))}
        </select>

        <button
          onClick={() => { setSearchTerm(''); setFilterAction('all'); setFilterTable('all'); }}
          className="px-3 py-2 text-rose-500 text-xs font-bold"
        >
          {isAr ? 'إلغاء الفلترة' : 'Clear Filters'}
        </button>
      </div>

      {/* Logs Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-slate-500">{isAr ? 'جاري التحميل...' : 'Loading...'}</div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            {isAr ? 'لا توجد سجلات لعرضها' : 'No logs to display'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 text-xs font-bold">
                <tr>
                  <th className="p-4">{isAr ? 'الوقت' : 'Time'}</th>
                  <th className="p-4">{isAr ? 'المستخدم' : 'User'}</th>
                  <th className="p-4">{isAr ? 'الجدول' : 'Table'}</th>
                  <th className="p-4">{isAr ? 'الإجراء' : 'Action'}</th>
                  <th className="p-4">{isAr ? 'التفاصيل' : 'Details'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition">
                    <td className="p-4 text-xs font-mono text-slate-600 dark:text-slate-300">
                      {new Date(log.created_at).toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-US')}
                    </td>
                    <td className="p-4 text-xs text-slate-700 dark:text-slate-300">
                      {log.user_email}
                    </td>
                    <td className="p-4 text-xs font-mono text-slate-600 dark:text-slate-400">
                      {log.table_name}
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${getActionBadge(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-slate-600 dark:text-slate-400 max-w-xs truncate">
                      {typeof log.data === 'object' ? JSON.stringify(log.data).slice(0, 100) : log.data}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};