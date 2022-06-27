const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const port = process.env.PORT || 5000;

const app = express();

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.isfsk8s.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    await client.connect();
    const carCollection = client.db("carInventory").collection("cars");
    const userCarCollection = client.db("carInventory").collection("userCars");
    // all results
    app.get("/inventories", async (req, res) => {
      const query = {};
      const cursor = carCollection.find(query);
      const cars = await cursor.toArray();
      res.send(cars);
    });
    // only six results
    app.get("/inventory", async (req, res) => {
      const size = parseInt(req.query.size);
      const query = {};
      const cursor = carCollection.find(query);
      const cars = await cursor.limit(size).toArray();
      res.send(cars);
    });
    // targeted result
    app.get("/inventories/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const car = await carCollection.findOne(query);
      res.send(car);
    });
    // targeted result
    app.put("/inventories/:id", async (req, res) => {
      const id = req.params.id;
      const update = req.body;

      const query = { _id: ObjectId(id) };
      const car = await carCollection.updateOne(
        query,
        { $set: update },
        { upsert: true }
      );
      res.send(car);
    });

    // POST
    app.post("/inventories", async (req, res) => {
      const userNewCar = req.body;
      const result = await carCollection.insertOne(userNewCar);

      res.send(result);
    });
    // PUT Users  Inputed data Id
    app.put("/userInventory", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      let result;
      if (query) {
        const cursor = userCarCollection.find(query);
        const userNewIds = req.body.productId.toString();
        result = await userCarCollection.updateOne(
          query,
          {
            $push: {
              productId: userNewIds,
            },
          },
          { upsert: true }
        );
      } else {
        result = await carCollection.insertOne(userNewCar);
      }
      res.send(result);
    });
    // get
    app.get("/userInventory", async (req, res) => {
      const query = {};
      const cursor = userCarCollection.find(query);
      const userCars = await cursor.toArray();
      console.log(userCars);
      res.send(userCars);
    });

    // DELETE
    app.delete("/service/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await carCollection.deleteOne(query);
      res.send(result);
    });
  } finally {
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Car Invento Server");
});

app.listen(port, () => {
  console.log("Listening to port", port);
});
