let io;
const onlineUsers = {};

module.exports = {
  init: (server) => {
    io = require('socket.io')(server, {
      cors: { origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE'] },
    });

    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      socket.on('register-user', (userId) => {
        if (userId) {
          onlineUsers[userId] = socket.id;
          socket.join(userId); // Join room for robust routing
          console.log(`User registered: ${userId} with socket: ${socket.id}`);
          console.log("Current online users:", onlineUsers);
        }
      });

      socket.on('call-doctor', ({ doctorId, patientId, patientName, channelName, isVideo }) => {
        const doctorSocket = onlineUsers[doctorId];
        console.log(`Routing call from patient ${patientId} to doctor ${doctorId}. Doctor Socket:`, doctorSocket);
        
        // Use BOTH socket.id and Room emit for a highly robust fix
        if (doctorSocket) {
            io.to(doctorId).emit('incoming-call', {
               patientId,
               patientName,
               channelName,
               isVideo
            });
            console.log("Call event emitted to doctor room");
        } else {
            console.log("Doctor not online!");
        }
      });

      // Handle call responses
      socket.on('accept-call', ({ to }) => {
        console.log(`Accepting call for user ${to}`);
        io.to(to).emit('call-accepted');
      });

      socket.on('reject-call', ({ to }) => {
        console.log(`Rejecting call for user ${to}`);
        io.to(to).emit('call-rejected');
      });

      socket.on('end-call', ({ to }) => {
        console.log(`Ending call for user ${to}`);
        io.to(to).emit('call-ended');
      });

      socket.on('disconnect', () => {
        for (let userId in onlineUsers) {
          if (onlineUsers[userId] === socket.id) {
            delete onlineUsers[userId];
            break;
          }
        }
      });
    });
    return io;
  },
  getIO: () => {
    if (!io) throw new Error('Socket.io not initialized!');
    return io;
  }
};