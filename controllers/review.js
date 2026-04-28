const Review = require("../models/review.js");
const Listing = require("../models/listing.js");  

module.exports.createReview = async (req, res) => {
  let listing = await Listing.findById(req.params.id).populate("reviews");
  let newReview = new Review(req.body.review);
  newReview.author = req.user._id;
  
  await newReview.save();
  listing.reviews.push(newReview._id);
  
  // Update avg rating
  let totalRating = listing.reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
  totalRating += newReview.rating;
  listing.avgRating = totalRating / (listing.reviews.length + 1);
  
  await listing.save();
  
  req.flash("success", "New Review Created!");
  res.redirect(`/listings/${listing._id}`);
};

module.exports.destroyReview = async (req, res) =>{
    let { id, reviewId } = req.params;
    await Listing.findByIdAndUpdate(id, {$pull: {reviews: reviewId}});
    await Review.findByIdAndDelete(reviewId);
    
    // Recalculate avgRating
    let listing = await Listing.findById(id).populate("reviews");
    if (listing.reviews.length > 0) {
      let avg = listing.reviews.reduce((acc, r) => acc + r.rating, 0) / listing.reviews.length;
      listing.avgRating = avg;
    } else {
      listing.avgRating = 0;
    }
    await listing.save();
    
    req.flash("success","Review Deleted!");
    res.redirect(`/listings/${id}`);
};