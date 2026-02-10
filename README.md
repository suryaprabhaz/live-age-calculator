# Live Age Estimation - AI Powered

![GitHub stars](https://img.shields.io/github/stars/suryaprabhaz/live-age-calculator?style=social)
![GitHub forks](https://img.shields.io/github/forks/suryaprabhaz/live-age-calculator?style=social)
![GitHub license](https://img.shields.io/github/license/suryaprabhaz/live-age-calculator)

A real-time, privacy-focused web application that detects faces and estimates age and gender directly in the browser using AI. Developed by [@suryaprabhaz](https://github.com/suryaprabhaz).

## 🚀 Features

- **Real-Time Detection**: Instantly detects faces from the webcam feed.
- **Privacy First**: All processing happens locally in your browser using `face-api.js`. No images are sent to any server.
- **Smart Smoothing**: Uses median filtering and exponential moving average (EMA) to provide stable age estimates, reducing jitter.
- **Glassmorphism UI**: A modern, sleek interface with a responsive mirror-like experience.
- **High Accuracy**: Optimized for 720p resolution with SSD MobileNet V1 models.

## 🛠️ Technologies Used

- **HTML5 / CSS3**: For structure and the glassmorphism design.
- **JavaScript (ES6+)**: Core logic and canvas manipulation.
- **[face-api.js](https://github.com/justadudewhohacks/face-api.js)**: TensorFlow.js powered face detection API.

## 📦 Installation

This project is a static web application. You can run it using any static file server.

### Local Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/suryaprabhaz/live-age-calculator.git
   cd live-age-calculator
   ```

2. **Download Models**
   Ensure you have the `models` directory populated with the required model shards and manifests. 
   *(Note: If models are not included in the repo due to size, download them from the face-api.js repository and place them in `/models`)*.

3. **Run a local server**
   Due to browser security restrictions with cameras and file access, you must serve the files via a local server (not just opening index.html).
   
   Using Python:
   ```bash
   python -m http.server 5500
   ```
   
   Using VS Code:
   Install the "Live Server" extension and click "Go Live".

4. **Open in Browser**
   Navigate to `http://localhost:5500` (or the port provided by your server).

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 👤 Author

**Surya Prabha**
- GitHub: [@suryaprabhaz](https://github.com/suryaprabhaz)

## 📄 License

This project is [MIT](LICENSE) licensed.

---
*Disclaimer: Age estimation is AI-based and may not be 100% accurate. Factors like lighting, angles, and facial expressions can affect results.*
