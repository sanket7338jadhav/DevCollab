const Request = require('../models/Request');
const Project = require('../models/Project');
const User = require('../models/User');

// @desc    Send a collaboration request
// @route   POST /api/requests
// @access  Private
const sendRequest = async (req, res) => {
  try {
    const { projectId, message } = req.body;

    if (!projectId) {
      return res.status(400).json({ message: 'Project ID is required' });
    }

    const project = await Project.findById(projectId).populate('owner');
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Can't apply to your own project
    if (project.owner._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot apply to your own project' });
    }

    // Already a member
    if (project.members.map((m) => m.toString()).includes(req.user._id.toString())) {
      return res.status(400).json({ message: 'You are already a member of this project' });
    }

    // Check duplicate request
    const existing = await Request.findOne({ from: req.user._id, project: projectId });
    if (existing) {
      return res.status(400).json({ message: 'You have already sent a request to this project' });
    }

    const request = await Request.create({
      from: req.user._id,
      to: project.owner._id,
      project: projectId,
      message: message || `Hi! I'd love to collaborate on ${project.title}.`,
    });

    // Add to project's pendingRequests
    await Project.findByIdAndUpdate(projectId, {
      $push: { pendingRequests: req.user._id },
    });

    const populated = await Request.findById(request._id)
      .populate('from', 'name email avatar skills')
      .populate('project', 'title status');

    res.status(201).json(populated);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'You have already sent a request to this project' });
    }
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get incoming requests (to my projects)
// @route   GET /api/requests/incoming
// @access  Private
const getIncomingRequests = async (req, res) => {
  try {
    const requests = await Request.find({ to: req.user._id })
      .populate('from', 'name email avatar skills bio github linkedin')
      .populate('project', 'title status techStack domain')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get outgoing/sent requests
// @route   GET /api/requests/sent
// @access  Private
const getSentRequests = async (req, res) => {
  try {
    const requests = await Request.find({ from: req.user._id })
      .populate('to', 'name email avatar')
      .populate('project', 'title status techStack domain')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Accept or reject a collaboration request
// @route   PUT /api/requests/:id
// @access  Private
const handleRequest = async (req, res) => {
  try {
    const { action } = req.body; // 'accepted' | 'rejected'

    if (!['accepted', 'rejected'].includes(action)) {
      return res.status(400).json({ message: 'Action must be accepted or rejected' });
    }

    const request = await Request.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Only the recipient can act
    if (request.to.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Request already handled' });
    }

    request.status = action;
    await request.save();

    // If accepted, add user to project members
    if (action === 'accepted') {
      await Project.findByIdAndUpdate(request.project, {
        $addToSet: { members: request.from },
        $pull: { pendingRequests: request.from },
      });

      await User.findByIdAndUpdate(request.from, {
        $addToSet: { joinedProjects: request.project },
      });
    } else {
      // Just remove from pendingRequests
      await Project.findByIdAndUpdate(request.project, {
        $pull: { pendingRequests: request.from },
      });
    }

    const populated = await Request.findById(request._id)
      .populate('from', 'name email avatar skills')
      .populate('project', 'title status');

    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { sendRequest, getIncomingRequests, getSentRequests, handleRequest };
