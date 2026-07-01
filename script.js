const GEMINI_API_KEY = "AIzaSyA8BIj8ZGwjYzwxL9cI49Yv9gGZfMA6RAE";


const chatHistory = [
    {
        role: "user",
        parts: [{ text: "You are JARVIS, Tony Starks's AI companion. Respond in high ingelligent, slightly witty, brief manner. Addres the user as Sir, Keep answers 1-3 sentences total so it reads well over voice."}]
    },
    {
        role: "model",
        parts: [{ text: "Systems fully operational. Ready for your commands, Sir."}]
    }
];

const chatDisplay = document.getElementById('chatDisplay');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const micBtn = document.getElementById('micBtn');
const arcReactor = document.getElementById('arcReactor');
const statusField = document.getElementById('statusField');

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition;

if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    recognition.onstart = () => {
        arcReactor.classList.add('listening');
        statusField.innerText = "SYSTEM STATUS: LISTENING...";
        statusField.style.color = "#ff0055";
    };

    recognition.onerror = (e) => {
        console.error(e);
        resetUIStatus();
    };

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        userInput.value = transcript;
        handleSend();
    };
   } else {
    micBtn.style.display = 'none';
    console.log("Speech recognition not supported in this browser.");
   }

   function resetUIStatus() {
    arcReactor.classList.remove('listening');
    statusField.innerText = "SYSTEM STATUS: ONLINE";
    statusField.style.color = "#4e9f3d";
   }

   function speak(text) {
    if ('speechSynthesis' in window) {

        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);

        const voices = window.speechSynthesis.getVoices();
        const selectedVoice = voices.find(voice => voice.name.includes('Google US English') || voice.name.includes('Male'));
        if (selectedVoice) utterance.voice = selectedVoice;

        utterance.rate = 1.0;
        utterance.pitch = 0.9;
        window.speechSynthesis.speak(utterance);
    }
   }

   function appendMessage(text, className) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', className);
        messageDiv.innerText = text;
        chatDisplay.appendChild(messageDiv);
        chatDisplay.scrollTop = chatDisplay.scrollHeight;
   }

   async function askJarvis(prompt) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;


    chatHistory.push({
        role: "user",
        parts: [{ text: prompt}]
    });

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                contents: chatHistory
            })
        });

        const data = await response.json();
        if (data.candidates && data.candidates[0].content.parts[0].text) {
            const jarvisReply = data.candidates[0].content.parts[0].text;


            chatHistory.push({
                role: "model",
                parts: [{ text: jarvisReply }]
            });

            return jarvisReply;
        } else {
            return "Mainframe logic collision. I couldn't compute that phrase.";
        }
    } catch (error) {
        console.error(error);
        return "Network infrastructure breakdown. Connection to core servers lost.";
    }
}
    
    

    async function handleSend() {
        const text = userInput.value.trim();
        if(!text)return;


        userInput.value='';

        if(text.toLowerCase().includes(" and ")){
            const commands = text.split(/ and /i);
            appendMessage(text, 'user-msg');


            for(const cmd of commands){
                await processLocalCommands(cmd.trim());
            }
            return;
        }

        const handledLocally = await processLocalCommands(text);
        if (handledLocally) return;


        if (chatHistory.length > 20) {
            chatHistory.splice(2,2);
        }

        if (GEMINI_API_KEY === "YOUR_GEMINI_API_KEY_HERE" || !GEMINI_API_KEY) {
            alert("Please replace 'YOUR_GEMINI_API_KEY_HERE' with your actual Gemini API Key.");
            return;
        }

        appendMessage(text, 'user-msg');
        appendMessage("Processing...", 'system-msg');

        const reply = await askJarvis(text);

        chatDisplay.removeChild(chatDisplay.lastChild);
        appendMessage(reply, 'system-msg');
        speak(reply);
    }

    async function processLocalCommands(rawText) {
        const lowerText = rawText.toLowerCase();

        const shortcuts = {
            "open google": "https://google.com",
            "open youtube": "https://youtube.com",
            "open x": "https://x.com",
            "open twitter": "https://x.com",
            "open instagram": "https://instagram.com",
            "open insta": "https://instagram.com",
            "open facebook": "https://facebook.com"
        };

        for (const command in shortcuts) {
            if (lowerText.includes(command)){
                appendMessage(rawText, 'user-msg');
                const confirmationText = `Opening requested link immediately, Sir.`;
                appendMessage(confirmationText, 'system-msg');
                speak(confirmationText);
                window.open(shortcuts[command], '_blank');
                return true;
            }
        }

        if (lowerText.includes("weather")) {
            appendMessage(rawText, 'user-msg');
            appendMessage("Accessing meteorological satellite arrays...", 'system-msg');

            try {
                const response = await fetch("https://wttr.in/?format=j1");
                const data = await response.json();

                const temp = data.current_condition[0].temp_F;
                const desc = data.current_condition[0].weatherDesc[0].value;
                const humidity = data.current_condition[0].humidity;

                chatDisplay.removeChild(chatDisplay.lastChild);

                const weatherReport = `Current local martix indicates ${desc} at ${temp} degrees Fahrenheit, with a humidity profile of ${humidity} percent, Sir.`;
                appendMessage(weatherReport, 'system-msg');
                speak(weatherReport);
            } catch (error) {
                chatDisplay.removeChild(chatDisplay.lastChild);
                const failReport = "Unable to connect to environmental weather telemetry arrays, Sir.";
                appendMessage(failReport, 'system-msg');
                speak(failReport);
            }
            return true;
        }

        if (lowerText.startsWith("search for")|| lowerText.startsWith("google search")) {
            appendMessage(rawText, 'user-msg');

            let query = rawText.replace(/search for /i, "").replace(/google search/i,"").trim();

            if(query){
                const confirmationText = `Searching databases for "${query}" immediately, Sir.`;
                appendMessage(confirmationText, 'system-msg');
                speak(confirmationText);

                window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`,'_blank');
                return true;
            }
        }
        
        if (lowerText.includes("news") || lowerText.includes("briefing")){
            appendMessage(rawText, 'user-msg');
            appendMessage("Establishing secure link to global satellite news registries...", 'system-msg');

            try {
                const newsRes = await fetch("https://api.spaceflightnewsapi.net/v4/articles/?limit=3");
                const newsData = await newsRes.json();

                chatDisplay.removeChild(chatDisplay.lastChild);

                if (newsData.results && newsData.results.length > 0) {
                    if (typeof accelerateGlobe === "function") accelerateGlobe();

                    let briefSpeech = "Here are the priority items from the network data feeds, Sir.";
                    appendMessage("--- GLOBAL RADAR HEADLINES ---", 'system-msg');

                    newsData.results.forEach((article, index) => {
                        const title = article.title;
                        const summary = article.summary.substring(0, 120) + "...";

                        appendMessage(`[${index + 1}] ${title}\n${summary}`, 'system-msg');

                        briefSpeech += `Item ${index + 1}: ${title}.`;
                    });

                    speak(briefSpeech);
                } else {
                    const noNews = "Global news feeds are currently showing clear vectors, Sir.";
                    appendMessage(noNews, 'system-msg');
                    speak(noNews);
                }
            } catch (error) {
                console.error(error);
                chatDisplay.removeChild(chatDisplay.lastChild);
                const failNews = "Data transmision failure. Connection to global feed channels timed out, Sir.";
                appendMessage(failNews, 'system-msg');
                speak(failNews)
            }
            return true;
        }
            
        if (lowerText.includes("nasa") || lowerText.includes("space photo")) {
            appendMessage(rawText, 'user-msg');
            appendMessage("Accessing NASA deep space telemetry array, Sir...", 'system-msg');

            fetchJarvisSpacePhoto(chatDisplay);
            return true;
        }

        return false;
    }

    sendBtn.addEventListener('click', handleSend);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSend();
    });

    micBtn.addEventListener('click', () => {
        if (recognition) recognition.start();
    });

    if ('speechSynthesis' in window) {
        window.speechSynthesis.getVoices();
    }

    window.addEventListener('load', () => {

        setTimeout(() => {
            const welcomeMessage = "Systems fully initialized. JARVIS is online and listening, Sir.";
            appendMessage(welcomeMessage, 'system-msg');
            speak(welcomeMessage);
        }, 1000);
    });

    function fetchJarvisSpacePhoto(chatDisplayArea) {
        const key = '5QMclqsnbVSTqUzCuFPeAKv9f7dPeLXNe6iXV8AS';

        const endpoint = `https://api.nasa.gov/planetary/apod?api_key=${key}`;

        fetch(endpoint)
            .then(res => res.json())
            .then(data => {
                if (chatDisplayArea.lastChild && chatDisplayArea.lastChild.textContent.includes("Accessing NASA")) {
                    chatDisplayArea.removeChild(chatDisplayArea.lastChild);
                }

                const responseBubble = document.createElement('div');

                responseBubble.classList.add('message', 'system-msg');

                responseBubble.innerHTML = `
                <p>Today's deep space file it titled: <strong>"${data.title}"</strong>, Sir. </p>
                <img src="${data.url}" style="max-width: 100%; border-radius: 8px; margin: 10px 0; border: 1px solid #52bcff; box-shadow: 0 0 10px rgba(82, 188,255,0.3);">
                <p style="font-size: 13px; opacity: 0.9; line-height: 1.4;">${data.explanation}</p>
                `;

                chatDisplayArea.appendChild(responseBubble);
                chatDisplayArea.scrollTop = chatDisplayArea.scrollHeight;

                speak(`Access array complete. Displaying the astronomical matrix for: ${data.title}, Sir.`);
                
            })
            .catch(err => {
                console.error(err);
                if (chatDisplayArea.lastChild && chatDisplayArea.lastChild.textContent.includes("Accessing NASA")) {

                }
                const errorBubble = document.createElement('div');
                errorBubble.classList.add('message', 'system-msg');
                errorBubble.innerText = "Apologies Sir, connection to the planetary data stream failed.";
                chatDisplayArea.appendChild(errorBubble);
                speak("Apologies Sir, connection to the planetary data stream failed.");
            });
    }

   
