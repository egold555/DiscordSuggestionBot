const Discord = require('discord.js');
const bot = new Discord.Client();
const fs = require('fs');
const os = require('os');
const configFile = fs.readFileSync('config.txt', 'utf8');
const config = configFile
    .split(os.EOL)
    .map(line => line.split('='))
    .reduce((acc, val) => {
        const configName = val[0].trim()
        const configValue = val[1].trim()
        acc[configName] = configValue
        return acc
    }, {})

const prefix = config.prefix;

const talkedRecently = new Set();

bot.on('ready', () => {
    console.log(`Logged in as ${bot.user.tag}!`);
    bot.user.setStatus("online");
    bot.user.setActivity("for new suggestions", {type: 'WATCHING'});
});

bot.on('message', message => {

    if (message.author.bot) return;

    //const isChatModerator = message.guild.roles.find(role => role.name === "Chat Moderator");
   // const isEric = message.guild.roles.find(role => role.name === "Founder");
var isChatModerator =false;
var isEric =false;

//Not sure why either of these would be null but my bot crashed for some reason so heres a fix
if(message == null || message.guild == null){
	return;
}

if(message.guild.roles == null)	{
	isChatModerator =false;
	isEric =false;
} else {
   isChatModerator = message.guild.roles.find(role => role.name === "Chat Moderator");
   isEric = message.guild.roles.find(role => role.name === "Founder");

}
	
    if (isEric && message.content.startsWith(prefix + "echo")) {
        message.channel.send(message.content.replace(prefix + 'echo', ''));
        message.delete();
        return;
    }

    if (isChatModerator && message.content.startsWith(prefix + "purge")) {
        //Purge Command
        const user = message.mentions.users.first();
        // Parse Amount
        const amount = !!parseInt(message.content.split(' ')[1]) ? parseInt(message.content.split(' ')[1]) : parseInt(message.content.split(' ')[2])
        if (!amount) return message.reply('Must specify an amount to delete!');
        if (!amount && !user) return message.reply('Must specify a user and amount, or just an amount, of messages to purge!');
        // Fetch 100 messages (will be filtered and lowered up to max amount requested)
        message.channel.fetchMessages({
            limit: 100,
        }).then((messages) => {
            if (user) {
                const filterBy = user ? user.id : Client.user.id;
                messages = messages.filter(m => m.author.id === filterBy).array().slice(0, amount);
            }
            message.channel.bulkDelete(messages).catch(error => console.log(error.stack));
        });

    }


    if ((message.channel.id == config.suggestionsSubmit)) {
        var suggestion = message.content;
        var author = message.author.id
        message.delete();

        if (talkedRecently.has(message.author.id)) {
            message.author.send("Thanks for your suggestion, but you have already submitted one less then one minute ago! Please try again later. Your suggestion is below so you don't need to retype it. \n\n" + suggestion);
            return;
        }

        talkedRecently.add(message.author.id);
        setTimeout(() => {
            talkedRecently.delete(message.author.id);
        }, 1 * 60000);


        bot.channels.get(config.suggestions).send(escapeMarkdown(suggestion) + "**" + "\n\n Submitted by: <@" + author + ">**").then((suggestionMessage) => {
            suggestionMessage.react(config.emojiLike) //Like
            suggestionMessage.react(config.emojiDislike) //Dislike
            return;
        });
    }

    

});

function escapeMarkdown(text) {
    var unescaped = text.replace(/\\(\*|_|`|~|\\)/g, '$1'); // unescape any "backslashed" character
    var escaped = unescaped.replace(/(\*|_|`|~|\\)/g, '\\$1'); // escape *, _, `, ~, \
    return escaped;
}
bot.on('error', console.error);
bot.login(config.clientToken);