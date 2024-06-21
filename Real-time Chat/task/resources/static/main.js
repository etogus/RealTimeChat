document.addEventListener('DOMContentLoaded', (event) => {
    // WebSocket connection setup
    let socket = new SockJS('/chat-websocket');
    let stompClient = Stomp.over(socket);

    stompClient.connect({}, function (frame) {
        console.log('Connected: ' + frame);

        // Subscribe to the /topic/messages endpoint to receive broadcast messages from the server
        stompClient.subscribe('/topic/messages', function (messageOutput) {
            showMessage(JSON.parse(messageOutput.body).content);
        });
    });

    // Event listener on sending user message
    document.getElementById('send-msg-btn').addEventListener('click', function(event) {
        event.preventDefault(); // Prevent the form from submitting
        let messageField = document.getElementById('input-msg');
        if (messageField.value.trim() !== "") {
            // Sends a message to the server at the /app/sendMessage destination,
            // which is handled by the sendMessage method in the ChatController
            stompClient.send("/app/sendMessage", {}, JSON.stringify({'content': messageField.value}));
            messageField.value = ""; // Clear the user input field
        }
    });

    // Function to display message
    function showMessage(message) {
        let messageElement = document.createElement('div');
        messageElement.classList.add('message');
        messageElement.textContent = message;
        document.getElementById('messages').appendChild(messageElement);
        messageElement.scrollIntoView({"behavior": "smooth"}); // Auto-scroll to an element with a smooth effect
    }
});