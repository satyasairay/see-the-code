/**
 * Demo Application JavaScript
 * 
 * This file is included for demonstration purposes.
 * In a real application, this would contain your app logic.
 */

console.log('See The Code Demo App loaded');

// Example: Dynamic content that will be processed by the overlay
setTimeout(() => {
    const dynamicCard = document.createElement('div');
    dynamicCard.className = 'card';
    dynamicCard.innerHTML = '<h2>Dynamically Added Card</h2><p>This card was added after page load. The overlay should detect it automatically.</p>';
    document.getElementById('main-content').appendChild(dynamicCard);
}, 2000);

