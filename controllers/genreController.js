const Genre = require('../models/genre');
const Book = require('../models/book')
const asyncHandler = require('express-async-handler');
const { body, validationResult } = require('express-validator')

exports.genre_list = asyncHandler(async (req, res, next) => {
	const allGenres = await Genre.find()
		.sort({ name: 1})
		.exec();
	res.render('genre_list', {
		title: "Genre List",
		genre_list: allGenres,
	})
})

exports.genre_detail = asyncHandler(async (req, res, next) => {
	const [ genre, booksInGenre ] = await Promise.all([
		Genre.findById(req.params.id).exec(),
		Book.find({ genre: req.params.id }, "title summary").exec(),
	])
	if(genre === null) {
		const err = new Error("Genre not found");
		err.status(400);
		return next(err);
	}

	res.render("genre_detail", {
		title: "Genre Detail",
		genre: genre,
		genre_books: booksInGenre,
	});
});

exports.genre_create_get = asyncHandler(async (req, res, next) => {
	res.render("genre_form", {title: "Create Genre"});
})

// Handle Genre create on POST.
exports.genre_create_post = [
  // Validate and sanitize the name field.
  body("name", "Genre name must contain at least 3 characters")
    .trim()
    .isLength({ min: 3 })
    .escape(),

  // Process request after validation and sanitization.
  asyncHandler(async (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create a genre object with escaped and trimmed data.
    const genre = new Genre({ name: req.body.name });

    if (!errors.isEmpty()) {
      // There are errors. Render the form again with sanitized values/error messages.
      res.render("genre_form", {
        title: "Create Genre",
        genre: genre,
        errors: errors.array(),
      });
      return;
    } else {
      // Data from form is valid.
      // Check if Genre with same name already exists.
      const genreExists = await Genre.findOne({ name: req.body.name }).exec();
      if (genreExists) {
        // Genre exists, redirect to its detail page.
        res.redirect(genreExists.url);
      } else {
        await genre.save();
        // New genre saved. Redirect to genre detail page.
        res.redirect(genre.url);
      }
    }
  }),
];



exports.genre_delete_get = asyncHandler(async (req, res, next) => {
	const [genre, allBooksByGenre] = await Promise.all([
    Genre.findById(req.params.id).exec(),
    Book.find({ genre: req.params.id }, "title summary").sort({ title: 1 }).exec(),
  ]);
  if(genre === null){
    res.redirect("/catalog/genres");
  }
  // res.json({ genre, allBooksByGenre });
  res.render("genre_delete", {
    title: "Delete Genre",
    genre: genre,
    genre_books: allBooksByGenre,
  });
})

exports.genre_delete_post = asyncHandler(async (req, res, next) => {
	const [genre, allBooksByGenre] = await Promise.all([
    Genre.findById(req.params.id).exec(),
    Book.find({ genre: req.params.id }, "title summary").sort({ title: 1}).exec(),
  ]);

  if(allBooksByGenre.length > 0){
    res.render("genre_delete", {
      title: "Delete Genre",
      genre: genre,
      genre_books: allBooksByGenre,
    });
    return;
  } else {
    console.log(req.body);
    await Genre.findByIdAndDelete(req.body.genre_id);
    res.redirect("/catalog/genres");
  }

}); 

exports.genre_update_get = asyncHandler(async (req, res, next) => {
	const genre = await Genre.findById(req.params.id).exec();
  if(genre === null){
    const err = new Error("Genre not found");
    err.status = 400;
    return next(err);
  }
  res.render("genre_form", {
    title: "Update Genre",
    genre: genre,
  });
});

exports.genre_update_post = [
  body("name", "Genre must be at least 3 characters")
    .trim()
    .isLength({ min: 3 })
    .escape(),
  
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    const genre = ({
      name: req.body.name,
      _id: req.params.id,
    });

    if(!errors.isEmpty()){
      res.render("genre_form", {
        title: "Update Genre",
        genre: genre,
        errors: errors.array(),
      });
      return;
    } else {
      const updatedGenre = await Genre.findByIdAndUpdate(req.params.id, genre);
      res.redirect(updatedGenre.url);
    }
  }),
];

