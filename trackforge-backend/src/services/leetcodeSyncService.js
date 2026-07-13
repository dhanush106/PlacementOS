import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import LeetcodeProblem from '../models/LeetcodeProblem.js';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import { scheduleRevision } from './revisionEngine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STRIVER_SHEET_PATH = path.join(__dirname, '..', 'config', 'striverA2ZSheet.json');
const LEETCODE_GRAPHQL_URL = 'https://leetcode.com/graphql';

const PROFILE_QUERY = `
  query userProfile($username: String!) {
    matchedUser(username: $username) {
      username
      profile {
        ranking
      }
      submitStats {
        acSubmissionNum {
          difficulty
          count
          submissions
        }
        totalSubmissionNum {
          difficulty
          count
          submissions
        }
      }
    }
  }
`;

const RECENT_AC_SUBMISSIONS_QUERY = `
  query recentAcSubmissions($username: String!, $limit: Int!) {
    recentAcSubmissionList(username: $username, limit: $limit) {
      id
      title
      titleSlug
      timestamp
    }
  }
`;

const QUESTION_QUERY = `
  query questionData($titleSlug: String!) {
    question(titleSlug: $titleSlug) {
      questionFrontendId
      title
      titleSlug
      difficulty
      topicTags {
        name
        slug
      }
    }
  }
`;

const getStartOfToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const titleToSlug = (title) =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const normalizeDifficulty = (difficulty) => {
  if (['Easy', 'Medium', 'Hard'].includes(difficulty)) return difficulty;
  return 'Medium';
};

const getCount = (rows, difficulty) =>
  rows?.find((row) => row.difficulty === difficulty)?.count || 0;

const getSubmissions = (rows, difficulty) =>
  rows?.find((row) => row.difficulty === difficulty)?.submissions || 0;

const leetcodeGraphQL = async (query, variables) => {
  const response = await fetch(LEETCODE_GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Referer: 'https://leetcode.com',
      Origin: 'https://leetcode.com'
    },
    body: JSON.stringify({ query, variables })
  });

  if (!response.ok) {
    throw new Error(`LeetCode GraphQL returned ${response.status}`);
  }

  const payload = await response.json();
  if (payload.errors?.length) {
    throw new Error(payload.errors.map((err) => err.message).join(', '));
  }

  return payload.data;
};

const fetchProfileStats = async (username) => {
  try {
    const data = await leetcodeGraphQL(PROFILE_QUERY, { username });
    const matchedUser = data?.matchedUser;
    if (!matchedUser) {
      throw new Error(`LeetCode user "${username}" was not found.`);
    }

    const accepted = matchedUser.submitStats?.acSubmissionNum || [];
    const allSubmissions = matchedUser.submitStats?.totalSubmissionNum || [];
    const totalSolved = getCount(accepted, 'All');
    const totalSubmissions = getSubmissions(allSubmissions, 'All');

    return {
      totalSolved,
      easySolved: getCount(accepted, 'Easy'),
      mediumSolved: getCount(accepted, 'Medium'),
      hardSolved: getCount(accepted, 'Hard'),
      ranking: matchedUser.profile?.ranking || 0,
      acceptanceRate: totalSubmissions > 0 ? Math.round((totalSolved / totalSubmissions) * 100) : 0,
      totalSubmissions
    };
  } catch (error) {
    return fetchProfileStatsFromFallbacks(username, error);
  }
};

const fetchProfileStatsFromFallbacks = async (username, originalError) => {
  const urls = [
    `https://leetcode-stats-api.herokuapp.com/${username}`,
    `https://alfa-leetcode-api.onrender.com/userProfile/${username}`
  ];

  for (const url of urls) {
    try {
      const response = await fetch(url);
      if (!response.ok) continue;

      const data = await response.json();
      if (data.status === 'error' || data.totalSolved === undefined) continue;

      let totalSubmissions = 0;
      if (Array.isArray(data.totalSubmissions)) {
        const allSubmissions = data.totalSubmissions.find((row) => row.difficulty === 'All');
        totalSubmissions = allSubmissions ? (allSubmissions.submissions || allSubmissions.count || 0) : 0;
      } else {
        totalSubmissions = typeof data.totalSubmissions === 'number' ? data.totalSubmissions : 0;
      }

      return {
        totalSolved: data.totalSolved || 0,
        easySolved: data.easySolved || 0,
        mediumSolved: data.mediumSolved || 0,
        hardSolved: data.hardSolved || 0,
        ranking: data.ranking || 0,
        acceptanceRate: data.acceptanceRate || 0,
        totalSubmissions
      };
    } catch (error) {
      console.warn(`LeetCode profile fallback failed for ${url}:`, error.message);
    }
  }

  throw new Error(originalError?.message || 'Could not connect to LeetCode to fetch profile statistics.');
};

