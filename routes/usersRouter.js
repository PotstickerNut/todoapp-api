const express = require("express");
const UserModel = require("../models/usersSchema");
// pulls out the two functions we need from express-validator
const { check, validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// * Create a Router
const router = express.Router();

//* Create or Register a new User
router.post(
  "/",
  [
    check("username", "Username is required from Middleware!").notEmpty(),
    check("email", "Please use a valid email from Middleware!").isEmail(),
    check(
      "password",
      "Please enter a password with 6 or more characters"
    ).notEmpty(),
    check(
      "password",
      "Please enter a password with 6 or more characters"
    ).isLength({ min: 6 }),
  ],
  async (req, res) => {
    const userData = req.body;
    const errors = validationResult(req);

    // Checks for validation errors
    if (!errors.isEmpty()) {
      return res.status(400).json(errors.array());
    }

    try {
      // Checking if there is a user with this email in the database
      const userExist = await UserModel.findOne({ email: userData.email });

      //If user exists we return!
      if (userExist) {
        return res.json({ msg: "User already exists!" });
      }

      //* ==== Create new user
      // 1 Create the salt
      const SALT = await bcrypt.genSalt(12);
      // 2 Use the salt to create a hash with the user password
      const hashedPassword = await bcrypt.hash(userData.password, SALT);
      // 3 assign the hashed password to the userData
      userData.password = hashedPassword;

      // Write the user to the DB
      const user = await UserModel.create(userData);

      //* Create a new JWT Token
      const payload = {
        id: user._id,
        email: user.email,
      };
      // const SECRET_KEY = "MY_SECRET_KEY";

      const TOKEN = jwt.sign(payload, process.env.SECRET_KEY, {
        expiresIn: "2 Days",
      });

      res.status(201).json({
        user: user,
        token: TOKEN,
      });
    } catch (error) {
      console.log(error);
      res.status(400).json("Bad request");
    }
  }
);

module.exports = router;
