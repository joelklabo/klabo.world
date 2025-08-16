import Foundation
import Down

struct MarkdownUtility {
    static func parseMarkdownToHTML(_ markdown: String) -> String {
        let lines = markdown.split(separator: "\n", omittingEmptySubsequences: false)
        
        var contentStartIndex = 0
        if lines.first == "---" {
            for (index, line) in lines.dropFirst().enumerated() {
                if line == "---" {
                    contentStartIndex = index + 2
                    break
                }
            }
        }
        
        let contentLines = lines.dropFirst(contentStartIndex)
        let content = contentLines.joined(separator: "\n")
        
        // Down handles code blocks correctly and adds language classes automatically
        let down = Down(markdownString: content)
        
        do {
            let html = try down.toHTML(.unsafe)  // Allow raw HTML for embeds
            // Process gist embeds after markdown conversion
            return processGistEmbeds(html)
        } catch {
            // Fallback to basic parsing if Down fails
            return "<p>Error parsing markdown: \(error)</p>"
        }
    }
    
    private static func processGistEmbeds(_ html: String) -> String {
        // Pattern to match gist links in the converted HTML
        // Looking for: 📋 **[link text](gist url)**
        let processed = html.replacingOccurrences(
            of: #"<p>📋\s*<strong><a href="(https://gist\.github\.com/[^/]+/[a-f0-9]+)">([^<]+)</a></strong></p>"#,
            with: """
            <div class="gist-container" data-gist-url="$1" style="margin: 2rem 0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); border: 1px solid rgba(0, 0, 0, 0.1);">
                <div class="gist-header" style="background: linear-gradient(to bottom, rgb(55, 65, 81), rgb(31, 41, 55)); padding: 0.625rem 1rem; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(0, 0, 0, 0.2); min-height: 44px;">
                    <div class="gist-title" style="font-weight: 600; color: #f3f4f6; font-size: 0.875rem; display: flex; align-items: center; gap: 0.5rem;">
                        <svg style="width: 1.25rem; height: 1.25rem; fill: currentColor;" viewBox="0 0 24 24">
                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                        </svg>
                        <span>$2</span>
                    </div>
                    <div class="gist-actions" style="display: flex; align-items: center; gap: 0.5rem;">
                        <button class="gist-copy-header" onclick="copyGistFromHeader(this)" aria-label="Copy gist content" style="display: inline-flex; align-items: center; gap: 0.375rem; padding: 0.375rem 0.75rem; border-radius: 6px; font-size: 0.75rem; font-weight: 500; cursor: pointer; border: 1px solid rgba(255, 255, 255, 0.2); background: rgba(255, 255, 255, 0.1); color: #e5e7eb;">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/>
                                <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/>
                            </svg>
                            <span class="copy-text">Copy</span>
                        </button>
                        <a href="$1" target="_blank" class="gist-link" aria-label="View on GitHub" style="display: inline-flex; align-items: center; gap: 0.375rem; padding: 0.375rem 0.75rem; border-radius: 6px; font-size: 0.75rem; font-weight: 500; text-decoration: none; border: 1px solid rgba(255, 255, 255, 0.2); background: rgba(255, 255, 255, 0.1); color: #e5e7eb;">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                <path d="M8.636 3.5a.5.5 0 0 0-.5-.5H1.5A1.5 1.5 0 0 0 0 4.5v10A1.5 1.5 0 0 0 1.5 16h10a1.5 1.5 0 0 0 1.5-1.5V7.864a.5.5 0 0 0-1 0V14.5a.5.5 0 0 1-.5.5h-10a.5.5 0 0 1-.5-.5v-10a.5.5 0 0 1 .5-.5h6.636a.5.5 0 0 0 .5-.5z"/>
                                <path d="M16 .5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0 0 1h3.793L6.146 9.146a.5.5 0 1 0 .708.708L15 1.707V5.5a.5.5 0 0 0 1 0v-5z"/>
                            </svg>
                            <span>View on GitHub</span>
                        </a>
                    </div>
                </div>
                <div class="gist-content-wrapper" style="position: relative; max-height: 66vh; overflow-y: auto; overflow-x: auto; background: rgb(17, 24, 39); border-radius: 0 0 6px 6px;">
                    <div class="gist-loader" style="padding: 3rem; text-align: center; color: #6b7280; font-style: italic;">Loading gist...</div>
                </div>
            </div>
            """,
            options: .regularExpression
        )
        
        return processed
    }
}