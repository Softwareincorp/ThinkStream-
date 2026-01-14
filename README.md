# ThinkStream — A Simple Web Interface for Local LLMs

ThinkStream is a tool for communicating with language models running via LM Studio or Ollama within your local network. It detects and displays the model's "reasoning" process, if provided.

<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/81a4c70e-c7c3-4924-b4bf-a18b5b635186" />


## ✨ Features

| Feature | Description |
|---------|-------------|
| **💭 Model Thinking Visualization** | Automatically displays reasoning in real-time within separate collapsible blocks. Expand to see how the model arrived at its answer. |
| **⚡ Real-Time Interaction** | Responses are delivered via streaming—no waiting for the complete answer. |
| **🔒 Local & Private** | Everything runs inside your network. Your data never leaves your system, even with sensitive information. |
| **🎨 Minimalist Design** | Clean interface without unnecessary elements, auto-scaling input fields, smooth animations, and adaptive layout. |

---

## 🚀 Quick Start

### 1. Load a Model
Load your preferred model in LM Studio or Ollama.

![ThinkStream Demo](https://github.com/user-attachments/assets/31d9c032-c5db-47f2-aab1-428cfb5a4dee)

### 2. Start a Local Server
Start a server on port **5517** (or another port) and copy the address.

![Server Setup](https://github.com/user-attachments/assets/040aacb0-f05e-4072-993d-3a15bf295d9f)

### 3. Configure Settings
Verify your connection settings in the ThinkStream interface.

![Settings Panel](https://github.com/user-attachments/assets/e20a794d-b87f-457b-ad33-e1a38a61b2ea)

### 4. Open ThinkStream
Open `index.html` in your browser.

### 5. Start Chatting
Type your query as in a regular chat and enjoy real-time interaction with your local LLM!

---

## 📋 Requirements
- A local LLM server (LM Studio or Ollama) running on your network
- Modern web browser (Chrome, Firefox, Edge, Safari)
- Local web server for serving the interface (optional but recommended)

---

## 🔧 Technical Details
- **Protocol**: Compatible with LM Studio's and Ollama's local API endpoints
- **Streaming**: Uses Server-Sent Events (SSE) for real-time responses
- **Reasoning Detection**: Automatically parses and displays model reasoning when available
- **Responsive Design**: Works on desktop and tablet devices

---

## 🤝 Contributing
Found a bug or have a suggestion? Feel free to open an issue or submit a pull request!

---

## 📄 License
This project is provided for personal and educational use. See LICENSE file for details.

---
**🔒 Privacy Note**: All processing happens locally—your conversations never leave your machine.
