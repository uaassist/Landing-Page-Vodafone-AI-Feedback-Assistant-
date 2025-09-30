document.addEventListener('DOMContentLoaded', () => {
    const contentArea = document.getElementById('content-area');
    const welcomeScreen = document.getElementById('welcome-screen');
    const choiceScreen = document.getElementById('choice-screen');
    const chatView = document.getElementById('chat-view');
    const recoveryScreen = document.getElementById('recovery-screen');
    const chatBody = document.getElementById('chat-body');
    const quickRepliesContainer = document.getElementById('quick-replies-container');
    const progressContainer = document.getElementById('progress-container');

    const placeId = 'Your_Google_Place_ID_Here'; // IMPORTANT: Replace with actual Place ID
    const googleReviewUrl = `https://search.google.com/local/writereview?placeid=${placeId}`;
    const avatarUrl = 'https://ucarecdn.com/c679e989-5032-408b-ae8a-83c7d204c67d/Vodafonebot.webp';
    let conversationHistory = [];

    contentArea.addEventListener('click', (event) => {
        const button = event.target.closest('button');
        if (!button) return;

        switch (button.id) {
            case 'great-btn':
                welcomeScreen.classList.add('hidden');
                choiceScreen.classList.remove('hidden');
                break;
            case 'okay-btn':
            case 'bad-btn':
                welcomeScreen.classList.add('hidden');
                recoveryScreen.classList.remove('hidden');
                break;
            case 'ai-draft-btn':
                choiceScreen.classList.add('hidden');
                startConversation("Все було чудово!");
                break;
            case 'manual-review-btn':
            case 'google-review-fallback-btn':
                window.open(googleReviewUrl, '_blank');
                contentArea.innerHTML = `<div style="text-align: center; padding: 40px;"><h2 style="color: #1F2937;">Дякуємо!</h2><p style="color: #6B7280;">Ми відкрили сторінку відгуків Google у новій вкладці.</p></div>`;
                break;
        }
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

    function addMessage(sender, text, isHtml = false, isQuestion = false) {
        const wrapper = document.createElement('div');
        wrapper.className = `message-wrapper ${sender}`;
        if (sender === 'concierge') {
            wrapper.innerHTML = `<img src="${avatarUrl}" class="chat-avatar" alt="TOBi">`;
        }
        const bubble = document.createElement('div');
        bubble.className = 'bubble';
        if (isQuestion) bubble.classList.add('question-bubble');
        bubble.innerHTML = isHtml ? text : text;
        wrapper.appendChild(bubble);
        chatBody.prepend(wrapper);
    }

    async function getAIResponse(userMessage) {
        if (userMessage) {
            addMessage('user', userMessage);
            conversationHistory.push({ role: 'user', content: userMessage });
        }
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
            removeTypingIndicator();
            processAIResponse(aiMessage.content);
        } catch (error) {
            removeTypingIndicator();
            addMessage('concierge', "Вибачте, виникла проблема. Спробуйте пізніше.");
        }
    }
    
    function showTypingIndicator() {
        if (document.querySelector('.typing-indicator')) return;
        const indicator = `<div class="message-wrapper concierge typing-indicator"><img src="${avatarUrl}" class="chat-avatar" alt="..."><div class="bubble"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div></div>`;
        chatBody.insertAdjacentHTML('afterbegin', indicator);
    }

    function removeTypingIndicator() {
        const indicator = document.querySelector('.typing-indicator');
        if (indicator) indicator.remove();
    }
    
    function processAIResponse(text) {
        if (text.includes("|")) {
            const [statement, question] = text.split('|');
            addMessage('concierge', statement.trim());
            handleQuestion(question.trim());
        } else if (text.includes("Ось чернетка відгуку")) {
            const statement = text.split('"')[0].trim();
            const draft = text.match(/"(.*?)"/s)[1];
            addMessage('concierge', statement);
            createEditableDraft(draft);
        } else {
            addMessage('concierge', text);
        }
    }

    function handleQuestion(question) {
        addMessage('concierge', question, false, true);
        if (question.includes("мета вашого візиту")) {
            updateProgressBar(1);
            createMultiSelectButtons(["📱 Новий телефон/пристрій", "🔄 Зміна/оновлення тарифу", "🔧 Технічна підтримка", "💳 Оплата рахунку"]);
        } else if (question.includes("враження від обслуговування")) {
            updateProgressBar(2);
            createMultiSelectButtons(["⭐ Компетентні працівники", "💨 Швидке обслуговування", "👍 Простий процес", "🤝 Проблему вирішено"]);
        }
    }
    
    function createEditableDraft(reviewText) {
        updateProgressBar(3);
        const container = document.createElement('div');
        container.className = 'review-draft-container';
        container.innerHTML = `<textarea id="review-draft-textarea" class="review-draft-textarea">${reviewText}</textarea>`;
        chatBody.prepend(container);
        addMessage('concierge', 'Ви можете відредагувати текст. Коли будете готові, натисніть кнопку нижче.', false, true);
        createPostButtons();
    }

    function createMultiSelectButtons(options) {
        options.forEach(option => {
            const button = document.createElement('button');
            button.className = 'quick-reply-btn';
            button.innerText = option;
            button.onclick = () => button.classList.toggle('selected');
            quickRepliesContainer.appendChild(button);
        });
        const continueButton = document.createElement('button');
        continueButton.className = 'quick-reply-btn continue-btn';
        continueButton.innerText = 'Далі';
        continueButton.onclick = () => {
            const selected = Array.from(quickRepliesContainer.querySelectorAll('.selected')).map(btn => btn.innerText);
            getAIResponse(selected.join(', ') || "Нічого не обрано");
        };
        quickRepliesContainer.appendChild(continueButton);
    }

    function createPostButtons() {
        const postButton = document.createElement('button');
        postButton.className = 'quick-reply-btn choice-button';
        postButton.innerHTML = `<div class="button-main-text">✅ Відкрити Google для публікації</div><div class="button-sub-text">Ваш відгук скопійовано</div>`;
        postButton.onclick = () => {
            const draftText = document.getElementById('review-draft-textarea').value;
            navigator.clipboard.writeText(draftText);
            window.open(googleReviewUrl, '_blank');
            clearQuickReplies();
            addMessage('concierge', "Дякуємо за ваш відгук!");
        };
        quickRepliesContainer.appendChild(postButton);
    }

    function clearQuickReplies() {
        quickRepliesContainer.innerHTML = '';
    }
});