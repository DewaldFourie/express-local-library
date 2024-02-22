const Book = require("../models/book");
const Author = require("../models/author");
const Genre = require("../models/genre");
const BookInstance = require("../models/bookinstance");
const { body, validationResult } = require("express-validator");

const asyncHandler = require("express-async-handler");
const book = require("../models/book");
const genre = require("../models/genre");

exports.index = asyncHandler(async (req, res, next) => {
      // Get details of books, book instances, authors and genre counts (in parallel)
    const [
        numBooks,
        numBookInstances,
        numAvailableBookInstances,
        numAuthors,
        numGenres,
    ] = await Promise.all([                  // Because the queries for document counts are independent, 
        Book.countDocuments({}).exec(),                     // we use Promise.all, to run the in parallel                 
        BookInstance.countDocuments({}).exec(),
        BookInstance.countDocuments({ status: "Available" }).exec(),
        Author.countDocuments({}).exec(),
        Genre.countDocuments({}).exec(),
    ]);

    res.render("index", {
        title: "Local Library Home",
        book_count: numBooks,
        book_instance_count: numBookInstances,
        book_instance_available_count: numAvailableBookInstances,
        author_count: numAuthors,
        genre_count: numGenres,
    });
});

// Display list of all books.
/*The route handler calls the find() function on the Book model, 
// selecting to return only the title and author as we don't need the other fields 
//(it will also return the _id and virtual fields), and sorting the results by the title alphabetically using the sort() method. 
// We also call populate() on Book, specifying the author field—this will replace the stored book author id with the full author details. 
exec() is then daisy-chained on the end in order to execute the query and return a promise.*/
exports.book_list = asyncHandler(async (req, res, next) => {
    const allBooks = await Book.find({}, "title author")
        .sort({ title: 1 })
        .populate("author")
        .exec();

    res.render("book_list", { title: "Book List", book_list: allBooks })
});

// Display detail page for a specific book.
exports.book_detail = asyncHandler(async (req, res, next) => {
    const [book, bookInstances] = await Promise.all([
        Book.findById(req.params.id).populate("author").populate("genre").exec(),
        BookInstance.find({ book: req.params.id }).exec(),
    ]);

    if (book === null) {
        // No Results
        const err = new Error("Book not found");
        err.status = 404;
        return next(err)
    }

    res.render("book_detail", {
        title: book.title,
        book: book,
        book_instances: bookInstances,
    });
});

// Display book create form on GET.
exports.book_create_get = asyncHandler(async (req, res, next) => {
    // Get all authors and genres, which we can use for adding to book
    const [allAuthors, allGenres] = await Promise.all([
        Author.find().sort({ family_name: 1 }).exec(),
        Genre.find().sort({ name: 1 }).exec(),
    ]);

    res.render("book_form", {
        title: "Create Book",
        authors: allAuthors,
        genres: allGenres,
    });

});

// Handle book create on POST.
exports.book_create_post = [
    // convert genre to an array
    (req, res, next) => {
        if (!Array.isArray(req.body.genre)) {
            req.body.genre = typeof req.body.genre === "undefined" ? [] 
                : [req.body.genre]
        }
        next();
    }, 

    // validate and sanitize fields
    body("title", "Title must not be empty.")
        .trim()
        .isLength({ min: 1 })
        .escape(),
    body("author", "Author must not be empty.")
        .trim()
        .isLength({ min: 1 })
        .escape(),
    body("summary", "Summary must not be empty.")
        .trim()
        .isLength({ min: 1 })
        .escape(),
    body("isbn", "ISBN must not be empty.")
        .trim()
        .isLength({ min: 1 })
        .escape(),
    body("genre.*").escape(),

    // Process Request after Validation and sanitization
    asyncHandler(async (req, res, next) => {
        // Extract the validation errors from req
        const errors = validationResult(req);

        // Create a Book Object with escaped and trimmed data.
        const Book = new Book({
            title: req.body.title,
            author: req.body.author,
            summary: req.body.summary,
            isbn: req.body.isbn,
            genre: req.body.genre,
        });

        if (!errors.isEmpty()) {
            // There are errors, render form again with sanitized data

            // Get all authors and genres for form 
            const [allAuthors, allGenres] = await Promise.all([
                Author.find().sort({ family_name: 1 }).exec(),
                Genre.find().sort({ name: 1 }).exec(),
            ]);

            // Mark our selected genres as checked
            for (const genre of allGenres) {
                if (book.genre.includes(genre._id)) {
                    genre.checked = "true";
                }
            }

            res.render("book_form", {
                title: "Create Book",
                authors: allAuthors,
                genres: allGenres, 
                book: book, 
                errors: errors.array(),
            });
        }
        else {
            // Data from form is valid. save book.
            await book.save();
            res.redirect(book.url);
        }
    })
]

