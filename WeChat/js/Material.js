import * as THREE from 'libs/three.min.js'
var lightDir = new THREE.Vector3( 0,0.5,0.7).normalize();
export function getShaderGradient(num, segment){
	return{
		name:"Gradient",
		param:{
			texSrc:["sampler2D", null],
			numInv:["float", 1/num],
			segmentInv:["float", 1/segment],
		},
		buffer:{
			offset:"float",
			V:"float",
			uv:"vec2",
		},
		V2F:{
			UV:"vec2",
			midPoint:"float",
		},
		property:{
			side:THREE.BackSide,
			depthWrite:false,
			depthTest:false,
		},
		VS:`
			midPoint = offset;
			UV = vec2(
				uv.x + 0.5 * segmentInv,
				(V + 0.5)*numInv
			);
			vec2 pos = uv * vec2(1.,numInv) + vec2(0,V*numInv);
			pos = pos * 2.-1.;
			gl_Position = vec4( pos, 0, 1.0 );
		`,
		FS:`
			float x = abs(UV.x*2. - 1.);
			float c = (midPoint - 0.5) * 3.0;
			x = saturate(c*x*x-c*x+x);
			vec2 uv = vec2(x, UV.y);
			gl_FragColor = texture2D(texSrc,uv);
		`
	}
}
export function getShaderCube1(texGradient){
	return {
		name:"Cube",
		param:{
			texGradient:["sampler2D",texGradient],
			time:["float", 0],
			offsetXYZ:["vec3",new THREE.Vector3()],
		},
		V2F:{
			UV:"vec2",
			color:"vec3",
		},
		property:{
			transparent:true,
			depthWrite:false,
			depthTest:false,
		},
		buffer:{
			position:"vec3",
			uv:"vec2",
			posOffset:"vec3",
			orientation:"vec4",
			offset:"float",
			scale:"vec3",
		},
		VS:`
			UV = uv;
			vec3 pos = position * scale;
			vec3 vcV = cross( orientation.xyz, pos );
			pos = vcV * ( 2.0 * orientation.w ) + ( cross( orientation.xyz, vcV ) * 2.0 + pos );
			vec4 p = projectionMatrix * modelViewMatrix * vec4( posOffset + pos, 1.0 );
			p.xyw+=offsetXYZ;
			gl_Position = p;
			color = texture2D(texGradient, vec2(offset+time*0.2, 1.5/6.)).rgb;
		`,
		FS:`
			float alpha = (UV.x + UV.y)*0.5;
			alpha*=alpha;
			gl_FragColor = vec4(color,alpha);
		`
	};
}
export const fxCopy={
	name:"Copy",
	param:{
		opacity:["float", 1],
		texSrc:["sampler2D", null],
		resolution:["vec2", null],
	},
	buffer:{
		position:"vec3",
	},
	property:{
		side:THREE.DoubleSide,
		depthWrite:false,
		depthTest:false,
	},
	VS:"gl_Position = vec4( position, 1.0 );",
	FS:`
		vec2 uv = gl_FragCoord.xy * resolution.xy;
		gl_FragColor = opacity * texture2D(texSrc, uv );
	`,
}
export const shaderText={
	name:"Text",
	V2F:{
		normalW:"vec3",
	},
	buffer:{
		position:"vec3",
		normal:"vec3",
		uv:"vec2",
	},
	param:{
		lightDir:["vec3", lightDir],
		offsetXYZ:["vec3",new THREE.Vector3()],
	},
	property:{
		transparent:true,
		depthWrite:false,
		side:THREE.BackSide,
	},
	VS:`
		normalW = mat3(modelMatrix) * normal;
		vec4 p = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
		p.xyw+=offsetXYZ;
		gl_Position = p;
	`,
	FS:`
		vec3 normal = normalize(normalW);
		float dot_n_l = saturate(dot(normal, lightDir));			
		gl_FragColor = mix(vec4(0.1,0.3,0.5,0.6), vec4(1,1,1,0) * 3., 1. - (1.-dot_n_l)*(1.-dot_n_l));
	`
};
export const shaderTextStencil={
	name:"TextStencil",
	buffer:{
		position:"vec3",
	},
	param:{
		offsetXYZ:["vec3",new THREE.Vector3()],
	},
	property:{
		depthWrite:true,
		side:THREE.BackSide,
	},
	VS:`
		vec4 p = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
		p.xyw+=offsetXYZ;
		p.z+=0.001;
		gl_Position = p;
	`,
	FS:`
		gl_FragColor = vec4(0.75,0.75,1,1);
	`
};