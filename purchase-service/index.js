const mongoose = require('mongoose');
const amqplib = require('amqplib');
const Orders = require('./Orders');
const express = require('express');
const app = express();
const jwt = require('jsonwebtoken');
const PORT = 6003

mongoose.connect(
    "mongodb://localhost/purchase-service",
    {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    },
    () => {
        console.log("[+] Purchase-Service DB");
    }
);

app.use(express.json());

var connection, channel;
//Amqp Connection
async function connect() {
    const amqpServer = "amqps://jaspoexu:TSfNpnuivKaGhmzzuqEdVQcDtMiYmZOh@puffin.rmq2.cloudamqp.com/jaspoexu";
    connection = await amqplib.connect(amqpServer)
    channel = await connection.createChannel();
    await channel.assertQueue("PURCHASE");
}

function saveOrder(games, buyer) {
    let price = 0;
    for (let i = 0; i < games.length; i++) { price += games[i].price }
    const order = new Orders({ games, price: price, buyer: buyer });
    order.save();
    return order;
}

//starting amqp channel for handling purchase - subscribing
connect()
    .then(() => {
        channel.consume("PURCHASE", (data) => { // subscribing to details published by games service
            const { games, buyer } = JSON.parse(data.content);
            const order = saveOrder(games, buyer);
            channel.ack(data);
            channel.sendToQueue("GAMES",
                Buffer.from(JSON.stringify({ order, message: "Your Order has been Placed" })));
        })
    });

app.listen(PORT, () => {
    console.log("[+] Purchase-Service running on port " + PORT + "\nlocalhost:" + PORT + "/purchase/");
});