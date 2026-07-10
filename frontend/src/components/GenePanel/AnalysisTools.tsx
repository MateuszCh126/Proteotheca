import React, { useState } from 'react';
import { Play, AlignJustify, Search, Cpu, Database, ChevronDown, CheckCircle2 } from 'lucide-react';
import { useI18n } from '../../context/I18nContext';
import { GeneData } from '../../types/gene';

interface AnalysisToolsProps {
  geneData: GeneData;
}

type ToolMode = 'blast' | 'msa' | 'foldseek';

export const AnalysisTools: React.FC<AnalysisToolsProps> = ({ geneData }) => {
  const { t } = useI18n();
  const [activeTool, setActiveTool] = useState<ToolMode>('blast');
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [completed, setCompleted] = useState(false);

  // BLAST parameters
  const [blastDb, setBlastDb] = useState('uniprot');
  const [eValue, setEValue] = useState('1e-5');

  // MSA parameters
  const [selectedSpecies, setSelectedSpecies] = useState<string[]>(['human', 'mouse', 'rat']);

  // Foldseek parameters
  const [foldseekDb, setFoldseekDb] = useState('pdb');

  const runAnalysis = () => {
    setIsRunning(true);
    setProgress(0);
    setCompleted(false);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsRunning(false);
          setCompleted(true);
          return 100;
        }
        return prev + 20;
      });
    }, 200);
  };

  // Pre-configured alignment simulation data
  const symbol = geneData.symbol;

  const blastHits = [
    { id: `${symbol}_MOUSE`, desc: `${symbol} protein homolog [Mus musculus]`, identity: 94.2, evalue: '0.0', score: 2450 },
    { id: `${symbol}_RAT`, desc: `${symbol} protein homolog [Rattus norvegicus]`, identity: 92.8, evalue: '0.0', score: 2390 },
    { id: `ERBB2_HUMAN`, desc: 'Receptor tyrosine-protein kinase erbB-2 [Homo sapiens]', identity: 44.5, evalue: '2e-157', score: 980 },
    { id: `ERBB4_HUMAN`, desc: 'Receptor tyrosine-protein kinase erbB-4 [Homo sapiens]', identity: 41.2, evalue: '4e-142', score: 875 },
  ];

  const msaConsensus = 'L-G-A-G-S-F-G-T-V-Y-K-G-W-S-D-G-N-V-A-V-K-I-L-N-V-T-E-Q';
  const msaSequences = [
    { species: 'Human', seq: 'L-G-A-G-S-F-G-T-V-Y-K-G-W-S-D-G-N-V-A-V-K-I-L-N-V-T-E-Q' },
    { species: 'Mouse', seq: 'L-G-A-G-S-F-G-T-V-Y-K-G-W-S-D-G-N-V-A-V-K-I-L-N-V-S-E-Q' },
    { species: 'Rat',   seq: 'L-G-A-G-S-F-G-T-V-Y-K-G-W-S-N-G-N-V-A-V-K-I-L-N-V-S-E-Q' },
    { species: 'Zebrafish', seq: 'L-G-A-G-S-F-G-S-V-Y-K-G-L-S-D-G-S-V-A-V-K-V-L-K-V-D-E-H' },
  ];

  const foldseekHits = [
    { pdbId: symbol === 'EGFR' ? '1M17' : symbol === 'TP53' ? '1AIE' : '1UWH', chain: 'A', title: `${symbol} Kinase Domain (Self Match)`, tmScore: 1.0, rmsd: 0.0, alnRes: 275 },
    { pdbId: '2GS6', chain: 'A', title: 'Epidermal growth factor receptor active kinase domain', tmScore: 0.92, rmsd: 1.2, alnRes: 268 },
    { pdbId: '1IVO', chain: 'B', title: 'Extracellular domain of EGFR complexed with EGF receptor', tmScore: 0.78, rmsd: 2.1, alnRes: 242 },
  ];

  return (
    <div className="space-y-4" data-testid="analysis-tools-panel">
      {/* Sub tabs */}
      <div className="flex border-b border-line pb-2 gap-2">
        <button
          onClick={() => { setActiveTool('blast'); setCompleted(false); }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-2xs font-bold transition-all border ${
            activeTool === 'blast'
              ? 'bg-wash border-ink/25 text-ink'
              : 'border-transparent text-ink-2 hover:text-ink'
          }`}
        >
          <Search className="w-3.5 h-3.5" />
          BLAST / MMseqs2
        </button>
        <button
          onClick={() => { setActiveTool('msa'); setCompleted(false); }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-2xs font-bold transition-all border ${
            activeTool === 'msa'
              ? 'bg-wash border-ink/25 text-ink'
              : 'border-transparent text-ink-2 hover:text-ink'
          }`}
        >
          <AlignJustify className="w-3.5 h-3.5" />
          Clustal Omega MSA
        </button>
        <button
          onClick={() => { setActiveTool('foldseek'); setCompleted(false); }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-2xs font-bold transition-all border ${
            activeTool === 'foldseek'
              ? 'bg-wash border-ink/25 text-ink'
              : 'border-transparent text-ink-2 hover:text-ink'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          Foldseek 3D Search
        </button>
      </div>

      {/* Inputs Section */}
      <div className="p-3 bg-wash border border-line rounded-xl space-y-3">
        {activeTool === 'blast' && (
          <div className="space-y-2">
            <div className="flex justify-between items-center text-3xs font-mono text-ink-2">
              <span>Query Sequence Source: UniProt ({geneData.uniprot.accession})</span>
              <span>Length: {geneData.uniprot.sequence.length} AA</span>
            </div>
            <textarea
              readOnly
              value={geneData.uniprot.sequence}
              className="w-full h-16 bg-wash text-3xs font-mono p-2 rounded border border-line text-ink-2 focus:outline-none resize-none"
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-3xs uppercase tracking-wider text-ink-2 font-bold block mb-1">Target Database</label>
                <div className="relative">
                  <select
                    value={blastDb}
                    onChange={(e) => setBlastDb(e.target.value)}
                    className="w-full bg-surface border border-line text-ink rounded-lg px-2.5 py-1 text-2xs outline-none appearance-none"
                  >
                    <option value="uniprot">UniProtKB (Reference Proteomes)</option>
                    <option value="pdb">PDB Structures</option>
                    <option value="refseq">NCBI RefSeq Proteins</option>
                  </select>
                  <ChevronDown className="w-3 h-3 text-ink-2 absolute right-2.5 top-2 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="text-3xs uppercase tracking-wider text-ink-2 font-bold block mb-1">E-Value Threshold</label>
                <div className="relative">
                  <select
                    value={eValue}
                    onChange={(e) => setEValue(e.target.value)}
                    className="w-full bg-surface border border-line text-ink rounded-lg px-2.5 py-1 text-2xs outline-none appearance-none"
                  >
                    <option value="1e-5">1e-5 (Strict)</option>
                    <option value="1e-3">1e-3 (Medium)</option>
                    <option value="10">10 (Relaxed)</option>
                  </select>
                  <ChevronDown className="w-3 h-3 text-ink-2 absolute right-2.5 top-2 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTool === 'msa' && (
          <div className="space-y-3">
            <span className="text-3xs uppercase tracking-wider text-ink-2 font-bold block">
              Select Homologous Sequences to Align
            </span>
            <div className="grid grid-cols-2 gap-2 text-2xs">
              {['human', 'mouse', 'rat', 'zebrafish'].map((species) => {
                const isChecked = selectedSpecies.includes(species);
                return (
                  <label key={species} className="flex items-center space-x-2 p-1.5 bg-surface/50 rounded border border-line cursor-pointer hover:bg-surface">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {
                        setSelectedSpecies(prev =>
                          isChecked ? prev.filter(s => s !== species) : [...prev, species]
                        );
                      }}
                      className="accent-cyan-500 rounded"
                    />
                    <span className="capitalize text-ink-2 font-medium">{species} ({geneData.symbol})</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {activeTool === 'foldseek' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center text-3xs font-mono text-ink-2">
              <span>Structure PDB ID: {geneData.symbol === 'EGFR' ? '1M17' : geneData.symbol === 'TP53' ? '1AIE' : '1UWH'}</span>
              <span>Provider: AlphaFold DB</span>
            </div>
            <div>
              <label className="text-3xs uppercase tracking-wider text-ink-2 font-bold block mb-1">Structural database</label>
              <div className="relative">
                <select
                  value={foldseekDb}
                  onChange={(e) => setFoldseekDb(e.target.value)}
                  className="w-full bg-surface border border-line text-ink rounded-lg px-2.5 py-1 text-2xs outline-none appearance-none"
                >
                  <option value="pdb">PDB100 (High Resolution Structures)</option>
                  <option value="alphafold">AlphaFold DB (Proteomes)</option>
                  <option value="esmatlas">ESM Metagenomic Atlas</option>
                </select>
                <ChevronDown className="w-3 h-3 text-ink-2 absolute right-2.5 top-2 pointer-events-none" />
              </div>
            </div>
          </div>
        )}

        <button
          onClick={runAnalysis}
          disabled={isRunning || (activeTool === 'msa' && selectedSpecies.length < 2)}
          className="w-full py-2 bg-gradient-to-r from-ink to-ink hover:from-ink hover:to-indigo-400 disabled:from-cyan-800 disabled:to-indigo-900 text-paper text-2xs font-extrabold uppercase rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-md shadow-none"
        >
          <Play className="w-3.5 h-3.5 fill-slate-950" />
          {isRunning ? t('analysis.running') || 'Running Analysis...' : t('analysis.run') || 'Run Alignment'}
        </button>
      </div>

      {/* Progress state */}
      {isRunning && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-3xs font-mono text-ink font-bold">
            <span>Executing search algorithm...</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full h-1.5 bg-wash rounded-full overflow-hidden">
            <div className="h-full bg-ink rounded-full transition-all duration-200" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {/* Results View */}
      {completed && !isRunning && (
        <div className="space-y-3 animate-fade-in">
          <div className="flex items-center gap-1.5 text-xs text-benign font-bold font-sans">
            <CheckCircle2 className="w-4 h-4 text-benign" />
            Alignment Complete
          </div>

          {activeTool === 'blast' && (
            <div className="space-y-2">
              <span className="text-3xs uppercase tracking-wider text-ink-2 font-bold block">
                Top Database Sequence Hits
              </span>
              <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                {blastHits.map((hit) => (
                  <div key={hit.id} className="p-2 bg-wash rounded-lg border border-line flex items-center justify-between text-2xs hover:border-line transition-all">
                    <div>
                      <span className="font-bold text-ink block">{hit.id}</span>
                      <span className="text-3xs text-ink-3 block truncate max-w-xs">{hit.desc}</span>
                    </div>
                    <div className="text-right font-mono">
                      <span className="text-ink font-bold block">Id: {hit.identity.toFixed(1)}%</span>
                      <span className="text-3xs text-ink-3 block">E: {hit.evalue} | S: {hit.score}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTool === 'msa' && (
            <div className="space-y-2.5">
              <span className="text-3xs uppercase tracking-wider text-ink-2 font-bold block">
                Multiple Sequence Alignment Grid
              </span>
              <div className="p-2.5 bg-wash rounded-lg border border-line font-mono text-3xs space-y-1.5 overflow-x-auto">
                {msaSequences.map((seq) => (
                  <div key={seq.species} className="flex whitespace-nowrap">
                    <span className="w-16 font-bold text-ink-2 shrink-0">{seq.species}:</span>
                    <span className="text-ink tracking-wider">
                      {seq.seq.split('-').map((char, i) => {
                        let color = 'text-ink-2';
                        if ('AVFIPLM'.includes(char)) color = 'text-plddt-1'; // hydrophobic
                        if ('RK'.includes(char)) color = 'text-path';       // basic
                        if ('DE'.includes(char)) color = 'text-ink-2';    // acidic
                        if ('STNQYHCW'.includes(char)) color = 'text-benign'; // polar/charged
                        return <span key={i} className={color}>{char}</span>;
                      })}
                    </span>
                  </div>
                ))}
                <div className="h-px bg-wash my-1" />
                <div className="flex whitespace-nowrap">
                  <span className="w-16 font-bold text-ink shrink-0">Consensus:</span>
                  <span className="text-ink tracking-wider font-extrabold">{msaConsensus}</span>
                </div>
              </div>
            </div>
          )}

          {activeTool === 'foldseek' && (
            <div className="space-y-2">
              <span className="text-3xs uppercase tracking-wider text-ink-2 font-bold block">
                Top Structural Structural Analogues
              </span>
              <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                {foldseekHits.map((hit) => (
                  <div key={hit.pdbId} className="p-2 bg-wash rounded-lg border border-line flex items-center justify-between text-2xs hover:border-line transition-all">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-ink font-sans">{hit.pdbId}</span>
                        <span className="text-3xs font-mono bg-wash text-ink-2 px-1 rounded">Chain {hit.chain}</span>
                      </div>
                      <span className="text-3xs text-ink-3 block truncate max-w-xs">{hit.title}</span>
                    </div>
                    <div className="text-right font-mono">
                      <span className="text-ink font-bold block">TM-Score: {hit.tmScore.toFixed(3)}</span>
                      <span className="text-3xs text-ink-3 block">RMSD: {hit.rmsd.toFixed(1)} Å | Res: {hit.alnRes}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AnalysisTools;
