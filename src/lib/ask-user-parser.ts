export interface AskUserQuestion {
  question: string;
  type?: string;
  options?: string[];
}

export interface AskUserBlock {
  questions: AskUserQuestion[];
}

export function parseAskUserBlock(content: string, isStreaming: boolean = false): {
  cleanContent: string;
  askUserBlock: AskUserBlock | null;
  isPartial: boolean;
} {
  // 1. Mask <think> blocks so we don't parse <ask_user> inside reasoning
  const thinkBlocks: string[] = [];
  let maskedContent = content.replace(/<think>[\s\S]*?(?:<\/think>|$)/gi, (match) => {
    thinkBlocks.push(match);
    return `__THINK_BLOCK_${thinkBlocks.length - 1}__`;
  });

  let finalAskUserBlock: AskUserBlock | null = null;
  let isPartial = false;

  // 2. Find and extract complete <ask_user> blocks outside of <think>
  // The regex ensures we match the innermost <ask_user> (does not contain another <ask_user> inside)
  const completeBlockRegex = /<\s*ask_user[^>]*>((?:(?!<\s*ask_user[^>]*>)[\s\S])*?)<\s*\/\s*ask_user[^>]*>/gi;

  maskedContent = maskedContent.replace(completeBlockRegex, (match, innerContent) => {
    let jsonStr = innerContent.trim();
    // Try to extract just the JSON object to ignore markdown wrappers or trailing garbage like periods
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }

    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed && Array.isArray(parsed.questions)) {
        finalAskUserBlock = parsed;
        return ""; // Successfully parsed, remove it from cleanContent
      }
    } catch (e) {
      console.error("Failed to parse ask_user JSON:", e);
    }
    return match; // Leave original if parsing failed
  });

  // 3. Handle unclosed blocks
  if (!finalAskUserBlock) {
    const unclosedTagRegex = /<\s*ask_user[^>]*>((?:(?!<\s*ask_user[^>]*>)[\s\S])*)$/i;
    
    if (isStreaming) {
      // If streaming, just hide the partial block so it doesn't look messy
      const openMatch = maskedContent.match(unclosedTagRegex);
      if (openMatch) {
        isPartial = true;
        maskedContent = maskedContent.substring(0, openMatch.index).trim();
      }
    } else {
      // If not streaming, the model probably forgot the closing tag. Try to parse it!
      maskedContent = maskedContent.replace(unclosedTagRegex, (match, innerContent) => {
        let jsonStr = innerContent.trim();
        const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonStr = jsonMatch[0];
        }

        try {
          const parsed = JSON.parse(jsonStr);
          if (parsed && Array.isArray(parsed.questions)) {
            finalAskUserBlock = parsed;
            return ""; 
          }
        } catch (e) {
          console.error("Failed to parse unclosed ask_user JSON:", e);
        }
        return match;
      });
    }
  }

  // 4. Clean up any empty markdown blocks that might have wrapped the tags
  maskedContent = maskedContent.replace(/```[a-z]*\s*```/ig, "").trim();

  // 5. Restore <think> blocks
  thinkBlocks.forEach((block, i) => {
    maskedContent = maskedContent.replace(`__THINK_BLOCK_${i}__`, block);
  });

  return { cleanContent: maskedContent, askUserBlock: finalAskUserBlock, isPartial };
}
