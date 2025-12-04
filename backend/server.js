// server.js - Express.js Backend with Login
const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = 5000;
const DB_FILE = path.join(__dirname, 'database.json');

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database with passwords
async function initDB() {
  try {
    await fs.access(DB_FILE);
  } catch {
    const initialData = {
      users: [
        { id: 1, name: 'Admin User', role: 'Admin', email: 'admin@freelance.com', password: 'admin123' },
        { id: 2, name: 'John Client', role: 'Client', email: 'john@client.com', password: 'client123' },
        { id: 3, name: 'Jane Freelancer', role: 'Freelancer', email: 'jane@freelancer.com', password: 'freelancer123' },
        { id: 4, name: 'Bob Freelancer', role: 'Freelancer', email: 'bob@freelancer.com', password: 'freelancer123' }
      ],
      jobs: [],
      proposals: []
    };
    await fs.writeFile(DB_FILE, JSON.stringify(initialData, null, 2));
  }
}

// Read database
async function readDB() {
  const data = await fs.readFile(DB_FILE, 'utf8');
  return JSON.parse(data);
}

// Write database
async function writeDB(data) {
  await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2));
}

// ============ AUTH ROUTES ============
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    const db = await readDB();
    
    const user = db.users.find(u => 
      u.email === email && 
      u.password === password && 
      u.role === role
    );
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Don't send password back
    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const db = await readDB();
    
    // Check if email already exists
    if (db.users.find(u => u.email === email)) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    
    const newUser = {
      id: Date.now(),
      name,
      email,
      password,
      role
    };
    
    db.users.push(newUser);
    await writeDB(db);
    
    const { password: _, ...userWithoutPassword } = newUser;
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ USER ROUTES ============
app.get('/api/users', async (req, res) => {
  try {
    const db = await readDB();
    // Remove passwords from response
    const usersWithoutPasswords = db.users.map(({ password, ...user }) => user);
    res.json(usersWithoutPasswords);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/users/:id', async (req, res) => {
  try {
    const db = await readDB();
    const user = db.users.find(u => u.id === parseInt(req.params.id));
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ JOB ROUTES ============
app.get('/api/jobs', async (req, res) => {
  try {
    const db = await readDB();
    const { userId, role } = req.query;
    
    let jobs = db.jobs;
    
    // Filter for freelancers: hide "In Progress" jobs unless they're hired
    if (role === 'Freelancer' && userId) {
      jobs = jobs.filter(job => 
        job.status === 'Open' || job.hiredFreelancerId === parseInt(userId)
      );
    }
    
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/jobs', async (req, res) => {
  try {
    const db = await readDB();
    const newJob = {
      id: Date.now(),
      ...req.body,
      status: 'Open',
      createdAt: new Date().toISOString()
    };
    db.jobs.push(newJob);
    await writeDB(db);
    res.status(201).json(newJob);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/jobs/:id', async (req, res) => {
  try {
    const db = await readDB();
    const jobIndex = db.jobs.findIndex(j => j.id === parseInt(req.params.id));
    if (jobIndex === -1) return res.status(404).json({ error: 'Job not found' });
    
    db.jobs[jobIndex] = { ...db.jobs[jobIndex], ...req.body };
    await writeDB(db);
    res.json(db.jobs[jobIndex]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/jobs/:id', async (req, res) => {
  try {
    const db = await readDB();
    const jobId = parseInt(req.params.id);
    db.jobs = db.jobs.filter(j => j.id !== jobId);
    db.proposals = db.proposals.filter(p => p.jobId !== jobId);
    await writeDB(db);
    res.json({ message: 'Job deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ PROPOSAL ROUTES ============
app.get('/api/proposals', async (req, res) => {
  try {
    const db = await readDB();
    const { jobId } = req.query;
    
    let proposals = db.proposals;
    if (jobId) {
      proposals = proposals.filter(p => p.jobId === parseInt(jobId));
    }
    
    res.json(proposals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/proposals', async (req, res) => {
  try {
    const db = await readDB();
    const newProposal = {
      id: Date.now(),
      ...req.body,
      status: 'Pending',
      createdAt: new Date().toISOString()
    };
    db.proposals.push(newProposal);
    await writeDB(db);
    res.status(201).json(newProposal);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/proposals/:id', async (req, res) => {
  try {
    const db = await readDB();
    const proposalIndex = db.proposals.findIndex(p => p.id === parseInt(req.params.id));
    if (proposalIndex === -1) return res.status(404).json({ error: 'Proposal not found' });
    
    db.proposals[proposalIndex] = { ...db.proposals[proposalIndex], ...req.body };
    await writeDB(db);
    res.json(db.proposals[proposalIndex]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Accept proposal (also updates job and rejects others)
app.post('/api/proposals/:id/accept', async (req, res) => {
  try {
    const db = await readDB();
    const proposalId = parseInt(req.params.id);
    const proposal = db.proposals.find(p => p.id === proposalId);
    
    if (!proposal) return res.status(404).json({ error: 'Proposal not found' });
    
    // Accept this proposal
    proposal.status = 'Accepted';
    
    // Update job status and set hired freelancer
    const job = db.jobs.find(j => j.id === proposal.jobId);
    if (job) {
      job.status = 'In Progress';
      job.hiredFreelancerId = proposal.freelancerId;
    }
    
    // Reject all other pending proposals for this job
    db.proposals.forEach(p => {
      if (p.jobId === proposal.jobId && p.id !== proposalId && p.status === 'Pending') {
        p.status = 'Rejected';
      }
    });
    
    await writeDB(db);
    res.json({ proposal, job });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`\n📝 Demo Login Credentials:`);
    console.log(`Admin: admin@freelance.com / admin123`);
    console.log(`Client: john@client.com / client123`);
    console.log(`Freelancer: jane@freelancer.com / freelancer123`);
  });
});