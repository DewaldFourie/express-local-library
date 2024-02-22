
const mongoose = require("mongoose");
const { DateTime } = require("luxon");

const Schema = mongoose.Schema;

const AuthorSchema = new Schema({
    first_name: { type: String, required: true, maxLength: 100 },
    family_name: { type: String, required: true, maxLength: 100 },
    date_of_birth: { type: Date },
    date_of_death: { type: Date },
});

// virtual for author's full name 
AuthorSchema.virtual("name").get(function() {
    // To avoid errors in cases where an author does not have either a family name or first name
    // We want to make sure we handle the exception by returning an empty string for that case
    let fullname = "";
    if (this.first_name && this.family_name) {
        fullname = `${this.family_name}, ${this.first_name}`
    }

    return fullname;
});

// virtual for Author's URL
AuthorSchema.virtual("url").get(function() {
    // We don't use an arrow function as we'll need the this object
    return `/catalog/author/${this._id}`;
});

AuthorSchema.virtual("dob_formatted").get(function() {
    return DateTime.fromJSDate(this.date_of_birth).toISODate(); // format 'YYYY-MM-DD
});

AuthorSchema.virtual("dod_formatted").get(function() {
    return DateTime.fromJSDate(this.date_of_death).toISODate(); // format 'YYYY-MM-DD'
});

AuthorSchema.virtual("lifespan").get(function() {
    let dob = ''
    let dod = ''
    let hyphen =' '
    if (this.date_of_birth) {
        dob = "Born: " + DateTime.fromJSDate(this.date_of_birth).toLocaleString(DateTime.DATE_MED)
    } else {
        dob = ""
    }
    if (this.date_of_death) {
        dod = "Died: " + DateTime.fromJSDate(this.date_of_death).toLocaleString(DateTime.DATE_MED)
        hyphen = " - "
    } else {
        dod = ""
    }

    let lifeSpan = `${dob} ${hyphen} ${dod}`
    return lifeSpan
})


// export model
module.exports = mongoose.model("Author", AuthorSchema);