import jwt from 'jsonwebtoken';
import User from '../webModel/webUserDetails.js'; // Ensure the path is correct

// Helper function to create a token
const createToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET_KEY, { expiresIn: '7d' });
};

// Login user
const loginUser = async (req, res) => {
  const { username, password, role } = req.body;

  if (!username || !password || !role) {
    return res.status(400).json({
      success: false, 
      message: 'Username, password, and role are required.'
    });
  }

  try {
    const user = await User.login(username, password, role);

    // Create token with the role
    const token = createToken(user._id, user.role);

    res.status(200).json({
      success: true,
      message: "Login successfully",
      user: {
        name: user.name,
        username: username,
        id: user._id,
        role: user.role,
        token: token
      }
    });
  } catch (err) {
    res.status(400).json({
      success: false, 
      message: err.message 
    });
  }
};


// Signup user
const signupUser = async (req, res) => {
  const { name, phoneNumber, username, password, role } = req.body;

  if (!name || !phoneNumber || !username || !password || !role) {
    return res.status(400).json({ error: 'Name, phoneNumber, username, password, and role are required.' });
  }

  try {
    // Create the user
    const user = await User.signup(name, phoneNumber, username, password, role);

    // Create a token with the role
    const token = createToken(user._id, user.role);

    res.status(200).json({ userid: user._id, name, phoneNumber, username, role: user.role, token });
  } catch (err) {
    console.log(err);
    res.status(400).json({ error: err.message });
  }
};

export { loginUser, signupUser };
