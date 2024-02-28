function resetToWelcomeScreen() {
    document.getElementById('article-screen').style.display = 'none';
    document.getElementById('saved-articles-screen').style.display = 'none';
    document.getElementById('welcome-screen').style.display = 'block';
}

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
            document.getElementById('article-summary').textContent = data.extract;
            return fetch(`https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(data.title)}&format=json&origin=*`);
        })
        .then(response => response.json())
        .then(data => {
            images = data.parse.images.filter(image => image.endsWith('.jpg') || image.endsWith('.png')).slice(0, 2);
            if (images.length > 0) {
                return fetch(`https://en.wikipedia.org/w/api.php?action=query&titles=File:${encodeURIComponent(images[0])}&prop=imageinfo&iiprop=url&format=json&origin=*`);
            } else {
                document.getElementById('article-image1').style.display = 'none';
                return Promise.reject('No suitable images found.');
            }
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
