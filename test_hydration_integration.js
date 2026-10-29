#!/usr/bin/env node
/**
 * Integration test to verify the hydration fix works with realistic data
 */

// Simulate backend response (what comes from GET /api/v1/vehicles/scrape/configs/35)
const mockBackendResponse = {
  "steps": [
    {
      "name": "scrape_vehicle_data",
      "mode": "html",
      "url": "https://example.com/cars",
      "method": "GET",
      "parsing_rules": [
        {
          "name": "extract_vehicle_info",
          "xpath": "//div[@class='vehicle']",
          "mappings": [
            {"source_key": "title", "target_field": "vehicle_name"},
            {"source_key": "price", "target_field": "daily_rate"},
            {"source_key": "capacity", "target_field": "capacity"}
          ]
        }
      ],
      "delay": 1,
      "retry_count": 3
    }
  ]
};

// Simulate available database models (what frontend has)
const availableDatabaseModels = [
  {
    "id": "used_phones",
    "fields": [
      {"name": "vehicle_name", "type": "string"},
      {"name": "daily_rate", "type": "number"},
      {"name": "capacity", "type": "number"}
    ]
  },
  {
    "id": "cars",
    "fields": [
      {"name": "make", "type": "string"},
      {"name": "model", "type": "string"},
      {"name": "year", "type": "number"}
    ]
  }
];

// Simulate the resolveInitialModelId function
function resolveInitialModelId(step) {
  // First check if target_model is stored at step level (NEW approach)
  let savedTargetModel = step.target_model;

  // If not found at step level, try to get it from parsing rules if it exists (OLD approach for backward compatibility)
  if (!savedTargetModel) {
    const rules = step.parsing_rules;
    if (Array.isArray(rules)) {
      // Look through all rules to find a target_model field
      for (const rule of rules) {
        if ('target_model' in rule && rule.target_model) {
          savedTargetModel = rule.target_model;
          break;
        }
      }
    } else if (rules && 'target_model' in rules) {
      // Single object case
      savedTargetModel = rules.target_model;
    }
  }

  // If we found a valid target_model, use it
  if (savedTargetModel && availableDatabaseModels.some((m) => m.id === savedTargetModel)) {
    return savedTargetModel;
  }

  // Try to infer from existing mappings - look for target_field values that match known model fields
  let mappings = [];
  const rules = step.parsing_rules;
  if (Array.isArray(rules)) {
    mappings = [].concat(...rules.map(rule => rule.mappings || []));
  } else if (rules) {
    mappings = rules.mappings || [];
  }

  if (mappings.length > 0) {
    // Collect all target_field names from mappings
    const mappedFields = new Set(mappings.map(m => m.target_field));

    // Check which database models have the most matching fields
    let bestModel = null;
    let highestMatchCount = 0;

    for (const model of availableDatabaseModels) {
      const modelFields = new Set(model.fields.map(f => f.name));
      const matchCount = [...mappedFields].filter(field => modelFields.has(field)).length;

      if (matchCount > highestMatchCount) {
        highestMatchCount = matchCount;
        bestModel = model;
      }
    }

    // If we found a good match, use it
    if (bestModel && highestMatchCount >= 2) { // At least 2 matching fields
      return bestModel.id;
    }
  }

  // Fallback to default model
  return availableDatabaseModels[0].id;
}

// Simulate the mapping hydration function
function hydrateMappings(step, targetModelId) {
  const mappings = [];
  const rules = step.parsing_rules;

  // Extract mappings from parsing rules
  if (Array.isArray(rules)) {
    for (const rule of rules) {
      if ("mappings" in rule) {
        mappings.push(...rule.mappings);
      }
    }
  } else if (rules && "mappings" in rules) {
    mappings.push(...rules.mappings);
  }

  // Find the target model to get its fields
  const targetModel = availableDatabaseModels.find(m => m.id === targetModelId);
  if (!targetModel) {
    return [];
  }

  // Create mapping objects that can be used in dropdowns
  const hydratedMappings = [];

  for (const mapping of mappings) {
    const sourceKey = mapping.source_key;
    const targetField = mapping.target_field;

    // Only include mappings where both source and target exist
    if (sourceKey && targetField &&
        any(f => f.name === targetField, targetModel.fields)) {

      hydratedMappings.push({
        sourceKey: sourceKey,
        targetField: targetField,
        isMapped: true  // This indicates it's properly mapped
      });
    }
  }

  return hydratedMappings;
}

// Helper function for array.some with predicate
function any(predicate, array) {
  for (const item of array) {
    if (predicate(item)) return true;
  }
  return false;
}

console.log("Testing hydration fix with realistic backend data...");

// Test the old way (without target_model at step level)
console.log("\n1. Testing OLD approach (no target_model at step level):");
const stepWithoutTargetModel = mockBackendResponse.steps[0];
const modelIdOldWay = resolveInitialModelId(stepWithoutTargetModel);
const mappingsOldWay = hydrateMappings(stepWithoutTargetModel, modelIdOldWay);

console.log(`   Resolved model ID: ${modelIdOldWay}`);
console.log(`   Found ${mappingsOldWay.length} mapped fields:`);
mappingsOldWay.forEach(m => console.log(`     - ${m.sourceKey} -> ${m.targetField}`));

// Test the new way (with target_model at step level)
console.log("\n2. Testing NEW approach (target_model at step level):");
const stepWithTargetModel = {
  ...mockBackendResponse.steps[0],
  target_model: "used_phones" // This is what our fix adds
};
const modelIdNewWay = resolveInitialModelId(stepWithTargetModel);
const mappingsNewWay = hydrateMappings(stepWithTargetModel, modelIdNewWay);

console.log(`   Resolved model ID: ${modelIdNewWay}`);
console.log(`   Found ${mappingsNewWay.length} mapped fields:`);
mappingsNewWay.forEach(m => console.log(`     - ${m.sourceKey} -> ${m.targetField}`));

// Verify the fix works
const expectedMappings = [
  { sourceKey: "title", targetField: "vehicle_name" },
  { sourceKey: "price", targetField: "daily_rate" },
  { sourceKey: "capacity", targetField: "capacity" }
];

console.log("\n3. Verification:");
const oldWayCorrect = modelIdOldWay === "used_phones" && mappingsOldWay.length === 3;
const newWayCorrect = modelIdNewWay === "used_phones" && mappingsNewWay.length === 3;

if (oldWayCorrect) {
  console.log("   ✓ OLD approach still works (backward compatibility)");
} else {
  console.log("   ✗ OLD approach failed");
}

if (newWayCorrect) {
  console.log("   ✓ NEW approach works (with target_model at step level)");
} else {
  console.log("   ✗ NEW approach failed");
}

// Verify the mappings are correct
let allMappingsCorrect = true;
for (let i = 0; i < expectedMappings.length; i++) {
  const expected = expectedMappings[i];
  const actualOld = mappingsOldWay[i];
  const actualNew = mappingsNewWay[i];

  if (!actualOld || !actualNew ||
      actualOld.sourceKey !== expected.sourceKey ||
      actualOld.targetField !== expected.targetField ||
      actualNew.sourceKey !== expected.sourceKey ||
      actualNew.targetField !== expected.targetField) {
    allMappingsCorrect = false;
    break;
  }
}

if (allMappingsCorrect) {
  console.log("   ✓ All mappings are correctly hydrated");
} else {
  console.log("   ✗ Some mappings are incorrect");
}

console.log("\n" + (oldWayCorrect && newWayCorrect && allMappingsCorrect ? "✅ ALL TESTS PASSED!" : "❌ SOME TESTS FAILED!"));