import { useState } from "react";
import "./App.css";

import ChatWindow from "./components/ChatWindow";
import Sidebar from "./components/Sidebar";

function App() {
  const [conversations, setConversations] = useState([
    { id: "chat-1", title: "New conversation", messages: [] },
  ]);
  const [activeChatId, setActiveChatId] = useState("chat-1");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const activeConversation = conversations.find(({ id }) => id === activeChatId);

  function handleNewChat() {
    const id = `chat-${Date.now()}`;
    setConversations((current) => [
      ...current,
      { id, title: "New conversation", messages: [] },
    ]);
    setActiveChatId(id);
    setError("");
  }

  async function handleSendMessage(content) {
    if (!activeConversation || isLoading) return;
    const userMessage = { id: `user-${Date.now()}`, role: "user", content };
    const nextMessages = [...activeConversation.messages, userMessage];
    setConversations((current) => current.map((conversation) => (
      conversation.id === activeChatId
        ? {
            ...conversation,
            title: conversation.messages.length ? conversation.title : content.slice(0, 32),
            messages: nextMessages,
          }
        : conversation
    )));
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:3001/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content, history: activeConversation.messages }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "The assistant could not respond.");
      setConversations((current) => current.map((conversation) => (
        conversation.id === activeChatId
          ? { ...conversation, messages: [...nextMessages, { id: `assistant-${Date.now()}`, role: "assistant", content: data.reply }] }
          : conversation
      )));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="app">
      <Sidebar
        conversations={conversations}
        activeChatId={activeChatId}
        onNewChat={handleNewChat}
        onSelectChat={setActiveChatId}
      />

      <ChatWindow
        title={activeConversation?.title || "New conversation"}
        messages={activeConversation?.messages || []}
        isLoading={isLoading}
        error={error}
        onSendMessage={handleSendMessage}
      />
    </div>
  );
}

export default App;