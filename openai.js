// Function to communicate with the background script and OpenAI API
function getTextAndChatWithOpenAI(callback) {
    // Send message to background script requesting extracted text
    chrome.runtime.sendMessage({ type: "getText" }, function (response) {
        const extractedText = response.text;

        // Once text is retrieved, send it to OpenAI API for conversation
        sendMessageToOpenAI(extractedText, function (response) {
            callback(response);
        });
    });
}

// Function to send a message to the OpenAI API and receive a response
function sendMessageToOpenAI(message, callback) {
    // Define your OpenAI API key
    const apiKey = 'YOUR_OPENAI_API_KEY';

    // Define the parameters for the API request
    const params = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: 'text-davinci-003', // Model to use for the conversation
            messages: [
                { role: 'user', content: message }
            ]
        })
    };

    // Make the API request
    fetch('https://api.openai.com/v1/chat/completions', params)
        .then(response => response.json())
        .then(data => {
            // Extract and return the bot's response
            const botResponse = data.choices[0].text;
            callback(botResponse);
        })
        .catch(error => {
            console.error('Error communicating with OpenAI API:', error);
            callback(null); // Handle errors gracefully
        });
}

// Example usage: Get text from storage and use it for conversation with the OpenAI API
getTextAndChatWithOpenAI(function (response) {
    console.log("Response from OpenAI API:", response);
    // Use the response from the OpenAI API as needed
});
