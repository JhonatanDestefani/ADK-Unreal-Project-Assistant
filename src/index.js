require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });

const express = require('express');
const analyzeRoutes = require('./routes/analyze');
const diagnoseRoutes = require('./routes/diagnose');
const knowledge = require('./knowledge');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// Preload knowledge base on startup
knowledge.loadKnowledgeBase();
const stats = knowledge.getStats();
console.log(`Knowledge Base loaded:`);
console.log(`  Engine Reference: ${stats.engineReference.categories} categories, ${stats.engineReference.totalEntries} entries`);
console.log(`  Troubleshooting: ${stats.troubleshooting.categories} categories, ${stats.troubleshooting.totalEntries} entries`);

// Health check
app.get('/', (req, res) => {
  res.json({
    status: 'running',
    name: 'Unreal Guide',
    knowledgeBase: knowledge.getStats(),
  });
});

// API routes
app.use('/api', analyzeRoutes);
app.use('/api', diagnoseRoutes);

app.listen(PORT, () => {
  console.log(`Unreal Guide running on port ${PORT}`);
});