const fetchRecentAcceptedSubmissions = async (username, syncStartDate) => {
  try {
    const data = await leetcodeGraphQL(RECENT_AC_SUBMISSIONS_QUERY, { username, limit: 100 });
    return (data?.recentAcSubmissionList || [])
      .map((submission) => ({
        id: String(submission.id || ''),
        title: submission.title,
        titleSlug: submission.titleSlug || titleToSlug(submission.title || ''),
        submittedAt: new Date(Number(submission.timestamp) * 1000)
      }))
      .filter((submission) => submission.title && submission.submittedAt >= syncStartDate);
  } catch (error) {
    console.warn('Could not fetch recent LeetCode accepted submissions:', error.message);
    return fetchRecentAcceptedSubmissionsFromFallback(username, syncStartDate);
  }
};

const fetchRecentAcceptedSubmissionsFromFallback = async (username, syncStartDate) => {
  const urls = [
    `https://alfa-leetcode-api.onrender.com/${username}/acSubmission`,
    `https://alfa-leetcode-api.onrender.com/${username}/submission`
  ];

  for (const url of urls) {
    try {
      const response = await fetch(url);
      if (!response.ok) continue;

      const data = await response.json();
      const rows = Array.isArray(data.submission) ? data.submission : [];
      const submissions = rows
        .filter((submission) => !submission.statusDisplay || submission.statusDisplay === 'Accepted' || submission.status === 'Accepted')
        .map((submission) => {
          const timestamp = submission.timestamp || submission.time || submission.createdAt;
          const submittedAt = timestamp ? new Date(Number(timestamp) * 1000) : null;
          return {
            id: String(submission.id || submission.submissionId || ''),
            title: submission.title,
            titleSlug: submission.titleSlug || titleToSlug(submission.title || ''),
            submittedAt
          };
        })
        .filter((submission) => submission.title && submission.submittedAt && submission.submittedAt >= syncStartDate);

      if (submissions.length > 0) return submissions;
    } catch (error) {
      console.warn(`LeetCode submission fallback failed for ${url}:`, error.message);
    }
  }

  return [];
};

const fetchQuestionMetadata = async (titleSlug) => {
  if (!titleSlug) return null;

  try {
    const data = await leetcodeGraphQL(QUESTION_QUERY, { titleSlug });
    return data?.question || null;
  } catch (error) {
    console.warn(`Could not fetch LeetCode question metadata for ${titleSlug}:`, error.message);
    return null;
  }
};

const loadSeedProblems = () => {
  try {
    return JSON.parse(fs.readFileSync(STRIVER_SHEET_PATH, 'utf8'));
  } catch (error) {
    console.warn('Could not load Striver seed problems:', error.message);
    return [];
  }
};

const findSeedMatch = (seedProblems, submission, metadata) => {
  const problemNumber = Number(metadata?.questionFrontendId);
  return seedProblems.find((problem) => {
    if (problemNumber && problem.problemNumber === problemNumber) return true;
    return problem.title?.toLowerCase() === submission.title.toLowerCase();
  });
};

const buildSyncedProblemPayload = (userId, submission, seedMatch, metadata) => {
  const topicTags = metadata?.topicTags?.map((tag) => tag.name) || [];
  const primaryTopic = seedMatch?.topic || topicTags[0] || 'Other';
  const title = metadata?.title || seedMatch?.title || submission.title;
  const titleSlug = metadata?.titleSlug || submission.titleSlug || titleToSlug(title);

  return {
    userId,
    title,
    problemNumber: seedMatch?.problemNumber || Number(metadata?.questionFrontendId) || undefined,
    difficulty: normalizeDifficulty(seedMatch?.difficulty || metadata?.difficulty),
    topic: primaryTopic,
    subtopic: seedMatch?.subtopic || '',
    pattern: seedMatch?.pattern || '',
    companyTags: seedMatch?.companyTags || [],
    tags: topicTags,
    striverSheetId: seedMatch?.id || '',
    striverStep: seedMatch?.step || 0,
    striverSection: seedMatch?.section || '',
    link: seedMatch?.link || `https://leetcode.com/problems/${titleSlug}/`,
    leetcodeTitleSlug: titleSlug,
    leetcodeSubmissionId: submission.id,
    source: 'leetcode-sync',
    status: 'Solved',
    submissionDate: submission.submittedAt,
    firstSolvedDate: submission.submittedAt,
    attempts: 1
  };
};

/**
 * Sync all-time profile stats and import accepted submissions from the user's
 * saved sync start date. On first sync, the start date is set to today.
 */
