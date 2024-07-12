document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('contactForm');
  const fullnameInput = document.getElementById('fullname');
  const emailInput = document.getElementById('email');
  const messageInput = document.getElementById('message');
  const submitBtn = document.querySelector('.form-btn');

  form.addEventListener('submit', function (event) {
    event.preventDefault(); // Prevent default form submission

    // Validate form inputs (basic validation)
    if (!validateInputs()) {
      return;
    }

    // Prepare email data
    const subject = 'Message from Contact Form';
    const body = `
      Full Name: ${fullnameInput.value.trim()}
      Email: ${emailInput.value.trim()}
      Message: ${messageInput.value.trim()}
    `;

    // Construct mailto URL
    const mailtoUrl = `mailto:riyazofficial.222001@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    // Attempt to open mail client
    window.open(mailtoUrl, '_blank');

    // Optionally reset the form after sending
    form.reset();
  });

  // Function to validate form inputs (basic validation)
  function validateInputs() {
    let isValid = true;

    if (fullnameInput.value.trim() === '') {
      isValid = false;
      alert('Please enter your full name.');
    } else if (emailInput.value.trim() === '') {
      isValid = false;
      alert('Please enter your email address.');
    } else if (messageInput.value.trim() === '') {
      isValid = false;
      alert('Please enter your message.');
    }

    return isValid;
  }

  // Enable submit button when form is valid
  form.addEventListener('input', function () {
    submitBtn.disabled = !form.checkValidity();
  });
});
