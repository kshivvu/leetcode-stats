'use client'

import ReactMarkdown from 'react-markdown'

interface MarkdownProps {
  content: string
  className?: string
}

export function Markdown({ content, className = '' }: MarkdownProps) {
  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown
        components={{
          h1: ({ ...props }) => <h1 className="text-xl font-bold mt-4 mb-2 text-accent" {...props} />,
          h2: ({ ...props }) => <h2 className="text-lg font-bold mt-3 mb-2 text-accent" {...props} />,
          h3: ({ ...props }) => <h3 className="text-md font-bold mt-2 mb-1 text-accent opacity-90 uppercase tracking-tight" {...props} />,
          p:  ({ ...props }) => <p className="mb-3 leading-relaxed opacity-90" {...props} />,
          ul: ({ ...props }) => <ul className="list-disc ml-5 mb-3 space-y-1" {...props} />,
          ol: ({ ...props }) => <ol className="list-decimal ml-5 mb-3 space-y-1" {...props} />,
          li: ({ ...props }) => <li className="opacity-80" {...props} />,
          strong: ({ ...props }) => <strong className="font-bold text-accent" {...props} />,
          code: ({ ...props }) => (
            <code className="bg-surface2 px-1.5 py-0.5 rounded text-accent2 mono text-[0.85em]" {...props} />
          ),
          pre:  ({ ...props }) => (
            <pre className="bg-[#0d0d14] p-4 rounded-xl border border-border my-4 overflow-x-auto mono text-xs" {...props} />
          ),
          blockquote: ({ ...props }) => (
            <blockquote className="border-l-4 border-accent pl-4 my-4 italic opacity-70" {...props} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>

      <style jsx global>{`
        .markdown-content a { color: var(--accent); text-decoration: underline; }
        .markdown-content hr { border: none; border-top: 1px solid var(--border); margin: 1.5rem 0; }
      `}</style>
    </div>
  )
}
