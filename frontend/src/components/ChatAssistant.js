import React, { useEffect, useRef, useState } from 'react';
import MarkdownContent from './MarkdownContent';
import { api } from '../services/api';
import { IconSparkles, IconMaximize, IconMinimize, IconX } from './Icons';
import './ChatAssistant.css';

const STARTER_QUESTIONS = [
  'How does this project work?',
  'Explain the architecture',
  'Where should I start debugging?'
];

export default function ChatAssistant({ repoId, repoName }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Ask me about this project’s code, architecture, dependencies, or how a feature works.'
    }
  ]);
  const messageListRef = useRef(null);

  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [messages, isLoading, isOpen]);

  const sendMessage = async (question = input) => {
    const query = question.trim();
    if (!query || isLoading) return;

    setInput('');
    setMessages(current => [...current, { role: 'user', content: query }]);
    setIsLoading(true);

    try {
      const { data } = await api.chat(query, repoId);
      setMessages(current => [
        ...current,
        {
          role: 'assistant',
          content: data.answer,
          sources: data.sources || [],
          guardrail: data.guardrail,
          retrievalSource: data.retrieval_source
        }
      ]);
    } catch (error) {
      const message = error.response?.data?.detail || error.message || 'Request failed.';
      setMessages(current => [
        ...current,
        { role: 'assistant', content: `I couldn't reach the project assistant: ${message}`, isError: true }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = event => {
    event.preventDefault();
    sendMessage();
  };

  return (
    <div className="chat-assistant">
      {isOpen && (
        <section className={`chat-panel${isExpanded ? ' chat-panel-expanded' : ''}`} role="dialog" aria-label="Project code assistant">
          <header className="chat-header">
            <div>
              <div className="chat-title"><span className="chat-status-dot" />Project assistant</div>
              <div className="chat-repository">{repoName || 'No repository selected'}</div>
            </div>
            <div className="chat-header-actions">
              <button
                type="button"
                className="chat-action-btn"
                aria-label={isExpanded ? 'Collapse panel' : 'Expand panel'}
                title={isExpanded ? 'Collapse panel' : 'Expand panel'}
                onClick={() => setIsExpanded(expanded => !expanded)}
              >
                {isExpanded ? <IconMinimize size={13} /> : <IconMaximize size={13} />}
              </button>
              <button
                type="button"
                className="chat-close"
                aria-label="Close project assistant"
                onClick={() => setIsOpen(false)}
              >
                <IconX size={14} />
              </button>
            </div>
          </header>

          <div className="chat-message-list" ref={messageListRef} aria-live="polite">
            {messages.map((message, index) => (
              <article className={`chat-message chat-message-${message.role}`} key={`${message.role}-${index}`}>
                <div className={`chat-bubble${message.isError ? ' chat-bubble-error' : ''}`}>
                  <MarkdownContent className="chat-markdown">{message.content}</MarkdownContent>
                </div>
                {message.guardrail && (
                  <span className={`chat-meta ${message.guardrail.allowed ? '' : 'chat-meta-warning'}`}>
                    {message.guardrail.allowed
                      ? message.retrievalSource === 'graphify'
                        ? 'Code search fallback'
                        : 'Graph RAG answer'
                      : 'Outside project scope'}
                  </span>
                )}
                {message.sources?.length > 0 && (
                  <div className="chat-sources">
                    <span className="chat-sources-title">Sources</span>
                    {message.sources.map((source, sourceIndex) => (
                      <span className="chat-source" key={`${source.file}-${sourceIndex}`}>
                        {source.file || source.name || source.type}
                      </span>
                    ))}
                  </div>
                )}
              </article>
            ))}
            {messages.length === 1 && !isLoading && (
              <div className="chat-starters">
                {STARTER_QUESTIONS.map(question => (
                  <button type="button" key={question} onClick={() => sendMessage(question)}>
                    {question}
                  </button>
                ))}
              </div>
            )}
            {isLoading && <div className="chat-loading" role="status">Searching project knowledge…</div>}
          </div>

          <form className="chat-form" onSubmit={handleSubmit}>
            <textarea
              aria-label="Ask about this project"
              placeholder="Ask about the codebase…"
              value={input}
              maxLength={2000}
              rows={2}
              onChange={event => setInput(event.target.value)}
              onKeyDown={event => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  handleSubmit(event);
                }
              }}
            />
            <button type="submit" disabled={!input.trim() || isLoading} aria-label="Send message">
              ↑
            </button>
          </form>
          <div className="chat-footnote">Answers are grounded in indexed project evidence.</div>
        </section>
      )}

      <button
        type="button"
        className="chat-launcher"
        aria-label={isOpen ? 'Close project assistant' : 'Open project assistant'}
        aria-expanded={isOpen}
        onClick={() => setIsOpen(open => !open)}
      >
        {isOpen ? <IconX size={16} /> : <IconSparkles size={16} />}
        {!isOpen && <span>Ask about code</span>}
      </button>
    </div>
  );
}
