/**
 * Test script for Portfolio Document Generation
 * 
 * This script tests the document generation layer to ensure
 * all portfolio data is properly formatted for the RAG system.
 * 
 * Run with: node tests/testDocumentGeneration.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const {
  createPortfolioDocuments,
  getPortfolioStats
} = require('../utils/portfolioDocumentGenerator');

// Load environment variables
dotenv.config();

// Sample questions the RAG system should be able to answer
const SAMPLE_QUESTIONS = [
  "Tell me about Sanket.",
  "What is Sanket's educational background?",
  "Where has Sanket worked?",
  "What internships has Sanket completed?",
  "What projects has Sanket built?",
  "Tell me about ShoeHub.",
  "What technologies does Sanket know?",
  "What certifications does Sanket have?",
  "What is Sanket's CGPA?",
  "Which projects use MERN?",
  "What programming languages does Sanket know?",
  "Tell me about Sanket's experience at Regex Technologies.",
  "What is Sanket's current education status?",
  "What are Sanket's soft skills?",
  "List Sanket's frontend skills.",
  "What databases does Sanket work with?",
  "Tell me about Sanket's Oracle certification.",
  "How many internships has Sanket completed?",
  "What year was ShoeHub built?"
];

async function testDocumentGeneration() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('   PORTFOLIO DOCUMENT GENERATION TEST');
  console.log('═══════════════════════════════════════════════════════\n');

  try {
    // Connect to MongoDB
    console.log('📊 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected\n');

    // Get portfolio statistics
    console.log('📈 Portfolio Statistics:');
    console.log('─────────────────────────────────────────────────────');
    const stats = await getPortfolioStats();
    console.log(`  Profile Documents:        ${stats.profile}`);
    console.log(`  Education Documents:      ${stats.education}`);
    console.log(`  Project Documents:        ${stats.projects}`);
    console.log(`  Experience Documents:     ${stats.experience}`);
    console.log(`  Skill Documents:          ${stats.skills}`);
    console.log(`  Certification Documents:  ${stats.certifications}`);
    console.log(`  ─────────────────────────────────`);
    console.log(`  TOTAL:                    ${stats.total}`);
    console.log('');

    // Generate all documents
    console.log('🔄 Generating portfolio documents...\n');
    const documents = await createPortfolioDocuments();
    console.log('');

    // Display document breakdown
    console.log('📋 Document Breakdown:');
    console.log('─────────────────────────────────────────────────────');
    
    const docsByType = documents.reduce((acc, doc) => {
      const type = doc.metadata.type;
      if (!acc[type]) acc[type] = [];
      acc[type].push(doc);
      return acc;
    }, {});

    Object.entries(docsByType).forEach(([type, docs]) => {
      console.log(`\n  ${type.toUpperCase()} (${docs.length} documents):`);
      docs.forEach(doc => {
        const title = doc.metadata.title || doc.metadata.name || doc.metadata.company || doc.metadata.degree || doc.metadata.category || 'N/A';
        console.log(`    - ${title}`);
      });
    });

    console.log('\n');

    // Sample document previews
    console.log('📄 Sample Document Previews:');
    console.log('═══════════════════════════════════════════════════════\n');

    // Show first profile document
    const profileDoc = documents.find(d => d.metadata.type === 'profile');
    if (profileDoc) {
      console.log('─── PROFILE DOCUMENT ───');
      console.log(profileDoc.content);
      console.log('\nMetadata:', JSON.stringify(profileDoc.metadata, null, 2));
      console.log('');
    }

    // Show first education document
    const educationDoc = documents.find(d => d.metadata.type === 'education');
    if (educationDoc) {
      console.log('─── EDUCATION DOCUMENT ───');
      console.log(educationDoc.content);
      console.log('\nMetadata:', JSON.stringify(educationDoc.metadata, null, 2));
      console.log('');
    }

    // Show first project document
    const projectDoc = documents.find(d => d.metadata.type === 'project');
    if (projectDoc) {
      console.log('─── PROJECT DOCUMENT ───');
      console.log(projectDoc.content);
      console.log('\nMetadata:', JSON.stringify(projectDoc.metadata, null, 2));
      console.log('');
    }

    // Show first experience document
    const experienceDoc = documents.find(d => d.metadata.type === 'experience');
    if (experienceDoc) {
      console.log('─── EXPERIENCE DOCUMENT ───');
      console.log(experienceDoc.content);
      console.log('\nMetadata:', JSON.stringify(experienceDoc.metadata, null, 2));
      console.log('');
    }

    // Show first skill document
    const skillDoc = documents.find(d => d.metadata.type === 'skill');
    if (skillDoc) {
      console.log('─── SKILL DOCUMENT ───');
      console.log(skillDoc.content);
      console.log('\nMetadata:', JSON.stringify(skillDoc.metadata, null, 2));
      console.log('');
    }

    // Show first certification document
    const certificationDoc = documents.find(d => d.metadata.type === 'certification');
    if (certificationDoc) {
      console.log('─── CERTIFICATION DOCUMENT ───');
      console.log(certificationDoc.content);
      console.log('\nMetadata:', JSON.stringify(certificationDoc.metadata, null, 2));
      console.log('');
    }

    // Data coverage analysis
    console.log('═══════════════════════════════════════════════════════');
    console.log('   DATA COVERAGE ANALYSIS');
    console.log('═══════════════════════════════════════════════════════\n');

    console.log('Sample questions the RAG system should answer:\n');
    SAMPLE_QUESTIONS.forEach((question, idx) => {
      console.log(`  ${idx + 1}. ${question}`);
    });

    console.log('\n📊 Coverage Check:');
    console.log('─────────────────────────────────────────────────────');
    
    const allContent = documents.map(d => d.content.toLowerCase()).join(' ');
    
    const keywords = {
      'Name (Sanket)': ['sanket', 'bhujbal'],
      'Education (CGPA)': ['cgpa', '8.52'],
      'Education (Diploma)': ['diploma', '88.00%'],
      'Internships': ['regex', 'cloudregex', 'internship'],
      'Projects': ['project', 'mern', 'react'],
      'Technologies': ['javascript', 'node.js', 'mongodb'],
      'Certifications': ['certification', 'oracle', 'nptel'],
      'Skills': ['java', 'python', 'frontend', 'backend'],
      'Soft Skills': ['communication', 'problem solving']
    };

    Object.entries(keywords).forEach(([category, terms]) => {
      const found = terms.some(term => allContent.includes(term.toLowerCase()));
      const status = found ? '✅' : '❌';
      console.log(`  ${status} ${category}: ${found ? 'Found' : 'Missing'}`);
    });

    console.log('\n');

    // Document structure validation
    console.log('📋 Document Structure Validation:');
    console.log('─────────────────────────────────────────────────────');
    
    const validationResults = {
      allHaveIds: documents.every(d => d.id && d.id.length > 0),
      allHaveContent: documents.every(d => d.content && d.content.length > 0),
      allHaveMetadata: documents.every(d => d.metadata && typeof d.metadata === 'object'),
      allHaveType: documents.every(d => d.metadata && d.metadata.type),
      uniqueIds: new Set(documents.map(d => d.id)).size === documents.length
    };

    console.log(`  ✓ All documents have IDs:         ${validationResults.allHaveIds ? 'PASS' : 'FAIL'}`);
    console.log(`  ✓ All documents have content:     ${validationResults.allHaveContent ? 'PASS' : 'FAIL'}`);
    console.log(`  ✓ All documents have metadata:    ${validationResults.allHaveMetadata ? 'PASS' : 'FAIL'}`);
    console.log(`  ✓ All documents have type:        ${validationResults.allHaveType ? 'PASS' : 'FAIL'}`);
    console.log(`  ✓ All IDs are unique:             ${validationResults.uniqueIds ? 'PASS' : 'FAIL'}`);

    const allValidationsPassed = Object.values(validationResults).every(v => v === true);

    console.log('\n');
    console.log('═══════════════════════════════════════════════════════');
    if (allValidationsPassed) {
      console.log('   ✅ ALL TESTS PASSED');
    } else {
      console.log('   ❌ SOME TESTS FAILED');
    }
    console.log('═══════════════════════════════════════════════════════\n');

    // Summary
    console.log('📝 Summary:');
    console.log('─────────────────────────────────────────────────────');
    console.log(`  Total documents generated:  ${documents.length}`);
    console.log(`  Average content length:     ${Math.round(documents.reduce((sum, d) => sum + d.content.length, 0) / documents.length)} characters`);
    console.log(`  Document types:             ${Object.keys(docsByType).length}`);
    console.log(`  Validation status:          ${allValidationsPassed ? '✅ PASS' : '❌ FAIL'}`);
    console.log('');

    console.log('✅ Document generation test completed successfully!\n');

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('📊 MongoDB connection closed');
    process.exit(0);
  }
}

// Run the test
testDocumentGeneration();
