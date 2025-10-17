const schedule = require('node-schedule')
const express = require('express')
const { Client, GatewayIntentBits } = require('discord.js')

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}

const constants = require('./constants')
const { loadMembers } = require('./members')

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,           // lets the bot connect to servers
    GatewayIntentBits.GuildMessages,    // receive message events from servers
    GatewayIntentBits.MessageContent    // lets the bot read message text
  ]
})

let members = loadMembers()
const projectEnd = new Date('Dec 5, 2025 23:59:59') // End of Term - Dec 5th, 2025 (TBD)
let channel = undefined

client.on('clientReady', () => {
  console.log(`Logged in as ${client.user.tag}!`)
  channel = client.channels.cache.get(process.env.BOT_RESIDING_CHANNEL_ID)
  job(channel)
})

client.on('messageCreate', msg => {
  const message = msg.content.toLowerCase()

  const membersData = JSON.parse(process.env.MEMBERS || '{}')
  const totalMembers = Object.values(membersData).length

  if (message.includes('yesterday') && message.includes('today')) {
    if (members.has(msg.author.id)) {
      msg
        .react(constants.emojis.SUCCESS)
        .then(() => {
          members.delete(msg.author.id)
          if (members.size === 0) {
            channel.send('Thank you everyone for participating in today\'s daily standup!')
          } else {
            channel.send(`${members.size} / ${totalMembers} left.`)          }
        })
        .catch(e => console.error(e))
    }
  }
})

const job = channel =>
  schedule.scheduleJob('00 00 17 * * 1-5', () => { // Render runs in UTC (7 hrs ahead of local time) => triggers at 10:00AM local (17:00 UTC) Mon–Fri
    resetMembers()

    let current = new Date()
    const currentStr = current.toString()
    const lineLength = Math.max(currentStr.length, 60)
    const line = '='.repeat(currentStr.length)
    current.setHours(current.getHours() - constants.TIME_DIFF) // time diff between Render and local time

    const message = [
      line,
      currentStr.padStart((lineLength + currentStr.length) / 2).padEnd(lineLength),
      line,
      '',
      'Good morning @everyone!',
      'Please reply to this message with:',
      '• what you did *yesterday*',
      '• what you will do *today*',
      '• any *blockers* you are dealing with',
      '',
  ].join('\n')

    if (current.getTime() < projectEnd.getTime()) {
      channel.send(message)
    }
  })

function resetMembers () {
  members.clear()      // empty current Set
  const newMembers = loadMembers()
  for (const id of newMembers) {
    members.add(id)
  }
}

client.login(process.env.BOT_TOKEN)

// ----------------------------
// Express keep-alive server
// Keeps Render from idling the bot after 15 minutes of inactivity
// ----------------------------
const app = express()

app.get('/', (req, res) => {
  res.send('Discord bot is running and awake!')
})

// Render sets PORT automatically
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Keep-alive web server listening on port ${PORT}`)
})