const chatMessages = document.getElementById("chatMessages");
const chatInput = document.getElementById("chatInput");
const sendBtn = document.getElementById("sendBtn");

function getAssistantReply(question) {
    const message = question.toLowerCase();

    if (message.includes("wallet") || message.includes("connect")) {
        return "Click the Connect Wallet button and approve the connection in MetaMask.";
    }

    if (message.includes("ticket") || message.includes("buy")) {
        return "Connect your wallet, enter the number of tickets, and click Buy Tickets.";
    }

    if (message.includes("price") || message.includes("cost")) {
        return "The ticket price is displayed in the lottery section. The total depends on your ticket quantity.";
    }

    if (message.includes("winner") || message.includes("draw")) {
        return "The contract owner can draw a winner when the lottery has players.";
    }

    if (message.includes("network") || message.includes("sepolia")) {
        return "LuckyVault uses the Ethereum Sepolia test network. Make sure MetaMask is connected to Sepolia.";
    }

    if (message.includes("prize") || message.includes("pool")) {
        return "The prize pool shows the ETH available in the lottery contract.";
    }

    if (message.includes("hello") || message.includes("hi")) {
        return "Hello! Welcome to LuckyVault. Ask me about wallets, tickets, prizes, or winners.";
    }

    return "I can help with wallet connection, buying tickets, ticket prices, the prize pool, and lottery winners.";
}

function sendMessage() {
    const question = chatInput.value.trim();

    if (!question) {
        return;
    }

    const userMessage = document.createElement("p");
    userMessage.className = "user-message";
    userMessage.textContent = question;
    chatMessages.appendChild(userMessage);

    const reply = getAssistantReply(question);

    const botMessage = document.createElement("p");
    botMessage.className = "bot-message";
    botMessage.textContent = reply;
    chatMessages.appendChild(botMessage);

    chatInput.value = "";
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

sendBtn.addEventListener("click", sendMessage);

chatInput.addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        sendMessage();
    }
});