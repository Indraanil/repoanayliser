import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import MarkdownContent from './MarkdownContent';
import {
  IconArrowsHorizontal,
  IconZap,
  IconGitBranch,
  IconPackage,
  IconDatabase,
  IconGlobe,
  IconAlertTriangle,
  IconDot
} from './Icons';

export default function WorkflowExplorer({ repoId }) {
  const [workflows, setWorkflows] = useState([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [workflowData, setWorkflowData] = useState(null);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingTrace, setLoadingTrace] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [customFunction, setCustomFunction] = useState('');
  const [depth, setDepth] = useState(4);
  const [activeViewTab, setActiveViewTab] = useState('pipeline'); // 'pipeline' | 'sequence' | 'flowchart' | 'sinks'
  const [expandedSteps, setExpandedSteps] = useState({});

  // 1. Load discovered workflows on mount or repo change
  useEffect(() => {
    let cancelled = false;
    setLoadingList(true);
    setError(null);

    api.getWorkflows(repoId)
      .then(res => {
        if (cancelled) return;
        const list = res.data?.workflows || [];
        setWorkflows(list);
        if (list.length > 0 && !selectedWorkflow) {
          handleSelectWorkflow(list[0]);
        }
      })
      .catch(err => {
        if (!cancelled) {
          setError(err.response?.data?.error || err.message || 'Failed to load workflows');
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingList(false);
      });

    return () => { cancelled = true; };
  }, [repoId]);

  // 2. Fetch workflow trace when selected
  const handleSelectWorkflow = (wf) => {
    if (!wf) return;
    setSelectedWorkflow(wf);
    setLoadingTrace(true);
    setError(null);
    setExpandedSteps({});

    api.traceWorkflow(wf.name, repoId, wf.file, depth)
      .then(res => {
        if (res.data?.error) {
          setError(res.data.error);
          setWorkflowData(null);
        } else {
          setWorkflowData(res.data);
        }
      })
      .catch(err => {
        setError(err.response?.data?.error || err.message || 'Failed to trace workflow');
        setWorkflowData(null);
      })
      .finally(() => {
        setLoadingTrace(false);
      });
  };

  const handleCustomTrace = (e) => {
    e.preventDefault();
    if (!customFunction.trim()) return;
    const customWf = {
      name: customFunction.trim(),
      file: null,
      badge: 'Custom Trace',
      category: 'custom',
      description: 'Custom entrypoint lookup'
    };
    handleSelectWorkflow(customWf);
  };

  const toggleStepExpand = (stepNumber) => {
    setExpandedSteps(prev => ({
      ...prev,
      [stepNumber]: !prev[stepNumber]
    }));
  };

  // Filter workflows list
  const filteredWorkflows = useMemo(() => {
    return workflows.filter(wf => {
      const matchCat = categoryFilter === 'all' || wf.category === categoryFilter;
      const matchQuery = !searchQuery || 
        wf.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        wf.file.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchQuery;
    });
  }, [workflows, categoryFilter, searchQuery]);

  const summary = workflowData?.summary || {};
  const steps = workflowData?.steps || [];

  return (
    <div style={styles.container}>
      {/* Top Header */}
      <div style={styles.header}>
        <div>
          <div style={styles.headerTag}>
            <span style={styles.tagIcon}><IconArrowsHorizontal size={13} /></span>
            <span>APPLICATION WORKFLOW & EXECUTION PIPELINE RECOVERY</span>
          </div>
          <h2 style={styles.title}>Execution Workflow Explorer</h2>
          <p style={styles.subtitle}>
            Traces static execution chains from HTTP routes, background workers, and orchestrators down to database sinks.
          </p>
        </div>

        {/* Custom Function Lookup Form */}
        <form onSubmit={handleCustomTrace} style={styles.customTraceForm}>
          <input
            type="text"
            placeholder="Type any function name to trace..."
            value={customFunction}
            onChange={(e) => setCustomFunction(e.target.value)}
            style={styles.customInput}
          />
          <button type="submit" style={styles.traceBtn}>
            Trace Workflow
          </button>
        </form>
      </div>

      {/* Main Two-Column Layout */}
      <div style={styles.layout}>
        {/* Left Column: Workflows Catalog */}
        <div style={styles.leftPanel}>
          {/* Search Box */}
          <div style={styles.searchWrap}>
            <input
              type="text"
              placeholder="Search workflows by function or path..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={styles.searchInput}
            />
          </div>

          {/* Filter Pills */}
          <div className="workflow-pills-wrap" style={styles.pillsWrap}>
            {[
              { id: 'all', label: 'All' },
              { id: 'api_endpoint', label: 'API Routes' },
              { id: 'background_job', label: 'Async Jobs' },
              { id: 'domain_service', label: 'Orchestrators' },
              { id: 'cli_entrypoint', label: 'CLI / Scripts' }
            ].map(pill => (
              <button
                key={pill.id}
                onClick={() => setCategoryFilter(pill.id)}
                style={{
                  ...styles.pillBtn,
                  ...(categoryFilter === pill.id ? styles.pillBtnActive : {})
                }}
              >
                {pill.label}
              </button>
            ))}
          </div>

          {/* Workflow List */}
          <div style={styles.workflowList}>
            {loadingList ? (
              <div style={styles.loadingBox}>
                <span className="spinner" style={styles.spinner}></span>
                <span>Discovering workflows...</span>
              </div>
            ) : filteredWorkflows.length === 0 ? (
              <div style={styles.emptyBox}>No matching workflows found.</div>
            ) : (
              filteredWorkflows.map(wf => {
                const isSelected = selectedWorkflow?.name === wf.name && selectedWorkflow?.file === wf.file;
                return (
                  <div
                    key={wf.id || `${wf.file}::${wf.name}`}
                    onClick={() => handleSelectWorkflow(wf)}
                    style={{
                      ...styles.wfCard,
                      ...(isSelected ? styles.wfCardActive : {})
                    }}
                  >
                    <div style={styles.wfCardHeader}>
                      <span style={{
                        ...styles.catBadge,
                        ...getCategoryBadgeStyle(wf.category)
                      }}>
                        {wf.badge || 'Entrypoint'}
                      </span>
                      {wf.out_degree !== undefined && (
                        <span style={styles.outDegreeBadge} title="Downstream dependencies called">
                          ↓ {wf.out_degree} calls
                        </span>
                      )}
                    </div>
                    <div style={styles.wfName}>{wf.name}</div>
                    <div style={styles.wfFile}>
                      {wf.relative_file || wf.file}:{wf.line}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Workflow Details & Visualizers */}
        <div style={styles.rightPanel}>
          {loadingTrace ? (
            <div style={styles.loadingBoxLarge}>
              <span className="spinner" style={styles.spinnerLarge}></span>
              <span>Tracing execution pipeline and generating diagram...</span>
            </div>
          ) : error ? (
            <div style={styles.errorBanner}>
              <strong>Error:</strong> {error}
            </div>
          ) : !workflowData ? (
            <div style={styles.placeholderBox}>
              <div style={styles.placeholderIcon}><IconArrowsHorizontal size={36} /></div>
              <h3>Select a workflow to inspect its execution pipeline</h3>
              <p>Pick an entrypoint from the left panel or type a custom function name above.</p>
            </div>
          ) : (
            <div style={styles.detailsContent}>
              {/* Header Card */}
              <div style={styles.overviewCard}>
                <div style={styles.overviewHeader}>
                  <div>
                    <div style={styles.workflowLabel}>ACTIVE WORKFLOW</div>
                    <h3 style={styles.workflowTitle}>
                      {summary.entrypoint}()
                    </h3>
                    <div style={styles.workflowMeta}>
                      <code>{summary.relative_file}</code>
                      <span style={styles.bullet}>•</span>
                      <span>Total Execution Steps: <strong>{summary.total_steps}</strong></span>
                      <span style={styles.bullet}>•</span>
                      <span>Depth: <strong>{summary.max_depth_reached} hops</strong></span>
                    </div>
                  </div>

                  {/* Depth Control */}
                  <div style={styles.depthControl}>
                    <label style={styles.depthLabel}>Trace Depth: {depth}</label>
                    <input
                      type="range"
                      min="1"
                      max="6"
                      value={depth}
                      onChange={(e) => {
                        const newDepth = parseInt(e.target.value, 10);
                        setDepth(newDepth);
                        if (selectedWorkflow) {
                          api.traceWorkflow(selectedWorkflow.name, repoId, selectedWorkflow.file, newDepth)
                            .then(res => setWorkflowData(res.data));
                        }
                      }}
                      style={styles.depthSlider}
                    />
                  </div>
                </div>

                {/* Metrics Stats Grid */}
                <div style={styles.statsGrid}>
                  <div style={styles.statCard}>
                    <span style={styles.statNum}>{summary.total_steps}</span>
                    <span style={styles.statLabel}>Pipeline Steps</span>
                  </div>
                  <div style={styles.statCard}>
                    <span style={styles.statNum}>{summary.unique_files_count}</span>
                    <span style={styles.statLabel}>Files Involved</span>
                  </div>
                  <div style={styles.statCard}>
                    <span style={{
                      ...styles.statNum,
                      color: summary.data_sinks_touched > 0 ? 'var(--green)' : 'var(--text-muted)'
                    }}>
                      {summary.data_sinks_touched}
                    </span>
                    <span style={styles.statLabel}>Data Sinks (DB)</span>
                  </div>
                  <div style={styles.statCard}>
                    <span style={{
                      ...styles.statNum,
                      color: summary.external_integrations_touched > 0 ? '#EC4899' : 'var(--text-muted)'
                    }}>
                      {summary.external_integrations_touched}
                    </span>
                    <span style={styles.statLabel}>External Integrations</span>
                  </div>
                  <div style={styles.statCard}>
                    <span style={{
                      ...styles.statNum,
                      color: summary.risk_profile?.level === 'high' ? 'var(--red)' : 
                             summary.risk_profile?.level === 'medium' ? 'var(--amber)' : 'var(--green)'
                    }}>
                      {summary.risk_profile?.level?.toUpperCase() || 'LOW'}
                    </span>
                    <span style={styles.statLabel}>Complexity Risk</span>
                  </div>
                </div>
              </div>

              {/* View Switcher Tabs */}
              <div style={styles.viewTabs}>
                {[
                  { id: 'pipeline', label: 'Execution Pipeline', icon: <IconZap size={14} style={{ marginRight: '6px' }} />, count: steps.length },
                  { id: 'sequence', label: 'Sequence Diagram', icon: <IconArrowsHorizontal size={14} style={{ marginRight: '6px' }} /> },
                  { id: 'flowchart', label: 'Flowchart Graph', icon: <IconGitBranch size={14} style={{ marginRight: '6px' }} /> },
                  { id: 'sinks', label: 'Data Sink Footprint', icon: <IconPackage size={14} style={{ marginRight: '6px' }} />, count: summary.data_sinks_touched }
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => setActiveViewTab(t.id)}
                    style={{
                      ...styles.viewTabBtn,
                      ...(activeViewTab === t.id ? styles.viewTabBtnActive : {}),
                      display: 'inline-flex',
                      alignItems: 'center'
                    }}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                      {t.icon}
                      {t.label}
                    </span>
                    {t.count !== undefined && (
                      <span style={styles.viewTabCount}>{t.count}</span>
                    )}
                  </button>
                ))}
              </div>

              {/* View Content */}
              <div style={styles.viewBody}>
                {/* 1. Execution Pipeline View */}
                {activeViewTab === 'pipeline' && (
                  <div style={styles.pipelineWrap}>
                    {steps.map((step, idx) => {
                      const isExpanded = Boolean(expandedSteps[step.step_number]);
                      return (
                        <div key={step.step_number} style={styles.stepCard}>
                          {/* Step Connector Line */}
                          {idx < steps.length - 1 && <div style={styles.stepConnector} />}

                          <div style={styles.stepHeader}>
                            <div style={styles.stepNumBadge}>
                              {step.step_number}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={styles.stepTitleRow}>
                                <strong style={styles.stepFunctionName}>
                                  {step.function_name}()
                                </strong>
                                <span style={{
                                  ...styles.roleBadge,
                                  backgroundColor: `${step.role_color}22`,
                                  borderColor: step.role_color,
                                  color: step.role_color
                                }}>
                                  {step.role_badge}
                                </span>
                              </div>
                              <div style={styles.stepSubRow}>
                                <span style={styles.stepFile}>
                                  {step.relative_file}:{step.line}
                                </span>
                                <span style={styles.bullet}>•</span>
                                <span style={styles.stepTrigger}>
                                  {step.action_description}
                                </span>
                              </div>
                            </div>
                            {step.code_snippet && (
                              <button
                                onClick={() => toggleStepExpand(step.step_number)}
                                style={styles.codeToggleBtn}
                              >
                                {isExpanded ? 'Hide Code' : 'View Code'}
                              </button>
                            )}
                          </div>

                          {/* Code Snippet Drawer */}
                          {isExpanded && step.code_snippet && (
                            <div style={styles.codeDrawer}>
                              <pre style={styles.codeSnippet}>
                                <code>{step.code_snippet}</code>
                              </pre>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 2. Sequence Diagram View */}
                {activeViewTab === 'sequence' && (
                  <div style={styles.diagramWrap}>
                    <div style={styles.diagramNotice}>
                      <span>Mermaid Sequence Diagram compiled from deterministic graph call paths:</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(workflowData?.mermaid_sequence || '');
                          alert('Mermaid syntax copied to clipboard!');
                        }}
                        style={styles.copyBtn}
                      >
                        Copy Mermaid
                      </button>
                    </div>
                    <div style={styles.markdownBox}>
                      <MarkdownContent>
                        {`\`\`\`mermaid\n${workflowData?.mermaid_sequence || ''}\n\`\`\``}
                      </MarkdownContent>
                    </div>
                  </div>
                )}

                {/* 3. Flowchart View */}
                {activeViewTab === 'flowchart' && (
                  <div style={styles.diagramWrap}>
                    <div style={styles.diagramNotice}>
                      <span>Mermaid Flowchart showing stage classification & dependencies:</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(workflowData?.mermaid_flowchart || '');
                          alert('Flowchart syntax copied to clipboard!');
                        }}
                        style={styles.copyBtn}
                      >
                        Copy Mermaid
                      </button>
                    </div>
                    <div style={styles.markdownBox}>
                      <MarkdownContent>
                        {`\`\`\`mermaid\n${workflowData?.mermaid_flowchart || ''}\n\`\`\``}
                      </MarkdownContent>
                    </div>
                  </div>
                )}

                {/* 4. Data Sink Footprint View */}
                {activeViewTab === 'sinks' && (
                  <div style={styles.sinksWrap}>
                    <div style={styles.sinkSection}>
                      <h4 style={{ ...styles.sinkSectionTitle, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <IconDatabase size={16} /> Database & Storage Sinks Touched ({summary.data_sinks?.length || 0})
                      </h4>
                      <p style={styles.sinkSectionHint}>
                        Functions that persist or mutate state in databases, Neo4j, SQLite, or Qdrant vector storage.
                      </p>
                      {summary.data_sinks?.length === 0 ? (
                        <div style={styles.emptySection}>No direct database sinks called by this workflow.</div>
                      ) : (
                        <div style={styles.sinkList}>
                          {summary.data_sinks.map((s, idx) => (
                            <div key={idx} style={styles.sinkItem}>
                              <span style={styles.sinkIcon}><IconDot size={10} color="#22c55e" /></span>
                              <code>{s}</code>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div style={styles.sinkSection}>
                      <h4 style={{ ...styles.sinkSectionTitle, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <IconGlobe size={16} /> External Integrations & Services ({summary.external_integrations?.length || 0})
                      </h4>
                      <p style={styles.sinkSectionHint}>
                        External network dependencies, Groq/LLM reasoning APIs, Git subprocesses, or 3rd-party services.
                      </p>
                      {summary.external_integrations?.length === 0 ? (
                        <div style={styles.emptySection}>No external API integrations called in this workflow.</div>
                      ) : (
                        <div style={styles.sinkList}>
                          {summary.external_integrations.map((ext, idx) => (
                            <div key={idx} style={styles.sinkItem}>
                              <span style={styles.sinkIcon}><IconDot size={10} color="#a855f7" /></span>
                              <code>{ext}</code>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div style={styles.sinkSection}>
                      <h4 style={{ ...styles.sinkSectionTitle, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <IconAlertTriangle size={16} style={{ color: '#eab308' }} /> Structural Risk Assessment
                      </h4>
                      <div style={styles.riskCard}>
                        <div>
                          <strong>Complexity Level: </strong>
                          <span style={{ textTransform: 'uppercase', color: summary.risk_profile?.level === 'high' ? 'var(--red)' : 'var(--green)' }}>
                            {summary.risk_profile?.level || 'LOW'}
                          </span>
                        </div>
                        {summary.risk_profile?.high_coupling_hubs_touched?.length > 0 && (
                          <div style={{ marginTop: '6px' }}>
                            <span>Workflow crosses high-coupling hubs: </span>
                            <code>{summary.risk_profile.high_coupling_hubs_touched.join(', ')}</code>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getCategoryBadgeStyle(category) {
  switch (category) {
    case 'api_endpoint':
      return { backgroundColor: 'rgba(138, 43, 226, 0.15)', color: '#a855f7', borderColor: '#a855f7' };
    case 'background_job':
      return { backgroundColor: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', borderColor: '#38bdf8' };
    case 'domain_service':
      return { backgroundColor: 'rgba(251, 191, 36, 0.15)', color: '#fbbf24', borderColor: '#fbbf24' };
    case 'cli_entrypoint':
      return { backgroundColor: 'rgba(74, 222, 128, 0.15)', color: '#4ade80', borderColor: '#4ade80' };
    default:
      return { backgroundColor: 'rgba(113, 113, 122, 0.15)', color: '#a1a1aa', borderColor: '#71717a' };
  }
}

const styles = {
  container: {
    padding: '24px',
    maxWidth: '1600px',
    margin: '0 auto',
    minHeight: '85vh',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: '16px',
    borderBottom: '1px solid var(--border)',
    paddingBottom: '20px'
  },
  headerTag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '0.08em',
    color: '#a855f7',
    marginBottom: '8px'
  },
  tagIcon: {
    fontSize: '14px'
  },
  title: {
    fontSize: '24px',
    fontWeight: 700,
    color: 'var(--text-primary)',
    margin: '0 0 6px 0'
  },
  subtitle: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    margin: 0,
    maxWidth: '750px',
    lineHeight: 1.5
  },
  customTraceForm: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center'
  },
  customInput: {
    background: 'var(--bg-input)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-primary)',
    padding: '8px 14px',
    fontSize: '13px',
    fontFamily: 'var(--font-mono)',
    minWidth: '260px'
  },
  traceBtn: {
    background: 'linear-gradient(135deg, #8A2BE2, #6B21A8)',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    color: '#fff',
    padding: '8px 16px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer'
  },
  layout: {
    display: 'grid',
    gridTemplateColumns: '360px 1fr',
    gap: '24px',
    alignItems: 'start'
  },
  leftPanel: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    display: 'flex',
    flexDirection: 'column',
    maxHeight: '78vh',
    overflow: 'hidden'
  },
  searchWrap: {
    padding: '12px',
    borderBottom: '1px solid var(--border)',
    flexShrink: 0
  },
  searchInput: {
    width: '100%',
    background: 'var(--bg-input)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-primary)',
    padding: '8px 12px',
    fontSize: '12px',
    outline: 'none'
  },
  pillsWrap: {
    display: 'flex',
    gap: '6px',
    padding: '8px 12px',
    borderBottom: '1px solid var(--border)',
    overflowX: 'auto',
    flexShrink: 0,
    scrollbarWidth: 'none',
    msOverflowStyle: 'none'
  },
  pillBtn: {
    background: 'transparent',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    color: 'var(--text-muted)',
    fontSize: '11px',
    padding: '4px 10px',
    cursor: 'pointer',
    whiteSpace: 'nowrap'
  },
  pillBtnActive: {
    background: 'var(--bg-elevated)',
    color: 'var(--text-primary)',
    borderColor: 'var(--text-secondary)'
  },
  workflowList: {
    flex: 1,
    overflowY: 'auto',
    padding: '8px'
  },
  wfCard: {
    padding: '10px 12px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid transparent',
    cursor: 'pointer',
    marginBottom: '6px',
    background: 'transparent',
    transition: 'all 0.15s ease'
  },
  wfCardActive: {
    background: 'var(--bg-elevated)',
    borderColor: '#8A2BE2'
  },
  wfCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '4px'
  },
  catBadge: {
    fontSize: '10px',
    fontWeight: 600,
    textTransform: 'uppercase',
    padding: '2px 6px',
    borderRadius: '4px',
    border: '1px solid'
  },
  outDegreeBadge: {
    fontSize: '10px',
    color: 'var(--text-muted)',
    fontFamily: 'var(--font-mono)'
  },
  wfName: {
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-mono)',
    marginBottom: '3px'
  },
  wfFile: {
    fontSize: '11px',
    color: 'var(--text-muted)',
    fontFamily: 'var(--font-mono)'
  },
  rightPanel: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    minHeight: '78vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  },
  detailsContent: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%'
  },
  overviewCard: {
    padding: '20px',
    borderBottom: '1px solid var(--border)',
    background: 'var(--bg-elevated)'
  },
  overviewHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '16px',
    marginBottom: '16px'
  },
  workflowLabel: {
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '0.08em',
    color: '#a855f7',
    marginBottom: '4px'
  },
  workflowTitle: {
    fontSize: '20px',
    fontWeight: 700,
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-mono)',
    margin: '0 0 6px 0'
  },
  workflowMeta: {
    fontSize: '12px',
    color: 'var(--text-secondary)',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  bullet: {
    color: 'var(--text-muted)'
  },
  depthControl: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '4px'
  },
  depthLabel: {
    fontSize: '11px',
    color: 'var(--text-secondary)'
  },
  depthSlider: {
    width: '120px'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
    gap: '12px'
  },
  statCard: {
    background: 'var(--bg-input)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    padding: '10px',
    display: 'flex',
    flexDirection: 'column'
  },
  statNum: {
    fontSize: '18px',
    fontWeight: 700,
    color: 'var(--text-primary)'
  },
  statLabel: {
    fontSize: '11px',
    color: 'var(--text-muted)',
    marginTop: '2px'
  },
  viewTabs: {
    display: 'flex',
    borderBottom: '1px solid var(--border)',
    background: 'var(--bg-input)'
  },
  viewTabBtn: {
    padding: '12px 18px',
    fontSize: '12px',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    background: 'transparent',
    border: 'none',
    borderBottom: '2px solid transparent',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  viewTabBtnActive: {
    color: 'var(--text-primary)',
    borderBottomColor: '#8A2BE2',
    background: 'var(--bg-card)'
  },
  viewTabCount: {
    background: 'var(--bg-elevated)',
    fontSize: '10px',
    padding: '2px 6px',
    borderRadius: '10px',
    color: 'var(--text-primary)'
  },
  viewBody: {
    padding: '20px',
    overflowY: 'auto',
    flex: 1
  },
  pipelineWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    position: 'relative'
  },
  stepCard: {
    background: 'var(--bg-input)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    padding: '14px 16px',
    position: 'relative'
  },
  stepConnector: {
    position: 'absolute',
    left: '26px',
    bottom: '-14px',
    width: '2px',
    height: '14px',
    background: 'var(--border)',
    zIndex: 1
  },
  stepHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '14px'
  },
  stepNumBadge: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border)',
    color: 'var(--text-primary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '11px',
    fontWeight: 700,
    flexShrink: 0
  },
  stepTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '4px'
  },
  stepFunctionName: {
    fontSize: '14px',
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-mono)'
  },
  roleBadge: {
    fontSize: '10px',
    fontWeight: 700,
    textTransform: 'uppercase',
    padding: '2px 8px',
    borderRadius: '4px',
    border: '1px solid'
  },
  stepSubRow: {
    fontSize: '12px',
    color: 'var(--text-secondary)',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  stepFile: {
    fontFamily: 'var(--font-mono)',
    color: 'var(--text-muted)'
  },
  stepTrigger: {
    color: 'var(--text-secondary)'
  },
  codeToggleBtn: {
    background: 'transparent',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-secondary)',
    fontSize: '11px',
    padding: '4px 8px',
    cursor: 'pointer'
  },
  codeDrawer: {
    marginTop: '12px',
    background: 'var(--bg-elevated)',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border)',
    overflow: 'hidden'
  },
  codeSnippet: {
    margin: 0,
    padding: '10px 14px',
    fontSize: '11px',
    fontFamily: 'var(--font-mono)',
    color: 'var(--text-secondary)',
    overflowX: 'auto',
    lineHeight: 1.5
  },
  diagramWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px'
  },
  diagramNotice: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '12px',
    color: 'var(--text-secondary)'
  },
  copyBtn: {
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-primary)',
    padding: '4px 10px',
    fontSize: '11px',
    cursor: 'pointer'
  },
  markdownBox: {
    background: 'var(--bg-input)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    padding: '16px',
    overflowX: 'auto'
  },
  sinksWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  sinkSection: {
    background: 'var(--bg-input)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    padding: '16px'
  },
  sinkSectionTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--text-primary)',
    margin: '0 0 6px 0'
  },
  sinkSectionHint: {
    fontSize: '12px',
    color: 'var(--text-muted)',
    margin: '0 0 12px 0'
  },
  sinkList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  sinkItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12px',
    fontFamily: 'var(--font-mono)'
  },
  sinkIcon: {
    fontSize: '10px'
  },
  riskCard: {
    fontSize: '12px',
    color: 'var(--text-secondary)',
    lineHeight: 1.5
  },
  loadingBox: {
    padding: '30px 10px',
    textAlign: 'center',
    color: 'var(--text-muted)',
    fontSize: '12px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px'
  },
  loadingBoxLarge: {
    padding: '80px 20px',
    textAlign: 'center',
    color: 'var(--text-muted)',
    fontSize: '14px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    justifyContent: 'center',
    minHeight: '400px'
  },
  emptyBox: {
    padding: '30px 10px',
    textAlign: 'center',
    color: 'var(--text-muted)',
    fontSize: '12px'
  },
  emptySection: {
    fontSize: '12px',
    color: 'var(--text-muted)',
    fontStyle: 'italic'
  },
  placeholderBox: {
    padding: '100px 20px',
    textAlign: 'center',
    color: 'var(--text-muted)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px'
  },
  placeholderIcon: {
    fontSize: '32px',
    color: '#8A2BE2'
  },
  errorBanner: {
    padding: '14px',
    margin: '16px',
    background: 'rgba(248, 113, 113, 0.1)',
    border: '1px solid var(--red)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--red)',
    fontSize: '12px'
  },
  spinner: {
    width: '16px',
    height: '16px',
    border: '2px solid var(--border)',
    borderTopColor: '#8A2BE2',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite'
  },
  spinnerLarge: {
    width: '28px',
    height: '28px',
    border: '3px solid var(--border)',
    borderTopColor: '#8A2BE2',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite'
  }
};
