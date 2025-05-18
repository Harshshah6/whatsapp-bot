const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const ollama = require('ollama').default;

const client = new Client(
    {
        authStrategy: new (require('whatsapp-web.js').LocalAuth)({
            clientId: 'client-one',
        }),
    }
);

let chatModel = 'mistral:latest';
const chatModels = [
    'mistral:latest',
    "deepseek-coder-v2:latest",
    "deepseek-r1:32b",
];

client.on('ready', () => {
    console.log('Client is ready!');
});

client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
});

client.on('message_create', async message => {
    console.log(message);

    if (message.body === '!ping') {
        // reply back "pong" directly to the message
        const reply = await message.reply('pong');
    } else if (message.body.startsWith('!ask')) {
        const question = message.body.slice(5); // Remove the '!ask ' part
        try {
            const response = await ollama.chat({
                model: chatModel,
                messages: [{ role: 'user', content: question }],
            });
            await message.reply(response.message.content);
        } catch (error) {
            console.error('Error:', error);
            await message.reply('Sorry, I could not process your request.');
        }
    } else if (message.body.startsWith('!setmodel')) {
        const newModel = message.body.split(' ')[1];
        if (chatModels.includes(newModel)) {
            chatModel = newModel;
            await message.reply(`Model changed to ${newModel}`);
        } else {
            await message.reply(`Invalid model. Available models: ${chatModels.join(', ')}`);
        }
    } else if (message.body.startsWith('!models')) {
        const availableModels = chatModels.join(', ');
        await message.reply(`Available models: ${availableModels}`);
    } else if (message.body.startsWith('!whichmodel')) {
        await message.reply(`Current model: ${chatModel}`);
    } else if (message.body.startsWith('!help')) {
        const helpMessage = `
Available commands:\n
*!ping* - Check if the bot is alive
*!ask* <question> - Ask a question to the model
*!setmodel* <model_name> - \n\n - ${chatModels.join('\n - ')}\n\n
*!models* - List available models
*!help* - Show this help message
*!whichmodel* - Show the current model
`;
        await message.reply(helpMessage);
    }
});


client.initialize();
