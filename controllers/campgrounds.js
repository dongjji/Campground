const Campground = require("../models/campground");
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const mapBoxToken = process.env.MAPBOX_TOKEN;
const geocoder = mbxGeocoding({ accessToken: mapBoxToken });
const { cloudinary } = require("../cloudinary");

module.exports.index = async (req, res, next) => {
  const campgrounds = await Campground.find({});
  res.render("campgrounds/index", { campgrounds });
};

module.exports.renderNewForm = (req, res) => {
  res.render("campgrounds/new");
};

module.exports.post = async (req, res, next) => {
  // if (!req.body.campground)
  //   throw new ExpressError("inavlid campground data", 400);
  const geoData = await geocoder
    .forwardGeocode({
      query: req.body.campground.location,
      limit: 1,
    })
    .send();
  const campground = new Campground(req.body.campground);
  campground.geometry = geoData.body.features[0].geometry;
  campground.images = req.files.map((f) => ({
    url: f.path,
    filename: f.filename,
  }));
  campground.author = req.user._id;
  await campground.save();
  req.flash("success", "Successfully made a new campground");
  res.redirect("/campgrounds");
};

module.exports.edit = async (req, res, next) => {
  const { id } = req.params;
  const campground = await Campground.findById(id);
  if (!campground) {
    req.flash("error", "there is no campground");
    return res.redirect("/campgrounds");
  }
  res.render("campgrounds/edit", { campground });
};

module.exports.put = async (req, res, next) => {
  const { id } = req.params;
  const updateCamp = await Campground.findByIdAndUpdate(
    id,
    { ...req.body.campground },
    {
      runValidators: true,
      new: true,
    }
  );
  const imgs = req.files.map((f) => ({
    url: f.path,
    filename: f.filename,
  }));
  updateCamp.images.push(...imgs);
  if (req.body.deleteImages) {
    for (let filename of req.body.deleteImages) {
      await cloudinary.uploader.destroy(filename);
    }
    await updateCamp.updateOne({
      $pull: { images: { filename: { $in: req.body.deleteImages } } },
    });
  }
  await updateCamp.save();
  req.flash("success", "Successfully updated the campground!!");
  res.redirect(`/campgrounds/${updateCamp._id}`);
};

module.exports.show = async (req, res) => {
  const campground = await Campground.findById(req.params.id)
    .populate({ path: "reviews", populate: { path: "author" } })
    .populate("author");
  if (!campground) {
    req.flash("error", "there is no campground");
    return res.redirect("/campgrounds");
  }
  let reviewAverage = 0;
  for (let i = 0; i < campground.reviews.length; i++) {
    reviewAverage += campground.reviews[i].rating;
  }
  reviewAverage = (reviewAverage / campground.reviews.length).toFixed(2);
  res.render("campgrounds/show", { campground, reviewAverage });
};

module.exports.delete = async (req, res, next) => {
  const { id } = req.params;
  const deleteCamp = await Campground.findByIdAndDelete(id);
  if (deleteCamp.images) {
    for (let image of deleteCamp.images) {
      await cloudinary.uploader.destroy(image.filename);
    }
  }
  req.flash("success", "Successfully delete it!!");
  res.redirect("/campgrounds");
};
