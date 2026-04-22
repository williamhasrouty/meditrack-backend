const { isCelebrateError } = require("celebrate");

const errorHandler = (err, req, res, next) => {
  // Handle Celebrate validation errors
  if (isCelebrateError(err)) {
    const errorBody = {};
    for (const [segment, joiError] of err.details.entries()) {
      errorBody[segment] = joiError.details.map((detail) => ({
        message: detail.message,
        path: detail.path,
      }));
    }
    return res.status(400).send({
      message: "Validation failed",
      details: errorBody,
    });
  }

  const { statusCode = 500, message } = err;

  res.status(statusCode).send({
    message:
      statusCode === 500 ? "An error has occurred on the server" : message,
  });
};

module.exports = errorHandler;
