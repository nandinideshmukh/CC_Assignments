const mongoose = require("mongoose");

const RegistrationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  event: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model(
  "Registration",
  RegistrationSchema
);