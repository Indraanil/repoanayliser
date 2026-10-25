import React, { useState, useEffect, useCallback } from 'react';
import './HRPortal.css';
import { api } from '../services/api';

// ==============================================================================
// Minimalist, Subtle SVG Icons (replacing neon emojis)
// ==============================================================================
function IconUsers({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function IconCommit({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <line x1="1.05" y1="12" x2="7" y2="12" />
      <line x1="17.01" y1="12" x2="22.96" y2="12" />
    </svg>
  );
}

function IconPR({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="18" r="3" />
      <circle cx="6" cy="6" r="3" />
      <path d="M13 6h3a2 2 0 0 1 2 2v7" />
      <line x1="6" y1="9" x2="6" y2="21" />
    </svg>
  );
}

function IconLayers({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  );
}

function IconBell({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function IconSearch({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function IconRefresh({ size = 13 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  );
}

function IconArrowLeft({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

function IconShield({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

export default function HRPortal({ onSelectRepo, onSelectTab, onAnalyzeCommit }) {
  // Authentication State
  const [hrUser, setHrUser] = useState(() => {
    try {
      const stored = localStorage.getItem('architech_hr_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Data State
  const [contributors, setContributors] = useState([]);
  const [loadingContributors, setLoadingContributors] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProjectFilter, setSelectedProjectFilter] = useState('all');

  // Selected Contributor Commit History State
  const [selectedDev, setSelectedDev] = useState(null);
  const [devCommits, setDevCommits] = useState([]);
  const [loadingCommits, setLoadingCommits] = useState(false);
  const [commitFilterRepo, setCommitFilterRepo] = useState('all');

  // PR Notifications State
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showTray, setShowTray] = useState(true);

  // Commit Analysis Modal State
  const [activeAnalysis, setActiveAnalysis] = useState(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);

  // Load Notifications
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.getHrNotifications();
      if (res.data) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unread_count || 0);
      }
    } catch (err) {
      console.warn('Failed to fetch HR notifications:', err);
    }
  }, []);

  // Load Contributors
  const fetchContributors = useCallback(async () => {
    setLoadingContributors(true);
    try {
      const res = await api.getHrContributors();
      setContributors(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to load HR contributors:', err);
    } finally {
      setLoadingContributors(false);
    }
  }, []);

  useEffect(() => {
    if (hrUser) {
      fetchContributors();
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 15000);
      return () => clearInterval(interval);
    }
  }, [hrUser, fetchContributors, fetchNotifications]);

  // Handle Login
  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    if (!loginEmail.trim()) {
      setLoginError('Please enter corporate email or username');
      return;
    }
    setLoginLoading(true);
    setLoginError('');
    try {
      const res = await api.hrLogin(loginEmail, loginPassword);
      if (res.data && res.data.user) {
        localStorage.setItem('architech_hr_user', JSON.stringify(res.data.user));
        localStorage.setItem('architech_hr_token', res.data.token);
        setHrUser(res.data.user);
      } else {
        setLoginError('Authentication failed. Check credentials.');
      }
    } catch (err) {
      setLoginError(err.response?.data?.message || 'Login request failed. Server error.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleQuickDemoLogin = async () => {
    setLoginEmail('hr@architech.io');
    setLoginPassword('admin');
    setLoginLoading(true);
    setLoginError('');
    try {
      const res = await api.hrLogin('hr@architech.io', 'admin');
      if (res.data && res.data.user) {
        localStorage.setItem('architech_hr_user', JSON.stringify(res.data.user));
        localStorage.setItem('architech_hr_token', res.data.token);
        setHrUser(res.data.user);
      }
    } catch (err) {
      setLoginError('Demo login failed. Server error.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('architech_hr_user');
    localStorage.removeItem('architech_hr_token');
    setHrUser(null);
    setSelectedDev(null);
    setDevCommits([]);
  };

  // Inspect Developer Commits
  const handleInspectDev = async (dev) => {
    setSelectedDev(dev);
    setCommitFilterRepo('all');
    setLoadingCommits(true);
    try {
      const res = await api.getHrDeveloperCommits(dev.developer_id);
      setDevCommits(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to load commits for developer:', err);
    } finally {
      setLoadingCommits(false);
    }
  };

  // Analyze a Commit
  const handleAnalyzeCommit = async (repoId, commitHash) => {
    setLoadingAnalysis(true);
    setAnalysisError(null);
    setActiveAnalysis(null);
    try {
      const res = await api.getHrCommitAnalysis(repoId, commitHash);
      if (res.data && !res.data.error) {
        setActiveAnalysis(res.data);
      } else {
        setAnalysisError(res.data?.error || 'Failed to extract commit metrics');
      }
    } catch (err) {
      setAnalysisError(err.response?.data?.detail || err.message || 'Error running commit analysis');
    } finally {
      setLoadingAnalysis(false);
    }
  };

  // Mark notification read
  const handleMarkRead = async (notifId, e) => {
    if (e) e.stopPropagation();
    try {
      await api.markHrNotificationRead(notifId);
      setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification read:', err);
    }
  };

  // Simulate New PR
  const handleSimulatePR = async () => {
    const repos = ['repoanayliser', 'ai-task-planner', 'attendance-backend'];
    const titles = [
      'feat: add cross-project velocity telemetry',
      'refactor: optimize token caching in AST graph',
      'fix: prevent race condition in notification queue',
      'perf: streamline dependency cycle traversal'
    ];
    const authors = [
      { name: 'NHR-09', email: 'NHR-09@users.noreply.github.com' },
      { name: 'Krishna-yamsalwar', email: 'yamsalwarkrishna.dev@gmail.com' },
      { name: 'Gourav Kumar Dhiman', email: 'gkrdhiman@gmail.com' }
    ];
    const randRepo = repos[Math.floor(Math.random() * repos.length)];
    const randTitle = titles[Math.floor(Math.random() * titles.length)];
    const randAuthor = authors[Math.floor(Math.random() * authors.length)];

    try {
      const res = await api.createHrPRNotification({
        repo_name: randRepo,
        pr_number: Math.floor(Math.random() * 20) + 5,
        title: randTitle,
        author: randAuthor.name,
        author_email: randAuthor.email,
        source_branch: `feature/${randTitle.split(' ')[1] || 'update'}`,
        target_branch: 'main',
        status: 'open',
        description: 'Automated PR submitted for review.',
        changed_files_count: Math.floor(Math.random() * 8) + 2,
        impact_level: Math.random() > 0.5 ? 'high' : 'medium'
      });
      if (res.data?.notification) {
        setNotifications(prev => [res.data.notification, ...prev]);
        setUnreadCount(prev => prev + 1);
      }
    } catch (err) {
      console.error('Failed to simulate PR:', err);
    }
  };

  // Unique project list across all contributors
  const allProjects = Array.from(
    new Set(
      contributors.flatMap(c => (c.projects || []).map(p => p.repo_name))
    )
  );

  // Filtered contributors
  const filteredContributors = contributors.filter(c => {
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = !query ||
      c.developer.toLowerCase().includes(query) ||
      c.email.toLowerCase().includes(query) ||
      (c.projects || []).some(p => p.repo_name.toLowerCase().includes(query));

    const matchesProject = selectedProjectFilter === 'all' ||
      (c.projects || []).some(p => p.repo_name === selectedProjectFilter);

    return matchesSearch && matchesProject;
  });

  // Filtered commits for selected dev
  const filteredCommits = devCommits.filter(c => {
    if (commitFilterRepo === 'all') return true;
    return c.repo_name === commitFilterRepo;
  });

  // Calculate totals
  const totalCommitsAcrossAll = contributors.reduce((acc, c) => acc + (c.total_commits || 0), 0);

  // ============================================================================
  // Render: 1. Login Gate
  // ============================================================================
  if (!hrUser) {
    return (
      <div className="hr-container">
        <div className="hr-login-overlay">
          <div className="hr-login-card">
            <div className="hr-login-header">
              <div className="hr-brand-badge">
                <IconShield size={13} />
                <span>ARCHITECH TALENT OPERATIONS</span>
              </div>
              <h2 className="hr-login-title">HR & Engineering Activity</h2>
              <p className="hr-login-subtitle">
                Access cross-repository developer activity, multi-project commit timelines, and review open Pull Requests.
              </p>
            </div>

            {loginError && (
              <div style={{
                background: 'rgba(244, 63, 94, 0.08)',
                border: '1px solid rgba(244, 63, 94, 0.25)',
                color: '#fb7185',
                padding: '9px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                marginBottom: '14px'
              }}>
                {loginError}
              </div>
            )}

            <form className="hr-login-form" onSubmit={handleLogin}>
              <div className="hr-input-group">
                <label>Corporate Email or Username</label>
                <input
                  type="text"
                  className="hr-input"
                  placeholder="hr@architech.io or sarah.chen"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                />
              </div>

              <div className="hr-input-group">
                <label>Access Key / Password</label>
                <input
                  type="password"
                  className="hr-input"
                  placeholder="••••••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="hr-btn-primary"
                disabled={loginLoading}
              >
                {loginLoading ? 'Authenticating...' : 'Sign in to Console →'}
              </button>
            </form>

            <div className="hr-demo-login-box">
              <button
                type="button"
                className="hr-demo-btn"
                onClick={handleQuickDemoLogin}
                disabled={loginLoading}
              >
                Quick Demo Login as HR Lead (hr@architech.io)
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // Render: 2. Authenticated HR Management Dashboard
  // ============================================================================
  return (
    <div className="hr-container">
      {/* Top Bar with HR Role & Session Controls */}
      <div className="hr-topbar">
        <div className="hr-user-info">
          <div className="hr-avatar">
            {hrUser.name ? hrUser.name.slice(0, 2).toUpperCase() : 'HR'}
          </div>
          <div className="hr-user-details">
            <h3>{hrUser.name || 'HR Operations Lead'}</h3>
            <p>
              <span>{hrUser.email}</span>
              <span className="hr-role-tag">Enterprise HR</span>
            </p>
          </div>
        </div>

        <div className="hr-top-actions">
          <button
            className={`hr-notif-btn ${showTray ? 'active' : ''}`}
            onClick={() => setShowTray(!showTray)}
            title="Toggle Pull Request Notifications"
          >
            <IconBell size={14} />
            <span>PR Notifications</span>
            {unreadCount > 0 && (
              <span className="hr-badge-count">{unreadCount}</span>
            )}
          </button>

          <button
            className="hr-logout-btn"
            onClick={handleLogout}
            title="Exit HR Session"
          >
            Sign out
          </button>
        </div>
      </div>

      {/* PR Notifications Tray */}
      {showTray && (
        <div className="hr-pr-tray">
          <div className="hr-tray-header">
            <h4>
              <IconPR size={15} />
              <span>Pull Request Activity ({notifications.length} Total, {unreadCount} Unread)</span>
            </h4>
            <div className="hr-tray-actions">
              <button
                className="hr-btn-sim"
                onClick={handleSimulatePR}
                title="Simulate a newly submitted PR"
              >
                + Simulate New PR
              </button>
              <button
                className="hr-btn-link"
                onClick={fetchNotifications}
                title="Refresh notifications"
              >
                <IconRefresh size={12} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          <div className="hr-pr-list">
            {notifications.length === 0 ? (
              <div style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '12px', textAlign: 'center' }}>
                No active pull requests at this moment.
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`hr-pr-card ${!notif.read ? 'unread' : ''}`}
                >
                  <div className="hr-pr-main">
                    <div className="hr-pr-tags">
                      <span className="hr-repo-badge">{notif.repo_name}</span>
                      <span className="hr-pr-number">PR #{notif.pr_number}</span>
                      <span className={`hr-impact-badge ${notif.impact_level || 'medium'}`}>
                        {notif.impact_level || 'medium'} impact
                      </span>
                      <span className={`hr-status-pill ${notif.status || 'open'}`}>
                        {notif.status}
                      </span>
                    </div>

                    <h5 className="hr-pr-title">{notif.title}</h5>

                    <div className="hr-pr-meta">
                      <span>{notif.author}</span>
                      <span>{notif.source_branch} → {notif.target_branch}</span>
                      <span>{notif.changed_files_count || 3} files altered</span>
                      <span>{new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>

                  <div className="hr-pr-actions">
                    {notif.commit_hash && (
                      <button
                        className="hr-btn-link"
                        onClick={() => handleAnalyzeCommit(notif.repo_id || notif.repo_name, notif.commit_hash)}
                        title="Analyze commit impact of this PR"
                      >
                        <IconCommit size={13} />
                        <span>Analyze Commit</span>
                      </button>
                    )}
                    {!notif.read && (
                      <button
                        className="hr-btn-link"
                        onClick={(e) => handleMarkRead(notif.id, e)}
                        title="Mark as reviewed"
                      >
                        Mark read
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Metric KPI Cards (Subtle, clean, executive layout) */}
      <div className="hr-metrics-grid">
        <div className="hr-metric-card">
          <div className="hr-metric-top">
            <span className="hr-metric-label">Contributors</span>
            <span className="hr-metric-icon-subtle"><IconUsers size={15} /></span>
          </div>
          <span className="hr-metric-value">{contributors.length}</span>
          <span className="hr-metric-subtext">Active engineers across repositories</span>
        </div>

        <div className="hr-metric-card">
          <div className="hr-metric-top">
            <span className="hr-metric-label">Workspace Commits</span>
            <span className="hr-metric-icon-subtle"><IconCommit size={15} /></span>
          </div>
          <span className="hr-metric-value">{totalCommitsAcrossAll}</span>
          <span className="hr-metric-subtext">Across tracked git histories</span>
        </div>

        <div className="hr-metric-card">
          <div className="hr-metric-top">
            <span className="hr-metric-label">Monitored Repositories</span>
            <span className="hr-metric-icon-subtle"><IconLayers size={15} /></span>
          </div>
          <span className="hr-metric-value">{allProjects.length}</span>
          <span className="hr-metric-subtext">Workspace projects indexed</span>
        </div>

        <div className="hr-metric-card">
          <div className="hr-metric-top">
            <span className="hr-metric-label">Pending PR Alerts</span>
            <span className="hr-metric-icon-subtle"><IconBell size={15} /></span>
          </div>
          <span className="hr-metric-value">{unreadCount}</span>
          <span className="hr-metric-subtext">Unreviewed pull requests</span>
        </div>
      </div>

      {/* Main Content: Developer Timeline OR Contributors Directory */}
      {selectedDev ? (
        /* ======================================================================
           3. Selected Developer Multi-Project Commit Timeline
           ====================================================================== */
        <div className="hr-dev-timeline-view">
          <div className="hr-timeline-nav">
            <button
              className="hr-btn-back"
              onClick={() => setSelectedDev(null)}
            >
              <IconArrowLeft size={13} />
              <span>Back to Contributors</span>
            </button>

            <div className="hr-dev-header-profile">
              <div className="hr-dev-avatar-lg">
                {selectedDev.developer.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '15px', color: 'var(--text-primary)', fontWeight: 600 }}>
                  {selectedDev.developer}
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                  {selectedDev.email} • {devCommits.length} commits logged
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Filter:</label>
              <select
                className="hr-select"
                value={commitFilterRepo}
                onChange={(e) => setCommitFilterRepo(e.target.value)}
              >
                <option value="all">All Projects ({devCommits.length})</option>
                {selectedDev.projects && selectedDev.projects.map(p => (
                  <option key={p.repo_name} value={p.repo_name}>
                    {p.repo_name} ({p.commits_count})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="hr-commit-list">
            {loadingCommits ? (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                Loading commit history across repositories...
              </div>
            ) : filteredCommits.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                No commits found matching filter.
              </div>
            ) : (
              filteredCommits.map((commit) => (
                <div key={commit.commit_hash} className="hr-commit-item">
                  <div className="hr-commit-left">
                    <div className="hr-commit-header">
                      <span className="hr-commit-repo-tag">
                        {commit.repo_name}
                      </span>
                      <span className="hr-commit-hash">
                        {commit.short_hash}
                      </span>
                      <span className="hr-commit-date">
                        {commit.date}
                      </span>
                    </div>

                    <p className="hr-commit-msg">{commit.message}</p>
                  </div>

                  <button
                    className="hr-btn-analyze-commit"
                    onClick={() => handleAnalyzeCommit(commit.repo_id, commit.commit_hash)}
                    title="Analyze commit impact and altered files"
                  >
                    <IconCommit size={13} />
                    <span>Analyze Commit</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        /* ======================================================================
           4. Cross-Project Contributors Directory
           ====================================================================== */
        <div>
          <div className="hr-section-header">
            <h3 className="hr-section-title">
              <IconUsers size={16} />
              <span>Cross-Project Contributors</span>
            </h3>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <select
                className="hr-select"
                value={selectedProjectFilter}
                onChange={(e) => setSelectedProjectFilter(e.target.value)}
              >
                <option value="all">All Projects ({allProjects.length})</option>
                {allProjects.map(proj => (
                  <option key={proj} value={proj}>{proj}</option>
                ))}
              </select>

              <div className="hr-search-bar">
                <IconSearch size={13} />
                <input
                  type="text"
                  placeholder="Search contributor by name or repo..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <button
                className="hr-btn-link"
                onClick={fetchContributors}
                title="Refresh contributor logs"
              >
                <IconRefresh size={12} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {loadingContributors ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
              Scanning workspace repositories and aggregating git logs...
            </div>
          ) : filteredContributors.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
              No contributors match your search criteria.
            </div>
          ) : (
            <div className="hr-contributors-grid">
              {filteredContributors.map((c) => (
                <div key={c.developer_id} className="hr-contributor-card">
                  <div className="hr-contributor-top">
                    <div className="hr-dev-profile">
                      <div className="hr-dev-avatar">
                        {c.developer.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="hr-dev-details">
                        <h4>{c.developer}</h4>
                        <p className="hr-dev-email">{c.email}</p>
                      </div>
                    </div>

                    <span className="hr-commits-badge">
                      {c.total_commits} Commits
                    </span>
                  </div>

                  <div className="hr-projects-breakdown">
                    <span className="hr-projects-label">
                      Activity across {c.projects?.length || 1} repositories:
                    </span>
                    <div className="hr-project-chips">
                      {c.projects && c.projects.map((p) => (
                        <div key={p.repo_name} className="hr-project-chip">
                          <span>{p.repo_name}:</span>
                          <strong>{p.commits_count}</strong>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="hr-card-footer">
                    <span className="hr-last-active">
                      Last active: {c.last_active}
                    </span>

                    <button
                      className="hr-btn-view-commits"
                      onClick={() => handleInspectDev(c)}
                    >
                      Inspect Commits →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================
          5. Commit Deep Analysis Modal
          ======================================================================== */}
      {(loadingAnalysis || activeAnalysis || analysisError) && (
        <div className="hr-modal-overlay" onClick={() => { setActiveAnalysis(null); setAnalysisError(null); }}>
          <div className="hr-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="hr-modal-header">
              <h3>
                <IconCommit size={15} />
                <span>Commit Architectural Analysis</span>
              </h3>
              <button
                className="hr-modal-close"
                onClick={() => { setActiveAnalysis(null); setAnalysisError(null); }}
              >
                ✕
              </button>
            </div>

            <div className="hr-modal-body">
              {loadingAnalysis && (
                <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                  Analyzing commit delta and structural impact...
                </div>
              )}

              {analysisError && (
                <div style={{
                  background: 'rgba(244, 63, 94, 0.08)',
                  border: '1px solid rgba(244, 63, 94, 0.25)',
                  color: '#fb7185',
                  padding: '12px 14px',
                  borderRadius: '6px',
                  fontSize: '13px'
                }}>
                  {analysisError}
                </div>
              )}

              {activeAnalysis && (
                <>
                  <div className={`hr-impact-banner ${activeAnalysis.risk_level || 'low'}`}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 600 }}>
                        Risk Assessment: {activeAnalysis.risk_level?.toUpperCase()} (Score: {activeAnalysis.risk_score}/100)
                      </h4>
                      <p style={{ margin: '3px 0 0', fontSize: '12px', opacity: 0.9 }}>
                        {activeAnalysis.architectural_impact}
                      </p>
                    </div>
                  </div>

                  <div className="hr-analysis-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                      <div>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Repository:</span>
                        <div style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: '13px' }}>{activeAnalysis.repo_name}</div>
                      </div>
                      <div>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Commit:</span>
                        <div style={{ fontFamily: 'ui-monospace, SFMono-Regular, monospace', fontSize: '11px', color: 'var(--text-secondary)' }}>
                          {activeAnalysis.commit_hash}
                        </div>
                      </div>
                      <div>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Author:</span>
                        <div style={{ fontSize: '12px', color: 'var(--text-primary)' }}>
                          {activeAnalysis.author} ({activeAnalysis.date})
                        </div>
                      </div>
                    </div>

                    <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>
                      {activeAnalysis.subject}
                    </div>
                  </div>

                  {/* Altered Files Table */}
                  <div className="hr-analysis-card">
                    <h5 style={{ margin: '0 0 10px', fontSize: '13px', color: 'var(--text-primary)', fontWeight: 600 }}>
                      Altered Files ({activeAnalysis.files?.length || 0})
                    </h5>

                    <table className="hr-files-table">
                      <thead>
                        <tr>
                          <th>Status</th>
                          <th>File Path</th>
                          <th>Classification</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeAnalysis.files && activeAnalysis.files.slice(0, 50).map((f, idx) => (
                          <tr key={idx}>
                            <td>
                              <span className={`hr-status-badge ${f.status.toLowerCase()}`}>
                                {f.status}
                              </span>
                            </td>
                            <td style={{ fontFamily: 'ui-monospace, SFMono-Regular, monospace', fontSize: '11px', color: 'var(--text-secondary)' }}>
                              {f.file}
                            </td>
                            <td>
                              {f.is_critical ? (
                                <span className="hr-critical-tag">Core Module</span>
                              ) : (
                                <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Module</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {activeAnalysis.files && activeAnalysis.files.length > 50 && (
                      <div style={{ textAlign: 'center', padding: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>
                        Showing first 50 files of {activeAnalysis.files.length} altered files.
                      </div>
                    )}
                  </div>

                  {/* Git Stat Output */}
                  {activeAnalysis.stat_summary && (
                    <div className="hr-analysis-card">
                      <h5 style={{ margin: '0 0 6px', fontSize: '12px', color: 'var(--text-muted)' }}>
                        Stat Summary
                      </h5>
                      <div className="hr-raw-stat">
                        {activeAnalysis.stat_summary}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="hr-modal-footer">
              {activeAnalysis && (
                <button
                  className="hr-btn-link hr-btn-analyze-commit"
                  id="analyze-this-commit-btn"
                  onClick={() => {
                    const commitPayload = { ...activeAnalysis };
                    setActiveAnalysis(null);
                    setAnalysisError(null);
                    if (onAnalyzeCommit) {
                      onAnalyzeCommit(commitPayload);
                    } else if (onSelectTab) {
                      onSelectTab('analyze');
                    }
                  }}
                  title="Analyze repository architecture at this commit and store snapshot"
                >
                  <span style={{ fontSize: '13px' }}>◈</span>
                  Analyze this Commit →
                </button>
              )}
              <button
                className="hr-btn-primary"
                onClick={() => { setActiveAnalysis(null); setAnalysisError(null); }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
