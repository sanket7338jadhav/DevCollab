const express = require('express');
const router = express.Router();
const {
  sendRequest,
  getIncomingRequests,
  getSentRequests,
  handleRequest,
} = require('../controllers/requestController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, sendRequest);
router.get('/incoming', protect, getIncomingRequests);
router.get('/sent', protect, getSentRequests);
router.put('/:id', protect, handleRequest);

module.exports = router;
