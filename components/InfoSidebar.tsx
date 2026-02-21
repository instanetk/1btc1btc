"use client";
import { useState, useEffect, useCallback } from "react";
import ABOUT_MD from "@/about.md";
import TOS_MD from "@/terms-of-service.md";
import styles from "./InfoSidebar.module.css";

/** Render a subset of markdown to React elements (headings, bold, italic, links, lists, paragraphs). */
function renderMarkdown(md: string) {
  const lines = md.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;
  let key = 0;

  function inlineFormat(text: string): React.ReactNode[] {
    // Process **bold**, *italic*, [link](url), and `code` — in that order
    const parts: React.ReactNode[] = [];
    const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`|\[(.+?)\]\((.+?)\))/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }
      if (match[2]) {
        parts.push(<strong key={`i${match.index}`}>{match[2]}</strong>);
      } else if (match[3]) {
        parts.push(<em key={`i${match.index}`}>{match[3]}</em>);
      } else if (match[4]) {
        parts.push(<code key={`i${match.index}`}>{match[4]}</code>);
      } else if (match[5] && match[6]) {
        parts.push(
          <a key={`i${match.index}`} href={match[6]} target="_blank" rel="noopener noreferrer">
            {match[5]}
          </a>
        );
      }
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts;
  }

  while (i < lines.length) {
    const line = lines[i];

    // Headings
    if (line.startsWith("# ")) {
      elements.push(<h1 key={key++}>{inlineFormat(line.slice(2))}</h1>);
      i++;
      continue;
    }
    if (line.startsWith("## ")) {
      elements.push(<h2 key={key++}>{inlineFormat(line.slice(3))}</h2>);
      i++;
      continue;
    }

    // Unordered list block
    if (line.startsWith("- ")) {
      const items: React.ReactNode[] = [];
      while (i < lines.length && lines[i].startsWith("- ")) {
        items.push(<li key={key++}>{inlineFormat(lines[i].slice(2))}</li>);
        i++;
      }
      elements.push(<ul key={key++}>{items}</ul>);
      continue;
    }

    // Empty line — skip
    if (line.trim() === "") {
      i++;
      continue;
    }

    // Paragraph (collect consecutive non-empty, non-special lines)
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !lines[i].startsWith("# ") &&
      !lines[i].startsWith("## ") &&
      !lines[i].startsWith("- ")
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    if (paraLines.length > 0) {
      elements.push(<p key={key++}>{inlineFormat(paraLines.join(" "))}</p>);
    }
  }

  return elements;
}

interface InfoSidebarProps {
  externalOpen?: boolean;
  onExternalClose?: () => void;
}

export function InfoSidebar({ externalOpen, onExternalClose }: InfoSidebarProps = {}) {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => {
    setIsOpen(false);
    onExternalClose?.();
  }, [onExternalClose]);

  // Allow parent to open the sidebar
  useEffect(() => {
    if (externalOpen) setIsOpen(true);
  }, [externalOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, close]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      {/* Trigger button — top left */}
      <div className={styles.trigger}>
        <button
          className={styles.triggerButton}
          onClick={open}
          aria-label="About & Terms"
          title="About & Terms"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
        </button>
      </div>

      {/* Sidebar + backdrop */}
      {isOpen && (
        <>
          <div className={styles.backdrop} onClick={close} />
          <aside className={styles.sidebar} onClick={(e) => e.stopPropagation()}>
            <div className={styles.header}>
              <span className={styles.headerTitle}>1BTC=1BTC</span>
              <button className={styles.close} onClick={close} aria-label="Close">
                &times;
              </button>
            </div>

            <div className={styles.content}>
              {/* About */}
              <div className={styles.about}>
                <div className={styles.sectionLabel}>About</div>
                <div className={styles.aboutText}>{renderMarkdown(ABOUT_MD)}</div>
              </div>

              <div className={styles.separator} />

              {/* Terms of Service */}
              <div className={styles.about}>
                <div className={styles.sectionLabel}>Terms of Service</div>
              </div>
              <div className={styles.terms}>
                {renderMarkdown(TOS_MD)}
              </div>
            </div>

            <div className={styles.footer}>
              <a
                href="https://github.com/instanetk/1btc1btc"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.footerLink}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
                GitHub
              </a>
            </div>
          </aside>
        </>
      )}
    </>
  );
}
