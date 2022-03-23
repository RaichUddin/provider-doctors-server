
const express = require('express')
const cors = require('cors');
const app = express()
var admin = require("firebase-admin");

var MongoClient = require('mongodb').MongoClient;

require('dotenv').config();

const port = process.env.PORT || 5000;



app.use(cors());
app.use(express.json());

var uri = `mongodb://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0-shard-00-00.00ohf.mongodb.net:27017,cluster0-shard-00-01.00ohf.mongodb.net:27017,cluster0-shard-00-02.00ohf.mongodb.net:27017/myFirstDatabase?ssl=true&replicaSet=atlas-ko9svf-shard-0&authSource=admin&retryWrites=true&w=majority`;

const client = new MongoClient(uri);

MongoClient.connect(uri, function (err, client) {
    const collection = client.db("test").collection("devices");
    // perform actions on the collection object
    client.close();
});

// async function verifyToken(req, res, next) {
//     if (req.headers?.authorization?.startsWith('Bearer ')) {
//         const token = req.headers.authorization.split(' ')[1];

//         try {
//             const decodedUser = await admin.auth().verifyIdToken(token);
//             req.decodedEmail = decodedUser.email;

//         }
//         catch {

//         }
//     }
//     next();
// }

async function run() {
    try {
        await client.connect();
        const database = client.db('doctors-provider');
        const doctorsCollection = database.collection("Bookings");
        const usersCollection = database.collection('Users');

        app.get('/appointments', async (req, res) => {
            const email = req.query.email;
            const date = new Date(req.query.date).toLocaleDateString();
            const query = { email: email, date: date };
            const cursor = doctorsCollection.find(query);
            const appointments = await cursor.toArray();
            res.json(appointments);
        })
        app.post('/appointments', async (req, res) => {
            const booking = req.body;
            const result = await doctorsCollection.insertOne(booking);
            res.json(result);
        });
        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            let isAdmin = false;
            if (user?.role === 'admin') {
                isAdmin = true;
            }
            res.json({ admin: isAdmin });
        });

        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            console.log(result);
            res.json(result);
        });
        app.put('/users', async (req, res) => {
            const user = req.body;
            const filter = { email: user.email };
            const option = { upsert: true };
            const updateDoc = { $set: user };
            const result = await usersCollection.updateOne(filter, updateDoc, option);

            res.json(result);
        });
        app.put('/users/admin', async (req, res) => {
            const user = req.body;
            // console.log(req.decodedEmail);
            // const requester = req.decodedEmail;

            // if (requester) {

            //     const requesterAccount = await usersCollection.findOne({ email: requester });
            // if (requesterAccount.role === 'admin') {
            const filter = { email: user.email };
            const updateDoc = { $set: { role: 'admin' } };
            const result = await usersCollection.updateOne(filter, updateDoc);
            res.json(result);

            //     }
            // }
            // else {
            //     res.status(403).json({ message: 'You dont create admin' });
            // }

        });
    }

    finally {
        // await client.close();
    }
}

run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Hello doctor provider')
})

app.listen(port, () => {
    console.log(`listening on port ${port}`)
})