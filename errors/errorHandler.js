function errorHandler(res, name, data) {
  try {
    switch (name) {
      // 400
      case "BOOKING_INEXISTANT": return res.status(400).send({ error: { message: "This booking does not exist." }});
      case "VALIDATION_FAIL": return res.status(400).send({ error: { path: data.path[0], type: data.type, message: data.message }});
      case "INVALID_CREDENTIALS": return res.status(400).send({ error: { message: "Invalid email or password." }});
      case "EMAIL_IN_USE": return res.status(400).send({ error: { message: "The email provided is already in use." }});
      case "INVALID_TOKEN": return res.status(400).send({ error: { message: "Invalid token." }});
      // 401
      case "USER_DISABLED": return res.status(401).send({ error: { message: "Your account has been disabled." }});
      case "NO_TOKEN": return res.status(401).send({ error: { message: "Access denied. No token provided." }});
      case "UNAUTHORIZED": return res.status(401).send({ error: { message: "You are not authorized to perform this action." }});
      // 404
      case "USER_NOT_FOUND": return res.status(404).send({ error: { message: "User not found." }});
      case "INVALID_OBJECT_ID": return res.status(404).send({ error: { message: "The ID is not valid." }});
      // 410
      case "BOOKING_UNAVAILABLE": return res.status(410).send({ error: { message: "The slot is not available." }});
      default: return res.status(500).send({ error: { message: "Something on the server failed." }});
    }
  } catch(err) {
    // console.log(err);
    console.log("ex")
    throw new Error(err);
  }
}

module.exports = errorHandler;