function Sidebar({ conversations, activeChatId, onNewChat, onSelectChat }) {
  return (
    <div className="sidebar">
      <div className="brand"><span className="brand-mark">✦</span><h2>Orbit</h2></div>

      <button className="new-chat" onClick={onNewChat}>+ New Chat</button>

      <p className="history-label">Recent chats</p>
      <div className="history">
        {conversations.map((conversation) => (
          <button
            className={`history-item ${conversation.id === activeChatId ? "active" : ""}`}
            key={conversation.id}
            onClick={() => onSelectChat(conversation.id)}
          >
            <span className="history-icon">◌</span>{conversation.title}
          </button>
        ))}
      </div>
    </div>
  );
}

export default Sidebar;