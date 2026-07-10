import React from 'react';
import { ChEMBLActiveCompound } from '../../types/disease';
import { ShieldAlert } from 'lucide-react';
import { useI18n } from '../../context/I18nContext';

interface ChemblDrugsTableProps {
  compounds: ChEMBLActiveCompound[];
}

export const ChemblDrugsTable: React.FC<ChemblDrugsTableProps> = ({ compounds }) => {
  const { t } = useI18n();

  return (
    <div className="space-y-2.5">
      <span className="text-3xs uppercase tracking-wider text-ink-2 font-bold block">
        {t('therapeutic.chemblBioactiveCompounds')}
      </span>
      <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-1">
        {compounds.map((c) => {
          const isPotent = c.ic50_nm < 10;
          return (
            <div
              key={c.chembl_id}
              data-testid="chembl-drug-card"
              className="p-3 bg-wash rounded-xl border border-line flex items-center justify-between text-xs hover:border-accent-success/20 transition-all"
            >
              <div>
                <span className="font-extrabold text-ink block font-sans uppercase">{c.name}</span>
                <span className="text-3xs font-mono text-ink-3">{c.chembl_id}</span>
              </div>
              <div className="text-right flex items-center space-x-2">
                <div>
                  <span className="text-3xs text-ink-2 block mb-0.5">IC50</span>
                  <span className="font-mono font-bold text-ink">
                    {c.ic50_nm.toFixed(2)} nM
                  </span>
                </div>
                {isPotent && (
                  <span className="text-3xs bg-wash text-benign border border-line px-2 py-0.5 rounded font-bold shadow-accent-success/10 shadow-md">
                    {t('therapeutic.highPotency')}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default ChemblDrugsTable;
