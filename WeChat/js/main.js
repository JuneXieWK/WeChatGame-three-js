import * as THREE from 'libs/three.min.js'

const zDistance   = 50
const DENSITY     = 8
const maxBoxSize  = 512

const image       = document.createElement('img')
const imageURL    = "images/indienova.png"
const particleURL = "images/particle.png"

let ctx   = canvas.getContext('webgl')

let scene
let renderer
let camera

let preLoadDone  = false;
let scaledWidth
let scaledHeight

let pixels
let particleSystem, particles, colors

/**
 * 游戏主函数
 */
export default class Main {
  constructor() {
    this.restart()
  }

  restart() {
    scene     = new THREE.Scene()
    renderer  = new THREE.WebGLRenderer({ context: ctx })

    const winWidth = window.innerWidth
    const winHeight = window.innerHeight
    const cameraAspect = winWidth / winHeight

    renderer.setSize(winWidth, winHeight)

    console.log("屏幕尺寸: " + winWidth + " x " + winHeight)

    camera = new THREE.PerspectiveCamera(65, cameraAspect, 10, 100000)
    camera.position.z = 800

    let loader = new THREE.ImageLoader()
    loader.load(imageURL, this.imageLoaded.bind(this))
  }

  /** 载入图片 */
  imageLoaded() {
    image.src = imageURL
    console.log('# 图片预载入完成', image)

    setTimeout(this.drawImage.bind(this), 1000)
  }

  drawImage() {
    // 绘制图片，并且确保它在屏幕大小内（其实并不可见）
    let ratio = Math.min(image.width / maxBoxSize, image.height / maxBoxSize)
    scaledWidth = Math.floor(ratio * image.width)
    scaledHeight = Math.floor(ratio * image.height)

    let offScreenCanvas = wx.createCanvas()
    offScreenCanvas.width = scaledWidth
    offScreenCanvas.height = scaledHeight
    let offScreenCtx = offScreenCanvas.getContext('2d')
    offScreenCtx.drawImage(image, 0, 0, scaledWidth, scaledHeight)
    pixels = offScreenCtx.getImageData(0, 0, scaledWidth, scaledHeight)
    offScreenCanvas = null

    //console.log('原始尺寸：', image.width, 'x', image.height)
    //console.log('绘制尺寸：', scaledWidth, 'x', scaledHeight)

    this.addParticles()
  }

  addParticles() {
    // 设置粒子的材质
    let loader   = new THREE.TextureLoader()
    let material = new THREE.PointsMaterial({
      size: DENSITY,
      sizeAttenuation: false,
      map: loader.load(particleURL),
      alphaTest: 0.5,
      transparent: true,
      vertexColors:true})
    let geometry = new THREE.Geometry()
    let step = DENSITY * 4
    let x, y

    // 循环图像的每个像素（与 DENSITY 相关）
    for (x = 0; x < scaledWidth * 4; x += step) {
      for (y = scaledHeight-1; y >= 0 ; y -= DENSITY) {
        let p = ((y * scaledWidth * 4) + x)
        // 获取像素点数据，跳过透明的
        if (pixels.data[p+3] > 0) {
          let pixelCol = (pixels.data[p] << 16) + (pixels.data[p+1] << 8) + pixels.data[p+2]
          let color = new THREE.Color(pixelCol)
          let vector = new THREE.Vector3(-scaledWidth/2 + x/4, scaledHeight/2 - y, 0)

          // 插入数据
          geometry.vertices.push(vector)
          geometry.colors.push(color)
        }
      }
    }

    // 现在创建一个新粒子体系
    particleSystem 	= new THREE.Points(geometry, material)
    particleSystem.sortParticles = true

    // 粒子的值
    particles = particleSystem.geometry.vertices
    colors = particleSystem.geometry.colors

    // 设置粒子的详细数据
    let ps = particles.length
    while(ps--) {
      let particle = particles[ps]
      particle.origPos = new THREE.Vector3(particle.x, particle.y, particle.z)
    }

    // gc and add
    pixels = null;
    scene.add(particleSystem)

    camera.lookAt(scene.position)

    console.log('粒子加入完成')

    // add subtle ambient lighting
    let ambientLight = new THREE.AmbientLight(0x222222)
    scene.add(ambientLight)

    // directional lighting
    let directionalLight = new THREE.DirectionalLight(0xffffff)
    directionalLight.position.set(0, 2, 2).normalize()
    scene.add(directionalLight)

    /* 渲染 */
    preLoadDone = true
    this.loop()
  }

  /**
   * 逻辑更新主函数
   */
  update() {
    // 更新代码
    if (preLoadDone) {
      let ps = particles.length
      while(ps--) {
        let particle = particles[ps]
        particle.z = particle.origPos.z + Math.random() * zDistance - zDistance/2
      }
      particleSystem.geometry.verticesNeedUpdate = true
    }
  }

  /**
   * canvas 重绘函数
   * 每一帧重新绘制所有的需要展示的元素
   */
  render() {
    if (preLoadDone) {
      particleSystem.rotation.y += 0.01;
      renderer.render(scene, camera)
    }
  }

