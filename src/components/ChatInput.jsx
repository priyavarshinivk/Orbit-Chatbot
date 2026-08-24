import { useState } from "react";

function ChatInput({ onSendMessage, disabled }) {
  const [input, setInput] = useState("");

  function handleChange(event) {
    setInput(event.target.value);
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (!input.trim()) {
      return;
    }

    onSendMessage(input.trim());

    setInput("");
  }

  return (
    <form className="chat-input" onSubmit={handleSubmit}>
      <input
        value={input}
        onChange={handleChange}
        placeholder="Message Orbit..."
        disabled={disabled}
      />

      <button type="submit" disabled={disabled || !input.trim()}>Send <span>↗</span></button>
    </form>
  );
}

export default ChatInput;