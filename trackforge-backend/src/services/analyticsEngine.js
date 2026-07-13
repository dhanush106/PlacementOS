import LeetcodeProblem from '../models/LeetcodeProblem.js';
import User from '../models/User.js';
import fs from 'fs';
import path from 'path';

// Topics target settings as defined in prompt guidelines
const TOPIC_TARGETS = {
  'Arrays': 50, 'Strings': 40, 'Hashing': 30, 'Linked List': 35, 'Stack': 30,
  'Queue': 25, 'Binary Search': 40, 'Sliding Window': 35, 'Prefix Sum': 20,
  'Two Pointers': 30, 'Recursion': 30, 'Backtracking': 35, 'Trees': 60,
  'BST': 40, 'Heap': 35, 'Graph': 60, 'BFS / DFS': 50, 'Union Find': 20,
  'Topological Sort': 20, 'Shortest Path': 25, 'Trie': 20, 'Greedy': 40,
  'Dynamic Programming': 80, 'Bit Manipulation': 25, 'Segment Tree': 25,
  'Fenwick Tree': 15, 'Monotonic Stack': 25, 'Monotonic Queue': 15,
  'Math': 25, 'Geometry': 15
};

// Patterns list
const PATTERNS = [
  'Sliding Window', 'Two Pointers', 'Binary Search', 'Prefix Sum', 'Greedy',
  'Dynamic Programming', 'Graph', 'DFS', 'BFS', 'Heap', 'Trie', 'Backtracking',
  'Bit Manipulation', 'Union Find'
];

// Companies list
const COMPANIES = [
  'Google', 'Microsoft', 'Amazon', 'Atlassian', 'Uber', 'Adobe', 'Oracle',
  'Apple', 'Nvidia', 'Salesforce', 'Walmart', 'JP Morgan', 'Goldman Sachs'
];

