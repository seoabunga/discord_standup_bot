const constants = require('./constants')
const schedule = require('node-schedule')
const Discord = require('discord.js')
const client = new Discord.Client()

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}

let members = new Set()
const projectEnd = new Date('Dec 5, 2025 23:59:59') // End of Term - Dec 5th, 2025 (TBD)
let channel = undefined

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`)
  channel = client.channels.cache.get(process.env.BOT_RESIDING_CHANNEL_ID)
  job(channel)
})

client.on('messageCreate', msg => {
  const message = msg.content.toLowerCase()
  if (message.includes('yesterday') && message.includes('today')) {
    if (members.has(msg.author.id)) {
      msg
        .react(constants.emojis.SUCCESS)
        .then(() => {
          members.delete(msg.author.id)
          if (members.size === 0) {
            channel.send('Thank you everyone for participating in today\'s daily standup!')
          } else {
            channel.send(`${members.size} / ${Object.values(constants.members).length} left.`)
          }
        })
        .catch(e => console.error(e))
    }
  }
})

const job = channel =>
  schedule.scheduleJob(new Date(Date.now() + 1*60*1000), () => {
  // schedule.scheduleJob('00 00 17 * * 1-5', () => { // Render runs in UTC (7 hrs ahead of local time) => triggers at 10:00AM local (17:00 UTC) Mon–Fri
    resetMembers()

    let current = new Date()
    current.setHours(current.getHours() - constants.TIME_DIFF) // time diff between Render and local time

    if (current.getTime() < projectEnd.getTime()) {
      console.log('Sending standup message to channel...')
      channel.send(
        `   =====================================================\n
         ${current} \n
         =====================================================\n
        Good morning @everyone!
        Please reply to this message with what you did *yesterday*,
        what you will do *today*,
        and any *blockers* you are dealing with.
        `
      )
    }
  })

function resetMembers () {
  for (let member of Object.values(constants.members)) {
    members.add(member)
  }
}

client.login(process.env.BOT_TOKEN)