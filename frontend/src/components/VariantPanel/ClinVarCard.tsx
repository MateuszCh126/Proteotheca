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

  let badgeColor = 'bg-ink-3/10 text-ink-2 border-slate-500/25';
  let Icon = HelpCircle;

  if (isPathogenic) {
    badgeColor = 'bg-wash text-path border-rose-500/25';
    Icon = AlertCircle;
  } else if (isBenign) {
    badgeColor = 'bg-wash text-benign border-emerald-500/25';
    Icon = CheckCircle;
  }

  return (
    <div className="p-4 bg-wash rounded-xl border border-line space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-3xs uppercase tracking-wider text-ink-2 font-bold">{t('variant.clinvarSignificance')}</span>
        <div className={`flex items-center space-x-1.5 px-2 py-0.5 rounded border text-xs font-bold font-sans ${badgeColor}`}>
          <Icon className="w-3.5 h-3.5" />
          <span>{clinvar.pathogenicity}</span>
        </div>
      </div>

      <div className="space-y-1">
        <span className="text-3xs uppercase tracking-wider text-ink-3 block">{t('variant.interpretationDetails')}</span>
        <p className="text-xs text-ink leading-relaxed font-sans">
          {clinvar.significance}
        </p>
      </div>

      <div className="pt-2 border-t border-line flex items-center justify-between text-3xs font-mono text-ink-2">
        <span>{t('variant.reviewStatus')}</span>
        <span className="font-bold text-ink-2">{clinvar.review_status}</span>
      </div>
    </div>
  );
};
export default ClinVarCard;
