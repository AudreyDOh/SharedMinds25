
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
        
        // Clear suggestions when mood changes
        suggestionsDiv.innerHTML = '<div class="message">Start typing to see suggestions</div>';
        
        // If there's text, get new suggestions
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
    
    // Show loading
    loadingDiv.classList.add('show');
    suggestionsDiv.innerHTML = '';
    
    try {
        const prompt = createMoodPrompt(text, currentMood);
        
        console.log('Making API request...', { prompt });
        
        const authToken = "eyJhbGciOiJSUzI1NiIsImtpZCI6IjA1NTc3MjZmYWIxMjMxZmEyZGNjNTcyMWExMDgzZGE2ODBjNGE3M2YiLCJ0eXAiOiJKV1QifQ.eyJuYW1lIjoiQXVkcmV5IE9oIiwicGljdHVyZSI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS9hL0FDZzhvY0xvdEVlUWNJZWNfUndLQ3I4b2tiT0hoel9ERWMwcjZsVWZITHZJZlJKdGt6R3I9czk2LWMiLCJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vaXRwLWltYS1yZXBsaWNhdGUtcHJveHkiLCJhdWQiOiJpdHAtaW1hLXJlcGxpY2F0ZS1wcm94eSIsImF1dGhfdGltZSI6MTc1ODUxNTUzNCwidXNlcl9pZCI6Im1DRXhacVlYTFFZZHZianFwTWxCeUtYNmo5WjIiLCJzdWIiOiJtQ0V4WnFZWExRWWR2YmpxcE1sQnlLWDZqOVoyIiwiaWF0IjoxNzU4NTE1NTM0LCJleHAiOjE3NTg1MTkxMzQsImVtYWlsIjoiZG83NzJAbnl1LmVkdSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJmaXJlYmFzZSI6eyJpZGVudGl0aWVzIjp7Imdvb2dsZS5jb20iOlsiMTExNzk1Njc2Njc5MDMxNTIyNTY3Il0sImVtYWlsIjpbImRvNzcyQG55dS5lZHUiXX0sInNpZ25faW5fcHJvdmlkZXIiOiJnb29nbGUuY29tIn19.NupY-U7b6BUnyeP3P6UT67AdEDcsoURbft8gvmgJQ7Y6SSsRja6Cxbf2yM6jZrNJ-HVbft-t5JckcaDigQyb4Ug6HUQAoDMYqj5pYofLYXXEohIVpB_CVmQ3JKwUgtCYWK-BTv1IRjIz3zMLLa6jsfmXYfo0j0aU0kShKS5fQd1PMM4m1AxMN6KimzR63vWcMkfIgivgBExP7KTmkoS05RdvuxdrMicHfDtVHTfF8qS5oU5IWET4awGwr14gVjnduU3H3u0Eie_EMLPzV-VcS4FA0aMk_6VP-15OwXc6NxIcNbPxeeGflSHukoAtsokY4eGTSEf0MoogG5PB66UE1A";

        const response = await fetch('https://itp-ima-replicate-proxy.web.app/api/create_n_get', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                model: 'gpt-4',
                input: {
                    prompt: prompt,
                    max_tokens: 50,
                    temperature: 0.8
                }
            })
        });
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error:', errorText);
            throw new Error(`API request failed: ${response.status} - ${errorText}`);
        }
        
        const data = await response.json();
        console.log('API Response:', data);
        
        const suggestions = parseSuggestions(data.output || data.response || data.text || '');
        
        displaySuggestions(suggestions);
        
    } catch (error) {
        console.error('Full error:', error);
        
        // Show more helpful error messages
        let errorMessage = 'Unable to get suggestions';
        if (error.message.includes('Failed to fetch')) {
            errorMessage = 'Network error - check connection';
        } else if (error.message.includes('CORS')) {
            errorMessage = 'CORS error - API not accessible';
        } else if (error.message.includes('404')) {
            errorMessage = 'API endpoint not found';
        } else if (error.message.includes('500')) {
            errorMessage = 'Server error - try again';
        }
        
        suggestionsDiv.innerHTML = `<div class="message">${errorMessage}</div>`;
        
        // Fallback: show some mock suggestions for testing
        setTimeout(() => {
            if (suggestionsDiv.innerHTML.includes('Unable to get suggestions')) {
                displayMockSuggestions();
            }
        }, 2000);
    }
    
    // Hide loading
    loadingDiv.classList.remove('show');
}

// Fallback function for testing
function displayMockSuggestions() {
    const mockSuggestions = {
        quirky: ['banana', 'wiggle', 'sparkle'],
        machiavellian: ['strategically', 'cunningly', 'deliberately'],
        empathetic: ['gently', 'warmly', 'compassionately'],
        friendly: ['cheerfully', 'kindly', 'happily'],
        righteous: ['boldly', 'justly', 'righteously'],
        vindictive: ['sharply', 'coldly', 'harshly']
    };
    
    const words = mockSuggestions[currentMood] || ['word1', 'word2', 'word3'];
    displaySuggestions(words);
}

function createMoodPrompt(text, mood) {
    const moodPrompts = {
        quirky: `Given this text: \"${text}\", suggest 3 quirky, whimsical, and unexpectedly playful next words that would add humor and surprise. Think outside the box!`,
        machiavellian: `Given this text: \"${text}\", suggest 3 strategic, cunning, and subtly manipulative next words that would maximize influence and control.`,
        empathetic: `Given this text: \"${text}\", suggest 3 compassionate, understanding, and emotionally supportive next words that show deep care and connection.`,
        friendly: `Given this text: \"${text}\", suggest 3 warm, welcoming, and genuinely friendly next words that would make someone feel comfortable and liked.`,
        righteous: `Given this text: \"${text}\", suggest 3 bold, principled, and morally strong next words that stand for justice and truth.`,
        vindictive: `Given this text: \"${text}\", suggest 3 sharp, cutting, and retaliatory next words that have an edge and show displeasure.`
    };
    
    return moodPrompts[mood] + " Respond with only the 3 words separated by commas, nothing else.";
}

function parseSuggestions(response) {
    // Clean up the response and extract words
    const cleaned = response.replace(/[^\w\s,]/g, '').trim();
    const words = cleaned.split(/[,\n\s]+/).filter(word => 
        word.length > 0 && 
        word.length < 20 && 
        /^[a-zA-Z]+$/.test(word)
    );
    
    // Return first 3 unique words
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
    
    // Get new suggestions after adding word
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
        getSuggestions();
    }, 300);
}

// Focus on input when page loads
window.addEventListener('load', () => {
    textInput.focus();
});
