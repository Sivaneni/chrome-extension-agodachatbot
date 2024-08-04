(() => {
    window.onload = function () {
        /*
         var listItems = document.querySelectorAll("#contentContainer > div:nth-child(3) > ol:nth-child(1)> li");
         // Iterate through each list item
         listItems.forEach((item) => {
             const h3Element = item.querySelector("header > div > h3");
             if (h3Element) {
                 // Create a button
                 const button = document.createElement("button");
                 button.textContent = "Extract Content";
                 button.classList.add("extract-button"); // Add a custom class
                 button.setAttribute("data-url", item.querySelector("div > div > a").href)
                 // Apply some styling (example: background color)
                 button.style.backgroundColor = "#0074D9";
                 button.style.color = "#FFFFFF";
                 button.style.border = "none";
                 button.style.padding = "8px 16px";
                 button.style.cursor = "pointer";
 
                 // Append the button below the <h3>
                 h3Element.insertAdjacentElement("afterend", button);
             }
         });
 
         const extractButtons = document.querySelectorAll('.extract-button');
         extractButtons.forEach(button => {
             button.addEventListener('click', handleButtonClick);
         });
 
         function handleButtonClick(event) {
             const clickedButton = event.target;
             const url = clickedButton.getAttribute('data-url');
             console.log('Clicked URL:', url);
 
             // Prevent multiple messages for the same URL
             if (clickedButton.classList.contains('processing')) {
                 console.log('Already processing URL:', url);
                 return;
             }
 
             clickedButton.classList.add('processing');
             console.log('Sending message for URL:', url);
             chrome.runtime.sendMessage({ message: "extracted_urls", url: url });
 
             const existingChatButton = document.querySelector(".Chat-button");
             if (!existingChatButton) {
                 const chatButton = document.createElement('button');
                 chatButton.textContent = 'Chat';
                 chatButton.classList.add("Chat-button");
                 chatButton.disabled = false;
                 chatButton.style.backgroundColor = "#0074D9";
                 chatButton.style.color = "#FFFFFF";
                 chatButton.style.border = "none";
                 chatButton.style.padding = "8px 16px";
                 chatButton.style.cursor = "pointer";
                 document.querySelector("#SearchBoxContainer > div > div > button").parentNode.appendChild(chatButton);
                 chatButton.addEventListener('click', loadChatPopup);
             }
         }
 
         function loadChatPopup() {
             // Logic for loading chat popup goes here
         }
             */

        // Adding a chat button to the DOM
        // Create the chat button
        const chatButton = document.createElement('img');
        chatButton.src = chrome.runtime.getURL('assets/chatbot.png');
        chatButton.style.position = 'fixed';
        chatButton.style.bottom = '20px';
        chatButton.style.right = '80px';
        chatButton.style.width = '50px';
        chatButton.style.height = '50px';
        chatButton.style.cursor = 'pointer';
        chatButton.style.zIndex = '9999';

        // Append the chat button to the body
        document.body.appendChild(chatButton);

        // Event listener to open the chatbot UI
        chatButton.addEventListener('click', () => {
            const chatbotFrame = document.createElement('iframe');
            chatbotFrame.src = chrome.runtime.getURL('popup.html');
            chatbotFrame.style.position = 'fixed';
            chatbotFrame.style.bottom = '80px';
            chatbotFrame.style.right = '40px';
            chatbotFrame.style.width = '400px';
            chatbotFrame.style.height = '600px';
            chatbotFrame.style.border = 'none';
            chatbotFrame.style.zIndex = '1000';

            // Append the chatbot iframe to the body
            document.body.appendChild(chatbotFrame);
            chatbotFrame.addEventListener('mouseleave', () => {
                chatbotFrame.style.display = 'none';
            });




        });
    }
})();
