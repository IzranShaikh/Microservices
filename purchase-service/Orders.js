const mongoose = require('mongoose');

const OrderSchema = mongoose.Schema({

    games: [{ game_id: String }],
    price: Number,
    buyer: String

});

module.exports = Orders = mongoose.model('Orders', OrderSchema);