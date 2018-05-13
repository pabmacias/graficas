// 1. Enable shadow mapping in the renderer.
// 2. Enable shadows and set shadow parameters for the lights that cast shadows.
// Both the THREE.DirectionalLight type and the THREE.SpotLight type support shadows.
// 3. Indicate which geometry objects cast and receive shadows.

var renderer = null,
scene = null,
var camera = null,
root = null,
stadium = null,
navmesh = null,
group = null,
orbitControls = null;

var objLoader = null;

var duration = 20000; // ms
var currentTime = Date.now();

var playerNavMeshGroup;

var player, target;

//const Pathfinder = require('three-pathfinding');
const pathfinder = new THREE.Pathfinding();

function run() {
    requestAnimationFrame(function() { run(); });

        // Render the scene
        renderer.render( scene, camera );

        // Spin the cube for next frame

        // Update the camera controller
        orbitControls.update();
}

var onProgress = function ( xhr ) {
  if ( xhr.lengthComputable ) {
    var percentComplete = xhr.loaded / xhr.total * 100;
    console.log( Math.round( percentComplete, 2 ) + '% downloaded' );
  }
};

var onError = function ( xhr ) { };

var directionalLight = null;
var spotLight = null;
var ambientLight = null;
var mapUrl = "../images/checker_large.gif";

var SHADOW_MAP_WIDTH = 2048, SHADOW_MAP_HEIGHT = 2048;

function createScene(canvas) {

    // Create the Three.js renderer and attach it to our canvas
    renderer = new THREE.WebGLRenderer( { canvas: canvas, antialias: true } );

    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );

    window.addEventListener( 'resize', onWindowResize, false );

    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 1000 );

    // Set the viewport size
    //renderer.setSize(canvas.width, canvas.height);

    // Turn on shadows
    //renderer.shadowMap.enabled = true;
    // Options are THREE.BasicShadowMap, THREE.PCFShadowMap, PCFSoftShadowMap
    //renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Create a new Three.js scene
    scene = new THREE.Scene();

    // Add  a camera so we can view the scene
    camera = new THREE.PerspectiveCamera( 45, canvas.width / canvas.height, 1, 4000 );
    camera.position.set(-2, 6, 12);
    scene.add(camera);

    // Create a group to hold all the objects
    root = new THREE.Object3D;

    ambientLight = new THREE.AmbientLight ( 0xffffff );
    scene.add(ambientLight);

    var mtlLoader = new THREE.MTLLoader();
    //mtlLoader.setTexturePath( '70545_Soccer_Stadium_Large/' );
    //mtlLoader.setPath( '70545_Soccer_Stadium_Large/' );
    var url = "models/70545_Soccer_Stadium_Large/arena4.mtl";
    mtlLoader.load( url, function( materials ) {

        materials.preload();

        if ( materials.lights ) {
          uniforms.ambientLightColor.value = _lights.ambient; // this line breaksPa
		    }

        var objLoader = new THREE.OBJLoader();
        objLoader.setMaterials( materials );
        //objLoader.setPath( '70545_Soccer_Stadium_Large/' );
        objLoader.load( 'models/70545_Soccer_Stadium_Large/arena4.obj', function ( stadium ) {

            stadium.position.y = 0;
            stadium.position.x = 0;
            // stadium.position.z = -200;
            // stadium.scale.x = 0.05;
            // stadium.scale.y = 0.05;
            // stadium.scale.z = 0.05;

            scene.add( stadium );

        }, onProgress, onError );

    });

    url = "models/70545_Soccer_Stadium_Large/arena_nav.mtl";
    mtlLoader.load( url, function( materials ) {

        materials.preload();

        if ( materials.lights ) {
          uniforms.ambientLightColor.value = _lights.ambient; // this line breaksPa
		    }

        var objLoader = new THREE.OBJLoader();
        objLoader.setMaterials( materials );
        //objLoader.setPath( '70545_Soccer_Stadium_Large/' );
        objLoader.load( 'models/70545_Soccer_Stadium_Large/arena_nav.obj', function ( navmesh ) {

            navmesh.position.y = 0;
            navmesh.position.x = 0;
            // navmesh.position.z = -200;
            // navmesh.scale.x = 0.05;
            // navmesh.scale.y = 0.05;
            // navmesh.scale.z = 0.05;

            const ZONE = 'level';
            pathfinder.setZoneData(ZONE, THREE.Pathfinding.createZone(navmesh.geometry));

            playerNavMeshGroup = pathfinder.getGroup('level', player.position);

            //scene.add( object );

        }, onProgress, onError );

    });

    var geometry = new THREE.SphereGeometry( 0.25, 32, 32 );
    var material = new THREE.MeshBasicMaterial( {color: 0x00ff00} );
    player = new THREE.Mesh( geometry, material );
    scene.add( player );

    player.position.set(-3.5, 0.5, 5.5);

    geometry = new THREE.BoxGeometry( 0.3, 0.3, 0.3 );
    var material = new THREE.MeshBasicMaterial( {color: 0xff0000} );
    target = new THREE.Mesh( geometry, material );
    scene.add( target );

    target.position.copy(player.position);

    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.setClearColor(0xffffff);
    container.appendChild( renderer.domElement );

    raycaster = new THREE.Raycaster();

    document.addEventListener( 'click', onDocumentMouseClick, false );
    window.addEventListener( 'resize', onWindowResize, false );

    controls = new THREE.OrbitControls( camera );
    controls.damping = 0.2;

    // Create a group to hold the objects
    /*group = new THREE.Object3D;
    root.add(group);*/

    //scene.add( root );
}

