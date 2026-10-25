import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  IconCamera,
  IconGitBranch,
  IconCheck,
  IconArrowRight,
  IconMessage,
  IconFileText,
  IconPlus,
  IconMinus,
  IconTarget,
  IconDot
} from './Icons';

function SnapshotComparison({ repoId }) {
  const [snapshots, setSnapshots] = useState([]);
  const [selectedSnapshot1, setSelectedSnapshot1] = useState(null);
  const [selectedSnapshot2, setSelectedSnapshot2] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (repoId) loadSnapshots();
  }, [repoId]);

  const loadSnapshots = async () => {
    try {
      setLoading(true);
      const response = await api.getSnapshots(repoId);
      setSnapshots(response.data.snapshots || []);
    } catch (error) {
      console.error('Error loading snapshots:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteSnapshot = async (snapshotId) => {
    if (!window.confirm('Delete this snapshot?')) return;
    try {
      await api.deleteSnapshot(repoId, snapshotId);
      loadSnapshots();
    } catch (error) {
      console.error('Error deleting snapshot:', error);
    }
  };

  const compareSelected = async () => {
    if (!selectedSnapshot1 || !selectedSnapshot2) return;
    try {
      const response = await api.compareSnapshots(repoId, selectedSnapshot1, selectedSnapshot2);
      setComparison(response.data);
    } catch (error) {
      console.error('Error comparing snapshots:', error);
    }
  };

  if (loading) return <div style={styles.loading}>Loading snapshots...</div>;

  return (
    <div style={styles.container}>
      <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <IconCamera size={20} /> Analysis Snapshots
      </h3>

      <div className="snapshot-stream-list">
        {snapshots.map((snapshot, idx) => (
          <div key={snapshot.snapshot_id} className="snapshot-stream-card">
            {/* Top row: Identity & Metadata */}
            <div className="snapshot-card-row-top">
              <div className="snapshot-card-identity">
                <span className="snapshot-tag-index">#{snapshots.length - idx}</span>
                {snapshot.commit_hash ? (
                  <span className="snapshot-tag-commit" title={snapshot.commit_hash}>
                    <IconGitBranch size={13} style={{ opacity: 0.7, marginRight: '4px' }} />
                    {snapshot.commit_hash.slice(0, 7)}
                  </span>
                ) : (
                  <span className="snapshot-tag-uncommitted">Working Tree</span>
                )}
                {snapshot.commit_message && (
                  <span className="snapshot-inline-msg" title={snapshot.commit_message}>
                    {snapshot.commit_message}
                  </span>
                )}
              </div>

              <div className="snapshot-card-meta-right">
                <span className="snapshot-timestamp">
                  {new Date(snapshot.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                </span>
                <button
                  onClick={() => deleteSnapshot(snapshot.snapshot_id)}
                  className="snapshot-del-btn"
                  title="Delete snapshot"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Bottom row: Inline Stats Ribbon & Action Selectors */}
            <div className="snapshot-card-row-bottom">
              <div className="snapshot-metrics-ribbon">
                <span className="snapshot-stat-item">
                  <span className="snapshot-stat-val">{snapshot.total_files || snapshot.file_count}</span> files
                </span>
                <span className="snapshot-stat-dot">·</span>
                <span className="snapshot-stat-item">
                  <span className="snapshot-stat-val">{snapshot.total_deps || 0}</span> deps
                </span>
                <span className="snapshot-stat-dot">·</span>
                <span className="snapshot-stat-item">
                  <span className="snapshot-stat-val">{snapshot.avg_coupling?.toFixed(2) || 'N/A'}</span> avg coupling
                </span>
                <span className="snapshot-stat-dot">·</span>
                <span className={`snapshot-stat-item ${snapshot.cycle_count > 0 ? 'snapshot-stat-warn' : ''}`}>
                  <span className="snapshot-stat-val">{snapshot.cycle_count || 0}</span> cycles
                </span>
              </div>

              <div className="snapshot-btn-group">
                <button
                  onClick={() => setSelectedSnapshot1(snapshot.snapshot_id)}
                  className={`snapshot-action-btn ${selectedSnapshot1 === snapshot.snapshot_id ? 'active-s1' : ''}`}
                >
                  {selectedSnapshot1 === snapshot.snapshot_id ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <IconCheck size={13} /> Base (Snap 1)
                    </span>
                  ) : 'Set as Base'}
                </button>
                <button
                  onClick={() => setSelectedSnapshot2(snapshot.snapshot_id)}
                  className={`snapshot-action-btn ${selectedSnapshot2 === snapshot.snapshot_id ? 'active-s2' : ''}`}
                >
                  {selectedSnapshot2 === snapshot.snapshot_id ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <IconCheck size={13} /> Target (Snap 2)
                    </span>
                  ) : 'Set as Target'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedSnapshot1 && selectedSnapshot2 && (
        <div style={styles.compareSection}>
          <div style={styles.compareSubtext}>
            <div style={styles.compareCommitRow}>
              <span style={{ color: 'var(--text-muted)' }}>Snapshot 1:</span>
              {snapshots.find(s => s.snapshot_id === selectedSnapshot1)?.commit_hash ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <strong style={{ color: '#38bdf8', fontFamily: 'var(--font-mono)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <IconGitBranch size={13} />
                    {snapshots.find(s => s.snapshot_id === selectedSnapshot1).commit_hash.slice(0, 7)}
                  </strong>
                  {snapshots.find(s => s.snapshot_id === selectedSnapshot1)?.commit_message && (
                    <span style={{ color: 'var(--text-secondary)', marginLeft: '6px' }}>
                      "{snapshots.find(s => s.snapshot_id === selectedSnapshot1).commit_message}"
                    </span>
                  )}
                </span>
              ) : <em>Working Tree</em>}
            </div>
            <div style={{ margin: '4px 0', color: 'var(--text-muted)', display: 'flex', justifyContent: 'center' }}>
              <IconArrowRight size={14} />
            </div>
            <div style={styles.compareCommitRow}>
              <span style={{ color: 'var(--text-muted)' }}>Snapshot 2:</span>
              {snapshots.find(s => s.snapshot_id === selectedSnapshot2)?.commit_hash ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <strong style={{ color: '#38bdf8', fontFamily: 'var(--font-mono)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <IconGitBranch size={13} />
                    {snapshots.find(s => s.snapshot_id === selectedSnapshot2).commit_hash.slice(0, 7)}
                  </strong>
                  {snapshots.find(s => s.snapshot_id === selectedSnapshot2)?.commit_message && (
                    <span style={{ color: 'var(--text-secondary)', marginLeft: '6px' }}>
                      "{snapshots.find(s => s.snapshot_id === selectedSnapshot2).commit_message}"
                    </span>
                  )}
                </span>
              ) : <em>Working Tree</em>}
            </div>
          </div>
          <button onClick={compareSelected} style={styles.compareBtn}>
            Compare Snapshots
          </button>
        </div>
      )}

      {comparison && (
        <div style={styles.comparisonResult}>
          <h4>Comparison Results</h4>

          {/* Risk Assessment */}
          {comparison.risk_assessment && (
            <div style={{
              ...styles.riskBanner,
              background: getRiskColor(comparison.risk_assessment.risk_level)
            }}>
              <div style={styles.riskLevel}>
                {getRiskIcon(comparison.risk_assessment.risk_level)} Risk Level: {comparison.risk_assessment.risk_level.toUpperCase()}
              </div>
              {comparison.risk_assessment.risk_areas?.length > 0 && (
                <div style={styles.riskAreas}>
                  {comparison.risk_assessment.risk_areas.map((area, idx) => (
                    <div key={idx} style={styles.riskItem}>{area}</div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Summary */}
          {comparison.summary && (
            <div style={styles.summaryBox}>
              <strong style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', marginRight: '6px' }}>
                <IconFileText size={14} /> Summary:
              </strong>
              {comparison.summary}
            </div>
          )}

          {/* Metrics Comparison */}
          <div style={styles.comparisonGrid}>
            <div style={styles.comparisonCard}>
              <div style={styles.cardHeaderFlex}>
                <h5 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <IconCamera size={14} /> Snapshot 1
                </h5>
                {comparison.snapshot1.commit_hash ? (
                  <span style={styles.commitBadge} title={comparison.snapshot1.commit_hash}>
                    <IconGitBranch size={12} style={{ opacity: 0.7, marginRight: '4px' }} />
                    {comparison.snapshot1.commit_hash.slice(0, 7)}
                  </span>
                ) : (
                  <span style={styles.uncommittedBadge}>Working Tree</span>
                )}
              </div>
              {comparison.snapshot1.commit_message && (
                <div style={styles.comparisonCommitMsgBox}>
                  <span style={styles.commitMessageIcon}>
                    <IconMessage size={13} />
                  </span>
                  <span style={styles.commitMessageText}>{comparison.snapshot1.commit_message}</span>
                </div>
              )}
              <div style={styles.comparisonDate}>{comparison.snapshot1.date}</div>
              <div style={styles.comparisonMetrics}>
                <div>Files: <strong>{comparison.snapshot1.files}</strong></div>
                <div>Dependencies: <strong>{comparison.snapshot1.dependencies}</strong></div>
                <div>Coupling: <strong>{comparison.snapshot1.avg_coupling?.toFixed(2)}</strong></div>
                <div>Cycles: <strong>{comparison.snapshot1.cycles}</strong></div>
              </div>
            </div>

            <div style={styles.deltaCard}>
              <h5>Changes (Δ)</h5>
              {comparison.snapshot1.commit_hash && comparison.snapshot2.commit_hash && (
                <div style={styles.deltaCommitFlow}>
                  <span>{comparison.snapshot1.commit_hash.slice(0, 7)}</span>
                  <span><IconArrowRight size={13} /></span>
                  <span>{comparison.snapshot2.commit_hash.slice(0, 7)}</span>
                </div>
              )}
              <div style={styles.deltaMetrics}>
                <div style={getDeltaStyle(comparison.changes.file_delta)}>
                  Files: <strong>{formatDelta(comparison.changes.file_delta)}</strong>
                </div>
                <div style={getDeltaStyle(comparison.changes.dependency_delta)}>
                  Deps: <strong>{formatDelta(comparison.changes.dependency_delta)}</strong>
                </div>
                <div style={getDeltaStyle(comparison.changes.coupling_delta)}>
                  Coupling: <strong>{formatDelta(comparison.changes.coupling_delta)}</strong>
                </div>
                <div style={getDeltaStyle(comparison.changes.cycle_delta)}>
                  Cycles: <strong>{formatDelta(comparison.changes.cycle_delta)}</strong>
                </div>
              </div>
            </div>

            <div style={styles.comparisonCard}>
              <div style={styles.cardHeaderFlex}>
                <h5 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <IconCamera size={14} /> Snapshot 2
                </h5>
                {comparison.snapshot2.commit_hash ? (
                  <span style={styles.commitBadge} title={comparison.snapshot2.commit_hash}>
                    <IconGitBranch size={12} style={{ opacity: 0.7, marginRight: '4px' }} />
                    {comparison.snapshot2.commit_hash.slice(0, 7)}
                  </span>
                ) : (
                  <span style={styles.uncommittedBadge}>Working Tree</span>
                )}
              </div>
              {comparison.snapshot2.commit_message && (
                <div style={styles.comparisonCommitMsgBox}>
                  <span style={styles.commitMessageIcon}>
                    <IconMessage size={13} />
                  </span>
                  <span style={styles.commitMessageText}>{comparison.snapshot2.commit_message}</span>
                </div>
              )}
              <div style={styles.comparisonDate}>{comparison.snapshot2.date}</div>
              <div style={styles.comparisonMetrics}>
                <div>Files: <strong>{comparison.snapshot2.files}</strong></div>
                <div>Dependencies: <strong>{comparison.snapshot2.dependencies}</strong></div>
                <div>Coupling: <strong>{comparison.snapshot2.avg_coupling?.toFixed(2)}</strong></div>
                <div>Cycles: <strong>{comparison.snapshot2.cycles}</strong></div>
              </div>
            </div>
          </div>

          {/* Pattern Changes */}
          {comparison.changes.pattern_changes && Object.keys(comparison.changes.pattern_changes).length > 0 && (
            <div style={styles.patternSection}>
              <h5>Architectural Pattern Changes</h5>
              <div style={styles.patternList}>
                {Object.entries(comparison.changes.pattern_changes).map(([pattern, change]) => (
                  <div key={pattern} style={styles.patternItem}>
                    <span style={styles.patternName}>{pattern}</span>
                    <span style={getPatternChangeStyle(change)}>{change}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* File Changes */}
          <div style={styles.fileChangesSection}>
            <div style={styles.fileChangeColumn}>
              <h5 style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <IconPlus size={14} style={{ color: '#22c55e' }} /> Files Added ({comparison.changes.files_added?.length || 0})
              </h5>
              <div style={styles.fileList}>
                {comparison.changes.files_added?.slice(0, 10).map((file, idx) => (
                  <div key={idx} style={styles.fileItem}>{file ? file.split(/[\\/]/).pop() : 'N/A'}</div>
                ))}
                {comparison.changes.files_added?.length > 10 && (
                  <div style={styles.moreFiles}>... and {comparison.changes.files_added.length - 10} more</div>
                )}
              </div>
            </div>
            <div style={styles.fileChangeColumn}>
              <h5 style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <IconFileText size={14} style={{ color: '#38bdf8' }} /> Files Modified ({comparison.changes.files_modified?.length || 0})
              </h5>
              <div style={styles.fileList}>
                {comparison.changes.files_modified?.slice(0, 10).map((file, idx) => (
                  <div key={idx} style={styles.fileItem}>{file ? file.split(/[\\/]/).pop() : 'N/A'}</div>
                ))}
                {comparison.changes.files_modified?.length > 10 && (
                  <div style={styles.moreFiles}>... and {comparison.changes.files_modified.length - 10} more</div>
                )}
              </div>
            </div>
            <div style={styles.fileChangeColumn}>
              <h5 style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <IconMinus size={14} style={{ color: '#f43f5e' }} /> Files Removed ({comparison.changes.files_removed?.length || 0})
              </h5>
              <div style={styles.fileList}>
                {comparison.changes.files_removed?.slice(0, 10).map((file, idx) => (
                  <div key={idx} style={styles.fileItem}>{file ? file.split(/[\\/]/).pop() : 'N/A'}</div>
                ))}
                {comparison.changes.files_removed?.length > 10 && (
                  <div style={styles.moreFiles}>... and {comparison.changes.files_removed.length - 10} more</div>
                )}
              </div>
            </div>
          </div>

          {/* Coupling Details */}
          <div style={styles.couplingSection}>
            <h5>Coupling Analysis</h5>
            <div style={styles.couplingGrid}>
              <div style={styles.couplingCard}>
                <div style={styles.couplingLabel}>High Coupling Files (Before)</div>
                <div style={styles.couplingValue}>{comparison.changes.high_coupling_before}</div>
              </div>
              <div style={styles.couplingCard}>
                <div style={styles.couplingLabel}>High Coupling Files (After)</div>
                <div style={styles.couplingValue}>{comparison.changes.high_coupling_after}</div>
              </div>
              <div style={styles.couplingCard}>
                <div style={styles.couplingLabel}>Change</div>
                <div style={{
                  ...styles.couplingValue,
                  color: comparison.changes.high_coupling_after > comparison.changes.high_coupling_before ? '#f87171' : '#4ade80'
                }}>
                  {formatDelta(comparison.changes.high_coupling_after - comparison.changes.high_coupling_before)}
                </div>
              </div>
            </div>
          </div>

          {/* Structural Risk — Changed Files */}
          {comparison.structural_risks && comparison.structural_risks.length > 0 && (
            <div style={styles.riskSection}>
              <h5 style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <IconTarget size={15} style={{ color: '#eab308' }} /> Structural Risk — Changed Files
              </h5>
              <div style={styles.riskDescription}>
                Files changed in this comparison ranked by structural risk (fan-in, fan-out, circular dependencies)
              </div>
              <div style={styles.riskFileList}>
                {comparison.structural_risks.map((risk, idx) => (
                  <div key={idx} style={styles.riskFileCard}>
                    <div style={styles.riskFileHeader}>
                      <span style={styles.riskFileName}>
                        {risk.file ? risk.file.split(/[\\/]/).slice(-2).join('/') : 'N/A'}
                      </span>
                      <span style={{
                        ...styles.riskBadge,
                        background: risk.level === 'critical' ? 'var(--red-dim)' : risk.level === 'high' ? 'var(--amber-dim)' : risk.level === 'medium' ? 'var(--blue-dim)' : 'var(--green-dim)',
                        color: risk.level === 'critical' ? '#f87171' : risk.level === 'high' ? '#fbbf24' : risk.level === 'medium' ? '#60a5fa' : '#4ade80'
                      }}>
                        {risk.level?.toUpperCase()} ({risk.score}/100)
                      </span>
                    </div>
                    <div style={styles.riskFileDetails}>
                      <span>Fan-in: <strong>{risk.fan_in}</strong></span>
                      <span>Fan-out: <strong>{risk.fan_out}</strong></span>
                      {risk.in_cycle && (
                        <span style={{ color: '#f87171', fontWeight: 'bold' }}>In Cycle</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const formatDelta = (value) => {
  if (value > 0) return `+${value}`;
  return value.toString();
};

const getDeltaStyle = (value) => {
  if (value > 0) return { color: '#f87171' };
  if (value < 0) return { color: '#4ade80' };
  return { color: 'var(--text-muted)' };
};

const getRiskColor = (level) => {
  if (level === 'high') return 'var(--red-dim)';
  if (level === 'medium') return 'var(--amber-dim)';
  return 'var(--green-dim)';
};

const getRiskIcon = (level) => {
  if (level === 'high') return <IconDot size={12} color="#f43f5e" style={{ marginRight: '6px', verticalAlign: '-1px' }} />;
  if (level === 'medium') return <IconDot size={12} color="#eab308" style={{ marginRight: '6px', verticalAlign: '-1px' }} />;
  return <IconDot size={12} color="#22c55e" style={{ marginRight: '6px', verticalAlign: '-1px' }} />;
};

const getPatternChangeStyle = (change) => {
  if (change === 'newly_detected') return { color: '#4ade80', fontWeight: 'bold' };
  if (change === 'no_longer_detected') return { color: '#f87171', fontWeight: 'bold' };
  return { color: '#60a5fa', fontWeight: 'bold' };
};

const styles = {
  container: { padding: '20px' },
  loading: { textAlign: 'center', padding: '40px', color: 'var(--text-muted)' },
  snapshotList: { display: 'grid', gap: '12px', marginBottom: '20px' },
  snapshotCard: { border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '16px', background: 'var(--bg-elevated)', transition: 'all 0.2s' },
  snapshotHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '10px', alignItems: 'center' },
  snapshotNumber: { fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', background: 'var(--bg-card)', padding: '4px 12px', borderRadius: '14px', border: '1px solid var(--border)', fontFamily: 'var(--font-mono)' },
  snapshotDate: { fontSize: '12px', color: 'var(--text-dim)' },
  snapshotMetrics: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '12px', padding: '10px', background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' },
  metric: { fontSize: '13px', color: 'var(--text-secondary)' },
  snapshotActions: { display: 'flex', gap: '8px' },
  selectBtn: { flex: 1, padding: '8px 14px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '13px', transition: 'all 0.2s', color: 'var(--text-secondary)' },
  selected: { background: 'var(--text-primary)', color: 'var(--bg-primary)', border: '1px solid var(--text-primary)', fontWeight: 600 },
  deleteBtn: { padding: '8px 12px', background: 'var(--red-dim)', color: 'var(--red)', border: '1px solid rgba(248,113,113,0.15)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '14px' },
  compareSection: { textAlign: 'center', padding: '20px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', marginBottom: '20px', border: '1px solid var(--border)' },
  compareBtn: { padding: '12px 28px', background: 'var(--green)', color: 'var(--bg-primary)', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '14px', fontWeight: 600 },
  comparisonResult: { border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px', background: 'var(--bg-card)' },
  riskBanner: { padding: '14px', borderRadius: 'var(--radius-md)', marginBottom: '20px', border: '1px solid var(--border)' },
  riskLevel: { fontSize: '16px', fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)' },
  riskAreas: { display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px', color: 'var(--text-secondary)' },
  riskItem: { padding: '4px 10px', background: 'var(--bg-card)', borderRadius: '4px', border: '1px solid var(--border)' },
  summaryBox: { padding: '14px', background: 'var(--blue-dim)', borderRadius: 'var(--radius-md)', marginBottom: '20px', fontSize: '13px', border: '1px solid rgba(96,165,250,0.12)', color: 'var(--text-secondary)' },
  comparisonGrid: { display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '16px', alignItems: 'center', marginBottom: '20px' },
  comparisonCard: { padding: '16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' },
  deltaCard: { padding: '16px', background: 'var(--amber-dim)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(251,191,36,0.12)', minWidth: '180px' },
  comparisonDate: { fontSize: '11px', color: 'var(--text-dim)', marginBottom: '12px' },
  comparisonMetrics: { display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', color: 'var(--text-secondary)' },
  deltaMetrics: { display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px', fontWeight: 700, fontFamily: 'var(--font-mono)' },
  patternSection: { marginTop: '16px', padding: '14px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' },
  patternList: { display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' },
  patternItem: { display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' },
  patternName: { fontWeight: 600, textTransform: 'capitalize', color: 'var(--text-primary)' },
  fileChangesSection: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginTop: '16px' },
  fileChangeColumn: { padding: '14px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' },
  fileList: { marginTop: '8px', maxHeight: '200px', overflowY: 'auto' },
  fileItem: { padding: '6px 10px', background: 'var(--bg-card)', marginBottom: '4px', borderRadius: 'var(--radius-sm)', fontSize: '12px', border: '1px solid var(--border)', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' },
  moreFiles: { padding: '6px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px', fontStyle: 'italic' },
  couplingSection: { marginTop: '16px', padding: '14px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' },
  couplingGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginTop: '10px' },
  couplingCard: { padding: '14px', background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', textAlign: 'center', border: '1px solid var(--border)' },
  couplingLabel: { fontSize: '10px', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' },
  couplingValue: { fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' },
  riskSection: { marginTop: '16px', padding: '14px', background: 'rgba(167,139,250,0.06)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(167,139,250,0.12)' },
  riskDescription: { fontSize: '11px', color: 'var(--text-muted)', marginBottom: '10px', marginTop: '4px' },
  riskFileList: { display: 'flex', flexDirection: 'column', gap: '6px' },
  riskFileCard: { padding: '12px', background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' },
  riskFileHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' },
  riskFileName: { fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' },
  riskBadge: { padding: '3px 10px', borderRadius: '10px', fontSize: '10px', fontWeight: 700, fontFamily: 'var(--font-mono)' },
  riskFileDetails: { display: 'flex', gap: '14px', fontSize: '12px', color: 'var(--text-muted)' },
  commitBadge: { display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', background: 'rgba(56, 189, 248, 0.12)', color: '#38bdf8', borderRadius: '12px', border: '1px solid rgba(56, 189, 248, 0.3)', fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 600 },
  commitMessageBox: { display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '8px 12px', background: 'rgba(56, 189, 248, 0.06)', border: '1px solid rgba(56, 189, 248, 0.18)', borderRadius: 'var(--radius-sm)', marginBottom: '10px', fontSize: '12px', color: 'var(--text-primary)', lineHeight: '1.4' },
  commitMessageIcon: { fontSize: '12px', flexShrink: 0, marginTop: '1px' },
  commitMessageText: { fontWeight: 500, wordBreak: 'break-word', color: 'var(--text-primary)' },
  uncommittedBadge: { display: 'inline-flex', alignItems: 'center', padding: '2px 8px', background: 'var(--bg-card)', color: 'var(--text-dim)', borderRadius: '12px', border: '1px solid var(--border)', fontSize: '11px', fontStyle: 'italic' },
  compareSubtext: { marginBottom: '14px', fontSize: '13px', color: 'var(--text-secondary)' },
  compareCommitRow: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', flexWrap: 'wrap' },
  cardHeaderFlex: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
  comparisonCommitMsgBox: { display: 'flex', alignItems: 'flex-start', gap: '6px', padding: '8px 10px', background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.2)', borderRadius: 'var(--radius-sm)', fontSize: '12px', color: 'var(--text-primary)', marginBottom: '10px', lineHeight: '1.4', wordBreak: 'break-word' },
  deltaCommitFlow: { fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: '8px', display: 'flex', gap: '6px', alignItems: 'center' },
};

export default SnapshotComparison;
