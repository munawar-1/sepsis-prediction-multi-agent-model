import React from 'react';

/**
 * ClinicalMarkdownRenderer
 * High-performance, zero-dependency Markdown parser tailored for ICU clinical reports.
 * Formats Markdown tables, headers, bold metrics, bullet lists, and callout blocks
 * with high-contrast clinical typography conforming strictly to Aegis-ICU theme tokens.
 */
export default function ClinicalMarkdownRenderer({ content }) {
  if (!content) return null;

  // Split into lines for block-level parsing
  const rawLines = content.split('\n');
  const blocks = [];
  let currentTable = null;
  let currentList = null;

  const flushTable = () => {
    if (currentTable) {
      blocks.push({ type: 'table', rows: currentTable });
      currentTable = null;
    }
  };

  const flushList = () => {
    if (currentList) {
      blocks.push({ type: 'list', items: currentList });
      currentList = null;
    }
  };

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i].trim();

    // 1. Table Row (starts and ends with |)
    if (line.startsWith('|') && line.endsWith('|')) {
      flushList();
      // Skip markdown separator row |---|---|
      if (/^\|[\s\-:|]+\|$/.test(line)) {
        continue;
      }
      const cells = line
        .slice(1, -1)
        .split('|')
        .map(c => c.trim());
      if (!currentTable) currentTable = [];
      currentTable.push(cells);
      continue;
    } else {
      flushTable();
    }

    // 2. Headings
    if (line.startsWith('### ')) {
      flushList();
      blocks.push({ type: 'h3', text: line.replace(/^###\s+/, '') });
      continue;
    }
    if (line.startsWith('## ')) {
      flushList();
      blocks.push({ type: 'h2', text: line.replace(/^##\s+/, '') });
      continue;
    }
    if (line.startsWith('# ')) {
      flushList();
      blocks.push({ type: 'h1', text: line.replace(/^#\s+/, '') });
      continue;
    }

    // 3. Bullet Lists (- or * or •)
    if (/^[-*•]\s+/.test(line)) {
      if (!currentList) currentList = [];
      currentList.push(line.replace(/^[-*•]\s+/, ''));
      continue;
    } else {
      flushList();
    }

    // 4. Blockquotes / Alerts (> )
    if (line.startsWith('> ')) {
      blocks.push({ type: 'quote', text: line.replace(/^>\s+/, '') });
      continue;
    }

    // 5. Empty Line
    if (line.length === 0) {
      continue;
    }

    // 6. Regular Paragraph
    blocks.push({ type: 'p', text: line });
  }

  flushTable();
  flushList();

  // Helper to format inline markdown (bold, code, metrics)
  const formatInline = (text) => {
    if (!text) return null;

    // Split on bold (**bold**) and inline code (`code`)
    const parts = [];
    let remaining = text;
    let keyIdx = 0;

    const regex = /(\*\*[^*]+\*\*|`[^`]+`)/;

    while (remaining.length > 0) {
      const match = remaining.match(regex);
      if (!match) {
        parts.push(remaining);
        break;
      }

      const matchIdx = match.index;
      if (matchIdx > 0) {
        parts.push(remaining.substring(0, matchIdx));
      }

      const matchedStr = match[0];
      if (matchedStr.startsWith('**') && matchedStr.endsWith('**')) {
        parts.push(
          <strong key={keyIdx++} className="font-bold text-slate-950 dark:text-white">
            {matchedStr.slice(2, -2)}
          </strong>
        );
      } else if (matchedStr.startsWith('`') && matchedStr.endsWith('`')) {
        parts.push(
          <code
            key={keyIdx++}
            className="px-1.5 py-0.5 mx-0.5 rounded-md font-mono text-[11px] font-semibold bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
          >
            {matchedStr.slice(1, -1)}
          </code>
        );
      }

      remaining = remaining.substring(matchIdx + matchedStr.length);
    }

    return parts;
  };

  return (
    <div className="clinical-markdown-content space-y-3.5 text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-sans">
      {blocks.map((block, idx) => {
        switch (block.type) {
          case 'h1':
          case 'h2':
            return (
              <h3
                key={idx}
                className="text-sm font-bold text-slate-900 dark:text-white pt-2.5 pb-1 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2"
              >
                <span className="w-1.5 h-3.5 rounded-full bg-emerald-600 inline-block" />
                <span>{formatInline(block.text)}</span>
              </h3>
            );

          case 'h3':
            return (
              <h4
                key={idx}
                className="text-[13px] font-bold text-slate-900 dark:text-slate-100 pt-1.5 pb-0.5 flex items-center gap-2"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                <span>{formatInline(block.text)}</span>
              </h4>
            );

          case 'table':
            if (!block.rows || block.rows.length === 0) return null;
            const [headerRow, ...bodyRows] = block.rows;
            return (
              <div
                key={idx}
                className="my-3 overflow-x-auto rounded-2xl border-[1.5px] border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1524] shadow-2xs"
              >
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-[#131D31] border-b border-slate-200 dark:border-slate-800">
                      {headerRow.map((col, cIdx) => (
                        <th
                          key={cIdx}
                          className="px-3.5 py-2 text-[11px] font-mono font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300"
                        >
                          {formatInline(col)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {bodyRows.map((row, rIdx) => (
                      <tr
                        key={rIdx}
                        className="hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 transition-colors duration-150"
                      >
                        {row.map((cell, cIdx) => (
                          <td
                            key={cIdx}
                            className={`px-3.5 py-2 text-xs font-medium ${
                              cIdx === 0
                                ? 'font-mono font-bold text-slate-900 dark:text-slate-100'
                                : 'text-slate-800 dark:text-slate-200'
                            }`}
                          >
                            {formatInline(cell)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );

          case 'list':
            return (
              <ul key={idx} className="space-y-1.5 pl-1.5 my-2">
                {block.items.map((item, itemIdx) => (
                  <li key={itemIdx} className="flex items-start gap-2 text-xs leading-relaxed">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                    <span className="flex-1">{formatInline(item)}</span>
                  </li>
                ))}
              </ul>
            );

          case 'quote':
            return (
              <div
                key={idx}
                className="p-3 my-2 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border-l-[3.5px] border-emerald-500 text-xs text-emerald-950 dark:text-emerald-200 font-medium"
              >
                {formatInline(block.text)}
              </div>
            );

          case 'p':
          default:
            return (
              <p key={idx} className="text-xs leading-relaxed font-sans text-slate-800 dark:text-slate-200">
                {formatInline(block.text)}
              </p>
            );
        }
      })}
    </div>
  );
}
