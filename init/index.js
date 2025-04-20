const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");


main()
  .then(() => {
    console.log("connected to DB");
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
  await mongoose.connect(MONGO_URL);
}

const initDB = async () => {
    await Listing.deleteMany({});
    initData.data = initData.data.map((obj) => ({
      ...obj,
      owner: "67ffb011873ab1e93cdcceaf",
    image: {
      url: obj.image.url,
      filename: obj.image.filename
    }
  }));
    await Listing.insertMany(initData.data);
    console.log("data was initialized");
  };
  

initDB();


