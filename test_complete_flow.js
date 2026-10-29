/**
 * Test script to verify the complete flow including deduplication and backward compatibility
 */

// Mock data similar to what would come from the API
const mockStep = {
  parsing_rules: {
    mappings: [
      { source_key: "$.searchResults[0].vehicle.name", target_field: "vehicle_name" },
      { source_key: "$.searchResults[1].vehicle.name", target_field: "vehicle_name" }, // duplicate path
      { source_key: "$.searchResults[*].daily_rate", target_field: "daily_rate" },
      { source_key: "$.searchResults[*].capacity", target_field: "capacity" }
    ]
  }
};

// Mock database models
const availableDatabaseModels = [
  {
    id: "used_phones",
    name: "二手手机模型",
    description: "用于存储二手手机信息的数据库表"
  },
  {
    id: "vehicles",
    name: "车辆模型",
    description: "用于存储车辆信息的数据库表"
  }
];

// Test the complete flow
function testCompleteFlow() {
  console.log("Testing complete flow...");

  // Step 1: Parse JSON response and create source fields with deduplication
  const { sourceFields, keyMapping } = parseJsonResponse(mockStep.parsing_rules.mappings);
  console.log("\nSource fields after parsing:");
  console.log(sourceFields.map(sf => sf.key));

  console.log("\nKey mapping for backward compatibility:");
  console.log(keyMapping);

  // Step 2: Verify deduplication worked correctly
  const uniqueKeys = [...new Set(sourceFields.map(sf => sf.key))];
  console.log("\nUnique keys after deduplication:", uniqueKeys);
  console.log("Expected count: 3, Actual count:", uniqueKeys.length);

  // Step 3: Test selectedSource function with backward compatibility
  const state = {
    keyMapping: keyMapping,
    sourceFields: sourceFields
  };

  // Test cases for selectedSource
  const testCases = [
    { originalKey: "$.searchResults[0].vehicle.name", expected: "$.searchResults.vehicle.name" },
    { originalKey: "$.searchResults[1].vehicle.name", expected: "$.searchResults.vehicle.name" },
    { originalKey: "$.searchResults[*].daily_rate", expected: "$.searchResults.daily_rate" }
  ];

  console.log("\nTesting selectedSource function:");
  testCases.forEach(testCase => {
    const result = state.keyMapping[testCase.originalKey];
    const passed = result === testCase.expected;
    console.log(`  ${testCase.originalKey} -> ${result} (expected: ${testCase.expected}) ${passed ? '✓' : '✗'}`);
  });

  // Step 4: Verify target model selection
  const targetModelId = "vehicles"; // This would come from the API response
  console.log(`\nTarget database model ID: ${targetModelId}`);

  const targetModel = availableDatabaseModels.find(m => m.id === targetModelId);
  console.log("Target database model:", targetModel ? targetModel.name : "Not found");

  return {
    success: uniqueKeys.length === 3 && testCases.every(tc =>
      state.keyMapping[tc.originalKey] === tc.expected
    ),
    sourceFields,
    keyMapping,
    targetModel
  };
}

// Simulate the parseJsonResponse function logic
function parseJsonResponse(mappings) {
  const seen = new Map(); // cleanedPath -> { originalKeys: string[], dataType: string }
  const keyMapping = {};

  mappings.forEach(mapping => {
    const cleanedPath = cleanPath(mapping.source_key);

    if (!seen.has(cleanedPath)) {
      seen.set(cleanedPath, { originalKeys: [], dataType: getDataTypeFromPath(cleanedPath) });
    }

    const entry = seen.get(cleanedPath);
    entry.originalKeys.push(mapping.source_key);

    // Map all original keys to the cleaned path
    mapping.source_key.split(',').forEach(originalKey => {
      keyMapping[originalKey.trim()] = cleanedPath;
    });
  });

  // Create source fields from unique paths
  const sourceFields = Array.from(seen.entries()).map(([cleanedPath, entry]) => ({
    key: cleanedPath,
    label: extractLabelFromPath(cleanedPath),
    type: entry.dataType || 'string'
  }));

  return { sourceFields, keyMapping };
}

function cleanPath(path) {
  return path.replace(/\[\d+\]/g, "")
             .replace(/\[\*\]/g, "")
             .replace(/\.{2,}/g, ".")
             .replace(/^\.+|\.+$/g, "");
}

function getDataTypeFromPath(path) {
  // Simple heuristic - extract the last part of the path
  const parts = path.split('.');
  if (parts.length > 0) {
    return parts[parts.length - 1];
  }
  return 'unknown';
}

function extractLabelFromPath(path) {
  // Extract the last meaningful part for display
  const cleaned = cleanPath(path);
  const parts = cleaned.split('.').filter(p => p !== '');
  if (parts.length > 0) {
    return parts[parts.length - 1];
  }
  return path;
}

// Run the test
const result = testCompleteFlow();
console.log("\n" + "=".repeat(50));
console.log("OVERALL TEST RESULT:", result.success ? "PASSED ✓" : "FAILED ✗");
console.log("=" .repeat(50));

if (!result.success) {
  console.log("Issues found:");
  if (uniqueKeys.length !== 3) {
    console.log(`  - Expected 3 unique keys, got ${uniqueKeys.length}`);
  }
  testCases.forEach((tc, i) => {
    const actual = state.keyMapping[tc.originalKey];
    if (actual !== tc.expected) {
      console.log(`  - Key mapping failed for: ${tc.originalKey}`);
    }
  });
}