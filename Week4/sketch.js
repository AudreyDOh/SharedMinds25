
// Global variables
let umap;
let entities = [];
let umapResults = [];
let embeddingsReady = false;
let hoveredEntity = null;
const authToken = "eyJhbGciOiJSUzI1NiIsImtpZCI6ImU4MWYwNTJhZWYwNDBhOTdjMzlkMjY1MzgxZGU2Y2I0MzRiYzM1ZjMiLCJ0eXAiOiJKV1QifQ.eyJuYW1lIjoiQXVkcmV5IE9oIiwicGljdHVyZSI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS9hL0FDZzhvY0xvdEVlUWNJZWNfUndLQ3I4b2tiT0hoel9ERWMwcjZsVWZITHZJZlJKdGt6R3I9czk2LWMiLCJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vaXRwLWltYS1yZXBsaWNhdGUtcHJveHkiLCJhdWQiOiJpdHAtaW1hLXJlcGxpY2F0ZS1wcm94eSIsImF1dGhfdGltZSI6MTc1OTMwNDI5OCwidXNlcl9pZCI6Im1DRXhacVlYTFFZZHZianFwTWxCeUtYNmo5WjIiLCJzdWIiOiJtQ0V4WnFZWExRWWR2YmpxcE1sQnlLWDZqOVoyIiwiaWF0IjoxNzU5MzA0Mjk4LCJleHAiOjE3NTkzMDc4OTgsImVtYWlsIjoiZG83NzJAbnl1LmVkdSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJmaXJlYmFzZSI6eyJpZGVudGl0aWVzIjp7Imdvb2dsZS5jb20iOlsiMTExNzk1Njc2Njc5MDMxNTIyNTY3Il0sImVtYWlsIjpbImRvNzcyQG55dS5lZHUiXX0sInNpZ25faW5fcHJvdmlkZXIiOiJnb29nbGUuY29tIn19.axFi8IdT4GIiGzedQywA3JCDqBbhjzqt-jzS7ssjXTyJtzeJ7Fj548ftTfnGivstQT1qmtysYXZ9JMOMz4dopXalUcu6HNPDGnq8-LCryRfEPFhCwhHZNUBEt_SgUNZePCffPs5ajn65GcCCYnj88QYLg5IhApiD5juEk4ol3RhilXCbEdRiC-npryeW0e6ream6Jr2iU5U2Sy-wg8ZRsRSypV0zpou4XjG4aaKeq4gdlddzMZABgKLCU2MX5BvvH5AN_7OLAgYkOgtXa-nvSp6UnxI5JqCdLLX0S1E91dl6-w24ClzL_FofbV26rHWFlxaYD7Cbim8rfhWKGjTogg"; 

// p5.js setup function
function setup() {
  const canvas = createCanvas(800, 600);
  canvas.parent('canvas-container');
  colorMode(RGB);
  textAlign(CENTER, CENTER);
  
  initializeEntities();
  initializeApp();

  // Set up sliders and their event listeners
  document.getElementById('personalityWeight').addEventListener('input', handleSliderInput);
  document.getElementById('powerWeight').addEventListener('input', handleSliderInput);
  document.getElementById('domainWeight').addEventListener('input', handleSliderInput);
}

function handleSliderInput() {
    document.getElementById('personalityWeightValue').textContent = document.getElementById('personalityWeight').value;
    document.getElementById('powerWeightValue').textContent = document.getElementById('powerWeight').value;
    document.getElementById('domainWeightValue').textContent = document.getElementById('domainWeight').value;
    
    if (embeddingsReady) {
        updateMap();
    }
}

async function initializeApp() {
  assignDomainColors();
  await fetchAllEmbeddings();
  embeddingsReady = true;
  document.getElementById('controls').style.display = 'block'; 
  updateMap();
}

