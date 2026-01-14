let conversationHistory = [];

const container = document.querySelector('.container');
const sendButton = document.getElementById('sendButton');

const reasoningData = new Map();

function autoResize(el) {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
    
    window.scrollTo(0, scrollTop);
}

function getLastField() {
    const children = container.children;
    return children.length > 1 ? children[children.length - 2] : null;
}

function createTextArea(isInput = true, isReasoning = false) {
    const textArea = document.createElement('textarea');
    
    textArea.classList.add('block');
    textArea.setAttribute('rows', '1');
    
    if (isReasoning) {
        textArea.classList.add('reasoning');
        textArea.setAttribute('readonly', 'true');
        textArea.setAttribute('placeholder', 'Model reasoning...');
    } else if (isInput) {
        textArea.setAttribute('placeholder', 'Enter message ...');
        textArea.addEventListener('input', () => autoResize(textArea));
    } else {
        textArea.setAttribute('readonly', 'true');
        textArea.setAttribute('placeholder', 'Processing request, please wait...');
    }
    
    if (sendButton) {
        container.insertBefore(textArea, sendButton);
    }
    return textArea;
}

function createReasoningContainer(responseId) {
    const reasoningId = `reasoning-${responseId || Date.now()}`;
    
    const reasoningContainer = document.createElement('div');
    reasoningContainer.className = 'reasoning-container';
    reasoningContainer.id = reasoningId;
    
    const header = document.createElement('div');
    header.className = 'reasoning-header';
    
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'reasoning-toggle';
    toggleBtn.innerHTML = '▼';
    toggleBtn.setAttribute('aria-label', 'Collapse/expand model reasoning');
    toggleBtn.setAttribute('data-reasoning-id', reasoningId);
    
    const title = document.createElement('span');
    title.className = 'reasoning-title';
    title.textContent = 'Model Reasoning';
    
    const charCount = document.createElement('span');
    charCount.className = 'reasoning-charcount';
    charCount.textContent = ' (0 characters)';
    
    title.appendChild(charCount);
    header.appendChild(toggleBtn);
    header.appendChild(title);
    
    const textArea = document.createElement('textarea');
    textArea.className = 'block reasoning-content';
    textArea.setAttribute('rows', '3');
    textArea.setAttribute('readonly', 'true');
    textArea.setAttribute('placeholder', 'Model is thinking...');
    textArea.setAttribute('data-reasoning-id', reasoningId);
    
    reasoningContainer.appendChild(header);
    reasoningContainer.appendChild(textArea);
    
    reasoningData.set(reasoningId, {
        content: '',
        isCollapsed: false,
        textArea: textArea,
        charCount: charCount
    });
    
    toggleBtn.addEventListener('click', () => {
        const data = reasoningData.get(reasoningId);
        if (!data) return;
        
        data.isCollapsed = !data.isCollapsed;
        textArea.style.display = data.isCollapsed ? 'none' : 'block';
        toggleBtn.innerHTML = data.isCollapsed ? '▶' : '▼';
        
        if (!data.isCollapsed) {
            setTimeout(() => autoResize(textArea), 10);
        }
        
        reasoningData.set(reasoningId, data);
    });
    
    return { 
        container: reasoningContainer, 
        textArea: textArea,
        id: reasoningId
    };
}

function updateReasoning(reasoningId, content) {
    const data = reasoningData.get(reasoningId);
    if (!data) return;
    
    data.content = content;
    data.textArea.value = content;
    
    if (data.charCount) {
        data.charCount.textContent = ` (${content.length} characters)`;
    }
    
    if (data.isCollapsed) {
        data.isCollapsed = false;
        data.textArea.style.display = 'block';
        
        const toggleBtn = data.textArea.parentElement?.querySelector('.reasoning-toggle');
        if (toggleBtn) {
            toggleBtn.innerHTML = '▼';
        }
    }
    
    autoResize(data.textArea);
    
    reasoningData.set(reasoningId, data);
}

function createNewInputTextArea() {
    return createTextArea(true, false);
}

function createNewResponseTextArea() {
    return createTextArea(false, false);
}

