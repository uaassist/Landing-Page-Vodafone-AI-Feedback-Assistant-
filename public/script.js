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
            // Mock AI response for demo purposes without needing an API key
            // In a real scenario, you would call getAIResponse(firstMessage);
            mockAIResponse(firstMessage);
        }

        function addMessage(sender, text) {
            const wrapper = document.createElement('div');
            wrapper.className = `message-wrapper ${sender}`;
            if (sender === 'concierge') {
                wrapper.innerHTML = `<img src="${avatarUrl}" class="chat-avatar" alt="TOBi">`;
            }
            const bubble = document.createElement('div');
            bubble.className = 'bubble';
            bubble.textContent = text;
            wrapper.appendChild(bubble);
            chatBody.prepend(wrapper);
        }
        
        function mockAIResponse(userMessage) {
            addMessage('user', userMessage);
            clearQuickReplies();
            showTypingIndicator();
            
            setTimeout(() => {
                removeTypingIndicator();
                if (conversationHistory.length === 0) {
                     conversationHistory.push({role: 'user', content: userMessage});
                     const statement = "Супер! Щоб допомогти вам, мені потрібно всього кілька деталей.";
                     const question = "Яка була головна мета вашого візиту?";
                     addMessage('concierge', statement);
                     handleQuestion(question);
                } else if (conversationHistory.length === 2) {
                     conversationHistory.push({role: 'user', content: userMessage});
                     const statement = "Добре, дякую!";
                     const question = "А якими були ваші враження від обслуговування?";
                     addMessage('concierge', statement);
                     handleQuestion(question);
                } else {
                     const statement = "Чудово, дякую за уточнення! Ось чернетка відгуку, яку я підготував на основі ваших слів:";
                     const draft = '"Відмінний сервіс! Дуже допомогли з налаштуваннями телефону. Персонал компетентний, все зробили швидко. Рекомендую цей магазин Vodafone!"';
                     addMessage('concierge', statement);
                     createEditableDraft(draft);
                }
            }, 1200);
        }

        function handleQuestion(question) {
            const wrapper = document.createElement('div');
            wrapper.className = 'message-wrapper concierge';
            wrapper.innerHTML = `<img src="${avatarUrl}" class="chat-avatar" alt="TOBi"><div class="bubble question-bubble">${question}</div>`;
            chatBody.prepend(wrapper);

            if (question.includes("мета")) {
                updateProgressBar(1);
                createMultiSelectButtons(["📱 Новий телефон/пристрій", "🔄 Зміна/оновлення тарифу", "🔧 Технічна підтримка"]);
            } else if (question.includes("враження")) {
                updateProgressBar(2);
                createMultiSelectButtons(["⭐ Компетентні працівники", "💨 Швидке обслуговування", "🤝 Проблему вирішено"]);
            }
        }

        function createEditableDraft(reviewText) {
            updateProgressBar(3);
            const container = document.createElement('div');
            container.className = 'review-draft-container'; // A custom class for the draft container
            container.style.cssText = "background-color: #fff; border: 1px solid #E5E7EB; border-radius: 12px; padding: 16px; margin-bottom: 12px;";
            container.innerHTML = `<textarea style="width: 100%; height: 120px; border: none; background: transparent; font-family: 'Inter', sans-serif; font-size: 16px; resize: none; outline: none;">${reviewText.replace(/"/g, '')}</textarea>`;
            chatBody.prepend(container);
            createPostButtons();
        }

        function createMultiSelectButtons(options) {
            options.forEach(option => {
                const button = document.createElement('button');
                button.className = 'quick-reply-btn';
                button.textContent = option;
                button.onclick = () => button.classList.toggle('selected');
                quickRepliesContainer.appendChild(button);
            });
            const continueButton = document.createElement('button');
            continueButton.className = 'continue-btn quick-reply-btn';
            continueButton.textContent = 'Далі';
            continueButton.onclick = () => {
                const selected = Array.from(quickRepliesContainer.querySelectorAll('.selected')).map(btn => btn.textContent);
                mockAIResponse(selected.join(', ') || "Нічого не обрано");
            };
            quickRepliesContainer.appendChild(continueButton);
        }

        function createPostButtons() {
            const postButton = document.createElement('button');
            postButton.className = 'choice-button';
            postButton.style.textAlign = 'left';
            postButton.innerHTML = `<div class="button-main-text">✅ Відкрити Google для публікації</div><div class="button-sub-text">Ваш відгук скопійовано</div>`;
            postButton.onclick = () => {
                window.open(googleReviewUrl, '_blank');
                clearQuickReplies();
                addMessage('concierge', "Дякуємо за ваш відгук!");
            };
            quickRepliesContainer.appendChild(postButton);
        }

        function showTypingIndicator() {
            const indicator = `<div class="message-wrapper concierge typing-indicator"><img src="${avatarUrl}" class="chat-avatar" alt="..."><div class="bubble"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div></div>`;
            chatBody.insertAdjacentHTML('afterbegin', indicator);
        }

        function removeTypingIndicator() {
            const indicator = document.querySelector('.typing-indicator');
            if (indicator) indicator.remove();
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

    document.querySelectorAll('.problem-card, .feature-item, .roi-card, .timeline-item').forEach(el => {
        observer.observe(el);
    });
});
