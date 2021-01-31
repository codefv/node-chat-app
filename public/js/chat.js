const socket = io();

// Elements
const $form = document.getElementById("form");
const $input = document.getElementById("input");
const $submitButton = document.getElementById("button");
const $sendLocationButton = document.getElementById("send-location");
const $messages = document.getElementById("messages");

// Templates
const messageTemplate = document.getElementById("message-template").innerHTML;
const locationMessageTemplate = document.getElementById(
	"location-message-template",
).innerHTML;
const sidebarTemplate = document.getElementById("sidebar-template").innerHTML;

// Options
const { username, room } = Qs.parse(location.search, {
	ignoreQueryPrefix: true,
});

const autoscroll = () => {
	// New message element
	const $newMessage = $messages.lastElementChild;

	// Height of the new message
	const newMessageStyles = getComputedStyle($newMessage);
	const newMessageMargin = parseInt(newMessageStyles.marginBottom);
	const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

	// Visible height
	const visibleHeight = $messages.offsetHeight;

	// Height of messages container
	const containerHeight = $messages.scrollHeight;

	// How far have I scrolled?
	const scrollOffset = $messages.scrollTop + visibleHeight;

	if (containerHeight - newMessageHeight <= scrollOffset) {
		$messages.scrollTop = $messages.scrollHeight;
	}
};

socket.on("message", (message) => {
	console.log(message);
	const html = Mustache.render(messageTemplate, {
		username: message.username,
		message: message.text,
		createdAt: moment(message.createdAt).format("h:mm a"),
	});
	$messages.insertAdjacentHTML("beforeend", html);
	autoscroll();
});

socket.on("locationMessage", (message) => {
	console.log(message);
	const html = Mustache.render(locationMessageTemplate, {
		username: message.username,
		url: message.url,
		createdAt: moment(message.createdAt).format("h:mm a"),
	});
	$messages.insertAdjacentHTML("beforeend", html);
	autoscroll();
});

socket.on("roomData", ({ room, users }) => {
	const html = Mustache.render(sidebarTemplate, {
		room,
		users,
	});
	document.getElementById("sidebar").innerHTML = html;
});

$form.addEventListener("submit", (e) => {
	e.preventDefault();

	$submitButton.setAttribute("disabled", "disabled");

	const message = $input.value;

	socket.emit("sendMessage", message, (error) => {
		$submitButton.removeAttribute("disabled");
		$input.value = "";
		$input.focus();

		if (error) {
			return console.log(error);
		}

		console.log("Message delivered!");
	});
});

$sendLocationButton.addEventListener("click", () => {
	if (!navigator.geolocation) {
		return alert("Geolocation is not supported by your browser.");
	}

	$sendLocationButton.setAttribute("disabled", "disabled");

	navigator.geolocation.getCurrentPosition((location) => {
		socket.emit(
			"sendLocation",
			{
				latitude: location.coords.latitude,
				longitude: location.coords.longitude,
			},
			() => {
				$sendLocationButton.removeAttribute("disabled");

				console.log("Location shared!");
			},
		);
	});
});

socket.emit("join", { username, room }, (error) => {
	if (error) {
		alert(error);
		location.href = "/";
	}
});
