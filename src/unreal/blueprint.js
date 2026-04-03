const fs = require('fs');
const path = require('path');

/**
 * Blueprint analysis module.
 *
 * Unreal Blueprints are stored as .uasset binary files, which can't be
 * directly parsed by Node.js. Instead, this module works with blueprint
 * data that the Unreal Editor plugin exports as JSON before sending.
 *
 * The plugin can use UEditorUtilities or Python scripting to export
 * blueprint node graphs as structured JSON.
 *
 * Expected blueprint JSON structure from the plugin:
 * {
 *   name: "BP_MyActor",
 *   parentClass: "AActor",
 *   graphs: [
 *     {
 *       name: "EventGraph",
 *       nodes: [
 *         { type: "Event", name: "BeginPlay", pins: [...], connections: [...] },
 *         { type: "FunctionCall", name: "PrintString", pins: [...] },
 *         ...
 *       ]
 *     }
 *   ],
 *   variables: [
 *     { name: "Health", type: "float", defaultValue: "100.0", category: "Stats" },
 *     ...
 *   ],
 *   components: [
 *     { name: "RootComponent", class: "USceneComponent" },
 *     { name: "MeshComp", class: "UStaticMeshComponent" },
 *     ...
 *   ]
 * }
 */

/**
 * Analyze a blueprint structure exported as JSON from the Unreal plugin
 */
function analyzeBlueprint(blueprintData) {
  const analysis = {
    name: blueprintData.name,
    parentClass: blueprintData.parentClass,
    summary: {},
    complexity: 'low',
    suggestions: [],
  };

  // Summarize structure
  analysis.summary = {
    graphCount: blueprintData.graphs ? blueprintData.graphs.length : 0,
    totalNodes: 0,
    variableCount: blueprintData.variables ? blueprintData.variables.length : 0,
    componentCount: blueprintData.components ? blueprintData.components.length : 0,
    eventCount: 0,
    functionCallCount: 0,
    branchCount: 0,
    loopCount: 0,
  };

  if (blueprintData.graphs) {
    for (const graph of blueprintData.graphs) {
      if (!graph.nodes) continue;
      analysis.summary.totalNodes += graph.nodes.length;

      for (const node of graph.nodes) {
        if (node.type === 'Event') analysis.summary.eventCount++;
        if (node.type === 'FunctionCall') analysis.summary.functionCallCount++;
        if (node.type === 'Branch' || node.type === 'Select') analysis.summary.branchCount++;
        if (node.type === 'ForEachLoop' || node.type === 'WhileLoop' || node.type === 'ForLoop') {
          analysis.summary.loopCount++;
        }
      }
    }
  }

  // Determine complexity
  if (analysis.summary.totalNodes > 100) {
    analysis.complexity = 'high';
  } else if (analysis.summary.totalNodes > 30) {
    analysis.complexity = 'medium';
  }

  // Generate basic suggestions
  analysis.suggestions = generateBlueprintSuggestions(blueprintData, analysis);

  return analysis;
}

/**
 * Generate improvement suggestions for blueprints
 */
function generateBlueprintSuggestions(blueprintData, analysis) {
  const suggestions = [];

  // High node count suggests the blueprint might benefit from being split
  if (analysis.complexity === 'high') {
    suggestions.push({
      type: 'refactor',
      priority: 'high',
      message: 'This blueprint has a high node count. Consider breaking complex logic into functions or moving performance-critical parts to C++.',
    });
  }

  // Check for tick-heavy patterns
  if (blueprintData.graphs) {
    for (const graph of blueprintData.graphs) {
      if (!graph.nodes) continue;
      const hasTick = graph.nodes.some(n => n.name === 'Tick' || n.name === 'EventTick');
      const hasHeavyOps = graph.nodes.some(n =>
        n.name === 'GetAllActorsOfClass' ||
        n.name === 'LineTraceByChannel' ||
        n.name === 'SphereOverlapActors'
      );

      if (hasTick && hasHeavyOps) {
        suggestions.push({
          type: 'performance',
          priority: 'high',
          message: 'Expensive operations detected inside Tick. Consider using timers, event-driven patterns, or moving this logic to C++ for better performance.',
        });
      }
    }
  }

  // Check for lots of variables without categories
  if (blueprintData.variables) {
    const uncategorized = blueprintData.variables.filter(v => !v.category || v.category === 'Default');
    if (uncategorized.length > 5) {
      suggestions.push({
        type: 'organization',
        priority: 'low',
        message: `${uncategorized.length} variables lack categories. Organizing variables into categories improves readability in the Details panel.`,
      });
    }
  }

  return suggestions;
}

/**
 * Scan a project for blueprint assets (returns paths only -
 * actual data must be exported by the Unreal plugin)
 */
function findBlueprintAssets(projectPath) {
  const contentPath = path.join(projectPath, 'Content');
  const blueprints = [];

  if (!fs.existsSync(contentPath)) return blueprints;

  function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.name.endsWith('.uasset')) {
        blueprints.push({
          path: fullPath,
          relativePath: path.relative(projectPath, fullPath),
          name: path.basename(entry.name, '.uasset'),
        });
      }
    }
  }

  walk(contentPath);
  return blueprints;
}

/**
 * Format blueprint data as readable text for the AI context
 */
function blueprintToText(blueprintData) {
  const lines = [];
  lines.push(`Blueprint: ${blueprintData.name}`);
  lines.push(`Parent Class: ${blueprintData.parentClass}`);

  if (blueprintData.components && blueprintData.components.length > 0) {
    lines.push('\nComponents:');
    for (const comp of blueprintData.components) {
      lines.push(`  - ${comp.name} (${comp.class})`);
    }
  }

  if (blueprintData.variables && blueprintData.variables.length > 0) {
    lines.push('\nVariables:');
    for (const v of blueprintData.variables) {
      lines.push(`  - ${v.name}: ${v.type} = ${v.defaultValue || 'none'}`);
    }
  }

  if (blueprintData.graphs) {
    for (const graph of blueprintData.graphs) {
      lines.push(`\nGraph: ${graph.name}`);
      if (graph.nodes) {
        lines.push(`  Nodes (${graph.nodes.length}):`);
        for (const node of graph.nodes) {
          lines.push(`    [${node.type}] ${node.name}`);
        }
      }
    }
  }

  return lines.join('\n');
}

module.exports = {
  analyzeBlueprint,
  findBlueprintAssets,
  blueprintToText,
  generateBlueprintSuggestions,
};
