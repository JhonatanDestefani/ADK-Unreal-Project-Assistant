const express = require('express');
const context = require('../unreal/context');
const knowledge = require('../knowledge');
const guide = require('../ai/guide');

const router = express.Router();

/**
 * Parse UE5 log text and return structured data
 */
function parseUELog(logText) {
  const lines = logText.split('\n');
  const errors = [];
  const warnings = [];
  const fatals = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (/\bFatal\b|=== Critical Error ===/i.test(trimmed)) {
      fatals.push(trimmed);
    } else if (/\bError\b/i.test(trimmed) && !/\bErrored\b/i.test(trimmed)) {
      errors.push(trimmed);
    } else if (/\bWarning\b/i.test(trimmed)) {
      warnings.push(trimmed);
    }
  }

  return {
    fatals,
    errors,
    warnings,
    summary: `${fatals.length} fatal, ${errors.length} errors, ${warnings.length} warnings`,
  };
}

/**
 * POST /api/diagnose
 * Diagnose a UE5 problem using the knowledge base + Botpress AI.
 * Body: { projectPath?, problemDescription, logText? }
 */
router.post('/diagnose', async (req, res) => {
  try {
    const { projectPath, problemDescription, logText } = req.body;

    if (!problemDescription) {
      return res.status(400).json({ error: 'problemDescription is required' });
    }

    // Build full problem description including log analysis
    let fullProblem = problemDescription;
    let parsedLog = null;

    if (logText) {
      parsedLog = parseUELog(logText);
      fullProblem += `\n\nLog Analysis: ${parsedLog.summary}\n`;
      if (parsedLog.fatals.length > 0) fullProblem += `Fatals:\n${parsedLog.fatals.join('\n')}\n`;
      if (parsedLog.errors.length > 0) fullProblem += `Errors:\n${parsedLog.errors.join('\n')}\n`;
      if (parsedLog.warnings.length > 0) fullProblem += `Warnings:\n${parsedLog.warnings.join('\n')}\n`;
    }

    // Build project context if available
    const ctx = projectPath
      ? context.buildContext({ projectPath, question: problemDescription })
      : { projectOverview: null, classContext: null, fileContext: null };

    const result = await guide.diagnose(fullProblem, ctx);

    res.json({
      diagnosis: result.answer,
      classification: result.classification,
      parsedLog,
    });
  } catch (err) {
    console.error('Error in /diagnose:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/kb/search
 * Search the knowledge base directly.
 * Body: { query, source?, category?, limit? }
 */
router.post('/kb/search', (req, res) => {
  try {
    const { query, source, category, limit } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'query is required' });
    }

    const results = knowledge.search(query, {
      source: source || 'both',
      category: category || null,
      limit: limit || 5,
    });

    res.json({
      query,
      resultCount: results.length,
      results: results.map(r => ({
        id: r.id,
        source: r.source,
        category: r.category,
        title: r.title,
        description: r.description,
        rootCause: r.rootCause || null,
        solution: r.solution || null,
        keyPoints: r.keyPoints || null,
        codeExample: r.codeExample || null,
        commonMistakes: r.commonMistakes || null,
        goodPractices: r.goodPractices || null,
        symptoms: r.symptoms || null,
        tags: r.tags || null,
        relevanceScore: r.relevanceScore,
      })),
    });
  } catch (err) {
    console.error('Error in /kb/search:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/kb/categories
 * List all knowledge base categories.
 */
router.get('/kb/categories', (req, res) => {
  try {
    const categories = knowledge.listCategories();
    res.json({ categories });
  } catch (err) {
    console.error('Error in /kb/categories:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/kb/entry/:id
 * Get a specific knowledge base entry by ID.
 */
router.get('/kb/entry/:id', (req, res) => {
  try {
    const entry = knowledge.getEntry(req.params.id);
    if (!entry) {
      return res.status(404).json({ error: `Entry "${req.params.id}" not found` });
    }
    res.json(entry);
  } catch (err) {
    console.error('Error in /kb/entry:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/kb/stats
 * Get knowledge base statistics.
 */
router.get('/kb/stats', (req, res) => {
  try {
    const stats = knowledge.getStats();
    res.json(stats);
  } catch (err) {
    console.error('Error in /kb/stats:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/kb/classify
 * Classify a problem description into categories.
 * Body: { description }
 */
router.post('/kb/classify', (req, res) => {
  try {
    const { description } = req.body;

    if (!description) {
      return res.status(400).json({ error: 'description is required' });
    }

    const classification = knowledge.classifyQuery(description);

    res.json({
      description,
      categories: classification.slice(0, 5),
    });
  } catch (err) {
    console.error('Error in /kb/classify:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/kb/reload
 * Reload the knowledge base from disk (useful after adding new entries).
 */
router.post('/kb/reload', (req, res) => {
  try {
    knowledge.reloadKnowledgeBase();
    const stats = knowledge.getStats();
    res.json({ message: 'Knowledge base reloaded', stats });
  } catch (err) {
    console.error('Error in /kb/reload:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/parse-log
 * Parse a UE5 log and extract errors/warnings.
 * Body: { logText }
 */
router.post('/parse-log', (req, res) => {
  try {
    const { logText } = req.body;

    if (!logText) {
      return res.status(400).json({ error: 'logText is required' });
    }

    const parsed = parseUELog(logText);

    // Also search KB for any errors found
    const kbResults = [];
    if (parsed.errors.length > 0) {
      const errorQuery = parsed.errors.slice(0, 3).join(' ');
      const results = knowledge.search(errorQuery, { source: 'troubleshooting', limit: 3 });
      kbResults.push(...results.map(r => ({ id: r.id, title: r.title, relevanceScore: r.relevanceScore })));
    }

    res.json({
      ...parsed,
      suggestedKBEntries: kbResults,
    });
  } catch (err) {
    console.error('Error in /parse-log:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
