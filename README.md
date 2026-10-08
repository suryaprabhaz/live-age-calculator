# Real-Time Facial Age Estimation

A browser-based computer-vision experiment that detects faces and estimates age and gender locally using face-api.js.

## Highlights

- Local browser processing
- SSD MobileNet face detection
- Age/gender estimation
- Temporal smoothing with median filtering and EMA
- Responsive webcam UI
- Camera lifecycle cleanup
- Graceful model and detection failure handling

## Important limitations

The estimates are **probabilistic**, not measurements of a person's actual age or identity. Results can vary substantially with lighting, pose, camera quality, occlusion, training-data limitations and model bias.

The project should be described as **facial age estimation**, not an accurate age calculator.

## Privacy

Camera frames are intended to remain in the browser. No account or server-side image processing is required.

See [SECURITY.md](SECURITY.md).

## Local development

```bash
git clone https://github.com/suryaprabhaz/live-age-calculator.git
cd live-age-calculator
python -m http.server 5500
```

Open `http://localhost:5500` and grant camera permission.

## Author

[@suryaprabhaz](https://github.com/suryaprabhaz)
