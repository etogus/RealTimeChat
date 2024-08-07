import React, { useState, useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import '../Chat.css';

function Chat() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [username, setUsername] = useState('');
  const [currentChat, setCurrentChat] = useState('Public chat');
  const [users, setUsers] = useState([]);
  const [stompClient, setStompClient] = useState(null);
  const [connected, setConnected] = useState(false);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (username && !connected) {
      connectAndSubscribe();
    }
  }, [username, connected]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const connectAndSubscribe = () => {
    const socket = new SockJS('http://localhost:8080/chat-websocket');
    const client = new Client({
      webSocketFactory: () => socket,
      onConnect: () => {
        setConnected(true);
        client.subscribe('/topic/messages', (message) => {
          const receivedMessage = JSON.parse(message.body);
          setMessages((prevMessages) => [...prevMessages, receivedMessage]);
        });

        client.subscribe(`/user/${username}/queue/messages`, (message) => {
          const receivedMessage = JSON.parse(message.body);
          setMessages((prevMessages) => [...prevMessages, receivedMessage]);
        });

        client.subscribe('/topic/users', (message) => {
          setUsers(JSON.parse(message.body));
        });

        client.publish({ destination: '/app/addUser', body: username });

        setCurrentChat('Public chat');
        fetchPublicMessages();
      },
    });

    client.activate();
    setStompClient(client);
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (inputMessage.trim() !== '' && stompClient) {
      const messageContent = {
        sender: username,
        content: inputMessage,
        date: new Date().toLocaleString(),
        recipient: currentChat === 'Public chat' ? null : currentChat,
      };

      if (currentChat === 'Public chat') {
        stompClient.publish({
          destination: '/app/sendMessage',
          body: JSON.stringify(messageContent),
        });
      } else {
        stompClient.publish({
          destination: '/app/sendUserMessage',
          body: JSON.stringify(messageContent),
        });
      }

      setInputMessage('');
    }
  };

  const fetchPublicMessages = () => {
    fetch('http://localhost:8080/chat/messages')
      .then((response) => response.json())
      .then((data) => setMessages(data))
      .catch((error) => console.error('Error fetching messages:', error));
  };

  const fetchPrivateMessages = (recipient) => {
    fetch(`http://localhost:8080/user/chat/messages?sender=${username}&recipient=${recipient}`)
      .then((response) => response.json())
      .then((data) => setMessages(data))
      .catch((error) => console.error('Error fetching messages:', error));
  };

  const handleUserClick = (user) => {
    setCurrentChat(user);
    fetchPrivateMessages(user);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const [tempUsername, setTempUsername] = useState('');

  if (!username) {
    return (
      <div>
        <input
          type="text"
          placeholder="Enter username"
          value={tempUsername}
          onChange={(e) => setTempUsername(e.target.value)}
        />
        <button onClick={() => {
          if (tempUsername.trim()) {
            setUsername(tempUsername.trim());
          }
        }}>Join Chat</button>
      </div>
    );
  }

  return (
    <>
      {!username ? (
        <div id="username-container">
          <input
            type="text"
            id="input-username"
            placeholder="Enter username..."
            value={tempUsername}
            onChange={(e) => setTempUsername(e.target.value)}
          />
          <button
            id="send-username-btn"
            type="button"
            onClick={() => {
              if (tempUsername.trim()) {
                setUsername(tempUsername.trim());
              }
            }}
          >
            Send
          </button>
        </div>
      ) : (
        <div id="chat-container" style={{ display: 'flex' }}>
          <div id="left-column">
            <div id="users" className="user-list">
              {users.filter(user => user !== username).map((user) => (
                <div key={user} className="user-container" onClick={() => handleUserClick(user)}>
                  <div className="user">{user}</div>
                  <div className="new-message-counter" style={{display: 'none'}}></div>
                </div>
              ))}
            </div>
            <button id="public-chat-btn" onClick={() => { setCurrentChat('Public chat'); fetchPublicMessages(); }}>
              Public chat
            </button>
          </div>

          <div id="right-column">
            <div id="chat-with">{currentChat}</div>
            <div id="messages">
              {messages.map((msg, index) => (
                <div key={index} className="message-container">
                  <div className="sender">{msg.sender}</div>
                  <div className="date">{msg.date}</div>
                  <div className="message">{msg.content}</div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <div className="input-footer">
              <form onSubmit={sendMessage}>
                <textarea
                  id="input-msg"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Type a message"
                />
                <button id="send-msg-btn" type="submit">
                  <i className="fas fa-paper-plane"></i>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Chat;