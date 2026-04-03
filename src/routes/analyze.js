const express = require('express');
const context = require('../unreal/context');
const blueprint = require('../unreal/blueprint');
const guide = require('../ai/guide');

const router = express.Router();

/**
 * POST /api/ask
 * General question with project context.
 * Body: { projectPath, currentFile?, selectedClass?, question }
 */
router.post('/ask', async (req, res) => {
  try {
    const { projectPath, currentFile, selectedClass, question } = req.body;

    if (!projectPath || !question) {
      return res.status(400).json({ error: 'projectPath and question are required' });
    }

    const ctx = context.buildContext({ projectPath, currentFile, selectedClass, question });
    const result = await guide.ask(question, ctx);

    res.json({
      answer: result.answer,
      usage: result.usage,
    });
  } catch (err) {
    console.error('Error in /ask:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/explain
 * Explain a specific class.
 * Body: { projectPath, className }
 */
router.post('/explain', async (req, res) => {
  try {
    const { projectPath, className } = req.body;

    if (!projectPath || !className) {
      return res.status(400).json({ error: 'projectPath and className are required' });
    }

    const ctx = context.buildContext({ projectPath, selectedClass: className });
    const result = await guide.explainClass(className, ctx);

    res.json({
      className,
      explanation: result.answer,
      usage: result.usage,
    });
  } catch (err) {
    console.error('Error in /explain:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/review
 * Review code and suggest improvements.
 * Body: { projectPath, currentFile?, code?, language? }
 * If code is provided directly, it reviews that. Otherwise reads currentFile.
 */
router.post('/review', async (req, res) => {
  try {
    const { projectPath, currentFile, code, language = 'cpp' } = req.body;

    if (!projectPath) {
      return res.status(400).json({ error: 'projectPath is required' });
    }

    let codeToReview = code;
    if (!codeToReview && currentFile) {
      const fileCtx = context.buildFileContext(projectPath, currentFile);
      if (!fileCtx.found) {
        return res.status(404).json({ error: fileCtx.message });
      }
      codeToReview = fileCtx.content;
    }

    if (!codeToReview) {
      return res.status(400).json({ error: 'Either code or currentFile must be provided' });
    }

    const ctx = context.buildContext({ projectPath, currentFile });
    const result = await guide.reviewCode(codeToReview, language, ctx);

    res.json({
      review: result.answer,
      usage: result.usage,
    });
  } catch (err) {
    console.error('Error in /review:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/review-blueprint
 * Review a blueprint (data exported as JSON from the Unreal plugin).
 * Body: { projectPath, blueprintData }
 */
router.post('/review-blueprint', async (req, res) => {
  try {
    const { projectPath, blueprintData } = req.body;

    if (!projectPath || !blueprintData) {
      return res.status(400).json({ error: 'projectPath and blueprintData are required' });
    }

    const ctx = context.buildContext({ projectPath });
    const analysis = blueprint.analyzeBlueprint(blueprintData);
    const result = await guide.reviewBlueprint(blueprintData, ctx);

    res.json({
      blueprint: blueprintData.name,
      analysis,
      review: result.answer,
      usage: result.usage,
    });
  } catch (err) {
    console.error('Error in /review-blueprint:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/project-overview
 * Get an overview of all classes in the project.
 * Body: { projectPath }
 */
router.post('/project-overview', async (req, res) => {
  try {
    const { projectPath } = req.body;

    if (!projectPath) {
      return res.status(400).json({ error: 'projectPath is required' });
    }

    const overview = context.buildProjectOverview(projectPath);
    res.json(overview);
  } catch (err) {
    console.error('Error in /project-overview:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/refresh
 * Force refresh the project cache (call after saving files).
 * Body: { projectPath }
 */
router.post('/refresh', async (req, res) => {
  try {
    const { projectPath } = req.body;

    if (!projectPath) {
      return res.status(400).json({ error: 'projectPath is required' });
    }

    context.refreshProject(projectPath);
    res.json({ message: 'Project cache refreshed' });
  } catch (err) {
    console.error('Error in /refresh:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/class-map
 * Return the parsed class map so users can verify what the bot sees.
 * Body: { projectPath, className? }
 * If className is provided, returns detailed info for that class only.
 */
router.post('/class-map', (req, res) => {
  try {
    const { projectPath, className } = req.body;

    if (!projectPath) {
      return res.status(400).json({ error: 'projectPath is required' });
    }

    const overview = context.buildProjectOverview(projectPath);

    if (className) {
      const classCtx = context.buildClassContext(projectPath, className);
      if (!classCtx.found) {
        return res.status(404).json({ error: classCtx.message });
      }
      return res.json({
        projectPath,
        totalClasses: overview.totalClasses,
        class: {
          name: classCtx.className,
          parent: classCtx.parentClass,
          specifiers: classCtx.specifiers,
          properties: classCtx.properties,
          functions: classCtx.functions,
          headerFile: classCtx.headerFile,
          sourceFile: classCtx.sourceFile,
          parentChain: classCtx.parentChain,
          relatedClasses: classCtx.relatedClasses,
        },
      });
    }

    res.json({
      projectPath,
      totalClasses: overview.totalClasses,
      totalHeaders: overview.totalHeaders,
      totalSources: overview.totalSources,
      classes: overview.classes,
    });
  } catch (err) {
    console.error('Error in /class-map:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
