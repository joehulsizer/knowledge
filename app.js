

function resetToWelcomeScreen() {
    document.getElementById('article-screen').style.display = 'none';
    document.getElementById('saved-articles-screen').style.display = 'none';
    document.getElementById('welcome-screen').style.display = 'block';
    document.getElementById('specific-topic-form').style.display = 'none';
    document.getElementById('specific-topic-text').value = '';
}

function showLoadingScreen() {
    document.getElementById('loading-screen').style.display = 'block';
}

function hideLoadingScreen() {
    document.getElementById('loading-screen').style.display = 'none';
}

let chatSessionId = null;
let chatHistory = [];
// Set up event listeners only once, outside any other function
document.getElementById('back-to-main').addEventListener('click', resetToWelcomeScreen);
document.getElementById('back-to-main_saved').addEventListener('click', resetToWelcomeScreen);
document.getElementById('generate-article').addEventListener('click', generateRandomArticle);
document.getElementById('generate-another').addEventListener('click', generateRandomArticle);

// Display saved articles and handle their selection
document.getElementById('view-saved').addEventListener('click', function() {
    document.getElementById('welcome-screen').style.display = 'none';
    document.getElementById('saved-articles-screen').style.display = 'block';

    const savedArticles = JSON.parse(localStorage.getItem('savedArticles')) || [];
    const savedArticlesContainer = document.getElementById('saved-articles');
    savedArticlesContainer.innerHTML = '';

    savedArticles.forEach((article, index) => {
        const articleContainer = document.createElement('div');
        articleContainer.className = 'saved-article-container';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = 'delete-' + index;
        checkbox.className = 'delete-checkbox';

        const label = document.createElement('label');
        label.htmlFor = 'delete-' + index;
        label.textContent = article.title;
        label.className = 'saved-article-title';

        savedArticlesContainer.appendChild(articleContainer);
    });

    savedArticles.forEach(article => {
        const topicButton = document.createElement('button');
        topicButton.textContent = article.title;
        topicButton.className = 'topic-button';
        topicButton.addEventListener('click', function() {
            document.getElementById('saved-articles-screen').style.display = 'none';
            document.getElementById('article-title').textContent = article.title;
        
            // Apply formatting to the article summary before displaying it
            let formattedSummary = formatSummaryText(article.summary);
            document.getElementById('article-summary').innerHTML = article.summary;
        
            document.getElementById('article-image1').src = article.image1 || '';
            document.getElementById('article-image2').src = article.image2 || '';
        
            document.getElementById('article-image1').style.display = article.image1 ? 'block' : 'none';
            document.getElementById('article-image2').style.display = article.image2 ? 'block' : 'none';
        
            document.getElementById('article-screen').style.display = 'block';
        });
        
        savedArticlesContainer.appendChild(topicButton);
    });
});

function formatSummaryText(summary) {
    // Split the text into lines
    let lines = summary.split('\n');
    let formattedText = '';

    lines.forEach(line => {
        // Check if the line is a header
        if (line.match(/(Key Concepts:|Relevance:)/)) {
            formattedText += `<strong>${line}</strong><br>`;
        // Check if the line is a list item
        } else if (line.startsWith('-')) {
            // Add an opening <ul> tag if this is the first list item
            if (!formattedText.endsWith('</ul>') && !formattedText.includes('<ul>')) {
                formattedText += '<ul>';
            }
            formattedText += `<li>${line.substring(1).trim()}</li>`;
        } else {
            // Add a closing </ul> tag if this is the end of a list
            if (formattedText.includes('<ul>') && !line.startsWith('-')) {
                formattedText += '</ul>';
            }
            formattedText += `${line}<br>`;
        }
    });

    // Close the list if the summary ends with a list
    if (formattedText.includes('<ul>') && !formattedText.endsWith('</ul>')) {
        formattedText += '</ul>';
    }

    return formattedText;
}
// Handle article generation and display
function generateRandomArticle() {
    let difficulty = localStorage.getItem('selectedDifficulty') || 'middle';  // Default to 'middle' if not set
    document.getElementById('difficulty-level').value = difficulty;
    document.getElementById('welcome-screen').style.display = 'none';

    // Select a random topic
    const categories = Object.keys(subjects);
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
    const randomTopicList = subjects[randomCategory];
    const randomTopic = randomTopicList[Math.floor(Math.random() * randomTopicList.length)];
    const prompt = `Please generate a random topic related to the genre of ${randomTopic}, like if genre is sports then it could generate like what is basketball or what is cricket?`;

    // Save the topic to localStorage for reuse
    localStorage.setItem('currentTopic', randomTopic);

    fetchChatGPTResponse(prompt).then(randomtopicgen => {
        // Ensure this value is used after it's been set
        fetchSummaryAndImages(randomtopicgen);
    });
}


        ;

