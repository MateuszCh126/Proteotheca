import React from 'react';
import { EnsemblTranscript } from '../../types/gene';
import { useI18n } from '../../context/I18nContext';

interface TranscriptsTableProps {
  transcripts: EnsemblTranscript[];
  selectedTranscriptId: string | null;
  onSelectTranscript: (id: string) => void;
}

export const TranscriptsTable: React.FC<TranscriptsTableProps> = ({
  transcripts,
  selectedTranscriptId,
  onSelectTranscript,
}) => {
  const { t } = useI18n();

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface/20">
      <table className="w-full text-left border-collapse" data-testid="transcripts-table">
        <thead>
          <tr className="border-b border-line bg-wash text-2xs uppercase tracking-wider text-ink-2 font-semibold">
            <th className="px-4 py-2.5">{t('gene.transcriptId')}</th>
            <th className="px-4 py-2.5 text-right">{t('gene.lengthBp')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line text-xs">
          {transcripts.map((t) => {
            const isSelected = t.transcript_id === selectedTranscriptId;
            return (
              <tr
                key={t.transcript_id}
                data-testid={`transcript-row-${t.transcript_id}`}
                onClick={() => onSelectTranscript(t.transcript_id)}
                className={`cursor-pointer transition-colors ${
                  isSelected ? 'bg-wash text-ink font-medium' : 'hover:bg-wash text-ink-2'
                }`}
              >
                <td className="px-4 py-2.5 font-mono">{t.transcript_id}</td>
                <td className="px-4 py-2.5 text-right font-mono">{t.length.toLocaleString()}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
export default TranscriptsTable;
