// src/App.jsx - Complete Frontend with React Router
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom';
import './App.css';

const API_URL = 'http://localhost:5000/api';

// Role Selection Component
function RoleSelection() {
  const navigate = useNavigate();

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="logo">💼</div>
          <h1>FreelanceHub</h1>
          <p>Select your role to continue</p>
        </div>
        
        <div className="user-list">
          <button onClick={() => navigate('/login/admin')} className="user-button">
            <div>
              <div className="user-name">Admin</div>
              <div className="user-role">Manage platform</div>
            </div>
            <span className="user-icon">👑</span>
          </button>
          
          <button onClick={() => navigate('/login/client')} className="user-button">
            <div>
              <div className="user-name">Client</div>
              <div className="user-role">Post jobs</div>
            </div>
            <span className="user-icon">💼</span>
          </button>
          
          <button onClick={() => navigate('/login/freelancer')} className="user-button">
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

// Login Component
function Login() {
  const { role } = useParams();
  const navigate = useNavigate();
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerMode, setRegisterMode] = useState(false);
  const [registerForm, setRegisterForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');

  const selectedRole = role.charAt(0).toUpperCase() + role.slice(1);

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
        localStorage.setItem('currentUser', JSON.stringify(data));
        navigate('/dashboard');
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
        localStorage.setItem('currentUser', JSON.stringify(data));
        navigate('/dashboard');
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      setError('Connection error. Make sure backend is running.');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <button onClick={() => navigate('/')} className="back-btn">
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
            {selectedRole === 'Client' && <p>Register a new account</p>}
            {selectedRole === 'Freelancer' && <p>Register a new account</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

// Protected Route Wrapper
function ProtectedRoute({ children }) {
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
  
  if (!currentUser) {
    return <Navigate to="/" replace />;
  }
  
  return children;
}

// Main Dashboard Component
function Dashboard() {
  const navigate = useNavigate();
  const [currentUser] = useState(() => JSON.parse(localStorage.getItem('currentUser')));
  const [view, setView] = useState('jobs');
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [showJobForm, setShowJobForm] = useState(false);
  const [showProposalForm, setShowProposalForm] = useState(false);
  const [jobForm, setJobForm] = useState({ title: '', description: '', budget: '', status: 'Active' });
  const [proposalForm, setProposalForm] = useState({ coverLetter: '', proposedBudget: '', timeline: '' });
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [activityLogs, setActivityLogs] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (currentUser) {
      loadJobs();
      loadNotifications();
      if (currentUser.role === 'Admin') {
        loadUsers();
        loadStats();
        loadActivityLogs();
      }
    }
  }, [currentUser]);

  useEffect(() => {
    if (selectedJob) loadProposals(selectedJob._id);
  }, [selectedJob]);

  useEffect(() => {
    if (currentUser) {
      const interval = setInterval(loadNotifications, 10000);
      return () => clearInterval(interval);
    }
  }, [currentUser]);

  const loadJobs = async () => {
    try {
      const res = await fetch(`${API_URL}/jobs?userId=${currentUser.id}&role=${currentUser.role}`);
      setJobs(await res.json());
    } catch (err) {
      console.error('Error loading jobs:', err);
    }
  };

  const loadProposals = async (jobId) => {
    try {
      const res = await fetch(`${API_URL}/proposals?jobId=${jobId}`);
      setProposals(await res.json());
    } catch (err) {
      console.error('Error loading proposals:', err);
    }
  };

  const loadUsers = async () => {
    try {
      const res = await fetch(`${API_URL}/users`);
      setUsers(await res.json());
    } catch (err) {
      console.error('Error loading users:', err);
    }
  };

  const loadStats = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/stats`);
      setStats(await res.json());
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  const loadActivityLogs = async () => {
    try {
      const res = await fetch(`${API_URL}/activity-logs?limit=50`);
      setActivityLogs(await res.json());
    } catch (err) {
      console.error('Error loading activity logs:', err);
    }
  };

  const loadNotifications = async () => {
    try {
      const res = await fetch(`${API_URL}/notifications/${currentUser.id}`);
      const data = await res.json();
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.isRead).length);
    } catch (err) {
      console.error('Error loading notifications:', err);
    }
  };

  const markNotificationRead = async (notificationId) => {
    try {
      await fetch(`${API_URL}/notifications/${notificationId}/read`, { method: 'PUT' });
      loadNotifications();
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const markAllRead = async () => {
    try {
      await fetch(`${API_URL}/notifications/read-all/${currentUser.id}`, { method: 'PUT' });
      loadNotifications();
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const handleCreateJob = async () => {
    if (!jobForm.title || !jobForm.description || !jobForm.budget) return;
    try {
      const res = await fetch(`${API_URL}/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...jobForm, clientId: currentUser.id, clientName: currentUser.name })
      });
      if (res.ok) {
        setJobForm({ title: '', description: '', budget: '', status: 'Active' });
        setShowJobForm(false);
        loadJobs();
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const handleUpdateJobStatus = async (jobId, newStatus) => {
    try {
      const res = await fetch(`${API_URL}/jobs/${jobId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, userId: currentUser.id, userName: currentUser.name })
      });
      if (res.ok) {
        loadJobs();
        if (selectedJob && selectedJob._id === jobId) {
          setSelectedJob(await res.json());
        }
      }
    } catch (err) {
      console.error('Error:', err);
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
          jobId: selectedJob._id,
          freelancerId: currentUser.id,
          freelancerName: currentUser.name
        })
      });
      const data = await res.json();
      if (res.ok) {
        setProposalForm({ coverLetter: '', proposedBudget: '', timeline: '' });
        setShowProposalForm(false);
        loadProposals(selectedJob._id);
      } else {
        alert(data.error || 'Error submitting proposal');
      }
    } catch (err) {
      alert('Error submitting proposal');
    }
  };

  const handleAcceptProposal = async (proposalId) => {
    try {
      const res = await fetch(`${API_URL}/proposals/${proposalId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        loadProposals(selectedJob._id);
        loadJobs();
        loadNotifications();
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const handleRejectProposal = async (proposalId) => {
    try {
      const res = await fetch(`${API_URL}/proposals/${proposalId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Rejected' })
      });
      if (res.ok) loadProposals(selectedJob._id);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm('Delete this job?')) return;
    try {
      const res = await fetch(`${API_URL}/jobs/${jobId}`, { 
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, userName: currentUser.name })
      });
      if (res.ok) {
        loadJobs();
        if (selectedJob?._id === jobId) setSelectedJob(null);
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Delete this user?')) return;
    try {
      const res = await fetch(`${API_URL}/users/${userId}`, { 
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId: currentUser.id, adminName: currentUser.name })
      });
      if (res.ok) {
        loadUsers();
        loadStats();
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    navigate('/');
  };

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <div className="header-left">
            <span className="logo">💼</span>
            <h1>FreelanceHub</h1>
          </div>
          <nav className="nav-menu">
            <button onClick={() => setView('jobs')} className={`nav-btn ${view === 'jobs' ? 'active' : ''}`}>Jobs</button>
            {currentUser.role === 'Admin' && (
              <>
                <button onClick={() => setView('admin')} className={`nav-btn ${view === 'admin' ? 'active' : ''}`}>Admin</button>
                <button onClick={() => setView('activity')} className={`nav-btn ${view === 'activity' ? 'active' : ''}`}>Activity</button>
              </>
            )}
            <button onClick={() => setView('notifications')} className={`nav-btn ${view === 'notifications' ? 'active' : ''}`}>
              🔔 Notifications {unreadCount > 0 && <span className="badge-count">{unreadCount}</span>}
            </button>
          </nav>
          <div className="header-right">
            <div className="user-info">
              <div className="user-name">{currentUser.name}</div>
              <div className="user-role">{currentUser.role}</div>
            </div>
            <button onClick={handleLogout} className="switch-btn">Logout</button>
          </div>
        </div>
      </header>

      <div className="main-content">
        {view === 'jobs' && (
          <div className="grid">
            <div className="panel">
              <div className="panel-header">
                <h2>Available Jobs</h2>
                {currentUser.role === 'Client' && (
                  <button onClick={() => setShowJobForm(!showJobForm)} className="btn-primary">➕ Post Job</button>
                )}
              </div>
              {showJobForm && currentUser.role === 'Client' && (
                <div className="form-container">
                  <input type="text" placeholder="Job Title" value={jobForm.title} onChange={(e) => setJobForm({...jobForm, title: e.target.value})} className="input" />
                  <textarea placeholder="Job Description" value={jobForm.description} onChange={(e) => setJobForm({...jobForm, description: e.target.value})} className="textarea" />
                  <input type="number" placeholder="Budget ($)" value={jobForm.budget} onChange={(e) => setJobForm({...jobForm, budget: e.target.value})} className="input" min="1" step="1" />
                  <select value={jobForm.status} onChange={(e) => setJobForm({...jobForm, status: e.target.value})} className="input">
                    <option value="Draft">Draft</option>
                    <option value="Active">Active (Visible to Freelancers)</option>
                  </select>
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
                    <div key={job._id} onClick={() => setSelectedJob(job)} className={`job-card ${selectedJob?._id === job._id ? 'selected' : ''}`}>
                      <div className="job-header">
                        <h3>{job.title}</h3>
                        <div className="job-badges">
                          <span className={`badge badge-${job.status.toLowerCase().replace(' ', '-')}`}>{job.status}</span>
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
                      {currentUser.role === 'Client' && currentUser.id === job.clientId && (
                        <div className="job-actions">
                          {job.status === 'Draft' && <button onClick={(e) => { e.stopPropagation(); handleUpdateJobStatus(job._id, 'Active'); }} className="action-btn-sm">Publish</button>}
                          {job.status === 'In Progress' && <button onClick={(e) => { e.stopPropagation(); handleUpdateJobStatus(job._id, 'Completed'); }} className="action-btn-sm">Mark Complete</button>}
                          <button onClick={(e) => { e.stopPropagation(); handleDeleteJob(job._id); }} className="delete-btn">Delete</button>
                        </div>
                      )}
                      {currentUser.role === 'Admin' && <button onClick={(e) => { e.stopPropagation(); handleDeleteJob(job._id); }} className="delete-btn">Delete</button>}
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="panel">
              <h2 className="panel-title">{selectedJob ? `Proposals for "${selectedJob.title}"` : 'Select a job to view proposals'}</h2>
              {selectedJob && currentUser.role === 'Freelancer' && selectedJob.status === 'Active' && (
                <div className="proposal-submit">
                  {!showProposalForm ? (
                    <button onClick={() => setShowProposalForm(true)} className="btn-success full-width">📨 Submit Proposal</button>
                  ) : (
                    <div className="form-container">
                      <textarea placeholder="Cover Letter" value={proposalForm.coverLetter} onChange={(e) => setProposalForm({...proposalForm, coverLetter: e.target.value})} className="textarea" />
                      <input type="number" placeholder="Your Proposed Budget ($)" value={proposalForm.proposedBudget} onChange={(e) => setProposalForm({...proposalForm, proposedBudget: e.target.value})} className="input" min="1" step="1" />
                      <input type="text" placeholder="Timeline (e.g., 2 weeks)" value={proposalForm.timeline} onChange={(e) => setProposalForm({...proposalForm, timeline: e.target.value})} className="input" />
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
                    <div key={proposal._id} className="proposal-card">
                      <div className="proposal-header">
                        <div>
                          <h4>{proposal.freelancerName}</h4>
                          <span className={`badge ${proposal.status === 'Pending' ? 'badge-warning' : proposal.status === 'Accepted' ? 'badge-success' : 'badge-danger'}`}>{proposal.status}</span>
                        </div>
                        <div className="proposal-info">
                          <div className="proposal-budget">${proposal.proposedBudget}</div>
                          <div className="proposal-timeline">{proposal.timeline}</div>
                        </div>
                      </div>
                      <p className="proposal-text">{proposal.coverLetter}</p>
                      {currentUser.role === 'Client' && currentUser.id === selectedJob.clientId && proposal.status === 'Pending' && (
                        <div className="btn-group">
                          <button onClick={() => handleAcceptProposal(proposal._id)} className="btn-success-sm">✅ Accept</button>
                          <button onClick={() => handleRejectProposal(proposal._id)} className="btn-danger-sm">❌ Reject</button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {view === 'admin' && currentUser.role === 'Admin' && (
          <div className="admin-container">
            <h2 className="section-title">Admin Dashboard</h2>
            {stats && (
              <div className="stats-grid">
                <div className="stat-card"><div className="stat-value">{stats.totalUsers}</div><div className="stat-label">Total Users</div></div>
                <div className="stat-card"><div className="stat-value">{stats.totalJobs}</div><div className="stat-label">Total Jobs</div></div>
                <div className="stat-card"><div className="stat-value">{stats.totalProposals}</div><div className="stat-label">Total Proposals</div></div>
                <div className="stat-card"><div className="stat-value">{stats.activeJobs}</div><div className="stat-label">Active Jobs</div></div>
              </div>
            )}
            <div className="admin-section">
              <h3>User Management</h3>
              <div className="user-table">
                <table>
                  <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Actions</th></tr></thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user._id}>
                        <td>{user.name}</td>
                        <td>{user.email}</td>
                        <td><span className="role-badge">{user.role}</span></td>
                        <td>{user._id !== currentUser.id && <button onClick={() => handleDeleteUser(user._id)} className="btn-danger-sm">Delete</button>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {view === 'activity' && currentUser.role === 'Admin' && (
          <div className="activity-container">
            <h2 className="section-title">Activity Log</h2>
            <div className="activity-list">
              {activityLogs.map(log => (
                <div key={log._id} className="activity-item">
                  <div className="activity-icon">📝</div>
                  <div className="activity-content">
                    <div className="activity-user">{log.userName}</div>
                    <div className="activity-action">{log.action}</div>
                    <div className="activity-details">{log.details}</div>
                    <div className="activity-time">{new Date(log.timestamp).toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'notifications' && (
          <div className="notifications-container">
            <div className="notifications-header">
              <h2>Notifications</h2>
              {unreadCount > 0 && <button onClick={markAllRead} className="btn-secondary">Mark All Read</button>}
            </div>
            <div className="notifications-list">
              {notifications.length === 0 ? (
                <p className="empty-state">No notifications</p>
              ) : (
                notifications.map(notif => (
                  <div key={notif._id} className={`notification-item ${notif.isRead ? 'read' : 'unread'}`} onClick={() => !notif.isRead && markNotificationRead(notif._id)}>
                    <div className="notification-icon">
                      {notif.type === 'proposal' && '📨'}
                      {notif.type === 'acceptance' && '✅'}
                      {notif.type === 'rejection' && '❌'}
                      {notif.type === 'job_posted' && '💼'}
                    </div>
                    <div className="notification-content">
                      <div className="notification-message">{notif.message}</div>
                      <div className="notification-time">{new Date(notif.createdAt).toLocaleString()}</div>
                    </div>
                    {!notif.isRead && <div className="unread-dot"></div>}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RoleSelection />} />
        <Route path="/login/:role" element={<Login />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;