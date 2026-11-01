const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  techStack: [{
    type: String,
    trim: true
  }],
  githubLink: {
    type: String,
    trim: true
  },
  liveDemoLink: {
    type: String,
    trim: true
  },
  year: {
    type: Number
  },
  featured: {
    type: Boolean,
    default: false
  },
  thumbnail: {
    type: String,
    default: null,
    trim: true
  },
  order: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true  // This automatically adds createdAt and updatedAt
});

module.exports = mongoose.model('Project', projectSchema);
