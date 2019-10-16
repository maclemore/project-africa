// Sets up renderer, scene, light, and postprocessing
var scene, camera, listener, sound, renderer, redCube, container, dune, composer, moverGroup, pGeometry, simplexnoise, mtplane, planematerial, planegeometry;
var keyboard = {};
// Flags to determine which direction the player is moving
var moveForward = false;
var moveBackward = false;
var moveLeft = false;
var moveRight = false;
// Velocity vector for the player (camera)
var playerVelocity = new THREE.Vector3();
var playerHeight = 2.5;
var planeHeight;
var raycaster;
var intersects;
// How fast the player will move
var PLAYERSPEED = 50.0;
var clock;
// Sets up loading manager
var LOADING_MANAGER = null;
var RESOURCES_LOADED = false;

var loadingScreen = {
	scene: new THREE.Scene(),
	camera: new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 1000),
	box: new THREE.Mesh (
		new THREE.BoxGeometry(1,1,1),
		new THREE.MeshBasicMaterial({color:0xff4444})
	)
}

function init(){

	clock = new THREE.Clock();
	listenForPlayerMovement();

	// remove start screen
	var overlay = document.getElementById( 'overlay' );
	overlay.remove();

	scene = new THREE.Scene();
	// scene.fog = new THREE.Fog(0xFAAB75, 0.0025, 20);
	scene.fog = new THREE.FogExp2(0xFAAB75, .03);
	renderer = new THREE.WebGLRenderer({
		alpha: true,
		antialias: true,
	});
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap
	renderer.setSize(window.innerWidth, window.innerHeight);

	container = document.getElementById('world');
	container.appendChild(renderer.domElement);

	// Set camera position & details
	camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.5, 2000);
	camera.position.set(0,playerHeight,-5);
	// camera.lookAt(new THREE.Vector3(0,0,0));

	loadingScreen.box.position.set(0,0,0);
	loadingScreen.camera.lookAt(loadingScreen.box.position);
	loadingScreen.scene.add(loadingScreen.box);

	loadingManager = new THREE.LoadingManager ();

	loadingManager.onProgress = function (item, loaded, total) {
		console.log(item, loaded, total);
	}

	loadingManager.onLoad = function (){
		console.log ("loaded all resources");
		RESOURCES_LOADED = true;
	}

	// // create a red cube
	// redCube = new THREE.Mesh(
	// 	new THREE.BoxGeometry(1,1,1),
	// 	new THREE.MeshBasicMaterial({color:0xff4444, wireframe:false})
	// );
	// // 	redCube.castShadow = true; //default is false
	// // redCube.receiveShadow = true; //default
	// redCube.position.set(0,5,-5);
	// scene.add(redCube);

	// add an AmbientLight to scene
	// var light = new THREE.AmbientLight( 0xffe17c, .5 );
	// scene.add( light );

	// // add a pointlight to the whole scene
	var pointLight = new THREE.PointLight(0xffffff,.1, 0, 100);
	pointLight.position.set( 0, 100, 0 );
	pointLight.castShadow = true;
	scene.add( pointLight );

	//Set up shadow properties for the light
	pointLight.shadow.mapSize.width = 1024;  // default
	pointLight.shadow.mapSize.height = 1024; // default
	pointLight.shadow.camera.near = 0.5;       // default
	pointLight.shadow.camera.far = 500;      // default

	let circleGeo = new THREE.CircleGeometry(60,50);
	let circleMat = new THREE.MeshBasicMaterial({color:0xffccaa});
	let circle = new THREE.Mesh(circleGeo, circleMat);
	circle.position.set(0, 1000, -2000);
	scene.add(circle);

	let areaImage = new Image();
	areaImage.src = POSTPROCESSING.SMAAEffect.areaImageDataURL;
	let searchImage = new Image();
	searchImage.src = POSTPROCESSING.SMAAEffect.searchImageDataURL;
	let smaaEffect = new POSTPROCESSING.SMAAEffect(searchImage,areaImage,1);

	let godraysEffect = new POSTPROCESSING.GodRaysEffect(camera, circle, {
		resolutionScale: 1,
		density: 0.8,
		decay: 0.95,
		weight: 0.9,
		samples: 100
	});

	let renderPass = new POSTPROCESSING.RenderPass(scene, camera);
	let effectPass = new POSTPROCESSING.EffectPass(camera,smaaEffect, godraysEffect);
	effectPass.renderToScreen = true;

	composer = new POSTPROCESSING.EffectComposer(renderer);
	composer.addPass(renderPass);
	composer.addPass(effectPass);
	// create an AudioListener and add it to the camera
	listener = new THREE.AudioListener();
	camera.add( listener );

	// create a global audio source
	sound = new THREE.Audio( listener );

	// load a sound and set it as the Audio object's buffer
	var audioLoader = new THREE.AudioLoader(loadingManager);
	audioLoader.load('sounds/africa.mp3', function( buffer ) {
		sound.setBuffer( buffer );
		sound.setLoop( true );
		sound.setVolume( 0.5 );
		sound.play();

		let playPromise = sound.play();

		if (playPromise !== undefined) {
			playPromise.then(_ => {
				console.log('Playing Audio');
			})
			.catch(error => {
				console.log(error);
			});
		}
	}, // onProgress callback
	function ( xhr ) {
		console.log( (xhr.loaded / xhr.total * 100) + '% loaded' );
	},

	// onError callback
	function ( err ) {
		console.log( 'An error happened', err );
	});

	// var loader = new THREE.GLTFLoader();
	// loader.load('models/dune3.gltf', function(gltf) {
	// 	dune = gltf.scene.children[0];
	// 	dune.scale.set(5,5,5);
	// 	dune.position.set(0,0,0);
	// 	scene.add(dune);
	// });


	var planegeometry = new THREE.PlaneGeometry( 2000, 2000, 256, 256 );
	var planematerial = new THREE.MeshLambertMaterial({
	  color: 0xFFCC7C,
	  opacity: 1,
		emissive : 0xFFCC7C,
		// castShadow: false,
		// receiveShadow: true,
	  // blending: THREE.NoBlending,
	  // side: THREE.FrontSide,
	  // transparent: false,
	  // depthTest: false,
	  // wireframe: true,
	});

	mtplane = new THREE.Mesh(planegeometry, planematerial );
	mtplane.rotation.x = -Math.PI / 2;
	mtplane.position.set(0, 0, 0);
	mtplane.castShadow = false;
	mtplane.receiveShadow = true;

	var simplexnoise = new SimplexNoise();
	for ( let vertex of mtplane.geometry.vertices ) {
	  let xoff = ( vertex.x / 180 );
	  let yoff = ( vertex.y / 180 ) + 0;
	  let rand = simplexnoise.noise2D( xoff, yoff ) * 12;
	  vertex.z = rand;
	}

	mtplane.updateMatrixWorld(true);
	scene.add(mtplane);
