const BookInstance = require("../models/bookinstance");
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");
const Book = require("../models/book");

// Display list of all BookInstances.
exports.bookinstance_list = asyncHandler(async (req, res, next) => {
    const allBookInstances = await BookInstance.find().populate("book").exec();

    res.render("book_instance_list", {
        title: "Book Instance List",
        bookinstance_list: allBookInstances
    });
});

// Display detail page for a specific BookInstance.
exports.bookinstance_detail = asyncHandler(async (req, res, next) => {
    const bookInstance = await BookInstance.findById(req.params.id)
        .populate("book")
        .exec();

    if (bookInstance === null) {
        const err = new Error("Book Copy not found.");
        err.status(404);
        return next(err);
    }

    res.render("book_instance_detail", {
        title: "Book",
        bookinstance: bookInstance,
    }); 
});

// Display BookInstance create form on GET.
exports.bookinstance_create_get = asyncHandler(async (req, res, next) => {
    const allBooks = await Book.find({}, "title")
        .sort({ title: 1 })
        .exec()

    // Define dynamic status list
    const status_list = ['Maintenance', 'Available', 'Loaned', 'Reserved'];


    res.render("bookinstance_form", {
        title: "Create BookInstance",
        book_list: allBooks,
        status_list: status_list,
    });
});

// Handle BookInstance create on POST.
exports.bookinstance_create_post = [
    // validate and sanitize fields
    body("book", "Book must be specified.")
        .trim()
        .isLength({ min: 1 })
        .escape(),
    body("imprint", "imprint must be specified.")
        .trim()
        .isLength({ min: 1 })
        .escape(),
    body("status").escape(),
    body("due_back", "Invalid date.")
        .optional({ values: "falsy" })
        .isISO8601()
        .toDate(),
    
    // Process request after validation and sanitization
    asyncHandler(async (req, res, next) => {
        //Extract the validation and sanitization.
        const errors = validationResult(req);

        // Create a BookInstance Object with escaped and trimmed data
        const bookInstance = new BookInstance({
            book: req.body.book,
            imprint: req.body.imprint,
            status: req.body.status,
            due_back: req.body.due_back,
        });

        if (!errors.isEmpty()) {
            // There are errors
            // Render form again with sanitized values and error msgs
            const allBooks = await Book.find({}, "title")
                .sort({ title: 1 })
                .exec()

            const status_list = ['Maintenance', 'Available', 'Loaned', 'Reserved'];

            res.render("bookinstance_form", {
                title: "Create BookInstance",
                book_list: allBooks,
                status_list: status_list,
                selected_book: bookInstance.book._id,
                errors: errors.array(),
                bookinstance: bookInstance,
            });
            return;
        }
        else {
            // Data from form is valid
            await bookInstance.save();
            res.redirect(bookInstance.url);
        }
    }),
]



// Display BookInstance delete form on GET.
exports.bookinstance_delete_get = asyncHandler(async (req, res, next) => {
    // get details of bookInstance
    const bookInstance = await BookInstance.findById(req.params.id).exec();

    if (bookInstance === null) {
        // no result
        res.redirect("/catalog/bookinstances");
    }

    res.render("bookInstance_delete", {
        title: "Delete BookInstance",
        bookInstance: bookInstance,
    });
});

// Handle BookInstance delete on POST.
exports.bookinstance_delete_post = asyncHandler(async (req, res, next) => {
    
    // Delete object and redirect to list of bookInstances
    await BookInstance.findByIdAndDelete(req.body.bookInstanceid);
    res.redirect("/catalog/bookinstances");
});

// Display BookInstance update form on GET.
exports.bookinstance_update_get = asyncHandler(async (req, res, next) => {
    res.send("NOT IMPLEMENTED: BookInstance update GET");
});

// Handle bookinstance update on POST.
exports.bookinstance_update_post = asyncHandler(async (req, res, next) => {
    res.send("NOT IMPLEMENTED: BookInstance update POST");
});
