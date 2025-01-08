from flask import Flask, render_template, Response
import cv2

app = Flask(__name__)

# OpenCV webcam capture (you can replace this with a video file or any image processing logic)
def generate_frames():
    cap = cv2.VideoCapture(0)  # Start video capture from the webcam
    while True:
        success, frame = cap.read()  # Read a frame from the webcam
        if not success:
            break
        else:
            # Process the frame (optional)
            # Convert the image to JPEG format for web display
            ret, buffer = cv2.imencode('.jpg', frame)
            if ret:
                frame = buffer.tobytes()  # Convert to bytes
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n\r\n')
    cap.release()

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/video')
def video():
    return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

if __name__ == '__main__':
    app.run(debug=True)
