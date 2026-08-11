const { io } = require("socket.io-client");

const socket = io("http://localhost:5000", {
  transports: ["websocket", "polling"],
});

socket.on("connect", () => {
  console.log("Connected to socket server! ID:", socket.id);
  
  // Listen to the events
  socket.on("queue_updated", (data) => console.log("queue_updated received:", data));
  socket.on("appointment_created", (data) => console.log("appointment_created received:", data));
  socket.on("patient_created", (data) => console.log("patient_created received:", data));
  socket.on("broadcast_notification", (data) => console.log("broadcast_notification received:", data));
  
  console.log("Listening for events... Make a booking on the frontend to test.");
});

socket.on("connect_error", (err) => {
  console.error("Socket connect error:", err.message);
});

socket.on("disconnect", (reason) => {
  console.log("Disconnected:", reason);
});
