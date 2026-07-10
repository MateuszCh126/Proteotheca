import React, { useState, useMemo } from 'react';
import { ClinicalTrial } from '../../types/disease';
import { ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useI18n } from '../../context/I18nContext';

interface ClinicalTrialsListProps {
  trials: ClinicalTrial[];
}

export const ClinicalTrialsList: React.FC<ClinicalTrialsListProps> = ({ trials }) => {
  const { t } = useI18n();
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'COMPLETED' | 'RECRUITING'>('ALL');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;

  const filteredAndSortedTrials = useMemo(() => {
    // 1. Filter
    let result = trials;
    if (statusFilter !== 'ALL') {
      result = trials.filter(t => t.status === statusFilter);
    }

    // 2. Sort
    result = [...result].sort((a, b) => {
      const titleA = a.title.toLowerCase();
      const titleB = b.title.toLowerCase();
      if (sortOrder === 'asc') {
        return titleA.localeCompare(titleB);
      } else {
        return titleB.localeCompare(titleA);
      }
    });

    return result;
  }, [trials, statusFilter, sortOrder]);

  const paginatedTrials = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedTrials.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedTrials, currentPage]);

  const totalPages = Math.ceil(filteredAndSortedTrials.length / itemsPerPage);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const getStatusBadge = (status: string) => {
    let color = 'bg-ink-3/10 text-ink-2 border-slate-500/20';
    if (status === 'COMPLETED') {
      color = 'bg-emerald-500/15 text-benign border-line';
    } else if (status === 'RECRUITING') {
      color = 'bg-ink/15 text-ink border-line';
    } else if (status === 'ACTIVE_NOT_RECRUITING') {
      color = 'bg-indigo-500/15 text-ink border-indigo-500/20';
    }
    return (
      <span
        data-testid="trial-status-badge"
        className={`text-3xs uppercase tracking-wider px-2 py-0.5 rounded border font-semibold ${color}`}
      >
        {status === 'COMPLETED'
          ? t('therapeutic.completed')
          : status === 'RECRUITING'
            ? t('therapeutic.recruiting')
            : status === 'ACTIVE_NOT_RECRUITING'
              ? t('therapeutic.activeNotRecruiting')
              : status.replace(/_/g, ' ')}
      </span>
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-3xs uppercase tracking-wider text-ink-2 font-bold">
          {t('therapeutic.registry', { count: filteredAndSortedTrials.length })}
        </span>

        {/* Filters & Sorting Controls */}
        <div className="flex items-center space-x-2">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as any);
              setCurrentPage(1);
            }}
            className="bg-surface border border-line text-ink-2 text-3xs rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-ink/30"
          >
            <option value="ALL">{t('therapeutic.allStatus')}</option>
            <option value="COMPLETED">{t('therapeutic.completed')}</option>
            <option value="RECRUITING">{t('therapeutic.recruiting')}</option>
          </select>

          <button
            onClick={() => setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))}
            className="p-1 hover:bg-wash border border-line rounded text-ink-2 transition-colors"
            title={t('therapeutic.sortByTitle')}
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {paginatedTrials.length === 0 ? (
          <div className="p-4 text-center text-xs text-ink-3 italic border border-dashed border-line rounded-xl">
            {t('therapeutic.noTrials')}
          </div>
        ) : (
          paginatedTrials.map((trial) => (
            <div
              key={trial.nct_id}
              data-testid={`clinical-trial-row-${trial.nct_id.toLowerCase()}`}
              className="p-3 bg-wash border border-line rounded-xl space-y-2 hover:bg-wash transition-colors"
            >
              <div className="flex justify-between items-start">
                <span className="text-3xs font-mono font-bold text-ink uppercase">
                  {trial.nct_id}
                </span>
                {getStatusBadge(trial.status)}
              </div>
              <p className="text-xs text-ink leading-normal font-sans line-clamp-2">
                {trial.title}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-1 text-2xs text-ink-2 font-mono">
          <span>
            {t('common.pageOf', { current: currentPage, total: totalPages })}
          </span>
          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-1 rounded bg-wash hover:bg-wash disabled:opacity-40 disabled:hover:bg-wash transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-1 rounded bg-wash hover:bg-wash disabled:opacity-40 disabled:hover:bg-wash transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
export default ClinicalTrialsList;