export const getFullAnalytics = async (userId) => {
  const problems = await LeetcodeProblem.find({ userId });
  const user = await User.findById(userId);
  const syncedStats = user?.leetcodeStats || {};

  // 1. Core overall stats
  const trackedSolved = problems.filter(p => p.status === 'Solved' || p.status === 'Revised').length;
  const totalAttempted = problems.filter(p => p.status === 'Attempted').length;
  const totalRevision = problems.filter(p => p.status === 'Revised' || p.revisionRequired).length;

  const trackedEasySolved = problems.filter(p => p.difficulty === 'Easy' && (p.status === 'Solved' || p.status === 'Revised')).length;
  const trackedMediumSolved = problems.filter(p => p.difficulty === 'Medium' && (p.status === 'Solved' || p.status === 'Revised')).length;
  const trackedHardSolved = problems.filter(p => p.difficulty === 'Hard' && (p.status === 'Solved' || p.status === 'Revised')).length;

  const totalSolved = syncedStats.totalSolved || trackedSolved;
  const easySolved = syncedStats.easySolved || trackedEasySolved;
  const mediumSolved = syncedStats.mediumSolved || trackedMediumSolved;
  const hardSolved = syncedStats.hardSolved || trackedHardSolved;

  const totalAttempts = problems.reduce((sum, p) => sum + (p.attempts || 0), 0);
  const totalTime = problems.reduce((sum, p) => sum + (p.actualTime || 0), 0);
  
  const avgTime = trackedSolved > 0 ? Math.round(totalTime / trackedSolved) : 0;
  const avgAttempts = (trackedSolved + totalAttempted) > 0 ? +(totalAttempts / (trackedSolved + totalAttempted)).toFixed(1) : 0;
  const acceptanceRate = syncedStats.acceptanceRate || ((trackedSolved + totalAttempted) > 0 ? Math.round((trackedSolved / (trackedSolved + totalAttempted)) * 100) : 0);

  // 2. Topic Mastery Tracker
  const topicStats = {};
  // Initialize with target rules
  Object.keys(TOPIC_TARGETS).forEach(t => {
    topicStats[t] = {
      target: TOPIC_TARGETS[t],
      solved: 0,
      easy: 0,
      medium: 0,
      hard: 0,
      totalTime: 0,
      attempts: 0,
      revisions: 0,
      lastSolved: null
    };
  });

  problems.forEach(p => {
    const t = p.topic || 'Other';
    if (!topicStats[t]) {
      topicStats[t] = { target: 15, solved: 0, easy: 0, medium: 0, hard: 0, totalTime: 0, attempts: 0, revisions: 0, lastSolved: null };
    }
    topicStats[t].attempts += (p.attempts || 0);
    topicStats[t].totalTime += (p.actualTime || 0);
    if (p.revisionRequired) topicStats[t].revisions++;

    if (p.status === 'Solved' || p.status === 'Revised') {
      topicStats[t].solved++;
      if (p.difficulty === 'Easy') topicStats[t].easy++;
      if (p.difficulty === 'Medium') topicStats[t].medium++;
      if (p.difficulty === 'Hard') topicStats[t].hard++;
      
      if (p.submissionDate) {
        if (!topicStats[t].lastSolved || new Date(p.submissionDate) > new Date(topicStats[t].lastSolved)) {
          topicStats[t].lastSolved = p.submissionDate;
        }
      }
    }
  });

  const topicList = Object.entries(topicStats).map(([name, stats]) => {
    const solved = stats.solved;
    const target = stats.target;
    const remaining = Math.max(0, target - solved);
    const pct = Math.min(100, Math.round((solved / target) * 100));
    
    // Confidence Score Calculation (solved ratio + difficulty weighted)
    const baseConf = pct / 20; // 0 to 5
    const difficultyWeight = solved > 0 ? ((stats.medium * 1.2 + stats.hard * 1.5) / solved) : 0;
    const confidenceScore = Math.min(5, +(baseConf + difficultyWeight).toFixed(1));

    return {
      topic: name,
      targetProblems: target,
      solvedProblems: solved,
      remainingProblems: remaining,
      completionPercentage: pct,
      easySolved: stats.easy,
      mediumSolved: stats.medium,
      hardSolved: stats.hard,
      avgSolvingTime: solved > 0 ? Math.round(stats.totalTime / solved) : 0,
      acceptanceRate: (solved + stats.attempts) > 0 ? Math.round((solved / (solved + stats.attempts)) * 100) : 0,
      lastSolvedDate: stats.lastSolved,
      confidenceScore,
      revisionCount: stats.revisions,
      xpEarned: solved * 10,
      weaknessIndicator: pct < 40 && target > 0
    };
  });

  // 3. Spaced Repetition Stats
  const revisionStats = {
    dueToday: problems.filter(p => p.revisionRequired && p.nextRevisionDate && new Date(p.nextRevisionDate) <= new Date()).length,
    upcoming: problems.filter(p => p.revisionRequired && p.nextRevisionDate && new Date(p.nextRevisionDate) > new Date()).length,
    completed: problems.filter(p => p.status === 'Revised').length
  };

  // 4. Heatmap Data (Last 365 Days)
  const heatmap = [];
  const startOffset = 364;
  for (let i = startOffset; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    
    const dayProblems = problems.filter(p => p.submissionDate && p.submissionDate.toISOString().split('T')[0] === dateStr);
    const solvedCount = dayProblems.filter(p => p.status === 'Solved' || p.status === 'Revised').length;
    const studyTime = dayProblems.reduce((sum, p) => sum + (p.actualTime || 0), 0);
    const revisions = dayProblems.filter(p => p.revisionRequired).length;

    heatmap.push({
      date: dateStr,
      count: solvedCount,
      studyTime,
      revisions,
      difficultyDistribution: {
        Easy: dayProblems.filter(p => p.difficulty === 'Easy').length,
        Medium: dayProblems.filter(p => p.difficulty === 'Medium').length,
        Hard: dayProblems.filter(p => p.difficulty === 'Hard').length
      }
    });
  }

  // 5. Company Prep Sheets
  const companyStats = COMPANIES.map(company => {
    // We parse problem list to look up company tag match
    // Filter problems tagged with this company
    const compProblems = problems.filter(p => p.companyTags && p.companyTags.includes(company));
    const solved = compProblems.filter(p => p.status === 'Solved' || p.status === 'Revised').length;
    const total = compProblems.length || 1; // avoid division by 0
    const pct = Math.round((solved / total) * 100);

    return {
      company,
      totalTaggedProblems: compProblems.length,
      solved,
      remaining: Math.max(0, compProblems.length - solved),
      progressPercentage: pct,
      difficultyDistribution: {
        Easy: compProblems.filter(p => p.difficulty === 'Easy').length,
        Medium: compProblems.filter(p => p.difficulty === 'Medium').length,
        Hard: compProblems.filter(p => p.difficulty === 'Hard').length
      },
      readinessScore: Math.min(100, Math.round(pct * 1.2))
    };
  });

  // 6. Pattern Analytics
  const patternStats = PATTERNS.map(pattern => {
    const patProblems = problems.filter(p => p.pattern && p.pattern.toLowerCase().includes(pattern.toLowerCase()));
    const solved = patProblems.filter(p => p.status === 'Solved' || p.status === 'Revised').length;
    const target = 20; // Generic target per pattern
    const pct = Math.min(100, Math.round((solved / target) * 100));

    return {
      pattern,
      solved,
      target,
      masteryPercentage: pct
    };
  });

  // 7. Productivity insights
  const dayOfWeekCount = [0, 0, 0, 0, 0, 0, 0];
  problems.forEach(p => {
    if (p.submissionDate) {
      const day = new Date(p.submissionDate).getDay();
      dayOfWeekCount[day]++;
    }
  });
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  let maxDayIdx = 0;
  dayOfWeekCount.forEach((c, idx) => {
    if (c > dayOfWeekCount[maxDayIdx]) maxDayIdx = idx;
  });

  const productivity = {
    mostProductiveDay: days[maxDayIdx],
    avgDailyProblems: +(trackedSolved / 30).toFixed(1) || 0.1,
    consistencyPercentage: Math.min(100, Math.round((heatmap.filter(h => h.count > 0).length / 30) * 100))
  };

  // 8. Composite Placement Readiness Score
  // Weighted: 40% Topic completion, 20% Difficulty balance (medium/hard weight), 20% revision rate, 10% target company coverage, 10% streak consistency
  const topicWeight = (topicList.reduce((sum, t) => sum + t.completionPercentage, 0) / topicList.length) * 0.4;
  const diffBalance = Math.min(100, ((mediumSolved * 2 + hardSolved * 4) / (easySolved + 1)) * 10) * 0.2;
  const revWeight = Math.min(100, (revisionStats.completed / (trackedSolved + 1)) * 100) * 0.2;
  const companyWeight = (companyStats.reduce((sum, c) => sum + c.progressPercentage, 0) / companyStats.length) * 0.1;
  const streakWeight = Math.min(100, (user?.leetcodeStreak?.current || 0) * 5) * 0.1;

  const placementReadinessScore = Math.min(100, Math.round(topicWeight + diffBalance + revWeight + companyWeight + streakWeight)) || 10;

  return {
    overview: {
      totalSolved,
      trackedSolved,
      totalAttempted,
      totalRevision,
      acceptanceRate,
      avgTimePerProblem: avgTime,
      avgAttempts,
      easySolved,
      mediumSolved,
      hardSolved,
      syncedTotalSubmissions: syncedStats.totalSubmissions || 0,
      leetcodeRanking: syncedStats.ranking || 0,
      leetcodeLastSynced: syncedStats.lastSynced || null,
      leetcodeSyncStartDate: user?.leetcodeSyncStartDate || null,
      streak: user?.leetcodeStreak || { current: 0, longest: 0 },
      leetcodeXP: user?.leetcodeXP || 0,
      dailyGoal: user?.leetcodeDailyGoal || 7
    },
    topicTracker: topicList,
    revisionStats,
    heatmap,
    companySheets: companyStats,
    patternAnalytics: patternStats,
    productivity,
    placementReadinessScore
  };
};
