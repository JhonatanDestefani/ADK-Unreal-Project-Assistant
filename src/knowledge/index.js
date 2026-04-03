const fs = require('fs');
const path = require('path');

/**
 * Dual Knowledge Base: Engine Reference + Troubleshooting
 *
 * Engine Reference: official UE5 documentation and system guides
 * Troubleshooting: real-world bugs and fixes from personal experience
 *
 * Both are searched independently and results indicate which source they came from.
 */

const KNOWLEDGE_DIR = __dirname;
const ENGINE_REF_DIR = path.join(KNOWLEDGE_DIR, 'engine-reference');
const TROUBLESHOOT_DIR = path.join(KNOWLEDGE_DIR, 'troubleshooting');

let kb = null;

/**
 * Scan a directory for all .json files and load them
 */
function loadJsonFiles(dir) {
  if (!fs.existsSync(dir)) return [];

  const results = [];
  for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.json'))) {
    const filePath = path.join(dir, f);
    try {
      results.push(JSON.parse(fs.readFileSync(filePath, 'utf-8')));
    } catch (err) {
      console.warn(`[KB] Failed to load ${filePath}: ${err.message}`);
    }
  }
  return results;
}

/**
 * Load both knowledge bases into memory
 */
function loadKnowledgeBase() {
  if (kb) return kb;

  kb = {
    engineReference: { categories: {}, allEntries: [] },
    troubleshooting: { categories: {}, allEntries: [] },
  };

  // Load engine reference
  for (const data of loadJsonFiles(ENGINE_REF_DIR)) {
    kb.engineReference.categories[data.category] = {
      displayName: data.displayName,
      description: data.description,
      entries: data.entries,
    };
    for (const entry of data.entries) {
      kb.engineReference.allEntries.push({
        ...entry,
        source: 'engine-reference',
        category: data.category,
        categoryDisplayName: data.displayName,
      });
    }
  }

  // Load troubleshooting
  for (const data of loadJsonFiles(TROUBLESHOOT_DIR)) {
    kb.troubleshooting.categories[data.category] = {
      displayName: data.displayName,
      description: data.description,
      entries: data.entries,
    };
    for (const entry of data.entries) {
      kb.troubleshooting.allEntries.push({
        ...entry,
        source: 'troubleshooting',
        category: data.category,
        categoryDisplayName: data.displayName,
      });
    }
  }

  return kb;
}

/**
 * Reload both knowledge bases
 */
function reloadKnowledgeBase() {
  kb = null;
  return loadKnowledgeBase();
}

/**
 * Tokenize and normalize text for matching.
 * Also expands UE5 class name prefixes: ACharacter -> [acharacter, character],
 * UObject -> [uobject, object], FVector -> [fvector, vector], etc.
 */