  // 实现帧循环
  loop() {
    this.update()
    this.render()

    window.requestAnimationFrame(
      this.loop.bind(this),
      canvas
    )
  }
}

// import '/OrbitControls.js'
// import {initMaterial, Graphic, FrameBuffers} from '/shader.js'
// import {lerp, initColorGradient, initFXAA, initText} from '/initGraph.js'
// import {fxCopy} from "Material.js"
// import {graphic, texGradient, scene, sceneStencil, sceneStencil1} from "Global.js"

// var PATH_URL = "src/";
// var bgURL = PATH_URL+'textures/BG'+1+'.png';
// var Data = [{"ha":1389,"x_min":64,"x_max":1354,"o":"m 946 1119 l 692 1119 l 692 89 q 699 11 690 50 q 732 -60 707 -28 q 793 -103 757 -89 q 883 -118 836 -117 l 1079 -118 q 1165 -110 1122 -118 q 1249 -72 1211 -99 q 1300 -7 1282 -46 q 1322 85 1318 36 l 1333 313 l 1094 386 l 1088 189 q 1075 140 1088 163 q 1033 129 1057 126 l 999 129 q 969 132 983 129 q 954 140 961 133 q 946 185 943 161 l 946 446 q 1354 706 1156 567 l 1213 928 q 946 750 1083 831 l 946 1119 m 401 203 l 401 546 l 644 546 l 644 792 l 401 792 l 401 1118 l 149 1118 l 149 231 q 144 182 149 206 q 131 149 142 164 q 110 128 122 138 q 64 101 88 113 l 164 -156 q 386 -72 271 -103 q 658 -6 521 -36 l 656 265 q 401 203 529 228 z "},{"ha":1389,"x_min":64,"x_max":1354,"o":"m 946 1119 l 692 1119 l 692 89 q 699 11 690 50 q 732 -60 707 -28 q 793 -103 757 -89 q 883 -118 836 -117 l 1079 -118 q 1165 -110 1122 -118 q 1249 -72 1211 -99 q 1300 -7 1282 -46 q 1322 85 1318 36 l 1333 313 l 1094 386 l 1088 189 q 1075 140 1088 163 q 1033 129 1057 126 l 999 129 q 969 132 983 129 q 954 140 961 133 q 946 185 943 161 l 946 446 q 1354 706 1156 567 l 1213 928 q 946 750 1083 831 l 946 1119 m 401 203 l 401 546 l 644 546 l 644 792 l 401 792 l 401 1118 l 149 1118 l 149 231 q 144 182 149 206 q 131 149 142 164 q 110 128 122 138 q 64 101 88 113 l 164 -156 q 386 -72 271 -103 q 658 -6 521 -36 l 656 265 q 401 203 529 228 z "},{"ha":1389,"x_min":64,"x_max":1354,"o":"m 946 1119 l 692 1119 l 692 89 q 699 11 690 50 q 732 -60 707 -28 q 793 -103 757 -89 q 883 -118 836 -117 l 1079 -118 q 1165 -110 1122 -118 q 1249 -72 1211 -99 q 1300 -7 1282 -46 q 1322 85 1318 36 l 1333 313 l 1094 386 l 1088 189 q 1075 140 1088 163 q 1033 129 1057 126 l 999 129 q 969 132 983 129 q 954 140 961 133 q 946 185 943 161 l 946 446 q 1354 706 1156 567 l 1213 928 q 946 750 1083 831 l 946 1119 m 401 203 l 401 546 l 644 546 l 644 792 l 401 792 l 401 1118 l 149 1118 l 149 231 q 144 182 149 206 q 131 149 142 164 q 110 128 122 138 q 64 101 88 113 l 164 -156 q 386 -72 271 -103 q 658 -6 521 -36 l 656 265 q 401 203 529 228 z "},{"ha":1389,"x_min":64,"x_max":1354,"o":"m 946 1119 l 692 1119 l 692 89 q 699 11 690 50 q 732 -60 707 -28 q 793 -103 757 -89 q 883 -118 836 -117 l 1079 -118 q 1165 -110 1122 -118 q 1249 -72 1211 -99 q 1300 -7 1282 -46 q 1322 85 1318 36 l 1333 313 l 1094 386 l 1088 189 q 1075 140 1088 163 q 1033 129 1057 126 l 999 129 q 969 132 983 129 q 954 140 961 133 q 946 185 943 161 l 946 446 q 1354 706 1156 567 l 1213 928 q 946 750 1083 831 l 946 1119 m 401 203 l 401 546 l 644 546 l 644 792 l 401 792 l 401 1118 l 149 1118 l 149 231 q 144 182 149 206 q 131 149 142 164 q 110 128 122 138 q 64 101 88 113 l 164 -156 q 386 -72 271 -103 q 658 -6 521 -36 l 656 265 q 401 203 529 228 z "}];

// var time=0, delta=0;
// let ctx   = canvas.getContext('webgl')
// let renderer;
// export default class Main {
// 	constructor() {
// 		// var camera;
// 		// var controls;
// 		// var target = new THREE.Vector3(0,0,0)
// 		// var camDefaultPos = new THREE.Vector3(0, 0, 22.2);

