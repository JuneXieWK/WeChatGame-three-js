import * as THREE from 'libs/three.min.js'

"use strict"
function parseValue(value){
	switch(value[0]){
		case "float": return value[1];
		case "vec2": return "vec2("+value[1].x+","+value[1].y+")";
		case "vec3": return "vec3("+value[1].x+","+value[1].y+","+value[1].z+")";
		case "vec4": return "vec4("+value[1].x+","+value[1].y+","+value[1].z+","+value[1].w+")";
	}
};
function parseSetting(setting){
	var constStr="", uniformStr="", varyingStr="", functionStr="";
	var uniforms={};
	for(var name in setting.const){
        var value = setting.const[name];
        constStr += "const "+value[0]+" "+name+" = "+parseValue(value)+"\;\n";
    }
    for(var name in setting.param){
        var value = setting.param[name];
        var type = value[0];
        var V = value[1];
        if(value.length==3){
        	var num = value[2];
        	uniformStr += "uniform "+type+" "+name+"\["+ num +"\]\;\n";
        }else{
        	uniformStr += "uniform "+type+" "+name+"\;\n";
        }
        uniforms[name] = {value:V};
    }
    for(var name in setting.V2F) varyingStr += "varying "+setting.V2F[name]+" "+name+"\;\n";
    for(var i in setting.function) functionStr += setting.function[i]+"\n";

    return [constStr + uniformStr+varyingStr+functionStr, uniforms];
};
export function initMaterial(setting){
	var head = "";
	if(setting.name) head+="//"+setting.name+"\n";
	head+="precision highp float;\nprecision highp int;\n";
	var defaultStr = "#define saturate(a) clamp(a,0.0,1.0)\n#define PI 3.1415926\n";
	var defaultStrVS = "uniform mat4 modelMatrix;\nuniform mat3 normalMatrix;\nuniform mat4 modelViewMatrix;\nuniform mat4 projectionMatrix;\nuniform mat4 viewMatrix;\nuniform vec3 cameraPosition;\n";
	var attributeStr="";
    for(var name in setting.buffer) attributeStr += "attribute "+setting.buffer[name]+" "+name+"\;\n";

    for(var name in setting.define) defaultStr += "#define "+name+" "+setting.define[name]+"\n";
    
    var resturns = parseSetting(setting);
	var str = resturns[0],uniforms=resturns[1];

	var mat = new THREE.RawShaderMaterial( {
		uniforms: uniforms,
		vertexShader: head + defaultStrVS + defaultStr + attributeStr + str + "void main(void){\n"+setting.VS+"\n}",
		fragmentShader: head + defaultStr + str +"void main(void){\n"+setting.FS+"\n}",
	});

    for(var name in setting.property) mat[name] = setting.property[name];

	if(setting.blend){
		mat.blending = THREE.CustomBlending;
		mat.blendSrc = setting.blend[0];
		mat.blendDst = setting.blend[1];
		if(setting.blend[2]) mat.blendEquation = setting.blend[2];
	}
	if(setting.depth){
		mat.depthWrite = setting.depth[0];
		mat.depthTest = setting.depth[1];
	}
	return mat;
};
export function FrameBuffers(){
	var self = {};
	var index = 0;
	var W = window.innerWidth * window.devicePixelRatio;
	var H = window.innerHeight * window.devicePixelRatio;
	var buffers = [
		CreateRT(W, H, THREE.RGBAFormat, true, true, false),
		CreateRT(W, H, THREE.RGBAFormat, true, true, false)
		];
	self.swap = function(){
		index = 1-index;
	};
	self.curTex = function(){
		return buffers[index];
	};
	self.preTex = function(){
		return buffers[1 - index];
	};
	self.setSize = function(width, height, pixelRatio){
		W = width * pixelRatio;
		H = height * pixelRatio;
		self.curTex().dispose();
		self.preTex().dispose();
		buffers = [
			CreateRT(W, H, THREE.RGBAFormat, true, true, false),
			CreateRT(W, H, THREE.RGBAFormat, true, true, false)
		];
	};
	return self;
};

function CreateRT(W, H, format, depth, stencil, mipmaps){
	return new THREE.WebGLRenderTarget( W, H, {
		wrapS: THREE.ClampToEdgeWrapping,
		wrapT: THREE.ClampToEdgeWrapping,
		minFilter: THREE.LinearFilter,
		magFilter: THREE.LinearFilter,//NearestFilter,
		format: format,
		type: THREE.UnsignedByteType,
		depthBuffer: depth,
		stencilBuffer: stencil,
		generateMipmaps: mipmaps
	});
};