// Handle saving articles
// Handle saving articles
document.getElementById('save-article').addEventListener('click', function() {
    const title = document.getElementById('article-title').textContent;
    
    const summary = document.getElementById('article-summary').innerHTML;
    const image1 = document.getElementById('article-image1').src;
    const image2 = document.getElementById('article-image2').style.display !== 'none' ? document.getElementById('article-image2').src : '';

    let savedArticles = JSON.parse(localStorage.getItem('savedArticles')) || [];
    
    // Check if the article is already saved
    const isArticleSaved = savedArticles.some(article => article.title === title);

    if (!isArticleSaved) {
        savedArticles.push({ title, summary, image1, image2 });
        localStorage.setItem('savedArticles', JSON.stringify(savedArticles));
        alert('Article saved!');
    } else {
        alert('This article is already saved!');
    }

    resetToWelcomeScreen();
});


// Clear all saved topics
document.getElementById('clear-topics').addEventListener('click', function() {
    localStorage.removeItem('savedArticles');
    const savedArticlesContainer = document.getElementById('saved-articles');
    savedArticlesContainer.innerHTML = '';
    alert('All saved topics have been cleared.');
    resetToWelcomeScreen();
});



// Add event listener for the ChatGPT interaction


// Function to fetch response from ChatGPT
function fetchChatGPTResponse(message) {
    const apiKey = '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'; // Replace with your actual API key
    return fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: "gpt-4", // Update according to the API documentation
            messages: [{role: "user", content: message}]
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            throw new Error(data.error.message);
        }
        return data.choices[0].message.content;
    })
    .catch(error => {
        console.error('API Error:', error);
        return `API Error: ${error.message}`;
    });
}
document.getElementById('difficulty-level').addEventListener('change', function() {
    localStorage.setItem('selectedDifficulty', this.value);
});


// Function for the Learn Specific Topic button
document.getElementById('learn-specific-topic').addEventListener('click', function() {
    document.getElementById('specific-topic-form').style.display = 'block';
});

document.getElementById('submit-specific-topic').addEventListener('click', learnSpecificTopic);

function learnSpecificTopic() {
    const topic = document.getElementById('specific-topic-text').value.trim();
    if (!topic) {
        alert('Please enter a topic.');
        return;
    }

    fetchSummaryAndImages(topic);  // Fetch and display the information for the entered topic.
}

function fetchSummaryAndImages(topic) {
    showLoadingScreen(); 
    document.getElementById('welcome-screen').style.display = 'none';
    document.getElementById('article-screen').style.display = 'block';
    document.getElementById('article-title').textContent = '';
    document.getElementById('article-summary').innerHTML = '';
    document.getElementById('article-image1').src = '';
    document.getElementById('article-image1').style.display = 'none';
    document.getElementById('article-image2').src = '';
    document.getElementById('article-image2').style.display = 'none';
    let difficulty = document.getElementById('difficulty-level').value;
    let difficultyText = '';
    switch (difficulty) {
        case 'elementary':
            difficultyText = 'an elementary school student';
            break;
        case 'middle':
            difficultyText = 'a middle school student';
            break;
        case 'high':
            difficultyText = 'a high school student';
            break;
        case 'college':
            difficultyText = 'a college student';
            break;
    }
    const summaryPrompt = `In less than 200 words and beginning with saying difficulty level is for ${difficultyText}:
        What is ${topic}?
        Explain ${topic} for ${difficultyText}, focusing on key concepts and their relevance.
        
        Key Concepts:
        Describe any fundamental concepts or terms in a straightforward manner.
        
        Relevance:
        List some applicable knowledge points, like famous people or events or examples of use or just quick notes that would allow me to be informed in a conversation about ${topic} in bullet points.
    `;

    fetchChatGPTResponse(summaryPrompt).then(summary => {
        let formattedSummary = formatSummaryText(summary);
        document.getElementById('article-title').textContent = topic;
        document.getElementById('article-summary').innerHTML = formattedSummary;
        
        // Fetch an image using Google's Custom Search JSON API
        fetchImageFromGoogle(topic);
    })
    .finally(() => {
        hideLoadingScreen();
    });
}

