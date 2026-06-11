export function parseAskUserBlock(content: string) {
  let cleanContent = content;
  let finalAskUserBlock = null;
  let isPartial = false;

  const openRegex = /<ask_user\b[^>]*>/i;
  const closeRegex = /<\/ask_user>/i;

  while (true) {
    const openMatch = cleanContent.match(openRegex);
    if (!openMatch) break;

    const openIndex = openMatch.index!;
    const openTagLength = openMatch[0].length;

    const textAfterOpen = cleanContent.substring(openIndex + openTagLength);
    const closeMatch = textAfterOpen.match(closeRegex);

    if (!closeMatch) {
      isPartial = true;
      cleanContent = cleanContent.substring(0, openIndex).trim();
      break;
    }

    const closeIndex = openIndex + openTagLength + closeMatch.index!;
    const closeTagLength = closeMatch[0].length;

    let jsonStr = cleanContent.substring(openIndex + openTagLength, closeIndex).trim();
    
    // Strip markdown formatting if the model wrapped the JSON in a code block inside the tag
    jsonStr = jsonStr.replace(/^```[a-z]*\n/i, "").replace(/\n```$/i, "").trim();

    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed && Array.isArray(parsed.questions)) {
        finalAskUserBlock = parsed;
      }
    } catch (e) {
      console.error("Failed to parse ask_user JSON:", e);
    }

    cleanContent = (
      cleanContent.substring(0, openIndex) + 
      cleanContent.substring(closeIndex + closeTagLength)
    ).trim();
  }
  
  cleanContent = cleanContent.replace(/```[a-z]*\s*```/ig, "").trim();

  return { cleanContent, askUserBlock: finalAskUserBlock, isPartial };
}

const input = `I'll ask the user.
<ask_user> { "questions": [ { "question": "What is the primary purpose of the website (e.g., showcase portfolio, sell a product, provide information, etc.)?", "type": "single_select", "options": ["Showcase portfolio", "Sell a product/service", "Provide information/blog", "Other"] }, { "question": "Who is the target audience for the site?", "type": "single_select", "options": ["General public", "Industry professionals", "Potential clients", "Students", "Other"] }, { "question": "What technologies or platform are you planning to use (e.g., static site generator, CMS, custom frontend, etc.)?", "type": "single_select", "options": ["Static site (e.g., Hugo, Next.js)", "WordPress", "Gatsby/Jekyll", "Custom React/Vue", "Other"] } ] } </ask_user>`;

console.log(parseAskUserBlock(input));
