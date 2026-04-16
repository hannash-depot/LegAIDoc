import 'dotenv/config';
import { parseDocumentWithLlm } from './src/lib/ai/llm-parser';

const sampleText = `
הסכם שכירות מוגן
נערך ונחתם ביום 12 בחודש מאי שנת 2024

בין: עמותת ידידי בית החולים בע"מ (ע"ר) ח.פ. 580123456
לבין: ישראל ישראלי ת.ז. 012345678

1. המשכיר מסכים להשכיר לשוכר את הנכס בסך 5,000 ש"ח לחודש.
2. השוכר מצהיר כי ראה את הנכס והוא מתאים לצרכיו.
`;

async function main() {
  console.log('Testing parseDocumentWithLlm with Gemini...');
  try {
    const result = await parseDocumentWithLlm(sampleText, 'gemini', process.env.GOOGLE_AI_API_KEY);
    console.log('Errors:', result.errors);
    console.log('Confidence:', result.confidence);
    if (!result.definition) {
      console.log('Parse Failed. Check logs above if console.error fired.');
    } else {
      console.log(
        'Parse Succeeded! Definition object has keys:',
        Object.keys(result.definition as object),
      );
    }
  } catch (err) {
    console.error('Test script runtime error:', err);
  }
}

main();
