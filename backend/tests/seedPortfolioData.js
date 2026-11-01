/**
 * Seed Portfolio Data
 * 
 * This script adds sample Experience and Skills data to the database
 * for testing the document generation and RAG system.
 * 
 * Run with: node tests/seedPortfolioData.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Experience = require('../models/Experience');
const Skill = require('../models/Skill');

dotenv.config();

async function seedData() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('   SEEDING PORTFOLIO DATA');
  console.log('═══════════════════════════════════════════════════════\n');

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected\n');

    // Experience data based on your About.jsx profile
    const experiences = [
      {
        company: 'Regex Technologies Pvt. Ltd.',
        position: 'Junior Software Developer',
        startDate: new Date('2023-06-01'),
        endDate: new Date('2023-08-31'),
        current: false,
        location: 'Pune, Maharashtra',
        description: 'Worked on web development projects, building RESTful APIs and implementing authentication systems.',
        responsibilities: [
          'Developed web applications using modern frameworks',
          'Built RESTful APIs for backend services',
          'Implemented authentication and authorization systems',
          'Collaborated with team on debugging and code optimization',
          'Participated in code reviews and testing'
        ],
        technologies: [
          'JavaScript',
          'Node.js',
          'Express.js',
          'MySQL',
          'REST API',
          'Git'
        ],
        order: 1
      },
      {
        company: 'CloudRegex InfoTech Pvt. Ltd.',
        position: 'Software Development Intern',
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-05-31'),
        current: false,
        location: 'Remote',
        description: 'Contributed to full-stack development projects with focus on database management and API development.',
        responsibilities: [
          'Developed database schemas and queries',
          'Built backend APIs for web applications',
          'Implemented JWT-based authentication',
          'Worked on frontend integration with backend services',
          'Debugged and resolved production issues'
        ],
        technologies: [
          'React.js',
          'Node.js',
          'Express.js',
          'MongoDB',
          'JWT',
          'REST API',
          'Git'
        ],
        order: 2
      }
    ];

    console.log('📝 Seeding Experience data...');
    const existingExpCount = await Experience.countDocuments();
    
    if (existingExpCount === 0) {
      await Experience.insertMany(experiences);
      console.log(`✅ Added ${experiences.length} experience records`);
    } else {
      console.log(`⚠️  Skipped: ${existingExpCount} experience records already exist`);
    }

    // Skills data based on your About.jsx profile
    const skills = [
      // Programming Languages
      { name: 'Java', category: 'Other', level: 'Advanced', order: 1 },
      { name: 'Python', category: 'Other', level: 'Intermediate', order: 2 },
      { name: 'C++', category: 'Other', level: 'Intermediate', order: 3 },
      { name: 'JavaScript', category: 'Other', level: 'Advanced', order: 4 },
      
      // Frontend
      { name: 'HTML', category: 'Frontend', level: 'Advanced', order: 1 },
      { name: 'CSS', category: 'Frontend', level: 'Advanced', order: 2 },
      { name: 'React.js', category: 'Frontend', level: 'Advanced', order: 3 },
      { name: 'Vite', category: 'Frontend', level: 'Intermediate', order: 4 },
      { name: 'Bootstrap', category: 'Frontend', level: 'Intermediate', order: 5 },
      { name: 'Tailwind CSS', category: 'Frontend', level: 'Advanced', order: 6 },
      { name: 'Responsive Design', category: 'Frontend', level: 'Advanced', order: 7 },
      
      // Backend
      { name: 'Node.js', category: 'Backend', level: 'Advanced', order: 1 },
      { name: 'Express.js', category: 'Backend', level: 'Advanced', order: 2 },
      { name: 'REST API', category: 'Backend', level: 'Advanced', order: 3 },
      { name: 'JWT Authentication', category: 'Backend', level: 'Advanced', order: 4 },
      { name: 'bcrypt', category: 'Backend', level: 'Intermediate', order: 5 },
      
      // Databases
      { name: 'MySQL', category: 'Database', level: 'Advanced', order: 1 },
      { name: 'MongoDB', category: 'Database', level: 'Advanced', order: 2 },
      { name: 'Sequelize ORM', category: 'Database', level: 'Intermediate', order: 3 },
      { name: 'Mongoose', category: 'Database', level: 'Advanced', order: 4 },
      
      // Tools
      { name: 'Git', category: 'Tools', level: 'Advanced', order: 1 },
      { name: 'GitHub', category: 'Tools', level: 'Advanced', order: 2 },
      { name: 'VS Code', category: 'Tools', level: 'Advanced', order: 3 },
      { name: 'Postman', category: 'Tools', level: 'Intermediate', order: 4 },
      { name: 'npm', category: 'Tools', level: 'Advanced', order: 5 },
      
      // Other (Core concepts, AI/ML, Soft Skills)
      { name: 'Data Structures & Algorithms', category: 'Other', level: 'Intermediate', order: 10 },
      { name: 'Software Engineering Principles', category: 'Other', level: 'Intermediate', order: 11 },
      { name: 'Machine Learning', category: 'Other', level: 'Beginner', order: 12 },
      { name: 'Artificial Intelligence', category: 'Other', level: 'Beginner', order: 13 },
      { name: 'Communication', category: 'Other', level: 'Advanced', order: 20 },
      { name: 'Analytical Thinking', category: 'Other', level: 'Advanced', order: 21 },
      { name: 'Problem Solving', category: 'Other', level: 'Advanced', order: 22 },
      { name: 'Team Collaboration', category: 'Other', level: 'Advanced', order: 23 },
      { name: 'Debugging', category: 'Other', level: 'Advanced', order: 24 }
    ];

    console.log('📝 Seeding Skills data...');
    const existingSkillCount = await Skill.countDocuments();
    
    if (existingSkillCount === 0) {
      await Skill.insertMany(skills);
      console.log(`✅ Added ${skills.length} skill records`);
    } else {
      console.log(`⚠️  Skipped: ${existingSkillCount} skill records already exist`);
    }

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('   ✅ SEEDING COMPLETED');
    console.log('═══════════════════════════════════════════════════════\n');

    console.log('📊 Database Summary:');
    console.log('─────────────────────────────────────────────────────');
    const finalExpCount = await Experience.countDocuments();
    const finalSkillCount = await Skill.countDocuments();
    console.log(`  Experience records: ${finalExpCount}`);
    console.log(`  Skill records:      ${finalSkillCount}`);
    console.log('');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('📊 MongoDB connection closed');
    process.exit(0);
  }
}

seedData();
