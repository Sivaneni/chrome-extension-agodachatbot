chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (message.message === 'extracted_content') {
        // Extract hotel name and data from the message
        let hotelName = message.hotelName;
        let data = message.data;

        // Save data to chrome.storage with hotel name as the key
        let storageData = {};
        storageData[hotelName] = data;
        chrome.storage.local.set(storageData, function () {
            console.log('Data saved to chrome.storage with hotel name:', hotelName);
        });
    }
});

// background.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.message === "extracted_urls") {
        chrome.tabs.create({ url: request.url }, (newTab) => {
            let newTabId = newTab.id;

            // Listen for tab updates to inject extract.js when the tab is fully loaded
            chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo) {
                if (tabId === newTabId && changeInfo.status === 'complete') {
                    chrome.scripting.executeScript({
                        target: { tabId: tabId },
                        files: ['extract.js']
                    });
                    chrome.tabs.onUpdated.removeListener(listener);
                }
            });

            // Listen for the extraction_done message
            chrome.runtime.onMessage.addListener(function messageListener(response, sender) {
                if (response.message === "extraction_done" && sender.tab.id === newTabId) {
                    chrome.tabs.remove(newTabId);
                    chrome.runtime.onMessage.removeListener(messageListener);
                }
            });
        });
    }
});








// Initialize chat history
let chatHistory;

// Listen for when the extension is installed
chrome.runtime.onInstalled.addListener(function () {
    // Set default API model
    let defaultModel = "gpt-4o";
    chrome.storage.local.set({ apiModel: defaultModel });

    // Set empty chat history
    chrome.storage.local.set({ chatHistory: [] });

    // Open the options page
    chrome.runtime.openOptionsPage();
});

// Listen for messages from the popup script
chrome.runtime.onMessage.addListener(async function (message, sender, sendResponse) {

    if (message.userInput) {

        // Get the API key from local storage
        const { apiKey } = await getStorageData(["apiKey"]);
        // Get the model from local storage
        const { apiModel } = await getStorageData(["apiModel"]);

        // get the chat history from local storage
        const result = await getStorageData(["chatHistory"]);
        var context = ``;

        if (!result.chatHistory || result.chatHistory.length === 0) {
            chatHistory = [
                { role: "system", content: `You are a Q&A bot. You are here to answer questions based on the context provided in single quotes. You are prohibited from using prior knowledge and you can only use the context given. If you need more information, please ask the user. If you cannot answer the question from the context, you can tell the user that you cannot answer the question. You can also ask for more information from the user.If the question is about two different hotels then display in tabular data.please display the data without any special characters,If there is a some remote similarity between context and query you can say that the context doesn't have that information but here is something that is mentioned.context is ${context}` },
            ];
        } else {
            chatHistory = result.chatHistory;
        }

        // save user's message to message array
        chatHistory.push({ role: "user", content: message.userInput });

        if (apiModel === "dall-e-3") {
            // Send the user's message to the OpenAI API
            const response = await fetchImage(message.userInput, apiKey, apiModel);

            if (response && response.data && response.data.length > 0) {
                // Get the image URL
                const imageUrl = response.data[0].url;

                // Add the assistant's response to the message array
                chatHistory.push({ role: "assistant", content: imageUrl });

                // save message array to local storage
                chrome.storage.local.set({ chatHistory: chatHistory });

                // Send the image URL to the popup script
                chrome.runtime.sendMessage({ imageUrl: imageUrl });

                console.log("Sent image URL to popup:", imageUrl);
            }
            return true; // Enable response callback
        } else {
            // Send the user's message to the OpenAI API
            const response = await fetchChatCompletion(chatHistory, apiKey, apiModel);
            console.log("response from OPENAIAPI", response);


            if (response && response.choices && response.choices.length > 0) {

                // Get the assistant's response
                // const assistantResponse = response.choices[0].message.content;

                if (response.choices[0].message.tool_calls) {
                    console.log("in tools call");
                    for (const toolCall of response.choices[0].message.tool_calls) {
                        if (toolCall.function.name === 'read_website_content') {
                            const search_query = JSON.parse(toolCall.function.arguments).search_query;
                            var websiteContent = await read_website_content(search_query);
                            websiteContent += context
                            websiteContent += "\n--------------------------"
                            //print("in tools call", websiteContent)
                            chatHistory.push({ role: "assistant", tool_calls: [toolCall] });
                            chatHistory.push({
                                tool_call_id: toolCall.id,
                                role: 'tool',
                                name: toolCall.function.name,
                                content: websiteContent,
                            });
                        }
                    }

                    console.log("messages sending before second chat completion", chatHistory);
                    const secondChatCompletion = await fetchtoolsChatCompletion(chatHistory, apiKey, apiModel);
                    console.log(secondChatCompletion);
                    const assistantResponse = secondChatCompletion.choices[0].message.content;
                    console.log("getting response from second chat completion", assistantResponse);

                    // Add the assistant's response to the message array
                    chatHistory.push({ role: "assistant", content: assistantResponse });
                    console.log("chat history is", chatHistory);

                    // save message array to local storage
                    chrome.storage.local.set({ chatHistory: chatHistory });

                    // Send the assistant's response to the popup script
                    chrome.runtime.sendMessage({ answer: assistantResponse });

                    console.log("Sent response to popup:", assistantResponse);
                }

                else {

                    const assistantResponse = response.choices[0].message.content;
                    chatHistory.push({ role: "assistant", content: assistantResponse });

                    // save message array to local storage
                    chrome.storage.local.set({ chatHistory: chatHistory });

                    // Send the assistant's response to the popup script
                    chrome.runtime.sendMessage({ answer: assistantResponse });

                    console.log("Sent response to popup:", assistantResponse);
                }
                return true; // Enable response callback
            }
        }

        return true; // Enable response callback
    }
});

