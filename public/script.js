document.addEventListener('DOMContentLoaded', () => {
    
    // --- LOGIC FOR INTERACTIVE CHAT DEMO ---
    const contentArea = document.getElementById('content-area');
    if (contentArea) {
        const welcomeScreen = document.getElementById('welcome-screen');
        const choiceScreen = document.getElementById('choice-screen');
        const chatView = document.getElementById('chat-view');
        const recoveryScreen = document.getElementById('recovery-screen');
        const chatBody = document.getElementById('chat-body');
        const quickRepliesContainer = document.getElementById('quick-replies-container');
        const progressContainer = document.getElementById('progress-container');

        const placeId = 'Your_Google_Place_ID_Here'; // IMPORTANT: Replace
        const googleReviewUrl = `https://search.google.com/local/writereview?placeid=${placeId}`;
        const avatarUrl = 'https://ucarecdn.com/c679e989-5032-408b-ae8a-83c7d204c67d/Vodafonebot.webp';
        let conversationHistory = [];

        contentArea.addEventListener('click', (event) => {
            const button = event.target.closest('button');
            if (!button) return;

            switch (button.id) {
                case 'great-btn':
                    welcomeScreen.style.display = 'none';
                    choiceScreen.classList.remove('hidden');
                    break;
                case 'okay-btn':
                case 'bad-btn':
                    welcomeScreen.style.display = 'none';
                    recoveryScreen.classList.remove('hidden');
                    break;
                case 'ai-draft-btn':
                    choiceScreen.style.display = 'none';
                    startConversation("Все було чудово!");
                    break;
                case 'manual-review-btn':
                case 'google-review-fallback-btn':
                    window.open(googleReviewUrl, '_blank');
                    contentArea.innerHTML = `<div style="text-align: center; padding: 40px;"><h2 style="color: #1F2937;">Дякуємо!</h2><p style="color: #6B7280;">Ми відкрили сторінку відгуків Google у новій вкладці.</p></div>`;
                    break;
                case 'request-assistance-btn':
                    alert('Перенаправлення до чату підтримки...');
                    break;
                case 'schedule-callback-btn':
                    alert('Перенаправлення на сторінку планування дзвінка...');
                    break;
            }
        });

        function updateProgressBar(step) {
            const segments = progressContainer.querySelectorAll('.progress-segment');
            segments.forEach((segment, index) => {
                segment.classList.toggle('active', index < step);
            });
            const labels = progressContainer.querySelectorAll('.progress-label');
            labels.forEach((label, index) => {
                label.classList.toggle('active', index === step - 1);
            });
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

            // This is a MOCK response for demo purposes.
            // Replace this with the real fetch call in production.
            setTimeout(() => {
                removeTypingIndicator();
                let aiResponseText;
                if (conversationHistory.length <= 2) {
                    aiResponseText = "Супер! Щоб допомогти вам, мені потрібно всього кілька деталей.|Яка була головна мета вашого візиту?";
                } else if (conversationHistory.length <= 4) {
                    aiResponseText = "Добре, дякую!|А якими були ваші враження від обслуговування?";
                } else {
                    aiResponseText = `Чудово, дякую за уточнення! Ось чернетка відгуку, яку я підготував на основі ваших слів: "Відмінний сервіс! Дуже допомогли з налаштуваннями телефону. Персонал компетентний, все зробили швидко. Рекомендую цей магазин Vodafone!"`;
                }
                processAIResponse(aiResponseText);
            }, 1200);
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
            if (text.includes("|")) {
                const [statement, question] = text.split('|');
                addMessage('concierge', statement.trim());
                handleFinalQuestion(question.trim());
            } else {
                const quoteRegex = /"(.*?)"/s;
                const matches = text.match(quoteRegex);
                if (matches && matches[1].length > 10) {
                    const statementBeforeDraft = text.split('"')[0].trim();
                    addMessage('concierge', statementBeforeDraft);
                    createEditableDraft(matches[1]);
                } else {
                    addMessage('concierge', text.trim());
                }
            }
        }

        function handleFinalQuestion(question) {
            addMessage('concierge', question, false, true);
            if (question.includes("мета вашого візиту")) {
                updateProgressBar(1);
                createMultiSelectButtons(["📱 Новий телефон/пристрій", "🔄 Зміна/оновлення тарифу", "🔧 Технічна підтримка"]);
            } else if (question.includes("враження від обслуговування")) {
                updateProgressBar(2);
                createMultiSelectButtons(["⭐ Компетентні працівники", "💨 Швидке обслуговування", "🤝 Проблему вирішено"]);
            }
        }

        function createEditableDraft(reviewText) {
            updateProgressBar(3);
            clearQuickReplies();
            const container = document.createElement('div');
            container.className = 'review-draft-container';
            container.innerHTML = `<textarea class="review-draft-textarea">${reviewText}</textarea>`;
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
                const combinedMessage = selectedKeywords.length > 0 ? selectedKeywords.join(', ') : "Нічого конкретного не виділено";
                getAIResponse(combinedMessage);
            };
            quickRepliesContainer.appendChild(continueButton);
        }

        function createPostButtons() {
            clearQuickReplies();
            const postButton = document.createElement('button');
            postButton.className = 'choice-button';
            postButton.style.textAlign = 'left';
            postButton.innerHTML = `<div class="button-main-text">✅ Відкрити Google для публікації</div><div class="button-sub-text">Ваш відгук скопійовано — просто вставте та оцініть</div>`;
            postButton.onclick = () => {
                const draftText = document.querySelector('.review-draft-textarea').value;
                navigator.clipboard.writeText(draftText);
                window.open(googleReviewUrl, '_blank');
                clearQuickReplies();
                addMessage('concierge', "Дякуємо за ваш відгук!");
            };
            const regenerateButton = document.createElement('button');
            regenerateButton.className = 'quick-reply-btn';
            regenerateButton.innerText = '🔄 Інша версія';
            regenerateButton.onclick = () => {
                 getAIResponse("Це не зовсім те, спробуй, будь ласка, інший варіант.");
            };
            quickRepliesContainer.appendChild(regenerateButton);
            quickRepliesContainer.appendChild(postButton);
        }

        function clearQuickReplies() {
            quickRepliesContainer.innerHTML = '';
        }
    }

    // --- LOGIC FOR MAIN PAGE SCROLLING & ANIMATIONS ---
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const target = document.querySelector(targetId);
            if (target) {
                const headerOffset = 80; // height of the sticky header
                const elementPosition = target.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
            }
        });
    });

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.problem-card, .feature-item, .timeline-item').forEach(el => {
        observer.observe(el);
    });
});
