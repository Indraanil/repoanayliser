import React, { useEffect, useId, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const mermaidInstance = import('mermaid').then(({ default: mermaid }) => {
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'strict',
    theme: 'dark'
  });
  return mermaid;
});

const normalizeMarkdown = (value = '') => value
  .replace(/&#x20;/gi, ' ')
  .replace(/\\([|`*_#~-])/g, '$1')
  .replace(/^\s*•\s+/gm, '- ');

function CodeBlock({ children, ...props }) {
  const [copyState, setCopyState] = useState('Copy');
  const codeElement = React.Children.toArray(children).find(
    child => React.isValidElement(child) && child.type === 'code'
  );
  const code = codeElement ? String(codeElement.props.children).replace(/\n$/, '') : '';
  const language = codeElement?.props.className?.match(/language-([\w+-]+)/)?.[1] || 'code';

  if (language.toLowerCase() === 'mermaid') {
    return <MermaidDiagram definition={code} />;
  }

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopyState('Copied');
    } catch {
      setCopyState('Copy unavailable');
    }
    window.setTimeout(() => setCopyState('Copy'), 1800);
  };

  return (
    <div className="markdown-code-block">
      <div className="markdown-code-toolbar">
        <span>{language}</span>
        <button type="button" onClick={copyCode} disabled={!code} aria-label="Copy code">
          {copyState}
        </button>
      </div>
      <pre {...props}>{children}</pre>
    </div>
  );
}

function MermaidDiagram({ definition }) {
  const id = `mermaid-${useId().replace(/:/g, '')}`;
  const [diagram, setDiagram] = useState('');
  const [error, setError] = useState('');
  const [showSource, setShowSource] = useState(false);

  useEffect(() => {
    let isCurrent = true;
    setDiagram('');
    setError('');

    mermaidInstance
      .then(mermaid => mermaid.render(id, definition))
      .then(({ svg }) => {
        if (isCurrent) setDiagram(svg);
      })
      .catch(() => {
        if (isCurrent) setError('This diagram could not be rendered. Check the Mermaid syntax.');
      });

    return () => {
      isCurrent = false;
    };
  }, [definition, id]);

  return (
    <div className="markdown-code-block markdown-diagram">
      <div className="markdown-code-toolbar">
        <span>diagram</span>
        <button type="button" onClick={() => setShowSource(source => !source)}>
          {showSource ? 'Show diagram' : 'View source'}
        </button>
      </div>
      {showSource || error ? (
        <>
          {error && <div className="markdown-diagram-error" role="status">{error}</div>}
          <pre><code>{definition}</code></pre>
        </>
      ) : diagram ? (
        <div
          className="markdown-diagram-canvas"
          role="img"
          aria-label="Generated project diagram"
          dangerouslySetInnerHTML={{ __html: diagram }}
        />
      ) : (
        <div className="markdown-diagram-loading" role="status">Rendering diagram…</div>
      )}
    </div>
  );
}

export default function MarkdownContent({ children, className }) {
  if (!children) return null;
  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children: heading, ...props }) => <h2 style={styles.h2} {...props}>{heading}</h2>,
          h2: ({ children: heading, ...props }) => <h3 style={styles.h3} {...props}>{heading}</h3>,
          h3: ({ children: heading, ...props }) => <h4 style={styles.h4} {...props}>{heading}</h4>,
          p: props => <p style={styles.paragraph} {...props} />,
          ul: props => <ul style={styles.list} {...props} />,
          ol: props => <ol style={styles.list} {...props} />,
          li: props => <li style={styles.listItem} {...props} />,
          table: props => <div style={styles.tableWrap}><table style={styles.table} {...props} /></div>,
          th: props => <th style={styles.th} {...props} />,
          td: props => <td style={styles.td} {...props} />,
          blockquote: props => <blockquote style={styles.blockquote} {...props} />,
          hr: props => <hr style={styles.hr} {...props} />,
          pre: props => <CodeBlock {...props} />,
          code: ({ className: codeClass, children: codeText, ...props }) => {
            const isBlock = Boolean(codeClass) || String(codeText).includes('\n');
            return (
              <code
                className={codeClass}
                style={isBlock ? styles.code : styles.inlineCode}
                {...props}
              >
                {codeText}
              </code>
            );
          }
        }}
      >
        {normalizeMarkdown(children)}
      </ReactMarkdown>
    </div>
  );
}

const styles = {
  h2: { margin: '20px 0 8px', fontSize: '18px', color: 'var(--text-primary)' },
  h3: { margin: '18px 0 8px', fontSize: '16px', color: 'var(--text-primary)' },
  h4: { margin: '14px 0 6px', fontSize: '14px', color: 'var(--text-secondary)' },
  paragraph: { margin: '0 0 10px', lineHeight: 1.75 },
  list: { margin: '0 0 12px', paddingLeft: '24px' },
  listItem: { marginBottom: '5px', lineHeight: 1.65 },
  tableWrap: { overflowX: 'auto', margin: '12px 0 18px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '12px' },
  th: { padding: '9px 11px', textAlign: 'left', background: 'var(--bg-elevated)', color: 'var(--text-primary)', borderBottom: '1px solid var(--border)' },
  td: { padding: '9px 11px', verticalAlign: 'top', borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)' },
  blockquote: { margin: '12px 0', padding: '4px 14px', borderLeft: '3px solid var(--text-muted)', color: 'var(--text-muted)' },
  hr: { border: 0, borderTop: '1px solid var(--border)', margin: '18px 0' },
  pre: { margin: 0, padding: '14px', overflowX: 'auto', background: 'transparent', border: 0, borderRadius: 0, lineHeight: 1.65 },
  code: { display: 'block', fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#d4d4d8', whiteSpace: 'pre' },
  inlineCode: { padding: '2px 5px', background: 'var(--bg-elevated)', borderRadius: '4px', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-primary)' }
};
