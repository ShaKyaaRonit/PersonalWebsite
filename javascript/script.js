    document.addEventListener('contextmenu', function(e) {
      if (e.target.tagName === 'IMG') {
        e.preventDefault();
      }
    });

const footerDate = document.querySelector('.footer h5');

function updateDateTime() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.toLocaleString('default', { month: 'short' });
  const day = now.getDate().toString().padStart(2, '0');
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  footerDate.textContent = `${year} | ${month} ${day} | ${hours}.${minutes}`;
}

updateDateTime();
setInterval(updateDateTime, 60000); // Update every minute


