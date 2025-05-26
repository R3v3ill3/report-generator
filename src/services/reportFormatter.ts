const FORMATTING_PROMPT = `
Format this business report content with proper structure and formatting.

REQUIREMENTS:
1. Use proper heading levels (no markdown symbols)
2. Format tables with clear columns and aligned data
3. Use proper paragraph breaks and spacing
4. Maintain all original content and meaning
5. Use professional business language

DO NOT:
- Use any markdown symbols (**, ##, etc.)
- Use vertical bars (|) for tables
- Add or remove any content
- Change the meaning of any content

For tables, format like this:
Week    Day    Activity    Details
1       Mon    Planning    Initial setup
2       Tue    Review     Team meeting

For headings, use proper capitalization and no symbols:
Main Heading
  Subheading
    Section Title

Input content:`;