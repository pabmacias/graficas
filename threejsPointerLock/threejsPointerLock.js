var camera, scene, renderer, controls;

var objects = [];
var helmet;

var raycaster;

var blocker,  instructions;

var controlsEnabled = false;

var moveForward = false;
var moveBackward = false;
var moveLeft = false;
var moveRight = false;
var canJump = false;

var prevTime = performance.now();
var velocity, direction;

var floorUrl = "../images/checker_large.gif";
var cubeUrl = "../images/wooden_crate_texture_by_zackseeker-d38ddsb.png";

// Bullets array
//var bullets = [];
var keyboard = {};
//var player = { height:1.8, speed:0.2, turnSpeed:Math.PI*0.02, canShoot:0 };

var objLoader = null;

// http://www.html5rocks.com/en/tutorials/pointerlock/intro/

var animator = null,
duration = 25, // sec
loopAnimation = true;
var enter = false;


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

function onKeyDown ( event )
{
    switch ( event.keyCode ) {

        case 38: // up
        case 87: // w
            moveForward = true;
            break;

        case 37: // left
        case 65: // a
            moveLeft = true; break;

        case 40: // down
        case 83: // s
            moveBackward = true;
            break;

        case 39: // right
        case 68: // d
            moveRight = true;
            break;

        case 32: // space
            if ( canJump === true ) velocity.y += 350;
            canJump = false;
            break;

    }

}

function onKeyUp( event ) {

    switch( event.keyCode ) {

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
    
    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.5, 10000 );
    //camera = new THREE.OrthographicCamera( 75, window.innerWidth / window.innerHeight, 1, 1000 );
    

    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0xffffff );
    //scene.fog = new THREE.Fog( 0xffffff, 0, 550 );

    // A light source positioned directly above the scene, with color fading from the sky color to the ground color. 
    // HemisphereLight( skyColor, groundColor, intensity )
    // skyColor - (optional) hexadecimal color of the sky. Default is 0xffffff.
    // groundColor - (optional) hexadecimal color of the ground. Default is 0xffffff.
    // intensity - (optional) numeric value of the light's strength/intensity. Default is 1.

    var light = new THREE.HemisphereLight( 0xeeeeff, 0x777788, 0.75 );
    light.position.set( 0.5, 1, 0.75 );
    scene.add( light );

    controls = new THREE.PointerLockControls( camera );
    controls.getObject().rotation.y = Math.PI;
    scene.add( controls.getObject() );
    initAnimations( /*camera*/ controls.getObject() );

    document.addEventListener( 'keydown', onKeyDown, false );
    document.addEventListener( 'keyup', onKeyUp, false );

    // Raycaster( origin, direction, near, far )
    // origin — The origin vector where the ray casts from.
    // direction — The direction vector that gives direction to the ray. Should be normalized.
    // near — All results returned are further away than near. Near can't be negative. Default value is 0.
    // far — All results returned are closer then far. Far can't be lower then near . Default value is Infinity.
    raycaster = new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3( 0, - 1, 0 ), 0, 10 );

    // floor

    /*var map = new THREE.TextureLoader().load(floorUrl);
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    map.repeat.set(8, 8);

    var floorGeometry = new THREE.PlaneGeometry( 2000, 2000, 100, 100 );
    var floor = new THREE.Mesh(floorGeometry, new THREE.MeshPhongMaterial({color:0xffffff, side:THREE.DoubleSide}));
    floor.rotation.x = -Math.PI / 2;
    scene.add( floor );*/

    // objects

    var mtlLoader = new THREE.MTLLoader();
    //mtlLoader.setTexturePath( '70545_Soccer_Stadium_Large/' );
    //mtlLoader.setPath( '70545_Soccer_Stadium_Large/' );
    var url = "../models/arena4.mtl";
    mtlLoader.load( url, function( materials ) {

        materials.preload();

        if ( materials.lights ) {
          uniforms.ambientLightColor.value = _lights.ambient; // this line breaksPa
            }

        var objLoader = new THREE.OBJLoader();
        objLoader.setMaterials( materials );
        //objLoader.setPath( '70545_Soccer_Stadium_Large/' );
        objLoader.load( '../models/arena4.obj', function ( stadium ) {

            stadium.position.y = 0;
            stadium.position.x = 0;
            // stadium.position.z = -200;
            stadium.scale.x = 10;
            stadium.scale.y = 10;
            stadium.scale.z = 10;

            scene.add( stadium );

        }, onProgress, onError );

    });

    url = "../models/arena_nav.mtl";
    mtlLoader.load( url, function( materials ) {

        materials.preload();

        if ( materials.lights ) {
          uniforms.ambientLightColor.value = _lights.ambient; // this line breaksPa
            }

        var objLoader = new THREE.OBJLoader();
        objLoader.setMaterials( materials );
        //objLoader.setPath( '70545_Soccer_Stadium_Large/' );
        objLoader.load( '../models/arena_nav.obj', function ( navmesh ) {

            navmesh.position.y = 0;
            navmesh.position.x = 0;
            // navmesh.position.z = -200;
            navmesh.scale.x = 10;
            navmesh.scale.y = 10;
            navmesh.scale.z = 10;

            const ZONE = 'level';
            //pathfinder.setZoneData(ZONE, THREE.Pathfinding.createZone(navmesh.geometry));

           //playerNavMeshGroup = pathfinder.getGroup('level', player.position);

            //scene.add( object );

        }, onProgress, onError );

    });

    var mtlLoader = new THREE.MTLLoader();
    //mtlLoader.setTexturePath( '70545_Soccer_Stadium_Large/' );
    //mtlLoader.setPath( '70545_Soccer_Stadium_Large/' );
    var url = "../models/AmericanFootballHelmet.mtl";
    mtlLoader.load( url, function( materials ) {

        materials.preload();

        if ( materials.lights ) {
          uniforms.ambientLightColor.value = _lights.ambient; // this line breaksPa
            }

        var objLoader = new THREE.OBJLoader();
        objLoader.setMaterials( materials );
        //objLoader.setPath( '70545_Soccer_Stadium_Large/' );
        objLoader.load( '../models/AmericanFootballHelmet.obj', function ( object ) {

            object.position.y = -0.67;
            object.position.x = 0;
            object.position.z = -0.005;
            object.scale.x = 0.5;
            object.scale.y = 0.5;
            object.scale.z = 0.5;
            object.rotation.y = - 3*Math.PI/4;
            helmet = object;

            //scene.add( helmet );
            camera.add( helmet );

        }, onProgress, onError );

    });
}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

}

