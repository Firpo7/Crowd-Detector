const fetch = require('node-fetch');
const mqtt = require('mqtt');
const {Telegraf} = require('telegraf');
const {MenuTemplate, MenuMiddleware} = require('telegraf-inline-menu');
const extra = require('telegraf/extra');
const session = require('telegraf/session');
const markup = extra.markdown();
require('dotenv').config();

const token = process.env.TOKEN;
const bot = new Telegraf(token);
bot.use(session());

const SERVER_PORT = process.env.SERVER_PORT || 4000;
const SERVER_HOST = process.env.SERVER_HOST || 'localhost';


function formatMex (data) {
  return `
⚠️ ALERT ⚠️
Building: ${data.building}
Floor: ${data.floor}
Room: ${data.name} - ${data.roomtype}
Max Capacity: ${data.maxpeople}

People in the room: ${data.current_people}
  `
}

var knex = require('knex')({
  client: 'sqlite3',
  connection: {
    filename: "./mydb.sqlite"
  },
  useNullAsDefault: true
});

var settings = {
  port: SERVER_PORT
};

var mqttClient = mqtt.connect(`ws://${SERVER_HOST}`, settings);
mqttClient.on('connect', () => {
  console.log(`mqtt client connected`);
});
mqttClient.subscribe("ALERTS");

let menu = new MenuTemplate(() => 'Choose the building you want to subscribe 🏢');

let buildings = [];
menu.select('select', buildings, {
  columns: 2,
  maxRows: 3,
  getCurrentPage: ctx => ctx.session.page,
	setPage: (ctx, page) => {
		ctx.session.page = page
	},
  set: (ctx, key) => {
    return ctx.getChat().then((chat) => {
      return knex('users')
      .where('chatId', chat.id)
      .update({ building: key, })
      .then(() => ctx.reply(`You are now subscribed to: ${key} 🏢🌳`))
      .then(() => ctx.session.selectedKey = key)
      .then(() => true)
      .catch((err)=> console.error(err));
    }).catch((err)=> console.error(err));
  },
  isSet: (ctx, key) => {
    if (ctx.session.selectedKey) {
      // console.log("SESSION", ctx.session.selectedKey, "===", key,"=",ctx.session.selectedKey === key)
      return ctx.session.selectedKey === key
    } else {
      return ctx.getChat().then((chat) => {
        return knex.from("users").where("chatId", (chat.id)).then((rows) => {
          if (rows.length) {
            // console.log("DB", rows[0].building, "===", key,"=",rows[0].building === key)
            ctx.session.selectedKey = rows[0].building
            return rows[0].building === key;
          }
          return false;
        }).catch((err)=> console.error(err));
      }).catch((err)=> console.error(err));
    }
  }
})

const menuMiddleware = new MenuMiddleware('/', menu);

function showMenu(ctx) {
  fetch(`http://${SERVER_HOST}:${SERVER_PORT}/getBuildings`, { method: 'GET' })
  .then(response => response.json())
  .then(data => {
      if (data.code !== 42) {
        ctx.reply("An error occurred")
        throw data.code;
      } else {
        buildings.splice(0,buildings.length)
        buildings.push(...data.buildings.map(a => a.name))
        menuMiddleware.replyToContext(ctx)
      }
  })
  .catch(err => console.error('[ERROR (push)]:', err));
}

bot.use((ctx, next) => {
	if (ctx.callbackQuery?.data) {
    console.log('another callbackQuery happened', ctx.callbackQuery.data.length, ctx.callbackQuery.data)
	}
  return next()
});

bot.start(async (ctx) => {
  ctx.getChat().then((chat) => {
    knex.select("chatId").from("users").where("chatId", chat.id).then((rows) => {
      if (rows.length) {
        ctx.reply("Already registered\nExecute /subscribe to subscribe to a building");
      } else {
        knex('users').insert({chatId: chat.id, building: ""})
        .then(() => ctx.reply("Welcome"))
        .then(() => showMenu(ctx))
        .catch((err)=> console.error(err));
      }
    }).catch((err)=> console.error(err));
  }).catch((err)=> console.error(err));
});

bot.command('subscribe', async ctx => {
  ctx.getChat().then((chat) => {
    knex.select("chatId").from("users").where("chatId", chat.id)
    .then((rows) => {
      if (!rows.length) {
        ctx.reply("Execute /start please");
      } else {
        ctx.session.page = 1
        showMenu(ctx)
      }
    }).catch((err)=> console.error(err));
  }).catch((err)=> console.error(err));
});

bot.command('unsubscribe', (ctx) => {
  ctx.getChat().then ((chat) => {
    knex('users').where('chatId', chat.id)
    .update({ building: "" })
    .then(() => ctx.reply(`Successfully unsubscribed`))
    .catch((err)=> console.error(err));
  })
});

bot.use(menuMiddleware.middleware());

bot.catch(error => {
	console.error('telegraf error', error.response, error.parameters, error.on || error)
});

async function createUsersTable() {
  const exists = await knex.schema.hasTable('users');
  if (!exists) {
    console.log("creating users table");
    return knex.schema.createTable("users", function (table) {
      table.string('chatId');
      table.string('building');
      table.primary('chatId');
    }).then(() => console.log("table users created"))
    .catch((err)=> console.error(err));;
  }
  else {
    console.log("users table already created");
  }
}

mqttClient.on('message', function (topic, message) {
  console.log(topic.toString() + " - " + message.toString());
  knex.select("chatId").from("users").where("building", JSON.parse(message).building)
  .then((rows) => {
    if (rows.length) {
      for( let i = 0;  i < rows.length; ++i) {
        //bot.sendMessage(rows[i].chatId, message);
        bot.telegram.sendMessage(
          rows[i].chatId,
          formatMex(JSON.parse(message.toString())),
          markup
        ).catch((err)=> console.error(err));
      }
    }
  }).catch((err)=> console.error(err));;
});

async function startup() {
  await createUsersTable()
  await bot.launch()
  if (bot.options.username) {
    console.log(new Date(), 'Bot started as', bot.options.username)
  } else {
    console.log("ERROR CONNECTING TO BOT TELEGRAM API");
    process.exit(1)
  }
}

startup();