// console.log(mtplane);

// var raycaster = new THREE.Raycaster();
// raycaster.set(camera.position, new THREE.Vector3(0, -1, 0));
// var intersects = raycaster.intersectObject(mtplane);
// console.log(intersects[0].point.y);


	// var raycaster = new THREE.Raycaster();
	// raycaster.set(camera.position, new THREE.Vector3(0, -1, 0));
	//
	// var intersects = raycaster.intersectObject(mtplane);
	// camera.position.y = intersects[0].point.y + playerHeight;


	// var loader = new THREE.GLTFLoader(loadingManager);
	// loader.load( 'models/dune.gltf', function ( gltf ) {
	// 	gltf.scene.traverse( function ( child ) {
	// 		if ( child.isMesh ) {
	// 			child.geometry.center(); // center here
	// 		}
	// 	});
	// 	gltf.scene.scale.set(40,18,40) // scale here
	// 	scene.add( gltf.scene );
	// }, (xhr) => xhr, ( err ) => console.error( e ));

	var loader = new THREE.GLTFLoader(loadingManager);
	loader.load( 'models/ring2.gltf', function ( gltf ) {
		gltf.scene.traverse( function ( child ) {
			if ( child.isMesh ) {
				child.castShadow = true;
				child.receiveShadow = true;
			}
		});
		gltf.scene.scale.set(20,20,20) // scale here
		gltf.scene.position.set(0,20,-50) // scale here
		scene.add( gltf.scene );
	}, (xhr) => xhr, ( err ) => console.error( e ));

	var loader = new THREE.GLTFLoader(loadingManager);
	loader.load( 'models/mountains.gltf', function ( gltf ) {
		gltf.scene.traverse( function ( child ) {
			if ( child.isMesh ) {
				// child.geometry.center(); // center here
				// child.position.set(0,15,-2000) // scale here
			}
		});
		gltf.scene.scale.set(220,180,180) // scale here
		gltf.scene.position.set(0,-100,-2000) // scale here
		scene.add( gltf.scene );
	}, (xhr) => xhr, ( err ) => console.error( e ));

	const gltfLoader = new THREE.GLTFLoader(loadingManager);
	const url = 'models/ring1.gltf';
	gltfLoader.load(url, (gltf) => {
		const rock1 = gltf.scene;
		rock1.scale.set (20,20,20)
		rock1.position.set(0,-5,-120)
		scene.add(rock1);
	});


	moverGroup = new THREE.Object3D();
	scene.add(moverGroup);

	pGeometry = new THREE.Geometry();
	// sprite = textureLoader.load('images/sprite.png');
	var sprite = new THREE.TextureLoader(loadingManager).load( 'images/sprite.png' );
	// var sprite = new THREE.TextureLoader();
	// sprite.load('images/sprite.png');
	for (i = 0; i < 4000; i++) {
			var vertex = new THREE.Vector3();
			vertex.x = 4000 * Math.random() - 2000;
			vertex.y = -50 + Math.random() * 700;
			vertex.z = 5000 * Math.random() - 2000;
			pGeometry.vertices.push(vertex);
	}
	let material = new THREE.PointsMaterial({
			size: 7,
			map: sprite,
			transparent: true,
			opacity: 0.65,
			blending: THREE.AdditiveBlending,
			alphaTest: 0.5,
			fog: false
	});

	var particles = new THREE.Points(pGeometry, material);
	particles.sortParticles = true;
	moverGroup.add(particles);


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