function tokenize(text) {
  const raw = text
    .toLowerCase()
    .replace(/[^a-z0-9_\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 1);

  const expanded = [];
  for (const token of raw) {
    expanded.push(token);
    // Expand UE5 class prefixes: a, u, f, e, i (ACharacter, UObject, FVector, ECollisionChannel, IInteractable)
    const prefixMatch = token.match(/^([aufei])([a-z][a-z0-9_]+)$/);
    if (prefixMatch && prefixMatch[2].length >= 3) {
      expanded.push(prefixMatch[2]); // 'acharacter' -> also adds 'character'
    }
  }

  return [...new Set(expanded)];
}

/**
 * Score how well an entry matches a query
 */
function scoreEntry(entry, queryTokens) {
  let score = 0;

  const titleTokens = tokenize(entry.title);
  for (const qt of queryTokens) {
    // Exact token match in title is worth more than substring
    if (titleTokens.some(tt => tt === qt)) {
      score += 15;
    } else if (titleTokens.some(tt => tt.includes(qt) || qt.includes(tt))) {
      score += 5;
    }
  }

  if (entry.symptoms) {
    for (const symptom of entry.symptoms) {
      const symptomTokens = tokenize(symptom);
      for (const qt of queryTokens) {
        // Only exact token matches for symptoms — substring matching was too loose
        if (symptomTokens.some(st => st === qt)) {
          score += 8;
        }
      }
    }
  }

  // relatedClasses get high score — exact class name matches are very relevant
  if (entry.relatedClasses) {
    for (const cls of entry.relatedClasses) {
      const clsTokens = tokenize(cls);
      for (const qt of queryTokens) {
        if (clsTokens.some(ct => ct === qt)) {
          score += 7;
        }
      }
    }
  }

  if (entry.tags) {
    for (const tag of entry.tags) {
      const tagTokens = tokenize(tag);
      for (const qt of queryTokens) {
        if (tagTokens.some(tt => tt === qt)) {
          score += 5;
        }
      }
    }
  }

  // keyPoints (engine reference) or description
  const descText = [
    entry.description || '',
    entry.whatItIs || '',
    ...(entry.keyPoints || []),
    ...(entry.whenToUse || []),
    ...(entry.whenNotToUse || []),
    ...(entry.commonMistakes || []),
    ...(entry.goodPractices || []),
  ].join(' ');
  const descTokens = tokenize(descText);
  for (const qt of queryTokens) {
    if (descTokens.includes(qt)) {
      score += 2;
    }
  }

  const causeTokens = tokenize(entry.rootCause || '');
  for (const qt of queryTokens) {
    if (causeTokens.includes(qt)) {
      score += 1;
    }
  }

  return score;
}

/**
 * Search a specific knowledge block or both.
 *
 * @param {string} query - The search query
 * @param {object} options
 * @param {string} options.source - 'engine-reference', 'troubleshooting', or 'both' (default)
 * @param {string} options.category - Filter by category (optional)
 * @param {number} options.limit - Max results per source (default 5)
 * @param {number} options.minScore - Minimum relevance score (default 3)
 */
function search(query, options = {}) {
  const { source = 'both', category = null, limit = 5, minScore = 3 } = options;
  const data = loadKnowledgeBase();
  const queryTokens = tokenize(query);

  if (queryTokens.length === 0) return [];

  const sources = [];
  if (source === 'both' || source === 'engine-reference') {
    sources.push(...data.engineReference.allEntries);
  }
  if (source === 'both' || source === 'troubleshooting') {
    sources.push(...data.troubleshooting.allEntries);
  }

  let entries = sources;
  if (category) {
    entries = entries.filter(e => e.category === category);
  }

  return entries
    .map(entry => ({
      ...entry,
      relevanceScore: scoreEntry(entry, queryTokens),
    }))
    .filter(e => e.relevanceScore >= minScore)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, limit);
}

/**
 * Search engine reference only
 */
function searchEngineReference(query, options = {}) {
  return search(query, { ...options, source: 'engine-reference' });
}

/**
 * Search troubleshooting only
 */
function searchTroubleshooting(query, options = {}) {
  return search(query, { ...options, source: 'troubleshooting' });
}

/**
 * List all categories across both sources
 */
function listCategories() {
  const data = loadKnowledgeBase();
  const categories = [];

  for (const [key, val] of Object.entries(data.engineReference.categories)) {
    categories.push({
      id: key,
      source: 'engine-reference',
      displayName: val.displayName,
      description: val.description,
      entryCount: val.entries.length,
    });
  }

  for (const [key, val] of Object.entries(data.troubleshooting.categories)) {
    categories.push({
      id: key,
      source: 'troubleshooting',
      displayName: val.displayName,
      description: val.description,
      entryCount: val.entries.length,
    });
  }

  return categories;
}

/**
 * Get a specific entry by ID from either source
 */
function getEntry(entryId) {
  const data = loadKnowledgeBase();
  return (
    data.engineReference.allEntries.find(e => e.id === entryId) ||
    data.troubleshooting.allEntries.find(e => e.id === entryId) ||
    null
  );
}

/**
 * Classify a query into the most likely category
 */
function classifyQuery(query) {
  const data = loadKnowledgeBase();
  const queryTokens = tokenize(query);
  const categoryScores = {};

  const allCategories = {
    ...data.engineReference.categories,
    ...data.troubleshooting.categories,
  };

  for (const [catName, catData] of Object.entries(allCategories)) {
    let score = 0;
    for (const entry of catData.entries) {
      score += scoreEntry(entry, queryTokens);
    }
    categoryScores[catName] = (categoryScores[catName] || 0) + score;
  }

  return Object.entries(categoryScores)
    .map(([category, score]) => ({ category, score }))
    .filter(c => c.score > 0)
    .sort((a, b) => b.score - a.score);
}

/**
 * Format an entry as readable text for the AI agent
 */
