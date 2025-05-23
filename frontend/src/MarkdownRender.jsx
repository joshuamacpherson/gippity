import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

// handles inline and block code rendering
const CodeBlock = ({ inline = false, className, children, ...props }) => {
  const detected_language = className?.replace("language-", "") || "plaintext";
  const content = String(children || "").trim();
  const is_single_line = !content.includes("\n");

  // inline or one-liners
  if (inline || is_single_line) {
    return (
      <code
        className="bg-neutral-800 text-white px-1 py-0.5 rounded text-lg"
        {...props}
      >
        {content}
      </code>
    );
  }

  // multiline code block with theme highlights
  return (
    <SyntaxHighlighter
      language={detected_language}
      style={oneDark}
      PreTag="div"
      customStyle={{ padding: "1em", borderRadius: "1.5em", fontSize: "18px" }}
      {...props}
    >
      {content}
    </SyntaxHighlighter>
  );
};

const MarkdownRenderer = ({ markdown_content }) => {
  return (
    <div className="markdown-renderer text-base text-gray-100 leading-relaxed">
      <ReactMarkdown
        components={{
          h1: ({ ...props }) => (
            <h1 className="text-2xl font-bold" {...props} />
          ),
          h2: ({ ...props }) => (
            <h2 className="text-1xl font-bold" {...props} />
          ),
          h3: ({ ...props }) => <h3 className="text-lg font-bold" {...props} />,
          p: ({ ...props }) => <p className="text-lg" {...props} />,
          
          // custom bullets
          li: ({ ...props }) => (
            <span className="inline-flex items-start my-2">
              <span className="mr-2 text-lg">•</span>
              <span {...props} />
            </span>
          ),

          // override code with component
          code: CodeBlock,
        }}
      >
        {markdown_content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
