import { BotDefinition } from '@botpress/sdk'
import webchat from './bp_modules/webchat'
import openai from './bp_modules/openai'

export default new BotDefinition({})
  .addIntegration(webchat, { enabled: true })
  .addIntegration(openai, { enabled: true })
