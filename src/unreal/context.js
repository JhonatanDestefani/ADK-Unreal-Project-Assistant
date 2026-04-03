const path = require('path');
const parser = require('./parser');

/**
 * Manages project context - understands what the user is working on
 * and builds relevant context for AI queries.
 *
 * The Unreal plugin sends:
 *  - projectPath: root of the Unreal project
 *  - currentFile: the file currently open in the editor (optional)
 *  - selectedClass: the class name the user is asking about (optional)
 *  - question: what the user wants to know
 */

// Cache parsed projects to avoid re-parsing on every request
const projectCache = new Map();
const CACHE_TTL = 60_000; // 1 minute

/**
 * Get or refresh the parsed project data
 */
function getProject(projectPath) {
  const cached = projectCache.get(projectPath);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const data = parser.parseProject(projectPath);
  projectCache.set(projectPath, { data, timestamp: Date.now() });
  return data;
}

/**
 * Force refresh the project cache (e.g., after the user saves a file)
 */
function refreshProject(projectPath) {
  projectCache.delete(projectPath);
  return getProject(projectPath);
}

/**
 * Build context for a specific class - gathers the class definition,
 * its parent chain, related classes, and source code
 */
function buildClassContext(projectPath, className) {
  const project = getProject(projectPath);
  const cls = project.classMap.get(className);

  if (!cls) {
    return {
      found: false,
      className,
      message: `Class "${className}" not found in the project source files.`,
    };
  }

  const context = {
    found: true,
    className: cls.name,
    parentClass: cls.parent,
    specifiers: cls.specifiers,
    properties: cls.properties,
    functions: cls.functions,
    headerFile: cls.headerFile,
    sourceFile: cls.sourceFile,
    headerContent: null,
    sourceContent: null,
    parentChain: [],
    relatedClasses: [],
  };

  // Read the actual file contents
  if (cls.headerFile) {
    context.headerContent = parser.readFileContent(cls.headerFile);
  }
  if (cls.sourceFile) {
    context.sourceContent = parser.readFileContent(cls.sourceFile);
  }

  // Build parent chain (follow inheritance up to Unreal base classes)
  let currentParent = cls.parent;
  while (currentParent && project.classMap.has(currentParent)) {
    const parentCls = project.classMap.get(currentParent);
    context.parentChain.push({
      name: parentCls.name,
      parent: parentCls.parent,
      specifiers: parentCls.specifiers,
    });
    currentParent = parentCls.parent;
  }
  // Add the final Unreal base class even if not in project
  if (currentParent) {
    context.parentChain.push({ name: currentParent, parent: null, specifiers: '' });
  }

  // Find related classes (classes that reference this class)
  for (const [name, otherCls] of project.classMap) {
    if (name === className) continue;

    const isRelated =
      otherCls.parent === className ||
      otherCls.properties.some(p => p.type.includes(className)) ||
      otherCls.functions.some(f => f.params.includes(className) || f.returnType.includes(className));

    if (isRelated) {
      context.relatedClasses.push({
        name: otherCls.name,
        relationship: otherCls.parent === className ? 'child' : 'references',
      });
    }
  }

  return context;
}

/**
 * Build context for a specific file - what classes are defined in it,
 * what it includes, etc.
 */
function buildFileContext(projectPath, filePath) {
  const project = getProject(projectPath);
  const content = parser.readFileContent(filePath);

  if (!content) {
    return { found: false, filePath, message: `File not found: ${filePath}` };
  }

  const isHeader = filePath.endsWith('.h');
  const parsed = isHeader
    ? parser.parseHeader(filePath, content)
    : parser.parseSource(filePath, content);

  // Find the companion file (.h <-> .cpp)
  const baseName = path.basename(filePath, path.extname(filePath));
  const companionExt = isHeader ? '.cpp' : '.h';
  let companionContent = null;

  const allFiles = [...project.headers, ...project.sources];
  const companion = allFiles.find(f => path.basename(f.filePath, path.extname(f.filePath)) === baseName && f.filePath.endsWith(companionExt));

  if (companion) {
    companionContent = parser.readFileContent(companion.filePath);
  }

  return {
    found: true,
    filePath,
    content,
    parsed,
    companionFile: companion ? companion.filePath : null,
    companionContent,
  };
}

/**
 * Build a project overview - list all classes and their relationships
 */
function buildProjectOverview(projectPath) {
  const project = getProject(projectPath);
  const classes = [];

  for (const [name, cls] of project.classMap) {
    classes.push({
      name,
      parent: cls.parent,
      specifiers: cls.specifiers,
      propertyCount: cls.properties.length,
      functionCount: cls.functions.length,
      headerFile: path.relative(projectPath, cls.headerFile),
    });
  }

  return {
    projectPath,
    totalClasses: classes.length,
    totalHeaders: project.headers.length,
    totalSources: project.sources.length,
    classes,
  };
}

/**
 * Smart context builder - determines what context to gather based on the request
 */
function buildContext(request) {
  const { projectPath, currentFile, selectedClass, question } = request;
  const context = { projectOverview: null, classContext: null, fileContext: null };

  // Always include a light project overview
  context.projectOverview = buildProjectOverview(projectPath);

  // If a specific class is mentioned, get detailed class context
  if (selectedClass) {
    context.classContext = buildClassContext(projectPath, selectedClass);
  }

  // If a file is specified, get file context
  if (currentFile) {
    context.fileContext = buildFileContext(projectPath, currentFile);
  }

  // If no class was specified, try to detect class names from the question
  if (!selectedClass && question) {
    const questionLower = question.toLowerCase();
    const classNames = [...context.projectOverview.classes.map(c => c.name)];

    // Sort by name length descending so "UAuraDamageGameplayAbility" matches
    // before "UAuraGameplayAbility" when both are substrings
    classNames.sort((a, b) => b.length - a.length);

    for (const name of classNames) {
      if (questionLower.includes(name.toLowerCase())) {
        context.classContext = buildClassContext(projectPath, name);
        break;
      }
    }
  }

  return context;
}

module.exports = {
  getProject,
  refreshProject,
  buildClassContext,
  buildFileContext,
  buildProjectOverview,
  buildContext,
};