// Fetch data from the OpenAI Chat Completion API
async function fetchChatCompletion(messages, apiKey, apiModel) {
    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                "messages": messages,
                "model": apiModel,
                tools: tools,
                tool_choice: 'auto',
            })
        });

        if (!response.ok) {
            if (response.status === 401) {
                // Unauthorized - Incorrect API key
                throw new Error("Looks like your API key is incorrect. Please check your API key and try again.");
            } else {
                throw new Error(`Failed to fetch. Status code: ${response.status}`);
            }
        }

        return await response.json();
    } catch (error) {
        // Send a response to the popup script
        chrome.runtime.sendMessage({ error: error.message });

        console.error(error);
    }
}


async function fetchtoolsChatCompletion(messages, apiKey, apiModel) {
    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                "messages": messages,
                "model": apiModel,
            })
        });

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error("Looks like your API key is incorrect. Please check your API key and try again.");
            } else {
                const errorText = await response.text();
                console.error("Error response:", errorText);
                throw new Error(`Failed to fetch. Status code: ${response.status}`);
            }
        }

        return await response.json();
    } catch (error) {
        console.error("An error occurred:", error.message);
        throw error;
    }
}

// Fetch Image from the OpenAI DALL-E API
async function fetchImage(prompt, apiKey, apiModel) {
    try {
        const response = await fetch('https://api.openai.com/v1/images/generations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                "prompt": prompt,
                "model": apiModel,
                "n": 1,
                "size": "1024x1024",
            })
        });

        if (!response.ok) {
            if (response.status === 401) {
                // Unauthorized - Incorrect API key
                throw new Error("Looks like your API key is incorrect. Please check your API key and try again.");
            } else {
                throw new Error(`Failed to fetch. Status code: ${response.status}`);
            }
        }

        return await response.json();
    } catch (error) {
        // Send a response to the popup script
        chrome.runtime.sendMessage({ error: error.message });

        console.error(error);
    }
}

// Get data from local storage
function getStorageData(keys) {
    return new Promise((resolve) => {
        chrome.storage.local.get(keys, (result) => resolve(result));
    });
}

const tools = [
    {
        type: "function",
        function: {
            name: "read_website_content",
            description: "This function let's you semantically retrieve relevant context  from a given hotel \
                      based on a query. Based on the original user query, write a good search query which is more \
                      logically sound to retrieve the relevant hotel information from the query. You might even have \
                      to break down the user query into multiple search queries and call this function multiple \
                      times separately if there are multiple questions being asked in the original user query. \
                      This function returns the retrieved context  from the chrome storage based on the search \
                      query formatted as a string.",
            parameters: {
                type: "object",
                properties: {
                    search_query: {
                        type: "string",
                        description: "The sub-query to search for hotel in chrome storage."
                    }
                },
                required: ["search_query"]
            }
        }
    }
];

async function read_website_content(search_query) {
    console.log('reading website content');

    return new Promise((resolve) => {
        // Get all keys from storage
        chrome.storage.local.get(null, (items) => {
            const allKeys = Object.keys(items);

            // Check for a match with the search query
            const matchedKey = allKeys.find((key) => key.match(new RegExp(search_query, 'i')));

            if (matchedKey) {
                // Query with the corresponding key
                chrome.storage.local.get(matchedKey, (result) => {
                    const resp = JSON.stringify(result[matchedKey]);
                    console.log("tools call", resp);
                    resolve(resp);
                });
            } else {
                // No match found
                resolve('No matching data found.');
            }
        });
    });
}

chrome.action.onClicked.addListener((tab) => {
    chrome.tabs.sendMessage(tab.id, { action: 'togglePopup' });
});