function animateCameraHeight () {
	var raycaster = new THREE.Raycaster();
	raycaster.set(camera.position, new THREE.Vector3(0, -1, 0));
	var intersects = raycaster.intersectObject(mtplane);
	camera.position.y = intersects[0].point.y + playerHeight;
	// console.log(mtplane);
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

	if (RESOURCES_LOADED == false) {
		requestAnimationFrame(animate);
		document.getElementById("loading").style.display = "flex";
		renderer.render(loadingScreen.scene, loadingScreen.camera);
		return;
	} else {
		document.getElementById("loading").style.display = "none";
	}

	//animate the scene
	requestAnimationFrame(animate);
	// renderer.render(scene, camera);
	particlesMove();
	composer.render(0.1);



	// animate player's movement
	var delta = clock.getDelta();
	animateCameraHeight();
	animatePlayer(delta);


	// move red cube
	redCube.rotation.x += 0.01;
	redCube.rotation.y += 0.02;

	//requests the cordinates of camera
	// var givemelocation = camera.getWorldPosition();
	// // console.log(givemelocation);
	// var info = JSON.stringify(givemelocation);
	// document.getElementById("info").innerHTML = info;
	// // console.log(info);
}

function particlesMove () {
	for (i = 0; i < 4000; i++) {
			pGeometry.vertices[i].z += .5;
			if (pGeometry.vertices[i].z > 2700) {
					pGeometry.vertices[i].z = -2000;
			}
	}
	pGeometry.verticesNeedUpdate = true;

	// setWaves();
	composer.render(0.1);
}
// onload function to get start screen
window.onload = function() {
	var startButton = document.getElementById( 'startButton' );
	startButton.addEventListener( 'click', init );
}
