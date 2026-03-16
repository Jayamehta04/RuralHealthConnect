let io;

module.exports = {
  init: (server) => {
    io = require('socket.io')(server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
      },
    });

    io.on('connection', (socket) => {
      console.log('Client connected', socket.id);

      socket.on('join', ({ userId }) => {
        if (userId) {
          socket.join(`user_${userId}`);
          console.log(`Socket ${socket.id} joined room user_${userId}`);
        }
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected', socket.id);
      });
    });

    return io;
  },
  getIO: () => {
    if (!io) {
      throw new Error('Socket.io not initialized!');
    }
    return io;
  }
};