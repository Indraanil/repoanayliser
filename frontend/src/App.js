import React, { useState, useEffect } from 'react';
import './App.css';
import AnalyzeRepo from './components/AnalyzeRepo';
import PatternDetection from './components/PatternDetection';
import CouplingAnalysis from './components/CouplingAnalysis';
import ArchitectureView from './components/ArchitectureView';
import DependencyGraph from './components/DependencyGraph';
import FunctionGraph from './components/FunctionGraph';
import FunctionAnalysis from './components/FunctionAnalysis';
import RepositoryManager from './components/RepositoryManager';
import SnapshotComparison from './components/SnapshotComparison';
import BlastRadius from './components/BlastRadius';
import CodeHealth from './components/CodeHealth';
import WorkflowExplorer from './components/WorkflowExplorer';
import ChatAssistant from './components/ChatAssistant';
import HRPortal from './components/HRPortal';
import { api } from './services/api';

const repositoryLabel = (result, source) => {
  const explicit = result?.repo_name || result?.repository_name || result?.name;
  if (explicit) return explicit;

  const raw = source || result?.repo_url || result?.repo_path || '';
  const normalized = String(raw).replace(/\\/g, '/').replace(/\/$/, '');
  return normalized.split('/').filter(Boolean).pop()?.replace(/\.git$/i, '') || 'Current repository';
};

