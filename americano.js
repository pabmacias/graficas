// 1. Enable shadow mapping in the renderer.
// 2. Enable shadows and set shadow parameters for the lights that cast shadows.
// Both the THREE.DirectionalLight type and the THREE.SpotLight type support shadows.
// 3. Indicate which geometry objects cast and receive shadows.

var renderer = null,
scene = null,
camera = null,
root = null,
stadium = null,
group = null,
orbitControls = null;

var objLoader = null;

var duration = 20000; // ms
var currentTime = Date.now();

function loadObj()
{
    if(!objLoader)
        objLoader = new THREE.OBJLoader();

    objLoader.load(
        '70545_Soccer_Stadium_Large/stadiv_nav.obj',

        function(object)
        {
            object.traverse( function ( child )
            {
                if ( child instanceof THREE.Mesh )
                {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            } );

            stadium = object;
            stadium.scale.set(3,3,3);
            stadium.position.z = -3;
            stadium.position.x = -1.5;
            stadium.rotation.x = Math.PI / 180 * 15;
            stadium.rotation.y = -3;
            scene.add(stadium);
        },
        function ( xhr ) {

            console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );

        },
        // called when loading has errors
        function ( error ) {

            console.log( 'An error happened' );

        });
}

function animate() {
  console.log("animate");
}

function run() {
    requestAnimationFrame(function() { run(); });

        // Render the scene
        renderer.render( scene, camera );

        // Spin the cube for next frame

        // Update the camera controller
        orbitControls.update();
}

function setLightColor(light, r, g, b)
{
    r /= 255;
    g /= 255;
    b /= 255;

    light.color.setRGB(r, g, b);
}

var directionalLight = null;
var spotLight = null;
var ambientLight = null;
var mapUrl = "../images/checker_large.gif";

var SHADOW_MAP_WIDTH = 2048, SHADOW_MAP_HEIGHT = 2048;

function createScene(canvas) {

    // Create the Three.js renderer and attach it to our canvas
    renderer = new THREE.WebGLRenderer( { canvas: canvas, antialias: true } );

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

    var onProgress = function ( xhr ) {
      if ( xhr.lengthComputable ) {
        var percentComplete = xhr.loaded / xhr.total * 100;
        console.log( Math.round( percentComplete, 2 ) + '% downloaded' );
      }
    };

    var onError = function ( xhr ) { };

    var mtlLoader = new THREE.MTLLoader();
    //mtlLoader.setTexturePath( '70545_Soccer_Stadium_Large/' );
    //mtlLoader.setPath( '70545_Soccer_Stadium_Large/' );
    var url = "models/70545_Soccer_Stadium_Large/arena3.mtl";
    mtlLoader.load( url, function( materials ) {

        materials.preload();

        if ( materials.lights ) {
          uniforms.ambientLightColor.value = _lights.ambient; // this line breaksPa
		    }

        var objLoader = new THREE.OBJLoader();
        objLoader.setMaterials( materials );
        //objLoader.setPath( '70545_Soccer_Stadium_Large/' );
        objLoader.load( 'models/70545_Soccer_Stadium_Large/arena3.obj', function ( object ) {

            object.position.y = 0;
            object.position.x = 0;
            // object.position.z = -200;
            // object.scale.x = 0.05;
            // object.scale.y = 0.05;
            // object.scale.z = 0.05;
            scene.add( object );

        }, onProgress, onError );

    });

    // Create a group to hold the objects
    /*group = new THREE.Object3D;
    root.add(group);*/

    //scene.add( root );
}
