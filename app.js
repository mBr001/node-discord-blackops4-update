// Requirements
const { Client } = require('discord.js');
const fs = require('fs');
let Parser = require('rss-parser');
const htmlToText = require('html-to-text');
const log = require('npmlog');

// Load Config
const cfg = require('./config.json');

// Create feeder instance
let rssParser = new Parser({
    // Setting User Agent
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36'
    }
});

// Setting variables for the RSS output
let updateTitle;
let updateURL;
let updateContent;
let updateDate;

// Setting last update variable
let lastUpdate;

function getLastUpdate() {
    // Getting date of last update from check-update.txt file
    let dateFromFile = fs.readFileSync('check-update.txt');
    lastUpdate = dateFromFile.toString();
}

// Getting last date from check-update.txt file every 5 seconds
setInterval(getLastUpdate, 5000);

// Create Discord Bot Instance
const bot = new Client();

// Logging into Bot Account
bot.on('ready', () => {
    log.info('discord', `Logged in as ${bot.user.tag} (User ID: ${bot.user.id}) on ${bot.guilds.size} server(s)`);
    bot.user.setActivity('Fetching Updates');

    // Checking every 10 seconds if there's a new update, and if it's been posted already
    setInterval(getUpdate, 10000);
});

function getUpdate() {
    // Get current date and edit format
    let getDate = new Date();
    let date = [
        getDate.getFullYear(),
        ('0' + (getDate.getMonth() + 1)).slice(-2),
        ('0' + getDate.getDate()).slice(-2)
    ].join('-');

    // Fetching updates from Black Ops 4 Reddit
    (async () => {
        // Setting RSS Feed URL
        let feed = await rssParser.parseURL('https://www.reddit.com/r/Blackops4/.rss');

        // Setting items into variables
        feed.items.forEach(item => {
            if (item.author === '/u/treyarch_official' && item.title.includes('Update' || 'update') && item.isoDate.includes(date)) {
                updateTitle = item.title;
                updateAuthor = item.author;
                updateURL = item.link;
                updateContent = item.content;
                updateDate = item.isoDate;
                //console.log(updateTitle);
            }
        });

        // Converting from HTML to readable text
        let format = htmlToText.fromString(updateContent, {
            wordwrap: 130
        });

        // Limiting the update to 10 lines
        let updateNotes = format.split('\n', 10);

        if (lastUpdate !== date) {
            bot.channels.get(cfg.channelid).send("@everyone A new Black Ops 4 Update has been released!", {
                embed: {
                    "title": `${updateTitle}`,
                    "description": `${updateNotes.join('\n')}...\n\n[Continue reading on Reddit](${updateURL})`,
                    "url": `${updateURL}`,
                    "color": 5478908,
                    "thumbnail": {
                    "url": "https://raw.githubusercontent.com/Triniayo/node-discord-blackops4-update/master/blackops4-icon.png"
                    }
                }
            });

            // Storing date of the latest update in the check-update.txt
            fs.writeFileSync('check-update.txt', `${date}`)
        } else {
            // Do nothing if update has been posted already.
        }
    })();
}

// Logging into the Bot Account
bot.login(cfg.token);
