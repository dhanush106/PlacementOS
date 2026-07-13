import React, { useState } from 'react';
import { Calendar, Clock, RefreshCw } from 'lucide-react';

const HeatmapTab = ({ data }) => {
  const { heatmap = [] } = data || {};
  const [hoveredDay, setHoveredDay] = useState(null);

  const getHeatColor = (count) => {
    if (count === 0) return 'bg-slate-900/40 border-slate-950';
    if (count === 1) return 'bg-amber-950/60 border-amber-950';
    if (count === 2) return 'bg-amber-700/80 border-amber-700';
    if (count === 3) return 'bg-primary border-primary';
    return 'bg-violet-400 border-violet-400';
  };

  // Split heatmap into weeks of 7 days
  const weeks = [];
  const totalDays = heatmap.length;
  // Pad beginning if total days is not a multiple of 7
  const startDay = new Date(heatmap[0]?.date || new Date()).getDay();
  const padding = Array(startDay).fill(null);
  const combined = [...padding, ...heatmap];

  for (let i = 0; i < combined.length; i += 7) {
    weeks.push(combined.slice(i, i + 7));
  }

  const daysLabel = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-slate-900/30 border border-slate-800 rounded-3xl p-6 space-y-6 relative">
      <div className="border-b border-slate-850 pb-4">
        <h3 className="text-base font-extrabold text-white flex items-center gap-2">
          <Calendar size={18} className="text-primary" /> Solved Heatmap Calendar
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          GitHub-style contribution chart tracking problem solving consistency and revision loops.
        </p>
      </div>

      <div className="flex flex-col gap-4 overflow-x-auto pb-4">
        {/* Calendar Grid */}
        <div className="flex gap-1.5 min-w-max">
          {/* Day of week labels */}
          <div className="flex flex-col justify-between text-[9px] text-slate-600 font-bold uppercase pr-2 select-none h-[115px] pt-1">
            <span>Sun</span>
            <span>Tue</span>
            <span>Thu</span>
            <span>Sat</span>
          </div>

          <div className="flex gap-1">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-1">
                {week.map((day, di) => {
                  if (!day) return <div key={di} className="w-3.5 h-3.5 bg-transparent border border-transparent rounded-sm" />;
                  return (
                    <div
                      key={di}
                      onMouseEnter={() => setHoveredDay(day)}
                      onMouseLeave={() => setHoveredDay(null)}
                      className={`w-3.5 h-3.5 rounded-sm border hover:scale-125 transition duration-150 cursor-pointer ${getHeatColor(day.count)}`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-2 select-none">
          <span>Less Solved</span>
          <div className="w-3 h-3 rounded-sm bg-slate-900/40 border border-slate-950" />
          <div className="w-3 h-3 rounded-sm bg-amber-950/60 border border-amber-950" />
          <div className="w-3 h-3 rounded-sm bg-amber-700/80 border border-amber-700" />
          <div className="w-3 h-3 rounded-sm bg-primary border border-primary" />
          <div className="w-3 h-3 rounded-sm bg-violet-400 border border-violet-400" />
          <span>More</span>
        </div>
      </div>

      {/* Hover Info Card */}
      <div className="bg-slate-950/40 border border-slate-850 rounded-2xl p-4 flex items-center justify-between min-h-[70px]">
        {hoveredDay ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-4">
            <div>
              <p className="text-xs font-black text-white">{new Date(hoveredDay.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">Contribution Log</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="text-slate-400 font-semibold">Solved: <strong className="text-emerald-400">{hoveredDay.count} probs</strong></span>
              <span className="text-slate-400 font-semibold">Study Time: <strong className="text-blue-400">{hoveredDay.studyTime}m</strong></span>
              <span className="text-slate-400 font-semibold">Revised: <strong className="text-violet-400">{hoveredDay.revisions}</strong></span>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-500 italic">Hover over any day grid cell to display detailed contribution variables.</p>
        )}
      </div>
    </div>
  );
};

export default HeatmapTab;
