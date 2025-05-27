// Landing Page Interactions
document.addEventListener('DOMContentLoaded', () => {
  // Animate elements when page loads
  const heroTitle = document.querySelector('.hero-title');
  const heroSubtitle = document.querySelector('.hero-subtitle');
  const ctaButton = document.querySelector('.cta-button');
  
  // Simple fade-in animation
  setTimeout(() => {
    heroTitle.style.opacity = '1';
    heroTitle.style.transform = 'translateY(0)';
  }, 300);
  
  setTimeout(() => {
    heroSubtitle.style.opacity = '1';
    heroSubtitle.style.transform = 'translateY(0)';
  }, 600);
  
  setTimeout(() => {
    ctaButton.style.opacity = '1';
    ctaButton.style.transform = 'translateY(0)';
  }, 900);
  
  // Smooth scrolling for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        window.scrollTo({
          top: targetElement.offsetTop,
          behavior: 'smooth'
        });
      }
    });
  });
  
  // Check if video is supported and fallback to image if not
  const video = document.getElementById('background-video');
  if (video) {
    video.addEventListener('error', () => {
      // If video fails to load, replace with a static image
      const videoContainer = document.querySelector('.video-container');
      videoContainer.innerHTML = '';
      videoContainer.style.backgroundImage = 'url("assets/images/jungle-fallback.jpg")';
      videoContainer.style.backgroundSize = 'cover';
      videoContainer.style.backgroundPosition = 'center';
    });
  }
});

// Add CSS directly through JavaScript
const style = document.createElement('style');
style.textContent = `
  .hero-title, .hero-subtitle, .cta-button {
    opacity: 0;
    transform: translateY(20px);
    transition: opacity 0.8s ease, transform 0.8s ease;
  }
`;
document.head.appendChild(style);