from kivy.app import App
from kivy.uix.screenmanager import ScreenManager, Screen
from kivy.uix.boxlayout import BoxLayout
from kivy.uix.button import Button
from kivy.uix.label import Label
from kivy.uix.textinput import TextInput
from kivy.uix.camera import Camera
from kivy.clock import Clock
from kivy.graphics.texture import Texture
import cv2
import numpy as np
import pandas as pd
from plyer import notification, vibrator, sms
import random
import os

# Dummy database generation
def generate_dummy_database(original_df):
    dummy_df = original_df.copy()
    for col in dummy_df.select_dtypes(include=[np.number]).columns:
        dummy_df[col] = dummy_df[col] * (0.9 + 0.2 * np.random.random(len(dummy_df)))
    return dummy_df

# Load real data (simulated)
real_data = pd.read_csv("user_features_with_anomaly.csv") if os.path.exists("user_features_with_anomaly.csv") else pd.DataFrame()

class DashboardScreen(Screen):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        layout = BoxLayout(orientation='vertical')
        layout.add_widget(Label(text="SPi Dashboard"))
        layout.add_widget(Button(text="Live Detection", on_press=self.go_to_live))
        layout.add_widget(Button(text="Settings", on_press=self.go_to_settings))
        layout.add_widget(Button(text="Access Database", on_press=self.access_db))
        self.add_widget(layout)

    def go_to_live(self, instance):
        self.manager.current = 'live'

    def go_to_settings(self, instance):
        self.manager.current = 'settings'

    def access_db(self, instance):
        self.manager.current = 'pin'

class LiveDetectionScreen(Screen):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.layout = BoxLayout(orientation='vertical')
        self.camera = Camera(play=True, resolution=(640, 480))
        self.layout.add_widget(self.camera)
        self.layout.add_widget(Button(text="Back", on_press=self.go_back))
        self.add_widget(self.layout)
        Clock.schedule_interval(self.update, 1.0 / 30.0)  # 30 FPS

    def update(self, dt):
        # Face detection using OpenCV
        if self.camera.texture:
            buf = self.camera.texture.pixels
            img = np.frombuffer(buf, dtype=np.uint8).reshape((480, 640, 4))
            img = cv2.cvtColor(img, cv2.COLOR_RGBA2BGR)
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
            faces = face_cascade.detectMultiScale(gray, 1.1, 4)
            for (x, y, w, h) in faces:
                cv2.rectangle(img, (x, y), (x+w, y+h), (255, 0, 0), 2)
            # Update texture
            buf = cv2.flip(img, 0).tobytes()
            texture = Texture.create(size=(640, 480), colorfmt='bgr')
            texture.blit_buffer(buf, colorfmt='bgr', bufferfmt='ubyte')
            self.camera.texture = texture

    def go_back(self, instance):
        self.manager.current = 'dashboard'

class SettingsScreen(Screen):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        layout = BoxLayout(orientation='vertical')
        layout.add_widget(Label(text="Settings"))
        layout.add_widget(Button(text="Simulate Attack", on_press=self.simulate_attack))
        layout.add_widget(Button(text="Back", on_press=self.go_back))
        self.add_widget(layout)

    def simulate_attack(self, instance):
        # Simulate attack detection
        notification.notify(title="Security Alert", message="Attack detected! IP: 192.168.1.1, GPS: Simulated Location")
        vibrator.vibrate(1)
        # Simulate SMS
        # sms.send(recipient="1234567890", message="Alert: Attack from IP 192.168.1.1 at GPS location.")

    def go_back(self, instance):
        self.manager.current = 'dashboard'

class PinScreen(Screen):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        layout = BoxLayout(orientation='vertical')
        layout.add_widget(Label(text="Enter PIN (4,6,9 digits)"))
        self.pin_input = TextInput(multiline=False)
        layout.add_widget(self.pin_input)
        layout.add_widget(Button(text="Submit", on_press=self.check_pin))
        layout.add_widget(Button(text="Back", on_press=self.go_back))
        self.add_widget(layout)

    def check_pin(self, instance):
        pin = self.pin_input.text
        if len(pin) in [4,6,9] and pin.isdigit():
            # Access real data
            self.manager.current = 'dashboard'
        else:
            # Provide dummy
            dummy = generate_dummy_database(real_data)
            dummy.to_csv("dummy_data.csv", index=False)
            self.manager.current = 'dashboard'

    def go_back(self, instance):
        self.manager.current = 'dashboard'

class SPiApp(App):
    def build(self):
        sm = ScreenManager()
        sm.add_widget(DashboardScreen(name='dashboard'))
        sm.add_widget(LiveDetectionScreen(name='live'))
        sm.add_widget(SettingsScreen(name='settings'))
        sm.add_widget(PinScreen(name='pin'))
        return sm

if __name__ == '__main__':
    SPiApp().run()