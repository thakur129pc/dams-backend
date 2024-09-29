import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["0", "1", "2", "3"],
    default: "0",
  },
});

// Static method for user signup
userSchema.statics.signup = async function (
  name,
  username,
  password,
  role
) {
  // Validate role
  const validRoles = ["0", "1", "2", "3"];
  if (!validRoles.includes(role)) {
    throw new Error("Invalid role");
  }

  // Check if username already exists
  const usernameExists = await this.findOne({ username });
  if (usernameExists) {
    throw new Error("Username already in use");
  }

  // Hash the password
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);

  // Create and return the new user
  const user = await this.create({
    name,
    username,
    password: hash,
    role,
  });
  return user;
};

// Static method for user login
userSchema.statics.login = async function (username, password, role) {
  // Find a user with the specified username and role
  const user = await this.findOne({ username, role });

  if (!user) {
    throw new Error("Invalid username or password");
  }

  // Check if the password matches
  const match = await bcrypt.compare(password, user.password);

  if (!match) {
    throw new Error("Invalid username or password");
  }

  return user;
};

const User = mongoose.model("User", userSchema);

export default User;
