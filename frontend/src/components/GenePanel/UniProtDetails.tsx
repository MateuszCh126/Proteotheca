import React from 'react';
import { UniProtData } from '../../types/gene';
import { useI18n } from '../../context/I18nContext';

interface UniProtDetailsProps {
  uniprot: UniProtData;
}

export const UniProtDetails: React.FC<UniProtDetailsProps> = ({ uniprot }) => {
  const { t } = useI18n();

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-4">
        <div className="p-3 bg-wash rounded-xl border border-line">
          <span className="text-3xs uppercase tracking-wider text-ink-2 block mb-0.5">{t('gene.accession')}</span>
          <span className="text-sm font-bold text-ink font-mono">{uniprot.accession}</span>
        </div>
        <div className="p-3 bg-wash rounded-xl border border-line">
          <span className="text-3xs uppercase tracking-wider text-ink-2 block mb-0.5">{t('gene.entryName')}</span>
          <span className="text-sm font-bold text-ink font-mono">{uniprot.name}</span>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-3xs uppercase tracking-wider text-ink-2">
          <span>{t('gene.sequence', { count: uniprot.sequence.length })}</span>
        </div>
        <div className="p-3 bg-wash rounded-xl border border-line text-2xs font-mono text-ink/90 break-all h-28 overflow-y-auto custom-scrollbar leading-relaxed">
          {uniprot.sequence}
        </div>
      </div>
    </div>
  );
};
export default UniProtDetails;
