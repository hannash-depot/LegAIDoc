async function main() {
  const apiKey = 'AIzaSyDjot6ZOC_FQfCg49rksdbshK5b_L2SIEA';
  console.log('Testing with API key:', apiKey);

  try {
    const modelsResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=\${apiKey}`,
    );
    const data = await modelsResponse.json();

    if (data.models) {
      console.log('Available models:');
      for (const m of data.models) {
        if (m.supportedGenerationMethods.includes('generateContent') && m.name.includes('gemini')) {
          console.log(`- \${m.name} (methods: \${m.supportedGenerationMethods.join(', ')})`);
        }
      }
    } else {
      console.error('Error fetching models:', data);
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

main();
