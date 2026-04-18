require('dotenv').config({ path: 'c:/RuralHealthConnect/backend/.env' });
const { generateDailyAwareness } = require('c:/RuralHealthConnect/backend/utils/aiHelper.js');

(async () => {
  try {
    console.log("Calling generateDailyAwareness...");
    const result = await generateDailyAwareness('English', 'Fever');
    console.log("Success:", result);
  } catch (err) {
    console.error("Caught exact error:", err);
  }
})();
