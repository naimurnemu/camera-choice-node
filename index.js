const express = require("express");
const { MongoClient } = require("mongodb");
const ObjectId = require("mongodb").ObjectId;
const cors = require("cors");
const crypto = require("crypto");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

// Middle Ware
app.use(cors());
app.use(express.json());

// Connect to database
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.amqnd.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

// database function
async function run() {
    try {
        await client.connect();
        const cameraShop = client.db("cameraChoice");
        const userCollection = cameraShop.collection("users");
        const productCollection = cameraShop.collection("products");
        const orderCollection = cameraShop.collection("orders");
        const reviewCollection = cameraShop.collection("reviews");
        console.log("database is conneted");

        // Get all product
        app.get("/products", async (req, res) => {
            const cursor = productCollection.find({});
            const cameras = await cursor.toArray();
            res.send(cameras);
        });

        // Get single product
        app.get("/product/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const product = await productCollection.findOne(query);
            res.send(product);
        });

        // Get All Order
        app.get("/orders", async (req, res) => {
            const cursor = orderCollection.find({});
            const allOrders = await cursor.toArray();
            res.send(allOrders);
        });

        // Get Spacific user order
        app.get("/orders/:email", async (req, res) => {
            const userEmail = req.params.email;
            const query = { email: userEmail };
            const cursor = orderCollection.find(query);
            const myOrders = await cursor.toArray();
            res.send(myOrders);
        });

        // Get All Reviews
        app.get("/reviews", async (req, res) => {
            const cursor = reviewCollection.find({});
            const allReviews = await cursor.toArray();
            res.send(allReviews);
        });

        // get admin data
        app.get("/users/:email", async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await userCollection.findOne(query);
            let isAdmin = false;
            if (user?.role === "admin") {
                isAdmin = true;
            }
            res.send({ admin: isAdmin });
        });

        // Add product to database
        app.post("/products", async (req, res) => {
            const product = req.body;
            const result = await productCollection.insertOne(product);
            res.send(result);
        });

        // Add user Data
        app.post("/users", async (req, res) => {
            const user = req.body;
            const result = await userCollection.insertOne(user);
            res.send(result);
        });

        // Add order
        app.post("/orders", async (req, res) => {
            const orderId = crypto.randomBytes(8).toString("hex");
            const order = req.body;
            order["orderId"] = orderId;
            const result = await orderCollection.insertOne(order);
            res.send(result);
        });

        // Add Review
        app.post("/reviews", async (req, res) => {
            const review = req.body;
            const result = await reviewCollection.insertOne(review);
            res.send(result);
        });

        // Update users collection
        app.put("/users", async (req, res) => {
            const user = req.body;
            const filter = { email: user.email };
            const options = { upsert: true };
            const updateDoc = { $set: user };
            const result = await userCollection.updateOne(
                filter,
                updateDoc,
                options
            );
            res.send(result);
        });

        // make admin api
        app.put("/users/admin", async (req, res) => {
            const user = req.body;
            const filter = { email: user.email };
            const updateDoc = {
                $set: {
                    role: "admin",
                },
            };
            const result = await userCollection.updateOne(filter, updateDoc);
            res.send(result);
            console.log(result);
        });

        // Delete product Api
        app.delete("/product/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await productCollection.deleteOne(query);
            res.send(result);
            console.log(result);
        });

        // Delete Order api
        app.delete("/order/:orderId", async (req, res) => {
            const id = req.params.orderId;
            const query = { orderId: id };
            const result = await orderCollection.deleteOne(query);
            res.send(result);
        });
    } finally {
        // await client.close()
    }
}
run().catch(console.dir);

app.get("/", (req, res) => {
    res.send("Hello World By Camera shop!");
});

app.listen(port, () => {
    console.log("Server run by Port:", port);
});
