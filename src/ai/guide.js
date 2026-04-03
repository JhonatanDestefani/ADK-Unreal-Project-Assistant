const blueprint = require('../unreal/blueprint');
const knowledge = require('../knowledge');

const BOT_ID = process.env.BOTPRESS_BOT_ID;
const PAT = process.env.BOTPRESS_PAT;
const INTEGRATION_ID = process.env.BOTPRESS_INTEGRATION_ID;
const API_URL = 'https://api.botpress.cloud/v1';

// Keywords that indicate an Unreal Engine related question
const UE_KEYWORDS = [
  // engine & editor
  'unreal', 'ue4', 'ue5', 'unreal engine', 'epic games', 'editor', 'level editor',
  'content browser', 'world outliner', 'details panel', 'play in editor', 'pie',
  // c++ & macros
  'uclass', 'ustruct', 'uenum', 'uproperty', 'ufunction', 'umeta',
  'uobject', 'aactor', 'acharacter', 'apawn', 'aplayercontroller', 'agamemode',
  'agamemodebase', 'ahud', 'aplayerstate', 'agamestate', 'uactorcomponent',
  'uscenecomponent', 'uwidget', 'uuserwidget',
  'tarray', 'tmap', 'tset', 'tsubclassof', 'tsoftobjectptr', 'tsoftclassptr',
  'fstring', 'fname', 'ftext', 'fvector', 'frotator', 'ftransform', 'fhitresult',
  'newobject', 'createdefaultsubobject', 'spawnactor',
  'generated_body', 'super::', 'getworld', 'getowner',
  // systems
  'blueprint', 'blueprints', 'bp_', 'widget blueprint',
  'actor', 'pawn', 'character', 'controller', 'gamemode', 'gamestate', 'playerstate',
  'component', 'actor component', 'scene component',
  'tick', 'beginplay', 'begin play', 'endplay', 'end play', 'event tick',
  'collision', 'overlap', 'line trace', 'linetrace', 'raytrace', 'sweep',
  'animation', 'anim blueprint', 'anim montage', 'anim notify', 'skeletal mesh',
  'static mesh', 'skeletal', 'mesh',
  'material', 'shader', 'texture', 'render', 'lumen', 'nanite', 'niagara', 'cascade',
  'umg', 'slate', 'widget', 'hud', 'ui',
  'behavior tree', 'blackboard', 'eqs', 'ai controller', 'ai perception',
  'navigation', 'navmesh', 'pathfinding',
  'gas', 'gameplay ability', 'ability system', 'gameplay effect', 'gameplay tag',
  'enhanced input', 'input action', 'input mapping', 'input component',
  'replication', 'replicated', 'rpc', 'server', 'client', 'multicast', 'net',
  'multiplayer', 'dedicated server', 'listen server',
  'data table', 'data asset', 'primary asset', 'asset manager',
  'subsystem', 'game instance', 'world subsystem',
  'level', 'map', 'streaming', 'world partition', 'level streaming',
  'sequencer', 'cinematics', 'matinee',
  'pcg', 'procedural', 'landscape', 'foliage', 'terrain',
  'physics', 'chaos', 'rigid body', 'constraint',
  'sound', 'audio', 'metasound', 'sound cue',
  'plugin', 'module', '.uproject', '.uplugin', '.build.cs',
  'hot reload', 'live coding', 'cooking', 'packaging', 'shipping',
  'gc', 'garbage collection', 'weak pointer', 'shared pointer',
  // common question patterns
  'c++', 'cpp', 'header file', 'source file',
  'compile', 'build', 'link', 'linker',
  'crash', 'access violation', 'nullptr', 'assertion',
  'fps', 'draw call', 'stat unit', 'optimization', 'profiling',
];

/**
 * Check if a question is related to Unreal Engine.
 * Returns true if related, false otherwise.
 */
function isUnrealRelated(question, context) {
  // If project context is provided, the user is working in an Unreal project
  if (context && (context.projectOverview || context.classContext || context.fileContext || context.blueprintData)) {
    return true;
  }

  // Check knowledge base — if there are matches, it's UE related
  const kbResults = knowledge.search(question, { source: 'both', limit: 1, minScore: 5 });
  if (kbResults.length > 0) {
    return true;
  }

  // Check for UE keywords in the question
  const lower = question.toLowerCase();
  return UE_KEYWORDS.some(keyword => lower.includes(keyword));
}

