module.exports = function httpError(httpStatusCode, message) {
  let err = new Error(message)
  err.httpStatus = httpStatusCode
  return err
}
