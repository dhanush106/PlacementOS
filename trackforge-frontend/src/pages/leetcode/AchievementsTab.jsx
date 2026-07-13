import React from 'react';
import { Award, Zap, Flame, Shield, CheckCircle, ShieldAlert, Star } from 'lucide-react';

const AchievementsTab = ({ data }) => {
  const { overview = {} } = data || {};
  const totalSolved = overview.totalSolved || 0;
  const streak = overview.streak?.longest || 0;
  const xp = overview.leetcodeXP || 0;

  const badges = [
    {
      title: 'DSA Starter',
      desc: 'Solved 10 questions on TrackForge',
      req: totalSolved >= 10,
      icon: CheckCircle,
      color: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5'
    },
    {
      title: 'Roadmap Voyager',
      desc: 'Solved 50 questions on TrackForge',
      req: totalSolved >= 50,
      icon: Award,
      color: 'text-blue-400 border-blue-500/20 bg-blue-500/5'
    },
    {
      title: 'Master Solver',
      desc: 'Solved 150 questions on TrackForge',
      req: totalSolved >= 150,
      icon: Shield,
      color: 'text-violet-400 border-violet-500/20 bg-violet-500/5'
    },
    {
      title: 'Consistent Coder',
      desc: 'Reached a 7-day longest streak milestone',
      req: streak >= 7,
      icon: Flame,
      color: 'text-orange-400 border-orange-500/20 bg-orange-500/5'
    },
    {
      title: 'High Focus Level',
      desc: 'Earned 500 total focus XP',
      req: xp >= 500,
      icon: Zap,
      color: 'text-amber-400 border-amber-500/20 bg-amber-500/5'
    },
    {
      title: 'Leetcode Prodigy',
      desc: 'Earned 1500 total focus XP',
      req: xp >= 1500,
      icon: Star,
      color: 'text-red-400 border-red-500/20 bg-red-500/5'
    }
  ];

  return (
    <div className="bg-slate-900/30 border border-slate-800 rounded-3xl p-6 space-y-6">
      <div className="border-b border-slate-850 pb-4">
        <h3 className="text-base font-extrabold text-white flex items-center gap-2">
          <Zap size={18} className="text-amber-400" /> Milestone Achievements & Credentials
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Unlock progress markers as you solve problems and hit consistency goals.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {badges.map((b, idx) => {
          const Icon = b.icon;
          return (
            <div
              key={idx}
              className={`flex items-center gap-4 p-4 rounded-2xl border transition ${
                b.req
                  ? `${b.color} shadow-lg shadow-black/10`
                  : 'opacity-40 border-slate-850 bg-slate-950/20 text-slate-500'
              }`}
            >
              <div className="w-12 h-12 rounded-2xl bg-slate-950/60 border border-slate-850 flex items-center justify-center flex-shrink-0">
                <Icon size={22} className={b.req ? '' : 'text-slate-650'} />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-white leading-none">{b.title}</h4>
                <p className="text-xs text-slate-400 mt-1.5">{b.desc}</p>
                <p className="text-[9px] font-bold uppercase mt-1">
                  {b.req ? '🟢 Unlocked' : '🔒 Locked'}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AchievementsTab;