const OFF_TOPIC_RESPONSE = `I appreciate the question, but I'm **Unreal Project Assistant** — I specialize exclusively in **Unreal Engine** development!

I can help you with things like:
- **C++ & Blueprints** — classes, macros, best practices
- **Engine Systems** — AI, input, replication, UI, animation, physics
- **Troubleshooting** — crashes, build errors, performance issues
- **Code Reviews** — reviewing your UE project code
- **Architecture** — project structure, design patterns in UE

Feel free to ask me anything related to Unreal Engine!`;

let userId = null;
let conversationId = null;

/**
 * Make an authenticated request to Botpress Cloud API
 */
async function botpressRequest(method, path, body = null) {
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${PAT}`,
      'Content-Type': 'application/json',
      'x-bot-id': BOT_ID,
      'x-integration-id': INTEGRATION_ID,
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_URL}${path}`, options);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Botpress API error (${response.status}): ${errorText}`);
  }

  return response.json();
}

/**
 * Create or get a user for conversations
 */
async function ensureUser() {
  if (userId) return userId;

  const result = await botpressRequest('POST', '/chat/users', {
    name: 'Unreal Project Assistant User',
    channel: 'channel',
    tags: {},
  });

  userId = result.user.id;
  return userId;
}

/**
 * Get or create a conversation for a project
 */
async function getConversation() {
  if (conversationId) return conversationId;

  await ensureUser();

  const result = await botpressRequest('POST', '/chat/conversations', {
    participantIds: [userId],
    channel: 'channel',
    tags: {},
  });

  conversationId = result.conversation.id;
  return conversationId;
}

/**
 * Send a message and wait for the bot's response
 */
async function sendAndWaitForResponse(conversationId, messageText) {
  await ensureUser();

  // Record timestamp before sending so we can filter for new messages only
  const sentAt = new Date().toISOString();
  console.log(`[Guide] Sending message to conversation ${conversationId} at ${sentAt}`);

  // Send message
  await botpressRequest('POST', '/chat/messages', {
    conversationId,
    userId,
    channel: 'channel',
    payload: {
      type: 'text',
      text: messageText,
    },
    type: 'text',
    tags: {},
  });

  // Poll for bot response with fast polling
  const maxAttempts = 120;

  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(resolve => setTimeout(resolve, 500));

    const result = await botpressRequest('GET', `/chat/messages?conversationId=${conversationId}`);
    const messages = result.messages || [];

    // Find bot responses that arrived AFTER we sent our message
    const newBotMessages = messages.filter(m =>
      m.direction === 'outgoing' &&
      m.payload?.text &&
      m.createdAt > sentAt
    );

    if (newBotMessages.length > 0) {
      console.log(`[Guide] Got ${newBotMessages.length} new response(s) after ${i + 1} polls`);
      return newBotMessages.map(m => m.payload.text).join('\n\n');
    }
  }

  throw new Error('Timed out waiting for Botpress response');
}

/**
 * Build context text from project data
 */
function buildContextText(context) {
  let contextText = '';

  if (context.projectOverview) {
    contextText += '## Project Overview\n';
    contextText += `Total classes: ${context.projectOverview.totalClasses}\n`;
    contextText += `Header files: ${context.projectOverview.totalHeaders}\n`;
    contextText += `Source files: ${context.projectOverview.totalSources}\n\n`;
    contextText += 'Classes in project:\n';
    for (const cls of context.projectOverview.classes) {
      contextText += `- ${cls.name} : ${cls.parent} (${cls.propertyCount} props, ${cls.functionCount} funcs) [${cls.headerFile}]\n`;
    }
    contextText += '\n';
  }

  if (context.classContext && context.classContext.found) {
    const cls = context.classContext;
    contextText += `## Current Class: ${cls.className}\n`;
    contextText += `Parent: ${cls.parentClass}\n`;
    contextText += `Specifiers: ${cls.specifiers}\n`;

    if (cls.parentChain.length > 0) {
      contextText += `Inheritance chain: ${cls.className} -> ${cls.parentChain.map(p => p.name).join(' -> ')}\n`;
    }

    if (cls.properties.length > 0) {
      contextText += '\nProperties:\n';
      for (const prop of cls.properties) {
        contextText += `  UPROPERTY(${prop.specifiers}) ${prop.type} ${prop.name}\n`;
      }
    }

    if (cls.functions.length > 0) {
      contextText += '\nFunctions:\n';
      for (const func of cls.functions) {
        contextText += `  UFUNCTION(${func.specifiers}) ${func.returnType} ${func.name}(${func.params})\n`;
      }
    }

    if (cls.relatedClasses.length > 0) {
      contextText += '\nRelated classes:\n';
      for (const rel of cls.relatedClasses) {
        contextText += `  - ${rel.name} (${rel.relationship})\n`;
      }
    }

    if (cls.headerContent) {
      contextText += `\n## Header File (${cls.headerFile}):\n\`\`\`cpp\n${cls.headerContent}\n\`\`\`\n`;
    }

    if (cls.sourceContent) {
      contextText += `\n## Source File (${cls.sourceFile}):\n\`\`\`cpp\n${cls.sourceContent}\n\`\`\`\n`;
    }
  }

  if (context.fileContext && context.fileContext.found) {
    const file = context.fileContext;
    contextText += `\n## Current File: ${file.filePath}\n`;
    contextText += `\`\`\`cpp\n${file.content}\n\`\`\`\n`;

    if (file.companionContent) {
      contextText += `\n## Companion File: ${file.companionFile}\n`;
      contextText += `\`\`\`cpp\n${file.companionContent}\n\`\`\`\n`;
    }
  }

  if (context.blueprintData) {
    const bpText = blueprint.blueprintToText(context.blueprintData);
    const bpAnalysis = blueprint.analyzeBlueprint(context.blueprintData);
    contextText += `\n## Blueprint Data:\n${bpText}\n`;
    contextText += `\nComplexity: ${bpAnalysis.complexity}\n`;
    if (bpAnalysis.suggestions.length > 0) {
      contextText += 'Pre-analysis suggestions:\n';
      for (const s of bpAnalysis.suggestions) {
        contextText += `  [${s.priority}] ${s.message}\n`;
      }
    }
  }

  return contextText;
}

