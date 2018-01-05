import * as THREE from 'libs/three.min.js'

export var graphic={};
graphic.init = function(renderer){
	var self=graphic;
	var scene = new THREE.Scene();
	var camera = new THREE.Camera();
	var W = window.innerWidth * window.devicePixelRatio;
	var H = window.innerHeight * window.devicePixelRatio;
	camera.position.z = 1;
	var mesh = new THREE.Mesh( new THREE.PlaneBufferGeometry( 2, 2 ), null);
	scene.add( mesh );
	self.blit=function(dst, mat, isClear){
		mesh.material = mat;
		renderer.render( scene, camera, dst, isClear);
	};
	self.render=function(src, dst, mat, isClear){
		if(src!=null)
			mat.uniforms.texSrc.value = src.texture;
		if(dst==null)
			mat.uniforms.resolution.value = new THREE.Vector2(1/W, 1/H);
		else
			mat.uniforms.resolution.value = new THREE.Vector2(1/dst.width, 1/dst.height);
		mesh.material = mat;
		renderer.render( scene, camera, dst, isClear);
	};
	self.drawMesh = function(customMesh, dst, isClear){
		mesh.visible = false;
		scene.add(customMesh);
		renderer.render( scene, camera, dst, isClear);
		scene.remove(customMesh);
		mesh.visible = true;
	};
	self.render1=function(src, dst, mat, isClear){
		if(src!=null)
			mat.uniforms.texSrc.value = src;
		if(dst==null)
			mat.uniforms.resolution.value = new THREE.Vector2(1/W, 1/H);
		else
			mat.uniforms.resolution.value = new THREE.Vector2(1/dst.width, 1/dst.height);
		mesh.material = mat;
		renderer.render( scene, camera, dst, isClear);
	};
	self.setSize=function(width, height, pixelRatio){
		W = width * pixelRatio;
		H = height * pixelRatio;
	};
	// self.blit1=function(mat){
	// 	mesh.material = mat;
	// 	renderer.render( scene, camera );
	// }
	return self;
};

export var texGradient={};
texGradient.init = function(tex){
    texGradient=tex;
}


export var scene = new THREE.Scene();
export var sceneStencil = new THREE.Scene();
export var sceneStencil1 = new THREE.Scene();