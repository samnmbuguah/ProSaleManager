import { useEffect, useRef, useState } from "react";
import { Bot, Loader2, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { sendAgentMessage } from "@/services/agentService";
import { cn } from "@/lib/utils";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const THREAD_KEY = "agent-thread-id";

const SUGGESTIONS = ["Sales this week", "Anything low in stock?", "Find sugar"];

/** Floating AI assistant panel. Hidden for guests (the API requires auth). */
export function AgentPanel() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, open]);

  if (!isAuthenticated) return null;

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setSending(true);
    try {
      const threadId = localStorage.getItem(THREAD_KEY) ?? undefined;
      const result = await sendAgentMessage(trimmed, threadId);
      localStorage.setItem(THREAD_KEY, result.threadId);
      setMessages((prev) => [...prev, { role: "assistant", content: result.reply }]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Assistant request failed";
      setMessages((prev) => [...prev, { role: "assistant", content: `Sorry — ${message}` }]);
      toast({ title: "Assistant error", description: message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3">
      {open && (
        <Card className="flex h-[480px] w-[380px] max-w-[calc(100vw-2rem)] flex-col shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Bot className="h-5 w-5" />
              Store Assistant
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setOpen(false)}
              aria-label="Close assistant"
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-3">
            <div
              ref={listRef}
              role="log"
              aria-live="polite"
              aria-label="Assistant conversation"
              className="h-full space-y-3 overflow-y-auto pr-1"
            >
              {messages.length === 0 ? (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Ask about sales, inventory, or products.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {SUGGESTIONS.map((suggestion) => (
                      <Button
                        key={suggestion}
                        variant="outline"
                        size="sm"
                        onClick={() => void send(suggestion)}
                        disabled={sending}
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((message, index) => (
                  <div
                    key={index}
                    className={cn(
                      "max-w-[85%] rounded-lg px-3 py-2 text-sm",
                      message.role === "user"
                        ? "ml-auto bg-primary text-primary-foreground"
                        : "bg-muted text-foreground",
                    )}
                  >
                    {message.content}
                  </div>
                ))
              )}
              {sending && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Thinking…
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="pt-0">
            <form
              className="flex w-full gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                void send(input);
              }}
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about sales, stock, products…"
                aria-label="Ask the store assistant"
                disabled={sending}
              />
              <Button type="submit" size="icon" disabled={sending || !input.trim()} aria-label="Send message">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </CardFooter>
        </Card>
      )}
      <Button
        size="icon"
        className="h-12 w-12 rounded-full shadow-xl"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={open ? "Hide store assistant" : "Open store assistant"}
        aria-expanded={open}
      >
        <Bot className="h-5 w-5" />
      </Button>
    </div>
  );
}
