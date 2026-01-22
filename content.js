// Content script for TU Graz OTP Auto-Fill

(async function() {
  'use strict';

  // Cooldown tracking
  let lastAttempt = 0;
  const COOLDOWN_MS = 10000; // 10 second cooldown after failure

  // Check if page shows authentication failure
  function hasAuthenticationError() {
    const pageText = document.body?.textContent?.toLowerCase() || '';
    return pageText.includes('authentication failed') ||
           pageText.includes('invalid code') ||
           pageText.includes('invalid otp') ||
           pageText.includes('wrong code') ||
           pageText.includes('incorrect code');
  }

  // Check if we're on the OTP input page
  function findOtpInput() {
    // Look for OTP input field - common selectors for OTP fields
    const selectors = [
      'input[name="otp"]',
      'input[name="totp"]',
      'input[id*="otp"]',
      'input[id*="totp"]',
      'input[autocomplete="one-time-code"]',
      'input[type="text"][maxlength="6"]',
      'input[type="number"][maxlength="6"]',
      'input[placeholder*="code" i]',
      'input[placeholder*="otp" i]'
    ];

    for (const selector of selectors) {
      const input = document.querySelector(selector);
      if (input) return input;
    }

    // Fallback: look for any input that might be an OTP field
    const inputs = document.querySelectorAll('input[type="text"], input[type="number"], input:not([type])');
    for (const input of inputs) {
      const label = document.querySelector(`label[for="${input.id}"]`);
      const labelText = label?.textContent?.toLowerCase() || '';
      const placeholder = input.placeholder?.toLowerCase() || '';
      const name = input.name?.toLowerCase() || '';
      
      if (labelText.includes('otp') || labelText.includes('code') || labelText.includes('token') ||
          labelText.includes('authenticator') || labelText.includes('verification') ||
          placeholder.includes('otp') || placeholder.includes('code') ||
          name.includes('otp') || name.includes('code')) {
        return input;
      }
    }

    return null;
  }

  // Find submit button
  function findSubmitButton() {
    const selectors = [
      'button[type="submit"]',
      'input[type="submit"]',
      'button[name="login"]',
      'button[id*="submit"]',
      'button:not([type="button"])'
    ];

    for (const selector of selectors) {
      const btn = document.querySelector(selector);
      if (btn) return btn;
    }

    return null;
  }

  // Main function to fill OTP
  async function fillOtp() {
    // Check cooldown
    const now = Date.now();
    if (now - lastAttempt < COOLDOWN_MS) {
      console.log('[TU Graz OTP] Cooldown active, skipping');
      return;
    }

    // Don't retry if authentication failed
    if (hasAuthenticationError()) {
      console.log('[TU Graz OTP] Authentication error detected, waiting for cooldown');
      lastAttempt = now;
      return;
    }

    const otpInput = findOtpInput();
    if (!otpInput) {
      console.log('[TU Graz OTP] No OTP input field found on this page');
      return;
    }

    // Don't fill if already has a value
    if (otpInput.value && otpInput.value.length >= 6) {
      console.log('[TU Graz OTP] Input already filled, skipping');
      return;
    }

    lastAttempt = now;

    // Get the secret from storage
    const result = await (typeof browser !== 'undefined' ? browser : chrome).storage.local.get(['totpSecret', 'autoSubmit']);
    const secret = result.totpSecret;
    const autoSubmit = result.autoSubmit !== false; // Default to true

    if (!secret) {
      console.log('[TU Graz OTP] No TOTP secret configured. Please set it in the extension popup.');
      return;
    }

    try {
      // Generate TOTP with TU Graz settings (SHA-256, 60s period)
      const otp = await window.TOTP.generate(secret, {
        algorithm: 'SHA-256',
        period: 60,
        digits: 6
      });
      console.log('[TU Graz OTP] Generated OTP code');

      // Fill the input
      otpInput.value = otp;
      otpInput.dispatchEvent(new Event('input', { bubbles: true }));
      otpInput.dispatchEvent(new Event('change', { bubbles: true }));

      // Auto-submit if enabled
      if (autoSubmit) {
        const submitBtn = findSubmitButton();
        if (submitBtn) {
          // Small delay before submitting
          setTimeout(() => {
            submitBtn.click();
            console.log('[TU Graz OTP] Form submitted');
          }, 300);
        }
      }
    } catch (error) {
      console.error('[TU Graz OTP] Error generating OTP:', error);
    }
  }

  // Run when page loads
  // Use a small delay to ensure the page is fully loaded
  setTimeout(fillOtp, 500);

  // Also watch for dynamic content changes (SPA behavior)
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.addedNodes.length) {
        const otpInput = findOtpInput();
        if (otpInput && !otpInput.value) {
          fillOtp();
          break;
        }
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
})();
