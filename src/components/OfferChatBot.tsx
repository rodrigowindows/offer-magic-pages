import { useState } from "react";
import { MessageCircle, X, Send, Bot } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
}

interface OfferChatBotProps {
  propertyAddress: string;
  cashOffer: number;
}

const OfferChatBot = ({ propertyAddress, cashOffer }: OfferChatBotProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: `Hi! 👋 I see you're looking at the offer for ${propertyAddress}. How can I help you today?`,
      isBot: true,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const quickQuestions = [
    "How fast can you close?",
    "Are there any fees?",
    "Can I negotiate the offer?",
    "What if I change my mind?"
  ];

  const getBotResponse = (question: string): string => {
    const q = question.toLowerCase();
    
    if (q.includes("fast") || q.includes("close") || q.includes("quick")) {
      return "We typically close in 7-14 days, but we can work with your timeline. Some sellers prefer a longer closing period to arrange their move. What works best for you?";
    }
    if (q.includes("fee") || q.includes("cost") || q.includes("commission")) {
      return "There are absolutely NO fees, commissions, or hidden costs. The cash offer you see is exactly what you'll receive at closing. We cover all closing costs!";
    }
    if (q.includes("negotiate") || q.includes("higher") || q.includes("more")) {
      return `Our offer of $${cashOffer.toLocaleString()} is based on current market conditions and property condition. While we strive to give fair offers upfront, feel free to discuss your situation with our team - sometimes we can adjust based on specific circumstances.`;
    }
    if (q.includes("change") || q.includes("mind") || q.includes("back out")) {
      return "No problem at all! There's absolutely no obligation. You can decide not to proceed at any time before closing with no penalties. We want you to feel completely comfortable with your decision.";
    }
    if (q.includes("repair") || q.includes("condition") || q.includes("fix")) {
      return "You don't need to make any repairs! We buy properties as-is, meaning you can leave everything exactly as it is. No cleaning, no fixing, no staging required.";
    }
    if (q.includes("tax") || q.includes("foreclosure") || q.includes("debt")) {
      return "We specialize in helping homeowners facing tax issues or foreclosure. We can often pay off your tax debt directly at closing and put the remaining equity in your pocket. Would you like to speak with someone about your specific situation?";
    }
    
    return "Great question! Our team would be happy to discuss this in detail. Would you like us to call you to explain more? Just fill out the form above with your contact info!";
  };

  const handleSend = (text?: string) => {
    const messageText = text || input;
    if (!messageText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      isBot: false,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    // Simulate typing delay
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: getBotResponse(messageText),
        isBot: true,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
  };

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`
          fixed bottom-6 right-6 z-50 
          w-14 h-14 rounded-full 
          bg-secondary text-secondary-foreground
          shadow-lg hover:shadow-xl
          flex items-center justify-center
          transition-all duration-300
          ${isOpen ? 'scale-0' : 'scale-100'}
        `}
      >
        <MessageCircle className="w-6 h-6" />
      </button>

      {/* Chat Window */}
      <div 
        className={`
          fixed bottom-6 right-6 z-50
          w-[360px] max-w-[calc(100vw-48px)]
          bg-card rounded-2xl shadow-strong border border-border
          flex flex-col
          transition-all duration-300 origin-bottom-right
          ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}
        `}
        style={{ height: '500px', maxHeight: 'calc(100vh - 100px)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
              <Bot className="w-5 h-5 text-secondary" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Offer Assistant</p>
              <p className="text-xs text-success flex items-center gap-1">
                <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
                Online now
              </p>
            </div>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div 
              key={message.id}
              className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
            >
              <div 
                className={`
                  max-w-[80%] rounded-2xl px-4 py-2 text-sm
                  ${message.isBot 
                    ? 'bg-muted text-foreground rounded-bl-none' 
                    : 'bg-secondary text-secondary-foreground rounded-br-none'}
                `}
              >
                {message.text}
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-2xl rounded-bl-none px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Questions */}
        <div className="px-4 pb-2">
          <div className="flex flex-wrap gap-2">
            {quickQuestions.slice(0, 2).map((q, i) => (
              <button
                key={i}
                onClick={() => handleSend(q)}
                className="text-xs bg-muted hover:bg-muted/80 text-foreground px-3 py-1.5 rounded-full transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="p-4 border-t border-border">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="flex gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question..."
              className="flex-1"
            />
            <Button type="submit" size="icon" className="bg-secondary hover:bg-secondary/90">
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>
    </>
  );
};

export default OfferChatBot;
