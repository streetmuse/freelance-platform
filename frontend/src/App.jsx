// src/App.jsx - React Frontend with Login
import React, { useState, useEffect } from 'react';
import './App.css';

const API_URL = 'http://localhost:5000/api';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerMode, setRegisterMode] = useState(false);
  const [registerForm, setRegisterForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [showJobForm, setShowJobForm] = useState(false);
  const [showProposalForm, setShowProposalForm] = useState(false);
  
  const [jobForm, setJobForm] = useState({ title: '', description: '', budget: '' });
  const [proposalForm, setProposalForm] = useState({ coverLetter: '', proposedBudget: '', timeline: '' });

  useEffect(() => {
    if (currentUser) loadJobs();
  }, [currentUser]);

  useEffect(() => {
    if (selectedJob) loadProposals(selectedJob.id);
  }, [selectedJob]);

  const handleLogin = async () => {
    setError('');
    if (!loginForm.email || !loginForm.password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginForm.email,
          password: loginForm.password,
          role: selectedRole
        })
      });

      const data = await res.json();

      if (res.ok) {
        setCurrentUser(data);
        setLoginForm({ email: '', password: '' });
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Connection error. Make sure backend is running.');
    }
  };

  const handleRegister = async () => {
    setError('');
    if (!registerForm.name || !registerForm.email || !registerForm.password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...registerForm,
          role: selectedRole
        })
      });

      const data = await res.json();

      if (res.ok) {
        setCurrentUser(data);
        setRegisterForm({ name: '', email: '', password: '' });
        setRegisterMode(false);
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      setError('Connection error. Make sure backend is running.');
    }
  };

  const loadJobs = async () => {
    try {
      const res = await fetch(`${API_URL}/jobs?userId=${currentUser.id}&role=${currentUser.role}`);
      const data = await res.json();
      setJobs(data);
    } catch (err) {
      console.error('Error loading jobs:', err);
    }
  };

  const loadProposals = async (jobId) => {
    try {
      const res = await fetch(`${API_URL}/proposals?jobId=${jobId}`);
      const data = await res.json();
      setProposals(data);
    } catch (err) {
      console.error('Error loading proposals:', err);
    }
  };

  const handleCreateJob = async () => {
    if (!jobForm.title || !jobForm.description || !jobForm.budget) return;
    
    try {
      const res = await fetch(`${API_URL}/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...jobForm,
          clientId: currentUser.id,
          clientName: currentUser.name
        })
      });
      
      if (res.ok) {
        setJobForm({ title: '', description: '', budget: '' });
        setShowJobForm(false);
        loadJobs();
      }
    } catch (err) {
      console.error('Error creating job:', err);
    }
  };

  const handleCreateProposal = async () => {
    if (!proposalForm.coverLetter || !proposalForm.proposedBudget || !proposalForm.timeline) return;
    
    try {
      const res = await fetch(`${API_URL}/proposals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...proposalForm,
          jobId: selectedJob.id,
          freelancerId: currentUser.id,
          freelancerName: currentUser.name
        })
      });
      
      if (res.ok) {
        setProposalForm({ coverLetter: '', proposedBudget: '', timeline: '' });
        setShowProposalForm(false);
        loadProposals(selectedJob.id);
      }
    } catch (err) {
      console.error('Error creating proposal:', err);
    }
  };

  const handleAcceptProposal = async (proposalId) => {
    try {
      const res = await fetch(`${API_URL}/proposals/${proposalId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (res.ok) {
        loadProposals(selectedJob.id);
        loadJobs();
      }
    } catch (err) {
      console.error('Error accepting proposal:', err);
    }
  };

  const handleRejectProposal = async (proposalId) => {
    try {
      const res = await fetch(`${API_URL}/proposals/${proposalId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Rejected' })
      });
      
      if (res.ok) {
        loadProposals(selectedJob.id);
      }
    } catch (err) {
      console.error('Error rejecting proposal:', err);
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm('Delete this job?')) return;
    
    try {
      const res = await fetch(`${API_URL}/jobs/${jobId}`, { method: 'DELETE' });
      if (res.ok) {
        loadJobs();
        if (selectedJob?.id === jobId) setSelectedJob(null);
      }
    } catch (err) {
      console.error('Error deleting job:', err);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setSelectedRole(null);
    setError('');
  };

  // Role Selection Screen
  if (!selectedRole) {
    return (
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <div className="logo">💼</div>
            <h1>FreelanceHub</h1>
            <p>Select your role to continue</p>
          </div>
          
          <div className="user-list">
            <button onClick={() => setSelectedRole('Admin')} className="user-button">
              <div>
                <div className="user-name">Admin</div>
                <div className="user-role">Manage platform</div>
              </div>
              <span className="user-icon">👑</span>
            </button>
            
            <button onClick={() => setSelectedRole('Client')} className="user-button">
              <div>
                <div className="user-name">Client</div>
                <div className="user-role">Post jobs</div>
              </div>
              <span className="user-icon">💼</span>
            </button>
            
            <button onClick={() => setSelectedRole('Freelancer')} className="user-button">
              <div>
                <div className="user-name">Freelancer</div>
                <div className="user-role">Find work</div>
              </div>
              <span className="user-icon">👨‍💻</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Login Screen
  if (!currentUser) {
    return (
      <div className="login-container">
        <div className="login-card">
          <button onClick={() => setSelectedRole(null)} className="back-btn">
            ← Back
          </button>
          
          <div className="login-header">
            <div className="logo">
              {selectedRole === 'Admin' ? '👑' : selectedRole === 'Client' ? '💼' : '👨‍💻'}
            </div>
            <h1>{registerMode ? 'Register' : 'Login'} as {selectedRole}</h1>
            <p>{registerMode ? 'Create your account' : 'Enter your credentials'}</p>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="login-form">
            {registerMode && (
              <input
                type="text"
                placeholder="Full Name"
                value={registerForm.name}
                onChange={(e) => setRegisterForm({...registerForm, name: e.target.value})}
                className="input"
              />
            )}
            
            <input
              type="email"
              placeholder="Email"
              value={registerMode ? registerForm.email : loginForm.email}
              onChange={(e) => registerMode 
                ? setRegisterForm({...registerForm, email: e.target.value})
                : setLoginForm({...loginForm, email: e.target.value})
              }
              className="input"
            />
            
            <input
              type="password"
              placeholder="Password"
              value={registerMode ? registerForm.password : loginForm.password}
              onChange={(e) => registerMode
                ? setRegisterForm({...registerForm, password: e.target.value})
                : setLoginForm({...loginForm, password: e.target.value})
              }
              className="input"
              onKeyPress={(e) => e.key === 'Enter' && (registerMode ? handleRegister() : handleLogin())}
            />

            <button 
              onClick={registerMode ? handleRegister : handleLogin} 
              className="btn-primary full-width"
            >
              {registerMode ? 'Register' : 'Login'}
            </button>

            <div className="login-footer">
              <button 
                onClick={() => {
                  setRegisterMode(!registerMode);
                  setError('');
                }}
                className="link-btn"
              >
                {registerMode ? 'Already have an account? Login' : "Don't have an account? Register"}
              </button>
            </div>

            <div className="demo-credentials">
              <p><strong>Demo Credentials:</strong></p>
              {selectedRole === 'Admin' && <p>admin@freelance.com / admin123</p>}
              {selectedRole === 'Client' && <p>john@client.com / client123</p>}
              {selectedRole === 'Freelancer' && <p>jane@freelancer.com / freelancer123</p>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main App (same as before)
  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <div className="header-left">
            <span className="logo">💼</span>
            <h1>FreelanceHub</h1>
          </div>
          <div className="header-right">
            <div className="user-info">
              <div className="user-name">{currentUser.name}</div>
              <div className="user-role">{currentUser.role}</div>
            </div>
            <button onClick={handleLogout} className="switch-btn">
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="main-content">
        <div className="grid">
          {/* Jobs Panel */}
          <div className="panel">
            <div className="panel-header">
              <h2>Available Jobs</h2>
              {currentUser.role === 'Client' && (
                <button onClick={() => setShowJobForm(!showJobForm)} className="btn-primary">
                  ➕ Post Job
                </button>
              )}
            </div>

            {showJobForm && currentUser.role === 'Client' && (
              <div className="form-container">
                <input
                  type="text"
                  placeholder="Job Title"
                  value={jobForm.title}
                  onChange={(e) => setJobForm({...jobForm, title: e.target.value})}
                  className="input"
                />
                <textarea
                  placeholder="Job Description"
                  value={jobForm.description}
                  onChange={(e) => setJobForm({...jobForm, description: e.target.value})}
                  className="textarea"
                />
                <input
                  type="number"
                  placeholder="Budget ($)"
                  value={jobForm.budget}
                  onChange={(e) => setJobForm({...jobForm, budget: e.target.value})}
                  className="input"
                />
                <div className="btn-group">
                  <button onClick={handleCreateJob} className="btn-primary">Create Job</button>
                  <button onClick={() => setShowJobForm(false)} className="btn-secondary">Cancel</button>
                </div>
              </div>
            )}

            <div className="job-list">
              {jobs.length === 0 ? (
                <p className="empty-state">No jobs posted yet</p>
              ) : (
                jobs.map(job => (
                  <div
                    key={job.id}
                    onClick={() => setSelectedJob(job)}
                    className={`job-card ${selectedJob?.id === job.id ? 'selected' : ''}`}
                  >
                    <div className="job-header">
                      <h3>{job.title}</h3>
                      <div className="job-badges">
                        <span className={`badge ${job.status === 'Open' ? 'badge-success' : 'badge-info'}`}>
                          {job.status}
                        </span>
                        {job.status === 'In Progress' && job.hiredFreelancerId === currentUser.id && (
                          <span className="badge badge-hired">You're Hired!</span>
                        )}
                      </div>
                    </div>
                    <p className="job-description">{job.description}</p>
                    <div className="job-footer">
                      <span className="job-client">by {job.clientName}</span>
                      <span className="job-budget">${job.budget}</span>
                    </div>
                    {(currentUser.role === 'Admin' || currentUser.id === job.clientId) && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteJob(job.id); }}
                        className="delete-btn"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Proposals Panel */}
          <div className="panel">
            <h2 className="panel-title">
              {selectedJob ? `Proposals for "${selectedJob.title}"` : 'Select a job to view proposals'}
            </h2>

            {selectedJob && currentUser.role === 'Freelancer' && selectedJob.status === 'Open' && (
              <div className="proposal-submit">
                {!showProposalForm ? (
                  <button onClick={() => setShowProposalForm(true)} className="btn-success full-width">
                    📨 Submit Proposal
                  </button>
                ) : (
                  <div className="form-container">
                    <textarea
                      placeholder="Cover Letter"
                      value={proposalForm.coverLetter}
                      onChange={(e) => setProposalForm({...proposalForm, coverLetter: e.target.value})}
                      className="textarea"
                    />
                    <input
                      type="number"
                      placeholder="Your Proposed Budget ($)"
                      value={proposalForm.proposedBudget}
                      onChange={(e) => setProposalForm({...proposalForm, proposedBudget: e.target.value})}
                      className="input"
                    />
                    <input
                      type="text"
                      placeholder="Timeline (e.g., 2 weeks)"
                      value={proposalForm.timeline}
                      onChange={(e) => setProposalForm({...proposalForm, timeline: e.target.value})}
                      className="input"
                    />
                    <div className="btn-group">
                      <button onClick={handleCreateProposal} className="btn-success">Submit</button>
                      <button onClick={() => setShowProposalForm(false)} className="btn-secondary">Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="proposal-list">
              {!selectedJob ? (
                <p className="empty-state">No job selected</p>
              ) : proposals.length === 0 ? (
                <p className="empty-state">No proposals yet</p>
              ) : (
                proposals.map(proposal => (
                  <div key={proposal.id} className="proposal-card">
                    <div className="proposal-header">
                      <div>
                        <h4>{proposal.freelancerName}</h4>
                        <span className={`badge ${
                          proposal.status === 'Pending' ? 'badge-warning' :
                          proposal.status === 'Accepted' ? 'badge-success' : 'badge-danger'
                        }`}>
                          {proposal.status}
                        </span>
                      </div>
                      <div className="proposal-info">
                        <div className="proposal-budget">${proposal.proposedBudget}</div>
                        <div className="proposal-timeline">{proposal.timeline}</div>
                      </div>
                    </div>
                    <p className="proposal-text">{proposal.coverLetter}</p>
                    
                    {currentUser.role === 'Client' && currentUser.id === selectedJob.clientId && proposal.status === 'Pending' && (
                      <div className="btn-group">
                        <button onClick={() => handleAcceptProposal(proposal.id)} className="btn-success-sm">
                          ✅ Accept
                        </button>
                        <button onClick={() => handleRejectProposal(proposal.id)} className="btn-danger-sm">
                          ❌ Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;