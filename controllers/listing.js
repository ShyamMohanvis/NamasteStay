const Listing = require("../models/listing");

/** Normalize multer file to { url, filename } for Cloudinary URL or local /uploads/... */
function imageFromUpload(file) {
  if (!file) return null;
  if (typeof file.path === "string" && file.path.startsWith("http")) {
    return { url: file.path, filename: file.filename };
  }
  return { url: `/uploads/${file.filename}`, filename: file.filename };
}

module.exports.index = async (req, res) => {
const allListings = await Listing.find({});
res.render("listings/index.ejs", { allListings });

};

module.exports.renderNewForm = (req, res) => {
    res.render("listings/new");
  };

module.exports.showListing = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id)
      .populate({ path: "reviews", populate: { path: "author" } })
      .populate("owner");
      
    if (!listing) {
      req.flash("error", "Listing you requested for does not exist!");
      res.redirect("/listings");
    } else {
      console.log(listing);
      res.render("listings/show.ejs", { listing });
    }
  };

  module.exports.createListing = async (req, res) => {
        if (!req.file) {
          req.flash("error", "Please choose an image to upload.");
          return res.redirect("/listings/new");
        }
        const img = imageFromUpload(req.file);
        const newListing = new Listing(req.body.listing);
        newListing.owner=req.user._id;
        newListing.image = { url: img.url, filename: img.filename };
        await newListing.save();
        req.flash("success","New Listing Created!");
        res.redirect("/listings");
      };
  

      module.exports.renderEditForm = async (req, res) => {
        let { id } = req.params;
        const listing = await Listing.findById(id);
        if (!listing) {
          req.flash("error", "Listing you requested for does not exist!");
          return res.redirect("/listings");
        }

        let originalImageUrl = listing.image.url;
        if (typeof originalImageUrl === "string" && originalImageUrl.includes("cloudinary.com")) {
          originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_250");
        }
        res.render("listings/edit.ejs", { listing ,originalImageUrl});
      };
      

  module.exports.updateListing = async (req, res) => {
    let { id } = req.params;
    let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });
  
    if (typeof req.file !== "undefined") {
      const img = imageFromUpload(req.file);
      listing.image = { url: img.url, filename: img.filename };
      await listing.save();
    }
  
    req.flash("success", "Listing Updated!");
    res.redirect(`/listings/${id}`);
  };
  

    module.exports.destroyListing=async (req, res) => {
        const { id } = req.params;
        await Listing.findByIdAndDelete(id);
        req.flash("success","Listing Deleted!");
        res.redirect("/listings");
      };