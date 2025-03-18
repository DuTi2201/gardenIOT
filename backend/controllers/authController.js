const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');
const { createResponse } = require('../utils/helpers');

// Tạo token JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// @desc    Đăng ký người dùng mới
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    console.log('Controller nhận được request body:', req.body);
    const { username, email, password, name } = req.body;

    // Kiểm tra dữ liệu đầu vào
    if (!username || !email || !password || !name) {
      console.log('Thiếu dữ liệu:', { username, email, password: password ? 'Có' : 'Không', name });
      return res.status(400).json(createResponse(false, 'Vui lòng cung cấp đầy đủ thông tin'));
    }

    // Kiểm tra xem username hoặc email đã tồn tại chưa
    const userExists = await User.findOne({ 
      $or: [{ username }, { email }] 
    });

    if (userExists) {
      return res.status(400).json(
        createResponse(false, 'Tên đăng nhập hoặc email đã tồn tại')
      );
    }

    // Tạo người dùng mới
    const user = await User.create({
      username,
      email,
      password,
      name,
      created_at: Date.now()
    });

    // Tạo token
    const token = generateToken(user._id);

    logger.info(`Người dùng mới đã đăng ký: ${username}`);

    res.status(201).json(
      createResponse(true, 'Đăng ký thành công', {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          name: user.name
        },
        token
      })
    );
  } catch (error) {
    logger.error(`Lỗi đăng ký: ${error.message}`);
    res.status(500).json(
      createResponse(false, 'Lỗi server', { error: error.message })
    );
  }
};

// @desc    Đăng nhập người dùng
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Tìm người dùng và lấy cả mật khẩu để so sánh
    const user = await User.findOne({ username }).select('+password');

    if (!user) {
      return res.status(401).json(
        createResponse(false, 'Tên đăng nhập hoặc mật khẩu không đúng')
      );
    }

    // Kiểm tra mật khẩu
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json(
        createResponse(false, 'Tên đăng nhập hoặc mật khẩu không đúng')
      );
    }

    // Cập nhật thời gian đăng nhập cuối
    user.last_login = Date.now();
    await user.save();

    // Tạo token
    const token = generateToken(user._id);

    logger.info(`Người dùng đã đăng nhập: ${username}`);

    res.json(
      createResponse(true, 'Đăng nhập thành công', {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          name: user.name
        },
        token
      })
    );
  } catch (error) {
    logger.error(`Lỗi đăng nhập: ${error.message}`);
    res.status(500).json(
      createResponse(false, 'Lỗi server', { error: error.message })
    );
  }
};

// @desc    Lấy thông tin người dùng
// @route   GET /api/auth/profile
// @access  Private
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json(
        createResponse(false, 'Không tìm thấy người dùng')
      );
    }

    res.json(
      createResponse(true, 'Lấy thông tin người dùng thành công', {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          name: user.name,
          created_at: user.created_at,
          last_login: user.last_login
        }
      })
    );
  } catch (error) {
    logger.error(`Lỗi lấy thông tin người dùng: ${error.message}`);
    res.status(500).json(
      createResponse(false, 'Lỗi server', { error: error.message })
    );
  }
};

// @desc    Cập nhật thông tin người dùng
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    const userId = req.user.id;

    // Kiểm tra xem email mới đã tồn tại chưa (nếu thay đổi email)
    if (email) {
      const emailExists = await User.findOne({ email, _id: { $ne: userId } });
      if (emailExists) {
        return res.status(400).json(
          createResponse(false, 'Email đã được sử dụng bởi tài khoản khác')
        );
      }
    }

    // Cập nhật thông tin
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { name, email },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json(
        createResponse(false, 'Không tìm thấy người dùng')
      );
    }

    logger.info(`Người dùng ${req.user.username} đã cập nhật thông tin cá nhân`);

    res.json(
      createResponse(true, 'Cập nhật thông tin thành công', {
        user: {
          id: updatedUser._id,
          username: updatedUser.username,
          email: updatedUser.email,
          name: updatedUser.name
        }
      })
    );
  } catch (error) {
    logger.error(`Lỗi cập nhật thông tin người dùng: ${error.message}`);
    res.status(500).json(
      createResponse(false, 'Lỗi server', { error: error.message })
    );
  }
};

// @desc    Đổi mật khẩu
// @route   PUT /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Kiểm tra mật khẩu hiện tại
    const user = await User.findById(userId).select('+password');

    if (!user) {
      return res.status(404).json(
        createResponse(false, 'Không tìm thấy người dùng')
      );
    }

    const isMatch = await user.matchPassword(currentPassword);

    if (!isMatch) {
      return res.status(401).json(
        createResponse(false, 'Mật khẩu hiện tại không đúng')
      );
    }

    // Cập nhật mật khẩu mới
    user.password = newPassword;
    await user.save();

    logger.info(`Người dùng ${req.user.username} đã đổi mật khẩu`);

    res.json(
      createResponse(true, 'Đổi mật khẩu thành công')
    );
  } catch (error) {
    logger.error(`Lỗi đổi mật khẩu: ${error.message}`);
    res.status(500).json(
      createResponse(false, 'Lỗi server', { error: error.message })
    );
  }
}; 