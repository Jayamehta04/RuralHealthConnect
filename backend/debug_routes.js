const chat = require('./routes/chatRoutes');
console.log('Chat routes:', chat.stack.map(m => m.route.path));
