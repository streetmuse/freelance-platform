// server.js - Complete Backend with MongoDB
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const User = require('./models/User');
const Job = require('./models/Job');
const Proposal = require('./models/Proposal');
const Notification = require('./models/Notification');
const ActivityLog = require('./models/ActivityLog');

const app = express();
const PORT = 5000;

const MONGODB_URI = 'mongodb+srv://nikolozlobzhanidze2_db_user:qmePQHjXKFClBNIi@cluster0.fxm7bmc.mongodb.net/freelance-platform?retryWrites=true&w=majority';

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Helper function to create activity log
async function logActivity(userId, userName, action, entityType, entityId, details) {
  try {
    await ActivityLog.create({
      userId,
      userName,
      action,
      entityType,
      entityId,
      details
    });
  } catch (err) {
    console.error('Error logging activity:', err);
  }
}

// Helper function to create notification
async function createNotification(userId, message, type, relatedId) {
  try {
    await Notification.create({
      userId,
      message,
      type,
      relatedId
    });
  } catch (err) {
    console.error('Error creating notification:', err);
  }
}

// ============ AUTH ROUTES ============
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    
    const user = await User.findOne({ email, password, role });
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Update last login
    user.lastLogin = new Date();
    await user.save();
    
    // Log activity
    await logActivity(user._id, user.name, 'Login', 'user', user._id, `${user.role} logged in`);
    
    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    };
    
    res.json(userResponse);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    
    const newUser = await User.create({
      name,
      email,
      password,
      role
    });
    
    // Log activity
    await logActivity(newUser._id, newUser.name, 'Register', 'user', newUser._id, `New ${role} registered`);
    
    const userResponse = {
      id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role
    };
    
    res.status(201).json(userResponse);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ USER ROUTES ============
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const { name, email, role } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, role },
      { new: true }
    ).select('-password');
    
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    await logActivity(user._id, user.name, 'Update Profile', 'user', user._id, 'Profile updated');
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    await logActivity(req.body.adminId, req.body.adminName, 'Delete User', 'user', user._id, `Deleted user: ${user.name}`);
    
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ JOB ROUTES ============
app.get('/api/jobs', async (req, res) => {
  try {
    const { userId, role } = req.query;
    
    let query = {};
    
    // Filter for freelancers: hide jobs in progress unless they're hired
    if (role === 'Freelancer' && userId) {
      query = {
        $or: [
          { status: { $in: ['Draft', 'Active'] } },
          { hiredFreelancerId: userId }
        ]
      };
    }
    
    const jobs = await Job.find(query).sort({ createdAt: -1 });
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/jobs', async (req, res) => {
  try {
    const newJob = await Job.create(req.body);
    
    await logActivity(
      req.body.clientId,
      req.body.clientName,
      'Create Job',
      'job',
      newJob._id,
      `Created job: ${newJob.title}`
    );
    
    res.status(201).json(newJob);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/jobs/:id', async (req, res) => {
  try {
    const job = await Job.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );
    
    if (!job) return res.status(404).json({ error: 'Job not found' });
    
    await logActivity(
      req.body.userId || job.clientId,
      req.body.userName || job.clientName,
      'Update Job',
      'job',
      job._id,
      `Updated job: ${job.title}`
    );
    
    res.json(job);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/jobs/:id', async (req, res) => {
  try {
    const job = await Job.findByIdAndDelete(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    
    // Delete related proposals
    await Proposal.deleteMany({ jobId: req.params.id });
    
    await logActivity(
      req.body.userId,
      req.body.userName,
      'Delete Job',
      'job',
      job._id,
      `Deleted job: ${job.title}`
    );
    
    res.json({ message: 'Job deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ PROPOSAL ROUTES ============
app.get('/api/proposals', async (req, res) => {
  try {
    const { jobId, userId } = req.query;
    
    let query = {};
    if (jobId) query.jobId = jobId;
    if (userId) query.freelancerId = userId;
    
    const proposals = await Proposal.find(query).sort({ createdAt: -1 });
    res.json(proposals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/proposals', async (req, res) => {
  try {
    const newProposal = await Proposal.create(req.body);
    
    // Get job details for notification
    const job = await Job.findById(req.body.jobId);
    
    // Create notification for client
    await createNotification(
      job.clientId,
      `New proposal from ${req.body.freelancerName} for "${job.title}"`,
      'proposal',
      newProposal._id
    );
    
    await logActivity(
      req.body.freelancerId,
      req.body.freelancerName,
      'Submit Proposal',
      'proposal',
      newProposal._id,
      `Submitted proposal for: ${job.title}`
    );
    
    res.status(201).json(newProposal);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/proposals/:id', async (req, res) => {
  try {
    const proposal = await Proposal.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    
    if (!proposal) return res.status(404).json({ error: 'Proposal not found' });
    
    // Create notification for freelancer if rejected
    if (req.body.status === 'Rejected') {
      const job = await Job.findById(proposal.jobId);
      await createNotification(
        proposal.freelancerId,
        `Your proposal for "${job.title}" was not accepted`,
        'rejection',
        proposal._id
      );
    }
    
    res.json(proposal);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Accept proposal
app.post('/api/proposals/:id/accept', async (req, res) => {
  try {
    const proposal = await Proposal.findById(req.params.id);
    if (!proposal) return res.status(404).json({ error: 'Proposal not found' });
    
    // Accept this proposal
    proposal.status = 'Accepted';
    await proposal.save();
    
    // Update job status
    const job = await Job.findById(proposal.jobId);
    job.status = 'In Progress';
    job.hiredFreelancerId = proposal.freelancerId;
    job.hiredFreelancerName = proposal.freelancerName;
    job.updatedAt = new Date();
    await job.save();
    
    // Create notification for hired freelancer
    await createNotification(
      proposal.freelancerId,
      `Congratulations! Your proposal for "${job.title}" was accepted`,
      'acceptance',
      proposal._id
    );
    
    // Reject all other pending proposals
    const otherProposals = await Proposal.find({
      jobId: proposal.jobId,
      _id: { $ne: proposal._id },
      status: 'Pending'
    });
    
    for (const p of otherProposals) {
      p.status = 'Rejected';
      await p.save();
      
      // Notify rejected freelancers
      await createNotification(
        p.freelancerId,
        `Your proposal for "${job.title}" was not accepted`,
        'rejection',
        p._id
      );
    }
    
    await logActivity(
      job.clientId,
      job.clientName,
      'Accept Proposal',
      'proposal',
      proposal._id,
      `Hired ${proposal.freelancerName} for: ${job.title}`
    );
    
    res.json({ proposal, job });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ NOTIFICATION ROUTES ============
app.get('/api/notifications/:userId', async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.params.userId })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/notifications/:id/read', async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );
    res.json(notification);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/notifications/read-all/:userId', async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.params.userId, isRead: false },
      { isRead: true }
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ ACTIVITY LOG ROUTES ============
app.get('/api/activity-logs', async (req, res) => {
  try {
    const { userId, limit = 100 } = req.query;
    
    let query = {};
    if (userId) query.userId = userId;
    
    const logs = await ActivityLog.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));
    
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ ADMIN STATS ROUTE ============
app.get('/api/admin/stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalJobs = await Job.countDocuments();
    const totalProposals = await Proposal.countDocuments();
    const activeJobs = await Job.countDocuments({ status: 'Active' });
    const inProgressJobs = await Job.countDocuments({ status: 'In Progress' });
    const completedJobs = await Job.countDocuments({ status: 'Completed' });
    
    const usersByRole = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);
    
    res.json({
      totalUsers,
      totalJobs,
      totalProposals,
      activeJobs,
      inProgressJobs,
      completedJobs,
      usersByRole
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Seed initial admin user
async function seedAdmin() {
  try {
    const adminExists = await User.findOne({ role: 'Admin' });
    if (!adminExists) {
      await User.create({
        name: 'Admin User',
        email: 'admin@freelance.com',
        password: 'admin123',
        role: 'Admin'
      });
      console.log('✅ Admin user created');
    }
  } catch (err) {
    console.error('Error seeding admin:', err);
  }
}

// Start server
app.listen(PORT, () => {
  console.log(`\n✅ Server running on http://localhost:${PORT}`);
  console.log('\n📝 Demo Login Credentials:');
  console.log('Admin: admin@freelance.com / admin123');
  console.log('\nRegister as Client or Freelancer to test the system\n');
  seedAdmin();
});