function extractThinkTags(content) {
    const thinkPattern = /<think>(.*?)<\/think>/gis;
    const matches = [];
    let cleanContent = content;
    let match;
    
    while ((match = thinkPattern.exec(content)) !== null) {
        matches.push(match[1].trim());
        cleanContent = cleanContent.replace(match[0], '');
    }
    
    return {
        reasoning: matches.join('\n\n'),
        answer: cleanContent.trim()
    };
}

async function sendRequestToLMStudio(prompt) {
    conversationHistory.push({ role: "user", content: prompt });
    
    const apiUrl = 'http://localhost:5517/v1/chat/completions';
    const modelData = {
        model: "qwen2.5-coder-14b-instruct",
        messages: conversationHistory,
        max_tokens: 5000,
        temperature: 0.7,
        stream: true
    };

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(modelData)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || errorData.detail || 'Network response was not ok');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let completeResponse = '';
        const lastField = getLastField();
        
        const requestId = Date.now();
        let currentReasoningId = null;
        let reasoningContent = '';

        while (true) {
            const { done, value } = await reader.read();
            
            if (done) break;
            
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n\n')
                .filter(line => line.startsWith('data: '))
                .map(line => line.slice(6).trim())
                .filter(line => line && line !== '[DONE]');

            for (const line of lines) {
                try {
                    const jsonData = JSON.parse(line);
                    if (jsonData.choices?.[0]?.delta?.content) {
                        let content = jsonData.choices[0].delta.content;
                        
                        const thinkPattern = /<think>(.*?)<\/think>/gis;
                        
                        if (thinkPattern.test(content)) {
                            if (!currentReasoningId) {
                                const reasoningContainer = createReasoningContainer(requestId);
                                currentReasoningId = reasoningContainer.id;
                                
                                if (lastField && sendButton) {
                                    container.insertBefore(reasoningContainer.container, lastField.nextElementSibling);
                                }
                            }
                            
                            thinkPattern.lastIndex = 0;
                            let match;
                            while ((match = thinkPattern.exec(content)) !== null) {
                                reasoningContent += match[1].trim() + '\n\n';
                            }
                            
                            if (currentReasoningId) {
                                updateReasoning(currentReasoningId, reasoningContent.trim());
                            }
                            
                            content = content.replace(thinkPattern, '');
                        }
                        
                        completeResponse += content;
                        
                        if (lastField && content.trim()) {
                            lastField.value = completeResponse.trim();
                            autoResize(lastField);
                        }
                    }
                } catch (e) {
                    console.warn('Failed to parse JSON:', line);
                }
            }
        }

        const { reasoning, answer } = extractThinkTags(completeResponse);
        
        if (reasoning && !currentReasoningId) {
            const reasoningContainer = createReasoningContainer(requestId);
            currentReasoningId = reasoningContainer.id;
            updateReasoning(currentReasoningId, reasoning);
            
            if (lastField && sendButton) {
                container.insertBefore(reasoningContainer.container, lastField.nextElementSibling);
            }
        }
        
        conversationHistory.push({ 
            role: "assistant", 
            content: answer || completeResponse.trim() 
        });
        
        if (lastField) {
            lastField.value = answer || completeResponse.trim();
            autoResize(lastField);
        }
        
        sendButton.disabled = false;
        createNewInputTextArea();
    } catch (error) {
        console.error('Error receiving response:', error);
        const lastField = getLastField();
        if (lastField) {
            lastField.value = error.message.startsWith('Network') 
                ? 'Communication error with AI model.'
                : `Server error: ${error.message}`;
            autoResize(lastField);
        }
        sendButton.disabled = false;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (sendButton) {
        sendButton.addEventListener('click', async () => {
            const lastField = getLastField();
            const userInput = lastField?.value?.trim();
            
            if (!userInput) {
                alert("Please enter a message.");
                return;
            }
            
            lastField.setAttribute('readonly', 'true');
            sendButton.disabled = true;
            createNewResponseTextArea();
            autoResize(getLastField());
            
            await sendRequestToLMStudio(userInput);
        });
    }
    
    const initialTextarea = container.querySelector('textarea');
    if (initialTextarea) {
        initialTextarea.addEventListener('input', () => autoResize(initialTextarea));
    }
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            const activeElement = document.activeElement;
            if (activeElement.tagName === 'TEXTAREA' && 
                !activeElement.classList.contains('reasoning-content') &&
                sendButton && !sendButton.disabled) {
                e.preventDefault();
                sendButton.click();
            }
        }
    });
});
