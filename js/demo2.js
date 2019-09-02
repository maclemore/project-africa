var scene, camera, listener, sound, renderer, redCube, container, dune;
var keyboard = {};
// Flags to determine which direction the player is moving
var moveForward = false;
var moveBackward = false;
var moveLeft = false;
var moveRight = false;
// Velocity vector for the player
var playerVelocity = new THREE.Vector3();
// How fast the player will move
var PLAYERSPEED = 50.0;
var clock;

function init(){

	clock = new THREE.Clock();
	listenForPlayerMovement();

	// remove start screen
	var overlay = document.getElementById( 'overlay' );
	overlay.remove();

	scene = new THREE.Scene();
	scene.fog = new THREE.FogExp2(0xFAAB75, .15);
	renderer = new THREE.WebGLRenderer({
		alpha: true,
	});
	renderer.setSize(window.innerWidth, window.innerHeight);

	container = document.getElementById('world');
	container.appendChild(renderer.domElement);

	// Set camera position & details
	camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 1000);
	camera.position.set(0,3,+5);
	// camera.lookAt(new THREE.Vector3(0,0,0));

	// create a red cube
	redCube = new THREE.Mesh(
		new THREE.BoxGeometry(1,1,1),
		new THREE.MeshBasicMaterial({color:0xff4444, wireframe:false})
	);
	redCube.position.set(0,5,0);
	scene.add(redCube);

	// add an AmbientLight to scene
	var light = new THREE.AmbientLight( 0xffe17c, .5 );
	scene.add( light );

	// create an AudioListener and add it to the camera
	listener = new THREE.AudioListener();
	camera.add( listener );

	// create a global audio source
	sound = new THREE.Audio( listener );

	// load a sound and set it as the Audio object's buffer
	var audioLoader = new THREE.AudioLoader();
	audioLoader.load( '../sounds/Toto-Africa.mp3', function( buffer ) {
		sound.setBuffer( buffer );
		sound.setLoop( true );
		sound.setVolume( 0.5 );
		sound.play();
	});

	var loader = new THREE.GLTFLoader();
	loader.load('../models/dune3.gltf', function(gltf) {
		dune = gltf.scene.children[0];
		dune.position.set(0,0,0);
		scene.add(dune);
	});

	animate ();
}

function listenForPlayerMovement() {

	// A key has been pressed
	var onKeyDown = function(event) {

		switch (event.keyCode) {

			case 38: // up
			case 87: // w
			moveForward = true;
			break;

			case 37: // left
			case 65: // a
			moveLeft = true;
			break;

			case 40: // down
			case 83: // s
			moveBackward = true;
			break;

			case 39: // right
			case 68: // d
			moveRight = true;
			break;
		}
	};

	// A key has been released
	var onKeyUp = function(event) {

		switch (event.keyCode) {

			case 38: // up
			case 87: // w
			moveForward = false;
			break;

			case 37: // left
			case 65: // a
			moveLeft = false;
			break;

			case 40: // down
			case 83: // s
			moveBackward = false;
			break;

			case 39: // right
			case 68: // d
			moveRight = false;
			break;
		}
	};

	// Add event listeners for when movement keys are pressed and released
	document.addEventListener('keydown', onKeyDown, false);
	document.addEventListener('keyup', onKeyUp, false);
}

function animatePlayer(delta) {
	// Gradual slowdown
	playerVelocity.x -= playerVelocity.x * 10.0 * delta;
	playerVelocity.z -= playerVelocity.z * 10.0 * delta;

	if (moveForward) {
		playerVelocity.z -= PLAYERSPEED * delta;
	}
	if (moveBackward) {
		playerVelocity.z += PLAYERSPEED * delta;
	}
	if (moveLeft) {
		playerVelocity.x -= PLAYERSPEED * delta;
	}
	if (moveRight) {
		playerVelocity.x += PLAYERSPEED * delta;
	}
	if( !( moveForward || moveBackward || moveLeft ||moveRight)) {
		// No movement key being pressed. Stop movememnt
		playerVelocity.x = 0;
		playerVelocity.z = 0;
	}
	camera.translateX(playerVelocity.x * delta);
	camera.translateZ(playerVelocity.z * delta);
}

//function makes scene moves
function animate (){

	//animate the scene
	requestAnimationFrame(animate);
	renderer.render(scene, camera);

	// animate player's movement
	var delta = clock.getDelta();
	animatePlayer(delta);

	// move red cube
	redCube.rotation.x += 0.01;
	redCube.rotation.y += 0.02;

	//requests the cordinates of camera
	var givemelocation = camera.getWorldPosition();
	console.log(givemelocation);
	var info = JSON.stringify(givemelocation);
	document.getElementById("info").innerHTML = info;
	console.log(info);
}

// onload function to get start screen
window.onload = function() {
	var startButton = document.getElementById( 'startButton' );
	startButton.addEventListener( 'click', init );
}