function formatEntry(entry) {
  const sourceLabel = entry.source === 'engine-reference'
    ? '📖 Engine Reference'
    : '🔧 Troubleshooting';

  let text = `## ${entry.title}\n`;
  text += `**Source:** ${sourceLabel}\n`;
  text += `**Category:** ${entry.categoryDisplayName || entry.category}\n\n`;

  if (entry.whatItIs) {
    text += `**What it is:** ${entry.whatItIs}\n\n`;
  }

  text += `**Description:** ${entry.description}\n\n`;

  if (entry.whenToUse && entry.whenToUse.length > 0) {
    text += `**When to use it:**\n`;
    for (const item of entry.whenToUse) {
      text += `- ${item}\n`;
    }
    text += '\n';
  }

  if (entry.whenNotToUse && entry.whenNotToUse.length > 0) {
    text += `**When NOT to use it:**\n`;
    for (const item of entry.whenNotToUse) {
      text += `- ${item}\n`;
    }
    text += '\n';
  }

  if (entry.keyPoints && entry.keyPoints.length > 0) {
    text += `**Key Points:**\n`;
    for (const point of entry.keyPoints) {
      text += `- ${point}\n`;
    }
    text += '\n';
  }

  if (entry.relatedClasses && entry.relatedClasses.length > 0) {
    text += `**Related Classes:** ${entry.relatedClasses.join(', ')}\n\n`;
  }

  if (entry.commonMistakes && entry.commonMistakes.length > 0) {
    text += `**Common Mistakes:**\n`;
    for (const mistake of entry.commonMistakes) {
      text += `- ⚠️ ${mistake}\n`;
    }
    text += '\n';
  }

  if (entry.goodPractices && entry.goodPractices.length > 0) {
    text += `**Good Practices:**\n`;
    for (const practice of entry.goodPractices) {
      text += `- ✅ ${practice}\n`;
    }
    text += '\n';
  }

  if (entry.rootCause) {
    text += `**Root Cause:** ${entry.rootCause}\n\n`;
  }

  if (entry.solution && entry.solution.length > 0) {
    text += `**Solution:**\n`;
    for (const step of entry.solution) {
      text += `- ${step}\n`;
    }
    text += '\n';
  }

  if (entry.codeExample) {
    text += `**Code Example:**\n\`\`\`cpp\n${entry.codeExample}\n\`\`\`\n\n`;
  }

  if (entry.lifecycle) {
    text += `**Lifecycle:** ${entry.lifecycle}\n\n`;
  }

  if (entry.symptoms) {
    text += `**Related Symptoms:** ${entry.symptoms.join(', ')}\n`;
  }

  if (entry.tags) {
    text += `**Tags:** ${entry.tags.join(', ')}\n`;
  }

  return text;
}

/**
 * Format search results as a context block for the AI agent
 */
function formatSearchResults(results) {
  if (results.length === 0) {
    return 'No matching entries found in the knowledge base.';
  }

  const engineResults = results.filter(r => r.source === 'engine-reference');
  const troubleResults = results.filter(r => r.source === 'troubleshooting');

  let text = '';

  if (engineResults.length > 0) {
    text += `### 📖 Engine Reference (${engineResults.length} results)\n\n`;
    for (const result of engineResults) {
      text += formatEntry(result);
      text += `**Relevance:** ${result.relevanceScore}\n---\n\n`;
    }
  }

  if (troubleResults.length > 0) {
    text += `### 🔧 Troubleshooting (${troubleResults.length} results)\n\n`;
    for (const result of troubleResults) {
      text += formatEntry(result);
      text += `**Relevance:** ${result.relevanceScore}\n---\n\n`;
    }
  }

  return text;
}

/**
 * Get stats about both knowledge bases
 */
function getStats() {
  const data = loadKnowledgeBase();
  return {
    engineReference: {
      categories: Object.keys(data.engineReference.categories).length,
      totalEntries: data.engineReference.allEntries.length,
    },
    troubleshooting: {
      categories: Object.keys(data.troubleshooting.categories).length,
      totalEntries: data.troubleshooting.allEntries.length,
    },
  };
}

module.exports = {
  loadKnowledgeBase,
  reloadKnowledgeBase,
  search,
  searchEngineReference,
  searchTroubleshooting,
  listCategories,
  getEntry,
  classifyQuery,
  formatEntry,
  formatSearchResults,
  getStats,
};
