
const Genre = require("../models/genre");
const Book = require("../models/book")
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");

// Display list of all Genre.
exports.genre_list = asyncHandler(async (req, res, next) => {
    const allGenres = await Genre.find().sort({ name: 1 }).exec()

    res.render("genre_list", {
        title: "Genre List",
        genre_list: allGenres,
    });
});

// Display detail page for a specific Genre.
exports.genre_detail = asyncHandler(async (req, res, next) => {
    // get detail of genre and all associated books (in parallel)
    const [genre, booksInGenre] = await Promise.all([
        Genre.findById(req.params.id).exec(),
        Book.find({ genre: req.params.id }, "title summary").exec(),
    ]);
    if (genre === null) {
        // No results
        const err = new Error("Genre not found");
        err.status = 404;
        return next(err);
    }

    res.render("genre_detail", {
        title: "Genre Detail",
        genre: genre,
        genre_books: booksInGenre,
    })
});

// Display Genre create form on GET.
exports.genre_create_get = (req, res, next) => {
    res.render("genre_form", { title: "Create Genre" });
};

// Handle Genre create on POST.
exports.genre_create_post = [
    // Validate and sanitize the name field.
    body("name", "Genre name must contain at least 3 characters")
        .trim()
        .isLength({ min: 3 })
        .escape(),

    // Process the request after validation and sanitization.
    asyncHandler(async(req, res, next) => {
        // extract the validation errors from the request
        const errors = validationResult(req);

        // Create a genre object with escaped and trimmed data
        const genre = new Genre({ name: req.body.name });

        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values / error msgs
            res.render("genre_form", {
                title: "Create Genre",
                genre: genre,
                errors: errors.array()
            });
            return;
        } 
        else {
            // Data from form is valid.
            // Check if genre with same name already exists.
            const genreExists = await Genre.findOne({ name: req.body.name })
                .collation({ locale: "en", strength: 2 })
                .exec();
            if (genreExists) {
                // Genre exists, redirect to its detail page.
                res.redirect(genreExists.url);
            }
            else {
                await genre.save();
                // New Genre saved. Redirect to genre detail page.
                res.redirect(genre.url);
            }
        }
    }),
];

// Display Genre delete form on GET.
exports.genre_delete_get = asyncHandler(async (req, res, next) => {
    // get details of genre and all their books
    const [genre, allBooksByGenre] = await Promise.all([
        Genre.findById(req.params.id).exec(),
        Book.find({ genre: req.params.id }, "title summary").exec(),
    ]);

    if (genre === null) {
        // no results
        res.redirect("/catalog/genres")
    }

    res.render("genre_delete", {
        title: "Delete Genre",
        genre: genre,
        genre_books: allBooksByGenre,
    });
});

// Handle Genre delete on POST.
exports.genre_delete_post = asyncHandler(async (req, res, next) => {
    // get details of genre and all their books
    const [genre, allBooksByGenre] = await Promise.all([
        Genre.findById(req.params.id).exec(),
        Book.find({ genre: req.params.id }, "title summary").exec(),
    ]);

    if (allBooksByGenre.length > 0) {
        // Genre has books. Render in same way as for the GET route
        res.render("genre_delete", {
            title: "Delete Genre",
            genre: genre,
            genre_books: allBooksByGenre,
        });
        return
    }
    else {
        // Genre has no books. Delete object and redirect to list of genres
        await Genre.findByIdAndDelete(req.body.genreid);
        res.redirect("/catalog/genres");
    }
});

// Display Genre update form on GET.
exports.genre_update_get = asyncHandler(async (req, res, next) => {
    // get genre for from
    const genre = await (Genre.findById(req.params.id).exec());

    if (genre === null) {
        // no results
        err = new Error("Genre not Found!");
        err.status = 404;
        return next(err)
    }

    res.render("genre_form", {
        title: "Update Genre",
        genre: genre,
    });
});

// Handle Genre update on POST.
exports.genre_update_post = [
    // validate and sanitize fields
    body("name", "Genre name must contain at least 3 characters")
        .trim()
        .isLength({ min: 3 })
        .escape(),

    // process request after validation and sanitization
    asyncHandler(async (req, res, next) => {
        // extract the validation errors from request
        const errors = validationResult(req)

        // create a Genre object with escaped/trimmed data and old id
        const genre = new Genre({
            name: req.body.name,
            _id: req.params.id, //---- THIS IS REQUIRED OR A NEW ID WILL BE ASSIGNED ----//     
        });

        if(!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values/err msgs

            res.render("genre_form", {
                title: "Update Genre",
                genre: genre,
                errors: errors.array()
            });
            return
        }
        else {
            // data from form is valid. Update the record
            const updatedGenre = await Genre.findByIdAndUpdate(req.params.id, genre, {});
            // redirect to genre detail page
            res.redirect(updatedGenre.url)
        }
    })
]