export const syncProfile = async (userId, username, reqIp) => {
  const [stats, user] = await Promise.all([
    fetchProfileStats(username),
    User.findById(userId)
  ]);

  if (!user) throw new Error('User not found');

  const syncStartDate = user.leetcodeSyncStartDate || getStartOfToday();
  const submissions = await fetchRecentAcceptedSubmissions(username, syncStartDate);
  const newProblemsDetected = await detectNewSubmissions(userId, submissions);

  user.leetcodeUsername = username;
  user.leetcodeSyncStartDate = syncStartDate;
  user.leetcodeLastSubmissionSyncAt = new Date();
  user.leetcodeStats = {
    ...stats,
    lastSynced: new Date()
  };

  user.leetcodeSyncHistory.push({
    syncedAt: new Date(),
    totalSolved: stats.totalSolved,
    newProblemsDetected
  });

  if (user.leetcodeSyncHistory.length > 50) {
    user.leetcodeSyncHistory.splice(0, user.leetcodeSyncHistory.length - 50);
  }

  await user.save();

  await AuditLog.create({
    userId,
    eventType: 'leetcode_synced',
    description: `Synced LeetCode profile for "${username}" from ${syncStartDate.toISOString()} (total solved: ${stats.totalSolved}, new: ${newProblemsDetected})`,
    ipAddress: reqIp || '127.0.0.1'
  });

  return user;
};

/**
 * Compare accepted LeetCode submissions with the user's saved problems and
 * mark/create problems using the real LeetCode submission timestamp.
 */
export const detectNewSubmissions = async (userId, submissions) => {
  let count = 0;
  const seedProblems = loadSeedProblems();
  const seenSlugs = new Set();

  for (const submission of submissions) {
    if (!submission.title) continue;
    const titleSlug = submission.titleSlug || titleToSlug(submission.title);
    if (seenSlugs.has(titleSlug)) continue;
    seenSlugs.add(titleSlug);

    const existingProblem = await LeetcodeProblem.findOne({
      userId,
      $or: [
        { leetcodeTitleSlug: titleSlug },
        { title: { $regex: new RegExp(`^${escapeRegex(submission.title)}$`, 'i') } }
      ]
    });

    if (existingProblem) {
      if (existingProblem.status !== 'Solved' && existingProblem.status !== 'Revised') {
        existingProblem.status = 'Solved';
        existingProblem.submissionDate = submission.submittedAt;
        existingProblem.firstSolvedDate = existingProblem.firstSolvedDate || submission.submittedAt;
        existingProblem.leetcodeTitleSlug = existingProblem.leetcodeTitleSlug || titleSlug;
        existingProblem.leetcodeSubmissionId = existingProblem.leetcodeSubmissionId || submission.id;
        existingProblem.source = 'leetcode-sync';
        existingProblem.attempts = (existingProblem.attempts || 0) + 1;
        await scheduleRevision(existingProblem);
        await existingProblem.save();
        await awardXP(userId, existingProblem.difficulty);
        count++;
      }
      continue;
    }

    const metadata = await fetchQuestionMetadata(titleSlug);
    const seedMatch = findSeedMatch(seedProblems, submission, metadata);
    const problem = new LeetcodeProblem(buildSyncedProblemPayload(userId, submission, seedMatch, metadata));

    await scheduleRevision(problem);
    await problem.save();
    await awardXP(userId, problem.difficulty);
    count++;
  }

  if (count > 0) {
    await updateStreak(userId);
  }

  return count;
};

/**
 * Award XP to user based on difficulty
 */
export const awardXP = async (userId, difficulty) => {
  const xpGains = { Easy: 10, Medium: 25, Hard: 50 };
  const gain = xpGains[difficulty] || 15;
  await User.findByIdAndUpdate(userId, { $inc: { leetcodeXP: gain } });
};

/**
 * Update daily streak
 */
export const updateStreak = async (userId) => {
  const user = await User.findById(userId);
  if (!user) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const lastSolved = user.leetcodeStreak?.lastSolvedDate;
  if (!lastSolved) {
    user.leetcodeStreak = {
      current: 1,
      longest: 1,
      lastSolvedDate: new Date()
    };
  } else {
    const lastDate = new Date(lastSolved);
    lastDate.setHours(0, 0, 0, 0);

    if (lastDate.getTime() === today.getTime()) {
      user.leetcodeStreak.lastSolvedDate = new Date();
    } else if (lastDate.getTime() === yesterday.getTime()) {
      user.leetcodeStreak.current += 1;
      if (user.leetcodeStreak.current > user.leetcodeStreak.longest) {
        user.leetcodeStreak.longest = user.leetcodeStreak.current;
      }
      user.leetcodeStreak.lastSolvedDate = new Date();
    } else {
      user.leetcodeStreak.current = 1;
      user.leetcodeStreak.lastSolvedDate = new Date();
    }
  }
  await user.save();
};
