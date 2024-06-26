document.addEventListener('DOMContentLoaded', function () {
    let socket = null;
    let stompClient = null;
    let username = null;
    let currentChat = 'Public chat';

    // Event listener for username input
    document.getElementById('send-username-btn').addEventListener('click', function () {
        const usernameField = document.getElementById('input-username');
        const enteredUsername = usernameField.value.trim();
        if (enteredUsername) {
            username = enteredUsername;
            document.getElementById('username-container').style.display = 'none';
            document.getElementById('chat-container').style.display = 'flex';
            connectAndSubscribe();
        }
    });

    // Connect to WebSocket and subscribe to topics
    function connectAndSubscribe() {
        socket = new SockJS('/chat-websocket');
        stompClient = Stomp.over(socket);
        stompClient.connect({}, function (frame) {
            console.log('Connected: ' + frame);

            // Subscribe to receive messages
            stompClient.subscribe('/topic/messages', function (messageOutput) {
                showMessage(JSON.parse(messageOutput.body));
            });

            // Subscribe to private messages
            stompClient.subscribe(`/user/${username}/queue/messages`, function (messageOutput) {
                console.log("HERE:", messageOutput.body);
                showMessage(JSON.parse(messageOutput.body));
            });

            // Subscribe to user events
            stompClient.subscribe('/topic/users', function (messageOutput) {
                updateUserList(JSON.parse(messageOutput.body));
            });

            // Notify the server about the new user
            stompClient.send("/app/addUser", {}, username);

            currentChat = 'Public chat';
            document.getElementById('chat-with').textContent = 'Public chat';

            fetchPublicMessages();
        });
    }

    // Event listener on sending user message
    document.getElementById('send-msg-btn').addEventListener('click', function(event) {
        event.preventDefault(); // Prevent the form from submitting
        let messageField = document.getElementById('input-msg');
        if (messageField.value.trim() !== "") {
            const messageContent = {
                sender: username,
                content: messageField.value,
                date: new Date().toLocaleString(),
                recipient: currentChat === "Public chat"? null: currentChat
            };
            if(currentChat === "Public chat") {
                // Sends a message to the server at the /app/sendMessage destination,
                // which is handled by the sendMessage method in the ChatController
                stompClient.send("/app/sendMessage", {}, JSON.stringify(messageContent));
            } else {
                stompClient.send("/app/sendUserMessage", {}, JSON.stringify(messageContent));
            }

            messageField.value = ""; // Clear the user input field
        }
    });

    // Function to display messages
    function showMessage(message) {
        if ((currentChat === 'Public chat' && !message.recipient) ||
            (currentChat !== 'Public chat' &&
             ((message.sender === username && message.recipient === currentChat) ||
              (message.recipient === username && message.sender === currentChat)))) {
            console.log("here");
            let messageContainer = document.createElement('div');
            messageContainer.classList.add('message-container');

            let senderElement = document.createElement('div');
            senderElement.classList.add('sender');
            senderElement.textContent = message.sender;
            messageContainer.appendChild(senderElement);

            let dateElement = document.createElement('div');
            dateElement.classList.add('date');
            dateElement.textContent = message.date;
            messageContainer.appendChild(dateElement);

            let messageElement = document.createElement('div');
            messageElement.classList.add('message');
            messageElement.textContent = message.content;
            messageContainer.appendChild(messageElement);

            document.getElementById('messages').appendChild(messageContainer);
            messageContainer.scrollIntoView({ "behavior": "smooth" }); // Auto-scroll to an element with a smooth effect
        }
    }

    // Function to update the user list
    function updateUserList(users) {
        const userList = document.getElementById('users');
        userList.innerHTML = ''; // Clear the user list
        users.forEach(user => {
            if (user !== username) {
                let userElement = document.createElement('div');
                userElement.classList.add('user');
                userElement.textContent = user;
                userElement.addEventListener('click', () => openPrivateChat(user));
                userList.appendChild(userElement);
            }
        });
    }

    function openPrivateChat(user) {
        document.getElementById('messages').innerHTML = '';
        document.getElementById('chat-with').textContent = user;
        currentChat = user;

        fetchPrivateMessages(username, user);
    }

    document.getElementById('public-chat-btn').addEventListener('click', function() {
        if(currentChat !== 'Public chat') {
            document.getElementById('messages').innerHTML = '';
            currentChat = 'Public chat';
            document.getElementById('chat-with').textContent = currentChat;
            fetchPublicMessages();
        }
    })

    // Fetch and display previous messages
    // Sends a GET to the /chat/messages in the ChatController
    function fetchPublicMessages() {
        fetch('/chat/messages')
            .then(response => response.json())
            .then(messages => {
                messages.forEach(showMessage);
            })
            .catch(error => console.error('Error fetching messages:', error))
    }

    // Fetch and display previous messages
    // Sends a GET to the user/chat/messages in the ChatController
    function fetchPrivateMessages(sender, recipient) {
        fetch(`/user/chat/messages?sender=${sender}&recipient=${recipient}`)
            .then(response => response.json())
            .then(messages => {
                messages.forEach(showMessage);
            })
            .catch(error => console.error('Error fetching messages:', error))
    }
});
