import React from 'react';
import { ClinVarData } from '../../types/variant';
import { AlertCircle, CheckCircle, HelpCircle } from 'lucide-react';
import { useI18n } from '../../context/I18nContext';

interface ClinVarCardProps {
  clinvar: ClinVarData;
}

export const ClinVarCard: React.FC<ClinVarCardProps> = ({ clinvar }) => {
  const { t } = useI18n();
  const isPathogenic = clinvar.pathogenicity.toLowerCase().includes('pathogenic');
  const isBenign = clinvar.pathogenicity.toLowerCase().includes('benign');

  let badgeColor = 'bg-slate-500/10 text-slate-400 border-slate-500/25';
  let Icon = HelpCircle;

  if (isPathogenic) {
    badgeColor = 'bg-rose-500/10 text-rose-400 border-rose-500/25';
    Icon = AlertCircle;
  } else if (isBenign) {
    badgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25';
    Icon = CheckCircle;
  }

  return (
    <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-3xs uppercase tracking-wider text-slate-400 font-bold">{t('variant.clinvarSignificance')}</span>
        <div className={`flex items-center space-x-1.5 px-2 py-0.5 rounded border text-xs font-bold font-outfit ${badgeColor}`}>
          <Icon className="w-3.5 h-3.5" />
          <span>{clinvar.pathogenicity}</span>
        </div>
      </div>

      <div className="space-y-1">
        <span className="text-3xs uppercase tracking-wider text-slate-500 block">{t('variant.interpretationDetails')}</span>
        <p className="text-xs text-slate-200 leading-relaxed font-outfit">
          {clinvar.significance}
        </p>
      </div>

      <div className="pt-2 border-t border-white/5 flex items-center justify-between text-3xs font-mono text-slate-400">
        <span>{t('variant.reviewStatus')}</span>
        <span className="font-bold text-slate-300">{clinvar.review_status}</span>
      </div>
    </div>
  );
};
export default ClinVarCard;