function initializeEntities() {
    entities = [
        // Greek & Roman
        { name: "Zeus", culture: "Greek", blurb: "King of the gods, ruler of Mount Olympus and the sky.", domainKeywords: ['sky'], personality: "powerful, commanding, promiscuous, arrogant", power: "controls lightning and thunder, king of gods", domain: "sky god, ruler of Olympus" },
        { name: "Hades", culture: "Greek", blurb: "God of the underworld and the dead.", domainKeywords: ['underworld', 'death'], personality: "stern, wealthy, possessive, solitary", power: "rules the underworld, commands the dead", domain: "god of the underworld, death, and riches" },
        { name: "Poseidon", culture: "Greek", blurb: "God of the sea, earthquakes, and storms.", domainKeywords: ['sea', 'land'], personality: "moody, tempestuous, powerful, creative", power: "controls seas, earthquakes, creates horses", domain: "god of the sea, earthquakes, and storms" },
        { name: "Apollo", culture: "Greek", blurb: "God of music, arts, knowledge, and light.", domainKeywords: ['sun', 'wisdom', 'art'], personality: "artistic, healing, prophetic, rational", power: "controls music, archery, prophecy, light", domain: "god of music, arts, knowledge, and light" },
        { name: "Athena", culture: "Greek", blurb: "Goddess of wisdom, courage, and strategic warfare.", domainKeywords: ['wisdom', 'war'], personality: "wise, strategic, courageous, disciplined", power: "excels in warfare and wisdom, crafts", domain: "goddess of wisdom, courage, and strategic warfare" },
        { name: "Hermes", culture: "Greek", blurb: "Messenger of the gods; god of trade, thieves, and travelers.", domainKeywords: ['trickster', 'land'], personality: "quick, witty, charming, agile, boundary-crosser", power: "superhuman speed, messenger of the gods", domain: "god of trade, travelers, and thieves" },

        // Norse
        { name: "Odin", culture: "Norse", blurb: "The All-Father; god of wisdom, war, and death.", domainKeywords: ['wisdom', 'war', 'death', 'sky'], personality: "wise, relentless, sacrificial, mysterious", power: "seeks knowledge, commands ravens, god of war", domain: "all-father, god of wisdom, war, and death" },
        { name: "Thor", culture: "Norse", blurb: "God of thunder, lightning, and strength, protector of mankind.", domainKeywords: ['sky', 'war'], personality: "strong, protective, brave, hot-tempered", power: "wields Mjolnir, controls thunder, immense strength", domain: "god of thunder, lightning, and strength" },
        { name: "Loki", culture: "Norse", blurb: "Trickster god of mischief, known for his cunning and shapeshifting.", domainKeywords: ['trickster', 'fire'], personality: "cunning, mischievous, chaotic, shapeshifter", power: "creates illusions, changes form, causes chaos", domain: "trickster god of mischief" },
        { name: "Freya", culture: "Norse", blurb: "Goddess of love, beauty, fertility, and war.", domainKeywords: ['love', 'war'], personality: "beautiful, loving, fierce, independent", power: "rules over love, fertility, and war", domain: "goddess of love, beauty, and war" },

        // Egyptian
        { name: "Ra", culture: "Egyptian", blurb: "The sun god, one of the most important gods in ancient Egypt.", domainKeywords: ['sun', 'sky', 'creator'], personality: "majestic, life-giving, powerful, creator", power: "sails across the sky, brings the sun, creates life", domain: "sun god, creator deity" },
        { name: "Anubis", culture: "Egyptian", blurb: "God of death, mummification, and the afterlife.", domainKeywords: ['death', 'underworld'], personality: "solemn, just, protective, guide", power: "weighs hearts, guides souls, protects tombs", domain: "god of death, embalming, and the afterlife" },
        { name: "Isis", culture: "Egyptian", blurb: "Goddess of magic, motherhood, and healing; wife of Osiris.", domainKeywords: ['magic', 'love', 'creator'], personality: "magical, maternal, healing, devoted", power: "uses powerful magic, resurrects the dead", domain: "goddess of magic, motherhood, and healing" },
        { name: "Osiris", culture: "Egyptian", blurb: "God of the underworld, resurrection, and fertility.", domainKeywords: ['underworld', 'death', 'land'], personality: "just, regenerative, civilizing, deceased", power: "rules the underworld, grants life from death", domain: "god of the underworld, resurrection, and fertility" },

        // More entities with domainKeywords...
        { name: "Amaterasu", culture: "Japanese", blurb: "Sun goddess, ruler of the heavens.", domainKeywords: ['sun', 'sky'], personality: "radiant, benevolent, noble", power: "shines light upon the world", domain: "sun goddess" },
        { name: "Susanoo", culture: "Japanese", blurb: "God of storms and the sea.", domainKeywords: ['sea', 'sky'], personality: "violent, heroic, wild", power: "controls storms", domain: "god of storms and sea" },
        { name: "Kitsune", culture: "Japanese", blurb: "Magical fox spirits.", domainKeywords: ['trickster', 'magic'], personality: "intelligent, cunning, loyal", power: "shapeshifting, illusions", domain: "yokai fox spirit" },
        { name: "Ryujin", culture: "Japanese", blurb: "Dragon god of the sea.", domainKeywords: ['sea', 'dragon'], personality: "powerful, majestic, dangerous", power: "controls tides", domain: "dragon god of the sea" },
        { name: "Shiva", culture: "Hindu", blurb: "The destroyer and transformer.", domainKeywords: ['destruction', 'creation'], personality: "ascetic, destructive, powerful", power: "destroys the universe to recreate it", domain: "the destroyer" },
        { name: "Vishnu", culture: "Hindu", blurb: "The preserver and protector.", domainKeywords: ['creator', 'land'], personality: "benevolent, protective, righteous", power: "maintains cosmic order", domain: "the preserver" },
        { name: "Ganesha", culture: "Hindu", blurb: "Remover of obstacles.", domainKeywords: ['wisdom', 'land'], personality: "wise, benevolent, patron", power: "removes obstacles", domain: "god of beginnings" },
        { name: "Kali", culture: "Hindu", blurb: "Goddess of time and change.", domainKeywords: ['destruction', 'death'], personality: "fierce, liberating, untamed", power: "destroys evil forces", domain: "goddess of time and destruction" },
        { name: "Sun Wukong", culture: "Chinese", blurb: "The Monkey King trickster hero.", domainKeywords: ['trickster', 'war'], personality: "rebellious, powerful, clever", power: "supernatural strength, 72 transformations", domain: "monkey king" },
        { name: "Quetzalcoatl", culture: "Aztec", blurb: "Feathered serpent creator god.", domainKeywords: ['creator', 'sky', 'wisdom'], personality: "wise, creative, benevolent", power: "creator of mankind", domain: "god of wind and wisdom" },
        { name: "Anansi", culture: "Akan", blurb: "Trickster god of stories.", domainKeywords: ['trickster', 'wisdom'], personality: "clever, tricky, storyteller", power: "obtains all stories", domain: "trickster god of stories" },
        { name: "The Morrigan", culture: "Celtic", blurb: "Goddess of war, fate, and death.", domainKeywords: ['war', 'death', 'magic'], personality: "prophetic, fierce, protective", power: "foretells doom, incites battle", domain: "goddess of war and fate" },
        { name: "Phoenix", culture: "Mythical", blurb: "A mythical bird of rebirth from ashes.", domainKeywords: ['fire', 'sun', 'creation'], personality: "cyclical, regenerative, gentle", power: "is reborn from ashes", domain: "mythical bird of rebirth" },
        { name: "Dragon", culture: "Mythical", blurb: "Legendary serpentine creature.", domainKeywords: ['dragon', 'fire', 'land'], personality: "powerful, wise, hoarders", power: "breathes fire, flies", domain: "legendary creature" }
    ];
}