// 		// var clock = new THREE.Clock();
// 		// var matCopy, matFXAA;
// 		// var frameBuffers;
// 		// var texBG;
// 		// var text, sky;
// 		console.log(345937450)
// 		//------------------------------------------------------------- Render
// 		renderer  = new THREE.WebGLRenderer({ context: ctx })
// 		console.log(0.001)
// 		renderer.setSize(window.innerWidth
// 			, window.innerHeight
// 		)

// 		// // renderer.toneMapping = THREE.LinearToneMapping;
// 		// // renderer.shadowMap.enabled = true;
// 		// // renderer.gammaInput = true;
// 		// // renderer.gammaOutput = true;
// 		// renderer.autoClear = false;
// 		// renderer.sortObjects = false;
// 		// // renderer.shadowMap.type = THREE.PCFSoftShadowMap;
// 		// //-----------------------------------------------------------

// 		// console.log(0.1)
// 		// graphic.init(renderer);

// 		// console.log(1)
// 		// matCopy = initMaterial(fxCopy);
// 		// //-----------------------------------------------------------
// 		// initColorGradient(6,function(tex){
// 		// 	texGradient.init(tex);
// 		// 	new THREE.TextureLoader().load(bgURL,function(tex){
// 		// 		texBG = tex;
// 		// 		texBG.wrapS = texBG.wrapT = THREE.RepeatWrapping;
// 		// 		init();
// 		// 		animate();
// 		// 		setResoluation(window.innerWidth, window.innerHeight, window.devicePixelRatio)
// 		// 		// callback();
// 		// 	});
// 		// 	console.log(2)
// 		// });

// 		// function init()
// 		// {
// 		// 	frameBuffers = FrameBuffers();
// 		// 	//----------------------------------------------------------- Camera
// 		// 	camera = new THREE.PerspectiveCamera( 22, window.innerWidth / window.innerHeight, 1, 150 );
// 		// 	camera.position.copy(camDefaultPos);
			
// 		// 	// controls = new THREE.OrbitControls( camera, renderer.domElement );
// 		// 	// controls.minDistance = 10;
// 		// 	// controls.maxDistance = 40;
// 		// 	// controls.enableZoom = false;
// 		// 	//----------------------------------------------------------- Objects
// 		// 	// initFXAA(function(mat){
// 		// 	// 	matFXAA = mat;
// 		// 	// });
// 		// 	//------------------------------------- Opaque
// 		// 	text = initText().updateData(Data);

// 		// 	text.offset(new THREE.Vector3(-0.5*23.5, -0.5*23.5, 0));
// 		// }
// 		// var pause;
// 		// function animate() {
// 		// 	if(!pause)
// 		// 		window.requestAnimationFrame( animate );
// 		// 	camera.lookAt(target);
// 		// 	delta = clock.getDelta();
// 		// 	if(delta<1) time+=delta;
// 		// 	if(time>600) time = 0;
// 		// 	text.update(time, delta)
// 		// 	render();
// 		// }

// 		// function setResoluation(width, height, pixelRatio){
// 		// 	camera.aspect = width / height;
// 		// 	camera.updateProjectionMatrix();
// 		// 	renderer.setSize( width, height );
// 		// 	renderer.setPixelRatio(pixelRatio);
// 		// 	frameBuffers.setSize(width, height, pixelRatio);
// 		// 	graphic.setSize(width, height, pixelRatio);
// 		// }
// 		// function render()
// 		// {
// 		// 	var gl = renderer.context;
// 		// 	if(texBG!=null){
// 		// 		graphic.render1(texBG, frameBuffers.curTex(), matCopy, true);
// 		// 	}
// 		// 		// gl.clearStencil(0);
// 		// 		// gl.clear(gl.STENCIL_BUFFER_BIT);
// 		// 		gl.stencilFunc(gl.ALWAYS, 1, 1);
// 		// 		gl.stencilOp(gl.KEEP, gl.REPLACE, gl.REPLACE);
// 		// 		gl.enable(gl.STENCIL_TEST);
// 		// 		renderer.render(sceneStencil, camera, frameBuffers.curTex());
// 		// 		gl.stencilFunc(gl.EQUAL, 1, 1);
// 		// 		gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP);
// 		// 		renderer.render(sceneStencil1, camera, frameBuffers.curTex());
// 		// 		gl.disable(gl.STENCIL_TEST);
// 		// 	if(texBG!=null){
// 		// 		renderer.render(scene, camera, frameBuffers.curTex());
// 		// 	}
// 		// 	//----------------------------------------------------- FXAA
// 		// 	if(matFXAA!=null){
// 		// 		graphic.render(frameBuffers.curTex(), frameBuffers.preTex(), matFXAA);
// 		// 		frameBuffers.swap();
// 		// 	}
// 		// 	//----------------------------------------------------- ToScreen
// 		// 	if(matCopy == null) matCopy = initMaterial(fxCopy);
// 		// 	graphic.render(frameBuffers.curTex(), null, matCopy);
// 		// 	//-----------------------------------------------------
// 		// }
// 	}
// }