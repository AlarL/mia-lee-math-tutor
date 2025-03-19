import { useState, useRef, useEffect } from "react";
import { MessageSquare, Image, History, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  image?: string;
}

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Tere! Olen sinu matemaatika õpetaja. Kuidas saan sind täna aidata?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() && !fileInputRef.current?.files?.length) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setInput("");
    setIsLoading(true);
    setError(null);

    try {
      console.log('Sending request to chat function with message:', input);
      
      const { data, error } = await supabase.functions.invoke('chat', {
        body: { message: input }
      });

      console.log('Response received:', { data, error });
      
      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(`Supabase funktsioon andis vea: ${error.message}`);
      }

      if (!data) {
        throw new Error('Vastus puudub');
      }

      if (!data.reply && !data.error) {
        throw new Error('Vastus on vigane või puudub sisu');
      }

      if (data.error) {
        throw new Error(data.error);
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.reply,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Viga ChatGPT päringu tegemisel:', error);
      setError(error.message || "Tundmatu viga");
      
      // Lisa veateate kuvamine vestlusesse
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `Vabandust, vestluse saatmisel tekkis viga: ${error.message || "Tundmatu viga"}. Palun proovi uuesti.`,
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, errorMessage]);
      toast.error("Vabandust, vestluse saatmisel tekkis viga. Palun proovi uuesti.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 p-4">
        <div className="flex items-center space-x-2 mb-6">
          <MessageSquare className="w-6 h-6 text-blue-600" />
          <h1 className="text-lg font-semibold text-gray-900">Matemaatika Õpetaja</h1>
        </div>
        <nav className="space-y-2">
          <Button
            variant="ghost"
            className="w-full justify-start text-gray-600 hover:text-blue-600 hover:bg-blue-50"
          >
            <History className="mr-2 h-4 w-4" />
            Vestluste Ajalugu
          </Button>
        </nav>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {/* Chat Messages */}
        <ScrollArea className="flex-1 p-4">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>Viga!</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex items-start space-x-2 animate-message-fade-in",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-lg p-4",
                    message.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-900 border border-gray-200"
                  )}
                >
                  {message.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t border-gray-200 p-4 bg-white">
          <div className="flex space-x-2">
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={(e) => {
                // Handle image upload
                console.log(e.target.files);
              }}
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={handleImageUpload}
              className="text-gray-500 hover:text-blue-600 hover:bg-blue-50"
            >
              <Image className="h-5 w-5" />
            </Button>
            <Input
              placeholder="Küsi oma matemaatika küsimus..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleSend();
                }
              }}
              className="flex-1"
            />
            <Button onClick={handleSend} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;

