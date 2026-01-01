document.addEventListener('DOMContentLoaded', () => {

    // Smooth scrolling
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) target.scrollIntoView({ behavior: 'smooth' });
        });
    });

    // Mobile menu toggle
    const navMenu = document.getElementById('navMenu');
    window.toggleMenu = () => navMenu.classList.toggle('active');
    window.closeMenu = () => navMenu.classList.remove('active');

    // Contact form submission
    const contactForm = document.getElementById('contactForm');
    const successMessage = document.getElementById('successMessage');
    const errorMessage = document.getElementById('errorMessage');

    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('Form submitted');

            const formData = {
                name: document.getElementById('name')?.value.trim(),
                email: document.getElementById('email')?.value.trim(),
                subject: document.getElementById('subject')?.value.trim(),
                message: document.getElementById('message')?.value.trim()
            };

            console.log('Form data:', formData);

            // Simple frontend validation
            if (!formData.name || !formData.email || !formData.subject || !formData.message) {
                errorMessage.style.display = 'block';
                errorMessage.textContent = 'Please fill in all fields.';
                successMessage.style.display = 'none';
                return;
            }

            try {
                // Use relative URL so it works locally and on Railway
                const response = await fetch('/api/contact', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });

                const data = await response.json();
                console.log('Server response:', data);

                if (response.ok) {
                    successMessage.style.display = 'block';
                    errorMessage.style.display = 'none';
                    contactForm.reset();
                    setTimeout(() => successMessage.style.display = 'none', 5000);
                } else {
                    throw new Error(data.error || 'Failed to send message');
                }

            } catch (error) {
                console.error('Error caught:', error);
                errorMessage.style.display = 'block';
                errorMessage.textContent = error.message;
                successMessage.style.display = 'none';
                setTimeout(() => errorMessage.style.display = 'none', 5000);
            }
        });
    }

    // Phone copy functionality
    const phone = document.getElementById('phoneNumber');
    if (phone) {
        phone.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm('Copy phone number to clipboard?')) {
                navigator.clipboard.writeText('+919931574938');
                alert('Phone number copied!');
            }
        });
    }

    // Active nav link on scroll
    window.addEventListener('scroll', () => {
        let current = '';
        document.querySelectorAll('section').forEach(section => {
            if (scrollY >= section.offsetTop - 200) {
                current = section.getAttribute('id');
            }
        });
        document.querySelectorAll('nav a').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href')?.slice(1) === current) link.classList.add('active');
        });
    });

});
