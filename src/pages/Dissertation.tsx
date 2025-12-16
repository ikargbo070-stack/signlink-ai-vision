import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Printer } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";

const Dissertation = () => {
  const navigate = useNavigate();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/DISSERTATION_SIGNLINK_ASL.md")
      .then((res) => res.text())
      .then((text) => {
        setContent(text);
        setLoading(false);
      })
      .catch(() => {
        setContent("# Error loading dissertation content");
        setLoading(false);
      });
  }, []);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dissertation...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Print-only styles */}
      <style>
        {`
          @media print {
            .no-print {
              display: none !important;
            }
            body {
              background: white !important;
              color: black !important;
            }
            .print-content {
              max-width: 100% !important;
              padding: 0 !important;
              margin: 0 !important;
            }
            .print-content h1 {
              page-break-before: always;
              font-size: 24pt !important;
            }
            .print-content h1:first-child {
              page-break-before: avoid;
            }
            .print-content h2 {
              font-size: 18pt !important;
            }
            .print-content h3 {
              font-size: 14pt !important;
            }
            .print-content p, .print-content li {
              font-size: 12pt !important;
              line-height: 1.6 !important;
            }
            .print-content pre {
              font-size: 9pt !important;
              page-break-inside: avoid;
            }
            .print-content table {
              page-break-inside: avoid;
            }
          }
        `}
      </style>

      {/* Navigation bar - hidden when printing */}
      <div className="no-print sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
          <div className="flex gap-2">
            <Button onClick={handlePrint} className="gap-2">
              <Printer className="h-4 w-4" />
              Print / Save as PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Instructions - hidden when printing */}
      <div className="no-print bg-primary/10 border-b border-primary/20">
        <div className="max-w-4xl mx-auto px-6 py-3">
          <p className="text-sm text-muted-foreground">
            <strong>To export as PDF:</strong> Click "Print / Save as PDF" above, then in the print dialog, select "Save as PDF" as your destination (or use Ctrl/Cmd + P).
          </p>
        </div>
      </div>

      {/* Dissertation content */}
      <div className="min-h-screen bg-background py-8">
        <article className="print-content max-w-4xl mx-auto px-6 prose prose-slate dark:prose-invert prose-headings:font-bold prose-h1:text-3xl prose-h1:mb-8 prose-h1:mt-12 prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-h3:text-xl prose-h3:mt-8 prose-p:text-justify prose-p:leading-relaxed prose-li:leading-relaxed prose-pre:bg-muted prose-pre:text-sm prose-table:text-sm">
          <ReactMarkdown
            components={{
              h1: ({ children }) => (
                <h1 className="text-3xl font-bold text-foreground mb-8 mt-12 first:mt-0 border-b pb-4">
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-2xl font-semibold text-foreground mt-10 mb-4">
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-xl font-semibold text-foreground mt-8 mb-3">
                  {children}
                </h3>
              ),
              p: ({ children }) => (
                <p className="text-foreground leading-relaxed mb-4 text-justify">
                  {children}
                </p>
              ),
              ul: ({ children }) => (
                <ul className="list-disc pl-6 mb-4 text-foreground">{children}</ul>
              ),
              ol: ({ children }) => (
                <ol className="list-decimal pl-6 mb-4 text-foreground">{children}</ol>
              ),
              li: ({ children }) => (
                <li className="mb-2 text-foreground">{children}</li>
              ),
              strong: ({ children }) => (
                <strong className="font-bold text-foreground">{children}</strong>
              ),
              code: ({ children, className }) => {
                const isBlock = className?.includes("language-");
                if (isBlock) {
                  return (
                    <code className="block bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                      {children}
                    </code>
                  );
                }
                return (
                  <code className="bg-muted px-1.5 py-0.5 rounded text-sm">
                    {children}
                  </code>
                );
              },
              pre: ({ children }) => (
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto mb-4">
                  {children}
                </pre>
              ),
              table: ({ children }) => (
                <div className="overflow-x-auto mb-4">
                  <table className="min-w-full border-collapse border border-border">
                    {children}
                  </table>
                </div>
              ),
              th: ({ children }) => (
                <th className="border border-border px-4 py-2 bg-muted font-semibold text-left">
                  {children}
                </th>
              ),
              td: ({ children }) => (
                <td className="border border-border px-4 py-2">{children}</td>
              ),
              hr: () => <hr className="my-8 border-border" />,
              blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-primary pl-4 italic my-4 text-muted-foreground">
                  {children}
                </blockquote>
              ),
            }}
          >
            {content}
          </ReactMarkdown>
        </article>
      </div>
    </>
  );
};

export default Dissertation;
