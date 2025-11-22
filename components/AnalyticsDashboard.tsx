
import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { CalendarEvent, EventType } from '../types';
import { generateAnalyticsInsight } from '../services/geminiService';
import { SparklesIcon } from './Icons';

interface AnalyticsDashboardProps {
  events: CalendarEvent[];
}

const COLORS = ['#4f46e5', '#fbbf24', '#ef4444', '#10b981', '#f97316', '#64748b', '#94a3b8'];

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ events }) => {
  const [insight, setInsight] = useState<string | null>(null);

  // Prepare Data for Pie Chart (Distribution)
  const typeData = Object.values(EventType).map(type => {
    const count = events.filter(e => e.type === type).length;
    return { name: type, value: count };
  }).filter(d => d.value > 0);

  // Prepare Data for Bar Chart (Hours per category)
  const hoursData = Object.values(EventType).map(type => {
     const durationMs = events
        .filter(e => e.type === type)
        .reduce((acc, curr) => acc + (curr.end.getTime() - curr.start.getTime()), 0);
     return { name: type, hours: Math.round(durationMs / (1000 * 60 * 60) * 10) / 10 };
  }).filter(d => d.hours > 0);


  useEffect(() => {
    const fetchInsight = async () => {
        const text = await generateAnalyticsInsight(events);
        setInsight(text);
    };
    if (events.length > 0) fetchInsight();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  return (
    <div className="h-full w-full flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-y-auto pr-2 pb-32 no-scrollbar">
      
      {/* AI Insight Card - Fixed Height */}
      <div className="flex-none bg-gradient-to-r from-royal-900 to-slate-900 text-white p-4 sm:p-6 rounded-2xl shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
             <SparklesIcon className="w-32 h-32" />
        </div>
        <div className="relative z-10">
            <h3 className="text-lg sm:text-xl font-serif font-bold flex items-center gap-2 mb-2 text-gold-400">
                <SparklesIcon className="w-5 h-5" />
                AI Analysis
            </h3>
            <p className="text-slate-200 leading-relaxed italic text-sm sm:text-lg">
                {insight ? `"${insight}"` : "Analyzing your schedule patterns..."}
            </p>
        </div>
      </div>

      <div className="flex-1 min-h-[300px] grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Distribution Chart */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col">
            <h4 className="text-sm sm:text-lg font-semibold text-slate-800 dark:text-white mb-2">Event Distribution</h4>
            <div className="flex-1 min-h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={typeData}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={70}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {typeData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip 
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-2 justify-center mt-2">
                {typeData.map((entry, index) => (
                    <div key={entry.name} className="flex items-center gap-1 text-[10px] text-slate-500">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                        {entry.name}
                    </div>
                ))}
            </div>
        </div>

        {/* Hours Chart */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col">
            <h4 className="text-sm sm:text-lg font-semibold text-slate-800 dark:text-white mb-2">Hours per Category</h4>
             <div className="flex-1 min-h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={hoursData}>
                        <XAxis dataKey="name" fontSize={10} tick={{fill: '#94a3b8'}} axisLine={false} tickLine={false} interval={0} />
                        <YAxis fontSize={10} tick={{fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                        <Tooltip 
                           cursor={{fill: 'transparent'}}
                           contentStyle={{ borderRadius: '8px', border: 'none', backgroundColor: '#1e293b', color: '#fff' }}
                        />
                        <Bar dataKey="hours" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
