// Format chatbot response text with HTML for display
const formatListResponse = (text) => {
    return (
        text
            // Bold: **text** → <strong>text</strong>
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')

            // Numbered item with title (e.g., 1. Title:) → bold the whole line
            .replace(/(?:^|\n)[ \t]*(\d+)\. ([^\n:]+:)/g, '\n<strong>$1. $2</strong>')

            // Bold the first line number: 1. text → <strong>1.</strong> text
            .replace(/(?:^|\n)[ \t]*(\d+)\. /g, '\n<strong>$1.</strong> ')

            // Bullet points: * text or - text → • text
            .replace(/(?:^|\n)[ \t]*[-*] (.+)/g, '\n• $1')

            // Numbered list: 1. text → ensure new line before each item
            .replace(/(?:^|\n)[ \t]*(\d+)\. (.+)/g, '\n$1. $2')

            // Normalize new lines to <br />
            .replace(/\n/g, '<br />')
    );
};

export default formatListResponse;