/**
 * Enrich a question with knowledge base context before sending to Botpress.
 * Searches both knowledge bases and prepends relevant findings.
 */
function enrichWithKnowledge(question) {
  // Search both KBs for relevant entries
  const results = knowledge.search(question, { source: 'both', limit: 3, minScore: 5 });

  if (results.length === 0) return '';

  let kbContext = '\n[KNOWLEDGE BASE CONTEXT]\n';
  kbContext += 'The following entries from the knowledge base may be relevant:\n\n';

  for (const result of results) {
    const sourceLabel = result.source === 'engine-reference'
      ? 'Engine Reference'
      : 'Troubleshooting';
    kbContext += `--- ${sourceLabel}: ${result.title} ---\n`;

    if (result.whatItIs) {
      kbContext += `What it is: ${result.whatItIs}\n`;
    }

    kbContext += `${result.description}\n`;

    if (result.whenToUse && result.whenToUse.length > 0) {
      kbContext += 'When to use it:\n';
      for (const item of result.whenToUse) {
        kbContext += `  - ${item}\n`;
      }
    }

    if (result.whenNotToUse && result.whenNotToUse.length > 0) {
      kbContext += 'When NOT to use it:\n';
      for (const item of result.whenNotToUse) {
        kbContext += `  - ${item}\n`;
      }
    }

    if (result.rootCause) {
      kbContext += `Root Cause: ${result.rootCause}\n`;
    }

    if (result.solution && result.solution.length > 0) {
      kbContext += 'Solution:\n';
      for (const step of result.solution) {
        kbContext += `  - ${step}\n`;
      }
    }

    if (result.keyPoints && result.keyPoints.length > 0) {
      kbContext += 'Key Points:\n';
      for (const point of result.keyPoints) {
        kbContext += `  - ${point}\n`;
      }
    }

    if (result.relatedClasses && result.relatedClasses.length > 0) {
      kbContext += `Related Classes: ${result.relatedClasses.join(', ')}\n`;
    }

    if (result.commonMistakes && result.commonMistakes.length > 0) {
      kbContext += 'Common Mistakes:\n';
      for (const mistake of result.commonMistakes) {
        kbContext += `  - ${mistake}\n`;
      }
    }

    if (result.goodPractices && result.goodPractices.length > 0) {
      kbContext += 'Good Practices:\n';
      for (const practice of result.goodPractices) {
        kbContext += `  - ${practice}\n`;
      }
    }

    if (result.codeExample) {
      kbContext += `C++ Code Example:\n\`\`\`cpp\n${result.codeExample}\n\`\`\`\n`;
    }

    kbContext += '\n';
  }

  return kbContext;
}

