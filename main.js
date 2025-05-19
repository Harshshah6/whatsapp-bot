const { Client } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const ollama = require("ollama").default;

const client = new Client({
    authStrategy: new (require("whatsapp-web.js").LocalAuth)({
        clientId: "client-one",
    }),
});

let chatModel = "mistral:latest";
const chatModels = [
    "mistral:latest",
    "deepseek-coder-v2:latest",
    "deepseek-r1:32b",
];

client.on("ready", () => {
    console.log("Client is ready!");
});

client.on("qr", (qr) => {
    qrcode.generate(qr, { small: true });
});

const chatHistories = {};
const MAX_CONTEXT_MESSAGES = 10;

client.on("message_create", async (message) => {
    console.log(message);

    const chatId = message.from;

    if (!chatHistories[chatId]) {
        chatHistories[chatId] = [];
    }

    if (message.body === "!ping") {
        const reply = await message.reply("pong");
    } else if (message.body.startsWith("!ask")) {
        const question = message.body.slice(5);

        chatHistories[chatId].push({ role: "user", content: question });

        if (chatHistories[chatId].length > MAX_CONTEXT_MESSAGES) {
            chatHistories[chatId] = chatHistories[chatId].slice(
                -MAX_CONTEXT_MESSAGES
            );
        }

        try {
            const response = await ollama.chat({
                model: chatModel,
                messages: chatHistories[chatId],
            });

            chatHistories[chatId].push({
                role: "assistant",
                content: response.message.content,
            });

            if (chatHistories[chatId].length > MAX_CONTEXT_MESSAGES) {
                chatHistories[chatId] = chatHistories[chatId].slice(
                    -MAX_CONTEXT_MESSAGES
                );
            }

            await message.reply(response.message.content);
        } catch (error) {
            console.error("Error:", error);
            await message.reply("Sorry, I could not process your request.");
        }
    } else if (message.body.startsWith("!setmodel")) {
        const newModel = message.body.split(" ")[1];
        if (chatModels.includes(newModel)) {
            chatModel = newModel;
            await message.reply(`Model changed to ${newModel}`);
        } else {
            await message.reply(
                `Invalid model. Available models: ${chatModels.join(", ")}`
            );
        }
    } else if (message.body.startsWith("!models")) {
        const availableModels = chatModels.join(", ");
        const n = await ollama.list();
        await message.reply(`Available models: \n - ${n.models.map((m) => m.name).join("\n - ")}`);
    } else if (message.body.startsWith("!whichmodel")) {
        await message.reply(`Current model: ${chatModel}`);
    } else if (message.body === "!clearcontext") {
        chatHistories[chatId] = [];
        await message.reply("Context cleared for this chat.");
    } else if (message.body.startsWith("!help")) {
        const helpMessage = `
Available commands:\n
*!ping* - Check if the bot is alive
*!ask* <question> - Ask a question to the model
*!setmodel* <model_name> - \n\n - ${chatModels.join("\n - ")}\n\n
*!models* - List available models
*!help* - Show this help message
*!whichmodel* - Show the current model
*!clearcontext* - Clear the conversation context for this chat
`;
        await message.reply(helpMessage);
    }
    // else if (message.body.startsWith("!loop")) {
    //     await message.reply("!loop'");
    // }
});

client.initialize();
