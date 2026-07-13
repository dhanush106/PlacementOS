import express from 'express';
import Subject from '../models/Subject.js';
import AuditLog from '../models/AuditLog.js';
import { authenticate } from '../middleware/auth.js';
import { sendSuccess } from '../utils/response.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';

const router = express.Router();
router.use(authenticate);

// Helpers to compute progress for subjects
const computeSubjectProgress = (subject) => {
  let totalTopics = 0;
  let confidentTopics = 0;

  (subject.chapters || []).forEach(chap => {
    (chap.topics || []).forEach(topic => {
      totalTopics++;
      if (topic.status === 'confident') {
        confidentTopics++;
      }
    });
  });

  return totalTopics > 0 ? Math.round((confidentTopics / totalTopics) * 100) : 0;
};

// GET all subjects for user
router.get('/', async (req, res, next) => {
  try {
    const subjects = await Subject.find({ userId: req.user.userId });
    
    // Enrich subjects with calculated progress
    const enriched = subjects.map(s => {
      const progress = computeSubjectProgress(s);
      return { ...s.toObject(), progress };
    });

    return sendSuccess(res, enriched, 'Subjects fetched successfully');
  } catch (error) {
    next(error);
  }
});

// GET single subject
router.get('/:id', async (req, res, next) => {
  try {
    const subject = await Subject.findOne({ _id: req.params.id, userId: req.user.userId });
    if (!subject) throw new NotFoundError('Subject not found');

    const progress = computeSubjectProgress(subject);
    const enriched = { ...subject.toObject(), progress };

    return sendSuccess(res, enriched, 'Subject fetched successfully');
  } catch (error) {
    next(error);
  }
});

// POST create a new subject (with optional chapters/topics seed)
router.post('/', async (req, res, next) => {
  try {
    const { name, chapters, topics } = req.body;
    if (!name) throw new ValidationError('Subject name is required');

    let seededChapters = [];
    if (chapters && Array.isArray(chapters)) {
      seededChapters = chapters.map(c => ({
        name: c.name,
        topics: (c.topics || []).map(t => ({
          title: typeof t === 'string' ? t : t.title,
          status: t.status || 'not_started',
          confidence: t.confidence || 1,
          subtopics: (t.subtopics || []).map(st => ({
            title: typeof st === 'string' ? st : st.title,
            completed: st.completed || false
          }))
        }))
      }));
    } else if (topics && Array.isArray(topics)) {
      // Put simple topics array into a 'General' chapter
      seededChapters = [{
        name: 'General',
        topics: topics.map(t => ({
          title: typeof t === 'string' ? t : t.title,
          status: 'not_started',
          confidence: 1
        }))
      }];
    }

    const subject = new Subject({
      userId: req.user.userId,
      name,
      chapters: seededChapters
    });

    await subject.save();
    return sendSuccess(res, subject, 'Subject created successfully', 201);
  } catch (error) {
    next(error);
  }
});

// DELETE a subject
router.delete('/:id', async (req, res, next) => {
  try {
    const subject = await Subject.findOneAndDelete({ _id: req.params.id, userId: req.user.userId });
    if (!subject) throw new NotFoundError('Subject not found');
    return sendSuccess(res, null, 'Subject deleted successfully');
  } catch (error) {
    next(error);
  }
});

// POST add a chapter to a subject
router.post('/:id/chapters', async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name) throw new ValidationError('Chapter name is required');

    const subject = await Subject.findOne({ _id: req.params.id, userId: req.user.userId });
    if (!subject) throw new NotFoundError('Subject not found');

    subject.chapters.push({ name, topics: [] });
    await subject.save();
    
    return sendSuccess(res, subject, 'Chapter added successfully');
  } catch (error) {
    next(error);
  }
});

// DELETE a chapter from a subject
router.delete('/:id/chapters/:chapterId', async (req, res, next) => {
  try {
    const subject = await Subject.findOne({ _id: req.params.id, userId: req.user.userId });
    if (!subject) throw new NotFoundError('Subject not found');

    const chapter = subject.chapters.id(req.params.chapterId);
    if (!chapter) throw new NotFoundError('Chapter not found');

    chapter.deleteOne();
    await subject.save();

    return sendSuccess(res, subject, 'Chapter deleted successfully');
  } catch (error) {
    next(error);
  }
});

// POST add a topic under a chapter
router.post('/:id/chapters/:chapterId/topics', async (req, res, next) => {
  try {
    const { title } = req.body;
    if (!title) throw new ValidationError('Topic title is required');

    const subject = await Subject.findOne({ _id: req.params.id, userId: req.user.userId });
    if (!subject) throw new NotFoundError('Subject not found');

    const chapter = subject.chapters.id(req.params.chapterId);
    if (!chapter) throw new NotFoundError('Chapter not found');

    chapter.topics.push({ title, status: 'not_started', confidence: 1, revisionCount: 0 });
    await subject.save();

    return sendSuccess(res, subject, 'Topic added successfully');
  } catch (error) {
    next(error);
  }
});