/**
 * Ask the guide a question with project context + knowledge base enrichment
 */
async function ask(question, context) {
  // Guard: only answer Unreal Engine related questions
  if (!isUnrealRelated(question, context)) {
    return { answer: OFF_TOPIC_RESPONSE };
  }

  const detectedClass = context.classContext?.className || 'none';
  console.log(`[Guide] Question: "${question.substring(0, 60)}..." | Class detected: ${detectedClass}`);

  const conversationId = await getConversation();

  const contextText = buildContextText(context);
  const kbContext = enrichWithKnowledge(question);

  let fullMessage;
  if (contextText || kbContext) {
    fullMessage = '';
    if (contextText) fullMessage += `[PROJECT CONTEXT]\n${contextText}\n`;
    if (kbContext) fullMessage += kbContext;
    fullMessage += `[QUESTION]\n${question}`;
  } else {
    fullMessage = question;
  }

  const answer = await sendAndWaitForResponse(conversationId, fullMessage);
  return { answer };
}

/**
 * Diagnose a problem using knowledge base + Botpress
 */
async function diagnose(problemDescription, context = {}) {
  // Guard: only diagnose Unreal Engine related problems
  if (!isUnrealRelated(problemDescription, context)) {
    return { answer: OFF_TOPIC_RESPONSE, classification: [] };
  }

  const kbContext = enrichWithKnowledge(problemDescription);

  // Also classify the problem for targeted search
  const classification = knowledge.classifyQuery(problemDescription);
  let classificationText = '';
  if (classification.length > 0) {
    classificationText = `\n[PROBLEM CLASSIFICATION]\n`;
    classificationText += `Most likely categories: ${classification.slice(0, 3).map(c => c.category).join(', ')}\n`;

    // Do a targeted search in the top category
    const targeted = knowledge.search(problemDescription, {
      source: 'troubleshooting',
      category: classification[0].category,
      limit: 3,
    });
    if (targeted.length > 0) {
      classificationText += '\nBest matching troubleshooting entries:\n';
      for (const entry of targeted) {
        classificationText += `  - [${entry.id}] ${entry.title} (score: ${entry.relevanceScore})\n`;
      }
    }
  }

  const contextText = buildContextText(context);

  let fullMessage = `[DIAGNOSTIC REQUEST]\n`;
  fullMessage += `Problem: ${problemDescription}\n`;
  if (contextText) fullMessage += `\n[PROJECT CONTEXT]\n${contextText}\n`;
  if (kbContext) fullMessage += kbContext;
  if (classificationText) fullMessage += classificationText;
  fullMessage += `\nPlease diagnose this issue and provide step-by-step guidance to fix it.`;

  const conversationId = await getConversation();
  const answer = await sendAndWaitForResponse(conversationId, fullMessage);

  return {
    answer,
    classification: classification.slice(0, 3),
  };
}

/**
 * Review code and suggest improvements
 */
async function reviewCode(code, language, context) {
  const reviewPrompt = `Review the following ${language} code from an Unreal Engine project. Focus on:
1. Unreal Engine best practices (proper use of macros, memory management, etc.)
2. Performance concerns (unnecessary Tick usage, expensive operations, etc.)
3. Potential bugs or common Unreal pitfalls
4. Idiomatic Unreal patterns that could simplify the code
5. If the code works but there's a more standard Unreal approach, mention it as a suggestion (not as an error)

Be constructive - acknowledge what's done well, then suggest improvements.

\`\`\`${language}
${code}
\`\`\``;

  return ask(reviewPrompt, context);
}

/**
 * Explain what a class does in the context of Unreal Engine
 */
async function explainClass(className, context) {
  return ask(
    `Explain the class "${className}" - what it does, what Unreal systems it uses, and how it fits into the project architecture. If it inherits from an Unreal base class, explain what that base class provides.`,
    context
  );
}

/**
 * Suggest improvements for a blueprint
 */
async function reviewBlueprint(blueprintData, context) {
  const augmentedContext = { ...context, blueprintData };
  return ask(
    `Review this blueprint and suggest improvements. Consider: performance, readability, whether any logic should be moved to C++, and if there are simpler ways to achieve the same result.`,
    augmentedContext
  );
}

module.exports = {
  ask,
  diagnose,
  reviewCode,
  explainClass,
  reviewBlueprint,
};
