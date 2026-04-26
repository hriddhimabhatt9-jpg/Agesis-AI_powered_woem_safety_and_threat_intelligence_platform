// Message Analysis Worker
self.onmessage = (e) => {
  const { text, language } = e.data;
  
  // Simulate heavy computation
  const start = Date.now();
  while (Date.now() - start < 500) {
    // Artificial delay for UI worker demonstration
  }

  const results = analyze(text, language);
  self.postMessage(results);
};

function analyze(text, language) {
  const t = text.toLowerCase();
  let threatScore = 0;
  const threats = [];

  // Patterns for different languages
  const patterns = {
    english: [
      { regex: /kill|die|hurt|attack/g, score: 40, label: 'Violence' },
      { regex: /where are you|follow|stalk/g, score: 30, label: 'Stalking' },
      { regex: /send pics|nude|private/g, score: 50, label: 'Harassment' },
    ],
    hindi: [
      { regex: /मार|जान से|पीछा/g, score: 40, label: 'Violence/Stalking' },
      { regex: /फोटो|अकेली/g, score: 30, label: 'Harassment' },
    ],
    // Add more languages as needed
  };

  const activePatterns = patterns[language] || patterns.english;

  activePatterns.forEach(p => {
    const matches = t.match(p.regex);
    if (matches) {
      threatScore += p.score * matches.length;
      threats.push({ type: p.label, count: matches.length });
    }
  });

  return {
    score: Math.min(threatScore, 100),
    threats,
    isSafe: threatScore < 30
  };
}
