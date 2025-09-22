
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
        quirky: `Given the text: "${text}", provide three distinct, single words that could naturally and grammatically come next to complete the sentence in a quirky, playful way. Only output the words, separated by commas, with no numbers, punctuation, or extra commentary. Do not repeat any words from the user's input.`,
        
        machiavellian: `Given the text: "${text}", provide three distinct, single words that could naturally and grammatically come next to complete the sentence in a cunning, manipulative way. Only output the words, separated by commas, with no numbers, punctuation, or extra commentary. Do not repeat any words from the user's input.`,
        
        empathetic: `Given the text: "${text}", provide three distinct, single words that could naturally and grammatically come next to complete the sentence in a compassionate, understanding way. Only output the words, separated by commas, with no numbers, punctuation, or extra commentary. Do not repeat any words from the user's input.`,
        
        friendly: `Given the text: "${text}", provide three distinct, single words that could naturally and grammatically come next to complete the sentence in a warm, friendly way. Only output the words, separated by commas, with no numbers, punctuation, or extra commentary. Do not repeat any words from the user's input.`,
        
        righteous: `Given the text: "${text}", provide three distinct, single words that could naturally and grammatically come next to complete the sentence in a bold, morally strong way. Only output the words, separated by commas, with no numbers, punctuation, or extra commentary. Do not repeat any words from the user's input.`,
        
        vindictive: `Given the text: "${text}", provide three distinct, single words that could naturally and grammatically come next to complete the sentence in a sharp, cutting way. Only output the words, separated by commas, with no numbers, punctuation, or extra commentary. Do not repeat any words from the user's input.`
    };

    return moodPrompts[mood];
}



function parseSuggestions(response) {
    // Split by commas, trim whitespace
    const rawWords = response.split(',').map(w => w.trim()).filter(w => w.length > 0);

    // Merge any accidental splits 
    const words = rawWords.map(word => word.replace(/\s+/g, ''));

    // Exclude already typed words
    const inputWords = textInput.value.toLowerCase().split(/\s+/);
    const nextWords = words.filter(word => !inputWords.includes(word.toLowerCase()));

    return nextWords.slice(0, 3); // return up to 3 suggestions
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
