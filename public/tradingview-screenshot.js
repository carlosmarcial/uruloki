(function() {
  window.addEventListener('message', function(event) {
    if (event.data && event.data.action === 'takeScreenshot') {
      if (window.TradingView && window.TradingView.activeChart) {
        window.TradingView.activeChart().takeScreenshot().then(function(imageData) {
          window.parent.postMessage({ action: 'screenshotTaken', imageData: imageData }, '*');
        });
      }
    }
  });
})();