function onDocumentMouseClick (event) {

  mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
  mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

  camera.updateMatrixWorld();

  raycaster.setFromCamera( mouse, camera );

  var intersects = raycaster.intersectObject( level );

  if ( intersects.length > 0 ) {
    var vec = intersects[0].point;
    target.position.copy(vec);

    // Teleport on ctrl/cmd click.
    if (event.metaKey || event.ctrlKey) {
      player.position.copy(target.position);
      playerNavMeshGroup = pathfinder.getGroup('level', player.position);
      if (pathLines) scene.remove(pathLines);
      if (calculatedPath) calculatedPath.length = 0;
      return;
    }

    // Calculate a path to the target and store it
    calculatedPath = pathfinder.findPath(player.position, target.position, 'level', playerNavMeshGroup);

    if (calculatedPath && calculatedPath.length) {

      if (pathLines) {
        scene.remove(pathLines);
      }

      var material = new THREE.LineBasicMaterial({
        color: 0x0000ff,
        linewidth: 2
      });

      var geometry = new THREE.Geometry();
      geometry.vertices.push(player.position);

      // Draw debug lines
      for (var i = 0; i < calculatedPath.length; i++) {
        geometry.vertices.push(calculatedPath[i].clone().add(new THREE.Vector3(0, 0.2, 0)));
      }

      pathLines = new THREE.Line( geometry, material );
      scene.add( pathLines );

      // Draw debug cubes except the last one. Also, add the player position.
      var debugPath = [player.position].concat(calculatedPath);

      for (var i = 0; i < debugPath.length - 1; i++) {
        geometry = new THREE.BoxGeometry( 0.3, 0.3, 0.3 );
        var material = new THREE.MeshBasicMaterial( {color: 0x00ffff} );
        var node = new THREE.Mesh( geometry, material );
        node.position.copy(debugPath[i]);
        pathLines.add( node );
      }
    }
  }
}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

}

function animate() {
          var currTime = window.performance.now();
          var delta = (currTime - lastFrameTime) / 1000;
          var dTime = Math.min(delta, maxFrameTime);
          elapsedTime += delta;
          lastFrameTime = currTime;

          tick(dTime);

  requestAnimationFrame( animate );
  render();
}

function tick(dTime) {
  if (!level) {
    return;
  }

  var speed = 5;

  var targetPosition;

  if (calculatedPath && calculatedPath.length) {
    targetPosition = calculatedPath[0];

    var vel = targetPosition.clone().sub(player.position);

    if (vel.lengthSq() > 0.05 * 0.05) {
      vel.normalize();

      // Mve player to target
      player.position.add(vel.multiplyScalar(dTime * speed));
    }
    else {
      // Remove node from the path we calculated
      calculatedPath.shift();
    }
  }
}

function render() {
  camera.lookAt( scene.position );
  camera.updateMatrixWorld();

  renderer.render( scene, camera );

}
