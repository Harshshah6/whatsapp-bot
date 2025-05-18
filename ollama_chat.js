const ollama = require('ollama')

async function main() {
    const response = await ollama.default.chat({
        model: 'mistral:latest',
        messages: [{ role: 'user', content: 'Why is the sky blue?' }],
    })
    console.log(response.message.content)
}
main()