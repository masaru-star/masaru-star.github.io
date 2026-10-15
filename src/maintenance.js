const isMaintenance = true;
if (isMaintenance && !window.location.pathname.endsWith('503.html')) {
  window.location.href = '/503.html';
}