function assignDomainColors() {
    const domainColors = {
        'sea': color(0, 102, 204),       // Dark Blue
        'sky': color(135, 206, 250),     // Sky Blue
        'fire': color(220, 20, 60),      // Crimson Red
        'sun': color(255, 215, 0),       // Gold
        'land': color(139, 69, 19),      // Saddle Brown
        'underworld': color(75, 0, 130),   // Indigo
        'death': color(105, 105, 105),    // Dim Gray
        'love': color(255, 105, 180),     // Hot Pink
        'war': color(178, 34, 34),       // Firebrick
        'wisdom': color(148, 0, 211),     // Dark Violet
        'trickster': color(50, 205, 50), // Lime Green
        'creator': color(255, 250, 250), // Snow White
        'magic': color(218, 112, 214),    // Orchid
        'art': color(0, 191, 255),       // Deep Sky Blue
        'dragon': color(210, 105, 30)     // Chocolate
    };

    entities.forEach(entity => {
        let colorsToBlend = entity.domainKeywords.map(keyword => domainColors[keyword]).filter(c => c !== undefined);

        if (colorsToBlend.length === 0) {
            entity.displayColor = color(200); // A default grey
        } else if (colorsToBlend.length === 1) {
            entity.displayColor = colorsToBlend[0];
        } else {
            // Blend multiple colors by averaging their RGB components
            let r = 0, g = 0, b = 0;
            colorsToBlend.forEach(c => {
                r += red(c);
                g += green(c);
                b += blue(c);
            });
            entity.displayColor = color(r / colorsToBlend.length, g / colorsToBlend.length, b / colorsToBlend.length);
        }
    });
}

async function askForEmbeddings(p_prompt_array) {
  const replicateProxy = "https://itp-ima-replicate-proxy.web.app/api/create_n_get";
  let data = {
    version: "beautyyuyanli/multilingual-e5-large:a06276a89f1a902d5fc225a9ca32b6e8e6292b7f3b136518878da97c458e2bad",
    input: { texts: JSON.stringify(p_prompt_array) },
  };
  let options = {
    method: "POST",
    headers: { "Content-Type": "application/json", 'Authorization': `Bearer ${authToken}` },
    body: JSON.stringify(data),
  };
  try {
    const response = await fetch(replicateProxy, options);
    const proxy_said = await response.json();
    return proxy_said.output || (console.error("API Error:", proxy_said), null);
  } catch (e) {
    console.error("Fetch Error:", e);
    return null;
  }
}

