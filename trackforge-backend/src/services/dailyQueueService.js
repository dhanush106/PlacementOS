import LeetcodeProblem from '../models/LeetcodeProblem.js';
import User from '../models/User.js';
import { getDueRevisions } from './revisionEngine.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STRIVER_SHEET_PATH = path.join(__dirname, '..', 'config', 'striverA2ZSheet.json');

/**
 * Generate Smart Daily Queue for LeetCode
 */
export const generateDailyQueue = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  const queue = [];
  const targetCompanies = user.targetCompanies || [];
  
  // 1. Fetch due revision problems (up to 2)
  const dueRevisions = await getDueRevisions(userId);
  dueRevisions.slice(0, 2).forEach(p => {
    queue.push({
      problem: p,
      reason: '🔄 Due for Revision (Spaced Repetition)',
      priority: 1
    });
  });

  // Keep track of what we've added to avoid duplicates
  const addedNumbers = new Set(queue.map(q => q.problem.problemNumber).filter(Boolean));
  const addedTitles = new Set(queue.map(q => q.problem.title.toLowerCase()));

  // 2. Fetch Striver A2Z roadmap problems (next 2 unsolved)
  try {
    const seedPath = 'c:/Users/sarpo/OneDrive/Desktop/PlacementOS/trackforge-backend/src/config/striverA2ZSheet.json';
    const seedProblems = JSON.parse(fs.readFileSync(seedPath, 'utf8'));

    // Get all user solved problems to check progress
    const userProblems = await LeetcodeProblem.find({ userId });
    const solvedSheetIds = new Set(
      userProblems
        .filter(p => p.status === 'Solved' || p.status === 'Revised')
        .map(p => p.striverSheetId)
        .filter(Boolean)
    );

    // Find next unsolved in order of step/id
    const unsolvedSeed = seedProblems
      .filter(p => !solvedSheetIds.has(p.id) && !addedTitles.has(p.title.toLowerCase()))
      .sort((a, b) => {
        if (a.step !== b.step) return a.step - b.step;
        return a.id.localeCompare(b.id);
      });

    unsolvedSeed.slice(0, 2).forEach(p => {
      // Find if we have it locally in Attempted/Not Started status
      queue.push({
        problem: {
          title: p.title,
          problemNumber: p.problemNumber,
          difficulty: p.difficulty,
          topic: p.topic,
          subtopic: p.subtopic,
          pattern: p.pattern,
          companyTags: p.companyTags,
          link: p.link,
          striverSheetId: p.id,
          striverStep: p.step,
          striverSection: p.section,
          status: 'Not Started'
        },
        reason: '🎯 Next Roadmap Goal (Striver A2Z Sheet)',
        priority: 2
      });
      if (p.problemNumber) addedNumbers.add(p.problemNumber);
      addedTitles.add(p.title.toLowerCase());
    });
  } catch (err) {
    console.error('Error loading Striver sheet for daily queue:', err.message);
  }

  // 3. Weak topics recommendation (1 problem)
  // Let's identify weak topics from the user's solved ratios
  const allUserProbs = await LeetcodeProblem.find({ userId });
  const solvedByTopic = {};
  const totalByTopic = {};
  
  allUserProbs.forEach(p => {
    if (!totalByTopic[p.topic]) {
      totalByTopic[p.topic] = 0;
      solvedByTopic[p.topic] = 0;
    }
    totalByTopic[p.topic]++;
    if (p.status === 'Solved' || p.status === 'Revised') {
      solvedByTopic[p.topic]++;
    }
  });

  let weakestTopic = null;
  let lowestRate = 1.1;

  Object.keys(totalByTopic).forEach(topic => {
    const rate = solvedByTopic[topic] / totalByTopic[topic];
    if (rate < lowestRate) {
      lowestRate = rate;
      weakestTopic = topic;
    }
  });

  // If we have a weak topic, recommend one unsolved/attempted from Striver sheet or general seed
  if (weakestTopic) {
    try {
      const seedPath = 'c:/Users/sarpo/OneDrive/Desktop/PlacementOS/trackforge-backend/src/config/striverA2ZSheet.json';
      const seedProblems = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
      const weakMatch = seedProblems.find(p => 
        p.topic.toLowerCase() === weakestTopic.toLowerCase() &&
        !addedTitles.has(p.title.toLowerCase())
      );

      if (weakMatch) {
        queue.push({
          problem: {
            title: weakMatch.title,
            problemNumber: weakMatch.problemNumber,
            difficulty: weakMatch.difficulty,
            topic: weakMatch.topic,
            subtopic: weakMatch.subtopic,
            pattern: weakMatch.pattern,
            companyTags: weakMatch.companyTags,
            link: weakMatch.link,
            striverSheetId: weakMatch.id,
            striverStep: weakMatch.step,
            striverSection: weakMatch.section,
            status: 'Not Started'
          },
          reason: `⚡ Strengthening Weakest Topic: ${weakestTopic}`,
          priority: 3
        });
        if (weakMatch.problemNumber) addedNumbers.add(weakMatch.problemNumber);
        addedTitles.add(weakMatch.title.toLowerCase());
      }
    } catch (e) {}
  }

  // 4. Company-Specific Priority (1 problem matching target company)
  if (targetCompanies.length > 0) {
    try {
      const seedPath = 'c:/Users/sarpo/OneDrive/Desktop/PlacementOS/trackforge-backend/src/config/striverA2ZSheet.json';
      const seedProblems = JSON.parse(fs.readFileSync(seedPath, 'utf8'));

      // Find problem tagged with user's target companies
      const companyMatch = seedProblems.find(p => 
        p.companyTags.some(c => targetCompanies.includes(c)) &&
        !addedTitles.has(p.title.toLowerCase())
      );

      if (companyMatch) {
        queue.push({
          problem: {
            title: companyMatch.title,
            problemNumber: companyMatch.problemNumber,
            difficulty: companyMatch.difficulty,
            topic: companyMatch.topic,
            subtopic: companyMatch.subtopic,
            pattern: companyMatch.pattern,
            companyTags: companyMatch.companyTags,
            link: companyMatch.link,
            striverSheetId: companyMatch.id,
            striverStep: companyMatch.step,
            striverSection: companyMatch.section,
            status: 'Not Started'
          },
          reason: `💼 Target Company Target (${targetCompanies[0]})`,
          priority: 4
        });
        if (companyMatch.problemNumber) addedNumbers.add(companyMatch.problemNumber);
        addedTitles.add(companyMatch.title.toLowerCase());
      }
    } catch (e) {}
  }

  // 5. Hard Challenge (1 Hard problem from remaining queue)
  try {
    const seedPath = 'c:/Users/sarpo/OneDrive/Desktop/PlacementOS/trackforge-backend/src/config/striverA2ZSheet.json';
    const seedProblems = JSON.parse(fs.readFileSync(seedPath, 'utf8'));

    const hardMatch = seedProblems.find(p => 
      p.difficulty === 'Hard' &&
      !addedTitles.has(p.title.toLowerCase())
    );

    if (hardMatch) {
      queue.push({
        problem: {
          title: hardMatch.title,
          problemNumber: hardMatch.problemNumber,
          difficulty: hardMatch.difficulty,
          topic: hardMatch.topic,
          subtopic: hardMatch.subtopic,
          pattern: hardMatch.pattern,
          companyTags: hardMatch.companyTags,
          link: hardMatch.link,
          striverSheetId: hardMatch.id,
          striverStep: hardMatch.step,
          striverSection: hardMatch.section,
          status: 'Not Started'
        },
        reason: '🔥 Daily Hard Challenge',
        priority: 5
      });
    }
  } catch (e) {}

  return queue.sort((a, b) => a.priority - b.priority);
};
