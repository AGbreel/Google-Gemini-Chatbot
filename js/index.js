const typingForm = document.querySelector('.typing-form');
const chatList = document.querySelector('.chat-list');
const suggestions = document.querySelectorAll('.suggestion-list .suggestion');
const toggleThemeButton = document.querySelector('#toggleThemeButton');
const deleteChatButton = document.querySelector('#deleteChatButton');

let userMessage = null;
let isResponseGenerating = false;
const API_KEY = 'AIzaSyDMbITn4Q_h_Yf0iCNGhCP3xQo4aLiQ1AA';
const API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${API_KEY}`;

const defualtTheme = () => {
    if(localStorage.getItem('themeColor')) {
        document.body.classList.add(localStorage.getItem('themeColor'));
        if(localStorage.getItem('themeColor') === 'light_mode') {
            toggleThemeButton.classList.replace("fa-sun", "fa-moon");
        } else {
            toggleThemeButton.classList.replace("fa-moon", "fa-sun");
        }
    }
    
    if(localStorage.getItem('savedChat')) {
        chatList.innerHTML = localStorage.getItem('savedChat');
        chatList.scrollTo(0, chatList.scrollHeight); // Scroll To The Bottom.
        document.body.classList.add('hide-header');
    } else {
        chatList.innerHTML = '';   
        document.body.classList.remove('hide-header');
    }
}

defualtTheme();

const createMessageElement = (content, ...classes) => {
    const div = document.createElement('div');
    div.classList.add("message", ...classes)
    div.innerHTML = content;
    return div;
}

const showTypingEffect = (text, textElement, incomingMessageDiv) => {
    const words = text.split(' ');
    let currentWordIndex = 0;
    const typingInterval = setInterval(() => {
        textElement.innerHTML += (currentWordIndex === 0 ? '' : ' ') + words[currentWordIndex++];
        incomingMessageDiv.querySelector(".icon").classList.add("hidden");
        if(currentWordIndex === words.length) {
            clearInterval(typingInterval);
            isResponseGenerating = false;
            incomingMessageDiv.querySelector(".icon").classList.remove("hidden");
            localStorage.setItem('savedChat', chatList.innerHTML);
        }
        chatList.scrollTo(0, chatList.scrollHeight); // Scroll To The Bottom.
    }, 100)
}

const generateAPIResponse = async (incomingMessageDiv) => {
    const textElement = incomingMessageDiv.querySelector('.text');
   try {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            contents: [{
                "role": "user",
                "parts":[{text: userMessage}]
            }]
        })
    })
    const data = await response.json();
    if(!response.ok) throw new Error(data.error.message);
    
    // ! Get The API Response Text And Remove asterisks From It.
    const apiResponse = data?.candidates[0].content.parts[0].text.replace(/\*\*(.*?)\*\*/g, '$1');
    // textElement.innerHTML = apiResponse;
    showTypingEffect(apiResponse, textElement, incomingMessageDiv);
    
   } catch (error) {
    isResponseGenerating = false;
    console.log(error);
    textElement.innerHTML = error.message;
    textElement.classList.add('error');
   } finally {
    incomingMessageDiv.classList.remove('loading');
   }
}

const showLoadingAnimation = () => {
    const html = `<div class="message-content">
                <img src="images/gemini.svg" alt="Gemini Image" class="avatar">
                <p class="text"></p>
                <div class="loading-indicator">
                    <div class="loading-bar"></div>
                    <div class="loading-bar"></div>
                    <div class="loading-bar"></div>
                </div>
            </div>
            <i onclick="copyMessage(this)" class="icon fa-regular fa-copy"></i>
            <i class="icon fa-solid fa-check hidden"></i>`

    const incomingMessageDiv = createMessageElement(html, 'incoming', 'loading');
    chatList.appendChild(incomingMessageDiv);
    chatList.scrollTo(0, chatList.scrollHeight); // Scroll To The Bottom.
    generateAPIResponse(incomingMessageDiv);
}

const copyMessage = (copyIcon) => {
    const messageText = copyIcon.parentElement.querySelector('.text').innerText;
    navigator.clipboard.writeText(messageText);
    copyIcon.classList.add('hidden');
    copyIcon.nextElementSibling.classList.remove('hidden');
    setTimeout(() => {
        copyIcon.classList.remove('hidden')
        copyIcon.nextElementSibling.classList.add('hidden')
    }, 2000)
}


const handleOutgoingChat = () => {
    userMessage = typingForm.querySelector('.typing-input').value.trim() || userMessage;
    if(!userMessage || isResponseGenerating) return;

    isResponseGenerating = true;

    const html = `<div class="message-content">
                      <img src="images/user.jpg" alt="User Image" class="avatar">
                      <p class="text">${userMessage}</p>
                  </div>`
    const outgoingMessageDiv = createMessageElement(html, 'outgoing');
    chatList.appendChild(outgoingMessageDiv);
    typingForm.reset();
    document.body.classList.add('hide-header'); // Hide Header After Sending A Message.
    chatList.scrollTo(0, chatList.scrollHeight); // Scroll To The Bottom.
    setTimeout(showLoadingAnimation, 500)
}

suggestions.forEach(suggestion => {
    suggestion.addEventListener('click', () => {
        userMessage = suggestion.querySelector('.text').innerText;
        handleOutgoingChat();
    })
})


toggleThemeButton.addEventListener('click', function() {
    let isLightMode = document.body.classList.toggle('light_mode');
    if(isLightMode) {
        toggleThemeButton.classList.replace("fa-sun", "fa-moon");
        localStorage.setItem('themeColor', 'light_mode');
    } else {
        toggleThemeButton.classList.replace("fa-moon", "fa-sun");
        localStorage.setItem('themeColor', 'dark_mode');
    }
})


deleteChatButton.addEventListener('click', function() {
    if(confirm('Are you sure you want to delete all messages?')) {
        localStorage.removeItem('savedChat');
        document.body.classList.remove('hide-header');
    }
    defualtTheme();
})



typingForm.addEventListener('submit', function(e) {
    e.preventDefault();
    handleOutgoingChat();
})