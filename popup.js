// Popup script for TU Graz OTP extension

document.addEventListener('DOMContentLoaded', async () => {
  const secretInput = document.getElementById('secret');
  const autoSubmitCheckbox = document.getElementById('autoSubmit');
  const saveButton = document.getElementById('save');
  const statusDiv = document.getElementById('status');
  const toggleSecretBtn = document.getElementById('toggleSecret');
  const codeDisplay = document.getElementById('codeDisplay');
  const currentCodeSpan = document.getElementById('currentCode');
  const timerSpan = document.getElementById('timer');

  // Load saved settings
  const storage = (typeof browser !== 'undefined' ? browser : chrome).storage.sync;
  const result = await storage.get(['totpSecret', 'autoSubmit']);
  if (result.totpSecret) {
    secretInput.value = result.totpSecret;
    showCurrentCode();
  }
  if (result.autoSubmit !== undefined) {
    autoSubmitCheckbox.checked = result.autoSubmit;
  }

  // Toggle secret visibility
  toggleSecretBtn.addEventListener('click', () => {
    if (secretInput.type === 'password') {
      secretInput.type = 'text';
      toggleSecretBtn.textContent = '🙈';
    } else {
      secretInput.type = 'password';
      toggleSecretBtn.textContent = '👁';
    }
  });

  // Save settings
  saveButton.addEventListener('click', async () => {
    const secret = secretInput.value.trim().replace(/\s/g, '');
    const autoSubmit = autoSubmitCheckbox.checked;

    if (!secret) {
      showStatus('Please enter a TOTP secret', 'error');
      return;
    }

    // Validate the secret by trying to generate a code
    try {
      await TOTP.generate(secret, { algorithm: 'SHA-256', period: 60, digits: 6 });
    } catch (error) {
      showStatus('Invalid TOTP secret format', 'error');
      return;
    }

    await storage.set({
      totpSecret: secret,
      autoSubmit: autoSubmit
    });

    showStatus('Settings saved!', 'success');
    showCurrentCode();
  });

  function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
    statusDiv.style.display = 'block';
    setTimeout(() => {
      statusDiv.style.display = 'none';
    }, 3000);
  }

  async function showCurrentCode() {
    const res = await storage.get(['totpSecret']);
    if (!res.totpSecret) return;

    codeDisplay.style.display = 'block';

    async function updateCode() {
      try {
        const code = await TOTP.generate(res.totpSecret, {
          algorithm: 'SHA-256',
          period: 60,
          digits: 6
        });
        currentCodeSpan.textContent = code;
        timerSpan.textContent = TOTP.getRemainingSeconds(60);
      } catch (error) {
        currentCodeSpan.textContent = 'Error';
      }
    }

    updateCode();
    setInterval(updateCode, 1000);
  }
});
