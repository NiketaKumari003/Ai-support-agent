// utils/openaiClient.js
// Real OpenAI client used by the chat route.

const OpenAI = require('openai')

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

/**
 * Call OpenAI chat completion API and return the assistant message text.
 *
 * @param {string} systemPrompt
 * @param {string} userPrompt
 * @param {number} maxTokens
 * @param {number} temperature
 * @returns {Promise<string>}
 */
async function generateChatResponse(systemPrompt, userPrompt, maxTokens = 800, temperature = 0) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not set')
  }

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    max_tokens: maxTokens,
    temperature,
  })

  const choice = response.choices && response.choices[0]
  const content = choice && choice.message && choice.message.content
  if (!content) {
    throw new Error('No content returned from OpenAI')
  }
  return content
}

module.exports = { generateChatResponse }