// Display book delete form on GET.
exports.book_delete_get = asyncHandler(async (req, res, next) => {
    // get details of book an all their bookInstances
    const [book, allBookInstances] = await Promise.all([
        Book.findById(req.params.id).exec(), 
        BookInstance.find({ book: req.params.id }, "imprint _id status").exec()
    ]);

    if (book === null) {
        // No results
        res.redirect("/catalog/books");
    }

    res.render("book_delete", {
        title: "Delete Book",
        book: book,
        book_instances: allBookInstances,
    });
});

// Handle book delete on POST.
exports.book_delete_post = asyncHandler(async (req, res, next) => {
    // Get all details of book and all their instances
    const [book, allBookInstances] = await Promise.all([
        Book.findById(req.params.id).exec(), 
        BookInstance.find({ book: req.params.id }, "imprint _id status").exec()
    ]);

    if (allBookInstances.length > 0) {
        // Book has Instances. render in the same way as the GET route
        res.render("book_delete", {
            title: "Delete Book",
            book: book,
            book_instances: allBookInstances,
        });
        return
    }
    else {
        // Book has no instances. Delete object and redirect to list of books
        await Book.findByIdAndDelete(req.body.bookid);
        res.redirect("/catalog/books")
    }
});

// Display book update form on GET.
exports.book_update_get = asyncHandler(async (req, res, next) => {
    // Get book, authors and genre for form
    const [book, allAuthors, allGenres] = await Promise.all([
        Book.findById(req.params.id).populate("author").exec(),
        Author.find().sort({ family_name: 1 }).exec(),
        Genre.find().sort({ name: 1 }).exec(),
    ]);

    if (book === null){
        // no results
        const err = new Error("Book not Found!");
        err.status = 404;
        return next(err)
    }

    // Mark our selected genres as checked
    allGenres.forEach((genre) => {
        if (book.genre.includes(genre._id)) genre.checked = "true";
    });

    res.render("book_form", {
        title: "Update Book",
        authors: allAuthors,
        genres: allGenres,
        book: book,
    });
});

// Handle book update on POST.
exports.book_update_post = [
    // Convert the genre to an array
    (req, res, next) => {
        if (!Array.isArray(req.body.genre)) {
            req.body.genre = typeof req.body.genre === 'undefined' ? [] : [req.body.genre];
        }
        next();
    },

    // Validate and sanitize fields
    body("title", "Title must not be empty.")
        .trim()
        .isLength({ min: 1 })
        .escape(),
    body("author", "Author must not be empty.")
        .trim()
        .isLength({ min: 1 })
        .escape(),
    body("summary", "Summary must not be empty.")
        .trim()
        .isLength({ min: 1 })
        .escape(),
    body("isbn", "ISBN must not be empty")
        .trim()
        .isLength({ min: 1 })
        .escape(),
    body("genre.*").escape(),

    // process request after validation & sanitization 
    asyncHandler(async (req, res, next) => {
        // Extract the validation errors from a request
        const errors = validationResult(req)

        // Create a Book object with escaped/trimmed data and old id
        const book = new Book({
            title: req.body.title,
            author: req.body.author,
            summary: req.body.summary,
            isbn: req.body.isbn,
            genre: typeof req.body.genre === 'undefined' ? [] : req.body.genre,
            _id: req.params.id,  //---- THIS IS REQUIRED OR A NEW ID WILL BE ASSIGNED ----//
        });

        if(!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values/error msgs
            
            // Get all authors and genres for form
            const [allAuthors, allGenres] = await Promise.all([
                Author.find().sort({ family_name: 1 }).exec(),
                Genre.find().sort({ name: 1 }).exec(),
            ]);

            // Mark our selected genres as checked.
            for (const genre of allGenres) {
                if (book.genre.indexOf(genre._id) > -1) {
                    genre.checked = "true"
                }
            }

            res.render("book_form", {
                title: "Update Book",
                authors: allAuthors,
                genres: allGenres,
                book: book,
                errors: errors.array(),
            });
            return
        }
        else {
            // Data from form is valid. Update the record.
            const updatedBook = await BookInstance.findByIdAndUpdate(req.params.id, book, {});
            // redirect to book detail page.
            res.redirect(updatedBook.url)
        }
    })
]
