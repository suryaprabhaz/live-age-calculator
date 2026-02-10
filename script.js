/**
 * Live AI Age Estimation
 * Developed by @suryaprabhaz
 * GitHub: https://github.com/suryaprabhaz
 */
const video = document.getElementById('video');
const loading = document.getElementById('loading');

// Load models from local ./models directory
const MODEL_URL = './models';

Promise.all([
    faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL), // Higher accuracy than TinyFace
    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
    faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL)
]).then(startVideo).catch(err => {
    console.error("AI Model Loading Error:", err);
    alert(`Could not load AI models.\n\nError: ${err.message}\n\nPlease check the browser console (F12) for details.\nEnsure 'models' folder has .shard and .json files.`);
});

// Helper for Median
function getMedian(values) {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    if (sorted.length % 2 === 0) {
        return (sorted[mid - 1] + sorted[mid]) / 2;
    }
    return sorted[mid];
}

// Face Tracking System to smooth age predictions
class FaceTracker {
    constructor() {
        this.faces = []; // { id, ageBuffer: [], genderHistory: [], lastSeen: timestamp, box: {x,y,w,h}, stableAge: number, detectionScore: number }
        this.nextId = 1;
        this.maxBuffer = 20; // Frame history for smoothing (approx 2 seconds @ 10fps)
        this.maxLostTime = 1000; // ms to keep tracking a lost face
    }

    update(detections) {
        const now = Date.now();

        // 1. Mark existing faces as potentially lost (will be updated if matched)
        this.faces.forEach(f => f.matched = false);

        // 2. Match detections to existing faces
        detections.forEach(det => {
            const box = det.detection.box;
            const center = { x: box.x + box.width / 2, y: box.y + box.height / 2 };

            let bestMatch = null;
            let minDist = Infinity;

            this.faces.forEach(face => {
                const fCenter = { x: face.box.x + face.box.width / 2, y: face.box.y + face.box.height / 2 };
                const dist = Math.sqrt(Math.pow(center.x - fCenter.x, 2) + Math.pow(center.y - fCenter.y, 2));

                // Threshold: movement should not be excessive between frames
                // 150px is generous for 720p webcam movement
                if (dist < 150 && dist < minDist) {
                    minDist = dist;
                    bestMatch = face;
                }
            });

            if (bestMatch) {
                // Update existing face
                bestMatch.lastSeen = now;
                bestMatch.box = box; // Update position
                bestMatch.matched = true;
                bestMatch.detectionScore = det.detection.score;

                // Add to buffers
                bestMatch.ageBuffer.push(det.age);
                if (bestMatch.ageBuffer.length > this.maxBuffer) bestMatch.ageBuffer.shift();

                bestMatch.genderHistory.push(det.gender);
                if (bestMatch.genderHistory.length > this.maxBuffer) bestMatch.genderHistory.shift();

                // Advanced Smoothing:
                // 1. Calculate Median from buffer (robust to outliers)
                const medianAge = getMedian(bestMatch.ageBuffer);

                // 2. Apply Exponential Moving Average (EMA) for smooth visual transitions
                // alpha = 0.1 means 10% weight to new value, 90% to old value (slow changes)
                const alpha = 0.15;
                if (!bestMatch.stableAge) bestMatch.stableAge = medianAge;
                else bestMatch.stableAge = (alpha * medianAge) + ((1 - alpha) * bestMatch.stableAge);

            } else {
                // New face detected
                this.faces.push({
                    id: this.nextId++,
                    ageBuffer: [det.age],
                    genderHistory: [det.gender], // Store raw gender strings
                    lastSeen: now,
                    box: box,
                    matched: true,
                    stableAge: det.age,
                    detectionScore: det.detection.score
                });
            }
        });

        // 3. Remove old faces that haven't been seen for a while
        this.faces = this.faces.filter(f => now - f.lastSeen < this.maxLostTime);

        return this.faces;
    }

    getDominantGender(history) {
        if (!history || history.length === 0) return 'unknown';
        const counts = {};
        let maxCount = 0;
        let dominant = history[0];

        for (const g of history) {
            counts[g] = (counts[g] || 0) + 1;
            if (counts[g] > maxCount) {
                maxCount = counts[g];
                dominant = g;
            }
        }
        return dominant;
    }
}

const tracker = new FaceTracker();

function startVideo() {
    // Prefer HD resolution (1280x720) for better detection details
    const constraints = {
        video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user"
        }
    };

    navigator.mediaDevices.getUserMedia(constraints)
        .then(stream => {
            video.srcObject = stream;
            if (loading) loading.classList.add('hidden');
        })
        .catch(err => {
            console.warn("HD Video failed, falling back to default.", err);
            navigator.mediaDevices.getUserMedia({ video: {} })
                .then(stream => {
                    video.srcObject = stream;
                    if (loading) loading.classList.add('hidden');
                })
                .catch(e => console.error("Camera access denied:", e));
        });
}

video.addEventListener('play', () => {
    const canvas = faceapi.createCanvasFromMedia(video);
    document.querySelector('.video-container').append(canvas);

    const displaySize = { width: video.clientWidth, height: video.clientHeight };
    faceapi.matchDimensions(canvas, displaySize);

    setInterval(async () => {
        // High confidence threshold to avoid false positives (ghost faces)
        // With smoothing, we can afford to miss a frame or two if confidence is low
        const detections = await faceapi.detectAllFaces(video, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
            .withFaceLandmarks()
            .withAgeAndGender();

        const resizedDetections = faceapi.resizeResults(detections, displaySize);

        // Update Tracker Logic
        const trackedFaces = tracker.update(resizedDetections);

        // Draw Logic
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        trackedFaces.forEach(face => {
            // Only draw if recently updated (prevents ghosting of lost faces)
            if (Date.now() - face.lastSeen > 200) return;

            const box = face.box;
            // Mirror the X coordinate for drawing because the video is mirrored via CSS
            // but the canvas is NOT mirrored (to keep text readable).
            // Original X is from left. Mirrored X = Width - X - BoxWidth
            const mirroredX = canvas.width - box.x - box.width;

            const age = Math.round(face.stableAge); // Use the smoothed age
            const gender = tracker.getDominantGender(face.genderHistory);
            const score = Math.round(face.detectionScore * 100);

            // Box Styles
            ctx.strokeStyle = '#00ffcc';
            ctx.lineWidth = 3;
            // Add "Corners" effect or simple box
            ctx.strokeRect(mirroredX, box.y, box.width, box.height);

            // Label Background
            const text = `Age: ${age} (${gender}) | ${score}%`;
            ctx.font = 'bold 16px "Segoe UI", sans-serif';
            const textWidth = ctx.measureText(text).width;
            const textHeight = 24;

            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.roundRect
                ? ctx.roundRect(mirroredX, box.y - textHeight - 10, textWidth + 20, textHeight + 6, 5)
                : ctx.fillRect(mirroredX, box.y - textHeight - 10, textWidth + 20, textHeight + 6);
            if (ctx.roundRect) ctx.fill(); // roundRect needs explicit fill

            // Text
            ctx.fillStyle = '#00ffcc';
            ctx.textBaseline = 'top';
            ctx.fillText(text, mirroredX + 10, box.y - textHeight - 7);
        });

    }, 100); // 100ms = 10 FPS (Balance between CPU usage and smoothness)
});