// You should ensure that similar image fetching and displaying logic is used in generateRandomArticle.
// The generateRandomArticle function should include proper logic to fetch and display images as done in fetchSummaryAndImages.
function fetchImageFromGoogle(topic) {
    const apiKey = 'AIzaSyD7dpxeJoR1irPP1mYljevPrQN5HDcIjvM';  // Replace with your actual API key.
    const searchEngineId = 'e1330f0d708e64b76';  // Replace with your search engine ID.
    const query = topic;
    const url = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(query)}&cx=${searchEngineId}&searchType=image&key=${apiKey}&num=1`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.items && data.items.length > 0) {
                const imageUrl = data.items[0].link;
                document.getElementById('article-image1').src = imageUrl;
                document.getElementById('article-image1').style.display = 'block';
            } else {
                console.log('No images found.');
                document.getElementById('article-image1').style.display = 'none';
            }
        })
        .catch(error => {
            console.error('Error fetching image:', error);
            document.getElementById('article-image1').style.display = 'none';
        });
}
// Add Learn More button functionality


// Filename: extendArticle.js

// Function to initialize Learn More button functionality
function addLearnMoreButton() {
    document.getElementById('learn-more').addEventListener('click', displayOptionsBox);
}

// Function to display options box for extending the article
function displayOptionsBox() {
    document.getElementById('options-box').style.display = 'block';
}

// Function to extend the article summary based on the selected option
// This function now explicitly uses the current summary displayed on the page.
function extendArticleSummary(option) {
    let currentSummary = document.getElementById('article-summary').innerHTML;
    
    // Show loading screen while generating additional information
    showLoadingScreen();

    // The API call or processing should now use the currentSummary as a context or starting point
    // for generating additional content. This is simulated as follows:
    const extensionPromptDepth = `Given this summary: "${currentSummary}". Explain in the exactly same form at a high school level instead of the current middle school level of the given summary.`; // Placeholder for extension logic
    const extensionPromptSimple = `Given this summary: "${currentSummary}". Explain in the exactly same form at a simpler level instead of the current middle school level of the given summary.`; // Placeholder for extension logic
    const extensionPromptTalking = `Given this summary: "${currentSummary}". Explain in the exactly same form, with additional points in the relevance and talking points section.`; // Placeholder for extension logic
    if(option == 'More In-Depth'){
        extensionPrompt = extensionPromptDepth;
    } else if(option == 'Explain Simpler'){
        extensionPrompt = extensionPromptSimple;
    }
    else if(option == 'More Talking Points'){
        extensionPrompt = extensionPromptTalking;
    }

    fetchChatGPTResponse(extensionPrompt).then(extendedContent => {
        // Append the extended content to the current summary
        let extendedformattedSummary = formatSummaryText(extendedContent);

        let extendedSummary = extendedformattedSummary;

        // Update the article summary with the extended information
        document.getElementById('article-summary').innerHTML = extendedSummary;

        // Hide loading screen after the content is updated
        hideLoadingScreen();
    }).catch(error => {
        console.error('Error extending article:', error);
        // Hide loading screen even if there's an error
        hideLoadingScreen();
    });
}

// Add event listeners for the options to extend the summary
document.getElementById('explain-simpler').addEventListener('click', () => extendArticleSummary('Explain Simpler'));
document.getElementById('more-in-depth').addEventListener('click', () => extendArticleSummary('More In-Depth'));

// Initialize the Learn More button when the page loads
addLearnMoreButton();
// Initialize difficulty settings
let difficultyLevel = {
    'elementary': 1,
    'middle': 2,
    'high': 3,
    'college': 4
};

// Convert the difficulty from string to number for easier manipulation
function updateDifficulty(direction) {
    let currentDifficulty = localStorage.getItem('selectedDifficulty') || 'middle';
    let currentLevel = difficultyLevel[currentDifficulty];
    
    if (direction === 'increase' && currentLevel < 4) {
        currentLevel++;
    } else if (direction === 'decrease' && currentLevel > 1) {
        currentLevel--;
    }

    // Find the difficulty as a string based on the updated level number
    for (let key in difficultyLevel) {
        if (difficultyLevel[key] === currentLevel) {
            localStorage.setItem('selectedDifficulty', key);
            document.getElementById('difficulty-level').value = key;
            break;
        }
    }
}

// Event listener for changing difficulty
document.getElementById('more-in-depth').addEventListener('click', function() {
    updateDifficulty('increase');
    extendArticleSummary('More In-Depth'); // Assuming this function refreshes the content
});

// Similarly, you can decrease the difficulty
document.getElementById('explain-simpler').addEventListener('click', function() {
    updateDifficulty('decrease');
    extendArticleSummary('Explain Simpler'); // Assuming this function refreshes the content
});
// Adding an event listener for 'generate-similar' button
document.getElementById('generate-similar').addEventListener('click', generateSimilarArticle);

function generateSimilarArticle() {
    console.log('generateSimilarArticle function called'); // Debugging log
    let topic = localStorage.getItem('currentTopic');
    if (!topic) {
        alert('No topic found. Please generate an article first.');
        return;
    }

    let prompt = `Please generate a similar random topic related to the genre of ${topic}, like if the genre is sports then it could generate topics like what is basketball or what is cricket?`;

    fetchChatGPTResponse(prompt).then(similarTopic => {
        console.log('API Response:', similarTopic); // Debugging log
        if (!similarTopic.trim()) {
            console.error('API returned an empty topic.');
            alert('Failed to generate a similar topic. Please try again.');
            return;
        }
        fetchSummaryAndImages(similarTopic);
    }).catch(error => {
        console.error('Failed to fetch a similar topic from ChatGPT:', error);
        alert('Failed to generate a similar article. Please check your network connection and try again.');
    });
}
document.getElementById('learn-bullet-points').addEventListener('click', makeBulletsSelectable);

function makeBulletsSelectable() {
    let summaryParagraphs = document.getElementById('article-summary').querySelectorAll('li');
    summaryParagraphs.forEach((paragraph, index) => {
        let checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = 'bullet-' + index;
        checkbox.className = 'bullet-checkbox';
        checkbox.value = paragraph.textContent;

        let label = document.createElement('label');
        label.htmlFor = 'bullet-' + index;
        label.textContent = paragraph.textContent;

        // Insert checkbox before the paragraph content
        paragraph.textContent = '';
        paragraph.appendChild(checkbox);
        paragraph.appendChild(label);
    });

    // Add a button to generate detailed topic
    let generateButton = document.createElement('button');
    generateButton.textContent = 'Generate from Bullet';
    generateButton.addEventListener('click', generateFromBullet);
    document.getElementById('article-summary').appendChild(generateButton);
}

function generateFromBullet() {
    let selectedBullets = document.querySelectorAll('.bullet-checkbox:checked');
    if (selectedBullets.length === 0) {
        alert('Please select at least one bullet point.');
        return;
    }

    let bulletText = selectedBullets[0].value;
    let firstPrompt = `Extract the main topic or entity from this detail: "${bulletText}"? that would be fitting for a Who is __ or What is ___ question. For example, from the input 'Crisis management can save a company's reputation, like in the case of Johnson & Johnson's Tylenol contamination incident in 1982. The company's effective response saved its image.', the output could be: Johnson & Johnson's Tylenol contamination incident. or it could be: Johnson & Johnson.  Your output should only include the topic as a standalone idea do not base it on the overall bullet point. For example if this bullet point: You could talk about how effective moderation promotes healthy online spaces. For example, 'Roblox' has strict moderation rules to protect its young user
    base." was inputted, your output should be: Roblox. It should not be: Roblox moderation rules. And So output like: Johnson & Johnson's Tylenol contamination incident., not like "Main topic:" or "The main topic is" `;

    fetchChatGPTResponse(firstPrompt).then(topicFromBullet => {
        // Treat the result as a specific topic and fetch details in the same manner
        processAsSpecificTopic(topicFromBullet.trim());
    }).catch(error => {
        console.error('Error extracting topic from bullet:', error);
        alert('Failed to process the bullet point. Please try again.');
        hideLoadingScreen();
    });
}

function processAsSpecificTopic(topic) {
    if (!topic) {
        alert('No valid topic extracted. Please try another bullet point.');
        return;
    }

    showLoadingScreen();
    fetchSummaryAndImages(topic);  // This function will handle the topic as if it was input directly into the 'Learn a Specific Topic' form
}