function run() 
{
    requestAnimationFrame( run );

    
    if ( controlsEnabled === true ) 
    {
        setTimeout(function(){ 
            enter == false;
        }, duration*1000);
        // Update the animations
        KF.update();
        raycaster.ray.origin.copy( controls.getObject().position );
        raycaster.ray.origin.y -= 10;

        var intersections = raycaster.intersectObjects( objects );

        var onObject = intersections.length > 0;

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

function initAnimations(obj) 
{
    animator = new KF.KeyFrameAnimator;
    if( enter == true){
        animator.init({ 
        interps:
            [
                { 
                    keys:[0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1], 
                    values:[
                            { z : 0 },
                            { z : 0 },
                            { z : 125 },
                            { z : 250 },
                            { z : 375 },
                            { z : 500 },
                            { z : 500 },
                            { z : 500 },
                            { z : 500 },
                            ],
                    target:obj.position
                },
                { 
                    keys:[0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1], 
                    values:[
                            { x : 0 },
                            { x : 0 },
                            { x : 0 },
                            { x : 0 },
                            { x : 100 },
                            { x : 200 },
                            { x : 300 },
                            { x : 400 },
                            { x : 400 },
                            ],
                    target:obj.position
                },
                { 
                    keys:[0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1], 
                    values:[
                            { y : Math.PI },
                            { y : Math.PI },
                            { y : Math.PI },
                            { y : Math.PI },
                            { y : 3*Math.PI/2 },
                            { y : 3*Math.PI/2 },
                            { y : 3*Math.PI/2 },
                            { y : 3*Math.PI/2 },
                            { y : 3*Math.PI/2 },
                            ],
                    target:obj.rotation
                },
            ],
        loop: loopAnimation,
        duration:duration * 1000,
    });
    }else{
        animator.init({ 
        interps:
            [
                { 
                    keys:[0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1], 
                    values:[
                            { y : 0 },
                            { y : 5 },
                            { y : 10 },
                            { y : 15 },
                            { y : 20 },
                            { y : 15 },
                            { y : 10 },
                            { y : 5 },
                            { y : 0 },
                            ],
                    target:obj.position
                },
                { 
                    keys:[0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1], 
                    values:[
                            { z : 500 },
                            { z : 500 },
                            { z : 500 },
                            { z : 500 },
                            { z : 500 },
                            { z : 500 },
                            { z : 500 },
                            { z : 500 },
                            { z : 500 },
                            ],
                    target:obj.position
                },
                { 
                    keys:[0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1], 
                    values:[
                            { x : 300 },
                            { x : 300 },
                            { x : 300 },
                            { x : 300 },
                            { x : 300 },
                            { x : 300 },
                            { x : 300 },
                            { x : 300 },
                            { x : 300 },
                            ],
                    target:obj.position
                },
            ],
        loop: loopAnimation,
        duration:duration * 1000,
    });
    }
    
    animator.start();
}