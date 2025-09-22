
let currentMood = '';
let debounceTimeout;

const moodButtons = document.querySelectorAll('.mood-btn');
const textInput = document.getElementById('textInput');
const suggestionsDiv = document.getElementById('suggestions');
const loadingDiv = document.getElementById('loading');

// Mood selection
moodButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        moodButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentMood = btn.dataset.mood;
        
        if (textInput.value.trim()) {
            getSuggestions();
        }
    });
});

// Text input handler
textInput.addEventListener('input', () => {
    if (!currentMood) {
        suggestionsDiv.innerHTML = '<div class="message">Select a mood first</div>';
        return;
    }
    
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
        getSuggestions();
    }, 500);
});

async function getSuggestions() {
    const text = textInput.value.trim();
    
    if (!text) {
        suggestionsDiv.innerHTML = '<div class="message">Start typing to see suggestions</div>';
        return;
    }
    
    loadingDiv.classList.add('show');
    suggestionsDiv.innerHTML = '<div class="message">Connecting to API...</div>';
    
    try {
        const prompt = createMoodPrompt(text, currentMood);
        
        const authToken = "eyJhbGciOiJSUzI1NiIsImtpZCI6IjUwMDZlMjc5MTVhMTcwYWIyNmIxZWUzYjgxZDExNjU0MmYxMjRmMjAiLCJ0eXAiOiJKV1QifQ.eyJuYW1lIjoiQXVkcmV5IE9oIiwicGljdHVyZSI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS9hL0FDZzhvY0xvdEVlUWNJZWNfUndLQ3I4b2tiT0hoel9ERWMwcjZsVWZITHZJZlJKdGt6R3I9czk2LWMiLCJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vaXRwLWltYS1yZXBsaWNhdGUtcHJveHkiLCJhdWQiOiJpdHAtaW1hLXJlcGxpY2F0ZS1wcm94eSIsImF1dGhfdGltZSI6MTc1ODEyODQ4OCwidXNlcl9pZCI6Im1DRXhacVlYTFFZZHZianFwTWxCeUtYNmo5WjIiLCJzdWIiOiJtQ0V4WnFZWExRWWR2YmpxcE1sQnlLWDZqOVoyIiwiaWF0IjoxNzU4MTI4NDg4LCJleHAiOjE3NTgxMzIwODgsImVtYWlsIjoiZG83NzJAbnl1LmVkdSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJmaXJlYmFzZSI6eyJpZGVudGl0aWVzIjp7Imdvb2dsZS5jb20iOlsiMTExNzk1Njc2Njc5MDMxNTIyNTY3Il0sImVtYWlsIjpbImRvNzcyQG55dS5lZHUiXX0sInNpZ25faW5fcHJvdmlkZXIiOiJnb29nbGUuY29tIn19.fGdb_gmNp-P4kp9BaufK60tZM4DvNy57oLvopUhKADNdEzBdfEq5D8UUOe6hxkmK4vtoKGlf4yblY5VedJD_i-FFzLRfzvYhDS2O4Yp91Yctq9IyrmYrxVfprc9bIzRm1-hRmRV2nqXYY3_DgqBopbmxCGgSg29nh67BC-F3P42O6f8NJagrlSeBYNkJ4Re5PGJoNVdDKFRh6okBmQqasd0v_siA2uhU8_btn3pKnE7XlBxF9RVpFlwZ2JsgOaVWUPyBc_ZxGqK2LWz-nh0BI-SIgyOjw1lpEciBaR6ZZb8b6_jHm7a1zHzLjmsPx7UmF6Q5HyEdkTwNge7YGit2gA";
        const replicateProxy = "https://itp-ima-replicate-proxy.web.app/api/create_n_get";

        let data = {
            model: "openai/gpt-4.1-nano",
            input: {
                prompt: prompt,
            },
        };

        let fetchOptions = {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${authToken}`,
            },
            body: JSON.stringify(data),
        };

        console.log("Sending request to proxy with text model...", fetchOptions);

        const response = await fetch(replicateProxy, fetchOptions);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API request failed: ${response.status} - ${errorText}`);
        }

        const prediction = await response.json();
        
      console.log("SUCCESS! Got response from API:", prediction);

const textOutput = prediction.output ? prediction.output.join(' ') : "No text output received.";

const suggestions = parseSuggestions(textOutput);
displaySuggestions(suggestions);

    } catch (error) {
        console.error('Error fetching from proxy:', error);
        suggestionsDiv.innerHTML = `<div class="message">Error: ${error.message}</div>`;
    }
    
    loadingDiv.classList.remove('show');
}

function createMoodPrompt(text, mood) {
    const moodPrompts = {
        quirky: `Finish this sentence in a quirky, whimsical, and playful way: "${text}"`,
        machiavellian: `Finish this sentence in a strategic, cunning, and manipulative way: "${text}"`,
        empathetic: `Finish this sentence in a compassionate, understanding, and emotionally supportive way: "${text}"`,
        friendly: `Finish this sentence in a warm, welcoming, and genuinely friendly way: "${text}"`,
        righteous: `Finish this sentence in a bold, principled, and morally strong way: "${text}"`,
        vindictive: `Finish this sentence in a sharp, cutting, and retaliatory way: "${text}"`
    };
    
    return moodPrompts[mood];
}


function parseSuggestions(response) {
    const cleaned = response.replace(/[^\w\s,]/g, '').trim();
    const words = cleaned.split(/[\n\s,]+/).filter(word => 
        word.length > 0 && 
        word.length < 20 && 
        /^[a-zA-Z]+$/.test(word)
    );
    return [...new Set(words)].slice(0, 3);
}

function displaySuggestions(suggestions) {
    if (suggestions.length === 0) {
        suggestionsDiv.innerHTML = '<div class="message">No suggestions available</div>';
        return;
    }
    const suggestionsHTML = suggestions.map(word => 
        `<div class="suggestion" onclick="addWord('${word}')">${word}</div>`
    ).join('');
    suggestionsDiv.innerHTML = suggestionsHTML;
}

function addWord(word) {
    const currentText = textInput.value;
    const lastChar = currentText[currentText.length - 1];
    const separator = (lastChar && lastChar !== ' ') ? ' ' : '';
    textInput.value = currentText + separator + word + ' ';
    textInput.focus();
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
        getSuggestions();
    }, 300);
}

window.addEventListener('load', () => {
    textInput.focus();
});
