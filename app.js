const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const ejsMate = require("ejs-mate");
const Campground = require("./models/campground");
const methodOverride = require("method-override");

mongoose.connect("mongodb://localhost:27017/campground", {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
});

const app = express();

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("dbs connected");
});

app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));

app.get("/", (req, res) => {
    res.render("home");
});

app.get("/campgrounds", async(req, res) => {
    const campgrounds = await Campground.find({});
    res.render("campgrounds/index", { campgrounds });
});

app.get("/campgrounds/new", (req, res) => {
    res.render("campgrounds/new");
});

app.post("/campgrounds", async(req, res) => {
    const campground = new Campground(req.body.campground);
    await campground.save();
    res.redirect("campgrounds");
});

app.get("/campgrounds/:id/edit", async(req, res) => {
    const campground = await Campground.findById(req.params.id);
    res.render("campgrounds/edit", { campground });
});

app.put("/campgrounds/:id", async(req, res) => {
    const { id } = req.params;
    console.log(req.body);
    const updateCamp = await Campground.findByIdAndUpdate(
        id, {...req.body.campground }, {
            runValidators: true,
            new: true,
        }
    );
    res.redirect(`/campgrounds/${updateCamp._id}`);
});

app.get("/campgrounds/:id", async(req, res) => {
    const campground = await Campground.findById(req.params.id);
    res.render("campgrounds/show", { campground });
});

app.delete("/campgrounds/:id", async(req, res) => {
    const { id } = req.params;
    console.log(id);
    const deleteCamp = await Campground.findByIdAndDelete(id);
    res.redirect("/campgrounds");
});

app.listen(3000, () => {
    console.log("serving on port 3000");
});