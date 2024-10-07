import { useState } from 'react';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button"; // Assuming you have a Button component from Shadcn UI
import { GoogleGenerativeAI } from '@google/generative-ai';

async function fetchAIResponse(message: string): Promise<string> {
    const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI as string);
    const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        systemInstruction: "You are a Virtual Assist. You will help users with dificulties and navigating the Customer Portal. For now the only function is Editing the logged in users details."
    });

    try {
        const result = await model.generateContent(message);
        const responseText = await result.response.text();
        return responseText;
    } catch (error) {
        console.error("Error generating content:", error);
        return "Sorry, something went wrong. Please try again.";
    }
}

const Chat: React.FC = () => {
    const [messages, setMessages] = useState<{ sender: string; text: string }[]>([]);
    const [inputMessage, setInputMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSendMessage = async () => {
        if (inputMessage.trim() === "") return;

        // Add user message to the chat
        const newMessages = [...messages, { sender: 'user', text: inputMessage }];
        setMessages(newMessages);
        setInputMessage(""); // Clear input

        setIsLoading(true); // Show loading while waiting for AI response
        const aiResponse = await fetchAIResponse(inputMessage);
        setIsLoading(false);

        // Add AI response to the chat
        setMessages([...newMessages, { sender: 'ai', text: aiResponse }]);
    };

    return (
        <Accordion type="single" collapsible className='bg-slate-100 px-2'>
            <AccordionItem value="chat">
                <AccordionTrigger>Virtual Assistant</AccordionTrigger>
                <AccordionContent>
                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        {messages.map((msg, index) => (
                            <div key={index} className={`message ${msg.sender}`}>
                                <strong>{msg.sender === 'user' ? 'You: ' : 'AI: '}</strong>
                                {msg.text}
                            </div>
                        ))}
                    </div>
                    <div style={{ marginTop: '10px' }}>
                        <Textarea
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            placeholder="Type your message..."
                            disabled={isLoading}
                        />
                        <Button onClick={handleSendMessage} disabled={isLoading || inputMessage.trim() === ""}>
                            {isLoading ? "Loading..." : "Send"}
                        </Button>
                    </div>
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    );
}

export default Chat;
