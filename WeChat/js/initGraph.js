import * as THREE from 'libs/three.min.js'
import {initMaterial} from 'shader.js'
import {getShaderGradient, shaderText, shaderTextStencil, getShaderCube1} from "Material.js"

import {graphic, texGradient, scene, sceneStencil, sceneStencil1} from "Global.js"

var PATH_URL = "src/";
export function lerp(A, B, t){
	return A + (B-A) * t;
}
export function initColorGradient(num,callback){
	var segment = 128;
	var textureLoader = new THREE.TextureLoader();
	textureLoader.load( PATH_URL+'textures/Gradient.png',function(texGradient){
		// texGradient.wrapS = texGradient.wrapT = THREE.RepeatWrapping;
		var tex = new THREE.WebGLRenderTarget( segment, 32, {
			wrapS: THREE.RepeatWrapping,
			wrapT: THREE.RepeatWrapping,
			minFilter: THREE.LinearFilter,
			magFilter: THREE.LinearFilter,
			// minFilter: THREE.NearestFilter,
			// magFilter: THREE.NearestFilter,
			format: THREE.RGBAFormat,
			type: THREE.UnsignedByteType,
			depthBuffer: false,
			stencilBuffer: false,
			generateMipmaps: true
		});

		var Vs = []
		var offsets = [] 
		var uv=[0,0,1,0,0,1,1,1];
		var triangles = [0,2,1,1,2,3]
		for(var i=0;i<num;i++){
			Vs.push(i)
			offsets.push(0.5)
		}
		var instancedGeometry = new THREE.InstancedBufferGeometry();
		instancedGeometry.attributes.uv = new THREE.BufferAttribute( new Float32Array(uv), 2 );
		instancedGeometry.setIndex(new THREE.BufferAttribute( new Uint32Array(triangles), 1 ));
		instancedGeometry.addAttribute( 'V', new THREE.InstancedBufferAttribute( new Float32Array( Vs ), 1 ));
		instancedGeometry.addAttribute( 'offset', new THREE.InstancedBufferAttribute( new Float32Array( offsets ), 1 ) );

		var material = initMaterial(getShaderGradient(num, segment));
		material.uniforms.texSrc.value = texGradient;
		var mesh = new THREE.Mesh( instancedGeometry, material );

		graphic.drawMesh(mesh, tex, false)
		texGradient.dispose()
		callback(tex.texture);
	});
}
export function initFXAA(callback){
	var loader = new THREE.FileLoader();
	loader.load(
	    PATH_URL+'shaders/FXAA.glsl',
	    function ( data ) {
	        callback(new THREE.RawShaderMaterial({
	        	uniforms:{
	        		"texSrc":   { value: null },
					"resolution": { value: new THREE.Vector2( 1 / 1024, 1 / 512 ) }
	        	},
	        	vertexShader: "precision mediump float;\nprecision mediump int;\nuniform mat4 modelMatrix;\nuniform mat4 modelViewMatrix;\nuniform mat4 projectionMatrix;\nuniform mat4 viewMatrix;\nuniform vec3 cameraPosition;\nvarying vec2 vUv;\nattribute vec2 uv;\nattribute vec3 position;\nvoid main() {\nvUv = uv;\ngl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );\n}",
	        	fragmentShader:data,
	        }));
	    },
	    function ( xhr ) {
	        console.log( (xhr.loaded / xhr.total * 100) + '% loaded' );
	    },
	    function ( xhr ) {
	        console.error( 'An error happened' );
	    }
	);
}
export function initText(){
	var num = 32;
	var Z = -0.5;
	var Y = -0.5;
	var bufferGeometry = new THREE.BoxBufferGeometry( 1, 1, 1 );
	var geometry = new THREE.InstancedBufferGeometry();
	geometry.index = bufferGeometry.index;
	geometry.attributes.position = bufferGeometry.attributes.position;
	geometry.attributes.uv = bufferGeometry.attributes.uv;
	var offsets = [];
	var orientations = [];
	var Voffsets = [];
	var scales = [];
	var vector = new THREE.Vector4();
	var x, y, z, w;
	for ( var i = 0; i < num; i ++ ) {
		x = lerp(-3.2,3.2,Math.random());
		y = lerp(-1.2,1.2,Math.random());
		z = lerp(-3.2,3.2,Math.random());
		vector.set( x, y, z, 0 ).normalize();
		vector.multiplyScalar( 1.6 ); // move out at least 5 units from center in current direction
		offsets.push( x + vector.x, y + vector.y, z + vector.z );
		vector.set(
			lerp(-1,1,Math.random()),
			lerp(-1,1,Math.random()),
			lerp(-1,1,Math.random()),
			lerp(-1,1,Math.random())
		).normalize();
		orientations.push( vector.x, vector.y, vector.z, vector.w );
		Voffsets.push(i/ num);
		var ranSize = (2 + Math.floor(Math.random()*3)) * 0.5;
		scales.push(ranSize, ranSize, ranSize * 3);
	}
	var material = initMaterial(getShaderCube1(texGradient));


	var orientationAttribute = new THREE.InstancedBufferAttribute( new Float32Array( orientations ), 4 ).setDynamic( true );

	geometry.addAttribute( 'offset', new THREE.InstancedBufferAttribute( new Float32Array( Voffsets ), 1 ) );
	geometry.addAttribute( 'posOffset', new THREE.InstancedBufferAttribute( new Float32Array( offsets ), 3 ) );
	geometry.addAttribute( 'scale', new THREE.InstancedBufferAttribute( new Float32Array( scales ), 3 ) );
	geometry.addAttribute( 'orientation', orientationAttribute );

	var mesh = new THREE.Mesh( geometry, material );
	// var mesh = new THREE.Mesh( bufferGeometry, new THREE.MeshBasicMaterial() );
	mesh.position.set(0, Y + 0.5, Z);

	var self={};
	//----------------------------------------------- Text
	var option={
		// size: 70,
		// height: 40,
		curveSegments: 15,
		bevelThickness: 0,
		bevelSize: 0,
		bevelEnabled: false,
		material: 0,
		extrudeMaterial: 1
	};

	var textGeo = new THREE.BufferGeometry();
	var textMesh = new THREE.Mesh( textGeo,  initMaterial(shaderText));
	var textMeshStencil = new THREE.Mesh( textGeo,  initMaterial(shaderTextStencil));

	sceneStencil.add(textMeshStencil);
	scene.add(textMesh);
	sceneStencil1.add( mesh );

	var moveQ = new THREE.Quaternion( 0.5, 0.5, 0.5, 0.0 ).normalize();
	var tmpQ = new THREE.Quaternion();
	var currentQ = new THREE.Quaternion();
	self.update=function(time, delta){
		tmpQ.set( moveQ.x * delta, moveQ.y * delta, moveQ.z * delta, 3 ).normalize();
		for ( var i = 0, il = orientationAttribute.count; i < il; i ++ ) {
			currentQ.fromArray( orientationAttribute.array, ( i * 4 ) );
			currentQ.multiply( tmpQ );
			orientationAttribute.setXYZW( i, currentQ.x, currentQ.y, currentQ.z, currentQ.w );
		}
		orientationAttribute.needsUpdate = true;
		mesh.rotateY(0.01);
	}
	self.updateData = function(draw_cmd){
		textGeo.dispose();

		textGeo = new TextGeometry(draw_cmd, option);
		var S = 0.75 * 1.3 * Math.min(291.69 / textGeo.WIDTH, 1);
		textGeo.mergeVertices();
		textGeo.scale(0.03 * S,0.03 * S,0.011 * S);
		// textGeo.rotateY(3.14)
		textGeo.computeBoundingBox();

		textGeo.translate(-0.5 * ( textGeo.boundingBox.max.x - textGeo.boundingBox.min.x ), Y, Z);
		textGeo.computeBoundingBox();
		textGeo.scale(-1,1,1);
		textMesh.geometry = textGeo;
		textMeshStencil.geometry = textGeo;
		return self
	}
	self.display = function(bool){
		textMeshStencil.visible = bool;
		textMesh.visible = bool;
		mesh.visible = bool;
	}
	self.offset = function(offset){
		textMeshStencil.material.uniforms.offsetXYZ.value = offset;
		textMesh.material.uniforms.offsetXYZ.value = offset;
		mesh.material.uniforms.offsetXYZ.value = offset;
	}

    textMesh.castShadow = true;
    return self;
}
function createPath(glyph, scale, offsetX, offsetY ) {
	var path = new THREE.ShapePath();
	var pts = [];
	var x, y, cpx, cpy, cpx0, cpy0, cpx1, cpy1, cpx2, cpy2, laste;
	if ( glyph.o ) {
		var outline = glyph._cachedOutline || ( glyph._cachedOutline = glyph.o.split( ' ' ) );
		for ( var i = 0, l = outline.length; i < l; ) {
			var action = outline[ i ++ ];
			switch ( action ) {
				case 'm': // moveTo
					x = (glyph.ha - outline[ i ++ ]) * scale + offsetX;
					y = outline[ i ++ ] * scale;
					path.moveTo( x, y );
					break;
				case 'l': // lineTo
					x = (glyph.ha - outline[ i ++ ]) * scale + offsetX;
					y = outline[ i ++ ] * scale;
					path.lineTo( x, y );
					break;
				case 'q': // quadraticCurveTo
					cpx = (glyph.ha - outline[ i ++ ]) * scale + offsetX;
					cpy = outline[ i ++ ] * scale;
					cpx1 = (glyph.ha - outline[ i ++ ]) * scale + offsetX;
					cpy1 = outline[ i ++ ] * scale;
					path.quadraticCurveTo( cpx1, cpy1, cpx, cpy );
					laste = pts[ pts.length - 1 ];
					if ( laste ) {
						cpx0 = laste.x;
						cpy0 = laste.y;
						for ( var i2 = 1; i2 <= divisions; i2 ++ ) {
							var t = i2 / divisions;
							QuadraticBezier( t, cpx0, cpx1, cpx );
							QuadraticBezier( t, cpy0, cpy1, cpy );
						}
					}
					break;
				case 'b': // bezierCurveTo
					cpx = (glyph.ha - outline[ i ++ ]) * scale + offsetX;
					cpy = outline[ i ++ ] * scale;
					cpx1 = (glyph.ha - outline[ i ++ ]) * scale + offsetX;
					cpy1 = outline[ i ++ ] * scale;
					cpx2 = (glyph.ha - outline[ i ++ ]) * scale + offsetX;
					cpy2 = outline[ i ++ ] * scale;
					path.bezierCurveTo( cpx1, cpy1, cpx2, cpy2, cpx, cpy );
					laste = pts[ pts.length - 1 ];
					if ( laste ) {
						cpx0 = laste.x;
						cpy0 = laste.y;
						for ( var i2 = 1; i2 <= divisions; i2 ++ ) {
							var t = i2 / divisions;
							CubicBezier( t, cpx0, cpx1, cpx2, cpx );
							CubicBezier( t, cpy0, cpy1, cpy2, cpy );
						}
					}
					break;
			}
		}
	}
	return { offsetX: glyph.ha * scale, path: path };
}
function TextBufferGeometry(data, parameters ) {
	var paths = [];
	var offsetX=0;
	for(var i=data.length-1;i>=0;i--){
		var ret = createPath(data[i], 0.07,offsetX);
		paths.push( ret.path );
		offsetX+=ret.offsetX;
		// if(offsetX>388)break;
		// console.log(offsetX)
	}
	this.WIDTH = offsetX;
	var shapes = [];
	for ( var p = 0, pl = paths.length; p < pl; p ++ ) {
		Array.prototype.push.apply( shapes, paths[ p ].toShapes() );
	}

	THREE.ExtrudeBufferGeometry.call( this, shapes, parameters );
	this.type = 'TextBufferGeometry1';
}

TextBufferGeometry.prototype = Object.create( THREE.ExtrudeBufferGeometry.prototype );
TextBufferGeometry.prototype.constructor = TextBufferGeometry;

function TextGeometry(data, parameters ) {

	THREE.Geometry.call( this );

	this.type = 'TextGeometry1';

	this.parameters = {
		parameters: parameters
	};
	var geo = new TextBufferGeometry(data, parameters );
	this.WIDTH = geo.WIDTH;
	this.fromBufferGeometry(geo);
	this.mergeVertices();
}

TextGeometry.prototype = Object.create( THREE.Geometry.prototype );
TextGeometry.prototype.constructor = TextGeometry;

