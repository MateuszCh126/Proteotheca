import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { OpenFdaData, AdverseEventTerm, DemographicData } from '../../types/disease';
import { useI18n } from '../../context/I18nContext';

interface OpenfdaAdverseEventsProps {
  data: OpenFdaData;
}

export const FdaEventsChart: React.FC<{ events: AdverseEventTerm[] }> = ({ events }) => {
  const { t } = useI18n();
  const chartData = events.slice(0, 8); // Display top 8 event reactions

  const getGradientColor = (index: number) => {
    // Red-orange gradient stepping down
    const startHue = 15; // Orange-red
    const lightness = 40 + (index * 4); 
    return `hsl(${startHue}, 80%, ${lightness}%)`;
  };

  return (
    <div className="w-full h-56" data-testid="fda-events-chart">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 15, left: 25, bottom: 5 }}
        >
          <XAxis 
            type="number"
            stroke="rgba(255,255,255,0.15)"
            tick={{ fill: 'hsl(240, 5%, 70%)', fontSize: 9 }}
          />
          <YAxis 
            dataKey="term" 
            type="category" 
            stroke="rgba(255,255,255,0.15)"
            tick={{ fill: 'hsl(240, 5%, 85%)', fontSize: 9 }}
            width={95}
          />
          <Tooltip
            cursor={{ fill: 'rgba(255,255,255,0.03)' }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload as AdverseEventTerm;
                return (
                  <div className="glass-panel p-2 rounded-lg border border-white/10 bg-slate-950/90 backdrop-blur-md text-3xs">
                    <p className="font-bold text-white uppercase font-outfit">{item.term}</p>
                    <p className="text-orange-400 mt-1">
                      {t('common.reports')}: <span className="font-mono">{item.count.toLocaleString()}</span>
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={12}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getGradientColor(index)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

interface DemographicsChartProps {
  data: DemographicData[];
  title: string;
  palette: string[];
  testId: string;
}

export const DemographicsDonutChart: React.FC<DemographicsChartProps> = ({ data, title, palette, testId }) => {
  const { t } = useI18n();

  return (
    <div className="flex flex-col items-center w-full h-48" data-testid={testId}>
      <h4 className="text-3xs font-semibold text-slate-400 uppercase tracking-wider mb-1 font-outfit">{title}</h4>
      <ResponsiveContainer width="100%" height="90%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="40%"
            innerRadius="50%"
            outerRadius="70%"
            paddingAngle={3}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={palette[index % palette.length]} />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0];
                return (
                  <div className="glass-panel p-2 rounded-lg border border-white/10 bg-slate-950/90 backdrop-blur-md text-3xs">
                    <span className="font-semibold text-white font-outfit">{item.name}</span>
                    <span className="text-slate-300 font-mono block mt-0.5">
                      {t('common.reports')}: {Number(item.value).toLocaleString()}
                    </span>
                  </div>
                );
              }
              return null;
            }}
          />
          <Legend 
            verticalAlign="bottom" 
            height={28} 
            iconType="circle" 
            iconSize={6}
            wrapperStyle={{ fontSize: 9, fontFamily: 'var(--font-sans)', color: 'hsl(240, 5%, 80%)' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export const OpenfdaAdverseEvents: React.FC<OpenfdaAdverseEventsProps> = ({ data }) => {
  const { t } = useI18n();
  const sexPalette = ['hsl(200, 85%, 55%)', 'hsl(280, 70%, 55%)', 'hsl(240, 5%, 50%)'];
  const agePalette = ['hsl(142, 70%, 45%)', 'hsl(180, 80%, 45%)', 'hsl(225, 75%, 55%)', 'hsl(15, 85%, 55%)'];

  return (
    <div className="space-y-4">
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-3xs uppercase tracking-wider text-slate-400 font-bold block">
            {t('therapeutic.fdaSymptomFrequency', { substance: data.active_substance })}
          </span>
          <span className="text-3xs text-slate-500 font-mono">
            {t('common.totalReports', { count: data.total_reports.toLocaleString() })}
          </span>
        </div>
        <FdaEventsChart events={data.events} />
      </div>

      <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-3">
        <DemographicsDonutChart 
          data={data.sex_breakdown} 
          title={t('therapeutic.sexBreakdown')} 
          palette={sexPalette} 
          testId="fda-demographics-sex" 
        />
        <DemographicsDonutChart 
          data={data.age_breakdown} 
          title={t('therapeutic.ageBreakdown')} 
          palette={agePalette} 
          testId="fda-demographics-age" 
        />
      </div>
    </div>
  );
};
export default OpenfdaAdverseEvents;
