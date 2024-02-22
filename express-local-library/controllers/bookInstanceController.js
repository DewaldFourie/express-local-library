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
    // Get bookInstance and all books for form
    const [bookInstance, allBooks] = await Promise.all([
        BookInstance.findById(req.params.id).populate("book").exec(),
        Book.find(),
    ]);

    // Define dynamic status list
    const status_list = ['Maintenance', 'Available', 'Loaned', 'Reserved'];

    if (bookInstance === null) {
        // no results
        const err = new Error("Book Instance not Found!");
        err.status = 404
        return next(err)
    }

    res.render("bookinstance_form", {
        title: "Update BookInstance",
        bookinstance: bookInstance,
        book_list: allBooks,
        status_list: status_list,
        selected_book: bookInstance.book.id
    });
});

// Handle bookinstance update on POST.
exports.bookinstance_update_post = [
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

    // process request after validation and sanitization
    asyncHandler(async (req, res, next) => {
        // Extract the validation errors from request
        const errors = validationResult(req);

        // create a BookInstance object with escaped/trimmed data and old id
        const bookInstance = new BookInstance({
            book: req.body.book,
            imprint: req.body.imprint,
            status: req.body.status,
            due_back: req.body.due_back,
            _id: req.params.id //---- THIS IS REQUIRED OR A NEW ID WILL BE ASSIGNED ----//
        });

        if (!errors.isEmpty()) {
            // there are errors. Render form again with sanitized values/ error msgs

            const allBooks = await Book.find({}, "title").exec();

            res.render("bookinstance_form", {
                title: "Update BookInstance",
                bookinstance: bookInstance,
                book_list: allBooks,
                selected_book: bookInstance.book.id,
                errors: errors.array()
            });
            return
        }
        else {
             // Data from form is valid. Update the record.
            const updatedBookInstance = await BookInstance.findByIdAndUpdate(req.params.id, bookInstance, {});
            // redirect to book detail page.
            res.redirect(updatedBookInstance.url)
        }
    })


]



