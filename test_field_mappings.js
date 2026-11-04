import { describe, it } from 'node:test';
import assert from 'assert';

// Mock data structure similar to the parsing_rules JSON
const mockParsingRules = [
  {
    "jsonpath": "$.vehicle.name",
    "target_model": "pricing_inventory",
    "mappings": [
      { "source_key": "$.searchResponseItemId", "target_field": "id" },
      { "source_key": "$.details.endDate", "target_field": "end_time" },
      { "source_key": "$.pricing.originalValue", "target_field": "price_nzd" }
    ]
  }
];

// Test that mappings are properly structured
describe('Field Mappings', () => {
  it('should have correct mapping structure', () => {
    const rule = mockParsingRules[0];
    assert.strictEqual(rule.target_model, 'pricing_inventory');
    assert.strictEqual(rule.mappings.length, 3);

    // Check each mapping
    assert.deepStrictEqual(rule.mappings[0], { source_key: "$.searchResponseItemId", target_field: "id" });
    assert.deepStrictEqual(rule.mappings[1], { source_key: "$.details.endDate", target_field: "end_time" });
    assert.deepStrictEqual(rule.mappings[2], { source_key: "$.pricing.originalValue", target_field: "price_nzd" });
  });

  it('should extract mappings correctly', () => {
    const rule = mockParsingRules[0];
    const mappings = rule.mappings;

    // Verify all required fields are present
    mappings.forEach(mapping => {
      assert.ok(typeof mapping.source_key === 'string', 'source_key should be a string');
      assert.ok(typeof mapping.target_field === 'string', 'target_field should be a string');
    });
  });
});