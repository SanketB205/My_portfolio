const Project = require('../models/Project');
const Skill = require('../models/Skill');
const Experience = require('../models/Experience');
const Certification = require('../models/Certification');

/**
 * Portfolio Document Generator
 * 
 * Creates searchable documents from all portfolio data sources.
 * These documents will be embedded and stored in the vector database
 * for RAG (Retrieval-Augmented Generation) chatbot.
 * 
 * Data Sources:
 * - MongoDB: Projects, Skills, Experience, Certifications
 * - Static: Education, Profile (not yet in database)
 */

/**
 * STATIC DATA
 * 
 * These are currently hardcoded in the frontend (About.jsx)
 * and should be moved to the database in the future.
 * 
 * TODO: Create Education and Profile models in MongoDB
 */
const STATIC_PROFILE = {
  name: 'Sanket Bhujbal',
  gender: 'male',
  pronouns: 'he/him',
  title: 'Full-Stack Developer & Computer Engineering Student',
  location: 'Phaltan, Satara, Maharashtra, India',
  email: 'sanketbhujbal205@gmail.com',
  phone: '+91 7057130039',
  social: {
    github:   'https://github.com/SanketB205',
    linkedin: 'https://www.linkedin.com/in/sanket-bhujbal-24b013314/',
    leetcode: 'https://leetcode.com/u/RhBgdt49Pw/',
    resume:   '/api/resume/download/active',
  },
  bio: `Hi, I'm Sanket Bhujbal, a Computer Engineering student pursuing my Bachelor of Engineering at VPKBIET, Baramati, with a CGPA of 8.52/10. I'm a full-stack developer passionate about building modern, responsive, and scalable web applications using the MERN stack.

I've gained practical industry experience through internships at Regex Technologies and CloudRegex InfoTech, working on web development, RESTful APIs, databases, authentication, debugging, and real-world software projects.

I enjoy transforming ideas into reliable digital products and solving problems through technology. From EV charging and slot booking systems to blog platforms and service-booking applications, I've worked across both frontend and backend development. I'm also continuously improving my skills in Java, DSA, AI/ML, software engineering, and problem solving.`,
  education: [
    {
      id: 'edu-1',
      degree: 'Bachelor of Engineering',
      field: 'Computer Engineering',
      institution: 'VPKBIET Baramati',
      university: 'Savitribai Phule Pune University',
      cgpa: '8.52/10',
      status: 'Present',
      startYear: null,
      endYear: null
    },
    {
      id: 'edu-2',
      degree: 'Diploma',
      field: 'Computer Engineering',
      institution: "SVPM's ITE Malegaon (Bk), Baramati",
      board: 'MSBTE',
      percentage: '88.00%',
      startYear: '2021',
      endYear: '2024'
    }
  ],
  technicalAreas: [
    'MERN Stack Development',
    'RESTful API Design',
    'Database Management',
    'Authentication & Security',
    'Full-Stack Web Applications'
  ],
  softSkills: [
    'Communication',
    'Analytical Thinking',
    'Problem Solving',
    'Team Collaboration',
    'Debugging'
  ],
  internshipCount: 2,
  languages: ['Java', 'Python', 'C++', 'JavaScript'],
  hobbies: {
    professional: [
      'Learning new technologies',
      'Solving coding problems',
      'Working on personal projects'
    ],
    personal: [
      'Driving cars and tractors',
      'Travelling to new places',
      'Exploring new things and discovering different places'
    ]
  }
};

/**
 * ========================================
 * PROFILE DOCUMENT GENERATOR
 * ========================================
 */
function createProfileDocument() {
  const { name, gender, location, email, phone, social, bio, technicalAreas, languages, softSkills, internshipCount, hobbies } = STATIC_PROFILE;

  const doc = `Profile: ${name}

Gender: Male
Pronouns: He/Him
Location: ${location}

Sanket Bhujbal is the owner and developer of this portfolio website. He designed and built it himself as a full-stack MERN project.

Contact:
Email: ${email}
Phone: ${phone}

Social Links:
GitHub: ${social.github}
LinkedIn: ${social.linkedin}
LeetCode: ${social.leetcode}
Resume (PDF): ${social.resume}

${bio}

Technical Focus:
${technicalAreas.join(', ')}

Programming Languages:
${languages.join(', ')}

Soft Skills:
${softSkills.join(', ')}

Interests & Hobbies:
Professional: ${hobbies.professional.join(', ')}
Personal: ${hobbies.personal.join(', ')}

Internships Completed: ${internshipCount}`;

  return {
    id: 'profile-main',
    content: doc,
    metadata: {
      type:     'profile',
      name:     STATIC_PROFILE.name,
      title:    STATIC_PROFILE.title,
      location: STATIC_PROFILE.location
    }
  };
}

