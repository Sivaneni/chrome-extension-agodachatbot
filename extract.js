// In extract.js

console.log("Content script started");
//chrome.runtime.sendMessage({ message: 'enable_chatbutton', enableChatButton: true });

// Use 'load' event


// Alternatively, you can use 'readystatechange' event
document.addEventListener('readystatechange', function () {
    if (document.readyState === 'complete') {
        console.log("Page ready state changed to 'complete' in extract.js");
        console.log("Page loaded in extract.js");
        // Your code here, e.g., extracting hotel name
        let hotelnameElement = document.querySelector("#property-main-content > div.Box-sc-kv6pi1-0.cJiLOx.sc-higXBA.bnRlSb > div.HeaderCerebrum > div:nth-child(1) > p");
        if (hotelnameElement) {
            let hotelname = hotelnameElement.innerText;
            console.log("Hotel name extracted:", hotelname);
            getHotelData(hotelname)

        } else {
            console.log("Hotel name element not found");
        }
    }
});


function extractFacilities() {
    let parentElement = document.querySelector("#property-main-content > div.Box-sc-kv6pi1-0.cJiLOx.sc-higXBA.bIsNDk > div > div.Box-sc-kv6pi1-0.dPyGvZ");
    let totalChildren = parentElement.childElementCount;
    let facilities = "";

    for (let i = 1; i <= totalChildren; i++) {
        let childElement = parentElement.querySelector(`div:nth-child(${i}) > p`);
        if (childElement) {
            facilities += childElement.innerHTML + ",";
        }
    }

    return facilities;
}

function StaycationOffers() {


    let parentElement = document.querySelector("#property-main-content > div.Box-sc-kv6pi1-0.cJiLOx.sc-higXBA.bJWXtY > div.Box-sc-kv6pi1-0.dBfEWQ > div > div.Box-sc-kv6pi1-0.fuBtbe");
    let totalChildren = parentElement.childElementCount;
    let StaycationOffers = "";

    for (let i = 1; i <= totalChildren; i++) {
        let childElement = parentElement.querySelector(`div:nth-child(${i}) > p`);
        if (childElement) {
            facilities += childElement.innerHTML + ",";

            // Iterate through child elements inside each child element
            let childTotal = childElement.childElementCount;
            for (let j = 1; j <= childTotal; j++) {
                let grandChildElement = childElement.querySelector(`div:nth-child(${j}) > p`);
                if (grandChildElement) {
                    facilities += grandChildElement.innerHTML + ",";
                }
            }
        }
    }

    return facilities;



}

function hoteldescription() {

    return document.querySelector("#property-main-content > div.Box-sc-kv6pi1-0.cJiLOx.sc-higXBA.bnRlSb > div.HeaderCerebrum > div.Box-sc-kv6pi1-0.cYZaSy > div > p").innerHTML


}
function gethotelprice() {


    // Get the string from the innerHTML
    let strValue = document.querySelector("#hotelNavBar > div > div > div > span > div > span:nth-child(5)").innerHTML;

    // Remove commas from the string
    let cleanedStrValue = strValue.replace(/,/g, '');

    // Convert the cleaned string to an integer
    return parseInt(cleanedStrValue, 10);

    // Output the integer value



}
function extractFAQPairs() {
    let faqItems = document.querySelectorAll('#property-below-roomgrid > div:nth-child(3) > div > div > div > div > div');
    let faqPairs = [];

    if (faqItems.length === 0) {
        // Return an empty array if faqItems is not found
        return faqPairs;
    }

    faqItems.forEach((item) => {
        let questionElement = item.querySelector('div.Box-sc-kv6pi1-0.jJvGxG.FaqCard__Cursor > div.Box-sc-kv6pi1-0.cvtHtq > p');
        let answerElement = item.querySelector('div.Box-sc-kv6pi1-0.enrYwk > p');

        if (questionElement && answerElement) {
            let questionText = questionElement.innerHTML.trim();
            let answerText = answerElement.innerHTML.trim();

            faqPairs.push({
                question: questionText,
                answer: answerText
            });
        }
    });

    return faqPairs;
}
function parseLandmarks() {
    let element = document.querySelector("#abouthotel-panel > div:nth-child(3) > div > div:nth-child(5)");
    if (!element) {
        return {};
    }

    let text = element.innerText;
    let sections = text.split("Nearby landmarks");

    let popularLandmarks = sections[0].split("\n").slice(1).filter((item) => item.trim() !== "");
    let nearbyLandmarks = sections[1].split("\n").filter((item) => item.trim() !== "");

    function parseLandmarkArray(landmarkArray) {
        let landmarks = [];
        for (let i = 0; i < landmarkArray.length; i += 2) {
            if (landmarkArray[i + 1]) {
                landmarks.push({
                    name: landmarkArray[i].trim(),
                    distance: landmarkArray[i + 1].trim()
                });
            }
        }
        return landmarks;
    }

    let landmarkObject = {
        popularLandmarks: parseLandmarkArray(popularLandmarks),
        nearbyLandmarks: parseLandmarkArray(nearbyLandmarks)
    };

    return landmarkObject;
}

// Usage example:


// Usage example:


function getHotelData(hotelName) {
    let facilities = extractFacilities();
    let description = hoteldescription();
    let hotelprice = gethotelprice();
    let QA = extractFAQPairs();
    let Landmarks = parseLandmarks();
    // Combine the results into an object
    let hotelData = {
        facilities: facilities,
        description: description,
        hotelprice: hotelprice,
        FAQ: QA,
        Landmarks: Landmarks
    };

    // Convert the object into a JSON string
    let jsonString = JSON.stringify(hotelData);
    console.log("hotelData", jsonString)

    // Send the hotel name and data to the background script
    chrome.runtime.sendMessage({ message: 'extracted_content', hotelName: hotelName, data: jsonString });
    setTimeout(() => {
        console.log('Extraction done');
        chrome.runtime.sendMessage({ message: "extraction_done" });
    }, 10000);


}