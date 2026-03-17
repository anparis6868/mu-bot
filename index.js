require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');
const cheerio = require('cheerio');

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

const CHANNEL_ID = '1483361517066915842';

const characters = [
    { name: "SM", url: "https://elitemu.net/character/4368616e/HARD" },
    { name: "MG", url: "https://elitemu.net/character/5472616e48616f4e616d/HARD" },
    { name: "DL", url: "https://elitemu.net/character/4e6f54776f/HARD" },
    { name: "RF", url: "https://elitemu.net/character/4f69536869/HARD" }
];

let lastData = {};

async function getData(char) {
    try {
        const res = await axios.get(char.url);
        const $ = cheerio.load(res.data);
        const text = $('body').text();

        const level = text.match(/Level\s*:\s*(\d+)/i)?.[1] || 0;
        const reset = text.match(/Reset\s*:\s*(\d+)/i)?.[1] || 0;
        const pk = text.match(/PK\s*:\s*(\w+)/i)?.[1] || "Unknown";

        return {
            level: parseInt(level),
            reset: parseInt(reset),
            pk: pk
        };
    } catch {
        return null;
    }
}

async function checkCharacters() {
    const channel = await client.channels.fetch(CHANNEL_ID);

    for (let char of characters) {
        const data = await getData(char);
        if (!data) continue;

        const old = lastData[char.name];

        if (!old) {
            lastData[char.name] = data;
            continue;
        }

        if (data.level >= 400 && old.level < 400) {
            channel.send(`🎉 ${char.name} đạt level 400 → RESET!`);
        }

        if (data.reset > old.reset) {
            channel.send(`🔥 ${char.name} reset (${old.reset} → ${data.reset})`);
        }

        if (data.pk !== old.pk) {
            channel.send(`⚠️ ${char.name} PK thay đổi (${old.pk} → ${data.pk})`);
        }

        lastData[char.name] = data;
    }
}

setInterval(checkCharacters, 60000);

client.once('ready', async () => {
    console.log(`Bot online: ${client.user.tag}`);

    const channel = await client.channels.fetch(CHANNEL_ID);
    channel.send("✅ Bot đã hoạt động!");
});

client.login(process.env.TOKEN);
