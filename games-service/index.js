const mongoose = require('mongoose');
const amqplib = require('amqplib');
const Games = require('./Games');
const express = require('express');
const app = express();
const jwt = require('jsonwebtoken');
const PORT = 6002

mongoose.connect(
    "mongodb://localhost/games-service",
    {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    },
    () => {
        console.log("[+] Game-Service DB");
    }
);

//authentication check
async function Authenticated(req, res, next) {
    const token = req.headers["authorization"].split(" ")[1];
    jwt.verify(token, "rabbitmq:amqp", (err, user) => {
        if (err) return res.json(err);
        else {
            req.user = user;
            next();
        }
    });
};

app.use(express.json());

var connection, channel;
//Amqp Connection
async function connect() {
    const amqpServer = "amqp://localhost:5672";
    connection = await amqplib.connect(amqpServer)
    channel = await connection.createChannel();
    await channel.assertQueue("GAMES");
}

//will start the channel and wait for publishing request from user
connect();

//List Games
app.get('/games', Authenticated, async (req, res) => {
    Games.find()
        .then((games) => {
            return res.json(games);
        })
        .catch((err) => {
            return res.json(err);
        })
});

//Add Game
app.post('/games/add', Authenticated, async (req, res) => {
    const { name, info, price } = req.body;
    const game = new Games({ name, info, price });
    game.save();
    return res.json(game);
});

var _data;
//Purchase Game
app.post('/games/purchase', Authenticated, async (req, res) => {
    const { game_ids } = req.body;
    const games = await Games.find({ _id: { $in: game_ids } });
    //publishing games details and user to purchase queue
    await channel.sendToQueue("PURCHASE",
        Buffer.from(JSON.stringify({
            games, email: "tester@test.com"
        })));
    //subscribing to details(results of execution) published by purchase service
    await channel.consume("GAMES", (data) => {
        _data = JSON.parse(data.content)
        channel.ack(data);
    });
    return res.json(_data)
});

app.listen(PORT, () => {
    console.log("[+] Game-Service running on port " + PORT + "\nlocalhost:" + PORT + "/games/");
});
