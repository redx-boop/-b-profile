const signupForm = document.getElementById('signup-form');
const signupStart = document.getElementById('signup-start');
const signupVideo = document.getElementById('signup-video');
const signupCanvas = document.getElementById('signup-canvas');
const signupCountdown = document.getElementById('signup-countdown');
const signupResult = document.getElementById('signup-result');
const signupQrDisplay = document.getElementById('signup-qr-display');
const signupQrImage = document.getElementById('signup-qr-image');
const qrDownload = document.getElementById('qr-download');
const qrPrint = document.getElementById('qr-print');

const cameraLoginForm = document.getElementById('camera-login-form');
const loginStart = document.getElementById('login-start');
const loginVideo = document.getElementById('login-video');
const loginCanvas = document.getElementById('login-canvas');
const loginCountdown = document.getElementById('login-countdown');
const cameraLoginResult = document.getElementById('camera-login-result');

const qrStart = document.getElementById('qr-start');
const qrVideo = document.getElementById('qr-video');
const qrCanvas = document.getElementById('qr-canvas');
const qrLoginResult = document.getElementById('qr-login-result');

let signupStream;
let loginStream;
let qrStream;
let signupCapturedImage;
let loginCapturedImage;

const selectExternalCamera = async () => {
  const devices = await navigator.mediaDevices.enumerateDevices();
  const videoDevices = devices.filter((device) => device.kind === 'videoinput');
  if (!videoDevices.length) {
    throw new Error('No camera found.');
  }

  const external = videoDevices.find((device) => device.label.toLowerCase().includes('usb')) || videoDevices[0];
  return { deviceId: external.deviceId };
};

const startCamera = async (videoElement) => {
  const cameraConstraints = await selectExternalCamera();
  const stream = await navigator.mediaDevices.getUserMedia({
    video: {
      deviceId: cameraConstraints.deviceId,
      width: { ideal: 640 },
      height: { ideal: 480 }
    }
  });
  videoElement.srcObject = stream;
  return stream;
};

const captureImage = (videoElement, canvasElement) => {
  const context = canvasElement.getContext('2d');
  canvasElement.width = videoElement.videoWidth;
  canvasElement.height = videoElement.videoHeight;
  context.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
  return canvasElement.toDataURL('image/png');
};

const runCountdown = (counterElement, seconds = 3) => {
  counterElement.textContent = seconds;
  return new Promise((resolve) => {
    let remaining = seconds;
    const interval = setInterval(() => {
      remaining -= 1;
      counterElement.textContent = remaining;
      if (remaining === 0) {
        clearInterval(interval);
        resolve();
      }
    }, 1000);
  });
};

const handleError = (target, message) => {
  target.textContent = message;
  target.classList.add('error');
};

signupStart.addEventListener('click', async () => {
  signupResult.textContent = '';
  signupResult.classList.remove('error');
  try {
    signupStream = await startCamera(signupVideo);
    await runCountdown(signupCountdown);
    signupCapturedImage = captureImage(signupVideo, signupCanvas);
    signupResult.textContent = 'Image captured automatically. Submit to finish signup.';
  } catch (error) {
    handleError(signupResult, error.message);
  }
});

signupForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  signupResult.classList.remove('error');

  if (!signupCapturedImage) {
    handleError(signupResult, 'Please enable the camera first.');
    return;
  }

  const imageData = signupCapturedImage;
  const payload = {
    username: document.getElementById('signup-username').value.trim(),
    password: document.getElementById('signup-password').value,
    imageData
  };

  try {
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Signup failed.');
    }

    signupResult.textContent = data.message;
    signupQrDisplay.style.display = 'flex';
    signupQrImage.src = data.qrImageUrl;
    qrDownload.href = data.qrImageUrl;
  } catch (error) {
    handleError(signupResult, error.message);
  }
});

qrPrint.addEventListener('click', () => {
  const printWindow = window.open('', '_blank');
  printWindow.document.write(`<img src="${signupQrImage.src}" style="width:300px;height:300px" />`);
  printWindow.print();
});

loginStart.addEventListener('click', async () => {
  cameraLoginResult.textContent = '';
  cameraLoginResult.classList.remove('error');
  try {
    loginStream = await startCamera(loginVideo);
    await runCountdown(loginCountdown);
    loginCapturedImage = captureImage(loginVideo, loginCanvas);
    cameraLoginResult.textContent = 'Image captured automatically. Submit to login.';
  } catch (error) {
    handleError(cameraLoginResult, error.message);
  }
});

cameraLoginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  cameraLoginResult.classList.remove('error');

  if (!loginCapturedImage) {
    handleError(cameraLoginResult, 'Please enable the camera first.');
    return;
  }

  const imageData = loginCapturedImage;
  const payload = {
    username: document.getElementById('camera-username').value.trim(),
    imageData
  };

  try {
    const response = await fetch('/api/auth/login-camera', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Camera login failed.');
    }

    cameraLoginResult.textContent = `${data.message} (Similarity: ${(data.similarity * 100).toFixed(1)}%)`;
  } catch (error) {
    handleError(cameraLoginResult, error.message);
  }
});

const scanQrFrame = () => {
  if (!qrVideo.srcObject) return;
  const ctx = qrCanvas.getContext('2d');
  qrCanvas.width = qrVideo.videoWidth;
  qrCanvas.height = qrVideo.videoHeight;
  ctx.drawImage(qrVideo, 0, 0, qrCanvas.width, qrCanvas.height);
  const imageData = ctx.getImageData(0, 0, qrCanvas.width, qrCanvas.height);
  const code = jsQR(imageData.data, qrCanvas.width, qrCanvas.height);
  if (code) {
    handleQrLogin(code.data);
  } else {
    requestAnimationFrame(scanQrFrame);
  }
};

const handleQrLogin = async (qrData) => {
  qrLoginResult.classList.remove('error');
  try {
    const response = await fetch('/api/auth/login-qr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qrData })
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'QR login failed.');
    }

    qrLoginResult.textContent = data.message;
  } catch (error) {
    handleError(qrLoginResult, error.message);
  }
};

qrStart.addEventListener('click', async () => {
  qrLoginResult.textContent = '';
  qrLoginResult.classList.remove('error');
  try {
    qrStream = await startCamera(qrVideo);
    scanQrFrame();
  } catch (error) {
    handleError(qrLoginResult, error.message);
  }
});

window.addEventListener('beforeunload', () => {
  [signupStream, loginStream, qrStream].forEach((stream) => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
  });
});
