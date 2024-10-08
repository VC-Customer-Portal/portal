import { useState, useEffect } from 'react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Send, Bot, User } from "lucide-react"
import { GoogleGenerativeAI } from '@google/generative-ai'

type Message = {
    sender: string;
    text: string;
  }

// Save messages to sessionStorage
const saveMessagesToSession = (messages: Message[]) => {
  sessionStorage.setItem("chatMessages", JSON.stringify(messages))
}

// Load messages from sessionStorage
const loadMessagesFromSession = () => {
  const storedMessages = sessionStorage.getItem("chatMessages")
  return storedMessages ? JSON.parse(storedMessages) : []
}

async function fetchAIResponse(message: string): Promise<string> {
  const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI as string)
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: `You are a Virtual Assistant for a Customer Payment Portal. Your primary role is to help users navigate the website and assist them with various tasks, such as editing their profile, making payments, viewing payment data, and submitting queries for support. All your responses should be in plain text. Do not use any Markdown formatting.

    The only time that you should use html is when providing the href for the link the user can go to. Make sure when you provide the link it is not followed by a trailing fullstop "." as this will not allow user to navigate to the correct url

    Key Features and Capabilities of the Website:

        Profile Editing:
            Users can edit their profile information, such as name, email, and contact details.
            When asked, provide a direct link to the profile page: Profile: https://apdscustomerportal.online/edit

        Making a Payment:
            The website allows users to make payments securely using four available payment methods: Credit Card, Stripe, Apple Pay, PayPal.
            Provide the payment page link: Payment: https://apdscustomerportal.online/payment

        Viewing Payments:
            Users can view their previous payments through charts and tables. Provide the link: View Payment: http://localhost:5173/mypayments

        Submitting a Query:
            Provide the contact form link: Contact Form: https://apdscustomerportal.online/dashboard#contact
    `,
  })

  try {
    const result = await model.generateContent(message)
    const responseText = await result.response.text()
    return responseText
  } catch (error) {
    console.error("Error generating content:", error)
    return "Sorry, something went wrong. Please try again."
  }
}

// Utility function to turn URLs into clickable links
function linkify(text: string) {
  // Regex to match URLs and optionally capture trailing punctuation
  const urlPattern = /(https?:\/\/[^\s]+)([.,!?;]?)\s*/g;

  return text.replace(urlPattern, (url, punctuation) => {
    // Create the anchor tag without the trailing punctuation
    const anchorTag = `<a href="${url}" style="color: blue; text-decoration: underline;">${url}</a>`;
    
    // Return the anchor tag followed by the punctuation (if any)
    return `${anchorTag}${punctuation} `;
  });
}


export default function Chat() {
  const [messages, setMessages] = useState<{ sender: string; text: string }[]>(loadMessagesFromSession())
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Effect to load messages from session storage on initial render
  useEffect(() => {
    const storedMessages = loadMessagesFromSession()
    setMessages(storedMessages)
  }, [])

  // Update sessionStorage whenever messages state changes
  useEffect(() => {
    saveMessagesToSession(messages)
  }, [messages])

  const handleSendMessage = async () => {
    if (inputMessage.trim() === "") return

    const newMessages = [...messages, { sender: 'user', text: inputMessage }]
    setMessages(newMessages)
    setInputMessage("")

    setIsLoading(true)
    const aiResponse = await fetchAIResponse(inputMessage)
    setIsLoading(false)

    setMessages([...newMessages, { sender: 'ai', text: aiResponse }])
  }

  return (
    <Accordion type="single" collapsible className="w-full max-w-md mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
      <AccordionItem value="chat" className="border-b">
        <AccordionTrigger className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90">
          <span className="flex items-center">
            <Bot className="w-5 h-5 mr-2" />
            Virtual Assistant
          </span>
        </AccordionTrigger>
        <AccordionContent>
          <div className="p-4">
            <div className="h-64 overflow-y-auto mb-4 space-y-4">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${
                    msg.sender === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      msg.sender === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground'
                    }`}
                  >
                    <div className="flex items-center mb-1">
                      {msg.sender === 'user' ? (
                        <User className="w-4 h-4 mr-2" />
                      ) : (
                        <Bot className="w-4 h-4 mr-2" />
                      )}
                      <span className="font-semibold">
                        {msg.sender === 'user' ? 'You' : 'AI'}
                      </span>
                    </div>
                    {/* Render text with clickable links */}
                    <p dangerouslySetInnerHTML={{ __html: linkify(msg.text) }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex space-x-2">
              <Textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Type your message..."
                disabled={isLoading}
                className="flex-grow"
                rows={1}
              />
              <Button
                onClick={handleSendMessage}
                disabled={isLoading || inputMessage.trim() === ""}
                className="px-3"
              >
                <Send className="w-4 h-4" />
                <span className="sr-only">Send</span>
              </Button>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