function App() {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('architech_theme');
    if (saved) return saved;
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
    return 'dark';
  });
  const [activeTab, setActiveTab] = useState('analyze');
  const [previousTab, setPreviousTab] = useState('analyze');
  const [refreshKey, setRefreshKey] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [currentRepoId, setCurrentRepoId] = useState('eac55829cf3ea1d6');
  const [currentRepoName, setCurrentRepoName] = useState('repoanayliser');
  const [hrUnreadPRs, setHrUnreadPRs] = useState(0);
  const [pendingCommitAnalysis, setPendingCommitAnalysis] = useState(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('architech_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const toggleHRPortal = () => {
    setActiveTab(prev => {
      if (prev === 'hr') {
        return previousTab || 'analyze';
      }
      setPreviousTab(prev);
      return 'hr';
    });
  };

  const handleTabChange = (tabId) => {
    if (activeTab !== 'hr') {
      setPreviousTab(activeTab);
    }
    setActiveTab(tabId);
  };

  const handleAnalysisComplete = (result, source, wasCommitAnalysis = false) => {
    setRefreshKey(prev => prev + 1);
    if (result?.repo_id) {
      setCurrentRepoId(result.repo_id);
      setCurrentRepoName(repositoryLabel(result, source));
    }
    // Route directly to snapshots if analyzing a commit snapshot, or patterns for full repo
    setActiveTab(wasCommitAnalysis ? 'snapshots' : 'patterns');
  };

  const handleAnalyzeCommit = (commitData) => {
    setPendingCommitAnalysis(commitData);
    if (commitData?.repo_id) {
      setCurrentRepoId(commitData.repo_id);
    }
    if (commitData?.repo_name) {
      setCurrentRepoName(commitData.repo_name);
    }
    setPreviousTab('hr');
    setActiveTab('analyze');
  };

  const handleRepoSelect = (repo) => {
    setCurrentRepoId(repo.repo_id);
    setCurrentRepoName(repo.name);
    setRefreshKey(prev => prev + 1);
  };

  const handleRepoDelete = (deletedRepoId) => {
    if (currentRepoId === deletedRepoId) {
      setCurrentRepoId(null);
      setCurrentRepoName(null);
      setRefreshKey(prev => prev + 1);
    }
  };

  // Poll PR notifications count for global header badge
  useEffect(() => {
    const checkPRNotifications = async () => {
      try {
        const res = await api.getHrNotifications();
        if (res.data?.unread_count !== undefined) {
          setHrUnreadPRs(res.data.unread_count);
        }
      } catch {
        // quiet ignore
      }
    };
    checkPRNotifications();
    const interval = setInterval(checkPRNotifications, 12000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const finalText = 'ARCHITECH';
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*';
    let iteration = 0;

    const interval = setInterval(() => {
      setDisplayText(
        finalText
          .split('')
          .map((letter, index) => {
            if (index < iteration) {
              return finalText[index];
            }
            return chars[Math.floor(Math.random() * chars.length)];
          })
          .join('')
      );

      if (iteration >= finalText.length) {
        clearInterval(interval);
      }

      iteration += 1 / 3;
    }, 30);

    return () => clearInterval(interval);
  }, []);

  const tabs = [
    { id: 'analyze', label: 'Analyze', icon: '◈' },
    { id: 'workflows', label: 'Workflows', icon: '⇄' },
    { id: 'architecture', label: 'Architecture', icon: '△' },
    { id: 'graph', label: 'File Graph', icon: '⬢' },
    { id: 'blast-radius', label: 'Blast Radius', icon: '◎' },
    { id: 'patterns', label: 'Patterns', icon: '◬' },
    { id: 'coupling', label: 'Coupling', icon: '⬡' },
    { id: 'functions', label: 'Functions', icon: 'ƒ' },
    { id: 'health', label: 'Unused', icon: '○' },
    { id: 'function-graph', label: 'Fn Graph', icon: '⬣' },
    { id: 'repositories', label: 'Repos', icon: '▦' },
    { id: 'snapshots', label: 'Snapshots', icon: '❐' }
  ];

  return (
    <div style={styles.app}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div style={styles.headerLeft}>
            <h1 style={styles.title}>{displayText}</h1>
            <p style={styles.subtitle}>Architectural Recovery & Semantic Synthesis</p>
          </div>
          <div className="header-meta-group">
            {currentRepoName && (
              <button
                className={`header-meta-btn ${activeTab === 'repositories' ? 'active' : ''}`}
                onClick={() => handleTabChange('repositories')}
                title="View Repositories"
              >
                <span style={styles.repoDot}></span>
                <span className="header-meta-label">{currentRepoName}</span>
              </button>
            )}

            {currentRepoName && <div className="header-nav-divider" />}

            <button
              className={`header-meta-btn ${activeTab === 'hr' ? 'active' : ''}`}
              onClick={toggleHRPortal}
              title={activeTab === 'hr' ? "Exit HR Activity Portal" : "Open HR & Engineering Activity Portal"}
            >
              <span className="header-meta-icon" style={{ color: 'var(--text-muted)' }}>👤</span>
              <span className="header-meta-label">HR Activity</span>
              {hrUnreadPRs > 0 && (
                <span className="header-hr-badge">
                  {hrUnreadPRs}
                </span>
              )}
            </button>

            <div className="header-nav-divider" />

            {/* Light / Dark Mode Toggle */}
            <button
              id="theme-toggle-btn"
              className="header-meta-btn"
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle light or dark mode"
            >
              <span className="header-meta-icon" style={{ fontSize: '13px', lineHeight: 1 }}>
                {theme === 'dark' ? '☀️' : '🌙'}
              </span>
              <span className="header-meta-label">
                {theme === 'dark' ? 'Light' : 'Dark'}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav style={styles.nav}>
        <div style={styles.navInner}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              style={{
                ...styles.tab,
                ...(activeTab === tab.id ? styles.activeTab : {}),
                position: 'relative'
              }}
            >
              <span style={styles.tabIcon}>{tab.icon}</span>
              {tab.label}
              {tab.badge > 0 && (
                <span style={{
                  background: 'rgba(244, 63, 94, 0.15)',
                  color: '#fda4af',
                  border: '1px solid rgba(244, 63, 94, 0.3)',
                  fontSize: '9px',
                  fontWeight: 600,
                  padding: '1px 5px',
                  borderRadius: '9999px',
                  marginLeft: '6px'
                }}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main style={styles.main}>
        <div className="fade-in" key={activeTab + refreshKey + theme}>
          {activeTab === 'hr' && (
            <HRPortal
              key={refreshKey}
              onSelectRepo={handleRepoSelect}
              onSelectTab={(tabId) => {
                setPreviousTab('analyze');
                setActiveTab(tabId);
              }}
              onAnalyzeCommit={handleAnalyzeCommit}
            />
          )}
          {activeTab === 'analyze' && (
            <AnalyzeRepo
              onAnalysisComplete={(result, source) => {
                const wasCommit = !!pendingCommitAnalysis;
                setPendingCommitAnalysis(null);
                handleAnalysisComplete(result, source, wasCommit);
              }}
              pendingCommitAnalysis={pendingCommitAnalysis}
              onClearPendingCommit={() => setPendingCommitAnalysis(null)}
            />
          )}
          {activeTab === 'repositories' && (
            <RepositoryManager
              key={refreshKey}
              onRepoSelect={handleRepoSelect}
              onRepoDelete={handleRepoDelete}
            />
          )}
          {activeTab === 'patterns' && <PatternDetection key={refreshKey} repoId={currentRepoId} />}
          {activeTab === 'coupling' && <CouplingAnalysis key={refreshKey} repoId={currentRepoId} />}
          {activeTab === 'blast-radius' && <BlastRadius key={refreshKey} repoId={currentRepoId} />}
          {activeTab === 'functions' && <FunctionAnalysis key={refreshKey} repoId={currentRepoId} />}
          {activeTab === 'workflows' && <WorkflowExplorer key={refreshKey} repoId={currentRepoId} />}
          {activeTab === 'health' && <CodeHealth key={refreshKey} repoId={currentRepoId} />}
          {activeTab === 'architecture' && <ArchitectureView key={refreshKey} repoId={currentRepoId} theme={theme} />}
          {activeTab === 'graph' && <DependencyGraph key={refreshKey} repoId={currentRepoId} theme={theme} />}
          {activeTab === 'function-graph' && <FunctionGraph key={refreshKey} repoId={currentRepoId} theme={theme} />}
          {activeTab === 'snapshots' && currentRepoId && <SnapshotComparison key={refreshKey} repoId={currentRepoId} />}
          {activeTab === 'snapshots' && !currentRepoId && (
            <div style={styles.emptyState}>
              <span style={{ fontSize: '32px', marginBottom: '12px', display: 'block' }}>▦</span>
              Select a repository first from the Repos tab
            </div>
          )}
        </div>
      </main>

      <ChatAssistant
        key={currentRepoId || 'no-repository'}
        repoId={currentRepoId}
        repoName={currentRepoName}
      />

    </div>
  );
}

const styles = {
  app: {
    minHeight: '100vh',
    background: 'var(--bg-primary)',
    fontFamily: 'var(--font-sans)',
    color: 'var(--text-primary)',
  },
  header: {
    borderBottom: '1px solid var(--border)',
    backdropFilter: 'blur(12px)',
    background: 'var(--header-bg)',
    position: 'sticky',
    top: 0,
    zIndex: 50,
    transition: 'background-color 0.25s ease, border-color 0.25s ease',
  },
  headerInner: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '20px 32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {},
  title: {
    margin: 0,
    fontSize: '35px',
    fontFamily: 'var(--font-mono)',
    fontWeight: 600,
    letterSpacing: '4px',
    color: 'var(--text-primary)',
  },
  subtitle: {
    margin: '4px 0 0',
    fontSize: '13px',
    color: 'var(--text-muted)',
    fontWeight: 400,
    letterSpacing: '0.5px',
  },
  repoIndicator: {
    padding: '6px 14px',
    background: 'var(--accent-glow)',
    border: '1px solid var(--border)',
    borderRadius: '20px',
    fontSize: '13px',
    color: 'var(--text-secondary)',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  repoDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: 'var(--green)',
    display: 'inline-block',
    boxShadow: '0 0 6px var(--green)',
  },
  nav: {
    borderBottom: '1px solid var(--border)',
    background: 'var(--nav-bg)',
    backdropFilter: 'blur(8px)',
    position: 'sticky',
    top: '72px',
    zIndex: 40,
    transition: 'background-color 0.25s ease, border-color 0.25s ease',
  },
  navInner: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '8px 24px',
    display: 'flex',
    gap: '2px',
    overflowX: 'auto',
  },
  tab: {
    padding: '8px 14px',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 500,
    color: 'var(--text-muted)',
    borderRadius: 'var(--radius-sm)',
    transition: 'all 0.2s',
    whiteSpace: 'nowrap',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  activeTab: {
    background: 'var(--bg-elevated)',
    color: 'var(--text-primary)',
    boxShadow: '0 0 0 1px var(--border)',
  },
  tabIcon: {
    fontSize: '11px',
    opacity: 0.7,
  },
  main: {
    maxWidth: '1400px',
    margin: '24px auto',
    padding: '0 32px',
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    color: 'var(--text-muted)',
    fontSize: '14px',
  },
  footer: {
    textAlign: 'center',
    padding: '20px',
    color: 'var(--text-dim)',
    fontSize: '12px',
    borderTop: '1px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
  },
  footerDot: {
    width: '5px',
    height: '5px',
    borderRadius: '50%',
    background: 'var(--green)',
    display: 'inline-block',
  },
};

export default App;
