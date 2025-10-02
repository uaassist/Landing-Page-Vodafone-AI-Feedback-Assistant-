document.addEventListener('DOMContentLoaded', () => {
    // --- Element selectors for all views ---
    const welcomeScreen = document.getElementById('welcome-screen');
    const choiceScreen = document.getElementById('choice-screen');
    const chatView = document.getElementById('chat-view');
    const recoveryScreen = document.getElementById('recovery-screen');
    const chatBody = document.getElementById('chat-body');
    const quickRepliesContainer = document.getElementById('quick-replies-container');
    const progressContainer = document.getElementById('progress-container');

    // --- Button Selectors for Initial Steps ---
    const greatBtn = document.getElementById('great-btn');
    const okayBtn = document.getElementById('okay-btn');
    const badBtn = document.getElementById('bad-btn');
    const aiDraftBtn = document.getElementById('ai-draft-btn');
    const manualReviewBtn = document.getElementById('manual-review-btn');
    const requestAssistanceBtn = document.getElementById('request-assistance-btn');
    const scheduleCallbackBtn = document.getElementById('schedule-callback-btn');
    const googleReviewFallbackBtn = document.getElementById('google-review-fallback-btn');

    // --- Direct Event Listeners for Welcome/Choice Screens ---
    greatBtn.addEventListener('click', () => {
        welcomeScreen.classList.add('hidden');
        choiceScreen.classList.remove('hidden');
    });
    okayBtn.addEventListener('click', () => {
        welcomeScreen.classList.add('hidden');
        recoveryScreen.classList.remove('hidden');
    });
    badBtn.addEventListener('click', () => {
        welcomeScreen.classList.add('hidden');
        recoveryScreen.classList.remove('hidden');
    });
    aiDraftBtn.addEventListener('click', () => {
        choiceScreen.classList.add('hidden');
        startConversation("Все було чудово!");
    });
    manualReviewBtn.addEventListener('click', () => {
        window.open(googleReviewUrl, '_blank');
        choiceScreen.innerHTML = `<h1 class="main-title">Дякуємо!</h1><p class="subtitle">Ми відкрили сторінку відгуків Google у новій вкладці.</p>`;
    });
    requestAssistanceBtn.addEventListener('click', () => {
        alert('Перенаправлення до чату підтримки...');
    });
    scheduleCallbackBtn.addEventListener('click', () => {
        alert('Перенаправлення на сторінку планування дзвінка...');
    });
    googleReviewFallbackBtn.addEventListener('click', () => {
        window.open(googleReviewUrl, '_blank');
        recoveryScreen.innerHTML = `<h1 class="main-title">Дякуємо!</h1><p class="subtitle">Ми відкрили сторінку відгуків Google у новій вкладці.</p>`;
    });

    function updateProgressBar(step) {
        progressContainer.querySelectorAll('.progress-segment').forEach((s, i) => s.classList.toggle('active', i < step));
        progressContainer.querySelectorAll('.progress-label').forEach((l, i) => l.classList.toggle('active', i === step - 1));
    }

    function startConversation(firstMessage) {
        chatView.classList.remove('hidden');
        progressContainer.classList.remove('hidden');
        getAIResponse(firstMessage);
    }

    let conversationHistory = [];
    const placeId = 'Your_Google_Place_ID_Here';
    const googleReviewUrl = `https://search.google.com/local/writereview?placeid=${placeId}`;
    const avatarUrl = 'https://ucarecdn.com/c679e989-5032-408b-ae8a-83c7d204c67d/Vodafonebot.webp';

    function addMessage(sender, text, isHtml = false, isQuestion = false) {
        const wrapper = document.createElement('div');
        wrapper.className = `message-wrapper ${sender}`;
        if (sender === 'concierge') {
            const avatarImg = document.createElement('img');
            avatarImg.src = avatarUrl;
            avatarImg.className = 'chat-avatar';
            avatarImg.alt = 'Асистент TOBi';
            wrapper.appendChild(avatarImg);
        }
        const bubble = document.createElement('div');
        bubble.className = 'bubble';
        if (isQuestion) { bubble.classList.add('question-bubble'); }
        if (isHtml) { bubble.innerHTML = text; } else { bubble.innerText = text; }
        wrapper.appendChild(bubble);
        chatBody.prepend(wrapper);
    }

    async function getAIResponse(userMessage) {
        addMessage('user', userMessage);
        conversationHistory.push({ role: 'user', content: userMessage });
        clearQuickReplies();
        showTypingIndicator();
        try {
            const response = await fetch('/api/concierge', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: conversationHistory }),
            });
            if (!response.ok) throw new Error('Network response was not ok.');
            const data = await response.json();
            const aiMessage = data.message;
            conversationHistory.push(aiMessage);
            processAIResponse(aiMessage.content);
        } catch (error) {
            console.error("Fetch Error:", error);
            processAIResponse("Вибачте, виникла проблема. Спробуйте, будь ласка, пізніше.");
        }
    }
    
    function showTypingIndicator() {
        if (document.querySelector('.typing-indicator')) return;
        const wrapper = document.createElement('div');
        wrapper.className = 'message-wrapper concierge typing-indicator';
        wrapper.innerHTML = `<img src="${avatarUrl}" class="chat-avatar" alt="TOBi друкує"><div class="bubble"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div>`;
        chatBody.prepend(wrapper);
    }

    function removeTypingIndicator() {
        const indicator = document.querySelector('.typing-indicator');
        if (indicator) indicator.remove();
    }
    
    function processAIResponse(text) {
        removeTypingIndicator();
        if (text.includes("|")) {
            const [statement, question] = text.split('|');
            addMessage('concierge', statement, false, false);
            handleQuestion(question.trim());
        } else {
            const quoteRegex = /"(.*?)"/s;
            const matches = text.match(quoteRegex);
            if (matches && matches[1].length > 10) {
                const statementBeforeDraft = text.split('"')[0].trim();
                addMessage('concierge', statementBeforeDraft);
                createEditableDraft(matches[1]);
            } else {
                addMessage('concierge', text, false, false);
            }
        }
    }

    function handleQuestion(question) {
        addMessage('concierge', question, false, true);
        if (question.includes("мета вашого візиту")) {
            updateProgressBar(1);
            const purposeOptions = [ "📱 Новий телефон/пристрій", "🔄 Зміна/оновлення тарифу", "🔧 Технічна підтримка", "💳 Оплата рахунку", "👤 Реєстрація нового номера" ];
            createMultiSelectButtons(purposeOptions);
        } else if (question.includes("враження від обслуговування")) {
            updateProgressBar(2);
            const experienceOptions = [ "⭐ Компетентні працівники", "💨 Швидке обслуговування", "🏬 Чистота в магазині", "👍 Простий процес", "🤝 Проблему вирішено" ];
            createMultiSelectButtons(experienceOptions);
        }
    }

    function createEditableDraft(reviewText) {
        updateProgressBar(3);
        clearQuickReplies();
        const container = document.createElement('div');
        container.className = 'review-draft-container';
        const textArea = document.createElement('textarea');
        textArea.id = 'review-draft-textarea';
        textArea.className = 'review-draft-textarea';
        textArea.value = reviewText;
        container.appendChild(textArea);
        chatBody.prepend(container);
        addMessage('concierge', 'Ви можете відредагувати текст. Коли будете готові, натисніть кнопку нижче.', false, true);
        createPostButtons();
    }

    function createMultiSelectButtons(options) {
        clearQuickReplies();
        options.forEach(optionText => {
            const button = document.createElement('button');
            button.className = 'quick-reply-btn';
            button.innerText = optionText;
            button.onclick = () => { button.classList.toggle('selected'); };
            quickRepliesContainer.appendChild(button);
        });
        const continueButton = document.createElement('button');
        continueButton.className = 'quick-reply-btn continue-btn';
        continueButton.innerText = 'Далі';
        continueButton.onclick = () => {
            const selectedButtons = quickRepliesContainer.querySelectorAll('.quick-reply-btn.selected');
            const selectedKeywords = Array.from(selectedButtons).map(btn => btn.innerText);
            getAIResponse(selectedKeywords.join(', ') || "Нічого конкретного не виділено");
        };
        quickRepliesContainer.appendChild(continueButton);
    }

    // DEFINITIVE FIX: Rewritten to match the new design screenshot
    function createPostButtons() {
        clearQuickReplies();
        
        const regenerateButton = document.createElement('button');
        regenerateButton.className = 'quick-reply-btn';
        regenerateButton.innerHTML = `
            <div class="final-button-content">
                <svg class="icon-regenerate" viewBox="0 0 24 24" width="24" height="24"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"></path></svg>
                <span>Інша версія</span>
            </div>
        `;
        regenerateButton.onclick = () => {
             getAIResponse("Це не зовсім те, спробуй, будь ласка, інший варіант.", true);
        };
        
        const postButton = document.createElement('button');
        postButton.className = 'quick-reply-btn primary-action'; 
        postButton.innerHTML = `
            <div class="final-button-content column">
                <div class="main-text-with-icon">
                    <svg class="icon-checkmark" viewBox="0 0 24 24" width="24" height="24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"></path></svg>
                    <span class="button-main-text">Відкрити Google для публікації</span>
                </div>
                <span class="button-sub-text">Ваш відгук скопійовано — просто вставте та оцініть</span>
            </div>
        `;
        postButton.onclick = () => {
            const draftText = document.getElementById('review-draft-textarea').value;
            window.open(googleReviewUrl, '_blank');
            navigator.clipboard.writeText(draftText);
            clearQuickReplies();
            addMessage('concierge', "Дякуємо за ваш відгук!");
        };
        
        quickRepliesContainer.appendChild(regenerateButton);
        quickRepliesContainer.appendChild(postButton);
    }

    function clearQuickReplies() {
        quickRepliesContainer.innerHTML = '';
    }
});