async function fetchAllEmbeddings() {
  for (let entity of entities) {
    console.log(`Fetching embeddings for ${entity.name}...`);
    const descriptions = [entity.personality, entity.power, entity.domain];
    const embeddings = await askForEmbeddings(descriptions);
    if (embeddings && embeddings.length === 3) {
      [entity.personalityEmbedding, entity.powerEmbedding, entity.domainEmbedding] = embeddings;
    } else {
      console.log(`Failed to fetch for ${entity.name}. Using random fallbacks.`);
      entity.personalityEmbedding = Array.from({ length: 768 }, () => Math.random() * 2 - 1);
      entity.powerEmbedding = Array.from({ length: 768 }, () => Math.random() * 2 - 1);
      entity.domainEmbedding = Array.from({ length: 768 }, () => Math.random() * 2 - 1);
    }
  }
  console.log("All embeddings fetched!");
}

function updateMap() {
  const W1 = parseFloat(document.getElementById('personalityWeight').value);
  const W2 = parseFloat(document.getElementById('powerWeight').value);
  const W3 = parseFloat(document.getElementById('domainWeight').value);

  const blendedEmbeddings = entities.map(entity => {
      const finalEmbedding = new Array(entity.personalityEmbedding.length).fill(0);
      for (let i = 0; i < finalEmbedding.length; i++) {
          finalEmbedding[i] = (entity.personalityEmbedding[i] * W1) + (entity.powerEmbedding[i] * W2) + (entity.domainEmbedding[i] * W3);
      }
      return finalEmbedding;
  });

  umap = new UMAP({ n_neighbors: 5, n_components: 2, min_dist: 0.2, n_epochs: 200, metric: 'cosine' });
  umap.fit(blendedEmbeddings);
  umapResults = umap.getEmbedding();
  loop();
}

function draw() {
  background(0); // Black background for a mythical vibe
  
  if (!embeddingsReady) {
    fill(255);
    text("Summoning list...", width / 2, height / 2);
    return;
  }
  if (umapResults.length === 0) {
    fill(255);
    text("Arranging the cosmos...", width / 2, height / 2);
    return;
  }
  
  hoveredEntity = null;

  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  umapResults.forEach(pos => {
    minX = min(minX, pos[0]); maxX = max(maxX, pos[0]);
    minY = min(minY, pos[1]); maxY = max(maxY, pos[1]);
  });

  entities.forEach((entity, i) => {
    const x = map(umapResults[i][0], minX, maxX, 50, width - 50);
    const y = map(umapResults[i][1], minY, maxY, 50, height - 50);
    entity.x = x; entity.y = y;

    if (dist(mouseX, mouseY, x, y) < 12) { 
        hoveredEntity = entity;
    }
    
    // Draw a glowing effect
    noStroke();
    fill(red(entity.displayColor), green(entity.displayColor), blue(entity.displayColor), 50);
    ellipse(x, y, 20, 20);

    // Draw the main dot
    fill(entity.displayColor);
    ellipse(x, y, 10, 10);
    
    // Draw name label
    fill(220); // Light grey text
    textSize(10);
    text(entity.name, x, y + 20);
  });
  
  if (hoveredEntity) {
      drawTextBox(hoveredEntity);
  }
}

function drawTextBox(entity) {
    const title = `${entity.name} (${entity.culture})`;
    const blurb = entity.blurb;
    const padding = 12;
    const maxWidth = 220;
    const lineHeight = 15;
    const titleHeight = 22;

    // --- 1. Text Wrapping & Measurement ---
    textSize(12);
    textAlign(LEFT, TOP);
    let words = blurb.split(' ');
    let currentLine = '';
    let lineCount = 0;

    for (let i = 0; i < words.length; i++) {
        let testLine = currentLine + words[i] + ' ';
        if (textWidth(testLine) > maxWidth - padding * 2 && i > 0) {
            lineCount++;
            currentLine = words[i] + ' ';
        } else {
            currentLine = testLine;
        }
    }
    lineCount++; // Add the last line

    // --- 2. Box Size & Position ---
    const boxWidth = maxWidth;
    const boxHeight = padding + titleHeight + (lineCount * lineHeight) + padding / 2;

    let x = entity.x + 20;
    let y = entity.y - (boxHeight / 2);

    // Keep box on screen
    if (x + boxWidth > width) x = entity.x - boxWidth - 20;
    if (y < 10) y = 10;
    if (y + boxHeight > height - 10) y = height - boxHeight - 10;

    // --- 3. Drawing ---
    // Box
    fill(10, 10, 20, 220); // Dark, semi-transparent blue-black
    stroke(150, 150, 200, 150); // Faint magical border
    strokeWeight(1);
    rect(x, y, boxWidth, boxHeight, 8);

    // Text
    noStroke();
    fill(255);
    textStyle(BOLD);
    text(title, x + padding, y + padding);

    textStyle(NORMAL);
    // Use p5's built-in text wrapping by providing width/height arguments
    text(blurb, x + padding, y + padding + titleHeight, boxWidth - padding * 2);
    
    // Reset alignment
    textAlign(CENTER, CENTER);
}
