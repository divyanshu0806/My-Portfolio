// Contact form submission
document.getElementById('contactForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        subject: document.getElementById('subject').value,
        message: document.getElementById('message').value
    };

    try {
        // 🚨 REPLACE 'your-backend-url' WITH YOUR ACTUAL RAILWAY BACKEND URL
        const response = await fetch('https://your-backend-url.up.railway.app/api/contact', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.success) {
            document.getElementById('successMessage').style.display = 'block';
            document.getElementById('errorMessage').style.display = 'none';
            document.getElementById('contactForm').reset();
            
            setTimeout(() => {
                document.getElementById('successMessage').style.display = 'none';
            }, 5000);
        } else {
            throw new Error(data.error || 'Failed to send message');
        }
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('errorMessage').style.display = 'block';
        document.getElementById('errorMessage').textContent = 'Failed to send message. Please try again.';
        document.getElementById('successMessage').style.display = 'none';
        
        setTimeout(() => {
            document.getElementById('errorMessage').style.display = 'none';
        }, 5000);
    }
});
