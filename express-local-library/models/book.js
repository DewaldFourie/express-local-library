const mongoose =  require("mongoose");

const Schema = mongoose.Schema;

const BookSchema = new Schema({
    title: { type: String, required: true },
    author: { type: Schema.Types.ObjectId, ref: "Author", required: true },
    summary: { type: String, required: true },
    isbn: { type: String, required: true },
    genre: [{ type: Schema.Types.ObjectId, ref: "Genre" }],
});

// virtual for book's url
BookSchema.virtual("url").get(function () {
    // We don't use an arrow function as we'll need the this object
    return `/catalog/book/${this._id}`;
});

BookSchema.virtual("due_back_formatted").get(function() {
    return DateTime.fromJSDate(this.due_back).toLocaleString(DateTime.DATE_MED);
});

// Export Model
module.exports = mongoose.model("Book", BookSchema);

