# Bot Telegram
To notify the users in real-time when a room becomes full we have thought to implement a telegram bot.

It relies on the following modules:
<ul>
  <li><b><i>Telegraph</i></b>: to be able to connect the bot to the Telegram APIs and to get some Ui elements</li>
  <li><b><i>MQTT</i></b></li>: to handle data pushed by sensors
</ul>

## Instructions
You have to install all the depencies firing the command `npm install` from this directory in a terminal of your choice. Then you have to be registered to `BotFather` in order to get a **TOKEN** to interface it with _Telegram_.