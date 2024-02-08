const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const BookInstanceSchema = new Schema({
    book: { type: Schema.Types.ObjectId, ref: "Book", required: true },
    // reference to the associated book
    imprint: { type: String, required: true },
    status: {
        type: String,
        required: true,
        enum: ["Available", "Maintenance", "Loaned", "Reserved"],
        default: "Maintenance",
    },
    due_back: { type: Date, default: Date.now },
});

// virtual for bookInstance url
BookInstanceSchema.virtual("url").get(function() {
    // We don't use an arrow function as we'll need the this object
    return `/catalog/bookinstance/${this._id}`;
});

// export modal
module.exports = mongoose.model("BookInstance", BookInstanceSchema);