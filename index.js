const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const port = process.env.PORT || 5000;

const app = express();

// middleware
app.use(cors());
app.use(express.json());

// jwt function
const verifyJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  console.log(authHeader.split(" ")[1]);
  if (!authHeader) {
    return res.status(401).send({ message: "unauthorized access" });
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).send({ message: "acces forbidden" });
    }
    req.decoded = decoded;
    next();
  });
};

// mongo db
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

    // Auth
    app.post("/login", async (req, res) => {
      const user = req.body;
      const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "30d",
      });

      res.send({ accessToken });
    });

    // all results
    app.get("/inventories", async (req, res) => {
      const query = {};
      const cursor = carCollection.find(query);
      const cars = await cursor.toArray();
      res.send(cars);
    });

    // getttin data that user saved personally
    app.post("/productids", verifyJWT, async (req, res) => {
      const decodeEmail = req.decoded.email;
      const email = req.query.email;

      if (email === decodeEmail) {
        const keys = req.body;
        const ids = keys.map((id) => ObjectId(id));
        const query = { _id: { $in: ids } };
        const cursor = carCollection.find(query);
        const cars = await cursor.toArray();
        res.send(cars);
      } else {
        res.status(403).send({ message: "Access Forbidden" });
      }
    });

    // results shows in home page Only 6 results
    app.get("/inventory", async (req, res) => {
      const size = parseInt(req.query.size);
      const query = {};
      const cursor = carCollection.find(query);
      const cars = await cursor.limit(size).toArray();
      res.send(cars);
    });

    // get targeted id result
    app.get("/inventories/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const car = await carCollection.findOne(query);
      res.send(car);
    });

    // update  targeted id result
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

    // POST add data to the inventories
    app.post("/inventories", async (req, res) => {
      const userNewCar = req.body;
      const result = await carCollection.insertOne(userNewCar);
      res.send(result);
    });

    // PUT Users  Inputed data Id
    app.put("/userInventory", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const id = req.body.productId.toString();
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

    // patch(remove) users existing array id;
    app.patch("/userInventory", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      let result;
      if (query) {
        const cursor = userCarCollection.find(query);
        const userNewId = req.body.productId.toString();
        result = await userCarCollection.updateOne(
          query,
          {
            $pull: {
              productId: userNewId,
            },
          },
          { upsert: true }
        );
      }
      res.send(result);
    });
    // get
    app.get("/userInventory", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const cursor = userCarCollection.find(query);
      const userCars = await cursor.toArray();
      res.send(userCars);
    });

    // DELETE
    app.delete("/inventory/:id", async (req, res) => {
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
