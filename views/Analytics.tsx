
import React, { useState, useMemo } from 'react';
import { DispatchEntry } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line 
} from 'recharts';
import { Sparkles, Loader2 } from 'lucide-react';
import { generateDispatchInsights } from '../services/geminiService';

// Custom color palette
const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#3b82f6'];

interface AnalyticsProps {
  data: DispatchEntry[];
}

export const AnalyticsView: React.FC<AnalyticsProps> = ({ data }) => {
  const [aiLoading, setAiLoading] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);

  // 1. Top Selling Party (by Weight)
  const partyData = useMemo(() => {
    const map = new Map<string, number>();
    data.forEach(d => {
      map.set(d.partyName, (map.get(d.partyName) || 0) + d.weight);
    });
    return Array.from(map.entries())
      .map(([name, weight]) => ({ name, weight }))
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 5); // Top 5
  }, [data]);

  // 2. Top Size by Weight
  const sizeData = useMemo(() => {
    const map = new Map<string, number>();
    data.forEach(d => {
      map.set(d.size, (map.get(d.size) || 0) + d.weight);
    });
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [data]);

  // 3. Date-wise Analysis (Weight trend)
  const dateData = useMemo(() => {
    const map = new Map<string, number>();
    data.forEach(d => {
        // Assuming d.date is YYYY-MM-DD
        map.set(d.date, (map.get(d.date) || 0) + d.weight);
    });
    return Array.from(map.entries())
        .map(([date, weight]) => ({ date, weight }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(-7); // Last 7 days with data
  }, [data]);

  const handleGenerateInsights = async () => {
    setAiLoading(true);
    const insight = await generateDispatchInsights(data);
    setAiInsight(insight);
    setAiLoading(false);
  };

  if (data.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center h-96 text-slate-400">
            <BarChart className="w-16 h-16 mb-4 opacity-20" />
            <p>No data available for analysis yet.</p>
        </div>
    )
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="flex justify-between items-end">
        <div>
            <h1 className="text-2xl font-bold text-slate-900">Performance Analytics</h1>
            <p className="text-slate-500 text-sm">Deep dive into sales and distribution trends</p>
        </div>
        <button
            onClick={handleGenerateInsights}
            disabled={aiLoading}
            className="flex items-center bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-70"
        >
            {aiLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
            {aiLoading ? 'Analyzing...' : 'Ask Gemini AI'}
        </button>
      </div>

      {/* AI Insight Section */}
      {aiInsight && (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl p-6 shadow-sm">
            <div className="flex items-center mb-4">
                <Sparkles className="w-5 h-5 text-indigo-600 mr-2" />
                <h3 className="text-lg font-semibold text-indigo-900">AI Executive Summary</h3>
            </div>
            <div className="prose prose-indigo prose-sm max-w-none text-slate-700 whitespace-pre-wrap leading-relaxed">
                {aiInsight.replace(/[*#]/g, '') /* Simple cleanup for markdown chars since we aren't using a parser */}
            </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Chart 1: Top Parties */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-800 mb-6">Top 5 Parties (by Weight)</h3>
            <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={partyData} layout="vertical" margin={{ left: 40 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12}} />
                        <Tooltip 
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                            formatter={(value: number) => [`${value.toFixed(2)} kg`, 'Weight']}
                        />
                        <Bar dataKey="weight" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={32} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Chart 2: Size Distribution */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-800 mb-6">Size Distribution (by Weight)</h3>
            <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={sizeData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {sizeData.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => [`${value.toFixed(2)} kg`, 'Weight']} />
                        <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Chart 3: Date-wise Analysis */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 lg:col-span-2">
            <h3 className="text-lg font-semibold text-slate-800 mb-6">Daily Dispatch Trend (Last 7 Active Days)</h3>
            <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dateData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="date" tick={{fontSize: 12}} tickMargin={10} />
                        <YAxis tick={{fontSize: 12}} />
                        <Tooltip 
                             contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                             formatter={(value: number) => [`${value.toFixed(2)} kg`, 'Weight']}
                        />
                        <Line type="monotone" dataKey="weight" stroke="#10b981" strokeWidth={3} activeDot={{ r: 8 }} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>
    </div>
  );
};
