# TU Graz OTP Auto-Fill Extension

Browser extension that automatically fills OTP codes for TU Graz Single Sign-On.

## Installation

1. Open Chrome/Edge and go to `chrome://extensions/` (or `edge://extensions/`)
2. Enable "Developer mode" (toggle in top-right)
3. Click "Load unpacked"
4. Select this folder (`tug-otp-ext`)

## Setup

1. Click the extension icon in your browser toolbar
2. Enter your TOTP secret key (the Base32 string from your authenticator app setup)
3. Enable/disable auto-submit as desired
4. Click "Save Settings"

## Getting Your TOTP Secret

Your TOTP secret is the key you used when setting up your authenticator app. If you don't have it:

1. Go to TU Graz account settings
2. Set up a new TOTP authenticator
3. When shown the QR code, look for the "secret" or "key" option
4. Copy the Base32 string (looks like: `JBSWY3DPEHPK3PXP`)
