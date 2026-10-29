/**
 * Calculate string similarity using Levenshtein distance
 */
function calculateSimilarity(str1, str2) {
  const len1 = str1.length;
  const len2 = str2.length;

  // Create a matrix to store distances
  const matrix = Array(len1 + 1).fill().map(() => Array(len2 + 1).fill(0));

  // Initialize the matrix
  for (let i = 0; i <= len1; i++) {
    matrix[i][0] = i;
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // Fill the matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  const maxLen = Math.max(len1, len2);
  return maxLen === 0 ? 1 : (maxLen - matrix[len1][len2]) / maxLen;
}

/**
 * Normalize field names for better matching
 */
function normalizeFieldName(name) {
  // Convert to lowercase and remove special characters
  let normalized = name.toLowerCase().replace(/[^a-z0-9]/g, '');

  // Handle camelCase by inserting spaces before capital letters
  const camelCaseNormalized = name.replace(/([A-Z])/g, ' $1').toLowerCase();

  return {
    original: name,
    simple: normalized,
    camelCase: camelCaseNormalized.trim()
  };
}

/**
 * Find best match for target field among source fields
 */
function findBestMatch(targetFieldName, sourceFields) {
  const targetNorm = normalizeFieldName(targetFieldName);
  let bestMatch = null;
  let highestScore = -1;

  sourceFields.forEach(source => {
    const sourceNorm = normalizeFieldName(source.key || source);

    // Test different normalization strategies
    const scores = [
      calculateSimilarity(targetNorm.simple, sourceNorm.simple),
      calculateSimilarity(targetNorm.camelCase, sourceNorm.camelCase)
    ];

    const maxScore = Math.max(...scores);
    if (maxScore > highestScore) {
      highestScore = maxScore;
      bestMatch = source.key || source;
    }
  });

  return { field: bestMatch, score: highestScore };
}

// Test data from the HTML file
const targetFields = [
  { name: 'model_name', displayName: 'Model Name', type: 'string', required: true },
  { name: 'vehicle_year', displayName: 'Year', type: 'number', required: false },
  { name: 'price_usd', displayName: 'Price (USD)', type: 'number', required: true }
];

const sourceFields = [
  { key: 'vehicle.name', displayName: 'Vehicle Name', type: 'string' },
  { key: 'vehicle.model', displayName: 'Vehicle Model', type: 'string' },
  { key: 'vehicle.year', displayName: 'Year', type: 'number' },
  { key: 'price', displayName: 'Price', type: 'number' }
];

console.log('Testing auto-mapping similarity calculations...');
console.log('Target fields:', targetFields.map(f => f.name));
console.log('Source fields:', sourceFields.map(s => s.key));

targetFields.forEach(target => {
  console.log(`\n--- Testing target field: ${target.name} ---`);
  const result = findBestMatch(target.name, sourceFields);
  console.log(`Best match: "${result.field}" with score ${result.score.toFixed(3)}`);

  // Show detailed similarity scores
  sourceFields.forEach(source => {
    const sourceNorm = normalizeFieldName(source.key);
    const targetNorm = normalizeFieldName(target.name);
    const simpleScore = calculateSimilarity(targetNorm.simple, sourceNorm.simple);
    const camelScore = calculateSimilarity(targetNorm.camelCase, sourceNorm.camelCase);

    console.log(`  ${source.key}: simple=${simpleScore.toFixed(3)}, camel=${camelScore.toFixed(3)}`);
  });
});

// Test the auto-mapping logic
console.log('\n=== Auto-Mapping Results ===');
const mappings = targetFields.map(target => {
  const result = findBestMatch(target.name, sourceFields);
  return {
    target_field: target.name,
    source_key: result.field,
    score: result.score,
    is_custom: false
  };
});

console.log('Generated mappings:', JSON.stringify(mappings, null, 2));