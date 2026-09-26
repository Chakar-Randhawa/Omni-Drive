// OmniDrive Tools - PDF Worker runtime interface
// Browser client worker module for PDF processing tasks
self.onmessage = function(e) {
  const { type, payload } = e.data || {};
  if (type === 'PING') {
    self.postMessage({ type: 'PONG', time: Date.now() });
  }
};
