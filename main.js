import WindowManager from './WindowManager.js'



const t = THREE;
let camera, scene, renderer, world;
let near, far;
let pixR = window.devicePixelRatio ? window.devicePixelRatio : 1;
let cubes = [];
let sceneOffsetTarget = {x: 0, y: 0};
let sceneOffset = {x: 0, y: 0};

let today = new Date();
today.setHours(0);
today.setMinutes(0);
today.setSeconds(0);
today.setMilliseconds(0);
today = today.getTime();

let internalTime = getTime();
let windowManager;
let initialized = false;

// get time in seconds since beginning of the day (so that all windows use the same time)
function getTime ()
{
	return (new Date().getTime() - today) / 1000.0;
}


if (new URLSearchParams(window.location.search).get("clear"))
{
	localStorage.clear();
}
else
{	
	// this code is essential to circumvent that some browsers preload the content of some pages before you actually hit the url
	document.addEventListener("visibilitychange", () => 
	{
		if (document.visibilityState != 'hidden' && !initialized)
		{
			init();
		}
	});

	window.onload = () => {
		if (document.visibilityState != 'hidden')
		{
			init();
		}
	};

	function init ()
	{
		initialized = true;

		// add a short timeout because window.offsetX reports wrong values before a short period 
		setTimeout(() => {
			setupScene();
			setupWindowManager();
			resize();
			updateWindowShape(false);
			render();
			window.addEventListener('resize', resize);
		}, 500)	
	}

	function setupScene ()
	{
		camera = new t.OrthographicCamera(0, 0, window.innerWidth, window.innerHeight, -10000, 10000);
		
		camera.position.z = 2.5;
		near = camera.position.z - .5;
		far = camera.position.z + 0.5;

		scene = new t.Scene();
		scene.background = new t.Color(0.0);
		scene.add( camera );

		renderer = new t.WebGLRenderer({antialias: true, depthBuffer: true});
		renderer.setPixelRatio(pixR);
	    
	  	world = new t.Object3D();
		scene.add(world);

		renderer.domElement.setAttribute("id", "scene");
		document.body.appendChild( renderer.domElement );
	}

	function setupWindowManager ()
	{
		windowManager = new WindowManager();
		windowManager.setWinShapeChangeCallback(updateWindowShape);
		windowManager.setWinChangeCallback(windowsUpdated);
	
		let metaData = {foo: "bar"};
	
		windowManager.init(metaData);
	
		// FIX: Delay the first windowsUpdated() slightly
		setTimeout(() => {
			windowsUpdated();
		}, 200); // wait 200ms
	}
	

	function windowsUpdated ()
	{
		updateNumberOfCubes();
	}
	function updateNumberOfCubes ()
	{
		let wins = windowManager.getWindows();
	
		// remove all previous shapes
		cubes.forEach((c) => {
			world.remove(c);
		})
	
		cubes = [];
	
		// create football-like spheres
		for (let i = 0; i < wins.length; i++)
		{
			let win = wins[i];
	
			let color = new t.Color();
			color.setHSL(i * .1, 1.0, .5);
	
			let radius = 70 + i * 20;
			let detail = 1; // subdivision for smoother shape
	
			let football = new t.Mesh(
				new t.IcosahedronGeometry(radius, detail),
				new t.MeshBasicMaterial({ color: color, wireframe: true })
			);
	
			football.position.x = win.shape.x + (win.shape.w * .5);
			football.position.y = win.shape.y + (win.shape.h * .5);
	
			world.add(football);
			cubes.push(football);
			let connections = [];
			// remove old connections
connections.forEach(conn => world.remove(conn));
connections = [];

// create new connections between every pair of footballs
for (let i = 0; i < cubes.length; i++) {
    for (let j = i + 1; j < cubes.length; j++) {
        let cubeA = cubes[i];
        let cubeB = cubes[j];

        // Mix colors
        let colorA = new t.Color(cubeA.material.color);
        let colorB = new t.Color(cubeB.material.color);
        let mixedColor = colorA.clone().lerp(colorB, 0.5);

        // Create geometry
        let geometry = new t.BufferGeometry();
        let points = [
            new t.Vector3(cubeA.position.x, cubeA.position.y, cubeA.position.z),
            new t.Vector3(cubeB.position.x, cubeB.position.y, cubeB.position.z),
        ];
        geometry.setFromPoints(points);

        let material = new t.LineBasicMaterial({ color: mixedColor });

        let line = new t.Line(geometry, material);
        world.add(line);
        connections.push(line);
    }
}

		}
	}
	
	

	function updateWindowShape (easing = true)
	{
		// storing the actual offset in a proxy that we update against in the render function
		sceneOffsetTarget = {x: -window.screenX, y: -window.screenY};
		if (!easing) sceneOffset = sceneOffsetTarget;
	}


	function render ()
	{
		let t = getTime();

		windowManager.update();


		// calculate the new position based on the delta between current offset and new offset times a falloff value (to create the nice smoothing effect)
		let falloff = .05;
		sceneOffset.x = sceneOffset.x + ((sceneOffsetTarget.x - sceneOffset.x) * falloff);
		sceneOffset.y = sceneOffset.y + ((sceneOffsetTarget.y - sceneOffset.y) * falloff);

		// set the world position to the offset
		world.position.x = sceneOffset.x;
		world.position.y = sceneOffset.y;

		let wins = windowManager.getWindows();


		// loop through all our cubes and update their positions based on current window positions
		for (let i = 0; i < cubes.length; i++)
		{
			let cube = cubes[i];
			let win = wins[i];
			let _t = t;// + i * .2;

			let posTarget = {x: win.shape.x + (win.shape.w * .5), y: win.shape.y + (win.shape.h * .5)}

			cube.position.x = cube.position.x + (posTarget.x - cube.position.x) * falloff;
			cube.position.y = cube.position.y + (posTarget.y - cube.position.y) * falloff;
			cube.rotation.x = _t * .5;
			cube.rotation.y = _t * .3;
		};

		renderer.render(scene, camera);
		requestAnimationFrame(render);
	}


	// resize the renderer to fit the window size
	function resize ()
	{
		let width = window.innerWidth;
		let height = window.innerHeight
		
		camera = new t.OrthographicCamera(0, width, 0, height, -10000, 10000);
		camera.updateProjectionMatrix();
		renderer.setSize( width, height );
	}
}