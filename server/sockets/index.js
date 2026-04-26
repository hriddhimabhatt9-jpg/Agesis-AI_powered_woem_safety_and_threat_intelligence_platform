export const setupSocket = (io) => {
  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Join user's personal room
    socket.on('join-room', (userId) => {
      socket.join(`user:${userId}`);
      console.log(`User ${userId} joined personal room`);
    });

    // Location sharing
    socket.on('location-update', (data) => {
      const { userId, lat, lng, speed, heading, sharedWith } = data;
      if (sharedWith && sharedWith.length > 0) {
        sharedWith.forEach(contactId => {
          io.to(`user:${contactId}`).emit('contact-location', { userId, lat, lng, speed, heading, timestamp: Date.now() });
        });
      }
    });

    // Panic alert broadcast
    socket.on('panic-alert', (data) => {
      const { userId, userName, location, contacts } = data;
      contacts.forEach(contactId => {
        io.to(`user:${contactId}`).emit('panic-received', { userId, userName, location, timestamp: Date.now() });
      });
    });

    // Route deviation alert
    socket.on('route-deviation', (data) => {
      const { userId, deviation, contacts } = data;
      contacts.forEach(contactId => {
        io.to(`user:${contactId}`).emit('deviation-alert', { userId, deviation, timestamp: Date.now() });
      });
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });
};
