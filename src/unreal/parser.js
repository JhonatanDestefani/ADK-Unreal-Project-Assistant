const fs = require('fs');
const path = require('path');

/**
 * Create fresh regex instances for each parse call.
 * Using /g regexes as shared constants is unsafe — they retain lastIndex
 * between calls, causing intermittent missed matches.
 */
function createPatterns() {
  return {
    uclass: /UCLASS\(([^)]*)\)\s*class\s+\w+_API\s+(\w+)\s*:\s*public\s+(\w+)/g,
    uclassSimple: /UCLASS\(([^)]*)\)\s*class\s+(\w+)\s*:\s*public\s+(\w+)/g,
    ustruct: /USTRUCT\(([^)]*)\)\s*struct\s+(?:\w+_API\s+)?(\w+)/g,
    uenum: /UENUM\(([^)]*)\)\s*enum\s+(?:class\s+)?(\w+)/g,
    uproperty: /UPROPERTY\(([^)]*)\)\s*([\w<>,\s*&]+)\s+(\w+)/g,
    ufunction: /UFUNCTION\(([^)]*)\)\s*([\w<>,\s*&]+)\s+(\w+)\s*\(([^)]*)\)/g,
    includes: /#include\s+["<]([^">]+)[">]/g,
    generated: /GENERATED_BODY\(\)|GENERATED_UCLASS_BODY\(\)/g,
    forwardDecl: /class\s+(\w+);/g,
  };
}

/**
 * Parse a single C++ header file and extract Unreal Engine class information
 */
function parseHeader(filePath, content) {
  const PATTERNS = createPatterns();
  const result = {
    filePath,
    fileName: path.basename(filePath),
    classes: [],
    structs: [],
    enums: [],
    includes: [],
    forwardDeclarations: [],
  };

  // Extract includes
  let match;
  while ((match = PATTERNS.includes.exec(content)) !== null) {
    result.includes.push(match[1]);
  }

  // Extract forward declarations
  while ((match = PATTERNS.forwardDecl.exec(content)) !== null) {
    result.forwardDeclarations.push(match[1]);
  }

  // Extract UCLASS declarations (with API macro)
  for (const pattern of [PATTERNS.uclass, PATTERNS.uclassSimple]) {
    while ((match = pattern.exec(content)) !== null) {
      const classInfo = {
        specifiers: match[1].trim(),
        name: match[2],
        parent: match[3],
        properties: [],
        functions: [],
      };
      result.classes.push(classInfo);
    }
  }

  // Deduplicate classes by name
  const seen = new Set();
  result.classes = result.classes.filter(c => {
    if (seen.has(c.name)) return false;
    seen.add(c.name);
    return true;
  });

  // Extract USTRUCT
  while ((match = PATTERNS.ustruct.exec(content)) !== null) {
    result.structs.push({
      specifiers: match[1].trim(),
      name: match[2],
    });
  }

  // Extract UENUM
  while ((match = PATTERNS.uenum.exec(content)) !== null) {
    result.enums.push({
      specifiers: match[1].trim(),
      name: match[2],
    });
  }

  // Pre-compute class positions once so we don't rebuild regexes per property/function
  const classPositions = result.classes.map(cls => {
    const classPattern = new RegExp(`class\\s+(?:\\w+_API\\s+)?${cls.name}\\b`);
    const classMatch = classPattern.exec(content);
    return { cls, pos: classMatch ? classMatch.index : -1 };
  }).filter(cp => cp.pos >= 0);

  // Extract UPROPERTY - associate with nearest class
  while ((match = PATTERNS.uproperty.exec(content)) !== null) {
    const prop = {
      specifiers: match[1].trim(),
      type: match[2].trim(),
      name: match[3],
    };
    const ownerClass = findOwnerClassFromPositions(match.index, classPositions);
    if (ownerClass) {
      ownerClass.properties.push(prop);
    }
  }

  // Extract UFUNCTION - associate with nearest class
  while ((match = PATTERNS.ufunction.exec(content)) !== null) {
    const func = {
      specifiers: match[1].trim(),
      returnType: match[2].trim(),
      name: match[3],
      params: match[4].trim(),
    };
    const ownerClass = findOwnerClassFromPositions(match.index, classPositions);
    if (ownerClass) {
      ownerClass.functions.push(func);
    }
  }

  return result;
}

