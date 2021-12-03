const TelegramBot = require('node-telegram-bot-api');

const telegramConfig = require('./config').telegram;

const fs = require('fs');


const token = telegramConfig.token;

const bot = new TelegramBot(token);

bot.on('message', (msg) => {
  if (new Date().getTime() < new Date('2021-12-28 20:28:00').getTime()) {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Received your message'); 
  }
});

module.exports.sendMessage = async (message) => { 
  if (new Date().getTime() < new Date('2021-12-28 20:28:00').getTime()) {
    
      bot.sendMessage(telegramConfig.chatId1,message,{parse_mode: 'HTML'}); 
  }
}





