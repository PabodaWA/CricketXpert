import React, { useState, useRef, useEffect } from 'react';

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm your CricketXpert assistant. How can I help you today?",
      isBot: true,
      timestamp: new Date(),
      buttons: [
        { text: "🛒 Shop Products", action: "products", link: "/products" },
        { text: "🔧 Equipment Repair", action: "repair", link: "/repair" },
        { text: "🏏 Coaching Programs", action: "coaching", link: "/programs" },
        { text: "🏟️ Book Ground", action: "ground", link: "/ground-booking" }
      ]
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      text: inputMessage,
      isBot: false,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputMessage;
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-001:generateContent?key=AIzaSyBDe_SoVZUy60RTT81ZvvkG8krVQAAHu4w`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are CricketXpert's AI assistant. Keep responses concise (2-3 sentences max). 

CricketXpert offers:
- Equipment Repair: Professional bat, pad, glove, helmet repairs with pickup/delivery
- Coaching Programs: Expert coaches, structured sessions, certificates, performance tracking
- E-commerce: Premium cricket gear, secure payments, fast delivery, order tracking
- Ground Booking: Multiple locations, flexible scheduling, equipment rental, slot booking

For bat purchases: Direct them to /products page and add a "Go to Products" button. For repairs: /repair and add "Book Repair" button. For coaching: /programs and add "View Programs" button. For ground booking: mention ground booking service and add "Book Ground" button.

User question: ${currentInput}`
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('API Response:', data); // Debug log
      
      let botResponse = "I'm sorry, I couldn't process your request right now. Please try again.";
      let buttons = null;
      
      if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
        botResponse = data.candidates[0].content.parts[0].text;
        
        // Add relevant buttons based on the response content
        if (botResponse.toLowerCase().includes('products') || botResponse.toLowerCase().includes('bat') || botResponse.toLowerCase().includes('gear')) {
          buttons = [{ text: "🛒 Go to Products", action: "products", link: "/products" }];
        } else if (botResponse.toLowerCase().includes('repair')) {
          buttons = [{ text: "🔧 Book Repair", action: "repair", link: "/repair" }];
        } else if (botResponse.toLowerCase().includes('coaching') || botResponse.toLowerCase().includes('program')) {
          buttons = [{ text: "🏏 View Programs", action: "coaching", link: "/programs" }];
        } else if (botResponse.toLowerCase().includes('ground') || botResponse.toLowerCase().includes('booking')) {
          buttons = [{ text: "🏟️ Book Ground", action: "ground", link: "/ground-booking" }];
        }
      } else if (data.error) {
        console.error('API Error:', data.error);
        botResponse = `I encountered an error: ${data.error.message || 'Unknown error'}`;
      }

      const botMessage = {
        id: Date.now() + 1,
        text: botResponse,
        isBot: true,
        timestamp: new Date(),
        buttons: buttons
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        id: Date.now() + 1,
        text: `I'm sorry, I'm having trouble connecting right now. Error: ${error.message}. Please try again later.`,
        isBot: true,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleButtonClick = (button) => {
    // Prevent multiple clicks
    if (isLoading) return;
    
    // Add user message showing what they clicked
    const userMessage = {
      id: Date.now(),
      text: `I want to ${button.action}`,
      isBot: false,
      timestamp: new Date()
    };

    // Get explanation based on button type
    let explanation = "";
    let buttonText = "";
    
    switch(button.action) {
      case "products":
        explanation = "Our e-commerce platform offers premium cricket equipment from top brands like Gray-Nicolls, SS, SG, and more. Browse bats, pads, gloves, helmets, and accessories with secure payments and fast delivery.";
        buttonText = "🛒 Browse Products";
        break;
      case "repair":
        explanation = "Professional equipment repair service with expert technicians. We repair bats, pads, gloves, helmets, and all cricket gear with quality guarantee, pickup/delivery, and progress tracking.";
        buttonText = "🔧 Book Repair";
        break;
      case "coaching":
        explanation = "Comprehensive coaching programs for all skill levels. Learn from professional coaches with structured sessions, performance tracking, certificates, and personalized feedback.";
        buttonText = "🏏 View Programs";
        break;
      case "ground":
        explanation = "Book cricket grounds and facilities for practice sessions and matches. Multiple locations with various amenities, equipment rental, and flexible slot booking system.";
        buttonText = "🏟️ Book Ground";
        break;
      case "navigate":
        // Direct navigation without explanation
        window.location.href = button.link;
        return;
      default:
        explanation = "Let me help you with that service.";
        buttonText = `Go to ${button.text}`;
    }

    // Add bot response with explanation
    const botMessage = {
      id: Date.now() + 1,
      text: explanation,
      isBot: true,
      timestamp: new Date(),
      buttons: [
        { text: buttonText, action: "navigate", link: button.link }
      ]
    };

    setMessages(prev => [...prev, userMessage, botMessage]);
  };

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-[#072679] to-[#42ADF5] text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center z-50 group"
        style={{ boxShadow: '0 4px 20px rgba(7, 38, 121, 0.3)' }}
      >
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
      </button>

      {/* Chat Popup */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-80 h-96 bg-white rounded-lg shadow-2xl border border-gray-200 z-40 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#072679] to-[#42ADF5] text-white p-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-sm">🤖</span>
              </div>
              <div>
                <h3 className="font-semibold text-sm">CricketXpert Assistant</h3>
                <p className="text-xs opacity-90">Online</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                    message.isBot
                      ? 'bg-white text-gray-800 border border-gray-200'
                      : 'bg-gradient-to-r from-[#072679] to-[#42ADF5] text-white'
                  }`}
                >
                  <p>{message.text}</p>
                  
                  {/* Buttons for bot messages */}
                  {message.buttons && message.isBot && (
                    <div className="mt-3 space-y-2">
                      {message.buttons.map((button, index) => (
                        <button
                          key={index}
                          onClick={() => handleButtonClick(button)}
                          className="w-full px-3 py-2 text-xs font-medium text-white rounded-md transition-all duration-200 hover:opacity-90 transform hover:scale-105"
                          style={{ 
                            background: 'linear-gradient(135deg, #42ADF5, #072679)',
                            boxShadow: '0 2px 4px rgba(7, 38, 121, 0.2)'
                          }}
                        >
                          {button.text}
                        </button>
                      ))}
                    </div>
                  )}
                  
                  <p className={`text-xs mt-1 ${
                    message.isBot ? 'text-gray-500' : 'text-white/70'
                  }`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white text-gray-800 border border-gray-200 px-3 py-2 rounded-lg text-sm">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 bg-white border-t border-gray-200">
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42ADF5] focus:border-transparent text-sm"
                disabled={isLoading}
              />
              <button
                onClick={sendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="px-4 py-2 bg-gradient-to-r from-[#072679] to-[#42ADF5] text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatBot;