/**
 * Find which class a property/function belongs to using pre-computed positions
 */
function findOwnerClassFromPositions(position, classPositions) {
  let bestClass = null;
  let bestPos = -1;

  for (const { cls, pos } of classPositions) {
    if (pos < position && pos > bestPos) {
      bestPos = pos;
      bestClass = cls;
    }
  }

  return bestClass;
}

/**
 * Parse a .cpp implementation file to extract function bodies
 */
function parseSource(filePath, content) {
  const PATTERNS = createPatterns();
  const result = {
    filePath,
    fileName: path.basename(filePath),
    includes: [],
    functionBodies: [],
  };

  let match;
  while ((match = PATTERNS.includes.exec(content)) !== null) {
    result.includes.push(match[1]);
  }

  // Extract function implementations (ClassName::FunctionName pattern)
  // Handles multi-word return types like: const FVector&, TArray<AActor*>,
  // virtual void, static bool, unsigned int, etc.
  const implPattern = /([\w\s<>,*&:]+?)\s+(\w+)::(\w+)\s*\(([^)]*)\)\s*(?:const\s*)?\{/g;
  while ((match = implPattern.exec(content)) !== null) {
    const returnType = match[1].trim();
    // Skip false positives like if/while/for/switch statements
    if (/^(if|else|while|for|switch|return|class|struct|enum|namespace)$/.test(returnType)) continue;

    const startBrace = content.indexOf('{', match.index + match[0].length - 1);
    const body = extractBraceBlock(content, startBrace);
    result.functionBodies.push({
      returnType,
      className: match[2],
      functionName: match[3],
      params: match[4].trim(),
      body: body,
    });
  }

  return result;
}

/**
 * Extract content within matching braces
 */
function extractBraceBlock(content, startIndex) {
  let depth = 0;
  let i = startIndex;

  while (i < content.length) {
    if (content[i] === '{') depth++;
    else if (content[i] === '}') {
      depth--;
      if (depth === 0) {
        return content.substring(startIndex, i + 1);
      }
    }
    i++;
  }

  return content.substring(startIndex, Math.min(startIndex + 500, content.length));
}

/**
 * Scan an Unreal project directory for all C++ source files
 */
function scanProjectFiles(projectPath) {
  const sourcePath = path.join(projectPath, 'Source');
  const files = { headers: [], sources: [] };

  if (!fs.existsSync(sourcePath)) {
    return files;
  }

  function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        // Skip intermediate/generated directories
        if (entry.name === 'Intermediate' || entry.name === 'Binaries') continue;
        walk(fullPath);
      } else if (entry.name.endsWith('.h')) {
        files.headers.push(fullPath);
      } else if (entry.name.endsWith('.cpp')) {
        files.sources.push(fullPath);
      }
    }
  }

  walk(sourcePath);
  return files;
}

/**
 * Parse all C++ files in a project and return a complete project map
 */
function parseProject(projectPath) {
  const files = scanProjectFiles(projectPath);
  const project = {
    projectPath,
    headers: [],
    sources: [],
    classMap: new Map(),
  };

  for (const headerPath of files.headers) {
    const content = fs.readFileSync(headerPath, 'utf-8');
    const parsed = parseHeader(headerPath, content);
    project.headers.push(parsed);

    for (const cls of parsed.classes) {
      project.classMap.set(cls.name, {
        ...cls,
        headerFile: headerPath,
        sourceFile: null,
      });
    }
  }

  for (const sourcePath of files.sources) {
    const content = fs.readFileSync(sourcePath, 'utf-8');
    const parsed = parseSource(sourcePath, content);
    project.sources.push(parsed);

    // Link implementations to class definitions
    for (const func of parsed.functionBodies) {
      const cls = project.classMap.get(func.className);
      if (cls && !cls.sourceFile) {
        cls.sourceFile = sourcePath;
      }
    }
  }

  return project;
}

/**
 * Get the raw content of a specific file
 */
function readFileContent(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, 'utf-8');
}

module.exports = {
  parseHeader,
  parseSource,
  scanProjectFiles,
  parseProject,
  readFileContent,
  extractBraceBlock,
};
