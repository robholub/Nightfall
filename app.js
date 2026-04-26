const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const statusDiv = document.getElementById('status');
const storyOutput = document.getElementById('storyOutput');
const apiKeyInput = document.getElementById('apiKey');
const synth = window.speechSynthesis;

let voices = [];
let isReading = false;

// 1. Load the API Key on startup if it exists
window.addEventListener('DOMContentLoaded', () => {
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) {
        apiKeyInput.value = savedKey;
    }
});

synth.onvoiceschanged = () => { voices = synth.getVoices(); };

startBtn.addEventListener('click', async () => {
    const apiKey = apiKeyInput.value.trim();
    const category = document.getElementById('category').value;

    if (!apiKey) {
        alert("Please enter your Gemini API key.");
        return;
    }

    // Save the API key for next time
    localStorage.setItem('gemini_api_key', apiKey);

    // MOBILE CHROME AUDIO FIX: Wake up the speech engine immediately
    wakeUpSpeechEngine();

    try {
        startBtn.disabled = true;
        
        // Fetch valid model
        const modelName = await getOrFetchModel(apiKey);
        
        // Generate Story
        statusDiv.innerText = `Writing your bedtime story using ${modelName.split('/')[1]}...`;
        storyOutput.innerText = "";
        
        const storyText = await generateStory(apiKey, modelName, category);
        
        // Display and Read Story
        statusDiv.innerText = "Reading...";
        storyOutput.innerText = storyText;
        startBtn.style.display = 'none';
        stopBtn.style.display = 'block';
        
        readStoryAloud(storyText);

    } catch (error) {
        statusDiv.innerText = "Error: " + error.message;
        startBtn.disabled = false;
        localStorage.removeItem('gemini_preferred_model');
    }
});

stopBtn.addEventListener('click', () => {
    isReading = false;
    synth.cancel();
    stopBtn.style.display = 'none';
    startBtn.style.display = 'block';
    startBtn.disabled = false;
    statusDiv.innerText = "Audio stopped.";
});

function wakeUpSpeechEngine() {
    synth.cancel(); 
    const wakeUpUtterance = new SpeechSynthesisUtterance("Preparing your story...");
    wakeUpUtterance.volume = 0.1; // Keep it quiet
    synth.speak(wakeUpUtterance);
}

async function getOrFetchModel(apiKey) {
    let cachedModel = localStorage.getItem('gemini_preferred_model');
    
    if (cachedModel && cachedModel.includes('gemini-1.5-pro-latest')) {
        localStorage.removeItem('gemini_preferred_model');
        cachedModel = null;
    }

    if (cachedModel) return cachedModel;

    statusDiv.innerText = "Fetching available models from Gemini...";
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    
    if (!response.ok) throw new Error("Failed to fetch models. Please verify your API key.");
    
    const data = await response.json();
    
    const validModels = data.models.filter(m => 
        m.supportedGenerationMethods && 
        m.supportedGenerationMethods.includes('generateContent')
    );

    if (validModels.length === 0) throw new Error("No suitable text generation models found.");
    
    const preferredModel = validModels.find(m => m.name.includes('gemini-2.5-flash')) || 
                           validModels.find(m => m.name.includes('gemini-1.5-flash')) || 
                           validModels[0];
    
    const selectedModelName = preferredModel.name;
    localStorage.setItem('gemini_preferred_model', selectedModelName);
    return selectedModelName;
}

async function generateStory(apiKey, modelName, category) {
    const prompt = `Write a highly descriptive, incredibly slow-paced, and soothing bedtime story for an adult. 
    The category/theme is: ${category}. 
    The goal is for the user to fall asleep while listening. Focus heavily on sensory details, gentle sounds, soft lighting, and a calm, meandering narrative arc with no high stakes or stressful conflict. 
    Make the story extremely long, aiming for at least 5,000 words, maximizing your output length. Use calm, rhythmic sentence structures.`;

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/${modelName}:generateContent?key=${apiKey}`;

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                maxOutputTokens: 8192,
                temperature: 0.7
            }
        })
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || "Failed to generate story.");
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
}

function readStoryAloud(text) {
    isReading = true;
    synth.cancel(); // Clear the wakeup utterance
    
    if (!voices.length) voices = synth.getVoices();
    const femaleVoice = voices.find(v => 
        v.name.includes('Female') || v.name.includes('Samantha') || 
        v.name.includes('Zira') || v.name.includes('Karen') || 
        v.name.includes('Victoria')
    );

    // ANDROID FIX: Break the massive text into small sentence chunks
    // Replace newlines with periods so they create pauses, then split by punctuation
    const safeText = text.replace(/\n/g, '. ');
    const chunks = safeText.match(/[^.!?]+[.!?]+/g) || [text];
    
    let currentChunk = 0;

    function speakNextChunk() {
        if (!isReading) return; // User pressed stop
        
        if (currentChunk >= chunks.length) {
            stopBtn.style.display = 'none';
            startBtn.style.display = 'block';
            startBtn.disabled = false;
            statusDiv.innerText = "Sweet dreams.";
            isReading = false;
            return;
        }

        const utterance = new SpeechSynthesisUtterance(chunks[currentChunk].trim());
        if (femaleVoice) utterance.voice = femaleVoice;
        
        utterance.rate = 0.75;
        utterance.pitch = 0.9;
        utterance.volume = 1.0;

        utterance.onend = () => {
            currentChunk++;
            speakNextChunk(); // Chain the next sentence
        };

        utterance.onerror = (e) => {
            console.error("Audio interrupted", e);
            // If it glitches, attempt to skip to the next sentence
            currentChunk++;
            speakNextChunk();
        };

        synth.speak(utterance);
    }

    speakNextChunk();
}
