const Project = require('../models/Project');
const User = require('../models/User');

// @desc    Get all projects (explore)
// @route   GET /api/projects
// @access  Private
const getProjects = async (req, res) => {
  try {
    const { query, tech, role, domain, status } = req.query;

    let filter = {};

    if (query) {
      filter.$or = [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { domain: { $regex: query, $options: 'i' } },
      ];
    }

    if (tech) {
      const techs = tech.split(',').map((t) => t.trim());
      filter.techStack = { $all: techs };
    }

    if (role) {
      const roles = role.split(',').map((r) => r.trim());
      filter.lookingFor = { $in: roles };
    }

    if (domain) {
      filter.domain = { $in: domain.split(',').map((d) => d.trim()) };
    }

    if (status) {
      filter.status = { $in: status.split(',').map((s) => s.trim()) };
    }

    const projects = await Project.find(filter)
      .populate('owner', 'name email avatar')
      .populate('members', 'name avatar')
      .sort({ createdAt: -1 });

    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get a single project
// @route   GET /api/projects/:id
// @access  Private
const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email avatar skills bio github linkedin')
      .populate('members', 'name email avatar skills')
      .populate('pendingRequests', 'name email avatar');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a project
// @route   POST /api/projects
// @access  Private
const createProject = async (req, res) => {
  try {
    const { title, description, techStack, lookingFor, domain, status } = req.body;

    if (!title || !description) {
      return res.status(400).json({ message: 'Title and description are required' });
    }

    const project = await Project.create({
      title,
      description,
      techStack: techStack || [],
      lookingFor: lookingFor || [],
      domain: domain || 'General',
      status: status || 'Not Started',
      owner: req.user._id,
      members: [req.user._id],
    });

    // Add to user's owned projects
    await User.findByIdAndUpdate(req.user._id, {
      $push: { ownedProjects: project._id },
    });

    const populated = await Project.findById(project._id)
      .populate('owner', 'name email avatar')
      .populate('members', 'name avatar');

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a project
// @route   PUT /api/projects/:id
// @access  Private
const updateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this project' });
    }

    const { title, description, techStack, lookingFor, domain, status } = req.body;

    if (title !== undefined) project.title = title;
    if (description !== undefined) project.description = description;
    if (techStack !== undefined) project.techStack = techStack;
    if (lookingFor !== undefined) project.lookingFor = lookingFor;
    if (domain !== undefined) project.domain = domain;
    if (status !== undefined) project.status = status;

    const updated = await project.save();

    const populated = await Project.findById(updated._id)
      .populate('owner', 'name email avatar')
      .populate('members', 'name avatar');

    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a project
// @route   DELETE /api/projects/:id
// @access  Private
const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this project' });
    }

    // Remove project from all members' joinedProjects
    await User.updateMany(
      { _id: { $in: project.members } },
      { $pull: { joinedProjects: project._id } }
    );

    // Remove from owner's ownedProjects
    await User.findByIdAndUpdate(project.owner, {
      $pull: { ownedProjects: project._id },
    });

    await project.deleteOne();

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get my projects (owned + joined)
// @route   GET /api/projects/my
// @access  Private
const getMyProjects = async (req, res) => {
  try {
    const owned = await Project.find({ owner: req.user._id })
      .populate('owner', 'name email avatar')
      .populate('members', 'name avatar')
      .sort({ createdAt: -1 });

    const joined = await Project.find({
      members: req.user._id,
      owner: { $ne: req.user._id },
    })
      .populate('owner', 'name email avatar')
      .populate('members', 'name avatar')
      .sort({ createdAt: -1 });

    res.json({ owned, joined });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getMyProjects,
};
