function resetToWelcomeScreen() {
    document.getElementById('article-screen').style.display = 'none';
    document.getElementById('saved-articles-screen').style.display = 'none';
    document.getElementById('welcome-screen').style.display = 'block';
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
            document.getElementById('article-summary').textContent = article.summary;
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
        if (line.match(/(Key Concepts:|Potential Applications:)/)) {
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
    document.getElementById('welcome-screen').style.display = 'none';
    document.getElementById('article-screen').style.display = 'block';
    let images = []; // To store the image file names
    document.getElementById('article-title').textContent = '';
    document.getElementById('article-summary').textContent = '';
    document.getElementById('article-image1').src = '';
    document.getElementById('article-image1').style.display = 'none'; // Hide the image initially
    document.getElementById('article-image2').src = '';
    document.getElementById('article-image2').style.display = 'none'; // Hide the image initially

    fetch('https://en.wikipedia.org/api/rest_v1/page/random/summary')
        .then(response => response.json())
        .then(data => {
            document.getElementById('article-title').textContent = data.title;
            // Instead of setting the extract as the summary directly:
            // document.getElementById('article-summary').textContent = data.extract;
            // Use the title to generate a ChatGPT prompt:
            const prompt = `
            What is ${data.title}?
            Explain ${data.title} in simple terms suitable for a middle schooler, focusing on key concepts and their relevance.
    
            Key Concepts:
            Describe any fundamental concepts or terms in a straightforward manner.
    
            Potential Applications:
            List some practical or real world applications or implications in bullet points.
            `;            
            return fetchChatGPTResponse(prompt).then(summary => {
            document.getElementById('article-title').textContent = data.title;
            let formattedSummary = formatSummaryText(summary);
            document.getElementById('article-summary').innerHTML = formattedSummary;
            return data;
        })
        .then(data => {
            const title = data.title;
            // Fetch images for title
            return fetch(`https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=pageimages&format=json&pithumbsize=500&origin=*`);
        })
        .then(response => response.json())
        .then(data => {
            const pages = data.query.pages;
            const page = pages[Object.keys(pages)[0]];
            if (page.thumbnail) {
                document.getElementById('article-image1').src = page.thumbnail.source;
                document.getElementById('article-image1').style.display = 'block';
            } else {
                document.getElementById('article-image1').style.display = 'none';
            }
        })
        .catch(error => {
            console.error('Error fetching images:', error);
            document.getElementById('article-image1').style.display = 'none';
        })
        .then(response => response.json())
        .then(data => {
            const page = Object.values(data.query.pages)[0];
            document.getElementById('article-image1').src = page.imageinfo[0].url;
            document.getElementById('article-image1').style.display = 'block';

            if (images.length > 1) {
                return fetch(`https://en.wikipedia.org/w/api.php?action=query&titles=File:${encodeURIComponent(images[1])}&prop=imageinfo&iiprop=url&format=json&origin=*`);
            } else {
                document.getElementById('article-image2').style.display = 'none';
            }
        })
        .then(response => {
            if (response) {
                return response.json();
            }
        })
        .then(data => {
            if (data && images.length > 1) {
                const page = Object.values(data.query.pages)[0];
                document.getElementById('article-image2').src = page.imageinfo[0].url;
                document.getElementById('article-image2').style.display = 'block';
            }
        })
        .catch(error => {
            console.error('Error fetching images:', error);
        });
        document.getElementById('article-screen').style.display = 'block';

}
        )};

// Handle saving articles
// Handle saving articles
document.getElementById('save-article').addEventListener('click', function() {
    const title = document.getElementById('article-title').textContent;
    const summary = document.getElementById('article-summary').textContent;
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
document.getElementById('send-chat').addEventListener('click', function() {
    const inputElement = document.getElementById('chat-input');
    const chatQuery = inputElement.value;
    inputElement.value = ''; // Clear input after sending

    if (chatQuery.trim()) {
        fetchChatGPTResponse(chatQuery).then(response => {
            document.getElementById('article-summary').textContent = response;
            document.getElementById('article-screen').style.display = 'block';
        }).catch(error => {
            console.error('Error communicating with ChatGPT:', error);
            alert('Sorry, I am unable to respond at the moment.');
        });
    }
});

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

document.getElementById('learn-specific-topic').addEventListener('click', function() {
    document.getElementById('specific-topic-input').style.display = 'block';
});

document.getElementById('submit-specific-topic').addEventListener('click', function() {
    const topic = document.getElementById('specific-topic-text').value;
    const prompt = `
            What is ${topic}?
            Explain ${topic} in simple terms suitable for a middle schooler, focusing on key concepts and their relevance.
    
            Key Concepts:
            Describe any fundamental concepts or terms in a straightforward manner.
    
            Potential Applications:
            List some practical or real world applications or implications in bullet points.
            `; 
    fetchChatGPTResponse(prompt).then(summary => {
        document.getElementById('article-title').textContent = topic;
        document.getElementById('article-summary').textContent = summary;
        document.getElementById('welcome-screen').style.display = 'none';
        document.getElementById('article-screen').style.display = 'block';
    });
});