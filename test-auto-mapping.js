const { calculateSimilarity } = require('./src/components/scraper/FieldMappingUI/utils/similarity.ts');

// Test data
const targetFields = [
  { name: 'vehicle_name', type: 'string', required: true },
  { name: 'price_amount', type: 'number', required: false },
  { name: 'manufacturer_brand', type: 'string', required: true }
];

const sourceFields = [
  'carName',
  'amount',
  'brandName',
  'vehiclePrice',
  'make'
];

console.log('Testing auto-mapping similarity calculations...');
console.log('Target fields:', targetFields);
console.log('Source fields:', sourceFields);

targetFields.forEach(target => {
  console.log(`\n--- Testing target field: ${target.name} ---`);
  let bestMatch = null;
  let highestScore = -1;

  sourceFields.forEach(source => {
    const score = calculateSimilarity(target.name, source);
    if (score > highestScore) {
      highestScore = score;
      bestMatch = source;
    }
    console.log(`  ${source} -> similarity: ${score.toFixed(3)}`);
  });

  console.log(`Best match for "${target.name}": "${bestMatch}" with score ${highestScore.toFixed(3)}`);
});