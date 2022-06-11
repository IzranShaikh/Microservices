const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const GameSchema = new Schema({

    name: String,
    info: String,
    price: Number,

})

module.exports = Games = mongoose.model('Games', GameSchema);