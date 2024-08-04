document.getElementById('send-button').addEventListener('click', () => {
    const userInput = document.getElementById('user-input').value;
    const chatContent = document.getElementById('chat-content');

    if (userInput.trim() !== '') {
        const userMessage = document.createElement('div');
        userMessage.textContent = userInput;
        userMessage.className = 'user-message';
        chatContent.appendChild(userMessage);

        // Clear the input field
        document.getElementById('user-input').value = '';

        // Simulate a chatbot response
        const botMessage = document.createElement('div');
        botMessage.textContent = 'This is a chatbot response.';
        botMessage.className = 'bot-message';
        chatContent.appendChild(botMessage);

        // Scroll to the bottom
        chatContent.scrollTop = chatContent.scrollHeight;
    }
});
