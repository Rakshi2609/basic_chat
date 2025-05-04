const socket = io("https://basic-chat-srlr.onrender.com");
let username = "";

// Prompt for username
while (!username || username.trim() === "") {
  username = prompt("Enter your name:");
}
socket.emit("setUsername", username);

const messages = document.getElementById("messages");
const input = document.getElementById("input");
const sendBtn = document.getElementById("sendBtn");
const imageInput = document.getElementById("imageInput");
const typingIndicator = document.getElementById("typingIndicator");

// Send text message on button click
sendBtn.addEventListener("click", () => {
  if (input.value.trim()) {
    socket.emit("chatMessage", input.value);
    input.value = "";
  }
});

// Send message on Enter key press
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && input.value.trim()) {
    socket.emit("chatMessage", input.value);
    input.value = "";
  }
});

// Image upload handler
imageInput.addEventListener("change", () => {
  const file = imageInput.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append("image", file);

  fetch("/upload", {
    method: "POST",
    body: formData,
  })
    .then((res) => res.json())
    .then((data) => {
      socket.emit("imageMessage", data.imageUrl);
    });
});

// Dark mode toggle
document.getElementById("darkToggle").addEventListener("click", () => {
  document.body.classList.toggle("dark");
});

// Emit typing event when user types
input.addEventListener("input", () => {
  socket.emit("typing", username);
});

// Show typing indicator when someone is typing
socket.on("typing", (name) => {
  if (name !== username) {
    typingIndicator.innerText = `${name} is typing...`;
    clearTimeout(window.typingTimeout);
    window.typingTimeout = setTimeout(() => {
      typingIndicator.innerText = "";
    }, 1000);
  }
});

// Receive and display text messages
socket.on("message", (msg) => {
  const li = document.createElement("li");
  li.classList.add("message");

  const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  if (msg.sender === username) {
    li.classList.add("sent");
    li.innerHTML = `<div class="bubble me">${msg.text}<div class="timestamp">${time}</div></div>`;
  } else {
    li.classList.add("received");
    li.innerHTML = `<div class="bubble other"><strong>${msg.sender}</strong><br>${msg.text}<div class="timestamp">${time}</div></div>`;
  }

  messages.appendChild(li);
  messages.scrollTop = messages.scrollHeight;
});

// Receive and display image messages
socket.on("image", ({ sender, imageUrl }) => {
  const li = document.createElement("li");
  li.classList.add("message");

  const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  if (sender === username) {
    li.classList.add("sent");
    li.innerHTML = `<div class="bubble me"><img src="${imageUrl}" /><div class="timestamp">${time}</div></div>`;
  } else {
    li.classList.add("received");
    li.innerHTML = `<div class="bubble other"><strong>${sender}</strong><br><img src="${imageUrl}" /><div class="timestamp">${time}</div></div>`;
  }

  messages.appendChild(li);
  messages.scrollTop = messages.scrollHeight;
});
