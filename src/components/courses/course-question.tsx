
import { FormEvent, useState } from "react";
import { useChat } from "@/context/chat-context";
import { ArrowUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ModelSelector } from "@/components/chat/model-selector";
import { DEFAULT_MODEL } from "@/lib/models";

interface CourseQuestionProps { courseId: string; onChatCreated: (chatId: string) => void; }
export function CourseQuestion({ courseId, onChatCreated }: CourseQuestionProps) {
  const { chats, setChats } = useChat();
  const [question, setQuestion] = useState(""); const [model, setModel] = useState<string>(DEFAULT_MODEL); const [creating, setCreating] = useState(false); const [error, setError] = useState<string | null>(null);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!question.trim() || !courseId || creating) return;
    setCreating(true); setError(null);
    try {
      const response = await fetch("/api/chats", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ courseId, model }) });
      const data = (await response.json()) as { chat?: { id?: string; $id?: string; [key: string]: unknown }; error?: string };
      if (!response.ok) throw new Error(data.error || "Unable to create course chat");
      const chatId = data.chat?.$id ?? data.chat?.id; if (!chatId) throw new Error("The new chat did not include an id");
      if (data.chat) setChats([data.chat as never, ...chats]);
      onChatCreated(`${chatId}?msg=${encodeURIComponent(question.trim())}&ws=0`);
    } catch (submitError) { setError(submitError instanceof Error ? submitError.message : "Unable to create course chat"); }
    finally { setCreating(false); }
  };
  return <form onSubmit={submit} className="rounded-xl border border-border bg-card p-4 shadow-stripe-ambient"><Textarea value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask a question about this course..." className="min-h-24 resize-none border-0 bg-transparent px-0 text-sm shadow-none focus-visible:ring-0" disabled={creating} /><div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3"><ModelSelector currentModel={model} onModelChange={setModel} /><Button type="submit" disabled={!question.trim() || creating} className="gap-2 rounded-lg bg-primary text-primary-foreground">{creating ? <Loader2 className="size-3.5 animate-spin" /> : <ArrowUp className="size-3.5" />}{creating ? "Opening chat..." : "Ask in a new chat"}</Button></div>{error && <p className="mt-2 text-xs text-red-400" role="alert">{error}</p>}</form>;
}
