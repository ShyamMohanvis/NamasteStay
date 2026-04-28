const fs = require("fs");
const csv = require("csv-parser");
const mongoose = require("mongoose");
const path = require("path");

const Listing = require("./models/listing");
const Review = require("./models/review");
const User = require("./models/user");

mongoose.connect("mongodb://127.0.0.1:27017/namastestay", { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to DB'))
  .catch(err => console.error(err));

let rows = [];

// 🎲 helper: generate rating from sentiment
function getRating(sentiment) {
  if (sentiment === "positive") return 4 + Math.random();
  if (sentiment === "neutral") return 3 + Math.random();
  return 1 + Math.random() * 2;
}

// 🎲 helper: listing title
function generateTitle(area) {
  const types = ["Stay", "Room", "Apartment", "House", "Villa"];
  const adjectives = ["Cozy", "Budget", "Modern", "Luxury", "Beautiful", "Clean"];

  return `${adjectives[Math.floor(Math.random()*adjectives.length)]} ${types[Math.floor(Math.random()*types.length)]} near ${area}`;
}

const images = [
  "https://images.unsplash.com/photo-1552733407-5d5c46c3bb3b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60",
  "https://images.unsplash.com/photo-1501785888041-af3ef285b470?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60",
  "https://images.unsplash.com/photo-1571896349842-33c89424de2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60",
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60",
  "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60",
  "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60",
  "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60",
  "https://images.unsplash.com/photo-1622396481328-9b1b78cdd9fd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60",
  "https://images.unsplash.com/photo-1502784444187-359ac186c5bb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60",
  "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60"
];


// 🎯 MAIN FUNCTION
async function seedDB() {
  console.log(`Starting to seed ${rows.length} records...`);
  let count = 0;
  for (let row of rows) {
    if (!row.host_name) continue;

    // 1. Create or find user (host)
    let user = await User.findOne({ username: row.host_name });

    if (!user) {
      let newUser = new User({
        username: row.host_name,
        email: `${row.host_name.toLowerCase().replace(/\s+/g, '')}@mail.com`
      });
      try {
        await User.register(newUser, "password123");
        user = newUser; // Set user to the new registered user
      } catch (err) {
        if (err.name === 'UserExistsError') {
          user = await User.findOne({ username: row.host_name });
        } else {
          console.error(`Error registering user ${row.host_name}:`, err);
          continue; // Skip this row if user creation fails
        }
      }
      user = await User.findOne({ username: row.host_name });
    }

    if(!user) {
         console.log("Could not find or create user", row.host_name);
         continue;
    }

    // 2. Create or find listing
    let listing = await Listing.findOne({
      location: row.city,
      title: new RegExp(row.area, "i")
    });

    if (!listing) {
      let randomImg = images[Math.floor(Math.random() * images.length)];
      listing = new Listing({
        title: generateTitle(row.area),
        location: row.city,
        price: Math.floor(800 + Math.random() * 3000),
        owner: user._id,
        image: {
            url: randomImg,
            filename: "listingimage"
        }
      });
      await listing.save();
    }

    // 3. Create review
    const rating = Math.min(5, Math.max(1, getRating(row.sentiment)));

    let review = new Review({
      comment: row.hinglish,
      sentiment: row.sentiment,
      rating: rating,
      author: user._id
    });

    await review.save();

    // 4. Attach review
    listing.reviews.push(review._id);

    // 5. Update avg rating
    let allReviews = await Review.find({ _id: { $in: listing.reviews } });

    let avg =
      allReviews.reduce((acc, r) => acc + r.rating, 0) /
      allReviews.length;

    listing.avgRating = avg;

    await listing.save();
    count++;
  }

  console.log(`✅ Data Seeded Successfully! Processed ${count} reviews.`);
}

let datasetPath = path.join(__dirname, "dataset", "hinglish_reviews_v4_balanced (1).csv");

if(!fs.existsSync(datasetPath)) {
    datasetPath = path.join(__dirname, "dataset", "hinglish_reviews_v4_balanced.csv");
}
if(!fs.existsSync(datasetPath)) {
    console.log("Dataset not found! Looked for:", datasetPath);
    process.exit(1);
}

// 📂 Read CSV
console.log("Reading CSV dataset...");
fs.createReadStream(datasetPath)
  .pipe(csv())
  .on("data", (data) => rows.push(data))
  .on("end", async () => {
    console.log(`CSV read complete. Found ${rows.length} rows.`);
    await seedDB();
    mongoose.connection.close();
  });
