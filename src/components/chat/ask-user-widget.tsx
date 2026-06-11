import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, SendHorizonal } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import type { AskUserBlock } from "@/lib/ask-user-parser";

interface AskUserWidgetProps {
  block: AskUserBlock;
  onSend: (message: string) => void;
  isStreaming?: boolean;
}

export function AskUserWidget({ block, onSend, isStreaming }: AskUserWidgetProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>(Array(block.questions?.length || 0).fill(""));
  const [typedAnswer, setTypedAnswer] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!block.questions || block.questions.length === 0) return null;

  const currentQuestion = block.questions[currentIndex];
  const isLastQuestion = currentIndex === block.questions.length - 1;
  const disabled = isStreaming || isSubmitted;

  const handleNext = (answer: string) => {
    if (disabled) return;
    
    const newAnswers = [...answers];
    newAnswers[currentIndex] = answer;
    setAnswers(newAnswers);

    if (isLastQuestion) {
      submitAll(newAnswers);
    } else {
      setCurrentIndex(currentIndex + 1);
      setTypedAnswer(newAnswers[currentIndex + 1] || "");
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setTypedAnswer(answers[currentIndex - 1] || "");
    }
  };

  const submitAll = (finalAnswers: string[]) => {
    setIsSubmitted(true);
    let summary = "Here are my answers:\n";
    block.questions.forEach((q, i) => {
      summary += `\n**${q.question}**\n${finalAnswers[i]}\n`;
    });
    onSend(summary);
  };

  const handleCustomSubmit = () => {
    if (disabled || !typedAnswer.trim()) return;
    
    // Check if they typed a number for an option
    const num = parseInt(typedAnswer.trim(), 10);
    if (currentQuestion.options && !isNaN(num) && num >= 1 && num <= currentQuestion.options.length) {
      handleNext(currentQuestion.options[num - 1]);
    } else {
      handleNext(typedAnswer.trim());
    }
    setTypedAnswer("");
  };

  return (
    <div className="flex flex-col gap-4 w-full p-5 border border-primary/20 bg-card rounded-2xl shadow-lg">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium tracking-wider text-primary uppercase">
          Question {currentIndex + 1} of {block.questions.length}
        </span>
        {currentIndex > 0 && (
          <Button variant="ghost" size="sm" onClick={handleBack} disabled={disabled} className="h-6 px-2 text-[11px] text-muted-foreground hover:text-foreground">
            <ChevronLeft className="size-3 mr-1" />
            Back
          </Button>
        )}
      </div>

      <div className="text-[15px] font-medium text-foreground tracking-wide">
        <ReactMarkdown
          className="prose dark:prose-invert max-w-none prose-p:leading-[1.5] font-sans"
          components={{
            p: ({ children }) => (
              <p className="mb-2 last:mb-0 font-medium text-[15px] leading-[1.5]">{children}</p>
            ),
            code: ({ inline, className, children, ...props }: any) => (
              <code
                className={cn(
                  "bg-secondary text-foreground/90 rounded px-1.5 py-0.5 text-[0.82em] font-mono font-normal",
                  className
                )}
                {...props}
              >
                {children}
              </code>
            ),
            a: ({ children, href }) => (
              <a
                href={href}
                className="text-primary hover:text-primary/80 underline underline-offset-3 transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                {children}
              </a>
            ),
            strong: ({ children }) => (
              <strong className="font-semibold text-foreground">{children}</strong>
            ),
          }}
        >
          {currentQuestion.question}
        </ReactMarkdown>
      </div>
      
      {currentQuestion.options && currentQuestion.options.length > 0 && (
        <div className="flex flex-col gap-2 mt-2">
          {currentQuestion.options.map((opt, j) => (
            <Button
              key={j}
              variant="outline"
              className="justify-start h-auto py-2.5 px-4 text-left font-normal bg-background/50 hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all border-border"
              disabled={disabled}
              onClick={() => handleNext(opt)}
            >
              <span className="mr-3 text-muted-foreground/40 text-[11px] font-mono">{j + 1}</span>
              <span className="text-[13px]">
                <ReactMarkdown
                  components={{
                    p: ({ children }) => <span className="inline">{children}</span>,
                    code: ({ children }) => (
                      <code className="bg-secondary text-foreground/90 rounded px-1 py-0.5 text-[0.82em] font-mono">{children}</code>
                    ),
                  }}
                >
                  {opt}
                </ReactMarkdown>
              </span>
            </Button>
          ))}
        </div>
      )}
      
      <div className="flex gap-2 mt-2">
        <Input
          value={typedAnswer}
          onChange={(e) => setTypedAnswer(e.target.value)}
          placeholder="Or type your answer here..."
          disabled={disabled}
          className="text-[13px] h-10 bg-background/50 border-border focus-visible:ring-primary/30"
          onKeyDown={(e) => {
            if (e.key === "Enter") handleCustomSubmit();
          }}
        />
        <Button 
          size="sm" 
          onClick={handleCustomSubmit}
          disabled={disabled || !typedAnswer.trim()}
          className="h-10 px-4"
        >
          {isLastQuestion ? "Finish" : "Next"}
          <SendHorizonal className="size-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
