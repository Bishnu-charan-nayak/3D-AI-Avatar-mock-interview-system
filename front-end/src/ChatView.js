import React from "react";
import "./ChatView.css";

const ChatView = ({ chatHistory }) => {
  return (
    <div className="chat-view">
      {chatHistory.map((chat, index) => (
        <div key={index} className={`chat-message ${chat.type}`}>
          {chat.message}
        </div>
      ))}
    </div>
  );
};

export default ChatView;
