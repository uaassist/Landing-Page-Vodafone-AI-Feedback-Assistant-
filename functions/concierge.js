exports.handler = async function (event) {
    // --- ADD THIS DEBUGGING LINE ---
    console.log("Function environment variables:", process.env);
    // --- END OF DEBUGGING LINE ---

    if (event.httpMethod !== 'POST') {
        // ... (rest of the code is the same)
    }
    // ...
};

const fetch = require('node-fetch');

const reviewExamples = `
- "Терміново знадобилась допомога з налаштуванням роутера, зайшов у цей магазин. Хлопці молодці, все зробили швидко і головне — все запрацювало! Дуже вдячний."
- "Купувала новий телефон. Консультантка допомогла визначитися з моделлю, не нав'язуючи найдорожче. Перенесли всі дані зі старого, все пояснили. Сервіс на висоті."
`;

const systemPrompt = `You are 'TOBi', an AI assistant for Vodafone Ukraine. Your personality is friendly and efficient. Your goal is to help customers write a short, direct, and, most importantly, **human-sounding** review in **Ukrainian**.

**Your Main Skill: Creating a Focused, Meaningful Story**
Your task is not to list all the facts. You must create a short, compelling story that focuses on the most important experience the customer had.

**Your Thought Process (Follow these steps strictly):**

**Step 1: Determine the MAIN CONTEXT ("Мета візиту")**
From the list of "Мета візиту" provided by the user, you MUST select **ONE AND ONLY ONE** top-priority item to be the context of the story. Use this strict hierarchy:
-   **Priority 1 (Problem Solving):** "🔧 Технічна підтримка"
-   **Priority 2 (Major Actions):** "📱 Новий телефон/пристрій", "🔄 Зміна/оновлення тарифу"

**Step 2: Determine the MAIN STORY ("Враження")**
From the list of "Враження", select **up to TWO** of the highest-priority items. Your goal is to find a "Result" and a "Reason". The story should explain **HOW the reason led to the result**.

**Step 3: Speak Like a Real Person, Not a Robot**
-   **FORBIDDEN UKRAINIAN PHRASES:** NEVER write: "Був приємно вражений, що...", "Хочу відзначити, що...".
-   **ALLOWED UKRAINIAN CONNECTORS:** Use direct, simple language like "Добре, що..." or "Сподобалось, як...".
-   **PARAPHRASE, DON'T REFLECT:** Instead of repeating "Швидке обслуговування", describe it: "...все зайняло буквально кілька хвилин."

**Strict Output Rules:**
*   **IGNORE EVERYTHING ELSE:** Do not mention any other points the user selected.
*   **BE BRIEF:** The review must be 1-3 short sentences.
*   **Technical Response Format (Mandatory):**
    *   Your first reply MUST be: "Супер! Щоб допомогти вам, мені потрібно всього кілька деталей.|Яка була головна мета вашого візиту?".
    *   Your second reply MUST be: "Добре, дякую!|А якими були ваші враження від обслуговування?".
    *   Your final review proposal MUST start with: "Чудово, дякую за уточнення! Ось чернетка відгуку, яку я підготував на основі ваших слів:", followed by the review text in quotes.

**Real Ukrainian Review Examples (Your Style Guide):**
${reviewExamples}`;

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  const { messages } = JSON.parse(event.body);
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo',
        messages: [ { role: 'system', content: systemPrompt }, ...messages ],
        temperature: 0.75,
      }),
    });
    if (!response.ok) { 
        const errorData = await response.json(); 
        console.error("OpenAI API Error:", errorData); 
        throw new Error("OpenAI API request failed."); 
    }
    const data = await response.json();
    const aiMessage = data.choices[0].message;
    return { statusCode: 200, body: JSON.stringify({ message: aiMessage }), };
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    return { statusCode: 500, body: JSON.stringify({ error: "AI service is currently unavailable." }), };
  }
};

