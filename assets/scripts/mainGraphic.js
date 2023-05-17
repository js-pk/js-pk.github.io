window.onload = function() {
    // module aliases
    var Engine = Matter.Engine,
    Render = Matter.Render,
    Runner = Matter.Runner,
    Bodies = Matter.Bodies,
    Composite = Matter.Composite,
    Common = Matter.Common,
    Vertices = Matter.Vertices,
    Svg = Matter.Svg,
    Bounds = Matter.Bounds,
    Sleeping = Matter.Sleeping;

    // create an engine
    var engine = Engine.create({
        enableSleeping: true,
        gravity:{
            x: 0,
            y: 0.1
        }
    });

    // create a renderer
    var canvas = document.getElementById('canvas');
    var render = Render.create({
        element: document.body,
        canvas: canvas,
        engine: engine,
        options: {
            background: 'transparent',
            wireframes: false,
            pixelRatio: window.devicePixelRatio,
            width: window.innerWidth,
            height: window.innerHeight,
            hasBounds: true,
            showSleeping: false
        }
    });

    // generate svg and polygons to draw
    loadPolygons();
    loadSvgs(() => {
        //set controls after svgs all loaded
        setControls();
    });

    // run the renderer
    Render.run(render);

    // create runner
    var runner = Runner.create();

    // run the engine
    Runner.run(runner, engine);

    function getRandomPosition (minX, maxX, minY, maxY) {
        Common._seed = Math.random()*10000;

        minX = minX || render.bounds.max.x*0.2;
        maxX = maxX || render.bounds.max.x*0.8;
        minY = minY || render.bounds.max.y*1.1;
        maxY = maxY || render.bounds.max.y*1.3;

        return {
            x: Common.random(minX, maxX),
            y: Common.random(minY, maxY)
        }
    }

    async function loadSvgs(callback) {
        var select = function(root, selector) {
            return Array.prototype.slice.call(root.querySelectorAll(selector));
        };

        var loadSvg = function(url) {
            return fetch(url)
                .then(function(response) { return response.text(); })
                .then(function(raw) { return (new window.DOMParser()).parseFromString(raw, 'image/svg+xml'); });
        };

        // add svgs
        const urls = [
            '/assets/images/j.svg', 
            '/assets/images/s.svg', 
            '/assets/images/p.svg', 
            '/assets/images/k.svg', 
        ];

        var ratio = getSizeRatio();

        Promise.all(urls.map(function(path, i) { 
            return loadSvg(path).then(function(root) {
                var color = Common.choose(['#ffd400', '#1c79ff', '#ff4a26']);
                var friction = Common.random(0.001, 0.2);
                var torque = Common.random(-0.2, 0.2 );
                var mass = Common.random(1, 2);
                var vertexSets = select(root, 'path')
                    .map(function(path) { return Vertices.scale(Svg.pathToVertices(path, 5), 1.2*ratio, 1.2*ratio); });

                var body = Bodies.fromVertices(getRandomPosition(render.bounds.max.x*0.22*i, render.bounds.max.x*0.22*(i+1)).x, getRandomPosition().y, vertexSets, {
                    friction: friction,
                    torque: torque,
                    mass: mass,
                    render: {
                        fillStyle: color,
                        strokeStyle: color,
                        lineWidth: 1
                    }
                }, true);
                Composite.add(engine.world, body);
            });
        }))
        .then(data => {
            callback()
        })
        .catch(error => {
            console.log("svg load failed..")
            callback()
        })
    }

    function loadPolygons() {
        var ratio = getSizeRatio();
        var rectangle = Bodies.rectangle(getRandomPosition().x, getRandomPosition().y, 120*ratio, 120*ratio, {
            frictionAir: 0.005,
            torque: -0.2,
            mass: 1,
            render: {
                fillStyle: "#ffd400"
            }
        });

        var circle = Bodies.circle(getRandomPosition().x, getRandomPosition().y, 60*ratio, {
            frictionAir: 0.02,
            torque: 0.1,
            mass: 0.5,
            render: {
                fillStyle: "#1c79ff"
            }
        }, 8 );

        var triangle = Bodies.polygon(getRandomPosition().x, getRandomPosition().y, 3, 84*ratio, {
            frictionAir: 0.02,
            torque: -0.4,
            mass: 1,
            render: {
                fillStyle: "#ff4a26"
            }
        });

        var ground = Bodies.rectangle(0, render.bounds.max.y + 400, render.bounds.max.x*window.devicePixelRatio, 60, { 
            isStatic: true,
            render: {
                fillStyle: "transparent",
            }
        });
        Composite.add(engine.world, [rectangle, circle, triangle, ground]);

        // set floor
        var radius = 200;
        for (let i=0; i < Math.round((render.bounds.max.x + radius*4) / radius*2); i++) {
            let floorCircle = Bodies.circle(i*radius*2, -radius*2, radius, {
                isStatic: true,
                render: {
                    fillStyle: "transparent"
                }
            }, 8);
            Composite.add(engine.world, floorCircle);
        }
    }

    function getSizeRatio() {
        var ratio = 1;
        if (window.innerWidth > 800) {
            ratio = window.innerWidth / 800;
            if (ratio > 1.6) {
                ratio = 1.6;
            }
        }
        return ratio;
    }

    function setControls() {
        var options = {
            delay: 50,
            maxDelta: 20
        };
        var getScrollSpeed = makeGetScrollSpeed(options);
        var controller = makeController();

        window.onscroll = function() {
            const map = (value, x1, y1, x2, y2) => (value - x1) * (y2 - x2) / (y1 - x1) + x2;

            if (!controller.isCanvasHidden) {
                controller.awake();
                engine.gravity.y =  map(getScrollSpeed(), -options.maxDelta, options.maxDelta, 0.8, -0.85);
                //the slight difference between min and max make objects float when scroll stops
            }
        };

        window.onresize = function() {
            //this just resize the canvas, not the bounds but looks fine enough
            render.canvas.width = window.innerWidth*window.devicePixelRatio;
            render.canvas.height = window.innerHeight*window.devicePixelRatio;
            render.canvas.style.width = `${window.innerWidth}px`;
            render.canvas.style.height =`${window.innerHeight}px`;

            // Bounds.update(render.bounds, [{x:0, y:0}, {x:window.innerWidth, y:0}, {x:window.innerWidth, y:window.innerHeight}, {x:0, y:window.innerHeight}]);
        };

        window.onclick = function(event) {
            
            controller.toggleCanvas();    
        };
    }

    function makeController() {
        let isCanvasHidden = false;
        let bodies = Composite.allBodies(engine.world);

        function toggleCanvas() {
            if (!isCanvasHidden) {
                bodies.forEach((b) => {
                    Sleeping.set(b, true);
                })
                render.canvas.style.visibility = "hidden";
                isCanvasHidden = true;
            } else {
                bodies.forEach((b) => {
                    Sleeping.set(b, false);
                })
                render.canvas.style.visibility = "visible";
                isCanvasHidden = false;
            }
        }

        function awake() {
            bodies.forEach((b) => {
                if (b.isSleeping) {
                    Sleeping.set(b, false);
                }
            })
        }

        return {
            isCanvasHidden: isCanvasHidden,
            toggleCanvas: toggleCanvas,
            awake: awake
        }
    };
    
    function makeGetScrollSpeed(options) {
        options = options || {
            ...options,
            delay: 50,
            maxDelta: 20
        };
        let lastPos, newPos, timer, delta;
        let delay = options.delay;
    
        function clear() {
            lastPos = null;
            delta = 0;
        }
    
        clear();
        
        return function() {
            newPos = window.scrollY;
    
            if (lastPos != null) {
                delta = newPos - lastPos;
            }
    
            lastPos = newPos;
            clearTimeout(timer);
            timer = setTimeout(clear, delay);
            
            // simple interpolation
            if (delta < -options.maxDelta) {
                delta = -options.maxDelta;
            }
            if (delta > options.maxDelta) {
                delta = options.maxDelta;
            }
            if (delta < 0.3 && delta > -0.3) {
                delat = 0;
            }
    
            return delta;
        }
    };
}