// DELETE a topic from a chapter
router.delete('/:id/chapters/:chapterId/topics/:topicId', async (req, res, next) => {
  try {
    const subject = await Subject.findOne({ _id: req.params.id, userId: req.user.userId });
    if (!subject) throw new NotFoundError('Subject not found');

    const chapter = subject.chapters.id(req.params.chapterId);
    if (!chapter) throw new NotFoundError('Chapter not found');

    const topic = chapter.topics.id(req.params.topicId);
    if (!topic) throw new NotFoundError('Topic not found');

    topic.deleteOne();
    await subject.save();

    return sendSuccess(res, subject, 'Topic deleted successfully');
  } catch (error) {
    next(error);
  }
});

// POST add a subtopic under a topic
router.post('/:id/chapters/:chapterId/topics/:topicId/subtopics', async (req, res, next) => {
  try {
    const { title } = req.body;
    if (!title) throw new ValidationError('Subtopic title is required');

    const subject = await Subject.findOne({ _id: req.params.id, userId: req.user.userId });
    if (!subject) throw new NotFoundError('Subject not found');

    const chapter = subject.chapters.id(req.params.chapterId);
    if (!chapter) throw new NotFoundError('Chapter not found');

    const topic = chapter.topics.id(req.params.topicId);
    if (!topic) throw new NotFoundError('Topic not found');

    topic.subtopics.push({ title, completed: false });
    await subject.save();

    return sendSuccess(res, subject, 'Subtopic added successfully');
  } catch (error) {
    next(error);
  }
});

// PATCH toggle subtopic completion
router.patch('/:id/chapters/:chapterId/topics/:topicId/subtopics/:subtopicId', async (req, res, next) => {
  try {
    const { completed } = req.body;
    if (completed === undefined) throw new ValidationError('completed state (boolean) is required');

    const subject = await Subject.findOne({ _id: req.params.id, userId: req.user.userId });
    if (!subject) throw new NotFoundError('Subject not found');

    const chapter = subject.chapters.id(req.params.chapterId);
    if (!chapter) throw new NotFoundError('Chapter not found');

    const topic = chapter.topics.id(req.params.topicId);
    if (!topic) throw new NotFoundError('Topic not found');

    const subtopic = topic.subtopics.id(req.params.subtopicId);
    if (!subtopic) throw new NotFoundError('Subtopic not found');

    subtopic.completed = completed;
    await subject.save();

    return sendSuccess(res, subject, 'Subtopic updated successfully');
  } catch (error) {
    next(error);
  }
});

// DELETE subtopic
router.delete('/:id/chapters/:chapterId/topics/:topicId/subtopics/:subtopicId', async (req, res, next) => {
  try {
    const subject = await Subject.findOne({ _id: req.params.id, userId: req.user.userId });
    if (!subject) throw new NotFoundError('Subject not found');

    const chapter = subject.chapters.id(req.params.chapterId);
    if (!chapter) throw new NotFoundError('Chapter not found');

    const topic = chapter.topics.id(req.params.topicId);
    if (!topic) throw new NotFoundError('Topic not found');

    const subtopic = topic.subtopics.id(req.params.subtopicId);
    if (!subtopic) throw new NotFoundError('Subtopic not found');

    subtopic.deleteOne();
    await subject.save();

    return sendSuccess(res, subject, 'Subtopic deleted successfully');
  } catch (error) {
    next(error);
  }
});

// PATCH topic status, confidence, or notes
router.patch('/:subjectId/chapters/:chapterId/topics/:topicId', async (req, res, next) => {
  try {
    const { subjectId, chapterId, topicId } = req.params;
    const { status, confidence, notes } = req.body;

    const subject = await Subject.findOne({ _id: subjectId, userId: req.user.userId });
    if (!subject) throw new NotFoundError('Subject not found');

    const chapter = subject.chapters.id(chapterId);
    if (!chapter) throw new NotFoundError('Chapter not found');

    const topic = chapter.topics.id(topicId);
    if (!topic) throw new NotFoundError('Topic not found');

    if (status) topic.status = status;
    if (confidence !== undefined) topic.confidence = confidence;
    if (notes !== undefined) topic.notes = notes;

    // Spaced repetition setup
    if (status === 'revising' || status === 'confident') {
      topic.revisionCount += 1;
      topic.lastRevised = new Date();
      const intervals = [1, 3, 7, 14, 30];
      const idx = Math.min(topic.revisionCount - 1, intervals.length - 1);
      topic.nextReviewDate = new Date(Date.now() + intervals[idx] * 86400000);
    }

    await subject.save();

    await AuditLog.create({
      userId: req.user.userId,
      eventType: 'topic_updated',
      description: `Updated topic "${topic.title}" in subject "${subject.name}" to ${status}`,
      ipAddress: req.ip
    });

    return sendSuccess(res, subject, 'Topic updated successfully');
  } catch (error) {
    next(error);
  }
});

export default router;
