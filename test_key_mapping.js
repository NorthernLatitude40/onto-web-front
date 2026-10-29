/**
 * Test script to verify the key mapping functionality
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

// Expected cleaned paths after deduplication
const expectedCleanedPaths = [
  "$.searchResults.vehicle.name",
  "$.searchResults.daily_rate",
  "$.searchResults.capacity"
];

// Expected key mapping for backward compatibility
const expectedKeyMapping = {
  "$.searchResults[0].vehicle.name": "$.searchResults.vehicle.name",
  "$.searchResults[1].vehicle.name": "$.searchResults.vehicle.name", // both map to same cleaned path
  "$.searchResults[*].daily_rate": "$.searchResults.daily_rate",
  "$.searchResults[*].capacity": "$.searchResults.capacity"
};

// Test the cleaning logic
function cleanPath(path) {
  return path.replace(/\[\d+\]/g, "")
             .replace(/\[\*\]/g, "")
             .replace(/\.{2,}/g, ".")
             .replace(/^\.+|\.+$/g, "");
}

// Test deduplication and key mapping creation
function createKeyMapping(mappings) {
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

  return { keyMapping, uniquePaths: Array.from(seen.keys()) };
}

function getDataTypeFromPath(path) {
  // Simple heuristic - extract the last part of the path
  const parts = path.split('.');
  if (parts.length > 0) {
    return parts[parts.length - 1];
  }
  return 'unknown';
}

// Run tests
console.log("Testing key mapping functionality...");
console.log("Original mappings:", mockStep.parsing_rules.mappings);

const result = createKeyMapping(mockStep.parsing_rules.mappings);
console.log("\nGenerated key mapping:");
console.log(result.keyMapping);

console.log("\nUnique cleaned paths:");
console.log(result.uniquePaths);

console.log("\nExpected key mapping:");
console.log(expectedKeyMapping);

console.log("\nTest passed:", JSON.stringify(result.keyMapping) === JSON.stringify(expectedKeyMapping));