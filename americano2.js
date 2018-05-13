var camera, scene, renderer, controls, enemies;

var objArr = [];

var raycaster, gunRaycaster;

var blocker,  instructions;

var controlsEnabled = false;

var objLoader = null;

var score = 0;

var moveForward = false;
var moveBackward = false;
var moveLeft = false;
var moveRight = false;
var canJump = false;

var prevTime = performance.now();
var velocity, direction;

var floorUrl = "images/checker_large.gif";
var cubeUrl = "images/wooden_crate_texture_by_zackseeker-d38ddsb.png";

var mouse, INTERSECTED = null;

// http://www.html5rocks.com/en/tutorials/pointerlock/intro/

function initPointerLock()
{
    var havePointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;

    if ( havePointerLock )
    {
        var element = document.body;

        var pointerlockchange = function ( event ) {

            if ( document.pointerLockElement === element || document.mozPointerLockElement === element || document.webkitPointerLockElement === element ) {

                controlsEnabled = true;
                controls.enabled = true;

                blocker.style.display = 'none';

            } else {

                controls.enabled = false;

                blocker.style.display = 'block';

                instructions.style.display = '';

            }

        };

        var pointerlockerror = function ( event ) {

            instructions.style.display = '';

        };

        // Hook pointer lock state change events
        document.addEventListener( 'pointerlockchange', pointerlockchange, false );
        document.addEventListener( 'mozpointerlockchange', pointerlockchange, false );
        document.addEventListener( 'webkitpointerlockchange', pointerlockchange, false );

        document.addEventListener( 'pointerlockerror', pointerlockerror, false );
        document.addEventListener( 'mozpointerlockerror', pointerlockerror, false );
        document.addEventListener( 'webkitpointerlockerror', pointerlockerror, false );

        instructions.addEventListener( 'click', function ( event )
        {
            instructions.style.display = 'none';

            // Ask the browser to lock the pointer
            element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;
            element.requestPointerLock();

        }, false );

    } else {

        instructions.innerHTML = 'Your browser doesn\'t seem to support Pointer Lock API';

    }
}

function loadObj()
{
    if(!objLoader)
        objLoader = new THREE.OBJLoader();

    objLoader.load(
        'models/cerberus/Cerberus.obj',

        function(object)
        {
            var texture = new THREE.TextureLoader().load('models/cerberus/Cerberus_A.jpg');
            var normalMap = new THREE.TextureLoader().load('models/cerberus/Cerberus_N.jpg');
            var specularMap = new THREE.TextureLoader().load('models/cerberus/Cerberus_M.jpg');

            object.traverse( function ( child )
            {
                if ( child instanceof THREE.Mesh )
                {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    child.material.map = texture;
                    child.material.normalMap = normalMap;
                    child.material.specularMap = specularMap;
                }
            } );

            gun = object;
            gun.scale.set(3,3,3);
            gun.position.z = 0;
            gun.position.x = 0;
            gun.rotation.x = 0;
            gun.rotation.y = 0;
            pistol.add(object);
        },
        function ( xhr ) {

            console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );

        },
        // called when loading has errors
        function ( error ) {

            console.log( 'An error happened' );

        });
}

var onProgress = function ( xhr ) {
  if ( xhr.lengthComputable ) {
    var percentComplete = xhr.loaded / xhr.total * 100;
    console.log( Math.round( percentComplete, 2 ) + '% downloaded' );
  }
};

var onError = function ( xhr ) { };

function createScene(canvas)
{
    renderer = new THREE.WebGLRenderer( { canvas: canvas, antialias: true } );

    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );

    window.addEventListener( 'resize', onWindowResize, false );

    velocity = new THREE.Vector3();
    direction = new THREE.Vector3();

    blocker = document.getElementById( 'blocker' );
    instructions = document.getElementById( 'instructions' );

    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 1000 );

    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0xffffff );
    scene.fog = new THREE.Fog( 0xffffff, 0, 550 );

    mouse = new THREE.Vector2();
    mouse.x=0;
    mouse.y=0;

    // A light source positioned directly above the scene, with color fading from the sky color to the ground color.
    // HemisphereLight( skyColor, groundColor, intensity )
    // skyColor - (optional) hexadecimal color of the sky. Default is 0xffffff.
    // groundColor - (optional) hexadecimal color of the ground. Default is 0xffffff.
    // intensity - (optional) numeric value of the light's strength/intensity. Default is 1.

    var light = new THREE.HemisphereLight( 0xeeeeff, 0x777788, 0.75 );
    light.position.set( 0.5, 1, 0.75 );
    scene.add( light );

    controls = new THREE.PointerLockControls( camera );
    scene.add( controls.getObject() );

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

    //document.addEventListener( 'mousemove', onDocumentMouseMove );
    document.addEventListener('mousedown', onDocumentMouseDown);
}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

}

function onDocumentMouseDown(event)
{
    event.preventDefault();

    // find intersections

    var intersects = gunRaycaster.intersectObjects( objArr );

    if ( intersects.length > 0 )
    {
      objectAnim = intersects[ 0 ].object;
      initAnimations();
      playAnimations();
      scene.remove(intersects[0]);
      score++;
      document.getElementById("title").innerHTML = score;
    }
}

function initAnimations()
{
    animator = new KF.KeyFrameAnimator;
    animator.init({
        interps:
            [
              {
                  keys:[0, 1],
                  values:[
                          { x : 2, y: 2 },
                          { x : 0.00001, y: 0.00001 },
                        ],
                  target:objectAnim.scale
              },
            ],
        loop: false,
        duration: 0.8 * 1000,
    });
}

function playAnimations()
{
    animator.start();
}

function run()
{
    requestAnimationFrame( run );
    KF.update();

    if ( controlsEnabled === true )
    {
        raycaster.ray.origin.copy( controls.getObject().position );
        raycaster.ray.origin.y -= 10;

        // find intersections
        gunRaycaster.setFromCamera( mouse, camera );

        var intersects = gunRaycaster.intersectObjects( objArr );

        if ( intersects.length > 0 )
        {
            if ( INTERSECTED != intersects[ 0 ].object )
            {
                if ( INTERSECTED )
                    INTERSECTED.material.emissive.setHex( INTERSECTED.currentHex );

                INTERSECTED = intersects[ 0 ].object;
                INTERSECTED.currentHex = INTERSECTED.material.emissive.getHex();
                INTERSECTED.material.emissive.setHex( 0xff0000 );
            }
        }
        else
        {
            if ( INTERSECTED )
                INTERSECTED.material.emissive.setHex( INTERSECTED.currentHex );

            INTERSECTED = null;
        }

        var onObject = intersects.length > 0;

        var time = performance.now();
        var delta = ( time - prevTime ) / 1000;

        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;
        velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass

        direction.z = Number( moveForward ) - Number( moveBackward );
        direction.x = Number( moveLeft ) - Number( moveRight );
        direction.normalize(); // this ensures consistent movements in all directions

        if ( moveForward || moveBackward ) velocity.z -= direction.z * 400.0 * delta;
        if ( moveLeft || moveRight ) velocity.x -= direction.x * 400.0 * delta;

        if ( onObject === true )
        {
            velocity.y = Math.max( 0, velocity.y );
            canJump = true;
        }

        controls.getObject().translateX( velocity.x * delta );
        controls.getObject().translateY( velocity.y * delta );
        controls.getObject().translateZ( velocity.z * delta );

        if ( controls.getObject().position.y < 10 ) {

            velocity.y = 0;
            controls.getObject().position.y = 10;

            canJump = true;

        }

        prevTime = time;

    }

    renderer.render( scene, camera );

}
