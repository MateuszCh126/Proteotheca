import React from 'react';
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { GnomadData, GnomadPopulation } from '../../types/variant';
import { useI18n } from '../../context/I18nContext';

interface AlleleFreqChartProps {
  data: GnomadData;
}

export const GlobalFreqGauge: React.FC<{ frequency: number }> = ({ frequency }) => {
  const { t } = useI18n();
  // Map frequency to scale 0 - 100 logarithmically from 1e-6 to 1
  const logVal = Math.max(0, ((Math.log10(frequency || 1e-6) + 6) / 6) * 100);
  
  let color = 'hsl(180, 80%, 45%)'; // Ultra-rare (Cyan)
  if (frequency >= 0.01) {
    color = 'hsl(15, 85%, 55%)';  // Common (Amber/Red)
  } else if (frequency >= 0.0001) {
    color = 'hsl(142, 70%, 45%)';  // Rare (Green)
  }

  const chartData = [{ name: 'Global AF', value: logVal, fill: color }];

  return (
    <div className="flex flex-col items-center justify-center relative w-full h-36" data-testid="global-af-gauge">
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart 
          cx="50%" 
          cy="50%" 
          innerRadius="75%" 
          outerRadius="100%" 
          barSize={10} 
          data={chartData} 
          startAngle={180} 
          endAngle={0}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
          <RadialBar background dataKey="value" cornerRadius={5} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/4 text-center">
        <span className="text-3xs text-slate-400 font-bold uppercase tracking-wider block">{t('variant.globalAf')}</span>
        <span className="text-base font-extrabold tracking-tight text-white block font-outfit" data-testid="global-af-value">
          {frequency.toExponential(3)}
        </span>
        <span className="text-3xs text-slate-500 font-mono block mt-0.5">
          ({(frequency * 100).toFixed(4)}%)
        </span>
      </div>
    </div>
  );
};

export const PopulationBarChart: React.FC<{ populations: GnomadPopulation[] }> = ({ populations }) => {
  const { t } = useI18n();
  const sortedData = [...populations].sort((a, b) => b.freq - a.freq);

  const formatTick = (tick: number) => {
    if (tick === 0) return '0';
    return tick.toExponential(1);
  };

  const getBarColor = (freq: number) => {
    if (freq >= 0.01) return 'hsl(15, 85%, 55%)';      // Common (Amber/Red)
    if (freq >= 0.0001) return 'hsl(142, 70%, 45%)';    // Rare (Green)
    return 'hsl(180, 80%, 45%)';                       // Ultra-rare (Cyan)
  };

  return (
    <div className="w-full h-48" data-testid="gnomad-pop-chart">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={sortedData}
          layout="vertical"
          margin={{ top: 5, right: 15, left: 20, bottom: 5 }}
        >
          <XAxis 
            type="number" 
            tickFormatter={formatTick} 
            stroke="rgba(255,255,255,0.15)"
            tick={{ fill: 'hsl(240, 5%, 70%)', fontSize: 9, fontFamily: 'monospace' }}
            domain={[0, 'dataMax']}
          />
          <YAxis 
            dataKey="pop" 
            type="category" 
            stroke="rgba(255,255,255,0.15)"
            tick={{ fill: 'hsl(240, 5%, 85%)', fontSize: 9, fontFamily: 'var(--font-sans)' }}
            width={85}
          />
          <Tooltip
            cursor={{ fill: 'rgba(255,255,255,0.03)' }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload as GnomadPopulation;
                return (
                  <div className="glass-panel p-2.5 rounded-lg border border-white/10 shadow-xl bg-slate-950/90 backdrop-blur-md text-3xs">
                    <p className="font-bold text-white mb-1 font-outfit">{item.pop}</p>
                    <p className="text-slate-300">
                      {t('variant.freq')} <span className="font-mono text-cyan-400">{item.freq.toExponential(4)}</span>
                    </p>
                    <p className="text-slate-400 text-2xs mt-0.5">
                      {t('variant.percentage')} {(item.freq * 100).toFixed(5)}%
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar dataKey="freq" radius={[0, 4, 4, 0]} maxBarSize={12}>
            {sortedData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.freq)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const AlleleFreqChart: React.FC<AlleleFreqChartProps> = ({ data }) => {
  const { t } = useI18n();

  return (
    <div className="space-y-4">
      <div>
        <span className="text-3xs uppercase tracking-wider text-slate-400 font-bold block mb-2">
          {t('variant.alleleFrequencyDial')}
        </span>
        <GlobalFreqGauge frequency={data.allele_frequency} />
      </div>
      <div>
        <span className="text-3xs uppercase tracking-wider text-slate-400 font-bold block mb-2">
          {t('variant.ancestryBreakdown')}
        </span>
        <PopulationBarChart populations={data.populations} />
      </div>
    </div>
  );
};
export default AlleleFreqChart;
