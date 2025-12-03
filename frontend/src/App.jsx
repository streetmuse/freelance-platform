
import React, { useState, useEffect } from 'react';
import './App.css';

const API_URL = 'http://localhost:5000/api';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [showJobForm, setShowJobForm] = useState(false);
  const [showProposalForm, setShowProposalForm] = useState(false);
  
  const [jobForm, setJobForm] = useState({ title: '', description: '', budget: '' });
  const [proposalForm, setProposalForm] = useState({ coverLetter: '', proposedBudget: '', timeline: '' });

  // Load users on mount
  useEffect(() => {
    fetch(`${API_URL}/users`)
      .then(res => res.json())
      .then(data => setUsers(data))
      .catch(err => console.error('Error loading users:', err));
  }, []);

  useEffect(() => {
    if (currentUser) loadJobs();
  }, [currentUser]);

  useEffect(() => {
    if (selectedJob) loadProposals(selectedJob.id);
  }, [selectedJob]);

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

  if (!currentUser) {
    return (
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <div className="logo">💼</div>
            <h1>FreelanceHub</h1>
            <p>Select your role to continue</p>
          </div>
          
          <div className="user-list">
            {users.map(user => (
              <button
                key={user.id}
                onClick={() => setCurrentUser(user)}
                className="user-button"
              >
                <div>
                  <div className="user-name">{user.name}</div>
                  <div className="user-role">{user.role}</div>
                </div>
                <span className="user-icon">{
                  user.role === 'Admin' ? '👑' : 
                  user.role === 'Client' ? '💼' : '👨‍💻'
                }</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

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
            <button onClick={() => setCurrentUser(null)} className="switch-btn">
              Switch User
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