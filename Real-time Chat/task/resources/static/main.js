document.addEventListener('DOMContentLoaded', function () {
    let socket = null;
    let stompClient = null;
    let username = null;

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

            // Fetch and display previous messages
            // Sends a GET to the /chat/messages in the ChatController
            fetch('/chat/messages')
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok ' + response.statusText);
                    }
                    return response.json();
                })
                .then(messages => {
                    console.log('Fetched messages:', messages);
                    messages.forEach(showMessage);
                })
                .catch(error => {
                    console.error('Error fetching messages:', error);
                });
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
                date: new Date().toLocaleString()
            };
            // Sends a message to the server at the /app/sendMessage destination,
            // which is handled by the sendMessage method in the ChatController
            stompClient.send("/app/sendMessage", {}, JSON.stringify(messageContent));
            messageField.value = ""; // Clear the user input field
        }
    });

    // Function to display messages
    function showMessage(message) {
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
});