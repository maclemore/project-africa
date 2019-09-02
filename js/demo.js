var scene, camera, listener, sound, renderer, mesh, container, dune;
var keyboard = {};
var player = {height: 4, speed:0.1, turnSpeed:Math.PI*0.02 };

function init(){

				var overlay = document.getElementById( 'overlay' );
				overlay.remove();

  scene = new THREE.Scene();
//  scene.fog = new THREE.Fog(0xf7d9aa, 100, 950);
  scene.fog = new THREE.FogExp2(0xFAAB75, .15);
  camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 1000);
  renderer = new THREE.WebGLRenderer({
      alpha: true,
  });
  renderer.setSize(window.innerWidth, window.innerHeight);

  container = document.getElementById('world');
	container.appendChild(renderer.domElement);

  mesh = new THREE.Mesh(
		new THREE.BoxGeometry(1,1,1),
		new THREE.MeshBasicMaterial({color:0xff4444, wireframe:false})
	);
  mesh.position.set(0,5,0);
  scene.add(mesh);

  var light = new THREE.AmbientLight( 0xffe17c, .5 );
  scene.add( light );

  // create an AudioListener and add it to the camera
  listener = new THREE.AudioListener();
  camera.add( listener );

  // create a global audio source
  sound = new THREE.Audio( listener );

  // load a sound and set it as the Audio object's buffer
  var audioLoader = new THREE.AudioLoader();
  audioLoader.load( '../audio/Toto-Africa.mp3', function( buffer ) {
    sound.setBuffer( buffer );
    sound.setLoop( true );
    sound.setVolume( 0.5 );
    sound.play();
  });



  // meshFloor = new THREE.Mesh (
  //   new THREE.PlaneGeometry(20,20),
  //   new THREE.MeshBasicMaterial({color:0xff4444, wireframe:false})
  // );
  // meshFloor.rotation.x -= Math.PI / 2;
  // scene.add(meshFloor);

//   var loader = new THREE.ObjectLoader();
//   loader.load( '../json/dune.json', function (object) {
//   scene.add(object);
// } );

  var loader = new THREE.GLTFLoader();
  loader.load('../gltf/dune.gltf', function(gltf) {
    dune = gltf.scene.children[0];
    dune.position.set(0,0,0);
    scene.add(dune);
  });

  camera.position.set(0,player.height,+5);
  camera.lookAt(new THREE.Vector3(0,player.height,0));
// camera.lookAt(root.position);

  animate ();
}

//function to rotate on the X + Y axis of mesh
function rotate (){
    mesh.rotation.x += 0.01;
    mesh.rotation.y += 0.02;
}

function turn (){
  if(keyboard[37]) {
    camera.rotation.y -=Math.PI * 0.01;
  }
  if(keyboard[39]) {
    camera.rotation.y +=Math.PI * 0.01;
  }
}

function move () {
  // Keyboard movement inputs
	if(keyboard[40]){ // W key
		camera.position.x -= Math.sin(camera.rotation.y) * player.speed;
		camera.position.z -= -Math.cos(camera.rotation.y) * player.speed;
	}
	if(keyboard[38]){ // S key
		camera.position.x += Math.sin(camera.rotation.y) * player.speed;
		camera.position.z += -Math.cos(camera.rotation.y) * player.speed;
	}
}

//function makes scene moves
function animate (){
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
  turn ();
  move ();
  rotate();
	//requests the cordinates of camera
	var givemelocation = camera.getWorldPosition();
	console.log(givemelocation);
	var info = JSON.stringify(givemelocation);
	document.getElementById("info").innerHTML = info;
	console.log(info);
}



function keyDown(event) {
  keyboard[event.keyCode] = true;
}

function keyUp(event) {
  keyboard[event.keyCode] = false;
}

window.addEventListener ('keydown', keyDown);
window.addEventListener ('keyup', keyUp);

window.onload = function() {
  var startButton = document.getElementById( 'startButton' );
  startButton.addEventListener( 'click', init );
}
