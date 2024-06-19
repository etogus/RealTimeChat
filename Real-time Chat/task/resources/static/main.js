// Event listener on sending user message
document.getElementById('send-msg-btn').addEventListener('click', function(event) {
    event.preventDefault(); // Prevent the form from submitting
    let messageField = document.getElementById('input-msg');
    if(messageField.value.trim() != "") {
        console.log(messageField.value);
        let messageElement = document.createElement('div');
        messageElement.classList.add('message');
        messageElement.textContent = messageField.value;
        document.getElementById('messages').appendChild(messageElement);
        messageElement.scrollIntoView({"behavior": "smooth"}); // Auto-scroll to an element with a smooth effect
        messageField.value = ""; // Clear the user input field
    }
});