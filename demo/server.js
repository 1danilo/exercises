const express = require("express");
const app = express();
const mongoose = require("mongoose");

mongoose.connect(
  "mongodb://mmdanilo:danilo01@cluster0-shard-00-00.mu2bm.mongodb.net:27017,cluster0-shard-00-01.mu2bm.mongodb.net:27017,cluster0-shard-00-02.mu2bm.mongodb.net:27017/myFirstDatabase?ssl=true&replicaSet=atlas-vxabs4-shard-0&authSource=admin&retryWrites=true&w=majority"
);

const db = mongoose.connection;
db.on("error", (error) => console.error(error));
db.once("open", () => console.log("Connected to Database"));

app.listen(3000, () => console.log("Server Started"));
