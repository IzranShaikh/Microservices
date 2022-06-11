const User = require('./User');
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const PORT = 6001

mongoose.connect(
    "mongodb://localhost/auth-service",
    {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    },
    () => {
        console.log("[+] Auth-Service DB");
    }
);

app.use(express.json());

//Register Route
app.post("/auth/register", async (req, res) => {
    const { name, email, password } = req.body;
    const exists = await User.findOne({ email: email });
    if (exists)
        return res.json({ message: "Already registered" })
    const newUser = new User({
        name, email, password
    })
    newUser.save()
    return res.json(newUser);
});

//Login Route
app.post("/auth/login", async (req, res) => {
    const { email, password } = req.body
    const exists = await User.findOne({ email: email });
    if (!exists)
        return res.json({ message: "No such account exists" })
    if (password !== exists.password)
        return res.json({ message: "Incorrect Password" })
    const payload = { email: email, name: exists.name }; //Name is needed usually just for frontend
    jwt.sign(payload, "rabbitmq:amqp",
        { expiresIn: '1hr' },
        (err, token) => {
            if (err) console.error(err);
            else return res.json({ token: token })
        });
});

app.listen(PORT, () => {
    console.log("[+] Auth-Service running on port " + PORT + "\nlocalhost:" + PORT + "/auth/");
});