const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const statusDiv = document.getElementById('status');
const storyOutput = document.getElementById('storyOutput');
const synth = window.speechSynthesis;

// Attempt to load voices early
let voices = [];
synth.onvoiceschanged = () => { voices = synth.getVoices(); };

startBtn.addEventListener('click', async () => {
    const apiKey = document.getElementById('apiKey').value.trim();
    const category = document.getElementById('category').value;

    if (!apiKey) {
        alert("Please enter your Gemini API key.");
        return;
    }

    try {
        startBtn.disabled = true;
        
        // 1. Check/Cache Models
        const modelName = await getOrFetchModel(apiKey);
        
        // 2. Generate Story
        statusDiv.innerText = `Writing your bedtime story using ${modelName.split('/')[1]}... (This may take a minute)`;
        storyOutput.innerText = "";
        const storyText = await generateStory(apiKey, modelName, category);
        
        // 3. Display and Read Story
        statusDiv.innerText = "Reading...";
        storyOutput.innerText = storyText;
        startBtn.style.display = 'none';
        stopBtn.style.display = 'block';
        
        readStoryAloud(storyText);

    } catch (error) {
        statusDiv.innerText = "Error: " + error.message;
        startBtn.disabled = false;
        // If it was a model error, clear the cache so it tries again next time
        localStorage.removeItem('gemini_preferred_model');
    }
});

stopBtn.addEventListener('click', () => {
    synth.cancel();
    stopBtn.style.display = 'none';
    startBtn.style.display = 'block';
    startBtn.disabled = false;
    statusDiv.innerText = "Audio stopped.";
});

async function getOrFetchModel(apiKey) {
    // Check localStorage first
    const cachedModel = localStorage.getItem('gemini_preferred_model');
    if (cachedModel) {
        console.log("Using cached model:", cachedModel);
        return cachedModel;
    }

    statusDiv.innerText = "Fetching available models from Gemini...";
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    
    if (!response.ok) {
        throw new Error("Failed to fetch models. Please verify your API key.");
    }
    
    const data = await response.json();
    
    // Filter the API response to ONLY include models that support "generateContent"
    const validModels = data.models.filter(m => 
        m.supportedGenerationMethods && 
        m.supportedGenerationMethods.includes('generateContent')
    );

    if (validModels.length === 0) {
        throw new Error("No suitable text generation models found for this API key.");
    }
    
    // Prefer the newer Flash models, otherwise fallback to the first valid model returned
    const preferredModel = validModels.find(m => m.name.includes('gemini-2.5-flash')) || 
                           validModels.find(m => m.name.includes('gemini-1.5-flash')) || 
                           validModels[0];
    
    const selectedModelName = preferredModel.name;
    
    // Save to localStorage
    localStorage.setItem('gemini_preferred_model', selectedModelName);
    console.log("Fetched and cached model:", selectedModelName);
    return selectedModelName;
}

async function generateStory(apiKey, modelName, category) {
    // 30-60 minutes read time is roughly 4,500 to 9,000 words. 
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
                maxOutputTokens: 8192, // Maximize length
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
    if (!voices.length) voices = synth.getVoices();
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Look for a soft, female-sounding voice
    const femaleVoice = voices.find(v => 
        v.name.includes('Female') || 
        v.name.includes('Samantha') || 
        v.name.includes('Zira') ||
        v.name.includes('Karen') ||
        v.name.includes('Victoria')
    );
    
    if (femaleVoice) {
        utterance.voice = femaleVoice;
    }

    // Adjust settings for a "bedtime" feel
    utterance.rate = 0.75; // Slower pace
    utterance.pitch = 0.9; // Slightly lower pitch for calmness
    utterance.volume = 1.0;

    utterance.onend = () => {
        stopBtn.style.display = 'none';
        startBtn.style.display = 'block';
        startBtn.disabled = false;
        statusDiv.innerText = "Sweet dreams.";
    };

    synth.speak(utterance);
}