/**
 * ========================================
 * EDUCATION DOCUMENTS GENERATOR
 * ========================================
 */
function createEducationDocuments() {
  return STATIC_PROFILE.education.map(edu => {
    let doc = `Education: ${edu.degree} in ${edu.field}

Institution: ${edu.institution}`;

    if (edu.university) {
      doc += `\nUniversity: ${edu.university}`;
    }
    if (edu.board) {
      doc += `\nBoard: ${edu.board}`;
    }
    if (edu.cgpa) {
      doc += `\nCGPA: ${edu.cgpa}`;
    }
    if (edu.percentage) {
      doc += `\nPercentage: ${edu.percentage}`;
    }
    if (edu.status) {
      doc += `\nStatus: ${edu.status}`;
    }
    if (edu.startYear && edu.endYear) {
      doc += `\nDuration: ${edu.startYear} - ${edu.endYear}`;
    }

    return {
      id: edu.id,
      content: doc,
      metadata: {
        type: 'education',
        id: edu.id,
        degree: edu.degree,
        field: edu.field,
        institution: edu.institution
      }
    };
  });
}

/**
 * ========================================
 * PROJECT DOCUMENTS GENERATOR
 * ========================================
 */
async function createProjectDocuments() {
  try {
    const projects = await Project.find().sort({ featured: -1, year: -1 });
    
    return projects.map(project => {
      let doc = `Project: ${project.title}

Description: ${project.description}`;

      if (project.techStack && project.techStack.length > 0) {
        doc += `\n\nTechnologies: ${project.techStack.join(', ')}`;
      }

      if (project.year) {
        doc += `\n\nYear: ${project.year}`;
      }

      if (project.githubLink) {
        doc += `\n\nGitHub: ${project.githubLink}`;
      }

      if (project.liveDemoLink) {
        doc += `\n\nLive Demo: ${project.liveDemoLink}`;
      }

      if (project.featured) {
        doc += `\n\nFeatured Project`;
      }

      return {
        id: `project-${project._id}`,
        content: doc,
        metadata: {
          type: 'project',
          id: project._id.toString(),
          title: project.title,
          technologies: project.techStack || [],
          year: project.year || null,
          featured: project.featured || false
        }
      };
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return [];
  }
}

/**
 * ========================================
 * EXPERIENCE/INTERNSHIP DOCUMENTS GENERATOR
 * ========================================
 */
async function createExperienceDocuments() {
  try {
    const experiences = await Experience.find().sort({ order: 1, startDate: -1 });
    
    return experiences.map(exp => {
      const startYear = exp.startDate ? new Date(exp.startDate).getFullYear() : null;
      const endYear = exp.current ? 'Present' : (exp.endDate ? new Date(exp.endDate).getFullYear() : null);
      
      let doc = `Experience: ${exp.position} at ${exp.company}`;

      if (exp.location) {
        doc += `\nLocation: ${exp.location}`;
      }

      if (startYear || endYear) {
        doc += `\nDuration: ${startYear || '?'} - ${endYear || '?'}`;
      }

      doc += `\n\nDescription: ${exp.description}`;

      if (exp.responsibilities && exp.responsibilities.length > 0) {
        doc += `\n\nResponsibilities:\n${exp.responsibilities.map(r => `- ${r}`).join('\n')}`;
      }

      if (exp.technologies && exp.technologies.length > 0) {
        doc += `\n\nTechnologies: ${exp.technologies.join(', ')}`;
      }

      return {
        id: `experience-${exp._id}`,
        content: doc,
        metadata: {
          type: 'experience',
          id: exp._id.toString(),
          company: exp.company,
          position: exp.position,
          location: exp.location || null,
          technologies: exp.technologies || [],
          startYear,
          endYear: exp.current ? 'Present' : endYear
        }
      };
    });
  } catch (error) {
    console.error('Error fetching experiences:', error);
    return [];
  }
}

/**
 * ========================================
 * SKILLS DOCUMENTS GENERATOR
 * ========================================
 */
async function createSkillDocuments() {
  try {
    const skills = await Skill.find().sort({ category: 1, order: 1 });
    
    // Group skills by category
    const skillsByCategory = skills.reduce((acc, skill) => {
      const category = skill.category || 'Other';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push({
        name: skill.name,
        level: skill.level
      });
      return acc;
    }, {});

    // Create one document per category
    return Object.entries(skillsByCategory).map(([category, categorySkills]) => {
      const skillNames = categorySkills.map(s => s.name).join(', ');
      
      let doc = `Skills Category: ${category}

Skills: ${skillNames}`;

      // Add skill levels if available
      const skillsWithLevels = categorySkills
        .filter(s => s.level)
        .map(s => `${s.name}: ${s.level}`)
        .join('\n');

      if (skillsWithLevels) {
        doc += `\n\nProficiency Levels:\n${skillsWithLevels}`;
      }

      return {
        id: `skills-${category.toLowerCase().replace(/\s+/g, '-')}`,
        content: doc,
        metadata: {
          type: 'skill',
          category: category,
          skillCount: categorySkills.length
        }
      };
    });
  } catch (error) {
    console.error('Error fetching skills:', error);
    return [];
  }
}

/**
 * ========================================
 * CERTIFICATION DOCUMENTS GENERATOR
 * ========================================
 */
async function createCertificationDocuments() {
  try {
    const certifications = await Certification.find().sort({ order: 1, year: -1 });
    
    return certifications.map(cert => {
      const doc = `Certification: ${cert.title}

Issued by: ${cert.issuer}

Year: ${cert.year}`;

      return {
        id: `certification-${cert._id}`,
        content: doc,
        metadata: {
          type: 'certification',
          id: cert._id.toString(),
          title: cert.title,
          issuer: cert.issuer,
          year: cert.year
        }
      };
    });
  } catch (error) {
    console.error('Error fetching certifications:', error);
    return [];
  }
}

/**
 * ========================================
 * MASTER FUNCTION: CREATE ALL PORTFOLIO DOCUMENTS
 * ========================================
 */
async function createPortfolioDocuments() {
  console.log('🔄 Generating portfolio documents...');
  
  const documents = [];

  // 1. Profile (static)
  console.log('  ✓ Profile document');
  documents.push(createProfileDocument());

  // 2. Education (static)
  const educationDocs = createEducationDocuments();
  console.log(`  ✓ Education documents (${educationDocs.length})`);
  documents.push(...educationDocs);

  // 3. Projects (from MongoDB)
  const projectDocs = await createProjectDocuments();
  console.log(`  ✓ Project documents (${projectDocs.length})`);
  documents.push(...projectDocs);

  // 4. Experience/Internships (from MongoDB)
  const experienceDocs = await createExperienceDocuments();
  console.log(`  ✓ Experience documents (${experienceDocs.length})`);
  documents.push(...experienceDocs);

  // 5. Skills (from MongoDB)
  const skillDocs = await createSkillDocuments();
  console.log(`  ✓ Skill documents (${skillDocs.length})`);
  documents.push(...skillDocs);

  // 6. Certifications (from MongoDB)
  const certificationDocs = await createCertificationDocuments();
  console.log(`  ✓ Certification documents (${certificationDocs.length})`);
  documents.push(...certificationDocs);

  console.log(`✅ Generated ${documents.length} portfolio documents`);
  
  return documents;
}

/**
 * ========================================
 * GET PORTFOLIO STATISTICS
 * ========================================
 */
async function getPortfolioStats() {
  const [projectCount, skillCount, experienceCount, certificationCount] = await Promise.all([
    Project.countDocuments(),
    Skill.countDocuments(),
    Experience.countDocuments(),
    Certification.countDocuments()
  ]);

  return {
    profile: 1,
    education: STATIC_PROFILE.education.length,
    projects: projectCount,
    experience: experienceCount,
    skills: skillCount,
    certifications: certificationCount,
    total: 1 + STATIC_PROFILE.education.length + projectCount + experienceCount + skillCount + certificationCount
  };
}

module.exports = {
  createPortfolioDocuments,
  createProfileDocument,
  createEducationDocuments,
  createProjectDocuments,
  createExperienceDocuments,
  createSkillDocuments,
  createCertificationDocuments,
  getPortfolioStats,
  STATIC_PROFILE
};
