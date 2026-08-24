import ChatInput from "./ChatInput";

function ChatWindow({ title, messages, isLoading, error, onSendMessage }) {
  return (
    <div className="chat-window">
      <header className="chat-header"><span className="status-dot" /><div><p className="eyebrow">AI workspace</p><h1>{title}</h1></div></header>

      <div className="messages">
        {!messages.length && <div className="empty-state"><span>✦</span><h2>What can I help you explore?</h2><p>Ask a question, solve a calculation, or check the current time.</p></div>}
        {messages.map((message) => (
          <div className={`message ${message.role}`} key={message.id}><span className="avatar">{message.role === "user" ? "Y" : "✦"}</span><div><p className="message-role">{message.role === "user" ? "You" : "Orbit"}</p><p>{message.content}</p></div></div>
        ))}
        {isLoading && <div className="message assistant"><span className="avatar">✦</span><div><p className="message-role">Orbit</p><p className="typing">Thinking<span>.</span><span>.</span><span>.</span></p></div></div>}
        {error && <div className="error">{error}</div>}
      </div>

      <ChatInput onSendMessage={onSendMessage} disabled={isLoading} />
    </div>
  );
}

export default ChatWindow;