const path = require('path');
const fs = require('fs/promises');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');
const { PNG } = require('pngjs');
const pixelmatch = require('pixelmatch');

const pool = require('../config/db');

const IMAGE_DIR = path.join(__dirname, '..', '..', 'uploads', 'images');
const QR_DIR = path.join(__dirname, '..', '..', 'uploads', 'qr_codes');

const ensureDirs = async () => {
  await fs.mkdir(IMAGE_DIR, { recursive: true });
  await fs.mkdir(QR_DIR, { recursive: true });
};

const saveBase64Image = async (dataUrl, filename) => {
  const matches = dataUrl.match(/^data:image\/(png|jpeg);base64,(.+)$/);
  if (!matches) {
    throw new Error('Invalid image data.');
  }
  const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
  const buffer = Buffer.from(matches[2], 'base64');
  const filePath = path.join(IMAGE_DIR, `${filename}.${ext}`);
  await fs.writeFile(filePath, buffer);
  return { filePath, ext };
};

const compareImages = async (storedPath, incomingDataUrl) => {
  const incomingBuffer = Buffer.from(incomingDataUrl.split(',')[1], 'base64');
  const [storedImage, incomingImage] = await Promise.all([
    fs.readFile(storedPath).then((data) => PNG.sync.read(data)),
    Promise.resolve(PNG.sync.read(incomingBuffer))
  ]);

  if (storedImage.width !== incomingImage.width || storedImage.height !== incomingImage.height) {
    return 0;
  }

  const diff = new PNG({ width: storedImage.width, height: storedImage.height });
  const mismatchedPixels = pixelmatch(
    storedImage.data,
    incomingImage.data,
    diff.data,
    storedImage.width,
    storedImage.height,
    { threshold: 0.2 }
  );

  const totalPixels = storedImage.width * storedImage.height;
  const similarity = 1 - mismatchedPixels / totalPixels;
  return similarity;
};

const signup = async (req, res) => {
  try {
    await ensureDirs();
    const { username, password, imageData } = req.body;

    if (!username || !password || !imageData) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    const [existing] = await pool.execute('SELECT user_id FROM users WHERE username = ?', [username]);
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Username already exists.' });
    }

    const userId = uuidv4();
    const passwordHash = await bcrypt.hash(password, 10);

    const { filePath: imagePath } = await saveBase64Image(imageData, `user_${userId}`);

    const qrToken = uuidv4();
    const qrImagePath = path.join(QR_DIR, `qr_${userId}.png`);
    const qrPayload = JSON.stringify({ userId, qrToken });
    await QRCode.toFile(qrImagePath, qrPayload, {
      color: { dark: '#111827', light: '#ffffff' },
      width: 320
    });

    await pool.execute(
      'INSERT INTO users (user_id, username, password_hash, image_path, qr_token, qr_image_path) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, username, passwordHash, imagePath, qrToken, qrImagePath]
    );

    return res.status(201).json({
      message: 'Signup successful. QR code generated.',
      qrImageUrl: `/uploads/qr_codes/qr_${userId}.png`,
      userId
    });
  } catch (error) {
    return res.status(500).json({ message: 'Signup failed.', error: error.message });
  }
};

const loginCamera = async (req, res) => {
  try {
    const { username, imageData } = req.body;
    if (!username || !imageData) {
      return res.status(400).json({ message: 'Username and image are required.' });
    }

    const [rows] = await pool.execute('SELECT user_id, image_path FROM users WHERE username = ?', [username]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const user = rows[0];
    const similarity = await compareImages(user.image_path, imageData);

    if (similarity < 0.85) {
      return res.status(401).json({ message: 'Face authentication failed.' });
    }

    const token = jwt.sign({ userId: user.user_id }, process.env.JWT_SECRET || 'change-this-secret', {
      expiresIn: '2h'
    });

    return res.json({ message: 'Camera login successful.', token, similarity });
  } catch (error) {
    return res.status(500).json({ message: 'Camera login failed.', error: error.message });
  }
};

const loginQr = async (req, res) => {
  try {
    const { qrData } = req.body;
    if (!qrData) {
      return res.status(400).json({ message: 'QR data is required.' });
    }

    let payload;
    try {
      payload = JSON.parse(qrData);
    } catch (parseError) {
      return res.status(400).json({ message: 'Invalid QR code payload.' });
    }

    const { userId, qrToken } = payload;
    const [rows] = await pool.execute(
      'SELECT user_id FROM users WHERE user_id = ? AND qr_token = ?',
      [userId, qrToken]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: 'QR code authentication failed.' });
    }

    const token = jwt.sign({ userId }, process.env.JWT_SECRET || 'change-this-secret', {
      expiresIn: '2h'
    });

    return res.json({ message: 'QR login successful.', token });
  } catch (error) {
    return res.status(500).json({ message: 'QR login failed.', error: error.message });
  }
};

module.exports = {
  signup,
  loginCamera,
  loginQr
};
