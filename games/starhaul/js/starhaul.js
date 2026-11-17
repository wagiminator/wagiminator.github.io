(()=>{var Bp=Object.defineProperty;var mu=(n,e)=>{for(var t in e)Bp(n,t,{get:e[t],enumerable:!0})};var jl="169";var Td=1,zp=2,Ki=3,zi=0,Mt=1,xh=2,Ad=0;var Pi=2;var Fn=100;var ql=204,Yl=205;var Rd=0,Hp=1,Vp=2,fn=0,_h=1,Mh=2,Sh=3,Ns=4,Gp=5,bh=6,wh=7;var Cd=300,br=301,wr=302,Zl=303,$l=304,wo=306,Hn=1e3,vs=1001,Jl=1002,gi=1003,Wp=1004;var na=1005;var mi=1006,ol=1007;var pn=1008;var nn=1009,Pd=1010,Id=1011,ys=1012,Eh=1013,Vn=1014,Bi=1015,Ii=1016,Th=1017,Ah=1018,Er=1020,Ld=35902,Ud=1021,Dd=1022,oi=1023,Nd=1024,Od=1025,xs=1026,Tr=1027,Rh=1028,Ch=1029,kd=1030,Ph=1031;var Ih=1033,Ba=33776,za=33777,Ha=33778,Va=33779,Kl=35840,Ql=35841,ec=35842,tc=35843,ic=36196,nc=37492,rc=37496,sc=37808,ac=37809,oc=37810,lc=37811,cc=37812,hc=37813,uc=37814,dc=37815,pc=37816,fc=37817,mc=37818,gc=37819,vc=37820,yc=37821,Ga=36492,xc=36494,_c=36495,Fd=36283,Mc=36284,Sc=36285,bc=36286;var ja=2300,wc=2301,ll=2302,gu=2400,vu=2401,yu=2402;var xr="",Vt="srgb",_n="srgb-linear",Lh="display-p3",Eo="display-p3-linear",qa="linear",tt="srgb",Ya="rec709",Za="p3";var tr=7680;var Bd=515;var Ec=35044;var xu="300 es",Ar=2e3,$a=2001,gn=class{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});let i=this._listeners;i[e]===void 0&&(i[e]=[]),i[e].indexOf(t)===-1&&i[e].push(t)}hasEventListener(e,t){if(this._listeners===void 0)return!1;let i=this._listeners;return i[e]!==void 0&&i[e].indexOf(t)!==-1}removeEventListener(e,t){if(this._listeners===void 0)return;let i=this._listeners[e];if(i!==void 0){let r=i.indexOf(t);r!==-1&&i.splice(r,1)}}dispatchEvent(e){if(this._listeners===void 0)return;let t=this._listeners[e.type];if(t!==void 0){e.target=this;let i=t.slice(0);for(let r=0,s=i.length;r<s;r++)i[r].call(this,e);e.target=null}}},zt=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"];var Wa=Math.PI/180,Tc=180/Math.PI;function tn(){let n=4294967295*Math.random()|0,e=4294967295*Math.random()|0,t=4294967295*Math.random()|0,i=4294967295*Math.random()|0;return(zt[255&n]+zt[n>>8&255]+zt[n>>16&255]+zt[n>>24&255]+"-"+zt[255&e]+zt[e>>8&255]+"-"+zt[e>>16&15|64]+zt[e>>24&255]+"-"+zt[63&t|128]+zt[t>>8&255]+"-"+zt[t>>16&255]+zt[t>>24&255]+zt[255&i]+zt[i>>8&255]+zt[i>>16&255]+zt[i>>24&255]).toLowerCase()}function kt(n,e,t){return Math.max(e,Math.min(t,n))}function Xp(n,e){return(n%e+e)%e}function cl(n,e,t){return(1-t)*n+t*e}function Fi(n,e){switch(e.constructor){case Float32Array:return n;case Uint32Array:return n/4294967295;case Uint16Array:return n/65535;case Uint8Array:return n/255;case Int32Array:return Math.max(n/2147483647,-1);case Int16Array:return Math.max(n/32767,-1);case Int8Array:return Math.max(n/127,-1);default:throw new Error("Invalid component type.")}}function et(n,e){switch(e.constructor){case Float32Array:return n;case Uint32Array:return Math.round(4294967295*n);case Uint16Array:return Math.round(65535*n);case Uint8Array:return Math.round(255*n);case Int32Array:return Math.round(2147483647*n);case Int16Array:return Math.round(32767*n);case Int8Array:return Math.round(127*n);default:throw new Error("Invalid component type.")}}var re=class n{constructor(e=0,t=0){n.prototype.isVector2=!0,this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){let t=this.x,i=this.y,r=e.elements;return this.x=r[0]*t+r[3]*i+r[6],this.y=r[1]*t+r[4]*i+r[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this}clampLength(e,t){let i=this.length();return this.divideScalar(i||1).multiplyScalar(Math.max(e,Math.min(t,i)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let i=this.dot(e)/t;return Math.acos(kt(i,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,i=this.y-e.y;return t*t+i*i}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){let i=Math.cos(t),r=Math.sin(t),s=this.x-e.x,a=this.y-e.y;return this.x=s*i-a*r+e.x,this.y=s*r+a*i+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}},Oe=class n{constructor(e,t,i,r,s,a,o,l,c){n.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,i,r,s,a,o,l,c)}set(e,t,i,r,s,a,o,l,c){let h=this.elements;return h[0]=e,h[1]=r,h[2]=o,h[3]=t,h[4]=s,h[5]=l,h[6]=i,h[7]=a,h[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){let t=this.elements,i=e.elements;return t[0]=i[0],t[1]=i[1],t[2]=i[2],t[3]=i[3],t[4]=i[4],t[5]=i[5],t[6]=i[6],t[7]=i[7],t[8]=i[8],this}extractBasis(e,t,i){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),i.setFromMatrix3Column(this,2),this}setFromMatrix4(e){let t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let i=e.elements,r=t.elements,s=this.elements,a=i[0],o=i[3],l=i[6],c=i[1],h=i[4],u=i[7],d=i[2],p=i[5],m=i[8],x=r[0],g=r[3],f=r[6],y=r[1],v=r[4],_=r[7],E=r[2],T=r[5],A=r[8];return s[0]=a*x+o*y+l*E,s[3]=a*g+o*v+l*T,s[6]=a*f+o*_+l*A,s[1]=c*x+h*y+u*E,s[4]=c*g+h*v+u*T,s[7]=c*f+h*_+u*A,s[2]=d*x+p*y+m*E,s[5]=d*g+p*v+m*T,s[8]=d*f+p*_+m*A,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){let e=this.elements,t=e[0],i=e[1],r=e[2],s=e[3],a=e[4],o=e[5],l=e[6],c=e[7],h=e[8];return t*a*h-t*o*c-i*s*h+i*o*l+r*s*c-r*a*l}invert(){let e=this.elements,t=e[0],i=e[1],r=e[2],s=e[3],a=e[4],o=e[5],l=e[6],c=e[7],h=e[8],u=h*a-o*c,d=o*l-h*s,p=c*s-a*l,m=t*u+i*d+r*p;if(m===0)return this.set(0,0,0,0,0,0,0,0,0);let x=1/m;return e[0]=u*x,e[1]=(r*c-h*i)*x,e[2]=(o*i-r*a)*x,e[3]=d*x,e[4]=(h*t-r*l)*x,e[5]=(r*s-o*t)*x,e[6]=p*x,e[7]=(i*l-c*t)*x,e[8]=(a*t-i*s)*x,this}transpose(){let e,t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){let t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,i,r,s,a,o){let l=Math.cos(s),c=Math.sin(s);return this.set(i*l,i*c,-i*(l*a+c*o)+a+e,-r*c,r*l,-r*(-c*a+l*o)+o+t,0,0,1),this}scale(e,t){return this.premultiply(hl.makeScale(e,t)),this}rotate(e){return this.premultiply(hl.makeRotation(-e)),this}translate(e,t){return this.premultiply(hl.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){let t=Math.cos(e),i=Math.sin(e);return this.set(t,-i,0,i,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){let t=this.elements,i=e.elements;for(let r=0;r<9;r++)if(t[r]!==i[r])return!1;return!0}fromArray(e,t=0){for(let i=0;i<9;i++)this.elements[i]=e[i+t];return this}toArray(e=[],t=0){let i=this.elements;return e[t]=i[0],e[t+1]=i[1],e[t+2]=i[2],e[t+3]=i[3],e[t+4]=i[4],e[t+5]=i[5],e[t+6]=i[6],e[t+7]=i[7],e[t+8]=i[8],e}clone(){return new this.constructor().fromArray(this.elements)}},hl=new Oe;function zd(n){for(let e=n.length-1;e>=0;--e)if(n[e]>=65535)return!0;return!1}function Ja(n){return document.createElementNS("http://www.w3.org/1999/xhtml",n)}function jp(){let n=Ja("canvas");return n.style.display="block",n}var _u={};function Xa(n){n in _u||(_u[n]=!0,console.warn(n))}var Mu=new Oe().set(.8224621,.177538,0,.0331941,.9668058,0,.0170827,.0723974,.9105199),Su=new Oe().set(1.2249401,-.2249404,0,-.0420569,1.0420571,0,-.0196376,-.0786361,1.0982735),es={[_n]:{transfer:qa,primaries:Ya,luminanceCoefficients:[.2126,.7152,.0722],toReference:n=>n,fromReference:n=>n},[Vt]:{transfer:tt,primaries:Ya,luminanceCoefficients:[.2126,.7152,.0722],toReference:n=>n.convertSRGBToLinear(),fromReference:n=>n.convertLinearToSRGB()},[Eo]:{transfer:qa,primaries:Za,luminanceCoefficients:[.2289,.6917,.0793],toReference:n=>n.applyMatrix3(Su),fromReference:n=>n.applyMatrix3(Mu)},[Lh]:{transfer:tt,primaries:Za,luminanceCoefficients:[.2289,.6917,.0793],toReference:n=>n.convertSRGBToLinear().applyMatrix3(Su),fromReference:n=>n.applyMatrix3(Mu).convertLinearToSRGB()}},qp=new Set([_n,Eo]),Ye={enabled:!0,_workingColorSpace:_n,get workingColorSpace(){return this._workingColorSpace},set workingColorSpace(n){if(!qp.has(n))throw new Error(`Unsupported working color space, "${n}".`);this._workingColorSpace=n},convert:function(n,e,t){if(this.enabled===!1||e===t||!e||!t)return n;let i=es[e].toReference;return(0,es[t].fromReference)(i(n))},fromWorkingColorSpace:function(n,e){return this.convert(n,this._workingColorSpace,e)},toWorkingColorSpace:function(n,e){return this.convert(n,e,this._workingColorSpace)},getPrimaries:function(n){return es[n].primaries},getTransfer:function(n){return n===xr?qa:es[n].transfer},getLuminanceCoefficients:function(n,e=this._workingColorSpace){return n.fromArray(es[e].luminanceCoefficients)}};function Mr(n){return n<.04045?.0773993808*n:Math.pow(.9478672986*n+.0521327014,2.4)}function ul(n){return n<.0031308?12.92*n:1.055*Math.pow(n,.41666)-.055}var ir,Ac=class{static getDataURL(e){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let t;if(e instanceof HTMLCanvasElement)t=e;else{ir===void 0&&(ir=Ja("canvas")),ir.width=e.width,ir.height=e.height;let i=ir.getContext("2d");e instanceof ImageData?i.putImageData(e,0,0):i.drawImage(e,0,0,e.width,e.height),t=ir}return t.width>2048||t.height>2048?(console.warn("THREE.ImageUtils.getDataURL: Image converted to jpg for performance reasons",e),t.toDataURL("image/jpeg",.6)):t.toDataURL("image/png")}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){let t=Ja("canvas");t.width=e.width,t.height=e.height;let i=t.getContext("2d");i.drawImage(e,0,0,e.width,e.height);let r=i.getImageData(0,0,e.width,e.height),s=r.data;for(let a=0;a<s.length;a++)s[a]=255*Mr(s[a]/255);return i.putImageData(r,0,0),t}if(e.data){let t=e.data.slice(0);for(let i=0;i<t.length;i++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[i]=Math.floor(255*Mr(t[i]/255)):t[i]=Mr(t[i]);return{data:t,width:e.width,height:e.height}}return console.warn("THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}},Yp=0,Ka=class{constructor(e=null){this.isSource=!0,Object.defineProperty(this,"id",{value:Yp++}),this.uuid=tn(),this.data=e,this.dataReady=!0,this.version=0}set needsUpdate(e){e===!0&&this.version++}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];let i={uuid:this.uuid,url:""},r=this.data;if(r!==null){let s;if(Array.isArray(r)){s=[];for(let a=0,o=r.length;a<o;a++)r[a].isDataTexture?s.push(dl(r[a].image)):s.push(dl(r[a]))}else s=dl(r);i.url=s}return t||(e.images[this.uuid]=i),i}};function dl(n){return typeof HTMLImageElement<"u"&&n instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&n instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&n instanceof ImageBitmap?Ac.getDataURL(n):n.data?{data:Array.from(n.data),width:n.width,height:n.height,type:n.data.constructor.name}:(console.warn("THREE.Texture: Unable to serialize Texture."),{})}var Zp=0,ti=class n extends gn{constructor(e=n.DEFAULT_IMAGE,t=n.DEFAULT_MAPPING,i=1001,r=1001,s=1006,a=1008,o=oi,l=nn,c=n.DEFAULT_ANISOTROPY,h=""){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:Zp++}),this.uuid=tn(),this.name="",this.source=new Ka(e),this.mipmaps=[],this.mapping=t,this.channel=0,this.wrapS=i,this.wrapT=r,this.magFilter=s,this.minFilter=a,this.anisotropy=c,this.format=o,this.internalFormat=null,this.type=l,this.offset=new re(0,0),this.repeat=new re(1,1),this.center=new re(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Oe,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=h,this.userData={},this.version=0,this.onUpdate=null,this.isRenderTargetTexture=!1,this.pmremVersion=0}get image(){return this.source.data}set image(e=null){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];let i={metadata:{version:4.6,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(i.userData=this.userData),t||(e.textures[this.uuid]=i),i}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==Cd)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case Hn:e.x=e.x-Math.floor(e.x);break;case vs:e.x=e.x<0?0:1;break;case Jl:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x)}if(e.y<0||e.y>1)switch(this.wrapT){case Hn:e.y=e.y-Math.floor(e.y);break;case vs:e.y=e.y<0?0:1;break;case Jl:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y)}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}};ti.DEFAULT_IMAGE=null,ti.DEFAULT_MAPPING=Cd,ti.DEFAULT_ANISOTROPY=1;var $e=class n{constructor(e=0,t=0,i=0,r=1){n.prototype.isVector4=!0,this.x=e,this.y=t,this.z=i,this.w=r}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,i,r){return this.x=e,this.y=t,this.z=i,this.w=r,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){let t=this.x,i=this.y,r=this.z,s=this.w,a=e.elements;return this.x=a[0]*t+a[4]*i+a[8]*r+a[12]*s,this.y=a[1]*t+a[5]*i+a[9]*r+a[13]*s,this.z=a[2]*t+a[6]*i+a[10]*r+a[14]*s,this.w=a[3]*t+a[7]*i+a[11]*r+a[15]*s,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);let t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,i,r,s,l=e.elements,c=l[0],h=l[4],u=l[8],d=l[1],p=l[5],m=l[9],x=l[2],g=l[6],f=l[10];if(Math.abs(h-d)<.01&&Math.abs(u-x)<.01&&Math.abs(m-g)<.01){if(Math.abs(h+d)<.1&&Math.abs(u+x)<.1&&Math.abs(m+g)<.1&&Math.abs(c+p+f-3)<.1)return this.set(1,0,0,0),this;t=Math.PI;let v=(c+1)/2,_=(p+1)/2,E=(f+1)/2,T=(h+d)/4,A=(u+x)/4,B=(m+g)/4;return v>_&&v>E?v<.01?(i=0,r=.707106781,s=.707106781):(i=Math.sqrt(v),r=T/i,s=A/i):_>E?_<.01?(i=.707106781,r=0,s=.707106781):(r=Math.sqrt(_),i=T/r,s=B/r):E<.01?(i=.707106781,r=.707106781,s=0):(s=Math.sqrt(E),i=A/s,r=B/s),this.set(i,r,s,t),this}let y=Math.sqrt((g-m)*(g-m)+(u-x)*(u-x)+(d-h)*(d-h));return Math.abs(y)<.001&&(y=1),this.x=(g-m)/y,this.y=(u-x)/y,this.z=(d-h)/y,this.w=Math.acos((c+p+f-1)/2),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this.w=t[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this.z=Math.max(e.z,Math.min(t.z,this.z)),this.w=Math.max(e.w,Math.min(t.w,this.w)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this.z=Math.max(e,Math.min(t,this.z)),this.w=Math.max(e,Math.min(t,this.w)),this}clampLength(e,t){let i=this.length();return this.divideScalar(i||1).multiplyScalar(Math.max(e,Math.min(t,i)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this.z=e.z+(t.z-e.z)*i,this.w=e.w+(t.w-e.w)*i,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}},Rc=class extends gn{constructor(e=1,t=1,i={}){super(),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=1,this.scissor=new $e(0,0,e,t),this.scissorTest=!1,this.viewport=new $e(0,0,e,t);let r={width:e,height:t,depth:1};i=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:mi,depthBuffer:!0,stencilBuffer:!1,resolveDepthBuffer:!0,resolveStencilBuffer:!0,depthTexture:null,samples:0,count:1},i);let s=new ti(r,i.mapping,i.wrapS,i.wrapT,i.magFilter,i.minFilter,i.format,i.type,i.anisotropy,i.colorSpace);s.flipY=!1,s.generateMipmaps=i.generateMipmaps,s.internalFormat=i.internalFormat,this.textures=[];let a=i.count;for(let o=0;o<a;o++)this.textures[o]=s.clone(),this.textures[o].isRenderTargetTexture=!0;this.depthBuffer=i.depthBuffer,this.stencilBuffer=i.stencilBuffer,this.resolveDepthBuffer=i.resolveDepthBuffer,this.resolveStencilBuffer=i.resolveStencilBuffer,this.depthTexture=i.depthTexture,this.samples=i.samples}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}setSize(e,t,i=1){if(this.width!==e||this.height!==t||this.depth!==i){this.width=e,this.height=t,this.depth=i;for(let r=0,s=this.textures.length;r<s;r++)this.textures[r].image.width=e,this.textures[r].image.height=t,this.textures[r].image.depth=i;this.dispose()}this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let i=0,r=e.textures.length;i<r;i++)this.textures[i]=e.textures[i].clone(),this.textures[i].isRenderTargetTexture=!0;let t=Object.assign({},e.texture.image);return this.texture.source=new Ka(t),this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,e.depthTexture!==null&&(this.depthTexture=e.depthTexture.clone()),this.samples=e.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}},$t=class extends Rc{constructor(e=1,t=1,i={}){super(e,t,i),this.isWebGLRenderTarget=!0}},Qa=class extends ti{constructor(e=null,t=1,i=1,r=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:i,depth:r},this.magFilter=gi,this.minFilter=gi,this.wrapR=vs,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}};var Cc=class extends ti{constructor(e=null,t=1,i=1,r=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:i,depth:r},this.magFilter=gi,this.minFilter=gi,this.wrapR=vs,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var Gt=class{constructor(e=0,t=0,i=0,r=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=i,this._w=r}static slerpFlat(e,t,i,r,s,a,o){let l=i[r+0],c=i[r+1],h=i[r+2],u=i[r+3],d=s[a+0],p=s[a+1],m=s[a+2],x=s[a+3];if(o===0)return e[t+0]=l,e[t+1]=c,e[t+2]=h,void(e[t+3]=u);if(o===1)return e[t+0]=d,e[t+1]=p,e[t+2]=m,void(e[t+3]=x);if(u!==x||l!==d||c!==p||h!==m){let g=1-o,f=l*d+c*p+h*m+u*x,y=f>=0?1:-1,v=1-f*f;if(v>Number.EPSILON){let E=Math.sqrt(v),T=Math.atan2(E,f*y);g=Math.sin(g*T)/E,o=Math.sin(o*T)/E}let _=o*y;if(l=l*g+d*_,c=c*g+p*_,h=h*g+m*_,u=u*g+x*_,g===1-o){let E=1/Math.sqrt(l*l+c*c+h*h+u*u);l*=E,c*=E,h*=E,u*=E}}e[t]=l,e[t+1]=c,e[t+2]=h,e[t+3]=u}static multiplyQuaternionsFlat(e,t,i,r,s,a){let o=i[r],l=i[r+1],c=i[r+2],h=i[r+3],u=s[a],d=s[a+1],p=s[a+2],m=s[a+3];return e[t]=o*m+h*u+l*p-c*d,e[t+1]=l*m+h*d+c*u-o*p,e[t+2]=c*m+h*p+o*d-l*u,e[t+3]=h*m-o*u-l*d-c*p,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,i,r){return this._x=e,this._y=t,this._z=i,this._w=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){let i=e._x,r=e._y,s=e._z,a=e._order,o=Math.cos,l=Math.sin,c=o(i/2),h=o(r/2),u=o(s/2),d=l(i/2),p=l(r/2),m=l(s/2);switch(a){case"XYZ":this._x=d*h*u+c*p*m,this._y=c*p*u-d*h*m,this._z=c*h*m+d*p*u,this._w=c*h*u-d*p*m;break;case"YXZ":this._x=d*h*u+c*p*m,this._y=c*p*u-d*h*m,this._z=c*h*m-d*p*u,this._w=c*h*u+d*p*m;break;case"ZXY":this._x=d*h*u-c*p*m,this._y=c*p*u+d*h*m,this._z=c*h*m+d*p*u,this._w=c*h*u-d*p*m;break;case"ZYX":this._x=d*h*u-c*p*m,this._y=c*p*u+d*h*m,this._z=c*h*m-d*p*u,this._w=c*h*u+d*p*m;break;case"YZX":this._x=d*h*u+c*p*m,this._y=c*p*u+d*h*m,this._z=c*h*m-d*p*u,this._w=c*h*u-d*p*m;break;case"XZY":this._x=d*h*u-c*p*m,this._y=c*p*u-d*h*m,this._z=c*h*m+d*p*u,this._w=c*h*u+d*p*m;break;default:console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: "+a)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){let i=t/2,r=Math.sin(i);return this._x=e.x*r,this._y=e.y*r,this._z=e.z*r,this._w=Math.cos(i),this._onChangeCallback(),this}setFromRotationMatrix(e){let t=e.elements,i=t[0],r=t[4],s=t[8],a=t[1],o=t[5],l=t[9],c=t[2],h=t[6],u=t[10],d=i+o+u;if(d>0){let p=.5/Math.sqrt(d+1);this._w=.25/p,this._x=(h-l)*p,this._y=(s-c)*p,this._z=(a-r)*p}else if(i>o&&i>u){let p=2*Math.sqrt(1+i-o-u);this._w=(h-l)/p,this._x=.25*p,this._y=(r+a)/p,this._z=(s+c)/p}else if(o>u){let p=2*Math.sqrt(1+o-i-u);this._w=(s-c)/p,this._x=(r+a)/p,this._y=.25*p,this._z=(l+h)/p}else{let p=2*Math.sqrt(1+u-i-o);this._w=(a-r)/p,this._x=(s+c)/p,this._y=(l+h)/p,this._z=.25*p}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let i=e.dot(t)+1;return i<Number.EPSILON?(i=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=i):(this._x=0,this._y=-e.z,this._z=e.y,this._w=i)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=i),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(kt(this.dot(e),-1,1)))}rotateTowards(e,t){let i=this.angleTo(e);if(i===0)return this;let r=Math.min(1,t/i);return this.slerp(e,r),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){let i=e._x,r=e._y,s=e._z,a=e._w,o=t._x,l=t._y,c=t._z,h=t._w;return this._x=i*h+a*o+r*c-s*l,this._y=r*h+a*l+s*o-i*c,this._z=s*h+a*c+i*l-r*o,this._w=a*h-i*o-r*l-s*c,this._onChangeCallback(),this}slerp(e,t){if(t===0)return this;if(t===1)return this.copy(e);let i=this._x,r=this._y,s=this._z,a=this._w,o=a*e._w+i*e._x+r*e._y+s*e._z;if(o<0?(this._w=-e._w,this._x=-e._x,this._y=-e._y,this._z=-e._z,o=-o):this.copy(e),o>=1)return this._w=a,this._x=i,this._y=r,this._z=s,this;let l=1-o*o;if(l<=Number.EPSILON){let p=1-t;return this._w=p*a+t*this._w,this._x=p*i+t*this._x,this._y=p*r+t*this._y,this._z=p*s+t*this._z,this.normalize(),this}let c=Math.sqrt(l),h=Math.atan2(c,o),u=Math.sin((1-t)*h)/c,d=Math.sin(t*h)/c;return this._w=a*u+this._w*d,this._x=i*u+this._x*d,this._y=r*u+this._y*d,this._z=s*u+this._z*d,this._onChangeCallback(),this}slerpQuaternions(e,t,i){return this.copy(e).slerp(t,i)}random(){let e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),i=Math.random(),r=Math.sqrt(1-i),s=Math.sqrt(i);return this.set(r*Math.sin(e),r*Math.cos(e),s*Math.sin(t),s*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}},M=class n{constructor(e=0,t=0,i=0){n.prototype.isVector3=!0,this.x=e,this.y=t,this.z=i}set(e,t,i){return i===void 0&&(i=this.z),this.x=e,this.y=t,this.z=i,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(bu.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(bu.setFromAxisAngle(e,t))}applyMatrix3(e){let t=this.x,i=this.y,r=this.z,s=e.elements;return this.x=s[0]*t+s[3]*i+s[6]*r,this.y=s[1]*t+s[4]*i+s[7]*r,this.z=s[2]*t+s[5]*i+s[8]*r,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){let t=this.x,i=this.y,r=this.z,s=e.elements,a=1/(s[3]*t+s[7]*i+s[11]*r+s[15]);return this.x=(s[0]*t+s[4]*i+s[8]*r+s[12])*a,this.y=(s[1]*t+s[5]*i+s[9]*r+s[13])*a,this.z=(s[2]*t+s[6]*i+s[10]*r+s[14])*a,this}applyQuaternion(e){let t=this.x,i=this.y,r=this.z,s=e.x,a=e.y,o=e.z,l=e.w,c=2*(a*r-o*i),h=2*(o*t-s*r),u=2*(s*i-a*t);return this.x=t+l*c+a*u-o*h,this.y=i+l*h+o*c-s*u,this.z=r+l*u+s*h-a*c,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){let t=this.x,i=this.y,r=this.z,s=e.elements;return this.x=s[0]*t+s[4]*i+s[8]*r,this.y=s[1]*t+s[5]*i+s[9]*r,this.z=s[2]*t+s[6]*i+s[10]*r,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this.z=Math.max(e.z,Math.min(t.z,this.z)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this.z=Math.max(e,Math.min(t,this.z)),this}clampLength(e,t){let i=this.length();return this.divideScalar(i||1).multiplyScalar(Math.max(e,Math.min(t,i)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this.z=e.z+(t.z-e.z)*i,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){let i=e.x,r=e.y,s=e.z,a=t.x,o=t.y,l=t.z;return this.x=r*l-s*o,this.y=s*a-i*l,this.z=i*o-r*a,this}projectOnVector(e){let t=e.lengthSq();if(t===0)return this.set(0,0,0);let i=e.dot(this)/t;return this.copy(e).multiplyScalar(i)}projectOnPlane(e){return pl.copy(this).projectOnVector(e),this.sub(pl)}reflect(e){return this.sub(pl.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let i=this.dot(e)/t;return Math.acos(kt(i,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,i=this.y-e.y,r=this.z-e.z;return t*t+i*i+r*r}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,i){let r=Math.sin(t)*e;return this.x=r*Math.sin(i),this.y=Math.cos(t)*e,this.z=r*Math.cos(i),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,i){return this.x=e*Math.sin(t),this.y=i,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){let t=this.setFromMatrixColumn(e,0).length(),i=this.setFromMatrixColumn(e,1).length(),r=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=i,this.z=r,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,4*t)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,3*t)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let e=Math.random()*Math.PI*2,t=2*Math.random()-1,i=Math.sqrt(1-t*t);return this.x=i*Math.cos(e),this.y=t,this.z=i*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}},pl=new M,bu=new Gt,Ri=class{constructor(e=new M(1/0,1/0,1/0),t=new M(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,i=e.length;t<i;t+=3)this.expandByPoint(wi.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,i=e.count;t<i;t++)this.expandByPoint(wi.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,i=e.length;t<i;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){let i=wi.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(i),this.max.copy(e).add(i),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);let i=e.geometry;if(i!==void 0){let s=i.getAttribute("position");if(t===!0&&s!==void 0&&e.isInstancedMesh!==!0)for(let a=0,o=s.count;a<o;a++)e.isMesh===!0?e.getVertexPosition(a,wi):wi.fromBufferAttribute(s,a),wi.applyMatrix4(e.matrixWorld),this.expandByPoint(wi);else e.boundingBox!==void 0?(e.boundingBox===null&&e.computeBoundingBox(),ra.copy(e.boundingBox)):(i.boundingBox===null&&i.computeBoundingBox(),ra.copy(i.boundingBox)),ra.applyMatrix4(e.matrixWorld),this.union(ra)}let r=e.children;for(let s=0,a=r.length;s<a;s++)this.expandByObject(r[s],t);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,wi),wi.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,i;return e.normal.x>0?(t=e.normal.x*this.min.x,i=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,i=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,i+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,i+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,i+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,i+=e.normal.z*this.min.z),t<=-e.constant&&i>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(ts),sa.subVectors(this.max,ts),nr.subVectors(e.a,ts),rr.subVectors(e.b,ts),sr.subVectors(e.c,ts),on.subVectors(rr,nr),ln.subVectors(sr,rr),In.subVectors(nr,sr);let t=[0,-on.z,on.y,0,-ln.z,ln.y,0,-In.z,In.y,on.z,0,-on.x,ln.z,0,-ln.x,In.z,0,-In.x,-on.y,on.x,0,-ln.y,ln.x,0,-In.y,In.x,0];return!!fl(t,nr,rr,sr,sa)&&(t=[1,0,0,0,1,0,0,0,1],!!fl(t,nr,rr,sr,sa)&&(aa.crossVectors(on,ln),t=[aa.x,aa.y,aa.z],fl(t,nr,rr,sr,sa)))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,wi).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=.5*this.getSize(wi).length()),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()||(qi[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),qi[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),qi[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),qi[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),qi[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),qi[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),qi[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),qi[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(qi)),this}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}},qi=[new M,new M,new M,new M,new M,new M,new M,new M],wi=new M,ra=new Ri,nr=new M,rr=new M,sr=new M,on=new M,ln=new M,In=new M,ts=new M,sa=new M,aa=new M,Ln=new M;function fl(n,e,t,i,r){for(let s=0,a=n.length-3;s<=a;s+=3){Ln.fromArray(n,s);let o=r.x*Math.abs(Ln.x)+r.y*Math.abs(Ln.y)+r.z*Math.abs(Ln.z),l=e.dot(Ln),c=t.dot(Ln),h=i.dot(Ln);if(Math.max(-Math.max(l,c,h),Math.min(l,c,h))>o)return!1}return!0}var $p=new Ri,is=new M,ml=new M,Ci=class{constructor(e=new M,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){let i=this.center;t!==void 0?i.copy(t):$p.setFromPoints(e).getCenter(i);let r=0;for(let s=0,a=e.length;s<a;s++)r=Math.max(r,i.distanceToSquared(e[s]));return this.radius=Math.sqrt(r),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){let t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){let i=this.center.distanceToSquared(e);return t.copy(e),i>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;is.subVectors(e,this.center);let t=is.lengthSq();if(t>this.radius*this.radius){let i=Math.sqrt(t),r=.5*(i-this.radius);this.center.addScaledVector(is,r/i),this.radius+=r}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(ml.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(is.copy(e.center).add(ml)),this.expandByPoint(is.copy(e.center).sub(ml))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}},Yi=new M,gl=new M,oa=new M,cn=new M,vl=new M,la=new M,yl=new M,Rr=class{constructor(e=new M,t=new M(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,Yi)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);let i=t.dot(this.direction);return i<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,i)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){let t=Yi.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(Yi.copy(this.origin).addScaledVector(this.direction,t),Yi.distanceToSquared(e))}distanceSqToSegment(e,t,i,r){gl.copy(e).add(t).multiplyScalar(.5),oa.copy(t).sub(e).normalize(),cn.copy(this.origin).sub(gl);let s=.5*e.distanceTo(t),a=-this.direction.dot(oa),o=cn.dot(this.direction),l=-cn.dot(oa),c=cn.lengthSq(),h=Math.abs(1-a*a),u,d,p,m;if(h>0)if(u=a*l-o,d=a*o-l,m=s*h,u>=0)if(d>=-m)if(d<=m){let x=1/h;u*=x,d*=x,p=u*(u+a*d+2*o)+d*(a*u+d+2*l)+c}else d=s,u=Math.max(0,-(a*d+o)),p=-u*u+d*(d+2*l)+c;else d=-s,u=Math.max(0,-(a*d+o)),p=-u*u+d*(d+2*l)+c;else d<=-m?(u=Math.max(0,-(-a*s+o)),d=u>0?-s:Math.min(Math.max(-s,-l),s),p=-u*u+d*(d+2*l)+c):d<=m?(u=0,d=Math.min(Math.max(-s,-l),s),p=d*(d+2*l)+c):(u=Math.max(0,-(a*s+o)),d=u>0?s:Math.min(Math.max(-s,-l),s),p=-u*u+d*(d+2*l)+c);else d=a>0?-s:s,u=Math.max(0,-(a*d+o)),p=-u*u+d*(d+2*l)+c;return i&&i.copy(this.origin).addScaledVector(this.direction,u),r&&r.copy(gl).addScaledVector(oa,d),p}intersectSphere(e,t){Yi.subVectors(e.center,this.origin);let i=Yi.dot(this.direction),r=Yi.dot(Yi)-i*i,s=e.radius*e.radius;if(r>s)return null;let a=Math.sqrt(s-r),o=i-a,l=i+a;return l<0?null:o<0?this.at(l,t):this.at(o,t)}intersectsSphere(e){return this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){let t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;let i=-(this.origin.dot(e.normal)+e.constant)/t;return i>=0?i:null}intersectPlane(e,t){let i=this.distanceToPlane(e);return i===null?null:this.at(i,t)}intersectsPlane(e){let t=e.distanceToPoint(this.origin);return t===0?!0:e.normal.dot(this.direction)*t<0}intersectBox(e,t){let i,r,s,a,o,l,c=1/this.direction.x,h=1/this.direction.y,u=1/this.direction.z,d=this.origin;return c>=0?(i=(e.min.x-d.x)*c,r=(e.max.x-d.x)*c):(i=(e.max.x-d.x)*c,r=(e.min.x-d.x)*c),h>=0?(s=(e.min.y-d.y)*h,a=(e.max.y-d.y)*h):(s=(e.max.y-d.y)*h,a=(e.min.y-d.y)*h),i>a||s>r?null:((s>i||isNaN(i))&&(i=s),(a<r||isNaN(r))&&(r=a),u>=0?(o=(e.min.z-d.z)*u,l=(e.max.z-d.z)*u):(o=(e.max.z-d.z)*u,l=(e.min.z-d.z)*u),i>l||o>r?null:((o>i||i!=i)&&(i=o),(l<r||r!=r)&&(r=l),r<0?null:this.at(i>=0?i:r,t)))}intersectsBox(e){return this.intersectBox(e,Yi)!==null}intersectTriangle(e,t,i,r,s){vl.subVectors(t,e),la.subVectors(i,e),yl.crossVectors(vl,la);let a,o=this.direction.dot(yl);if(o>0){if(r)return null;a=1}else{if(!(o<0))return null;a=-1,o=-o}cn.subVectors(this.origin,e);let l=a*this.direction.dot(la.crossVectors(cn,la));if(l<0)return null;let c=a*this.direction.dot(vl.cross(cn));if(c<0||l+c>o)return null;let h=-a*cn.dot(yl);return h<0?null:this.at(h/o,s)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}},Ie=class n{constructor(e,t,i,r,s,a,o,l,c,h,u,d,p,m,x,g){n.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,i,r,s,a,o,l,c,h,u,d,p,m,x,g)}set(e,t,i,r,s,a,o,l,c,h,u,d,p,m,x,g){let f=this.elements;return f[0]=e,f[4]=t,f[8]=i,f[12]=r,f[1]=s,f[5]=a,f[9]=o,f[13]=l,f[2]=c,f[6]=h,f[10]=u,f[14]=d,f[3]=p,f[7]=m,f[11]=x,f[15]=g,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new n().fromArray(this.elements)}copy(e){let t=this.elements,i=e.elements;return t[0]=i[0],t[1]=i[1],t[2]=i[2],t[3]=i[3],t[4]=i[4],t[5]=i[5],t[6]=i[6],t[7]=i[7],t[8]=i[8],t[9]=i[9],t[10]=i[10],t[11]=i[11],t[12]=i[12],t[13]=i[13],t[14]=i[14],t[15]=i[15],this}copyPosition(e){let t=this.elements,i=e.elements;return t[12]=i[12],t[13]=i[13],t[14]=i[14],this}setFromMatrix3(e){let t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,i){return e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),i.setFromMatrixColumn(this,2),this}makeBasis(e,t,i){return this.set(e.x,t.x,i.x,0,e.y,t.y,i.y,0,e.z,t.z,i.z,0,0,0,0,1),this}extractRotation(e){let t=this.elements,i=e.elements,r=1/ar.setFromMatrixColumn(e,0).length(),s=1/ar.setFromMatrixColumn(e,1).length(),a=1/ar.setFromMatrixColumn(e,2).length();return t[0]=i[0]*r,t[1]=i[1]*r,t[2]=i[2]*r,t[3]=0,t[4]=i[4]*s,t[5]=i[5]*s,t[6]=i[6]*s,t[7]=0,t[8]=i[8]*a,t[9]=i[9]*a,t[10]=i[10]*a,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){let t=this.elements,i=e.x,r=e.y,s=e.z,a=Math.cos(i),o=Math.sin(i),l=Math.cos(r),c=Math.sin(r),h=Math.cos(s),u=Math.sin(s);if(e.order==="XYZ"){let d=a*h,p=a*u,m=o*h,x=o*u;t[0]=l*h,t[4]=-l*u,t[8]=c,t[1]=p+m*c,t[5]=d-x*c,t[9]=-o*l,t[2]=x-d*c,t[6]=m+p*c,t[10]=a*l}else if(e.order==="YXZ"){let d=l*h,p=l*u,m=c*h,x=c*u;t[0]=d+x*o,t[4]=m*o-p,t[8]=a*c,t[1]=a*u,t[5]=a*h,t[9]=-o,t[2]=p*o-m,t[6]=x+d*o,t[10]=a*l}else if(e.order==="ZXY"){let d=l*h,p=l*u,m=c*h,x=c*u;t[0]=d-x*o,t[4]=-a*u,t[8]=m+p*o,t[1]=p+m*o,t[5]=a*h,t[9]=x-d*o,t[2]=-a*c,t[6]=o,t[10]=a*l}else if(e.order==="ZYX"){let d=a*h,p=a*u,m=o*h,x=o*u;t[0]=l*h,t[4]=m*c-p,t[8]=d*c+x,t[1]=l*u,t[5]=x*c+d,t[9]=p*c-m,t[2]=-c,t[6]=o*l,t[10]=a*l}else if(e.order==="YZX"){let d=a*l,p=a*c,m=o*l,x=o*c;t[0]=l*h,t[4]=x-d*u,t[8]=m*u+p,t[1]=u,t[5]=a*h,t[9]=-o*h,t[2]=-c*h,t[6]=p*u+m,t[10]=d-x*u}else if(e.order==="XZY"){let d=a*l,p=a*c,m=o*l,x=o*c;t[0]=l*h,t[4]=-u,t[8]=c*h,t[1]=d*u+x,t[5]=a*h,t[9]=p*u-m,t[2]=m*u-p,t[6]=o*h,t[10]=x*u+d}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(Jp,e,Kp)}lookAt(e,t,i){let r=this.elements;return si.subVectors(e,t),si.lengthSq()===0&&(si.z=1),si.normalize(),hn.crossVectors(i,si),hn.lengthSq()===0&&(Math.abs(i.z)===1?si.x+=1e-4:si.z+=1e-4,si.normalize(),hn.crossVectors(i,si)),hn.normalize(),ca.crossVectors(si,hn),r[0]=hn.x,r[4]=ca.x,r[8]=si.x,r[1]=hn.y,r[5]=ca.y,r[9]=si.y,r[2]=hn.z,r[6]=ca.z,r[10]=si.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let i=e.elements,r=t.elements,s=this.elements,a=i[0],o=i[4],l=i[8],c=i[12],h=i[1],u=i[5],d=i[9],p=i[13],m=i[2],x=i[6],g=i[10],f=i[14],y=i[3],v=i[7],_=i[11],E=i[15],T=r[0],A=r[4],B=r[8],U=r[12],W=r[1],V=r[5],F=r[9],X=r[13],H=r[2],Y=r[6],k=r[10],ie=r[14],J=r[3],se=r[7],le=r[11],$=r[15];return s[0]=a*T+o*W+l*H+c*J,s[4]=a*A+o*V+l*Y+c*se,s[8]=a*B+o*F+l*k+c*le,s[12]=a*U+o*X+l*ie+c*$,s[1]=h*T+u*W+d*H+p*J,s[5]=h*A+u*V+d*Y+p*se,s[9]=h*B+u*F+d*k+p*le,s[13]=h*U+u*X+d*ie+p*$,s[2]=m*T+x*W+g*H+f*J,s[6]=m*A+x*V+g*Y+f*se,s[10]=m*B+x*F+g*k+f*le,s[14]=m*U+x*X+g*ie+f*$,s[3]=y*T+v*W+_*H+E*J,s[7]=y*A+v*V+_*Y+E*se,s[11]=y*B+v*F+_*k+E*le,s[15]=y*U+v*X+_*ie+E*$,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){let e=this.elements,t=e[0],i=e[4],r=e[8],s=e[12],a=e[1],o=e[5],l=e[9],c=e[13],h=e[2],u=e[6],d=e[10],p=e[14];return e[3]*(+s*l*u-r*c*u-s*o*d+i*c*d+r*o*p-i*l*p)+e[7]*(+t*l*p-t*c*d+s*a*d-r*a*p+r*c*h-s*l*h)+e[11]*(+t*c*u-t*o*p-s*a*u+i*a*p+s*o*h-i*c*h)+e[15]*(-r*o*h-t*l*u+t*o*d+r*a*u-i*a*d+i*l*h)}transpose(){let e=this.elements,t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,i){let r=this.elements;return e.isVector3?(r[12]=e.x,r[13]=e.y,r[14]=e.z):(r[12]=e,r[13]=t,r[14]=i),this}invert(){let e=this.elements,t=e[0],i=e[1],r=e[2],s=e[3],a=e[4],o=e[5],l=e[6],c=e[7],h=e[8],u=e[9],d=e[10],p=e[11],m=e[12],x=e[13],g=e[14],f=e[15],y=u*g*c-x*d*c+x*l*p-o*g*p-u*l*f+o*d*f,v=m*d*c-h*g*c-m*l*p+a*g*p+h*l*f-a*d*f,_=h*x*c-m*u*c+m*o*p-a*x*p-h*o*f+a*u*f,E=m*u*l-h*x*l-m*o*d+a*x*d+h*o*g-a*u*g,T=t*y+i*v+r*_+s*E;if(T===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let A=1/T;return e[0]=y*A,e[1]=(x*d*s-u*g*s-x*r*p+i*g*p+u*r*f-i*d*f)*A,e[2]=(o*g*s-x*l*s+x*r*c-i*g*c-o*r*f+i*l*f)*A,e[3]=(u*l*s-o*d*s-u*r*c+i*d*c+o*r*p-i*l*p)*A,e[4]=v*A,e[5]=(h*g*s-m*d*s+m*r*p-t*g*p-h*r*f+t*d*f)*A,e[6]=(m*l*s-a*g*s-m*r*c+t*g*c+a*r*f-t*l*f)*A,e[7]=(a*d*s-h*l*s+h*r*c-t*d*c-a*r*p+t*l*p)*A,e[8]=_*A,e[9]=(m*u*s-h*x*s-m*i*p+t*x*p+h*i*f-t*u*f)*A,e[10]=(a*x*s-m*o*s+m*i*c-t*x*c-a*i*f+t*o*f)*A,e[11]=(h*o*s-a*u*s-h*i*c+t*u*c+a*i*p-t*o*p)*A,e[12]=E*A,e[13]=(h*x*r-m*u*r+m*i*d-t*x*d-h*i*g+t*u*g)*A,e[14]=(m*o*r-a*x*r-m*i*l+t*x*l+a*i*g-t*o*g)*A,e[15]=(a*u*r-h*o*r+h*i*l-t*u*l-a*i*d+t*o*d)*A,this}scale(e){let t=this.elements,i=e.x,r=e.y,s=e.z;return t[0]*=i,t[4]*=r,t[8]*=s,t[1]*=i,t[5]*=r,t[9]*=s,t[2]*=i,t[6]*=r,t[10]*=s,t[3]*=i,t[7]*=r,t[11]*=s,this}getMaxScaleOnAxis(){let e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],i=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],r=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,i,r))}makeTranslation(e,t,i){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,i,0,0,0,1),this}makeRotationX(e){let t=Math.cos(e),i=Math.sin(e);return this.set(1,0,0,0,0,t,-i,0,0,i,t,0,0,0,0,1),this}makeRotationY(e){let t=Math.cos(e),i=Math.sin(e);return this.set(t,0,i,0,0,1,0,0,-i,0,t,0,0,0,0,1),this}makeRotationZ(e){let t=Math.cos(e),i=Math.sin(e);return this.set(t,-i,0,0,i,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){let i=Math.cos(t),r=Math.sin(t),s=1-i,a=e.x,o=e.y,l=e.z,c=s*a,h=s*o;return this.set(c*a+i,c*o-r*l,c*l+r*o,0,c*o+r*l,h*o+i,h*l-r*a,0,c*l-r*o,h*l+r*a,s*l*l+i,0,0,0,0,1),this}makeScale(e,t,i){return this.set(e,0,0,0,0,t,0,0,0,0,i,0,0,0,0,1),this}makeShear(e,t,i,r,s,a){return this.set(1,i,s,0,e,1,a,0,t,r,1,0,0,0,0,1),this}compose(e,t,i){let r=this.elements,s=t._x,a=t._y,o=t._z,l=t._w,c=s+s,h=a+a,u=o+o,d=s*c,p=s*h,m=s*u,x=a*h,g=a*u,f=o*u,y=l*c,v=l*h,_=l*u,E=i.x,T=i.y,A=i.z;return r[0]=(1-(x+f))*E,r[1]=(p+_)*E,r[2]=(m-v)*E,r[3]=0,r[4]=(p-_)*T,r[5]=(1-(d+f))*T,r[6]=(g+y)*T,r[7]=0,r[8]=(m+v)*A,r[9]=(g-y)*A,r[10]=(1-(d+x))*A,r[11]=0,r[12]=e.x,r[13]=e.y,r[14]=e.z,r[15]=1,this}decompose(e,t,i){let r=this.elements,s=ar.set(r[0],r[1],r[2]).length(),a=ar.set(r[4],r[5],r[6]).length(),o=ar.set(r[8],r[9],r[10]).length();this.determinant()<0&&(s=-s),e.x=r[12],e.y=r[13],e.z=r[14],Ei.copy(this);let l=1/s,c=1/a,h=1/o;return Ei.elements[0]*=l,Ei.elements[1]*=l,Ei.elements[2]*=l,Ei.elements[4]*=c,Ei.elements[5]*=c,Ei.elements[6]*=c,Ei.elements[8]*=h,Ei.elements[9]*=h,Ei.elements[10]*=h,t.setFromRotationMatrix(Ei),i.x=s,i.y=a,i.z=o,this}makePerspective(e,t,i,r,s,a,o=2e3){let l=this.elements,c=2*s/(t-e),h=2*s/(i-r),u=(t+e)/(t-e),d=(i+r)/(i-r),p,m;if(o===Ar)p=-(a+s)/(a-s),m=-2*a*s/(a-s);else{if(o!==$a)throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+o);p=-a/(a-s),m=-a*s/(a-s)}return l[0]=c,l[4]=0,l[8]=u,l[12]=0,l[1]=0,l[5]=h,l[9]=d,l[13]=0,l[2]=0,l[6]=0,l[10]=p,l[14]=m,l[3]=0,l[7]=0,l[11]=-1,l[15]=0,this}makeOrthographic(e,t,i,r,s,a,o=2e3){let l=this.elements,c=1/(t-e),h=1/(i-r),u=1/(a-s),d=(t+e)*c,p=(i+r)*h,m,x;if(o===Ar)m=(a+s)*u,x=-2*u;else{if(o!==$a)throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+o);m=s*u,x=-1*u}return l[0]=2*c,l[4]=0,l[8]=0,l[12]=-d,l[1]=0,l[5]=2*h,l[9]=0,l[13]=-p,l[2]=0,l[6]=0,l[10]=x,l[14]=-m,l[3]=0,l[7]=0,l[11]=0,l[15]=1,this}equals(e){let t=this.elements,i=e.elements;for(let r=0;r<16;r++)if(t[r]!==i[r])return!1;return!0}fromArray(e,t=0){for(let i=0;i<16;i++)this.elements[i]=e[i+t];return this}toArray(e=[],t=0){let i=this.elements;return e[t]=i[0],e[t+1]=i[1],e[t+2]=i[2],e[t+3]=i[3],e[t+4]=i[4],e[t+5]=i[5],e[t+6]=i[6],e[t+7]=i[7],e[t+8]=i[8],e[t+9]=i[9],e[t+10]=i[10],e[t+11]=i[11],e[t+12]=i[12],e[t+13]=i[13],e[t+14]=i[14],e[t+15]=i[15],e}},ar=new M,Ei=new Ie,Jp=new M(0,0,0),Kp=new M(1,1,1),hn=new M,ca=new M,si=new M,wu=new Ie,Eu=new Gt,li=class n{constructor(e=0,t=0,i=0,r=n.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=t,this._z=i,this._order=r}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,i,r=this._order){return this._x=e,this._y=t,this._z=i,this._order=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,i=!0){let r=e.elements,s=r[0],a=r[4],o=r[8],l=r[1],c=r[5],h=r[9],u=r[2],d=r[6],p=r[10];switch(t){case"XYZ":this._y=Math.asin(kt(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-h,p),this._z=Math.atan2(-a,s)):(this._x=Math.atan2(d,c),this._z=0);break;case"YXZ":this._x=Math.asin(-kt(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(o,p),this._z=Math.atan2(l,c)):(this._y=Math.atan2(-u,s),this._z=0);break;case"ZXY":this._x=Math.asin(kt(d,-1,1)),Math.abs(d)<.9999999?(this._y=Math.atan2(-u,p),this._z=Math.atan2(-a,c)):(this._y=0,this._z=Math.atan2(l,s));break;case"ZYX":this._y=Math.asin(-kt(u,-1,1)),Math.abs(u)<.9999999?(this._x=Math.atan2(d,p),this._z=Math.atan2(l,s)):(this._x=0,this._z=Math.atan2(-a,c));break;case"YZX":this._z=Math.asin(kt(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-h,c),this._y=Math.atan2(-u,s)):(this._x=0,this._y=Math.atan2(o,p));break;case"XZY":this._z=Math.asin(-kt(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(d,c),this._y=Math.atan2(o,s)):(this._x=Math.atan2(-h,p),this._y=0);break;default:console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: "+t)}return this._order=t,i===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,i){return wu.makeRotationFromQuaternion(e),this.setFromRotationMatrix(wu,t,i)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return Eu.setFromEuler(this),this.setFromQuaternion(Eu,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};li.DEFAULT_ORDER="XYZ";var eo=class{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!=0}isEnabled(e){return(this.mask&(1<<e|0))!=0}},Qp=0,Tu=new M,or=new Gt,Zi=new Ie,ha=new M,ns=new M,ef=new M,tf=new Gt,Au=new M(1,0,0),Ru=new M(0,1,0),Cu=new M(0,0,1),Pu={type:"added"},nf={type:"removed"},lr={type:"childadded",child:null},xl={type:"childremoved",child:null},xt=class n extends gn{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:Qp++}),this.uuid=tn(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=n.DEFAULT_UP.clone();let e=new M,t=new li,i=new Gt,r=new M(1,1,1);t._onChange(function(){i.setFromEuler(t,!1)}),i._onChange(function(){t.setFromQuaternion(i,void 0,!1)}),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:t},quaternion:{configurable:!0,enumerable:!0,value:i},scale:{configurable:!0,enumerable:!0,value:r},modelViewMatrix:{value:new Ie},normalMatrix:{value:new Oe}}),this.matrix=new Ie,this.matrixWorld=new Ie,this.matrixAutoUpdate=n.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=n.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new eo,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.userData={}}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return or.setFromAxisAngle(e,t),this.quaternion.multiply(or),this}rotateOnWorldAxis(e,t){return or.setFromAxisAngle(e,t),this.quaternion.premultiply(or),this}rotateX(e){return this.rotateOnAxis(Au,e)}rotateY(e){return this.rotateOnAxis(Ru,e)}rotateZ(e){return this.rotateOnAxis(Cu,e)}translateOnAxis(e,t){return Tu.copy(e).applyQuaternion(this.quaternion),this.position.add(Tu.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(Au,e)}translateY(e){return this.translateOnAxis(Ru,e)}translateZ(e){return this.translateOnAxis(Cu,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(Zi.copy(this.matrixWorld).invert())}lookAt(e,t,i){e.isVector3?ha.copy(e):ha.set(e,t,i);let r=this.parent;this.updateWorldMatrix(!0,!1),ns.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?Zi.lookAt(ns,ha,this.up):Zi.lookAt(ha,ns,this.up),this.quaternion.setFromRotationMatrix(Zi),r&&(Zi.extractRotation(r.matrixWorld),or.setFromRotationMatrix(Zi),this.quaternion.premultiply(or.invert()))}add(e){if(arguments.length>1){for(let t=0;t<arguments.length;t++)this.add(arguments[t]);return this}return e===this?(console.error("THREE.Object3D.add: object can't be added as a child of itself.",e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(Pu),lr.child=e,this.dispatchEvent(lr),lr.child=null):console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let i=0;i<arguments.length;i++)this.remove(arguments[i]);return this}let t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(nf),xl.child=e,this.dispatchEvent(xl),xl.child=null),this}removeFromParent(){let e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),Zi.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),Zi.multiply(e.parent.matrixWorld)),e.applyMatrix4(Zi),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(Pu),lr.child=e,this.dispatchEvent(lr),lr.child=null,this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let i=0,r=this.children.length;i<r;i++){let s=this.children[i].getObjectByProperty(e,t);if(s!==void 0)return s}}getObjectsByProperty(e,t,i=[]){this[e]===t&&i.push(this);let r=this.children;for(let s=0,a=r.length;s<a;s++)r[s].getObjectsByProperty(e,t,i);return i}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(ns,e,ef),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(ns,tf,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);let t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}traverse(e){e(this);let t=this.children;for(let i=0,r=t.length;i<r;i++)t[i].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);let t=this.children;for(let i=0,r=t.length;i<r;i++)t[i].traverseVisible(e)}traverseAncestors(e){let t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);let t=this.children;for(let i=0,r=t.length;i<r;i++)t[i].updateMatrixWorld(e)}updateWorldMatrix(e,t){let i=this.parent;if(e===!0&&i!==null&&i.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),t===!0){let r=this.children;for(let s=0,a=r.length;s<a;s++)r[s].updateWorldMatrix(!1,!0)}}toJSON(e){let t=e===void 0||typeof e=="string",i={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},i.metadata={version:4.6,type:"Object",generator:"Object3D.toJSON"});let r={};function s(o,l){return o[l.uuid]===void 0&&(o[l.uuid]=l.toJSON(e)),l.uuid}if(r.uuid=this.uuid,r.type=this.type,this.name!==""&&(r.name=this.name),this.castShadow===!0&&(r.castShadow=!0),this.receiveShadow===!0&&(r.receiveShadow=!0),this.visible===!1&&(r.visible=!1),this.frustumCulled===!1&&(r.frustumCulled=!1),this.renderOrder!==0&&(r.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(r.userData=this.userData),r.layers=this.layers.mask,r.matrix=this.matrix.toArray(),r.up=this.up.toArray(),this.matrixAutoUpdate===!1&&(r.matrixAutoUpdate=!1),this.isInstancedMesh&&(r.type="InstancedMesh",r.count=this.count,r.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(r.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(r.type="BatchedMesh",r.perObjectFrustumCulled=this.perObjectFrustumCulled,r.sortObjects=this.sortObjects,r.drawRanges=this._drawRanges,r.reservedRanges=this._reservedRanges,r.visibility=this._visibility,r.active=this._active,r.bounds=this._bounds.map(o=>({boxInitialized:o.boxInitialized,boxMin:o.box.min.toArray(),boxMax:o.box.max.toArray(),sphereInitialized:o.sphereInitialized,sphereRadius:o.sphere.radius,sphereCenter:o.sphere.center.toArray()})),r.maxInstanceCount=this._maxInstanceCount,r.maxVertexCount=this._maxVertexCount,r.maxIndexCount=this._maxIndexCount,r.geometryInitialized=this._geometryInitialized,r.geometryCount=this._geometryCount,r.matricesTexture=this._matricesTexture.toJSON(e),this._colorsTexture!==null&&(r.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(r.boundingSphere={center:r.boundingSphere.center.toArray(),radius:r.boundingSphere.radius}),this.boundingBox!==null&&(r.boundingBox={min:r.boundingBox.min.toArray(),max:r.boundingBox.max.toArray()})),this.isScene)this.background&&(this.background.isColor?r.background=this.background.toJSON():this.background.isTexture&&(r.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(r.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){r.geometry=s(e.geometries,this.geometry);let o=this.geometry.parameters;if(o!==void 0&&o.shapes!==void 0){let l=o.shapes;if(Array.isArray(l))for(let c=0,h=l.length;c<h;c++){let u=l[c];s(e.shapes,u)}else s(e.shapes,l)}}if(this.isSkinnedMesh&&(r.bindMode=this.bindMode,r.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(s(e.skeletons,this.skeleton),r.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){let o=[];for(let l=0,c=this.material.length;l<c;l++)o.push(s(e.materials,this.material[l]));r.material=o}else r.material=s(e.materials,this.material);if(this.children.length>0){r.children=[];for(let o=0;o<this.children.length;o++)r.children.push(this.children[o].toJSON(e).object)}if(this.animations.length>0){r.animations=[];for(let o=0;o<this.animations.length;o++){let l=this.animations[o];r.animations.push(s(e.animations,l))}}if(t){let o=a(e.geometries),l=a(e.materials),c=a(e.textures),h=a(e.images),u=a(e.shapes),d=a(e.skeletons),p=a(e.animations),m=a(e.nodes);o.length>0&&(i.geometries=o),l.length>0&&(i.materials=l),c.length>0&&(i.textures=c),h.length>0&&(i.images=h),u.length>0&&(i.shapes=u),d.length>0&&(i.skeletons=d),p.length>0&&(i.animations=p),m.length>0&&(i.nodes=m)}return i.object=r,i;function a(o){let l=[];for(let c in o){let h=o[c];delete h.metadata,l.push(h)}return l}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let i=0;i<e.children.length;i++){let r=e.children[i];this.add(r.clone())}return this}};xt.DEFAULT_UP=new M(0,1,0),xt.DEFAULT_MATRIX_AUTO_UPDATE=!0,xt.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;var Ti=new M,$i=new M,_l=new M,Ji=new M,cr=new M,hr=new M,Iu=new M,Ml=new M,Sl=new M,bl=new M,wl=new $e,El=new $e,Tl=new $e,en=class n{constructor(e=new M,t=new M,i=new M){this.a=e,this.b=t,this.c=i}static getNormal(e,t,i,r){r.subVectors(i,t),Ti.subVectors(e,t),r.cross(Ti);let s=r.lengthSq();return s>0?r.multiplyScalar(1/Math.sqrt(s)):r.set(0,0,0)}static getBarycoord(e,t,i,r,s){Ti.subVectors(r,t),$i.subVectors(i,t),_l.subVectors(e,t);let a=Ti.dot(Ti),o=Ti.dot($i),l=Ti.dot(_l),c=$i.dot($i),h=$i.dot(_l),u=a*c-o*o;if(u===0)return s.set(0,0,0),null;let d=1/u,p=(c*l-o*h)*d,m=(a*h-o*l)*d;return s.set(1-p-m,m,p)}static containsPoint(e,t,i,r){return this.getBarycoord(e,t,i,r,Ji)!==null&&Ji.x>=0&&Ji.y>=0&&Ji.x+Ji.y<=1}static getInterpolation(e,t,i,r,s,a,o,l){return this.getBarycoord(e,t,i,r,Ji)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(s,Ji.x),l.addScaledVector(a,Ji.y),l.addScaledVector(o,Ji.z),l)}static getInterpolatedAttribute(e,t,i,r,s,a){return wl.setScalar(0),El.setScalar(0),Tl.setScalar(0),wl.fromBufferAttribute(e,t),El.fromBufferAttribute(e,i),Tl.fromBufferAttribute(e,r),a.setScalar(0),a.addScaledVector(wl,s.x),a.addScaledVector(El,s.y),a.addScaledVector(Tl,s.z),a}static isFrontFacing(e,t,i,r){return Ti.subVectors(i,t),$i.subVectors(e,t),Ti.cross($i).dot(r)<0}set(e,t,i){return this.a.copy(e),this.b.copy(t),this.c.copy(i),this}setFromPointsAndIndices(e,t,i,r){return this.a.copy(e[t]),this.b.copy(e[i]),this.c.copy(e[r]),this}setFromAttributeAndIndices(e,t,i,r){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,i),this.c.fromBufferAttribute(e,r),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return Ti.subVectors(this.c,this.b),$i.subVectors(this.a,this.b),.5*Ti.cross($i).length()}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(e){return n.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,t){return n.getBarycoord(e,this.a,this.b,this.c,t)}getInterpolation(e,t,i,r,s){return n.getInterpolation(e,this.a,this.b,this.c,t,i,r,s)}containsPoint(e){return n.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return n.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){let i=this.a,r=this.b,s=this.c,a,o;cr.subVectors(r,i),hr.subVectors(s,i),Ml.subVectors(e,i);let l=cr.dot(Ml),c=hr.dot(Ml);if(l<=0&&c<=0)return t.copy(i);Sl.subVectors(e,r);let h=cr.dot(Sl),u=hr.dot(Sl);if(h>=0&&u<=h)return t.copy(r);let d=l*u-h*c;if(d<=0&&l>=0&&h<=0)return a=l/(l-h),t.copy(i).addScaledVector(cr,a);bl.subVectors(e,s);let p=cr.dot(bl),m=hr.dot(bl);if(m>=0&&p<=m)return t.copy(s);let x=p*c-l*m;if(x<=0&&c>=0&&m<=0)return o=c/(c-m),t.copy(i).addScaledVector(hr,o);let g=h*m-p*u;if(g<=0&&u-h>=0&&p-m>=0)return Iu.subVectors(s,r),o=(u-h)/(u-h+(p-m)),t.copy(r).addScaledVector(Iu,o);let f=1/(g+x+d);return a=x*f,o=d*f,t.copy(i).addScaledVector(cr,a).addScaledVector(hr,o)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}},Hd={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},un={h:0,s:0,l:0},ua={h:0,s:0,l:0};function Al(n,e,t){return t<0&&(t+=1),t>1&&(t-=1),t<1/6?n+6*(e-n)*t:t<.5?e:t<2/3?n+6*(e-n)*(2/3-t):n}var be=class{constructor(e,t,i){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,i)}set(e,t,i){if(t===void 0&&i===void 0){let r=e;r&&r.isColor?this.copy(r):typeof r=="number"?this.setHex(r):typeof r=="string"&&this.setStyle(r)}else this.setRGB(e,t,i);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=Vt){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(255&e)/255,Ye.toWorkingColorSpace(this,t),this}setRGB(e,t,i,r=Ye.workingColorSpace){return this.r=e,this.g=t,this.b=i,Ye.toWorkingColorSpace(this,r),this}setHSL(e,t,i,r=Ye.workingColorSpace){if(e=Xp(e,1),t=kt(t,0,1),i=kt(i,0,1),t===0)this.r=this.g=this.b=i;else{let s=i<=.5?i*(1+t):i+t-i*t,a=2*i-s;this.r=Al(a,s,e+1/3),this.g=Al(a,s,e),this.b=Al(a,s,e-1/3)}return Ye.toWorkingColorSpace(this,r),this}setStyle(e,t=Vt){function i(s){s!==void 0&&parseFloat(s)<1&&console.warn("THREE.Color: Alpha component of "+e+" will be ignored.")}let r;if(r=/^(\w+)\(([^\)]*)\)/.exec(e)){let s,a=r[1],o=r[2];switch(a){case"rgb":case"rgba":if(s=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return i(s[4]),this.setRGB(Math.min(255,parseInt(s[1],10))/255,Math.min(255,parseInt(s[2],10))/255,Math.min(255,parseInt(s[3],10))/255,t);if(s=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return i(s[4]),this.setRGB(Math.min(100,parseInt(s[1],10))/100,Math.min(100,parseInt(s[2],10))/100,Math.min(100,parseInt(s[3],10))/100,t);break;case"hsl":case"hsla":if(s=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return i(s[4]),this.setHSL(parseFloat(s[1])/360,parseFloat(s[2])/100,parseFloat(s[3])/100,t);break;default:console.warn("THREE.Color: Unknown color model "+e)}}else if(r=/^\#([A-Fa-f\d]+)$/.exec(e)){let s=r[1],a=s.length;if(a===3)return this.setRGB(parseInt(s.charAt(0),16)/15,parseInt(s.charAt(1),16)/15,parseInt(s.charAt(2),16)/15,t);if(a===6)return this.setHex(parseInt(s,16),t);console.warn("THREE.Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=Vt){let i=Hd[e.toLowerCase()];return i!==void 0?this.setHex(i,t):console.warn("THREE.Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=Mr(e.r),this.g=Mr(e.g),this.b=Mr(e.b),this}copyLinearToSRGB(e){return this.r=ul(e.r),this.g=ul(e.g),this.b=ul(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=Vt){return Ye.fromWorkingColorSpace(Ht.copy(this),e),65536*Math.round(kt(255*Ht.r,0,255))+256*Math.round(kt(255*Ht.g,0,255))+Math.round(kt(255*Ht.b,0,255))}getHexString(e=Vt){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=Ye.workingColorSpace){Ye.fromWorkingColorSpace(Ht.copy(this),t);let i=Ht.r,r=Ht.g,s=Ht.b,a=Math.max(i,r,s),o=Math.min(i,r,s),l,c,h=(o+a)/2;if(o===a)l=0,c=0;else{let u=a-o;switch(c=h<=.5?u/(a+o):u/(2-a-o),a){case i:l=(r-s)/u+(r<s?6:0);break;case r:l=(s-i)/u+2;break;case s:l=(i-r)/u+4}l/=6}return e.h=l,e.s=c,e.l=h,e}getRGB(e,t=Ye.workingColorSpace){return Ye.fromWorkingColorSpace(Ht.copy(this),t),e.r=Ht.r,e.g=Ht.g,e.b=Ht.b,e}getStyle(e=Vt){Ye.fromWorkingColorSpace(Ht.copy(this),e);let t=Ht.r,i=Ht.g,r=Ht.b;return e!==Vt?`color(${e} ${t.toFixed(3)} ${i.toFixed(3)} ${r.toFixed(3)})`:`rgb(${Math.round(255*t)},${Math.round(255*i)},${Math.round(255*r)})`}offsetHSL(e,t,i){return this.getHSL(un),this.setHSL(un.h+e,un.s+t,un.l+i)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,i){return this.r=e.r+(t.r-e.r)*i,this.g=e.g+(t.g-e.g)*i,this.b=e.b+(t.b-e.b)*i,this}lerpHSL(e,t){this.getHSL(un),e.getHSL(ua);let i=cl(un.h,ua.h,t),r=cl(un.s,ua.s,t),s=cl(un.l,ua.l,t);return this.setHSL(i,r,s),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){let t=this.r,i=this.g,r=this.b,s=e.elements;return this.r=s[0]*t+s[3]*i+s[6]*r,this.g=s[1]*t+s[4]*i+s[7]*r,this.b=s[2]*t+s[5]*i+s[8]*r,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}},Ht=new be;be.NAMES=Hd;var rf=0,Hi=class extends gn{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:rf++}),this.uuid=tn(),this.name="",this.type="Material",this.blending=1,this.side=zi,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=ql,this.blendDst=Yl,this.blendEquation=Fn,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new be(0,0,0),this.blendAlpha=0,this.depthFunc=3,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=519,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=tr,this.stencilZFail=tr,this.stencilZPass=tr,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(let t in e){let i=e[t];if(i===void 0){console.warn(`THREE.Material: parameter '${t}' has value of undefined.`);continue}let r=this[t];r!==void 0?r&&r.isColor?r.set(i):r&&r.isVector3&&i&&i.isVector3?r.copy(i):this[t]=i:console.warn(`THREE.Material: '${t}' is not a property of THREE.${this.type}.`)}}toJSON(e){let t=e===void 0||typeof e=="string";t&&(e={textures:{},images:{}});let i={metadata:{version:4.6,type:"Material",generator:"Material.toJSON"}};function r(s){let a=[];for(let o in s){let l=s[o];delete l.metadata,a.push(l)}return a}if(i.uuid=this.uuid,i.type=this.type,this.name!==""&&(i.name=this.name),this.color&&this.color.isColor&&(i.color=this.color.getHex()),this.roughness!==void 0&&(i.roughness=this.roughness),this.metalness!==void 0&&(i.metalness=this.metalness),this.sheen!==void 0&&(i.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(i.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(i.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(i.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1&&(i.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(i.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(i.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(i.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(i.shininess=this.shininess),this.clearcoat!==void 0&&(i.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(i.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(i.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(i.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(i.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,i.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.dispersion!==void 0&&(i.dispersion=this.dispersion),this.iridescence!==void 0&&(i.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(i.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(i.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(i.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(i.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(i.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(i.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(i.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(i.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(i.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(i.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(i.lightMap=this.lightMap.toJSON(e).uuid,i.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(i.aoMap=this.aoMap.toJSON(e).uuid,i.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(i.bumpMap=this.bumpMap.toJSON(e).uuid,i.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(i.normalMap=this.normalMap.toJSON(e).uuid,i.normalMapType=this.normalMapType,i.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(i.displacementMap=this.displacementMap.toJSON(e).uuid,i.displacementScale=this.displacementScale,i.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(i.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(i.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(i.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(i.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(i.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(i.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(i.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(i.combine=this.combine)),this.envMapRotation!==void 0&&(i.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(i.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(i.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(i.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(i.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(i.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(i.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(i.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(i.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(i.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(i.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(i.size=this.size),this.shadowSide!==null&&(i.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(i.sizeAttenuation=this.sizeAttenuation),this.blending!==1&&(i.blending=this.blending),this.side!==zi&&(i.side=this.side),this.vertexColors===!0&&(i.vertexColors=!0),this.opacity<1&&(i.opacity=this.opacity),this.transparent===!0&&(i.transparent=!0),this.blendSrc!==ql&&(i.blendSrc=this.blendSrc),this.blendDst!==Yl&&(i.blendDst=this.blendDst),this.blendEquation!==Fn&&(i.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(i.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(i.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(i.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(i.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(i.blendAlpha=this.blendAlpha),this.depthFunc!==3&&(i.depthFunc=this.depthFunc),this.depthTest===!1&&(i.depthTest=this.depthTest),this.depthWrite===!1&&(i.depthWrite=this.depthWrite),this.colorWrite===!1&&(i.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(i.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==519&&(i.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(i.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(i.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==tr&&(i.stencilFail=this.stencilFail),this.stencilZFail!==tr&&(i.stencilZFail=this.stencilZFail),this.stencilZPass!==tr&&(i.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(i.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(i.rotation=this.rotation),this.polygonOffset===!0&&(i.polygonOffset=!0),this.polygonOffsetFactor!==0&&(i.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(i.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(i.linewidth=this.linewidth),this.dashSize!==void 0&&(i.dashSize=this.dashSize),this.gapSize!==void 0&&(i.gapSize=this.gapSize),this.scale!==void 0&&(i.scale=this.scale),this.dithering===!0&&(i.dithering=!0),this.alphaTest>0&&(i.alphaTest=this.alphaTest),this.alphaHash===!0&&(i.alphaHash=!0),this.alphaToCoverage===!0&&(i.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(i.premultipliedAlpha=!0),this.forceSinglePass===!0&&(i.forceSinglePass=!0),this.wireframe===!0&&(i.wireframe=!0),this.wireframeLinewidth>1&&(i.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(i.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(i.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(i.flatShading=!0),this.visible===!1&&(i.visible=!1),this.toneMapped===!1&&(i.toneMapped=!1),this.fog===!1&&(i.fog=!1),Object.keys(this.userData).length>0&&(i.userData=this.userData),t){let s=r(e.textures),a=r(e.images);s.length>0&&(i.textures=s),a.length>0&&(i.images=a)}return i}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;let t=e.clippingPlanes,i=null;if(t!==null){let r=t.length;i=new Array(r);for(let s=0;s!==r;++s)i[s]=t[s].clone()}return this.clippingPlanes=i,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}onBuild(){console.warn("Material: onBuild() has been removed.")}},Lt=class extends Hi{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new be(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new li,this.combine=Rd,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}},z0=sf();function sf(){let n=new ArrayBuffer(4),e=new Float32Array(n),t=new Uint32Array(n),i=new Uint32Array(512),r=new Uint32Array(512);for(let l=0;l<256;++l){let c=l-127;c<-27?(i[l]=0,i[256|l]=32768,r[l]=24,r[256|l]=24):c<-14?(i[l]=1024>>-c-14,i[256|l]=1024>>-c-14|32768,r[l]=-c-1,r[256|l]=-c-1):c<=15?(i[l]=c+15<<10,i[256|l]=c+15<<10|32768,r[l]=13,r[256|l]=13):c<128?(i[l]=31744,i[256|l]=64512,r[l]=24,r[256|l]=24):(i[l]=31744,i[256|l]=64512,r[l]=13,r[256|l]=13)}let s=new Uint32Array(2048),a=new Uint32Array(64),o=new Uint32Array(64);for(let l=1;l<1024;++l){let c=l<<13,h=0;for(;!(8388608&c);)c<<=1,h-=8388608;c&=-8388609,h+=947912704,s[l]=c|h}for(let l=1024;l<2048;++l)s[l]=939524096+(l-1024<<13);for(let l=1;l<31;++l)a[l]=l<<23;a[31]=1199570944,a[32]=2147483648;for(let l=33;l<63;++l)a[l]=2147483648+(l-32<<23);a[63]=3347054592;for(let l=1;l<64;++l)l!==32&&(o[l]=1024);return{floatView:e,uint32View:t,baseTable:i,shiftTable:r,mantissaTable:s,exponentTable:a,offsetTable:o}}var _t=new M,da=new re,St=class{constructor(e,t,i=!1){if(Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,this.name="",this.array=e,this.itemSize=t,this.count=e!==void 0?e.length/t:0,this.normalized=i,this.usage=Ec,this.updateRanges=[],this.gpuType=Bi,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,t,i){e*=this.itemSize,i*=t.itemSize;for(let r=0,s=this.itemSize;r<s;r++)this.array[e+r]=t.array[i+r];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,i=this.count;t<i;t++)da.fromBufferAttribute(this,t),da.applyMatrix3(e),this.setXY(t,da.x,da.y);else if(this.itemSize===3)for(let t=0,i=this.count;t<i;t++)_t.fromBufferAttribute(this,t),_t.applyMatrix3(e),this.setXYZ(t,_t.x,_t.y,_t.z);return this}applyMatrix4(e){for(let t=0,i=this.count;t<i;t++)_t.fromBufferAttribute(this,t),_t.applyMatrix4(e),this.setXYZ(t,_t.x,_t.y,_t.z);return this}applyNormalMatrix(e){for(let t=0,i=this.count;t<i;t++)_t.fromBufferAttribute(this,t),_t.applyNormalMatrix(e),this.setXYZ(t,_t.x,_t.y,_t.z);return this}transformDirection(e){for(let t=0,i=this.count;t<i;t++)_t.fromBufferAttribute(this,t),_t.transformDirection(e),this.setXYZ(t,_t.x,_t.y,_t.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let i=this.array[e*this.itemSize+t];return this.normalized&&(i=Fi(i,this.array)),i}setComponent(e,t,i){return this.normalized&&(i=et(i,this.array)),this.array[e*this.itemSize+t]=i,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=Fi(t,this.array)),t}setX(e,t){return this.normalized&&(t=et(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=Fi(t,this.array)),t}setY(e,t){return this.normalized&&(t=et(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=Fi(t,this.array)),t}setZ(e,t){return this.normalized&&(t=et(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=Fi(t,this.array)),t}setW(e,t){return this.normalized&&(t=et(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,i){return e*=this.itemSize,this.normalized&&(t=et(t,this.array),i=et(i,this.array)),this.array[e+0]=t,this.array[e+1]=i,this}setXYZ(e,t,i,r){return e*=this.itemSize,this.normalized&&(t=et(t,this.array),i=et(i,this.array),r=et(r,this.array)),this.array[e+0]=t,this.array[e+1]=i,this.array[e+2]=r,this}setXYZW(e,t,i,r,s){return e*=this.itemSize,this.normalized&&(t=et(t,this.array),i=et(i,this.array),r=et(r,this.array),s=et(s,this.array)),this.array[e+0]=t,this.array[e+1]=i,this.array[e+2]=r,this.array[e+3]=s,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(e.name=this.name),this.usage!==Ec&&(e.usage=this.usage),e}};var to=class extends St{constructor(e,t,i){super(new Uint16Array(e),t,i)}};var io=class extends St{constructor(e,t,i){super(new Uint32Array(e),t,i)}};var Ae=class extends St{constructor(e,t,i){super(new Float32Array(e),t,i)}},af=0,fi=new Ie,Rl=new xt,ur=new M,ai=new Ri,rs=new Ri,Pt=new M,Je=class n extends gn{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:af++}),this.uuid=tn(),this.name="",this.type="BufferGeometry",this.index=null,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(zd(e)?io:to)(e,1):this.index=e,this}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,i=0){this.groups.push({start:e,count:t,materialIndex:i})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){let t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);let i=this.attributes.normal;if(i!==void 0){let s=new Oe().getNormalMatrix(e);i.applyNormalMatrix(s),i.needsUpdate=!0}let r=this.attributes.tangent;return r!==void 0&&(r.transformDirection(e),r.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(e){return fi.makeRotationFromQuaternion(e),this.applyMatrix4(fi),this}rotateX(e){return fi.makeRotationX(e),this.applyMatrix4(fi),this}rotateY(e){return fi.makeRotationY(e),this.applyMatrix4(fi),this}rotateZ(e){return fi.makeRotationZ(e),this.applyMatrix4(fi),this}translate(e,t,i){return fi.makeTranslation(e,t,i),this.applyMatrix4(fi),this}scale(e,t,i){return fi.makeScale(e,t,i),this.applyMatrix4(fi),this}lookAt(e){return Rl.lookAt(e),Rl.updateMatrix(),this.applyMatrix4(Rl.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(ur).negate(),this.translate(ur.x,ur.y,ur.z),this}setFromPoints(e){let t=[];for(let i=0,r=e.length;i<r;i++){let s=e[i];t.push(s.x,s.y,s.z||0)}return this.setAttribute("position",new Ae(t,3)),this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new Ri);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute)return console.error("THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),void this.boundingBox.set(new M(-1/0,-1/0,-1/0),new M(1/0,1/0,1/0));if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let i=0,r=t.length;i<r;i++){let s=t[i];ai.setFromBufferAttribute(s),this.morphTargetsRelative?(Pt.addVectors(this.boundingBox.min,ai.min),this.boundingBox.expandByPoint(Pt),Pt.addVectors(this.boundingBox.max,ai.max),this.boundingBox.expandByPoint(Pt)):(this.boundingBox.expandByPoint(ai.min),this.boundingBox.expandByPoint(ai.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&console.error('THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Ci);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute)return console.error("THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),void this.boundingSphere.set(new M,1/0);if(e){let i=this.boundingSphere.center;if(ai.setFromBufferAttribute(e),t)for(let s=0,a=t.length;s<a;s++){let o=t[s];rs.setFromBufferAttribute(o),this.morphTargetsRelative?(Pt.addVectors(ai.min,rs.min),ai.expandByPoint(Pt),Pt.addVectors(ai.max,rs.max),ai.expandByPoint(Pt)):(ai.expandByPoint(rs.min),ai.expandByPoint(rs.max))}ai.getCenter(i);let r=0;for(let s=0,a=e.count;s<a;s++)Pt.fromBufferAttribute(e,s),r=Math.max(r,i.distanceToSquared(Pt));if(t)for(let s=0,a=t.length;s<a;s++){let o=t[s],l=this.morphTargetsRelative;for(let c=0,h=o.count;c<h;c++)Pt.fromBufferAttribute(o,c),l&&(ur.fromBufferAttribute(e,c),Pt.add(ur)),r=Math.max(r,i.distanceToSquared(Pt))}this.boundingSphere.radius=Math.sqrt(r),isNaN(this.boundingSphere.radius)&&console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){let e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0)return void console.error("THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");let i=t.position,r=t.normal,s=t.uv;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new St(new Float32Array(4*i.count),4));let a=this.getAttribute("tangent"),o=[],l=[];for(let B=0;B<i.count;B++)o[B]=new M,l[B]=new M;let c=new M,h=new M,u=new M,d=new re,p=new re,m=new re,x=new M,g=new M;function f(B,U,W){c.fromBufferAttribute(i,B),h.fromBufferAttribute(i,U),u.fromBufferAttribute(i,W),d.fromBufferAttribute(s,B),p.fromBufferAttribute(s,U),m.fromBufferAttribute(s,W),h.sub(c),u.sub(c),p.sub(d),m.sub(d);let V=1/(p.x*m.y-m.x*p.y);isFinite(V)&&(x.copy(h).multiplyScalar(m.y).addScaledVector(u,-p.y).multiplyScalar(V),g.copy(u).multiplyScalar(p.x).addScaledVector(h,-m.x).multiplyScalar(V),o[B].add(x),o[U].add(x),o[W].add(x),l[B].add(g),l[U].add(g),l[W].add(g))}let y=this.groups;y.length===0&&(y=[{start:0,count:e.count}]);for(let B=0,U=y.length;B<U;++B){let W=y[B],V=W.start;for(let F=V,X=V+W.count;F<X;F+=3)f(e.getX(F+0),e.getX(F+1),e.getX(F+2))}let v=new M,_=new M,E=new M,T=new M;function A(B){E.fromBufferAttribute(r,B),T.copy(E);let U=o[B];v.copy(U),v.sub(E.multiplyScalar(E.dot(U))).normalize(),_.crossVectors(T,U);let W=_.dot(l[B])<0?-1:1;a.setXYZW(B,v.x,v.y,v.z,W)}for(let B=0,U=y.length;B<U;++B){let W=y[B],V=W.start;for(let F=V,X=V+W.count;F<X;F+=3)A(e.getX(F+0)),A(e.getX(F+1)),A(e.getX(F+2))}}computeVertexNormals(){let e=this.index,t=this.getAttribute("position");if(t!==void 0){let i=this.getAttribute("normal");if(i===void 0)i=new St(new Float32Array(3*t.count),3),this.setAttribute("normal",i);else for(let d=0,p=i.count;d<p;d++)i.setXYZ(d,0,0,0);let r=new M,s=new M,a=new M,o=new M,l=new M,c=new M,h=new M,u=new M;if(e)for(let d=0,p=e.count;d<p;d+=3){let m=e.getX(d+0),x=e.getX(d+1),g=e.getX(d+2);r.fromBufferAttribute(t,m),s.fromBufferAttribute(t,x),a.fromBufferAttribute(t,g),h.subVectors(a,s),u.subVectors(r,s),h.cross(u),o.fromBufferAttribute(i,m),l.fromBufferAttribute(i,x),c.fromBufferAttribute(i,g),o.add(h),l.add(h),c.add(h),i.setXYZ(m,o.x,o.y,o.z),i.setXYZ(x,l.x,l.y,l.z),i.setXYZ(g,c.x,c.y,c.z)}else for(let d=0,p=t.count;d<p;d+=3)r.fromBufferAttribute(t,d+0),s.fromBufferAttribute(t,d+1),a.fromBufferAttribute(t,d+2),h.subVectors(a,s),u.subVectors(r,s),h.cross(u),i.setXYZ(d+0,h.x,h.y,h.z),i.setXYZ(d+1,h.x,h.y,h.z),i.setXYZ(d+2,h.x,h.y,h.z);this.normalizeNormals(),i.needsUpdate=!0}}normalizeNormals(){let e=this.attributes.normal;for(let t=0,i=e.count;t<i;t++)Pt.fromBufferAttribute(e,t),Pt.normalize(),e.setXYZ(t,Pt.x,Pt.y,Pt.z)}toNonIndexed(){function e(o,l){let c=o.array,h=o.itemSize,u=o.normalized,d=new c.constructor(l.length*h),p=0,m=0;for(let x=0,g=l.length;x<g;x++){p=o.isInterleavedBufferAttribute?l[x]*o.data.stride+o.offset:l[x]*h;for(let f=0;f<h;f++)d[m++]=c[p++]}return new St(d,h,u)}if(this.index===null)return console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;let t=new n,i=this.index.array,r=this.attributes;for(let o in r){let l=e(r[o],i);t.setAttribute(o,l)}let s=this.morphAttributes;for(let o in s){let l=[],c=s[o];for(let h=0,u=c.length;h<u;h++){let d=e(c[h],i);l.push(d)}t.morphAttributes[o]=l}t.morphTargetsRelative=this.morphTargetsRelative;let a=this.groups;for(let o=0,l=a.length;o<l;o++){let c=a[o];t.addGroup(c.start,c.count,c.materialIndex)}return t}toJSON(){let e={metadata:{version:4.6,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.type,this.name!==""&&(e.name=this.name),Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0){let l=this.parameters;for(let c in l)l[c]!==void 0&&(e[c]=l[c]);return e}e.data={attributes:{}};let t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});let i=this.attributes;for(let l in i){let c=i[l];e.data.attributes[l]=c.toJSON(e.data)}let r={},s=!1;for(let l in this.morphAttributes){let c=this.morphAttributes[l],h=[];for(let u=0,d=c.length;u<d;u++){let p=c[u];h.push(p.toJSON(e.data))}h.length>0&&(r[l]=h,s=!0)}s&&(e.data.morphAttributes=r,e.data.morphTargetsRelative=this.morphTargetsRelative);let a=this.groups;a.length>0&&(e.data.groups=JSON.parse(JSON.stringify(a)));let o=this.boundingSphere;return o!==null&&(e.data.boundingSphere={center:o.center.toArray(),radius:o.radius}),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let t={};this.name=e.name;let i=e.index;i!==null&&this.setIndex(i.clone(t));let r=e.attributes;for(let c in r){let h=r[c];this.setAttribute(c,h.clone(t))}let s=e.morphAttributes;for(let c in s){let h=[],u=s[c];for(let d=0,p=u.length;d<p;d++)h.push(u[d].clone(t));this.morphAttributes[c]=h}this.morphTargetsRelative=e.morphTargetsRelative;let a=e.groups;for(let c=0,h=a.length;c<h;c++){let u=a[c];this.addGroup(u.start,u.count,u.materialIndex)}let o=e.boundingBox;o!==null&&(this.boundingBox=o.clone());let l=e.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}},Lu=new Ie,Un=new Rr,pa=new Ci,Uu=new M,fa=new M,ma=new M,ga=new M,Cl=new M,va=new M,Du=new M,ya=new M,pe=class extends xt{constructor(e=new Je,t=new Lt){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=t,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){let e=this.geometry.morphAttributes,t=Object.keys(e);if(t.length>0){let i=e[t[0]];if(i!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,s=i.length;r<s;r++){let a=i[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=r}}}}getVertexPosition(e,t){let i=this.geometry,r=i.attributes.position,s=i.morphAttributes.position,a=i.morphTargetsRelative;t.fromBufferAttribute(r,e);let o=this.morphTargetInfluences;if(s&&o){va.set(0,0,0);for(let l=0,c=s.length;l<c;l++){let h=o[l],u=s[l];h!==0&&(Cl.fromBufferAttribute(u,e),a?va.addScaledVector(Cl,h):va.addScaledVector(Cl.sub(t),h))}t.add(va)}return t}raycast(e,t){let i=this.geometry,r=this.material,s=this.matrixWorld;if(r!==void 0){if(i.boundingSphere===null&&i.computeBoundingSphere(),pa.copy(i.boundingSphere),pa.applyMatrix4(s),Un.copy(e.ray).recast(e.near),pa.containsPoint(Un.origin)===!1&&(Un.intersectSphere(pa,Uu)===null||Un.origin.distanceToSquared(Uu)>(e.far-e.near)**2))return;Lu.copy(s).invert(),Un.copy(e.ray).applyMatrix4(Lu),i.boundingBox!==null&&Un.intersectsBox(i.boundingBox)===!1||this._computeIntersections(e,t,Un)}}_computeIntersections(e,t,i){let r,s=this.geometry,a=this.material,o=s.index,l=s.attributes.position,c=s.attributes.uv,h=s.attributes.uv1,u=s.attributes.normal,d=s.groups,p=s.drawRange;if(o!==null)if(Array.isArray(a))for(let m=0,x=d.length;m<x;m++){let g=d[m],f=a[g.materialIndex];for(let y=Math.max(g.start,p.start),v=Math.min(o.count,Math.min(g.start+g.count,p.start+p.count));y<v;y+=3)r=xa(this,f,e,i,c,h,u,o.getX(y),o.getX(y+1),o.getX(y+2)),r&&(r.faceIndex=Math.floor(y/3),r.face.materialIndex=g.materialIndex,t.push(r))}else for(let m=Math.max(0,p.start),x=Math.min(o.count,p.start+p.count);m<x;m+=3)r=xa(this,a,e,i,c,h,u,o.getX(m),o.getX(m+1),o.getX(m+2)),r&&(r.faceIndex=Math.floor(m/3),t.push(r));else if(l!==void 0)if(Array.isArray(a))for(let m=0,x=d.length;m<x;m++){let g=d[m],f=a[g.materialIndex];for(let y=Math.max(g.start,p.start),v=Math.min(l.count,Math.min(g.start+g.count,p.start+p.count));y<v;y+=3)r=xa(this,f,e,i,c,h,u,y,y+1,y+2),r&&(r.faceIndex=Math.floor(y/3),r.face.materialIndex=g.materialIndex,t.push(r))}else for(let m=Math.max(0,p.start),x=Math.min(l.count,p.start+p.count);m<x;m+=3)r=xa(this,a,e,i,c,h,u,m,m+1,m+2),r&&(r.faceIndex=Math.floor(m/3),t.push(r))}};function xa(n,e,t,i,r,s,a,o,l,c){n.getVertexPosition(o,fa),n.getVertexPosition(l,ma),n.getVertexPosition(c,ga);let h=function(u,d,p,m,x,g,f,y){let v;if(v=d.side===Mt?m.intersectTriangle(f,g,x,!0,y):m.intersectTriangle(x,g,f,d.side===zi,y),v===null)return null;ya.copy(y),ya.applyMatrix4(u.matrixWorld);let _=p.ray.origin.distanceTo(ya);return _<p.near||_>p.far?null:{distance:_,point:ya.clone(),object:u}}(n,e,t,i,fa,ma,ga,Du);if(h){let u=new M;en.getBarycoord(Du,fa,ma,ga,u),r&&(h.uv=en.getInterpolatedAttribute(r,o,l,c,u,new re)),s&&(h.uv1=en.getInterpolatedAttribute(s,o,l,c,u,new re)),a&&(h.normal=en.getInterpolatedAttribute(a,o,l,c,u,new M),h.normal.dot(i.direction)>0&&h.normal.multiplyScalar(-1));let d={a:o,b:l,c,normal:new M,materialIndex:0};en.getNormal(fa,ma,ga,d.normal),h.face=d,h.barycoord=u}return h}var Ut=class n extends Je{constructor(e=1,t=1,i=1,r=1,s=1,a=1){super(),this.type="BoxGeometry",this.parameters={width:e,height:t,depth:i,widthSegments:r,heightSegments:s,depthSegments:a};let o=this;r=Math.floor(r),s=Math.floor(s),a=Math.floor(a);let l=[],c=[],h=[],u=[],d=0,p=0;function m(x,g,f,y,v,_,E,T,A,B,U){let W=_/A,V=E/B,F=_/2,X=E/2,H=T/2,Y=A+1,k=B+1,ie=0,J=0,se=new M;for(let le=0;le<k;le++){let $=le*V-X;for(let ae=0;ae<Y;ae++){let fe=ae*W-F;se[x]=fe*y,se[g]=$*v,se[f]=H,c.push(se.x,se.y,se.z),se[x]=0,se[g]=0,se[f]=T>0?1:-1,h.push(se.x,se.y,se.z),u.push(ae/A),u.push(1-le/B),ie+=1}}for(let le=0;le<B;le++)for(let $=0;$<A;$++){let ae=d+$+Y*le,fe=d+$+Y*(le+1),de=d+($+1)+Y*(le+1),R=d+($+1)+Y*le;l.push(ae,fe,R),l.push(fe,de,R),J+=6}o.addGroup(p,J,U),p+=J,d+=ie}m("z","y","x",-1,-1,i,t,e,a,s,0),m("z","y","x",1,-1,i,t,-e,a,s,1),m("x","z","y",1,1,e,i,t,r,a,2),m("x","z","y",1,-1,e,i,-t,r,a,3),m("x","y","z",1,-1,e,t,i,r,s,4),m("x","y","z",-1,-1,e,t,-i,r,s,5),this.setIndex(l),this.setAttribute("position",new Ae(c,3)),this.setAttribute("normal",new Ae(h,3)),this.setAttribute("uv",new Ae(u,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}};function Cr(n){let e={};for(let t in n){e[t]={};for(let i in n[t]){let r=n[t][i];r&&(r.isColor||r.isMatrix3||r.isMatrix4||r.isVector2||r.isVector3||r.isVector4||r.isTexture||r.isQuaternion)?r.isRenderTargetTexture?(console.warn("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),e[t][i]=null):e[t][i]=r.clone():Array.isArray(r)?e[t][i]=r.slice():e[t][i]=r}}return e}function Yt(n){let e={};for(let t=0;t<n.length;t++){let i=Cr(n[t]);for(let r in i)e[r]=i[r]}return e}function Vd(n){let e=n.getRenderTarget();return e===null?n.outputColorSpace:e.isXRRenderTarget===!0?e.texture.colorSpace:Ye.workingColorSpace}var Mn={clone:Cr,merge:Yt},mt=class extends Hi{constructor(e){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,this.fragmentShader=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=Cr(e.uniforms),this.uniformsGroups=function(t){let i=[];for(let r=0;r<t.length;r++)i.push(t[r].clone());return i}(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this}toJSON(e){let t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(let r in this.uniforms){let s=this.uniforms[r].value;s&&s.isTexture?t.uniforms[r]={type:"t",value:s.toJSON(e).uuid}:s&&s.isColor?t.uniforms[r]={type:"c",value:s.getHex()}:s&&s.isVector2?t.uniforms[r]={type:"v2",value:s.toArray()}:s&&s.isVector3?t.uniforms[r]={type:"v3",value:s.toArray()}:s&&s.isVector4?t.uniforms[r]={type:"v4",value:s.toArray()}:s&&s.isMatrix3?t.uniforms[r]={type:"m3",value:s.toArray()}:s&&s.isMatrix4?t.uniforms[r]={type:"m4",value:s.toArray()}:t.uniforms[r]={value:s}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;let i={};for(let r in this.extensions)this.extensions[r]===!0&&(i[r]=!0);return Object.keys(i).length>0&&(t.extensions=i),t}},_s=class extends xt{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new Ie,this.projectionMatrix=new Ie,this.projectionMatrixInverse=new Ie,this.coordinateSystem=Ar}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorldInverse.copy(this.matrixWorld).invert()}updateWorldMatrix(e,t){super.updateWorldMatrix(e,t),this.matrixWorldInverse.copy(this.matrixWorld).invert()}clone(){return new this.constructor().copy(this)}},dn=new M,Nu=new re,Ou=new re,It=class extends _s{constructor(e=50,t=1,i=.1,r=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=i,this.far=r,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){let t=.5*this.getFilmHeight()/e;this.fov=2*Tc*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){let e=Math.tan(.5*Wa*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return 2*Tc*Math.atan(Math.tan(.5*Wa*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,t,i){dn.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),t.set(dn.x,dn.y).multiplyScalar(-e/dn.z),dn.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),i.set(dn.x,dn.y).multiplyScalar(-e/dn.z)}getViewSize(e,t){return this.getViewBounds(e,Nu,Ou),t.subVectors(Ou,Nu)}setViewOffset(e,t,i,r,s,a){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=i,this.view.offsetY=r,this.view.width=s,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=this.near,t=e*Math.tan(.5*Wa*this.fov)/this.zoom,i=2*t,r=this.aspect*i,s=-.5*r,a=this.view;if(this.view!==null&&this.view.enabled){let l=a.fullWidth,c=a.fullHeight;s+=a.offsetX*r/l,t-=a.offsetY*i/c,r*=a.width/l,i*=a.height/c}let o=this.filmOffset;o!==0&&(s+=e*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(s,s+r,t,t-i,e,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}},dr=-90,Pc=class extends xt{constructor(e,t,i){super(),this.type="CubeCamera",this.renderTarget=i,this.coordinateSystem=null,this.activeMipmapLevel=0;let r=new It(dr,1,e,t);r.layers=this.layers,this.add(r);let s=new It(dr,1,e,t);s.layers=this.layers,this.add(s);let a=new It(dr,1,e,t);a.layers=this.layers,this.add(a);let o=new It(dr,1,e,t);o.layers=this.layers,this.add(o);let l=new It(dr,1,e,t);l.layers=this.layers,this.add(l);let c=new It(dr,1,e,t);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){let e=this.coordinateSystem,t=this.children.concat(),[i,r,s,a,o,l]=t;for(let c of t)this.remove(c);if(e===Ar)i.up.set(0,1,0),i.lookAt(1,0,0),r.up.set(0,1,0),r.lookAt(-1,0,0),s.up.set(0,0,-1),s.lookAt(0,1,0),a.up.set(0,0,1),a.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else{if(e!==$a)throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+e);i.up.set(0,-1,0),i.lookAt(-1,0,0),r.up.set(0,-1,0),r.lookAt(1,0,0),s.up.set(0,0,1),s.lookAt(0,1,0),a.up.set(0,0,-1),a.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1)}for(let c of t)this.add(c),c.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();let{renderTarget:i,activeMipmapLevel:r}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());let[s,a,o,l,c,h]=this.children,u=e.getRenderTarget(),d=e.getActiveCubeFace(),p=e.getActiveMipmapLevel(),m=e.xr.enabled;e.xr.enabled=!1;let x=i.texture.generateMipmaps;i.texture.generateMipmaps=!1,e.setRenderTarget(i,0,r),e.render(t,s),e.setRenderTarget(i,1,r),e.render(t,a),e.setRenderTarget(i,2,r),e.render(t,o),e.setRenderTarget(i,3,r),e.render(t,l),e.setRenderTarget(i,4,r),e.render(t,c),i.texture.generateMipmaps=x,e.setRenderTarget(i,5,r),e.render(t,h),e.setRenderTarget(u,d,p),e.xr.enabled=m,i.texture.needsPMREMUpdate=!0}},no=class extends ti{constructor(e,t,i,r,s,a,o,l,c,h){super(e=e!==void 0?e:[],t=t!==void 0?t:br,i,r,s,a,o,l,c,h),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}},Ic=class extends $t{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;let i={width:e,height:e,depth:1},r=[i,i,i,i,i,i];this.texture=new no(r,t.mapping,t.wrapS,t.wrapT,t.magFilter,t.minFilter,t.format,t.type,t.anisotropy,t.colorSpace),this.texture.isRenderTargetTexture=!0,this.texture.generateMipmaps=t.generateMipmaps!==void 0&&t.generateMipmaps,this.texture.minFilter=t.minFilter!==void 0?t.minFilter:mi}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;let i={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},r=new Ut(5,5,5),s=new mt({name:"CubemapFromEquirect",uniforms:Cr(i.uniforms),vertexShader:i.vertexShader,fragmentShader:i.fragmentShader,side:Mt,blending:0});s.uniforms.tEquirect.value=t;let a=new pe(r,s),o=t.minFilter;return t.minFilter===pn&&(t.minFilter=mi),new Pc(1,10,this).update(e,a),t.minFilter=o,a.geometry.dispose(),a.material.dispose(),this}clear(e,t,i,r){let s=e.getRenderTarget();for(let a=0;a<6;a++)e.setRenderTarget(this,a),e.clear(t,i,r);e.setRenderTarget(s)}},Pl=new M,of=new M,lf=new Oe,Qi=class{constructor(e=new M(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,i,r){return this.normal.set(e,t,i),this.constant=r,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,i){let r=Pl.subVectors(i,t).cross(of.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(r,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){let e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t){let i=e.delta(Pl),r=this.normal.dot(i);if(r===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;let s=-(e.start.dot(this.normal)+this.constant)/r;return s<0||s>1?null:t.copy(e.start).addScaledVector(i,s)}intersectsLine(e){let t=this.distanceToPoint(e.start),i=this.distanceToPoint(e.end);return t<0&&i>0||i<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){let i=t||lf.getNormalMatrix(e),r=this.coplanarPoint(Pl).applyMatrix4(e),s=this.normal.applyMatrix3(i).normalize();return this.constant=-r.dot(s),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}},Dn=new Ci,_a=new M,Pr=class{constructor(e=new Qi,t=new Qi,i=new Qi,r=new Qi,s=new Qi,a=new Qi){this.planes=[e,t,i,r,s,a]}set(e,t,i,r,s,a){let o=this.planes;return o[0].copy(e),o[1].copy(t),o[2].copy(i),o[3].copy(r),o[4].copy(s),o[5].copy(a),this}copy(e){let t=this.planes;for(let i=0;i<6;i++)t[i].copy(e.planes[i]);return this}setFromProjectionMatrix(e,t=2e3){let i=this.planes,r=e.elements,s=r[0],a=r[1],o=r[2],l=r[3],c=r[4],h=r[5],u=r[6],d=r[7],p=r[8],m=r[9],x=r[10],g=r[11],f=r[12],y=r[13],v=r[14],_=r[15];if(i[0].setComponents(l-s,d-c,g-p,_-f).normalize(),i[1].setComponents(l+s,d+c,g+p,_+f).normalize(),i[2].setComponents(l+a,d+h,g+m,_+y).normalize(),i[3].setComponents(l-a,d-h,g-m,_-y).normalize(),i[4].setComponents(l-o,d-u,g-x,_-v).normalize(),t===Ar)i[5].setComponents(l+o,d+u,g+x,_+v).normalize();else{if(t!==$a)throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+t);i[5].setComponents(o,u,x,v).normalize()}return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),Dn.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{let t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),Dn.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(Dn)}intersectsSprite(e){return Dn.center.set(0,0,0),Dn.radius=.7071067811865476,Dn.applyMatrix4(e.matrixWorld),this.intersectsSphere(Dn)}intersectsSphere(e){let t=this.planes,i=e.center,r=-e.radius;for(let s=0;s<6;s++)if(t[s].distanceToPoint(i)<r)return!1;return!0}intersectsBox(e){let t=this.planes;for(let i=0;i<6;i++){let r=t[i];if(_a.x=r.normal.x>0?e.max.x:e.min.x,_a.y=r.normal.y>0?e.max.y:e.min.y,_a.z=r.normal.z>0?e.max.z:e.min.z,r.distanceToPoint(_a)<0)return!1}return!0}containsPoint(e){let t=this.planes;for(let i=0;i<6;i++)if(t[i].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}};function Gd(){let n=null,e=!1,t=null,i=null;function r(s,a){t(s,a),i=n.requestAnimationFrame(r)}return{start:function(){e!==!0&&t!==null&&(i=n.requestAnimationFrame(r),e=!0)},stop:function(){n.cancelAnimationFrame(i),e=!1},setAnimationLoop:function(s){t=s},setContext:function(s){n=s}}}function cf(n){let e=new WeakMap;return{get:function(t){return t.isInterleavedBufferAttribute&&(t=t.data),e.get(t)},remove:function(t){t.isInterleavedBufferAttribute&&(t=t.data);let i=e.get(t);i&&(n.deleteBuffer(i.buffer),e.delete(t))},update:function(t,i){if(t.isInterleavedBufferAttribute&&(t=t.data),t.isGLBufferAttribute){let s=e.get(t);return void((!s||s.version<t.version)&&e.set(t,{buffer:t.buffer,type:t.type,bytesPerElement:t.elementSize,version:t.version}))}let r=e.get(t);if(r===void 0)e.set(t,function(s,a){let o=s.array,l=s.usage,c=o.byteLength,h=n.createBuffer(),u;if(n.bindBuffer(a,h),n.bufferData(a,o,l),s.onUploadCallback(),o instanceof Float32Array)u=n.FLOAT;else if(o instanceof Uint16Array)u=s.isFloat16BufferAttribute?n.HALF_FLOAT:n.UNSIGNED_SHORT;else if(o instanceof Int16Array)u=n.SHORT;else if(o instanceof Uint32Array)u=n.UNSIGNED_INT;else if(o instanceof Int32Array)u=n.INT;else if(o instanceof Int8Array)u=n.BYTE;else if(o instanceof Uint8Array)u=n.UNSIGNED_BYTE;else{if(!(o instanceof Uint8ClampedArray))throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+o);u=n.UNSIGNED_BYTE}return{buffer:h,type:u,bytesPerElement:o.BYTES_PER_ELEMENT,version:s.version,size:c}}(t,i));else if(r.version<t.version){if(r.size!==t.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");(function(s,a,o){let l=a.array,c=a.updateRanges;if(n.bindBuffer(o,s),c.length===0)n.bufferSubData(o,0,l);else{c.sort((u,d)=>u.start-d.start);let h=0;for(let u=1;u<c.length;u++){let d=c[h],p=c[u];p.start<=d.start+d.count+1?d.count=Math.max(d.count,p.start+p.count-d.start):(++h,c[h]=p)}c.length=h+1;for(let u=0,d=c.length;u<d;u++){let p=c[u];n.bufferSubData(o,p.start*l.BYTES_PER_ELEMENT,l,p.start,p.count)}a.clearUpdateRanges()}a.onUploadCallback()})(r.buffer,t,i),r.version=t.version}}}}var Ms=class n extends Je{constructor(e=1,t=1,i=1,r=1){super(),this.type="PlaneGeometry",this.parameters={width:e,height:t,widthSegments:i,heightSegments:r};let s=e/2,a=t/2,o=Math.floor(i),l=Math.floor(r),c=o+1,h=l+1,u=e/o,d=t/l,p=[],m=[],x=[],g=[];for(let f=0;f<h;f++){let y=f*d-a;for(let v=0;v<c;v++){let _=v*u-s;m.push(_,-y,0),x.push(0,0,1),g.push(v/o),g.push(1-f/l)}}for(let f=0;f<l;f++)for(let y=0;y<o;y++){let v=y+c*f,_=y+c*(f+1),E=y+1+c*(f+1),T=y+1+c*f;p.push(v,_,T),p.push(_,E,T)}this.setIndex(p),this.setAttribute("position",new Ae(m,3)),this.setAttribute("normal",new Ae(x,3)),this.setAttribute("uv",new Ae(g,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.width,e.height,e.widthSegments,e.heightSegments)}},Ne={alphahash_fragment:`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,alphahash_pars_fragment:`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,alphamap_fragment:`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,alphamap_pars_fragment:`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,alphatest_fragment:`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,alphatest_pars_fragment:`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,aomap_fragment:`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,aomap_pars_fragment:`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,batching_pars_vertex:`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec3 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 ).rgb;
	}
#endif`,batching_vertex:`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,begin_vertex:`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,beginnormal_vertex:`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,bsdfs:`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,iridescence_fragment:`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,bumpmap_pars_fragment:`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,clipping_planes_fragment:`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,clipping_planes_pars_fragment:`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,clipping_planes_pars_vertex:`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,clipping_planes_vertex:`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,color_fragment:`#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`,color_pars_fragment:`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`,color_pars_vertex:`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec3 vColor;
#endif`,color_vertex:`#if defined( USE_COLOR_ALPHA )
	vColor = vec4( 1.0 );
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec3( 1.0 );
#endif
#ifdef USE_COLOR
	vColor *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.xyz *= instanceColor.xyz;
#endif
#ifdef USE_BATCHING_COLOR
	vec3 batchingColor = getBatchingColor( getIndirectIndex( gl_DrawID ) );
	vColor.xyz *= batchingColor.xyz;
#endif`,common:`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
}
mat3 transposeMat3( const in mat3 m ) {
	mat3 tmp;
	tmp[ 0 ] = vec3( m[ 0 ].x, m[ 1 ].x, m[ 2 ].x );
	tmp[ 1 ] = vec3( m[ 0 ].y, m[ 1 ].y, m[ 2 ].y );
	tmp[ 2 ] = vec3( m[ 0 ].z, m[ 1 ].z, m[ 2 ].z );
	return tmp;
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,cube_uv_reflection_fragment:`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,defaultnormal_vertex:`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
	#ifdef FLIP_SIDED
		transformedTangent = - transformedTangent;
	#endif
#endif`,displacementmap_pars_vertex:`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,displacementmap_vertex:`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,emissivemap_fragment:`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,emissivemap_pars_fragment:`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,colorspace_fragment:"gl_FragColor = linearToOutputTexel( gl_FragColor );",colorspace_pars_fragment:`
const mat3 LINEAR_SRGB_TO_LINEAR_DISPLAY_P3 = mat3(
	vec3( 0.8224621, 0.177538, 0.0 ),
	vec3( 0.0331941, 0.9668058, 0.0 ),
	vec3( 0.0170827, 0.0723974, 0.9105199 )
);
const mat3 LINEAR_DISPLAY_P3_TO_LINEAR_SRGB = mat3(
	vec3( 1.2249401, - 0.2249404, 0.0 ),
	vec3( - 0.0420569, 1.0420571, 0.0 ),
	vec3( - 0.0196376, - 0.0786361, 1.0982735 )
);
vec4 LinearSRGBToLinearDisplayP3( in vec4 value ) {
	return vec4( value.rgb * LINEAR_SRGB_TO_LINEAR_DISPLAY_P3, value.a );
}
vec4 LinearDisplayP3ToLinearSRGB( in vec4 value ) {
	return vec4( value.rgb * LINEAR_DISPLAY_P3_TO_LINEAR_SRGB, value.a );
}
vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,envmap_fragment:`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );
	#else
		vec4 envColor = vec4( 0.0 );
	#endif
	#ifdef ENVMAP_BLENDING_MULTIPLY
		outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_MIX )
		outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_ADD )
		outgoingLight += envColor.xyz * specularStrength * reflectivity;
	#endif
#endif`,envmap_common_pars_fragment:`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
	
#endif`,envmap_pars_fragment:`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,envmap_pars_vertex:`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,envmap_physical_pars_fragment:`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, roughness * roughness) );
			reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
#endif`,envmap_vertex:`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,fog_vertex:`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,fog_pars_vertex:`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,fog_fragment:`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,fog_pars_fragment:`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,gradientmap_pars_fragment:`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,lightmap_pars_fragment:`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,lights_lambert_fragment:`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,lights_lambert_pars_fragment:`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,lights_pars_begin:`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif`,lights_toon_fragment:`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,lights_toon_pars_fragment:`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,lights_phong_fragment:`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,lights_phong_pars_fragment:`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,lights_physical_fragment:`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb * ( 1.0 - metalnessFactor );
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = mix( min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = mix( vec3( 0.04 ), diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.07, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,lights_physical_pars_fragment:`struct PhysicalMaterial {
	vec3 diffuseColor;
	float roughness;
	vec3 specularColor;
	float specularF90;
	float dispersion;
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		float v = 0.5 / ( gv + gl );
		return saturate(v);
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColor;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transposeMat3( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float a = roughness < 0.25 ? -339.2 * r2 + 161.4 * roughness - 25.9 : -8.48 * r2 + 14.3 * roughness - 9.95;
	float b = roughness < 0.25 ? 44.0 * r2 - 23.7 * roughness + 3.26 : 1.97 * r2 - 3.27 * roughness + 0.72;
	float DG = exp( a * dotNV + b ) + ( roughness < 0.25 ? 0.0 : 0.1 * ( roughness - 0.25 ) );
	return saturate( DG * RECIPROCAL_PI );
}
vec2 DFGApprox( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	const vec4 c0 = vec4( - 1, - 0.0275, - 0.572, 0.022 );
	const vec4 c1 = vec4( 1, 0.0425, 1.04, - 0.04 );
	vec4 r = roughness * c0 + c1;
	float a004 = min( r.x * r.x, exp2( - 9.28 * dotNV ) ) * r.x + r.y;
	vec2 fab = vec2( - 1.04, 1.04 ) * a004 + r.zw;
	return fab;
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColor * t2.x + ( vec3( 1.0 ) - material.specularColor ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseColor * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
	#endif
	reflectedLight.directSpecular += irradiance * BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
	#endif
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.iridescence, material.iridescenceFresnel, material.roughness, singleScattering, multiScattering );
	#else
		computeMultiscattering( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.roughness, singleScattering, multiScattering );
	#endif
	vec3 totalScattering = singleScattering + multiScattering;
	vec3 diffuse = material.diffuseColor * ( 1.0 - max( max( totalScattering.r, totalScattering.g ), totalScattering.b ) );
	reflectedLight.indirectSpecular += radiance * singleScattering;
	reflectedLight.indirectSpecular += multiScattering * cosineWeightedIrradiance;
	reflectedLight.indirectDiffuse += diffuse * cosineWeightedIrradiance;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,lights_fragment_begin:`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		material.iridescenceFresnel = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		material.iridescenceF0 = Schlick_to_F0( material.iridescenceFresnel, 1.0, dotNVi );
	}
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,lights_fragment_maps:`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD ) && defined( ENVMAP_TYPE_CUBE_UV )
		iblIrradiance += getIBLIrradiance( geometryNormal );
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		radiance += getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		radiance += getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,lights_fragment_end:`#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,logdepthbuf_fragment:`#if defined( USE_LOGDEPTHBUF )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,logdepthbuf_pars_fragment:`#if defined( USE_LOGDEPTHBUF )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,logdepthbuf_pars_vertex:`#ifdef USE_LOGDEPTHBUF
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,logdepthbuf_vertex:`#ifdef USE_LOGDEPTHBUF
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,map_fragment:`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = vec4( mix( pow( sampledDiffuseColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), sampledDiffuseColor.rgb * 0.0773993808, vec3( lessThanEqual( sampledDiffuseColor.rgb, vec3( 0.04045 ) ) ) ), sampledDiffuseColor.w );
	
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,map_pars_fragment:`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,map_particle_fragment:`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,map_particle_pars_fragment:`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,metalnessmap_fragment:`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,metalnessmap_pars_fragment:`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,morphinstance_vertex:`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,morphcolor_vertex:`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,morphnormal_vertex:`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,morphtarget_pars_vertex:`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,morphtarget_vertex:`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,normal_fragment_begin:`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,normal_fragment_maps:`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,normal_pars_fragment:`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,normal_pars_vertex:`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,normal_vertex:`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,normalmap_pars_fragment:`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,clearcoat_normal_fragment_begin:`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,clearcoat_normal_fragment_maps:`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,clearcoat_pars_fragment:`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,iridescence_pars_fragment:`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,opaque_fragment:`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,packing:`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return depth * ( near - far ) - near;
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return ( near * far ) / ( ( far - near ) * depth - far );
}`,premultiplied_alpha_fragment:`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,project_vertex:`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,dithering_fragment:`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,dithering_pars_fragment:`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,roughnessmap_fragment:`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,roughnessmap_pars_fragment:`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,shadowmap_pars_fragment:`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform sampler2D pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	float texture2DCompare( sampler2D depths, vec2 uv, float compare ) {
		return step( compare, unpackRGBAToDepth( texture2D( depths, uv ) ) );
	}
	vec2 texture2DDistribution( sampler2D shadow, vec2 uv ) {
		return unpackRGBATo2Half( texture2D( shadow, uv ) );
	}
	float VSMShadow (sampler2D shadow, vec2 uv, float compare ){
		float occlusion = 1.0;
		vec2 distribution = texture2DDistribution( shadow, uv );
		float hard_shadow = step( compare , distribution.x );
		if (hard_shadow != 1.0 ) {
			float distance = compare - distribution.x ;
			float variance = max( 0.00000, distribution.y * distribution.y );
			float softness_probability = variance / (variance + distance * distance );			softness_probability = clamp( ( softness_probability - 0.3 ) / ( 0.95 - 0.3 ), 0.0, 1.0 );			occlusion = clamp( max( hard_shadow, softness_probability ), 0.0, 1.0 );
		}
		return occlusion;
	}
	float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
		float shadow = 1.0;
		shadowCoord.xyz /= shadowCoord.w;
		shadowCoord.z += shadowBias;
		bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
		bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
		if ( frustumTest ) {
		#if defined( SHADOWMAP_TYPE_PCF )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx0 = - texelSize.x * shadowRadius;
			float dy0 = - texelSize.y * shadowRadius;
			float dx1 = + texelSize.x * shadowRadius;
			float dy1 = + texelSize.y * shadowRadius;
			float dx2 = dx0 / 2.0;
			float dy2 = dy0 / 2.0;
			float dx3 = dx1 / 2.0;
			float dy3 = dy1 / 2.0;
			shadow = (
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy1 ), shadowCoord.z )
			) * ( 1.0 / 17.0 );
		#elif defined( SHADOWMAP_TYPE_PCF_SOFT )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx = texelSize.x;
			float dy = texelSize.y;
			vec2 uv = shadowCoord.xy;
			vec2 f = fract( uv * shadowMapSize + 0.5 );
			uv -= f * texelSize;
			shadow = (
				texture2DCompare( shadowMap, uv, shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( dx, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( 0.0, dy ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + texelSize, shadowCoord.z ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, 0.0 ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 0.0 ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, dy ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( 0.0, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 0.0, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( texture2DCompare( shadowMap, uv + vec2( dx, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( dx, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( mix( texture2DCompare( shadowMap, uv + vec2( -dx, -dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, -dy ), shadowCoord.z ),
						  f.x ),
					 mix( texture2DCompare( shadowMap, uv + vec2( -dx, 2.0 * dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 2.0 * dy ), shadowCoord.z ),
						  f.x ),
					 f.y )
			) * ( 1.0 / 9.0 );
		#elif defined( SHADOWMAP_TYPE_VSM )
			shadow = VSMShadow( shadowMap, shadowCoord.xy, shadowCoord.z );
		#else
			shadow = texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z );
		#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	vec2 cubeToUV( vec3 v, float texelSizeY ) {
		vec3 absV = abs( v );
		float scaleToCube = 1.0 / max( absV.x, max( absV.y, absV.z ) );
		absV *= scaleToCube;
		v *= scaleToCube * ( 1.0 - 2.0 * texelSizeY );
		vec2 planar = v.xy;
		float almostATexel = 1.5 * texelSizeY;
		float almostOne = 1.0 - almostATexel;
		if ( absV.z >= almostOne ) {
			if ( v.z > 0.0 )
				planar.x = 4.0 - v.x;
		} else if ( absV.x >= almostOne ) {
			float signX = sign( v.x );
			planar.x = v.z * signX + 2.0 * signX;
		} else if ( absV.y >= almostOne ) {
			float signY = sign( v.y );
			planar.x = v.x + 2.0 * signY + 2.0;
			planar.y = v.z * signY - 2.0;
		}
		return vec2( 0.125, 0.25 ) * planar + vec2( 0.375, 0.75 );
	}
	float getPointShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		
		float lightToPositionLength = length( lightToPosition );
		if ( lightToPositionLength - shadowCameraFar <= 0.0 && lightToPositionLength - shadowCameraNear >= 0.0 ) {
			float dp = ( lightToPositionLength - shadowCameraNear ) / ( shadowCameraFar - shadowCameraNear );			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			vec2 texelSize = vec2( 1.0 ) / ( shadowMapSize * vec2( 4.0, 2.0 ) );
			#if defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_PCF_SOFT ) || defined( SHADOWMAP_TYPE_VSM )
				vec2 offset = vec2( - 1, 1 ) * shadowRadius * texelSize.y;
				shadow = (
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxx, texelSize.y ), dp )
				) * ( 1.0 / 9.0 );
			#else
				shadow = texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp );
			#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
#endif`,shadowmap_pars_vertex:`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,shadowmap_vertex:`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	vec3 shadowWorldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,shadowmask_pars_fragment:`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,skinbase_vertex:`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,skinning_pars_vertex:`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,skinning_vertex:`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,skinnormal_vertex:`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,specularmap_fragment:`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,specularmap_pars_fragment:`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,tonemapping_fragment:`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,tonemapping_pars_fragment:`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,transmission_fragment:`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = inverseTransformDirection( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseColor, material.specularColor, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,transmission_pars_fragment:`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
		
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
		
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		
		#else
		
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,uv_pars_fragment:`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,uv_pars_vertex:`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,uv_vertex:`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,worldpos_vertex:`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,background_vert:`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,background_frag:`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,backgroundCube_vert:`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,backgroundCube_frag:`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float flipEnvMap;
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,cube_vert:`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,cube_frag:`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,depth_vert:`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,depth_frag:`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	float fragCoordZ = 0.5 * vHighPrecisionZW[0] / vHighPrecisionZW[1] + 0.5;
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,distanceRGBA_vert:`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,distanceRGBA_frag:`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main () {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = packDepthToRGBA( dist );
}`,equirect_vert:`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,equirect_frag:`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,linedashed_vert:`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,linedashed_frag:`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,meshbasic_vert:`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,meshbasic_frag:`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,meshlambert_vert:`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,meshlambert_frag:`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,meshmatcap_vert:`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,meshmatcap_frag:`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,meshnormal_vert:`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,meshnormal_frag:`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <packing>
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( packNormalToRGB( normal ), diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,meshphong_vert:`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,meshphong_frag:`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,meshphysical_vert:`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,meshphysical_frag:`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
		float sheenEnergyComp = 1.0 - 0.157 * max3( material.sheenColor );
		outgoingLight = outgoingLight * sheenEnergyComp + sheenSpecularDirect + sheenSpecularIndirect;
	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,meshtoon_vert:`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,meshtoon_frag:`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,points_vert:`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,points_frag:`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,shadow_vert:`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,shadow_frag:`uniform vec3 color;
uniform float opacity;
#include <common>
#include <packing>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,sprite_vert:`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,sprite_frag:`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`},ue={common:{diffuse:{value:new be(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Oe},alphaMap:{value:null},alphaMapTransform:{value:new Oe},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Oe}},envmap:{envMap:{value:null},envMapRotation:{value:new Oe},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Oe}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Oe}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Oe},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Oe},normalScale:{value:new re(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Oe},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Oe}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Oe}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Oe}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new be(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotShadowMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new be(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Oe},alphaTest:{value:0},uvTransform:{value:new Oe}},sprite:{diffuse:{value:new be(16777215)},opacity:{value:1},center:{value:new re(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Oe},alphaMap:{value:null},alphaMapTransform:{value:new Oe},alphaTest:{value:0}}},ki={basic:{uniforms:Yt([ue.common,ue.specularmap,ue.envmap,ue.aomap,ue.lightmap,ue.fog]),vertexShader:Ne.meshbasic_vert,fragmentShader:Ne.meshbasic_frag},lambert:{uniforms:Yt([ue.common,ue.specularmap,ue.envmap,ue.aomap,ue.lightmap,ue.emissivemap,ue.bumpmap,ue.normalmap,ue.displacementmap,ue.fog,ue.lights,{emissive:{value:new be(0)}}]),vertexShader:Ne.meshlambert_vert,fragmentShader:Ne.meshlambert_frag},phong:{uniforms:Yt([ue.common,ue.specularmap,ue.envmap,ue.aomap,ue.lightmap,ue.emissivemap,ue.bumpmap,ue.normalmap,ue.displacementmap,ue.fog,ue.lights,{emissive:{value:new be(0)},specular:{value:new be(1118481)},shininess:{value:30}}]),vertexShader:Ne.meshphong_vert,fragmentShader:Ne.meshphong_frag},standard:{uniforms:Yt([ue.common,ue.envmap,ue.aomap,ue.lightmap,ue.emissivemap,ue.bumpmap,ue.normalmap,ue.displacementmap,ue.roughnessmap,ue.metalnessmap,ue.fog,ue.lights,{emissive:{value:new be(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:Ne.meshphysical_vert,fragmentShader:Ne.meshphysical_frag},toon:{uniforms:Yt([ue.common,ue.aomap,ue.lightmap,ue.emissivemap,ue.bumpmap,ue.normalmap,ue.displacementmap,ue.gradientmap,ue.fog,ue.lights,{emissive:{value:new be(0)}}]),vertexShader:Ne.meshtoon_vert,fragmentShader:Ne.meshtoon_frag},matcap:{uniforms:Yt([ue.common,ue.bumpmap,ue.normalmap,ue.displacementmap,ue.fog,{matcap:{value:null}}]),vertexShader:Ne.meshmatcap_vert,fragmentShader:Ne.meshmatcap_frag},points:{uniforms:Yt([ue.points,ue.fog]),vertexShader:Ne.points_vert,fragmentShader:Ne.points_frag},dashed:{uniforms:Yt([ue.common,ue.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:Ne.linedashed_vert,fragmentShader:Ne.linedashed_frag},depth:{uniforms:Yt([ue.common,ue.displacementmap]),vertexShader:Ne.depth_vert,fragmentShader:Ne.depth_frag},normal:{uniforms:Yt([ue.common,ue.bumpmap,ue.normalmap,ue.displacementmap,{opacity:{value:1}}]),vertexShader:Ne.meshnormal_vert,fragmentShader:Ne.meshnormal_frag},sprite:{uniforms:Yt([ue.sprite,ue.fog]),vertexShader:Ne.sprite_vert,fragmentShader:Ne.sprite_frag},background:{uniforms:{uvTransform:{value:new Oe},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:Ne.background_vert,fragmentShader:Ne.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new Oe}},vertexShader:Ne.backgroundCube_vert,fragmentShader:Ne.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:Ne.cube_vert,fragmentShader:Ne.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:Ne.equirect_vert,fragmentShader:Ne.equirect_frag},distanceRGBA:{uniforms:Yt([ue.common,ue.displacementmap,{referencePosition:{value:new M},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:Ne.distanceRGBA_vert,fragmentShader:Ne.distanceRGBA_frag},shadow:{uniforms:Yt([ue.lights,ue.fog,{color:{value:new be(0)},opacity:{value:1}}]),vertexShader:Ne.shadow_vert,fragmentShader:Ne.shadow_frag}};ki.physical={uniforms:Yt([ki.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Oe},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Oe},clearcoatNormalScale:{value:new re(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Oe},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Oe},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Oe},sheen:{value:0},sheenColor:{value:new be(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Oe},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Oe},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Oe},transmissionSamplerSize:{value:new re},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Oe},attenuationDistance:{value:0},attenuationColor:{value:new be(0)},specularColor:{value:new be(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Oe},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Oe},anisotropyVector:{value:new re},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Oe}}]),vertexShader:Ne.meshphysical_vert,fragmentShader:Ne.meshphysical_frag};var Ma={r:0,b:0,g:0},Nn=new li,hf=new Ie;function uf(n,e,t,i,r,s,a){let o=new be(0),l,c,h=s===!0?0:1,u=null,d=0,p=null;function m(g){let f=g.isScene===!0?g.background:null;return f&&f.isTexture&&(f=(g.backgroundBlurriness>0?t:e).get(f)),f}function x(g,f){g.getRGB(Ma,Vd(n)),i.buffers.color.setClear(Ma.r,Ma.g,Ma.b,f,a)}return{getClearColor:function(){return o},setClearColor:function(g,f=1){o.set(g),h=f,x(o,h)},getClearAlpha:function(){return h},setClearAlpha:function(g){h=g,x(o,h)},render:function(g){let f=!1,y=m(g);y===null?x(o,h):y&&y.isColor&&(x(y,1),f=!0);let v=n.xr.getEnvironmentBlendMode();v==="additive"?i.buffers.color.setClear(0,0,0,1,a):v==="alpha-blend"&&i.buffers.color.setClear(0,0,0,0,a),(n.autoClear||f)&&(i.buffers.depth.setTest(!0),i.buffers.depth.setMask(!0),i.buffers.color.setMask(!0),n.clear(n.autoClearColor,n.autoClearDepth,n.autoClearStencil))},addToRenderList:function(g,f){let y=m(f);y&&(y.isCubeTexture||y.mapping===wo)?(c===void 0&&(c=new pe(new Ut(1,1,1),new mt({name:"BackgroundCubeMaterial",uniforms:Cr(ki.backgroundCube.uniforms),vertexShader:ki.backgroundCube.vertexShader,fragmentShader:ki.backgroundCube.fragmentShader,side:Mt,depthTest:!1,depthWrite:!1,fog:!1})),c.geometry.deleteAttribute("normal"),c.geometry.deleteAttribute("uv"),c.onBeforeRender=function(v,_,E){this.matrixWorld.copyPosition(E.matrixWorld)},Object.defineProperty(c.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),r.update(c)),Nn.copy(f.backgroundRotation),Nn.x*=-1,Nn.y*=-1,Nn.z*=-1,y.isCubeTexture&&y.isRenderTargetTexture===!1&&(Nn.y*=-1,Nn.z*=-1),c.material.uniforms.envMap.value=y,c.material.uniforms.flipEnvMap.value=y.isCubeTexture&&y.isRenderTargetTexture===!1?-1:1,c.material.uniforms.backgroundBlurriness.value=f.backgroundBlurriness,c.material.uniforms.backgroundIntensity.value=f.backgroundIntensity,c.material.uniforms.backgroundRotation.value.setFromMatrix4(hf.makeRotationFromEuler(Nn)),c.material.toneMapped=Ye.getTransfer(y.colorSpace)!==tt,u===y&&d===y.version&&p===n.toneMapping||(c.material.needsUpdate=!0,u=y,d=y.version,p=n.toneMapping),c.layers.enableAll(),g.unshift(c,c.geometry,c.material,0,0,null)):y&&y.isTexture&&(l===void 0&&(l=new pe(new Ms(2,2),new mt({name:"BackgroundMaterial",uniforms:Cr(ki.background.uniforms),vertexShader:ki.background.vertexShader,fragmentShader:ki.background.fragmentShader,side:zi,depthTest:!1,depthWrite:!1,fog:!1})),l.geometry.deleteAttribute("normal"),Object.defineProperty(l.material,"map",{get:function(){return this.uniforms.t2D.value}}),r.update(l)),l.material.uniforms.t2D.value=y,l.material.uniforms.backgroundIntensity.value=f.backgroundIntensity,l.material.toneMapped=Ye.getTransfer(y.colorSpace)!==tt,y.matrixAutoUpdate===!0&&y.updateMatrix(),l.material.uniforms.uvTransform.value.copy(y.matrix),u===y&&d===y.version&&p===n.toneMapping||(l.material.needsUpdate=!0,u=y,d=y.version,p=n.toneMapping),l.layers.enableAll(),g.unshift(l,l.geometry,l.material,0,0,null))}}}function df(n,e){let t=n.getParameter(n.MAX_VERTEX_ATTRIBS),i={},r=c(null),s=r,a=!1;function o(f){return n.bindVertexArray(f)}function l(f){return n.deleteVertexArray(f)}function c(f){let y=[],v=[],_=[];for(let E=0;E<t;E++)y[E]=0,v[E]=0,_[E]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:y,enabledAttributes:v,attributeDivisors:_,object:f,attributes:{},index:null}}function h(){let f=s.newAttributes;for(let y=0,v=f.length;y<v;y++)f[y]=0}function u(f){d(f,0)}function d(f,y){let v=s.newAttributes,_=s.enabledAttributes,E=s.attributeDivisors;v[f]=1,_[f]===0&&(n.enableVertexAttribArray(f),_[f]=1),E[f]!==y&&(n.vertexAttribDivisor(f,y),E[f]=y)}function p(){let f=s.newAttributes,y=s.enabledAttributes;for(let v=0,_=y.length;v<_;v++)y[v]!==f[v]&&(n.disableVertexAttribArray(v),y[v]=0)}function m(f,y,v,_,E,T,A){A===!0?n.vertexAttribIPointer(f,y,v,E,T):n.vertexAttribPointer(f,y,v,_,E,T)}function x(){g(),a=!0,s!==r&&(s=r,o(s.object))}function g(){r.geometry=null,r.program=null,r.wireframe=!1}return{setup:function(f,y,v,_,E){let T=!1,A=function(B,U,W){let V=W.wireframe===!0,F=i[B.id];F===void 0&&(F={},i[B.id]=F);let X=F[U.id];X===void 0&&(X={},F[U.id]=X);let H=X[V];return H===void 0&&(H=c(n.createVertexArray()),X[V]=H),H}(_,v,y);s!==A&&(s=A,o(s.object)),T=function(B,U,W,V){let F=s.attributes,X=U.attributes,H=0,Y=W.getAttributes();for(let k in Y)if(Y[k].location>=0){let ie=F[k],J=X[k];if(J===void 0&&(k==="instanceMatrix"&&B.instanceMatrix&&(J=B.instanceMatrix),k==="instanceColor"&&B.instanceColor&&(J=B.instanceColor)),ie===void 0||ie.attribute!==J||J&&ie.data!==J.data)return!0;H++}return s.attributesNum!==H||s.index!==V}(f,_,v,E),T&&function(B,U,W,V){let F={},X=U.attributes,H=0,Y=W.getAttributes();for(let k in Y)if(Y[k].location>=0){let ie=X[k];ie===void 0&&(k==="instanceMatrix"&&B.instanceMatrix&&(ie=B.instanceMatrix),k==="instanceColor"&&B.instanceColor&&(ie=B.instanceColor));let J={};J.attribute=ie,ie&&ie.data&&(J.data=ie.data),F[k]=J,H++}s.attributes=F,s.attributesNum=H,s.index=V}(f,_,v,E),E!==null&&e.update(E,n.ELEMENT_ARRAY_BUFFER),(T||a)&&(a=!1,function(B,U,W,V){h();let F=V.attributes,X=W.getAttributes(),H=U.defaultAttributeValues;for(let Y in X){let k=X[Y];if(k.location>=0){let ie=F[Y];if(ie===void 0&&(Y==="instanceMatrix"&&B.instanceMatrix&&(ie=B.instanceMatrix),Y==="instanceColor"&&B.instanceColor&&(ie=B.instanceColor)),ie!==void 0){let J=ie.normalized,se=ie.itemSize,le=e.get(ie);if(le===void 0)continue;let $=le.buffer,ae=le.type,fe=le.bytesPerElement,de=ae===n.INT||ae===n.UNSIGNED_INT||ie.gpuType===Eh;if(ie.isInterleavedBufferAttribute){let R=ie.data,S=R.stride,N=ie.offset;if(R.isInstancedInterleavedBuffer){for(let j=0;j<k.locationSize;j++)d(k.location+j,R.meshPerAttribute);B.isInstancedMesh!==!0&&V._maxInstanceCount===void 0&&(V._maxInstanceCount=R.meshPerAttribute*R.count)}else for(let j=0;j<k.locationSize;j++)u(k.location+j);n.bindBuffer(n.ARRAY_BUFFER,$);for(let j=0;j<k.locationSize;j++)m(k.location+j,se/k.locationSize,ae,J,S*fe,(N+se/k.locationSize*j)*fe,de)}else{if(ie.isInstancedBufferAttribute){for(let R=0;R<k.locationSize;R++)d(k.location+R,ie.meshPerAttribute);B.isInstancedMesh!==!0&&V._maxInstanceCount===void 0&&(V._maxInstanceCount=ie.meshPerAttribute*ie.count)}else for(let R=0;R<k.locationSize;R++)u(k.location+R);n.bindBuffer(n.ARRAY_BUFFER,$);for(let R=0;R<k.locationSize;R++)m(k.location+R,se/k.locationSize,ae,J,se*fe,se/k.locationSize*R*fe,de)}}else if(H!==void 0){let J=H[Y];if(J!==void 0)switch(J.length){case 2:n.vertexAttrib2fv(k.location,J);break;case 3:n.vertexAttrib3fv(k.location,J);break;case 4:n.vertexAttrib4fv(k.location,J);break;default:n.vertexAttrib1fv(k.location,J)}}}}p()}(f,y,v,_),E!==null&&n.bindBuffer(n.ELEMENT_ARRAY_BUFFER,e.get(E).buffer))},reset:x,resetDefaultState:g,dispose:function(){x();for(let f in i){let y=i[f];for(let v in y){let _=y[v];for(let E in _)l(_[E].object),delete _[E];delete y[v]}delete i[f]}},releaseStatesOfGeometry:function(f){if(i[f.id]===void 0)return;let y=i[f.id];for(let v in y){let _=y[v];for(let E in _)l(_[E].object),delete _[E];delete y[v]}delete i[f.id]},releaseStatesOfProgram:function(f){for(let y in i){let v=i[y];if(v[f.id]===void 0)continue;let _=v[f.id];for(let E in _)l(_[E].object),delete _[E];delete v[f.id]}},initAttributes:h,enableAttribute:u,disableUnusedAttributes:p}}function pf(n,e,t){let i;function r(s,a,o){o!==0&&(n.drawArraysInstanced(i,s,a,o),t.update(a,i,o))}this.setMode=function(s){i=s},this.render=function(s,a){n.drawArrays(i,s,a),t.update(a,i,1)},this.renderInstances=r,this.renderMultiDraw=function(s,a,o){if(o===0)return;e.get("WEBGL_multi_draw").multiDrawArraysWEBGL(i,s,0,a,0,o);let l=0;for(let c=0;c<o;c++)l+=a[c];t.update(l,i,1)},this.renderMultiDrawInstances=function(s,a,o,l){if(o===0)return;let c=e.get("WEBGL_multi_draw");if(c===null)for(let h=0;h<s.length;h++)r(s[h],a[h],l[h]);else{c.multiDrawArraysInstancedWEBGL(i,s,0,a,0,l,0,o);let h=0;for(let u=0;u<o;u++)h+=a[u];for(let u=0;u<l.length;u++)t.update(h,i,l[u])}}}function ff(n,e,t,i){let r;function s(d){if(d==="highp"){if(n.getShaderPrecisionFormat(n.VERTEX_SHADER,n.HIGH_FLOAT).precision>0&&n.getShaderPrecisionFormat(n.FRAGMENT_SHADER,n.HIGH_FLOAT).precision>0)return"highp";d="mediump"}return d==="mediump"&&n.getShaderPrecisionFormat(n.VERTEX_SHADER,n.MEDIUM_FLOAT).precision>0&&n.getShaderPrecisionFormat(n.FRAGMENT_SHADER,n.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let a=t.precision!==void 0?t.precision:"highp",o=s(a);o!==a&&(console.warn("THREE.WebGLRenderer:",a,"not supported, using",o,"instead."),a=o);let l=t.logarithmicDepthBuffer===!0,c=t.reverseDepthBuffer===!0&&e.has("EXT_clip_control");if(c===!0){let d=e.get("EXT_clip_control");d.clipControlEXT(d.LOWER_LEFT_EXT,d.ZERO_TO_ONE_EXT)}let h=n.getParameter(n.MAX_TEXTURE_IMAGE_UNITS),u=n.getParameter(n.MAX_VERTEX_TEXTURE_IMAGE_UNITS);return{isWebGL2:!0,getMaxAnisotropy:function(){if(r!==void 0)return r;if(e.has("EXT_texture_filter_anisotropic")===!0){let d=e.get("EXT_texture_filter_anisotropic");r=n.getParameter(d.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else r=0;return r},getMaxPrecision:s,textureFormatReadable:function(d){return d===oi||i.convert(d)===n.getParameter(n.IMPLEMENTATION_COLOR_READ_FORMAT)},textureTypeReadable:function(d){let p=d===Ii&&(e.has("EXT_color_buffer_half_float")||e.has("EXT_color_buffer_float"));return!(d!==nn&&i.convert(d)!==n.getParameter(n.IMPLEMENTATION_COLOR_READ_TYPE)&&d!==Bi&&!p)},precision:a,logarithmicDepthBuffer:l,reverseDepthBuffer:c,maxTextures:h,maxVertexTextures:u,maxTextureSize:n.getParameter(n.MAX_TEXTURE_SIZE),maxCubemapSize:n.getParameter(n.MAX_CUBE_MAP_TEXTURE_SIZE),maxAttributes:n.getParameter(n.MAX_VERTEX_ATTRIBS),maxVertexUniforms:n.getParameter(n.MAX_VERTEX_UNIFORM_VECTORS),maxVaryings:n.getParameter(n.MAX_VARYING_VECTORS),maxFragmentUniforms:n.getParameter(n.MAX_FRAGMENT_UNIFORM_VECTORS),vertexTextures:u>0,maxSamples:n.getParameter(n.MAX_SAMPLES)}}function mf(n){let e=this,t=null,i=0,r=!1,s=!1,a=new Qi,o=new Oe,l={value:null,needsUpdate:!1};function c(h,u,d,p){let m=h!==null?h.length:0,x=null;if(m!==0){if(x=l.value,p!==!0||x===null){let g=d+4*m,f=u.matrixWorldInverse;o.getNormalMatrix(f),(x===null||x.length<g)&&(x=new Float32Array(g));for(let y=0,v=d;y!==m;++y,v+=4)a.copy(h[y]).applyMatrix4(f,o),a.normal.toArray(x,v),x[v+3]=a.constant}l.value=x,l.needsUpdate=!0}return e.numPlanes=m,e.numIntersection=0,x}this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(h,u){let d=h.length!==0||u||i!==0||r;return r=u,i=h.length,d},this.beginShadows=function(){s=!0,c(null)},this.endShadows=function(){s=!1},this.setGlobalState=function(h,u){t=c(h,u,0)},this.setState=function(h,u,d){let p=h.clippingPlanes,m=h.clipIntersection,x=h.clipShadows,g=n.get(h);if(!r||p===null||p.length===0||s&&!x)s?c(null):function(){l.value!==t&&(l.value=t,l.needsUpdate=i>0),e.numPlanes=i,e.numIntersection=0}();else{let f=s?0:i,y=4*f,v=g.clippingState||null;l.value=v,v=c(p,u,y,d);for(let _=0;_!==y;++_)v[_]=t[_];g.clippingState=v,this.numIntersection=m?this.numPlanes:0,this.numPlanes+=f}}}function gf(n){let e=new WeakMap;function t(r,s){return s===Zl?r.mapping=br:s===$l&&(r.mapping=wr),r}function i(r){let s=r.target;s.removeEventListener("dispose",i);let a=e.get(s);a!==void 0&&(e.delete(s),a.dispose())}return{get:function(r){if(r&&r.isTexture){let s=r.mapping;if(s===Zl||s===$l){if(e.has(r))return t(e.get(r).texture,r.mapping);{let a=r.image;if(a&&a.height>0){let o=new Ic(a.height);return o.fromEquirectangularTexture(n,r),e.set(r,o),r.addEventListener("dispose",i),t(o.texture,r.mapping)}return null}}}return r},dispose:function(){e=new WeakMap}}}var Ir=class extends _s{constructor(e=-1,t=1,i=1,r=-1,s=.1,a=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=i,this.bottom=r,this.near=s,this.far=a,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,i,r,s,a){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=i,this.view.offsetY=r,this.view.width=s,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),i=(this.right+this.left)/2,r=(this.top+this.bottom)/2,s=i-e,a=i+e,o=r+t,l=r-t;if(this.view!==null&&this.view.enabled){let c=(this.right-this.left)/this.view.fullWidth/this.zoom,h=(this.top-this.bottom)/this.view.fullHeight/this.zoom;s+=c*this.view.offsetX,a=s+c*this.view.width,o-=h*this.view.offsetY,l=o-h*this.view.height}this.projectionMatrix.makeOrthographic(s,a,o,l,this.near,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}},ku=[.125,.215,.35,.446,.526,.582],ss=20,Il=new Ir,Fu=new be,Ll=null,Ul=0,Dl=0,Nl=!1,kn=(1+Math.sqrt(5))/2,pr=1/kn,Bu=[new M(-kn,pr,0),new M(kn,pr,0),new M(-pr,0,kn),new M(pr,0,kn),new M(0,kn,-pr),new M(0,kn,pr),new M(-1,1,-1),new M(1,1,-1),new M(-1,1,1),new M(1,1,1)],Lr=class{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._lodPlanes=[],this._sizeLods=[],this._sigmas=[],this._blurMaterial=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._compileMaterial(this._blurMaterial)}fromScene(e,t=0,i=.1,r=100){Ll=this._renderer.getRenderTarget(),Ul=this._renderer.getActiveCubeFace(),Dl=this._renderer.getActiveMipmapLevel(),Nl=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(256);let s=this._allocateTargets();return s.depthBuffer=!0,this._sceneToCubeUV(e,i,r,s),t>0&&this._blur(s,0,0,t),this._applyPMREM(s),this._cleanup(s),s}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=Vu(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=Hu(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose()}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodPlanes.length;e++)this._lodPlanes[e].dispose()}_cleanup(e){this._renderer.setRenderTarget(Ll,Ul,Dl),this._renderer.xr.enabled=Nl,e.scissorTest=!1,Sa(e,0,0,e.width,e.height)}_fromTexture(e,t){e.mapping===br||e.mapping===wr?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),Ll=this._renderer.getRenderTarget(),Ul=this._renderer.getActiveCubeFace(),Dl=this._renderer.getActiveMipmapLevel(),Nl=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;let i=t||this._allocateTargets();return this._textureToCubeUV(e,i),this._applyPMREM(i),this._cleanup(i),i}_allocateTargets(){let e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,i={magFilter:mi,minFilter:mi,generateMipmaps:!1,type:Ii,format:oi,colorSpace:_n,depthBuffer:!1},r=zu(e,t,i);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=zu(e,t,i);let{_lodMax:s}=this;({sizeLods:this._sizeLods,lodPlanes:this._lodPlanes,sigmas:this._sigmas}=function(a){let o=[],l=[],c=[],h=a,u=a-4+1+ku.length;for(let d=0;d<u;d++){let p=Math.pow(2,h);l.push(p);let m=1/p;d>a-4?m=ku[d-a+4-1]:d===0&&(m=0),c.push(m);let x=1/(p-2),g=-x,f=1+x,y=[g,g,f,g,f,f,g,g,f,f,g,f],v=6,_=6,E=3,T=2,A=1,B=new Float32Array(E*_*v),U=new Float32Array(T*_*v),W=new Float32Array(A*_*v);for(let F=0;F<v;F++){let X=F%3*2/3-1,H=F>2?0:-1,Y=[X,H,0,X+2/3,H,0,X+2/3,H+1,0,X,H,0,X+2/3,H+1,0,X,H+1,0];B.set(Y,E*_*F),U.set(y,T*_*F);let k=[F,F,F,F,F,F];W.set(k,A*_*F)}let V=new Je;V.setAttribute("position",new St(B,E)),V.setAttribute("uv",new St(U,T)),V.setAttribute("faceIndex",new St(W,A)),o.push(V),h>4&&h--}return{lodPlanes:o,sizeLods:l,sigmas:c}}(s)),this._blurMaterial=function(a,o,l){let c=new Float32Array(ss),h=new M(0,1,0);return new mt({name:"SphericalGaussianBlur",defines:{n:ss,CUBEUV_TEXEL_WIDTH:1/o,CUBEUV_TEXEL_HEIGHT:1/l,CUBEUV_MAX_MIP:`${a}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:c},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:h}},vertexShader:Uh(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform int samples;
			uniform float weights[ n ];
			uniform bool latitudinal;
			uniform float dTheta;
			uniform float mipInt;
			uniform vec3 poleAxis;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			vec3 getSample( float theta, vec3 axis ) {

				float cosTheta = cos( theta );
				// Rodrigues' axis-angle rotation
				vec3 sampleDirection = vOutputDirection * cosTheta
					+ cross( axis, vOutputDirection ) * sin( theta )
					+ axis * dot( axis, vOutputDirection ) * ( 1.0 - cosTheta );

				return bilinearCubeUV( envMap, sampleDirection, mipInt );

			}

			void main() {

				vec3 axis = latitudinal ? poleAxis : cross( poleAxis, vOutputDirection );

				if ( all( equal( axis, vec3( 0.0 ) ) ) ) {

					axis = vec3( vOutputDirection.z, 0.0, - vOutputDirection.x );

				}

				axis = normalize( axis );

				gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
				gl_FragColor.rgb += weights[ 0 ] * getSample( 0.0, axis );

				for ( int i = 1; i < n; i++ ) {

					if ( i >= samples ) {

						break;

					}

					float theta = dTheta * float( i );
					gl_FragColor.rgb += weights[ i ] * getSample( -1.0 * theta, axis );
					gl_FragColor.rgb += weights[ i ] * getSample( theta, axis );

				}

			}
		`,blending:0,depthTest:!1,depthWrite:!1})}(s,e,t)}return r}_compileMaterial(e){let t=new pe(this._lodPlanes[0],e);this._renderer.compile(t,Il)}_sceneToCubeUV(e,t,i,r){let s=new It(90,1,t,i),a=[1,-1,1,1,1,1],o=[1,1,1,-1,-1,-1],l=this._renderer,c=l.autoClear,h=l.toneMapping;l.getClearColor(Fu),l.toneMapping=fn,l.autoClear=!1;let u=new Lt({name:"PMREM.Background",side:Mt,depthWrite:!1,depthTest:!1}),d=new pe(new Ut,u),p=!1,m=e.background;m?m.isColor&&(u.color.copy(m),e.background=null,p=!0):(u.color.copy(Fu),p=!0);for(let x=0;x<6;x++){let g=x%3;g===0?(s.up.set(0,a[x],0),s.lookAt(o[x],0,0)):g===1?(s.up.set(0,0,a[x]),s.lookAt(0,o[x],0)):(s.up.set(0,a[x],0),s.lookAt(0,0,o[x]));let f=this._cubeSize;Sa(r,g*f,x>2?f:0,f,f),l.setRenderTarget(r),p&&l.render(d,s),l.render(e,s)}d.geometry.dispose(),d.material.dispose(),l.toneMapping=h,l.autoClear=c,e.background=m}_textureToCubeUV(e,t){let i=this._renderer,r=e.mapping===br||e.mapping===wr;r?(this._cubemapMaterial===null&&(this._cubemapMaterial=Vu()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=Hu());let s=r?this._cubemapMaterial:this._equirectMaterial,a=new pe(this._lodPlanes[0],s);s.uniforms.envMap.value=e;let o=this._cubeSize;Sa(t,0,0,3*o,2*o),i.setRenderTarget(t),i.render(a,Il)}_applyPMREM(e){let t=this._renderer,i=t.autoClear;t.autoClear=!1;let r=this._lodPlanes.length;for(let s=1;s<r;s++){let a=Math.sqrt(this._sigmas[s]*this._sigmas[s]-this._sigmas[s-1]*this._sigmas[s-1]),o=Bu[(r-s-1)%Bu.length];this._blur(e,s-1,s,a,o)}t.autoClear=i}_blur(e,t,i,r,s){let a=this._pingPongRenderTarget;this._halfBlur(e,a,t,i,r,"latitudinal",s),this._halfBlur(a,e,i,i,r,"longitudinal",s)}_halfBlur(e,t,i,r,s,a,o){let l=this._renderer,c=this._blurMaterial;a!=="latitudinal"&&a!=="longitudinal"&&console.error("blur direction must be either latitudinal or longitudinal!");let h=new pe(this._lodPlanes[r],c),u=c.uniforms,d=this._sizeLods[i]-1,p=isFinite(s)?Math.PI/(2*d):2*Math.PI/39,m=s/p,x=isFinite(s)?1+Math.floor(3*m):ss;x>ss&&console.warn(`sigmaRadians, ${s}, is too large and will clip, as it requested ${x} samples when the maximum is set to 20`);let g=[],f=0;for(let _=0;_<ss;++_){let E=_/m,T=Math.exp(-E*E/2);g.push(T),_===0?f+=T:_<x&&(f+=2*T)}for(let _=0;_<g.length;_++)g[_]=g[_]/f;u.envMap.value=e.texture,u.samples.value=x,u.weights.value=g,u.latitudinal.value=a==="latitudinal",o&&(u.poleAxis.value=o);let{_lodMax:y}=this;u.dTheta.value=p,u.mipInt.value=y-i;let v=this._sizeLods[r];Sa(t,3*v*(r>y-4?r-y+4:0),4*(this._cubeSize-v),3*v,2*v),l.setRenderTarget(t),l.render(h,Il)}};function zu(n,e,t){let i=new $t(n,e,t);return i.texture.mapping=wo,i.texture.name="PMREM.cubeUv",i.scissorTest=!0,i}function Sa(n,e,t,i,r){n.viewport.set(e,t,i,r),n.scissor.set(e,t,i,r)}function Hu(){return new mt({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:Uh(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:0,depthTest:!1,depthWrite:!1})}function Vu(){return new mt({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:Uh(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:0,depthTest:!1,depthWrite:!1})}function Uh(){return`

		precision mediump float;
		precision mediump int;

		attribute float faceIndex;

		varying vec3 vOutputDirection;

		// RH coordinate system; PMREM face-indexing convention
		vec3 getDirection( vec2 uv, float face ) {

			uv = 2.0 * uv - 1.0;

			vec3 direction = vec3( uv, 1.0 );

			if ( face == 0.0 ) {

				direction = direction.zyx; // ( 1, v, u ) pos x

			} else if ( face == 1.0 ) {

				direction = direction.xzy;
				direction.xz *= -1.0; // ( -u, 1, -v ) pos y

			} else if ( face == 2.0 ) {

				direction.x *= -1.0; // ( -u, v, 1 ) pos z

			} else if ( face == 3.0 ) {

				direction = direction.zyx;
				direction.xz *= -1.0; // ( -1, v, -u ) neg x

			} else if ( face == 4.0 ) {

				direction = direction.xzy;
				direction.xy *= -1.0; // ( -u, -1, v ) neg y

			} else if ( face == 5.0 ) {

				direction.z *= -1.0; // ( u, v, -1 ) neg z

			}

			return direction;

		}

		void main() {

			vOutputDirection = getDirection( uv, faceIndex );
			gl_Position = vec4( position, 1.0 );

		}
	`}function vf(n){let e=new WeakMap,t=null;function i(r){let s=r.target;s.removeEventListener("dispose",i);let a=e.get(s);a!==void 0&&(e.delete(s),a.dispose())}return{get:function(r){if(r&&r.isTexture){let s=r.mapping,a=s===Zl||s===$l,o=s===br||s===wr;if(a||o){let l=e.get(r),c=l!==void 0?l.texture.pmremVersion:0;if(r.isRenderTargetTexture&&r.pmremVersion!==c)return t===null&&(t=new Lr(n)),l=a?t.fromEquirectangular(r,l):t.fromCubemap(r,l),l.texture.pmremVersion=r.pmremVersion,e.set(r,l),l.texture;if(l!==void 0)return l.texture;{let h=r.image;return a&&h&&h.height>0||o&&h&&function(u){let d=0,p=6;for(let m=0;m<p;m++)u[m]!==void 0&&d++;return d===p}(h)?(t===null&&(t=new Lr(n)),l=a?t.fromEquirectangular(r):t.fromCubemap(r),l.texture.pmremVersion=r.pmremVersion,e.set(r,l),r.addEventListener("dispose",i),l.texture):null}}}return r},dispose:function(){e=new WeakMap,t!==null&&(t.dispose(),t=null)}}}function yf(n){let e={};function t(i){if(e[i]!==void 0)return e[i];let r;switch(i){case"WEBGL_depth_texture":r=n.getExtension("WEBGL_depth_texture")||n.getExtension("MOZ_WEBGL_depth_texture")||n.getExtension("WEBKIT_WEBGL_depth_texture");break;case"EXT_texture_filter_anisotropic":r=n.getExtension("EXT_texture_filter_anisotropic")||n.getExtension("MOZ_EXT_texture_filter_anisotropic")||n.getExtension("WEBKIT_EXT_texture_filter_anisotropic");break;case"WEBGL_compressed_texture_s3tc":r=n.getExtension("WEBGL_compressed_texture_s3tc")||n.getExtension("MOZ_WEBGL_compressed_texture_s3tc")||n.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");break;case"WEBGL_compressed_texture_pvrtc":r=n.getExtension("WEBGL_compressed_texture_pvrtc")||n.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");break;default:r=n.getExtension(i)}return e[i]=r,r}return{has:function(i){return t(i)!==null},init:function(){t("EXT_color_buffer_float"),t("WEBGL_clip_cull_distance"),t("OES_texture_float_linear"),t("EXT_color_buffer_half_float"),t("WEBGL_multisampled_render_to_texture"),t("WEBGL_render_shared_exponent")},get:function(i){let r=t(i);return r===null&&Xa("THREE.WebGLRenderer: "+i+" extension not supported."),r}}}function xf(n,e,t,i){let r={},s=new WeakMap;function a(l){let c=l.target;c.index!==null&&e.remove(c.index);for(let u in c.attributes)e.remove(c.attributes[u]);for(let u in c.morphAttributes){let d=c.morphAttributes[u];for(let p=0,m=d.length;p<m;p++)e.remove(d[p])}c.removeEventListener("dispose",a),delete r[c.id];let h=s.get(c);h&&(e.remove(h),s.delete(c)),i.releaseStatesOfGeometry(c),c.isInstancedBufferGeometry===!0&&delete c._maxInstanceCount,t.memory.geometries--}function o(l){let c=[],h=l.index,u=l.attributes.position,d=0;if(h!==null){let x=h.array;d=h.version;for(let g=0,f=x.length;g<f;g+=3){let y=x[g+0],v=x[g+1],_=x[g+2];c.push(y,v,v,_,_,y)}}else{if(u===void 0)return;{let x=u.array;d=u.version;for(let g=0,f=x.length/3-1;g<f;g+=3){let y=g+0,v=g+1,_=g+2;c.push(y,v,v,_,_,y)}}}let p=new(zd(c)?io:to)(c,1);p.version=d;let m=s.get(l);m&&e.remove(m),s.set(l,p)}return{get:function(l,c){return r[c.id]===!0||(c.addEventListener("dispose",a),r[c.id]=!0,t.memory.geometries++),c},update:function(l){let c=l.attributes;for(let u in c)e.update(c[u],n.ARRAY_BUFFER);let h=l.morphAttributes;for(let u in h){let d=h[u];for(let p=0,m=d.length;p<m;p++)e.update(d[p],n.ARRAY_BUFFER)}},getWireframeAttribute:function(l){let c=s.get(l);if(c){let h=l.index;h!==null&&c.version<h.version&&o(l)}else o(l);return s.get(l)}}}function _f(n,e,t){let i,r,s;function a(o,l,c){c!==0&&(n.drawElementsInstanced(i,l,r,o*s,c),t.update(l,i,c))}this.setMode=function(o){i=o},this.setIndex=function(o){r=o.type,s=o.bytesPerElement},this.render=function(o,l){n.drawElements(i,l,r,o*s),t.update(l,i,1)},this.renderInstances=a,this.renderMultiDraw=function(o,l,c){if(c===0)return;e.get("WEBGL_multi_draw").multiDrawElementsWEBGL(i,l,0,r,o,0,c);let h=0;for(let u=0;u<c;u++)h+=l[u];t.update(h,i,1)},this.renderMultiDrawInstances=function(o,l,c,h){if(c===0)return;let u=e.get("WEBGL_multi_draw");if(u===null)for(let d=0;d<o.length;d++)a(o[d]/s,l[d],h[d]);else{u.multiDrawElementsInstancedWEBGL(i,l,0,r,o,0,h,0,c);let d=0;for(let p=0;p<c;p++)d+=l[p];for(let p=0;p<h.length;p++)t.update(d,i,h[p])}}}function Mf(n){let e={frame:0,calls:0,triangles:0,points:0,lines:0};return{memory:{geometries:0,textures:0},render:e,programs:null,autoReset:!0,reset:function(){e.calls=0,e.triangles=0,e.points=0,e.lines=0},update:function(t,i,r){switch(e.calls++,i){case n.TRIANGLES:e.triangles+=r*(t/3);break;case n.LINES:e.lines+=r*(t/2);break;case n.LINE_STRIP:e.lines+=r*(t-1);break;case n.LINE_LOOP:e.lines+=r*t;break;case n.POINTS:e.points+=r*t;break;default:console.error("THREE.WebGLInfo: Unknown draw mode:",i)}}}}function Sf(n,e,t){let i=new WeakMap,r=new $e;return{update:function(s,a,o){let l=s.morphTargetInfluences,c=a.morphAttributes.position||a.morphAttributes.normal||a.morphAttributes.color,h=c!==void 0?c.length:0,u=i.get(a);if(u===void 0||u.count!==h){let B=function(){T.dispose(),i.delete(a),a.removeEventListener("dispose",B)};u!==void 0&&u.texture.dispose();let d=a.morphAttributes.position!==void 0,p=a.morphAttributes.normal!==void 0,m=a.morphAttributes.color!==void 0,x=a.morphAttributes.position||[],g=a.morphAttributes.normal||[],f=a.morphAttributes.color||[],y=0;d===!0&&(y=1),p===!0&&(y=2),m===!0&&(y=3);let v=a.attributes.position.count*y,_=1;v>e.maxTextureSize&&(_=Math.ceil(v/e.maxTextureSize),v=e.maxTextureSize);let E=new Float32Array(v*_*4*h),T=new Qa(E,v,_,h);T.type=Bi,T.needsUpdate=!0;let A=4*y;for(let U=0;U<h;U++){let W=x[U],V=g[U],F=f[U],X=v*_*4*U;for(let H=0;H<W.count;H++){let Y=H*A;d===!0&&(r.fromBufferAttribute(W,H),E[X+Y+0]=r.x,E[X+Y+1]=r.y,E[X+Y+2]=r.z,E[X+Y+3]=0),p===!0&&(r.fromBufferAttribute(V,H),E[X+Y+4]=r.x,E[X+Y+5]=r.y,E[X+Y+6]=r.z,E[X+Y+7]=0),m===!0&&(r.fromBufferAttribute(F,H),E[X+Y+8]=r.x,E[X+Y+9]=r.y,E[X+Y+10]=r.z,E[X+Y+11]=F.itemSize===4?r.w:1)}}u={count:h,texture:T,size:new re(v,_)},i.set(a,u),a.addEventListener("dispose",B)}if(s.isInstancedMesh===!0&&s.morphTexture!==null)o.getUniforms().setValue(n,"morphTexture",s.morphTexture,t);else{let d=0;for(let m=0;m<l.length;m++)d+=l[m];let p=a.morphTargetsRelative?1:1-d;o.getUniforms().setValue(n,"morphTargetBaseInfluence",p),o.getUniforms().setValue(n,"morphTargetInfluences",l)}o.getUniforms().setValue(n,"morphTargetsTexture",u.texture,t),o.getUniforms().setValue(n,"morphTargetsTextureSize",u.size)}}}function bf(n,e,t,i){let r=new WeakMap;function s(a){let o=a.target;o.removeEventListener("dispose",s),t.remove(o.instanceMatrix),o.instanceColor!==null&&t.remove(o.instanceColor)}return{update:function(a){let o=i.render.frame,l=a.geometry,c=e.get(a,l);if(r.get(c)!==o&&(e.update(c),r.set(c,o)),a.isInstancedMesh&&(a.hasEventListener("dispose",s)===!1&&a.addEventListener("dispose",s),r.get(a)!==o&&(t.update(a.instanceMatrix,n.ARRAY_BUFFER),a.instanceColor!==null&&t.update(a.instanceColor,n.ARRAY_BUFFER),r.set(a,o))),a.isSkinnedMesh){let h=a.skeleton;r.get(h)!==o&&(h.update(),r.set(h,o))}return c},dispose:function(){r=new WeakMap}}}var ro=class extends ti{constructor(e,t,i,r,s,a,o,l,c,h=1026){if(h!==xs&&h!==Tr)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");i===void 0&&h===xs&&(i=Vn),i===void 0&&h===Tr&&(i=Er),super(null,r,s,a,o,l,h,i,c),this.isDepthTexture=!0,this.image={width:e,height:t},this.magFilter=o!==void 0?o:gi,this.minFilter=l!==void 0?l:gi,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.compareFunction=e.compareFunction,this}toJSON(e){let t=super.toJSON(e);return this.compareFunction!==null&&(t.compareFunction=this.compareFunction),t}},Wd=new ti,Gu=new ro(1,1),Xd=new Qa,jd=new Cc,qd=new no,Wu=[],Xu=[],ju=new Float32Array(16),qu=new Float32Array(9),Yu=new Float32Array(4);function zr(n,e,t){let i=n[0];if(i<=0||i>0)return n;let r=e*t,s=Wu[r];if(s===void 0&&(s=new Float32Array(r),Wu[r]=s),e!==0){i.toArray(s,0);for(let a=1,o=0;a!==e;++a)o+=t,n[a].toArray(s,o)}return s}function bt(n,e){if(n.length!==e.length)return!1;for(let t=0,i=n.length;t<i;t++)if(n[t]!==e[t])return!1;return!0}function wt(n,e){for(let t=0,i=e.length;t<i;t++)n[t]=e[t]}function To(n,e){let t=Xu[e];t===void 0&&(t=new Int32Array(e),Xu[e]=t);for(let i=0;i!==e;++i)t[i]=n.allocateTextureUnit();return t}function wf(n,e){let t=this.cache;t[0]!==e&&(n.uniform1f(this.addr,e),t[0]=e)}function Ef(n,e){let t=this.cache;if(e.x!==void 0)t[0]===e.x&&t[1]===e.y||(n.uniform2f(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(bt(t,e))return;n.uniform2fv(this.addr,e),wt(t,e)}}function Tf(n,e){let t=this.cache;if(e.x!==void 0)t[0]===e.x&&t[1]===e.y&&t[2]===e.z||(n.uniform3f(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else if(e.r!==void 0)t[0]===e.r&&t[1]===e.g&&t[2]===e.b||(n.uniform3f(this.addr,e.r,e.g,e.b),t[0]=e.r,t[1]=e.g,t[2]=e.b);else{if(bt(t,e))return;n.uniform3fv(this.addr,e),wt(t,e)}}function Af(n,e){let t=this.cache;if(e.x!==void 0)t[0]===e.x&&t[1]===e.y&&t[2]===e.z&&t[3]===e.w||(n.uniform4f(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(bt(t,e))return;n.uniform4fv(this.addr,e),wt(t,e)}}function Rf(n,e){let t=this.cache,i=e.elements;if(i===void 0){if(bt(t,e))return;n.uniformMatrix2fv(this.addr,!1,e),wt(t,e)}else{if(bt(t,i))return;Yu.set(i),n.uniformMatrix2fv(this.addr,!1,Yu),wt(t,i)}}function Cf(n,e){let t=this.cache,i=e.elements;if(i===void 0){if(bt(t,e))return;n.uniformMatrix3fv(this.addr,!1,e),wt(t,e)}else{if(bt(t,i))return;qu.set(i),n.uniformMatrix3fv(this.addr,!1,qu),wt(t,i)}}function Pf(n,e){let t=this.cache,i=e.elements;if(i===void 0){if(bt(t,e))return;n.uniformMatrix4fv(this.addr,!1,e),wt(t,e)}else{if(bt(t,i))return;ju.set(i),n.uniformMatrix4fv(this.addr,!1,ju),wt(t,i)}}function If(n,e){let t=this.cache;t[0]!==e&&(n.uniform1i(this.addr,e),t[0]=e)}function Lf(n,e){let t=this.cache;if(e.x!==void 0)t[0]===e.x&&t[1]===e.y||(n.uniform2i(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(bt(t,e))return;n.uniform2iv(this.addr,e),wt(t,e)}}function Uf(n,e){let t=this.cache;if(e.x!==void 0)t[0]===e.x&&t[1]===e.y&&t[2]===e.z||(n.uniform3i(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(bt(t,e))return;n.uniform3iv(this.addr,e),wt(t,e)}}function Df(n,e){let t=this.cache;if(e.x!==void 0)t[0]===e.x&&t[1]===e.y&&t[2]===e.z&&t[3]===e.w||(n.uniform4i(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(bt(t,e))return;n.uniform4iv(this.addr,e),wt(t,e)}}function Nf(n,e){let t=this.cache;t[0]!==e&&(n.uniform1ui(this.addr,e),t[0]=e)}function Of(n,e){let t=this.cache;if(e.x!==void 0)t[0]===e.x&&t[1]===e.y||(n.uniform2ui(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(bt(t,e))return;n.uniform2uiv(this.addr,e),wt(t,e)}}function kf(n,e){let t=this.cache;if(e.x!==void 0)t[0]===e.x&&t[1]===e.y&&t[2]===e.z||(n.uniform3ui(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(bt(t,e))return;n.uniform3uiv(this.addr,e),wt(t,e)}}function Ff(n,e){let t=this.cache;if(e.x!==void 0)t[0]===e.x&&t[1]===e.y&&t[2]===e.z&&t[3]===e.w||(n.uniform4ui(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(bt(t,e))return;n.uniform4uiv(this.addr,e),wt(t,e)}}function Bf(n,e,t){let i=this.cache,r=t.allocateTextureUnit(),s;i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r),this.type===n.SAMPLER_2D_SHADOW?(Gu.compareFunction=Bd,s=Gu):s=Wd,t.setTexture2D(e||s,r)}function zf(n,e,t){let i=this.cache,r=t.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r),t.setTexture3D(e||jd,r)}function Hf(n,e,t){let i=this.cache,r=t.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r),t.setTextureCube(e||qd,r)}function Vf(n,e,t){let i=this.cache,r=t.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r),t.setTexture2DArray(e||Xd,r)}function Gf(n,e){n.uniform1fv(this.addr,e)}function Wf(n,e){let t=zr(e,this.size,2);n.uniform2fv(this.addr,t)}function Xf(n,e){let t=zr(e,this.size,3);n.uniform3fv(this.addr,t)}function jf(n,e){let t=zr(e,this.size,4);n.uniform4fv(this.addr,t)}function qf(n,e){let t=zr(e,this.size,4);n.uniformMatrix2fv(this.addr,!1,t)}function Yf(n,e){let t=zr(e,this.size,9);n.uniformMatrix3fv(this.addr,!1,t)}function Zf(n,e){let t=zr(e,this.size,16);n.uniformMatrix4fv(this.addr,!1,t)}function $f(n,e){n.uniform1iv(this.addr,e)}function Jf(n,e){n.uniform2iv(this.addr,e)}function Kf(n,e){n.uniform3iv(this.addr,e)}function Qf(n,e){n.uniform4iv(this.addr,e)}function em(n,e){n.uniform1uiv(this.addr,e)}function tm(n,e){n.uniform2uiv(this.addr,e)}function im(n,e){n.uniform3uiv(this.addr,e)}function nm(n,e){n.uniform4uiv(this.addr,e)}function rm(n,e,t){let i=this.cache,r=e.length,s=To(t,r);bt(i,s)||(n.uniform1iv(this.addr,s),wt(i,s));for(let a=0;a!==r;++a)t.setTexture2D(e[a]||Wd,s[a])}function sm(n,e,t){let i=this.cache,r=e.length,s=To(t,r);bt(i,s)||(n.uniform1iv(this.addr,s),wt(i,s));for(let a=0;a!==r;++a)t.setTexture3D(e[a]||jd,s[a])}function am(n,e,t){let i=this.cache,r=e.length,s=To(t,r);bt(i,s)||(n.uniform1iv(this.addr,s),wt(i,s));for(let a=0;a!==r;++a)t.setTextureCube(e[a]||qd,s[a])}function om(n,e,t){let i=this.cache,r=e.length,s=To(t,r);bt(i,s)||(n.uniform1iv(this.addr,s),wt(i,s));for(let a=0;a!==r;++a)t.setTexture2DArray(e[a]||Xd,s[a])}var Lc=class{constructor(e,t,i){this.id=e,this.addr=i,this.cache=[],this.type=t.type,this.setValue=function(r){switch(r){case 5126:return wf;case 35664:return Ef;case 35665:return Tf;case 35666:return Af;case 35674:return Rf;case 35675:return Cf;case 35676:return Pf;case 5124:case 35670:return If;case 35667:case 35671:return Lf;case 35668:case 35672:return Uf;case 35669:case 35673:return Df;case 5125:return Nf;case 36294:return Of;case 36295:return kf;case 36296:return Ff;case 35678:case 36198:case 36298:case 36306:case 35682:return Bf;case 35679:case 36299:case 36307:return zf;case 35680:case 36300:case 36308:case 36293:return Hf;case 36289:case 36303:case 36311:case 36292:return Vf}}(t.type)}},Uc=class{constructor(e,t,i){this.id=e,this.addr=i,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=function(r){switch(r){case 5126:return Gf;case 35664:return Wf;case 35665:return Xf;case 35666:return jf;case 35674:return qf;case 35675:return Yf;case 35676:return Zf;case 5124:case 35670:return $f;case 35667:case 35671:return Jf;case 35668:case 35672:return Kf;case 35669:case 35673:return Qf;case 5125:return em;case 36294:return tm;case 36295:return im;case 36296:return nm;case 35678:case 36198:case 36298:case 36306:case 35682:return rm;case 35679:case 36299:case 36307:return sm;case 35680:case 36300:case 36308:case 36293:return am;case 36289:case 36303:case 36311:case 36292:return om}}(t.type)}},Dc=class{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,i){let r=this.seq;for(let s=0,a=r.length;s!==a;++s){let o=r[s];o.setValue(e,t[o.id],i)}}},Ol=/(\w+)(\])?(\[|\.)?/g;function Zu(n,e){n.seq.push(e),n.map[e.id]=e}function lm(n,e,t){let i=n.name,r=i.length;for(Ol.lastIndex=0;;){let s=Ol.exec(i),a=Ol.lastIndex,o=s[1],l=s[2]==="]",c=s[3];if(l&&(o|=0),c===void 0||c==="["&&a+2===r){Zu(t,c===void 0?new Lc(o,n,e):new Uc(o,n,e));break}{let h=t.map[o];h===void 0&&(h=new Dc(o),Zu(t,h)),t=h}}}var Sr=class{constructor(e,t){this.seq=[],this.map={};let i=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let r=0;r<i;++r){let s=e.getActiveUniform(t,r);lm(s,e.getUniformLocation(t,s.name),this)}}setValue(e,t,i,r){let s=this.map[t];s!==void 0&&s.setValue(e,i,r)}setOptional(e,t,i){let r=t[i];r!==void 0&&this.setValue(e,i,r)}static upload(e,t,i,r){for(let s=0,a=t.length;s!==a;++s){let o=t[s],l=i[o.id];l.needsUpdate!==!1&&o.setValue(e,l.value,r)}}static seqWithValue(e,t){let i=[];for(let r=0,s=e.length;r!==s;++r){let a=e[r];a.id in t&&i.push(a)}return i}};function $u(n,e,t){let i=n.createShader(e);return n.shaderSource(i,t),n.compileShader(i),i}var cm=37297,hm=0;function Ju(n,e,t){let i=n.getShaderParameter(e,n.COMPILE_STATUS),r=n.getShaderInfoLog(e).trim();if(i&&r==="")return"";let s=/ERROR: 0:(\d+)/.exec(r);if(s){let a=parseInt(s[1]);return t.toUpperCase()+`

`+r+`

`+function(o,l){let c=o.split(`
`),h=[],u=Math.max(l-6,0),d=Math.min(l+6,c.length);for(let p=u;p<d;p++){let m=p+1;h.push(`${m===l?">":" "} ${m}: ${c[p]}`)}return h.join(`
`)}(n.getShaderSource(e),a)}return r}function um(n,e){let t=function(i){let r=Ye.getPrimaries(Ye.workingColorSpace),s=Ye.getPrimaries(i),a;switch(r===s?a="":r===Za&&s===Ya?a="LinearDisplayP3ToLinearSRGB":r===Ya&&s===Za&&(a="LinearSRGBToLinearDisplayP3"),i){case _n:case Eo:return[a,"LinearTransferOETF"];case Vt:case Lh:return[a,"sRGBTransferOETF"];default:return console.warn("THREE.WebGLProgram: Unsupported color space:",i),[a,"LinearTransferOETF"]}}(e);return`vec4 ${n}( vec4 value ) { return ${t[0]}( ${t[1]}( value ) ); }`}function dm(n,e){let t;switch(e){case _h:t="Linear";break;case Mh:t="Reinhard";break;case Sh:t="Cineon";break;case Ns:t="ACESFilmic";break;case bh:t="AgX";break;case wh:t="Neutral";break;case Gp:t="Custom";break;default:console.warn("THREE.WebGLProgram: Unsupported toneMapping:",e),t="Linear"}return"vec3 "+n+"( vec3 color ) { return "+t+"ToneMapping( color ); }"}var ba=new M;function pm(){return Ye.getLuminanceCoefficients(ba),["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${ba.x.toFixed(4)}, ${ba.y.toFixed(4)}, ${ba.z.toFixed(4)} );`,"	return dot( weights, rgb );","}"].join(`
`)}function as(n){return n!==""}function Ku(n,e){let t=e.numSpotLightShadows+e.numSpotLightMaps-e.numSpotLightShadowsWithMaps;return n.replace(/NUM_DIR_LIGHTS/g,e.numDirLights).replace(/NUM_SPOT_LIGHTS/g,e.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,e.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,t).replace(/NUM_RECT_AREA_LIGHTS/g,e.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,e.numPointLights).replace(/NUM_HEMI_LIGHTS/g,e.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,e.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,e.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,e.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,e.numPointLightShadows)}function Qu(n,e){return n.replace(/NUM_CLIPPING_PLANES/g,e.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,e.numClippingPlanes-e.numClipIntersection)}var fm=/^[ \t]*#include +<([\w\d./]+)>/gm;function Nc(n){return n.replace(fm,gm)}var mm=new Map;function gm(n,e){let t=Ne[e];if(t===void 0){let i=mm.get(e);if(i===void 0)throw new Error("Can not resolve #include <"+e+">");t=Ne[i],console.warn('THREE.WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',e,i)}return Nc(t)}var vm=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function ed(n){return n.replace(vm,ym)}function ym(n,e,t,i){let r="";for(let s=parseInt(e);s<parseInt(t);s++)r+=i.replace(/\[\s*i\s*\]/g,"[ "+s+" ]").replace(/UNROLLED_LOOP_INDEX/g,s);return r}function td(n){let e=`precision ${n.precision} float;
	precision ${n.precision} int;
	precision ${n.precision} sampler2D;
	precision ${n.precision} samplerCube;
	precision ${n.precision} sampler3D;
	precision ${n.precision} sampler2DArray;
	precision ${n.precision} sampler2DShadow;
	precision ${n.precision} samplerCubeShadow;
	precision ${n.precision} sampler2DArrayShadow;
	precision ${n.precision} isampler2D;
	precision ${n.precision} isampler3D;
	precision ${n.precision} isamplerCube;
	precision ${n.precision} isampler2DArray;
	precision ${n.precision} usampler2D;
	precision ${n.precision} usampler3D;
	precision ${n.precision} usamplerCube;
	precision ${n.precision} usampler2DArray;
	`;return n.precision==="highp"?e+=`
#define HIGH_PRECISION`:n.precision==="mediump"?e+=`
#define MEDIUM_PRECISION`:n.precision==="lowp"&&(e+=`
#define LOW_PRECISION`),e}function xm(n,e,t,i){let r=n.getContext(),s=t.defines,a=t.vertexShader,o=t.fragmentShader,l=function(V){let F="SHADOWMAP_TYPE_BASIC";return V.shadowMapType===Td?F="SHADOWMAP_TYPE_PCF":V.shadowMapType===zp?F="SHADOWMAP_TYPE_PCF_SOFT":V.shadowMapType===Ki&&(F="SHADOWMAP_TYPE_VSM"),F}(t),c=function(V){let F="ENVMAP_TYPE_CUBE";if(V.envMap)switch(V.envMapMode){case br:case wr:F="ENVMAP_TYPE_CUBE";break;case wo:F="ENVMAP_TYPE_CUBE_UV"}return F}(t),h=function(V){let F="ENVMAP_MODE_REFLECTION";return V.envMap&&V.envMapMode===wr&&(F="ENVMAP_MODE_REFRACTION"),F}(t),u=function(V){let F="ENVMAP_BLENDING_NONE";if(V.envMap)switch(V.combine){case Rd:F="ENVMAP_BLENDING_MULTIPLY";break;case Hp:F="ENVMAP_BLENDING_MIX";break;case Vp:F="ENVMAP_BLENDING_ADD"}return F}(t),d=function(V){let F=V.envMapCubeUVHeight;if(F===null)return null;let X=Math.log2(F)-2,H=1/F;return{texelWidth:1/(3*Math.max(Math.pow(2,X),112)),texelHeight:H,maxMip:X}}(t),p=function(V){return[V.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",V.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(as).join(`
`)}(t),m=function(V){let F=[];for(let X in V){let H=V[X];H!==!1&&F.push("#define "+X+" "+H)}return F.join(`
`)}(s),x=r.createProgram(),g,f,y=t.glslVersion?"#version "+t.glslVersion+`
`:"";t.isRawShaderMaterial?(g=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,m].filter(as).join(`
`),g.length>0&&(g+=`
`),f=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,m].filter(as).join(`
`),f.length>0&&(f+=`
`)):(g=[td(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,m,t.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",t.batching?"#define USE_BATCHING":"",t.batchingColor?"#define USE_BATCHING_COLOR":"",t.instancing?"#define USE_INSTANCING":"",t.instancingColor?"#define USE_INSTANCING_COLOR":"",t.instancingMorph?"#define USE_INSTANCING_MORPH":"",t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+h:"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.displacementMap?"#define USE_DISPLACEMENTMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.mapUv?"#define MAP_UV "+t.mapUv:"",t.alphaMapUv?"#define ALPHAMAP_UV "+t.alphaMapUv:"",t.lightMapUv?"#define LIGHTMAP_UV "+t.lightMapUv:"",t.aoMapUv?"#define AOMAP_UV "+t.aoMapUv:"",t.emissiveMapUv?"#define EMISSIVEMAP_UV "+t.emissiveMapUv:"",t.bumpMapUv?"#define BUMPMAP_UV "+t.bumpMapUv:"",t.normalMapUv?"#define NORMALMAP_UV "+t.normalMapUv:"",t.displacementMapUv?"#define DISPLACEMENTMAP_UV "+t.displacementMapUv:"",t.metalnessMapUv?"#define METALNESSMAP_UV "+t.metalnessMapUv:"",t.roughnessMapUv?"#define ROUGHNESSMAP_UV "+t.roughnessMapUv:"",t.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+t.anisotropyMapUv:"",t.clearcoatMapUv?"#define CLEARCOATMAP_UV "+t.clearcoatMapUv:"",t.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+t.clearcoatNormalMapUv:"",t.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+t.clearcoatRoughnessMapUv:"",t.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+t.iridescenceMapUv:"",t.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+t.iridescenceThicknessMapUv:"",t.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+t.sheenColorMapUv:"",t.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+t.sheenRoughnessMapUv:"",t.specularMapUv?"#define SPECULARMAP_UV "+t.specularMapUv:"",t.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+t.specularColorMapUv:"",t.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+t.specularIntensityMapUv:"",t.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+t.transmissionMapUv:"",t.thicknessMapUv?"#define THICKNESSMAP_UV "+t.thicknessMapUv:"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.flatShading?"#define FLAT_SHADED":"",t.skinning?"#define USE_SKINNING":"",t.morphTargets?"#define USE_MORPHTARGETS":"",t.morphNormals&&t.flatShading===!1?"#define USE_MORPHNORMALS":"",t.morphColors?"#define USE_MORPHCOLORS":"",t.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+t.morphTextureStride:"",t.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+t.morphTargetsCount:"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.sizeAttenuation?"#define USE_SIZEATTENUATION":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",t.reverseDepthBuffer?"#define USE_REVERSEDEPTHBUF":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(as).join(`
`),f=[td(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,m,t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",t.map?"#define USE_MAP":"",t.matcap?"#define USE_MATCAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+c:"",t.envMap?"#define "+h:"",t.envMap?"#define "+u:"",d?"#define CUBEUV_TEXEL_WIDTH "+d.texelWidth:"",d?"#define CUBEUV_TEXEL_HEIGHT "+d.texelHeight:"",d?"#define CUBEUV_MAX_MIP "+d.maxMip+".0":"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoat?"#define USE_CLEARCOAT":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.dispersion?"#define USE_DISPERSION":"",t.iridescence?"#define USE_IRIDESCENCE":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaTest?"#define USE_ALPHATEST":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.sheen?"#define USE_SHEEN":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors||t.instancingColor||t.batchingColor?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.gradientMap?"#define USE_GRADIENTMAP":"",t.flatShading?"#define FLAT_SHADED":"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",t.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",t.reverseDepthBuffer?"#define USE_REVERSEDEPTHBUF":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",t.toneMapping!==fn?"#define TONE_MAPPING":"",t.toneMapping!==fn?Ne.tonemapping_pars_fragment:"",t.toneMapping!==fn?dm("toneMapping",t.toneMapping):"",t.dithering?"#define DITHERING":"",t.opaque?"#define OPAQUE":"",Ne.colorspace_pars_fragment,um("linearToOutputTexel",t.outputColorSpace),pm(),t.useDepthPacking?"#define DEPTH_PACKING "+t.depthPacking:"",`
`].filter(as).join(`
`)),a=Nc(a),a=Ku(a,t),a=Qu(a,t),o=Nc(o),o=Ku(o,t),o=Qu(o,t),a=ed(a),o=ed(o),t.isRawShaderMaterial!==!0&&(y=`#version 300 es
`,g=[p,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+g,f=["#define varying in",t.glslVersion===xu?"":"layout(location = 0) out highp vec4 pc_fragColor;",t.glslVersion===xu?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+f);let v=y+g+a,_=y+f+o,E=$u(r,r.VERTEX_SHADER,v),T=$u(r,r.FRAGMENT_SHADER,_);function A(V){if(n.debug.checkShaderErrors){let F=r.getProgramInfoLog(x).trim(),X=r.getShaderInfoLog(E).trim(),H=r.getShaderInfoLog(T).trim(),Y=!0,k=!0;if(r.getProgramParameter(x,r.LINK_STATUS)===!1)if(Y=!1,typeof n.debug.onShaderError=="function")n.debug.onShaderError(r,x,E,T);else{let ie=Ju(r,E,"vertex"),J=Ju(r,T,"fragment");console.error("THREE.WebGLProgram: Shader Error "+r.getError()+" - VALIDATE_STATUS "+r.getProgramParameter(x,r.VALIDATE_STATUS)+`

Material Name: `+V.name+`
Material Type: `+V.type+`

Program Info Log: `+F+`
`+ie+`
`+J)}else F!==""?console.warn("THREE.WebGLProgram: Program Info Log:",F):X!==""&&H!==""||(k=!1);k&&(V.diagnostics={runnable:Y,programLog:F,vertexShader:{log:X,prefix:g},fragmentShader:{log:H,prefix:f}})}r.deleteShader(E),r.deleteShader(T),B=new Sr(r,x),U=function(F,X){let H={},Y=F.getProgramParameter(X,F.ACTIVE_ATTRIBUTES);for(let k=0;k<Y;k++){let ie=F.getActiveAttrib(X,k),J=ie.name,se=1;ie.type===F.FLOAT_MAT2&&(se=2),ie.type===F.FLOAT_MAT3&&(se=3),ie.type===F.FLOAT_MAT4&&(se=4),H[J]={type:ie.type,location:F.getAttribLocation(X,J),locationSize:se}}return H}(r,x)}let B,U;r.attachShader(x,E),r.attachShader(x,T),t.index0AttributeName!==void 0?r.bindAttribLocation(x,0,t.index0AttributeName):t.morphTargets===!0&&r.bindAttribLocation(x,0,"position"),r.linkProgram(x),this.getUniforms=function(){return B===void 0&&A(this),B},this.getAttributes=function(){return U===void 0&&A(this),U};let W=t.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return W===!1&&(W=r.getProgramParameter(x,cm)),W},this.destroy=function(){i.releaseStatesOfProgram(this),r.deleteProgram(x),this.program=void 0},this.type=t.shaderType,this.name=t.shaderName,this.id=hm++,this.cacheKey=e,this.usedTimes=1,this.program=x,this.vertexShader=E,this.fragmentShader=T,this}var _m=0,Oc=class{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e){let t=e.vertexShader,i=e.fragmentShader,r=this._getShaderStage(t),s=this._getShaderStage(i),a=this._getShaderCacheForMaterial(e);return a.has(r)===!1&&(a.add(r),r.usedTimes++),a.has(s)===!1&&(a.add(s),s.usedTimes++),this}remove(e){let t=this.materialCache.get(e);for(let i of t)i.usedTimes--,i.usedTimes===0&&this.shaderCache.delete(i.code);return this.materialCache.delete(e),this}getVertexShaderID(e){return this._getShaderStage(e.vertexShader).id}getFragmentShaderID(e){return this._getShaderStage(e.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){let t=this.materialCache,i=t.get(e);return i===void 0&&(i=new Set,t.set(e,i)),i}_getShaderStage(e){let t=this.shaderCache,i=t.get(e);return i===void 0&&(i=new kc(e),t.set(e,i)),i}},kc=class{constructor(e){this.id=_m++,this.code=e,this.usedTimes=0}};function Mm(n,e,t,i,r,s,a){let o=new eo,l=new Oc,c=new Set,h=[],u=r.logarithmicDepthBuffer,d=r.reverseDepthBuffer,p=r.vertexTextures,m=r.precision,x={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distanceRGBA",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function g(f){return c.add(f),f===0?"uv":`uv${f}`}return{getParameters:function(f,y,v,_,E){let T=_.fog,A=E.geometry,B=f.isMeshStandardMaterial?_.environment:null,U=(f.isMeshStandardMaterial?t:e).get(f.envMap||B),W=U&&U.mapping===wo?U.image.height:null,V=x[f.type];f.precision!==null&&(m=r.getMaxPrecision(f.precision),m!==f.precision&&console.warn("THREE.WebGLProgram.getParameters:",f.precision,"not supported, using",m,"instead."));let F=A.morphAttributes.position||A.morphAttributes.normal||A.morphAttributes.color,X=F!==void 0?F.length:0,H,Y,k,ie,J=0;if(A.morphAttributes.position!==void 0&&(J=1),A.morphAttributes.normal!==void 0&&(J=2),A.morphAttributes.color!==void 0&&(J=3),V){let Kr=ki[V];H=Kr.vertexShader,Y=Kr.fragmentShader}else H=f.vertexShader,Y=f.fragmentShader,l.update(f),k=l.getVertexShaderID(f),ie=l.getFragmentShaderID(f);let se=n.getRenderTarget(),le=E.isInstancedMesh===!0,$=E.isBatchedMesh===!0,ae=!!f.map,fe=!!f.matcap,de=!!U,R=!!f.aoMap,S=!!f.lightMap,N=!!f.bumpMap,j=!!f.normalMap,C=!!f.displacementMap,P=!!f.emissiveMap,b=!!f.metalnessMap,L=!!f.roughnessMap,I=f.anisotropy>0,Q=f.clearcoat>0,z=f.dispersion>0,ee=f.iridescence>0,oe=f.sheen>0,te=f.transmission>0,me=I&&!!f.anisotropyMap,ve=Q&&!!f.clearcoatMap,_e=Q&&!!f.clearcoatNormalMap,Le=Q&&!!f.clearcoatRoughnessMap,Ve=ee&&!!f.iridescenceMap,ze=ee&&!!f.iridescenceThicknessMap,we=oe&&!!f.sheenColorMap,Xe=oe&&!!f.sheenRoughnessMap,Ke=!!f.specularMap,ut=!!f.specularColorMap,Se=!!f.specularIntensityMap,Ge=te&&!!f.transmissionMap,Qe=te&&!!f.thicknessMap,Qs=!!f.gradientMap,er=!!f.alphaMap,ri=f.alphaTest>0,ji=!!f.alphaHash,Tn=!!f.extensions,D=fn;f.toneMapped&&(se!==null&&se.isXRRenderTarget!==!0||(D=n.toneMapping));let An={shaderID:V,shaderType:f.type,shaderName:f.name,vertexShader:H,fragmentShader:Y,defines:f.defines,customVertexShaderID:k,customFragmentShaderID:ie,isRawShaderMaterial:f.isRawShaderMaterial===!0,glslVersion:f.glslVersion,precision:m,batching:$,batchingColor:$&&E._colorsTexture!==null,instancing:le,instancingColor:le&&E.instanceColor!==null,instancingMorph:le&&E.morphTexture!==null,supportsVertexTextures:p,outputColorSpace:se===null?n.outputColorSpace:se.isXRRenderTarget===!0?se.texture.colorSpace:_n,alphaToCoverage:!!f.alphaToCoverage,map:ae,matcap:fe,envMap:de,envMapMode:de&&U.mapping,envMapCubeUVHeight:W,aoMap:R,lightMap:S,bumpMap:N,normalMap:j,displacementMap:p&&C,emissiveMap:P,normalMapObjectSpace:j&&f.normalMapType===1,normalMapTangentSpace:j&&f.normalMapType===0,metalnessMap:b,roughnessMap:L,anisotropy:I,anisotropyMap:me,clearcoat:Q,clearcoatMap:ve,clearcoatNormalMap:_e,clearcoatRoughnessMap:Le,dispersion:z,iridescence:ee,iridescenceMap:Ve,iridescenceThicknessMap:ze,sheen:oe,sheenColorMap:we,sheenRoughnessMap:Xe,specularMap:Ke,specularColorMap:ut,specularIntensityMap:Se,transmission:te,transmissionMap:Ge,thicknessMap:Qe,gradientMap:Qs,opaque:f.transparent===!1&&f.blending===1&&f.alphaToCoverage===!1,alphaMap:er,alphaTest:ri,alphaHash:ji,combine:f.combine,mapUv:ae&&g(f.map.channel),aoMapUv:R&&g(f.aoMap.channel),lightMapUv:S&&g(f.lightMap.channel),bumpMapUv:N&&g(f.bumpMap.channel),normalMapUv:j&&g(f.normalMap.channel),displacementMapUv:C&&g(f.displacementMap.channel),emissiveMapUv:P&&g(f.emissiveMap.channel),metalnessMapUv:b&&g(f.metalnessMap.channel),roughnessMapUv:L&&g(f.roughnessMap.channel),anisotropyMapUv:me&&g(f.anisotropyMap.channel),clearcoatMapUv:ve&&g(f.clearcoatMap.channel),clearcoatNormalMapUv:_e&&g(f.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:Le&&g(f.clearcoatRoughnessMap.channel),iridescenceMapUv:Ve&&g(f.iridescenceMap.channel),iridescenceThicknessMapUv:ze&&g(f.iridescenceThicknessMap.channel),sheenColorMapUv:we&&g(f.sheenColorMap.channel),sheenRoughnessMapUv:Xe&&g(f.sheenRoughnessMap.channel),specularMapUv:Ke&&g(f.specularMap.channel),specularColorMapUv:ut&&g(f.specularColorMap.channel),specularIntensityMapUv:Se&&g(f.specularIntensityMap.channel),transmissionMapUv:Ge&&g(f.transmissionMap.channel),thicknessMapUv:Qe&&g(f.thicknessMap.channel),alphaMapUv:er&&g(f.alphaMap.channel),vertexTangents:!!A.attributes.tangent&&(j||I),vertexColors:f.vertexColors,vertexAlphas:f.vertexColors===!0&&!!A.attributes.color&&A.attributes.color.itemSize===4,pointsUvs:E.isPoints===!0&&!!A.attributes.uv&&(ae||er),fog:!!T,useFog:f.fog===!0,fogExp2:!!T&&T.isFogExp2,flatShading:f.flatShading===!0,sizeAttenuation:f.sizeAttenuation===!0,logarithmicDepthBuffer:u,reverseDepthBuffer:d,skinning:E.isSkinnedMesh===!0,morphTargets:A.morphAttributes.position!==void 0,morphNormals:A.morphAttributes.normal!==void 0,morphColors:A.morphAttributes.color!==void 0,morphTargetsCount:X,morphTextureStride:J,numDirLights:y.directional.length,numPointLights:y.point.length,numSpotLights:y.spot.length,numSpotLightMaps:y.spotLightMap.length,numRectAreaLights:y.rectArea.length,numHemiLights:y.hemi.length,numDirLightShadows:y.directionalShadowMap.length,numPointLightShadows:y.pointShadowMap.length,numSpotLightShadows:y.spotShadowMap.length,numSpotLightShadowsWithMaps:y.numSpotLightShadowsWithMaps,numLightProbes:y.numLightProbes,numClippingPlanes:a.numPlanes,numClipIntersection:a.numIntersection,dithering:f.dithering,shadowMapEnabled:n.shadowMap.enabled&&v.length>0,shadowMapType:n.shadowMap.type,toneMapping:D,decodeVideoTexture:ae&&f.map.isVideoTexture===!0&&Ye.getTransfer(f.map.colorSpace)===tt,premultipliedAlpha:f.premultipliedAlpha,doubleSided:f.side===2,flipSided:f.side===Mt,useDepthPacking:f.depthPacking>=0,depthPacking:f.depthPacking||0,index0AttributeName:f.index0AttributeName,extensionClipCullDistance:Tn&&f.extensions.clipCullDistance===!0&&i.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(Tn&&f.extensions.multiDraw===!0||$)&&i.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:i.has("KHR_parallel_shader_compile"),customProgramCacheKey:f.customProgramCacheKey()};return An.vertexUv1s=c.has(1),An.vertexUv2s=c.has(2),An.vertexUv3s=c.has(3),c.clear(),An},getProgramCacheKey:function(f){let y=[];if(f.shaderID?y.push(f.shaderID):(y.push(f.customVertexShaderID),y.push(f.customFragmentShaderID)),f.defines!==void 0)for(let v in f.defines)y.push(v),y.push(f.defines[v]);return f.isRawShaderMaterial===!1&&(function(v,_){v.push(_.precision),v.push(_.outputColorSpace),v.push(_.envMapMode),v.push(_.envMapCubeUVHeight),v.push(_.mapUv),v.push(_.alphaMapUv),v.push(_.lightMapUv),v.push(_.aoMapUv),v.push(_.bumpMapUv),v.push(_.normalMapUv),v.push(_.displacementMapUv),v.push(_.emissiveMapUv),v.push(_.metalnessMapUv),v.push(_.roughnessMapUv),v.push(_.anisotropyMapUv),v.push(_.clearcoatMapUv),v.push(_.clearcoatNormalMapUv),v.push(_.clearcoatRoughnessMapUv),v.push(_.iridescenceMapUv),v.push(_.iridescenceThicknessMapUv),v.push(_.sheenColorMapUv),v.push(_.sheenRoughnessMapUv),v.push(_.specularMapUv),v.push(_.specularColorMapUv),v.push(_.specularIntensityMapUv),v.push(_.transmissionMapUv),v.push(_.thicknessMapUv),v.push(_.combine),v.push(_.fogExp2),v.push(_.sizeAttenuation),v.push(_.morphTargetsCount),v.push(_.morphAttributeCount),v.push(_.numDirLights),v.push(_.numPointLights),v.push(_.numSpotLights),v.push(_.numSpotLightMaps),v.push(_.numHemiLights),v.push(_.numRectAreaLights),v.push(_.numDirLightShadows),v.push(_.numPointLightShadows),v.push(_.numSpotLightShadows),v.push(_.numSpotLightShadowsWithMaps),v.push(_.numLightProbes),v.push(_.shadowMapType),v.push(_.toneMapping),v.push(_.numClippingPlanes),v.push(_.numClipIntersection),v.push(_.depthPacking)}(y,f),function(v,_){o.disableAll(),_.supportsVertexTextures&&o.enable(0),_.instancing&&o.enable(1),_.instancingColor&&o.enable(2),_.instancingMorph&&o.enable(3),_.matcap&&o.enable(4),_.envMap&&o.enable(5),_.normalMapObjectSpace&&o.enable(6),_.normalMapTangentSpace&&o.enable(7),_.clearcoat&&o.enable(8),_.iridescence&&o.enable(9),_.alphaTest&&o.enable(10),_.vertexColors&&o.enable(11),_.vertexAlphas&&o.enable(12),_.vertexUv1s&&o.enable(13),_.vertexUv2s&&o.enable(14),_.vertexUv3s&&o.enable(15),_.vertexTangents&&o.enable(16),_.anisotropy&&o.enable(17),_.alphaHash&&o.enable(18),_.batching&&o.enable(19),_.dispersion&&o.enable(20),_.batchingColor&&o.enable(21),v.push(o.mask),o.disableAll(),_.fog&&o.enable(0),_.useFog&&o.enable(1),_.flatShading&&o.enable(2),_.logarithmicDepthBuffer&&o.enable(3),_.reverseDepthBuffer&&o.enable(4),_.skinning&&o.enable(5),_.morphTargets&&o.enable(6),_.morphNormals&&o.enable(7),_.morphColors&&o.enable(8),_.premultipliedAlpha&&o.enable(9),_.shadowMapEnabled&&o.enable(10),_.doubleSided&&o.enable(11),_.flipSided&&o.enable(12),_.useDepthPacking&&o.enable(13),_.dithering&&o.enable(14),_.transmission&&o.enable(15),_.sheen&&o.enable(16),_.opaque&&o.enable(17),_.pointsUvs&&o.enable(18),_.decodeVideoTexture&&o.enable(19),_.alphaToCoverage&&o.enable(20),v.push(o.mask)}(y,f),y.push(n.outputColorSpace)),y.push(f.customProgramCacheKey),y.join()},getUniforms:function(f){let y=x[f.type],v;if(y){let _=ki[y];v=Mn.clone(_.uniforms)}else v=f.uniforms;return v},acquireProgram:function(f,y){let v;for(let _=0,E=h.length;_<E;_++){let T=h[_];if(T.cacheKey===y){v=T,++v.usedTimes;break}}return v===void 0&&(v=new xm(n,y,f,s),h.push(v)),v},releaseProgram:function(f){if(--f.usedTimes==0){let y=h.indexOf(f);h[y]=h[h.length-1],h.pop(),f.destroy()}},releaseShaderCache:function(f){l.remove(f)},programs:h,dispose:function(){l.dispose()}}}function Sm(){let n=new WeakMap;return{has:function(e){return n.has(e)},get:function(e){let t=n.get(e);return t===void 0&&(t={},n.set(e,t)),t},remove:function(e){n.delete(e)},update:function(e,t,i){n.get(e)[t]=i},dispose:function(){n=new WeakMap}}}function bm(n,e){return n.groupOrder!==e.groupOrder?n.groupOrder-e.groupOrder:n.renderOrder!==e.renderOrder?n.renderOrder-e.renderOrder:n.material.id!==e.material.id?n.material.id-e.material.id:n.z!==e.z?n.z-e.z:n.id-e.id}function id(n,e){return n.groupOrder!==e.groupOrder?n.groupOrder-e.groupOrder:n.renderOrder!==e.renderOrder?n.renderOrder-e.renderOrder:n.z!==e.z?e.z-n.z:n.id-e.id}function nd(){let n=[],e=0,t=[],i=[],r=[];function s(a,o,l,c,h,u){let d=n[e];return d===void 0?(d={id:a.id,object:a,geometry:o,material:l,groupOrder:c,renderOrder:a.renderOrder,z:h,group:u},n[e]=d):(d.id=a.id,d.object=a,d.geometry=o,d.material=l,d.groupOrder=c,d.renderOrder=a.renderOrder,d.z=h,d.group=u),e++,d}return{opaque:t,transmissive:i,transparent:r,init:function(){e=0,t.length=0,i.length=0,r.length=0},push:function(a,o,l,c,h,u){let d=s(a,o,l,c,h,u);l.transmission>0?i.push(d):l.transparent===!0?r.push(d):t.push(d)},unshift:function(a,o,l,c,h,u){let d=s(a,o,l,c,h,u);l.transmission>0?i.unshift(d):l.transparent===!0?r.unshift(d):t.unshift(d)},finish:function(){for(let a=e,o=n.length;a<o;a++){let l=n[a];if(l.id===null)break;l.id=null,l.object=null,l.geometry=null,l.material=null,l.group=null}},sort:function(a,o){t.length>1&&t.sort(a||bm),i.length>1&&i.sort(o||id),r.length>1&&r.sort(o||id)}}}function wm(){let n=new WeakMap;return{get:function(e,t){let i=n.get(e),r;return i===void 0?(r=new nd,n.set(e,[r])):t>=i.length?(r=new nd,i.push(r)):r=i[t],r},dispose:function(){n=new WeakMap}}}function Em(){let n={};return{get:function(e){if(n[e.id]!==void 0)return n[e.id];let t;switch(e.type){case"DirectionalLight":t={direction:new M,color:new be};break;case"SpotLight":t={position:new M,direction:new M,color:new be,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":t={position:new M,color:new be,distance:0,decay:0};break;case"HemisphereLight":t={direction:new M,skyColor:new be,groundColor:new be};break;case"RectAreaLight":t={color:new be,position:new M,halfWidth:new M,halfHeight:new M}}return n[e.id]=t,t}}}var Tm=0;function Am(n,e){return(e.castShadow?2:0)-(n.castShadow?2:0)+(e.map?1:0)-(n.map?1:0)}function Rm(n){let e=new Em,t=function(){let o={};return{get:function(l){if(o[l.id]!==void 0)return o[l.id];let c;switch(l.type){case"DirectionalLight":case"SpotLight":c={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new re};break;case"PointLight":c={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new re,shadowCameraNear:1,shadowCameraFar:1e3}}return o[l.id]=c,c}}}(),i={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let o=0;o<9;o++)i.probe.push(new M);let r=new M,s=new Ie,a=new Ie;return{setup:function(o){let l=0,c=0,h=0;for(let A=0;A<9;A++)i.probe[A].set(0,0,0);let u=0,d=0,p=0,m=0,x=0,g=0,f=0,y=0,v=0,_=0,E=0;o.sort(Am);for(let A=0,B=o.length;A<B;A++){let U=o[A],W=U.color,V=U.intensity,F=U.distance,X=U.shadow&&U.shadow.map?U.shadow.map.texture:null;if(U.isAmbientLight)l+=W.r*V,c+=W.g*V,h+=W.b*V;else if(U.isLightProbe){for(let H=0;H<9;H++)i.probe[H].addScaledVector(U.sh.coefficients[H],V);E++}else if(U.isDirectionalLight){let H=e.get(U);if(H.color.copy(U.color).multiplyScalar(U.intensity),U.castShadow){let Y=U.shadow,k=t.get(U);k.shadowIntensity=Y.intensity,k.shadowBias=Y.bias,k.shadowNormalBias=Y.normalBias,k.shadowRadius=Y.radius,k.shadowMapSize=Y.mapSize,i.directionalShadow[u]=k,i.directionalShadowMap[u]=X,i.directionalShadowMatrix[u]=U.shadow.matrix,g++}i.directional[u]=H,u++}else if(U.isSpotLight){let H=e.get(U);H.position.setFromMatrixPosition(U.matrixWorld),H.color.copy(W).multiplyScalar(V),H.distance=F,H.coneCos=Math.cos(U.angle),H.penumbraCos=Math.cos(U.angle*(1-U.penumbra)),H.decay=U.decay,i.spot[p]=H;let Y=U.shadow;if(U.map&&(i.spotLightMap[v]=U.map,v++,Y.updateMatrices(U),U.castShadow&&_++),i.spotLightMatrix[p]=Y.matrix,U.castShadow){let k=t.get(U);k.shadowIntensity=Y.intensity,k.shadowBias=Y.bias,k.shadowNormalBias=Y.normalBias,k.shadowRadius=Y.radius,k.shadowMapSize=Y.mapSize,i.spotShadow[p]=k,i.spotShadowMap[p]=X,y++}p++}else if(U.isRectAreaLight){let H=e.get(U);H.color.copy(W).multiplyScalar(V),H.halfWidth.set(.5*U.width,0,0),H.halfHeight.set(0,.5*U.height,0),i.rectArea[m]=H,m++}else if(U.isPointLight){let H=e.get(U);if(H.color.copy(U.color).multiplyScalar(U.intensity),H.distance=U.distance,H.decay=U.decay,U.castShadow){let Y=U.shadow,k=t.get(U);k.shadowIntensity=Y.intensity,k.shadowBias=Y.bias,k.shadowNormalBias=Y.normalBias,k.shadowRadius=Y.radius,k.shadowMapSize=Y.mapSize,k.shadowCameraNear=Y.camera.near,k.shadowCameraFar=Y.camera.far,i.pointShadow[d]=k,i.pointShadowMap[d]=X,i.pointShadowMatrix[d]=U.shadow.matrix,f++}i.point[d]=H,d++}else if(U.isHemisphereLight){let H=e.get(U);H.skyColor.copy(U.color).multiplyScalar(V),H.groundColor.copy(U.groundColor).multiplyScalar(V),i.hemi[x]=H,x++}}m>0&&(n.has("OES_texture_float_linear")===!0?(i.rectAreaLTC1=ue.LTC_FLOAT_1,i.rectAreaLTC2=ue.LTC_FLOAT_2):(i.rectAreaLTC1=ue.LTC_HALF_1,i.rectAreaLTC2=ue.LTC_HALF_2)),i.ambient[0]=l,i.ambient[1]=c,i.ambient[2]=h;let T=i.hash;T.directionalLength===u&&T.pointLength===d&&T.spotLength===p&&T.rectAreaLength===m&&T.hemiLength===x&&T.numDirectionalShadows===g&&T.numPointShadows===f&&T.numSpotShadows===y&&T.numSpotMaps===v&&T.numLightProbes===E||(i.directional.length=u,i.spot.length=p,i.rectArea.length=m,i.point.length=d,i.hemi.length=x,i.directionalShadow.length=g,i.directionalShadowMap.length=g,i.pointShadow.length=f,i.pointShadowMap.length=f,i.spotShadow.length=y,i.spotShadowMap.length=y,i.directionalShadowMatrix.length=g,i.pointShadowMatrix.length=f,i.spotLightMatrix.length=y+v-_,i.spotLightMap.length=v,i.numSpotLightShadowsWithMaps=_,i.numLightProbes=E,T.directionalLength=u,T.pointLength=d,T.spotLength=p,T.rectAreaLength=m,T.hemiLength=x,T.numDirectionalShadows=g,T.numPointShadows=f,T.numSpotShadows=y,T.numSpotMaps=v,T.numLightProbes=E,i.version=Tm++)},setupView:function(o,l){let c=0,h=0,u=0,d=0,p=0,m=l.matrixWorldInverse;for(let x=0,g=o.length;x<g;x++){let f=o[x];if(f.isDirectionalLight){let y=i.directional[c];y.direction.setFromMatrixPosition(f.matrixWorld),r.setFromMatrixPosition(f.target.matrixWorld),y.direction.sub(r),y.direction.transformDirection(m),c++}else if(f.isSpotLight){let y=i.spot[u];y.position.setFromMatrixPosition(f.matrixWorld),y.position.applyMatrix4(m),y.direction.setFromMatrixPosition(f.matrixWorld),r.setFromMatrixPosition(f.target.matrixWorld),y.direction.sub(r),y.direction.transformDirection(m),u++}else if(f.isRectAreaLight){let y=i.rectArea[d];y.position.setFromMatrixPosition(f.matrixWorld),y.position.applyMatrix4(m),a.identity(),s.copy(f.matrixWorld),s.premultiply(m),a.extractRotation(s),y.halfWidth.set(.5*f.width,0,0),y.halfHeight.set(0,.5*f.height,0),y.halfWidth.applyMatrix4(a),y.halfHeight.applyMatrix4(a),d++}else if(f.isPointLight){let y=i.point[h];y.position.setFromMatrixPosition(f.matrixWorld),y.position.applyMatrix4(m),h++}else if(f.isHemisphereLight){let y=i.hemi[p];y.direction.setFromMatrixPosition(f.matrixWorld),y.direction.transformDirection(m),p++}}},state:i}}function rd(n){let e=new Rm(n),t=[],i=[],r={lightsArray:t,shadowsArray:i,camera:null,lights:e,transmissionRenderTarget:{}};return{init:function(s){r.camera=s,t.length=0,i.length=0},state:r,setupLights:function(){e.setup(t)},setupLightsView:function(s){e.setupView(t,s)},pushLight:function(s){t.push(s)},pushShadow:function(s){i.push(s)}}}function Cm(n){let e=new WeakMap;return{get:function(t,i=0){let r=e.get(t),s;return r===void 0?(s=new rd(n),e.set(t,[s])):i>=r.length?(s=new rd(n),r.push(s)):s=r[i],s},dispose:function(){e=new WeakMap}}}var Fc=class extends Hi{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=3200,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}},Bc=class extends Hi{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}};function Pm(n,e,t){let i=new Pr,r=new re,s=new re,a=new $e,o=new Fc({depthPacking:3201}),l=new Bc,c={},h=t.maxTextureSize,u={[zi]:Mt,[Mt]:zi,2:2},d=new mt({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new re},radius:{value:4}},vertexShader:`void main() {
	gl_Position = vec4( position, 1.0 );
}`,fragmentShader:`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
#include <packing>
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = unpackRGBATo2Half( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ) );
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = unpackRGBAToDepth( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ) );
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( squared_mean - mean * mean );
	gl_FragColor = pack2HalfToRGBA( vec2( mean, std_dev ) );
}`}),p=d.clone();p.defines.HORIZONTAL_PASS=1;let m=new Je;m.setAttribute("position",new St(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));let x=new pe(m,d),g=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=Td;let f=this.type;function y(T,A){let B=e.update(x);d.defines.VSM_SAMPLES!==T.blurSamples&&(d.defines.VSM_SAMPLES=T.blurSamples,p.defines.VSM_SAMPLES=T.blurSamples,d.needsUpdate=!0,p.needsUpdate=!0),T.mapPass===null&&(T.mapPass=new $t(r.x,r.y)),d.uniforms.shadow_pass.value=T.map.texture,d.uniforms.resolution.value=T.mapSize,d.uniforms.radius.value=T.radius,n.setRenderTarget(T.mapPass),n.clear(),n.renderBufferDirect(A,null,B,d,x,null),p.uniforms.shadow_pass.value=T.mapPass.texture,p.uniforms.resolution.value=T.mapSize,p.uniforms.radius.value=T.radius,n.setRenderTarget(T.map),n.clear(),n.renderBufferDirect(A,null,B,p,x,null)}function v(T,A,B,U){let W=null,V=B.isPointLight===!0?T.customDistanceMaterial:T.customDepthMaterial;if(V!==void 0)W=V;else if(W=B.isPointLight===!0?l:o,n.localClippingEnabled&&A.clipShadows===!0&&Array.isArray(A.clippingPlanes)&&A.clippingPlanes.length!==0||A.displacementMap&&A.displacementScale!==0||A.alphaMap&&A.alphaTest>0||A.map&&A.alphaTest>0){let F=W.uuid,X=A.uuid,H=c[F];H===void 0&&(H={},c[F]=H);let Y=H[X];Y===void 0&&(Y=W.clone(),H[X]=Y,A.addEventListener("dispose",E)),W=Y}return W.visible=A.visible,W.wireframe=A.wireframe,W.side=U===Ki?A.shadowSide!==null?A.shadowSide:A.side:A.shadowSide!==null?A.shadowSide:u[A.side],W.alphaMap=A.alphaMap,W.alphaTest=A.alphaTest,W.map=A.map,W.clipShadows=A.clipShadows,W.clippingPlanes=A.clippingPlanes,W.clipIntersection=A.clipIntersection,W.displacementMap=A.displacementMap,W.displacementScale=A.displacementScale,W.displacementBias=A.displacementBias,W.wireframeLinewidth=A.wireframeLinewidth,W.linewidth=A.linewidth,B.isPointLight===!0&&W.isMeshDistanceMaterial===!0&&(n.properties.get(W).light=B),W}function _(T,A,B,U,W){if(T.visible===!1)return;if(T.layers.test(A.layers)&&(T.isMesh||T.isLine||T.isPoints)&&(T.castShadow||T.receiveShadow&&W===Ki)&&(!T.frustumCulled||i.intersectsObject(T))){T.modelViewMatrix.multiplyMatrices(B.matrixWorldInverse,T.matrixWorld);let F=e.update(T),X=T.material;if(Array.isArray(X)){let H=F.groups;for(let Y=0,k=H.length;Y<k;Y++){let ie=H[Y],J=X[ie.materialIndex];if(J&&J.visible){let se=v(T,J,U,W);T.onBeforeShadow(n,T,A,B,F,se,ie),n.renderBufferDirect(B,null,F,se,T,ie),T.onAfterShadow(n,T,A,B,F,se,ie)}}}else if(X.visible){let H=v(T,X,U,W);T.onBeforeShadow(n,T,A,B,F,H,null),n.renderBufferDirect(B,null,F,H,T,null),T.onAfterShadow(n,T,A,B,F,H,null)}}let V=T.children;for(let F=0,X=V.length;F<X;F++)_(V[F],A,B,U,W)}function E(T){T.target.removeEventListener("dispose",E);for(let A in c){let B=c[A],U=T.target.uuid;U in B&&(B[U].dispose(),delete B[U])}}this.render=function(T,A,B){if(g.enabled===!1||g.autoUpdate===!1&&g.needsUpdate===!1||T.length===0)return;let U=n.getRenderTarget(),W=n.getActiveCubeFace(),V=n.getActiveMipmapLevel(),F=n.state;F.setBlending(0),F.buffers.color.setClear(1,1,1,1),F.buffers.depth.setTest(!0),F.setScissorTest(!1);let X=f!==Ki&&this.type===Ki,H=f===Ki&&this.type!==Ki;for(let Y=0,k=T.length;Y<k;Y++){let ie=T[Y],J=ie.shadow;if(J===void 0){console.warn("THREE.WebGLShadowMap:",ie,"has no shadow.");continue}if(J.autoUpdate===!1&&J.needsUpdate===!1)continue;r.copy(J.mapSize);let se=J.getFrameExtents();if(r.multiply(se),s.copy(J.mapSize),(r.x>h||r.y>h)&&(r.x>h&&(s.x=Math.floor(h/se.x),r.x=s.x*se.x,J.mapSize.x=s.x),r.y>h&&(s.y=Math.floor(h/se.y),r.y=s.y*se.y,J.mapSize.y=s.y)),J.map===null||X===!0||H===!0){let $=this.type!==Ki?{minFilter:gi,magFilter:gi}:{};J.map!==null&&J.map.dispose(),J.map=new $t(r.x,r.y,$),J.map.texture.name=ie.name+".shadowMap",J.camera.updateProjectionMatrix()}n.setRenderTarget(J.map),n.clear();let le=J.getViewportCount();for(let $=0;$<le;$++){let ae=J.getViewport($);a.set(s.x*ae.x,s.y*ae.y,s.x*ae.z,s.y*ae.w),F.viewport(a),J.updateMatrices(ie,$),i=J.getFrustum(),_(A,B,J.camera,ie,this.type)}J.isPointLightShadow!==!0&&this.type===Ki&&y(J,B),J.needsUpdate=!1}f=this.type,g.needsUpdate=!1,n.setRenderTarget(U,W,V)}}var Im={0:1,2:6,4:7,3:5,1:0,6:2,7:4,5:3};function Lm(n){let e=new function(){let b=!1,L=new $e,I=null,Q=new $e(0,0,0,0);return{setMask:function(z){I===z||b||(n.colorMask(z,z,z,z),I=z)},setLocked:function(z){b=z},setClear:function(z,ee,oe,te,me){me===!0&&(z*=te,ee*=te,oe*=te),L.set(z,ee,oe,te),Q.equals(L)===!1&&(n.clearColor(z,ee,oe,te),Q.copy(L))},reset:function(){b=!1,I=null,Q.set(-1,0,0,0)}}},t=new function(){let b=!1,L=!1,I=null,Q=null,z=null;return{setReversed:function(ee){L=ee},setTest:function(ee){ee?fe(n.DEPTH_TEST):de(n.DEPTH_TEST)},setMask:function(ee){I===ee||b||(n.depthMask(ee),I=ee)},setFunc:function(ee){if(L&&(ee=Im[ee]),Q!==ee){switch(ee){case 0:n.depthFunc(n.NEVER);break;case 1:n.depthFunc(n.ALWAYS);break;case 2:n.depthFunc(n.LESS);break;case 3:default:n.depthFunc(n.LEQUAL);break;case 4:n.depthFunc(n.EQUAL);break;case 5:n.depthFunc(n.GEQUAL);break;case 6:n.depthFunc(n.GREATER);break;case 7:n.depthFunc(n.NOTEQUAL)}Q=ee}},setLocked:function(ee){b=ee},setClear:function(ee){z!==ee&&(n.clearDepth(ee),z=ee)},reset:function(){b=!1,I=null,Q=null,z=null}}},i=new function(){let b=!1,L=null,I=null,Q=null,z=null,ee=null,oe=null,te=null,me=null;return{setTest:function(ve){b||(ve?fe(n.STENCIL_TEST):de(n.STENCIL_TEST))},setMask:function(ve){L===ve||b||(n.stencilMask(ve),L=ve)},setFunc:function(ve,_e,Le){I===ve&&Q===_e&&z===Le||(n.stencilFunc(ve,_e,Le),I=ve,Q=_e,z=Le)},setOp:function(ve,_e,Le){ee===ve&&oe===_e&&te===Le||(n.stencilOp(ve,_e,Le),ee=ve,oe=_e,te=Le)},setLocked:function(ve){b=ve},setClear:function(ve){me!==ve&&(n.clearStencil(ve),me=ve)},reset:function(){b=!1,L=null,I=null,Q=null,z=null,ee=null,oe=null,te=null,me=null}}},r=new WeakMap,s=new WeakMap,a={},o={},l=new WeakMap,c=[],h=null,u=!1,d=null,p=null,m=null,x=null,g=null,f=null,y=null,v=new be(0,0,0),_=0,E=!1,T=null,A=null,B=null,U=null,W=null,V=n.getParameter(n.MAX_COMBINED_TEXTURE_IMAGE_UNITS),F=!1,X=0,H=n.getParameter(n.VERSION);H.indexOf("WebGL")!==-1?(X=parseFloat(/^WebGL (\d)/.exec(H)[1]),F=X>=1):H.indexOf("OpenGL ES")!==-1&&(X=parseFloat(/^OpenGL ES (\d)/.exec(H)[1]),F=X>=2);let Y=null,k={},ie=n.getParameter(n.SCISSOR_BOX),J=n.getParameter(n.VIEWPORT),se=new $e().fromArray(ie),le=new $e().fromArray(J);function $(b,L,I,Q){let z=new Uint8Array(4),ee=n.createTexture();n.bindTexture(b,ee),n.texParameteri(b,n.TEXTURE_MIN_FILTER,n.NEAREST),n.texParameteri(b,n.TEXTURE_MAG_FILTER,n.NEAREST);for(let oe=0;oe<I;oe++)b===n.TEXTURE_3D||b===n.TEXTURE_2D_ARRAY?n.texImage3D(L,0,n.RGBA,1,1,Q,0,n.RGBA,n.UNSIGNED_BYTE,z):n.texImage2D(L+oe,0,n.RGBA,1,1,0,n.RGBA,n.UNSIGNED_BYTE,z);return ee}let ae={};function fe(b){a[b]!==!0&&(n.enable(b),a[b]=!0)}function de(b){a[b]!==!1&&(n.disable(b),a[b]=!1)}ae[n.TEXTURE_2D]=$(n.TEXTURE_2D,n.TEXTURE_2D,1),ae[n.TEXTURE_CUBE_MAP]=$(n.TEXTURE_CUBE_MAP,n.TEXTURE_CUBE_MAP_POSITIVE_X,6),ae[n.TEXTURE_2D_ARRAY]=$(n.TEXTURE_2D_ARRAY,n.TEXTURE_2D_ARRAY,1,1),ae[n.TEXTURE_3D]=$(n.TEXTURE_3D,n.TEXTURE_3D,1,1),e.setClear(0,0,0,1),t.setClear(1),i.setClear(0),fe(n.DEPTH_TEST),t.setFunc(3),j(!1),C(1),fe(n.CULL_FACE),N(0);let R={[Fn]:n.FUNC_ADD,101:n.FUNC_SUBTRACT,102:n.FUNC_REVERSE_SUBTRACT};R[103]=n.MIN,R[104]=n.MAX;let S={200:n.ZERO,201:n.ONE,202:n.SRC_COLOR,[ql]:n.SRC_ALPHA,210:n.SRC_ALPHA_SATURATE,208:n.DST_COLOR,206:n.DST_ALPHA,203:n.ONE_MINUS_SRC_COLOR,[Yl]:n.ONE_MINUS_SRC_ALPHA,209:n.ONE_MINUS_DST_COLOR,207:n.ONE_MINUS_DST_ALPHA,211:n.CONSTANT_COLOR,212:n.ONE_MINUS_CONSTANT_COLOR,213:n.CONSTANT_ALPHA,214:n.ONE_MINUS_CONSTANT_ALPHA};function N(b,L,I,Q,z,ee,oe,te,me,ve){if(b!==0){if(u===!1&&(fe(n.BLEND),u=!0),b===5)z=z||L,ee=ee||I,oe=oe||Q,L===p&&z===g||(n.blendEquationSeparate(R[L],R[z]),p=L,g=z),I===m&&Q===x&&ee===f&&oe===y||(n.blendFuncSeparate(S[I],S[Q],S[ee],S[oe]),m=I,x=Q,f=ee,y=oe),te.equals(v)!==!1&&me===_||(n.blendColor(te.r,te.g,te.b,me),v.copy(te),_=me),d=b,E=!1;else if(b!==d||ve!==E){if(p===Fn&&g===Fn||(n.blendEquation(n.FUNC_ADD),p=Fn,g=Fn),ve)switch(b){case 1:n.blendFuncSeparate(n.ONE,n.ONE_MINUS_SRC_ALPHA,n.ONE,n.ONE_MINUS_SRC_ALPHA);break;case 2:n.blendFunc(n.ONE,n.ONE);break;case 3:n.blendFuncSeparate(n.ZERO,n.ONE_MINUS_SRC_COLOR,n.ZERO,n.ONE);break;case 4:n.blendFuncSeparate(n.ZERO,n.SRC_COLOR,n.ZERO,n.SRC_ALPHA);break;default:console.error("THREE.WebGLState: Invalid blending: ",b)}else switch(b){case 1:n.blendFuncSeparate(n.SRC_ALPHA,n.ONE_MINUS_SRC_ALPHA,n.ONE,n.ONE_MINUS_SRC_ALPHA);break;case 2:n.blendFunc(n.SRC_ALPHA,n.ONE);break;case 3:n.blendFuncSeparate(n.ZERO,n.ONE_MINUS_SRC_COLOR,n.ZERO,n.ONE);break;case 4:n.blendFunc(n.ZERO,n.SRC_COLOR);break;default:console.error("THREE.WebGLState: Invalid blending: ",b)}m=null,x=null,f=null,y=null,v.set(0,0,0),_=0,d=b,E=ve}}else u===!0&&(de(n.BLEND),u=!1)}function j(b){T!==b&&(b?n.frontFace(n.CW):n.frontFace(n.CCW),T=b)}function C(b){b!==0?(fe(n.CULL_FACE),b!==A&&(b===1?n.cullFace(n.BACK):b===2?n.cullFace(n.FRONT):n.cullFace(n.FRONT_AND_BACK))):de(n.CULL_FACE),A=b}function P(b,L,I){b?(fe(n.POLYGON_OFFSET_FILL),U===L&&W===I||(n.polygonOffset(L,I),U=L,W=I)):de(n.POLYGON_OFFSET_FILL)}return{buffers:{color:e,depth:t,stencil:i},enable:fe,disable:de,bindFramebuffer:function(b,L){return o[b]!==L&&(n.bindFramebuffer(b,L),o[b]=L,b===n.DRAW_FRAMEBUFFER&&(o[n.FRAMEBUFFER]=L),b===n.FRAMEBUFFER&&(o[n.DRAW_FRAMEBUFFER]=L),!0)},drawBuffers:function(b,L){let I=c,Q=!1;if(b){I=l.get(L),I===void 0&&(I=[],l.set(L,I));let z=b.textures;if(I.length!==z.length||I[0]!==n.COLOR_ATTACHMENT0){for(let ee=0,oe=z.length;ee<oe;ee++)I[ee]=n.COLOR_ATTACHMENT0+ee;I.length=z.length,Q=!0}}else I[0]!==n.BACK&&(I[0]=n.BACK,Q=!0);Q&&n.drawBuffers(I)},useProgram:function(b){return h!==b&&(n.useProgram(b),h=b,!0)},setBlending:N,setMaterial:function(b,L){b.side===2?de(n.CULL_FACE):fe(n.CULL_FACE);let I=b.side===Mt;L&&(I=!I),j(I),b.blending===1&&b.transparent===!1?N(0):N(b.blending,b.blendEquation,b.blendSrc,b.blendDst,b.blendEquationAlpha,b.blendSrcAlpha,b.blendDstAlpha,b.blendColor,b.blendAlpha,b.premultipliedAlpha),t.setFunc(b.depthFunc),t.setTest(b.depthTest),t.setMask(b.depthWrite),e.setMask(b.colorWrite);let Q=b.stencilWrite;i.setTest(Q),Q&&(i.setMask(b.stencilWriteMask),i.setFunc(b.stencilFunc,b.stencilRef,b.stencilFuncMask),i.setOp(b.stencilFail,b.stencilZFail,b.stencilZPass)),P(b.polygonOffset,b.polygonOffsetFactor,b.polygonOffsetUnits),b.alphaToCoverage===!0?fe(n.SAMPLE_ALPHA_TO_COVERAGE):de(n.SAMPLE_ALPHA_TO_COVERAGE)},setFlipSided:j,setCullFace:C,setLineWidth:function(b){b!==B&&(F&&n.lineWidth(b),B=b)},setPolygonOffset:P,setScissorTest:function(b){b?fe(n.SCISSOR_TEST):de(n.SCISSOR_TEST)},activeTexture:function(b){b===void 0&&(b=n.TEXTURE0+V-1),Y!==b&&(n.activeTexture(b),Y=b)},bindTexture:function(b,L,I){I===void 0&&(I=Y===null?n.TEXTURE0+V-1:Y);let Q=k[I];Q===void 0&&(Q={type:void 0,texture:void 0},k[I]=Q),Q.type===b&&Q.texture===L||(Y!==I&&(n.activeTexture(I),Y=I),n.bindTexture(b,L||ae[b]),Q.type=b,Q.texture=L)},unbindTexture:function(){let b=k[Y];b!==void 0&&b.type!==void 0&&(n.bindTexture(b.type,null),b.type=void 0,b.texture=void 0)},compressedTexImage2D:function(){try{n.compressedTexImage2D.apply(n,arguments)}catch(b){console.error("THREE.WebGLState:",b)}},compressedTexImage3D:function(){try{n.compressedTexImage3D.apply(n,arguments)}catch(b){console.error("THREE.WebGLState:",b)}},texImage2D:function(){try{n.texImage2D.apply(n,arguments)}catch(b){console.error("THREE.WebGLState:",b)}},texImage3D:function(){try{n.texImage3D.apply(n,arguments)}catch(b){console.error("THREE.WebGLState:",b)}},updateUBOMapping:function(b,L){let I=s.get(L);I===void 0&&(I=new WeakMap,s.set(L,I));let Q=I.get(b);Q===void 0&&(Q=n.getUniformBlockIndex(L,b.name),I.set(b,Q))},uniformBlockBinding:function(b,L){let I=s.get(L).get(b);r.get(L)!==I&&(n.uniformBlockBinding(L,I,b.__bindingPointIndex),r.set(L,I))},texStorage2D:function(){try{n.texStorage2D.apply(n,arguments)}catch(b){console.error("THREE.WebGLState:",b)}},texStorage3D:function(){try{n.texStorage3D.apply(n,arguments)}catch(b){console.error("THREE.WebGLState:",b)}},texSubImage2D:function(){try{n.texSubImage2D.apply(n,arguments)}catch(b){console.error("THREE.WebGLState:",b)}},texSubImage3D:function(){try{n.texSubImage3D.apply(n,arguments)}catch(b){console.error("THREE.WebGLState:",b)}},compressedTexSubImage2D:function(){try{n.compressedTexSubImage2D.apply(n,arguments)}catch(b){console.error("THREE.WebGLState:",b)}},compressedTexSubImage3D:function(){try{n.compressedTexSubImage3D.apply(n,arguments)}catch(b){console.error("THREE.WebGLState:",b)}},scissor:function(b){se.equals(b)===!1&&(n.scissor(b.x,b.y,b.z,b.w),se.copy(b))},viewport:function(b){le.equals(b)===!1&&(n.viewport(b.x,b.y,b.z,b.w),le.copy(b))},reset:function(){n.disable(n.BLEND),n.disable(n.CULL_FACE),n.disable(n.DEPTH_TEST),n.disable(n.POLYGON_OFFSET_FILL),n.disable(n.SCISSOR_TEST),n.disable(n.STENCIL_TEST),n.disable(n.SAMPLE_ALPHA_TO_COVERAGE),n.blendEquation(n.FUNC_ADD),n.blendFunc(n.ONE,n.ZERO),n.blendFuncSeparate(n.ONE,n.ZERO,n.ONE,n.ZERO),n.blendColor(0,0,0,0),n.colorMask(!0,!0,!0,!0),n.clearColor(0,0,0,0),n.depthMask(!0),n.depthFunc(n.LESS),n.clearDepth(1),n.stencilMask(4294967295),n.stencilFunc(n.ALWAYS,0,4294967295),n.stencilOp(n.KEEP,n.KEEP,n.KEEP),n.clearStencil(0),n.cullFace(n.BACK),n.frontFace(n.CCW),n.polygonOffset(0,0),n.activeTexture(n.TEXTURE0),n.bindFramebuffer(n.FRAMEBUFFER,null),n.bindFramebuffer(n.DRAW_FRAMEBUFFER,null),n.bindFramebuffer(n.READ_FRAMEBUFFER,null),n.useProgram(null),n.lineWidth(1),n.scissor(0,0,n.canvas.width,n.canvas.height),n.viewport(0,0,n.canvas.width,n.canvas.height),a={},Y=null,k={},o={},l=new WeakMap,c=[],h=null,u=!1,d=null,p=null,m=null,x=null,g=null,f=null,y=null,v=new be(0,0,0),_=0,E=!1,T=null,A=null,B=null,U=null,W=null,se.set(0,0,n.canvas.width,n.canvas.height),le.set(0,0,n.canvas.width,n.canvas.height),e.reset(),t.reset(),i.reset()}}}function sd(n,e,t,i){let r=function(s){switch(s){case nn:case Pd:return{byteLength:1,components:1};case ys:case Id:case Ii:return{byteLength:2,components:1};case Th:case Ah:return{byteLength:2,components:4};case Vn:case Eh:case Bi:return{byteLength:4,components:1};case Ld:return{byteLength:4,components:3}}throw new Error(`Unknown texture type ${s}.`)}(i);switch(t){case Ud:case Nd:return n*e;case Od:return n*e*2;case Rh:case Ch:return n*e/r.components*r.byteLength;case kd:case Ph:return n*e*2/r.components*r.byteLength;case Dd:return n*e*3/r.components*r.byteLength;case oi:case Ih:return n*e*4/r.components*r.byteLength;case Ba:case za:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*8;case Ha:case Va:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*16;case Ql:case tc:return Math.max(n,16)*Math.max(e,8)/4;case Kl:case ec:return Math.max(n,8)*Math.max(e,8)/2;case ic:case nc:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*8;case rc:case sc:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*16;case ac:return Math.floor((n+4)/5)*Math.floor((e+3)/4)*16;case oc:return Math.floor((n+4)/5)*Math.floor((e+4)/5)*16;case lc:return Math.floor((n+5)/6)*Math.floor((e+4)/5)*16;case cc:return Math.floor((n+5)/6)*Math.floor((e+5)/6)*16;case hc:return Math.floor((n+7)/8)*Math.floor((e+4)/5)*16;case uc:return Math.floor((n+7)/8)*Math.floor((e+5)/6)*16;case dc:return Math.floor((n+7)/8)*Math.floor((e+7)/8)*16;case pc:return Math.floor((n+9)/10)*Math.floor((e+4)/5)*16;case fc:return Math.floor((n+9)/10)*Math.floor((e+5)/6)*16;case mc:return Math.floor((n+9)/10)*Math.floor((e+7)/8)*16;case gc:return Math.floor((n+9)/10)*Math.floor((e+9)/10)*16;case vc:return Math.floor((n+11)/12)*Math.floor((e+9)/10)*16;case yc:return Math.floor((n+11)/12)*Math.floor((e+11)/12)*16;case Ga:case xc:case _c:return Math.ceil(n/4)*Math.ceil(e/4)*16;case Fd:case Mc:return Math.ceil(n/4)*Math.ceil(e/4)*8;case Sc:case bc:return Math.ceil(n/4)*Math.ceil(e/4)*16}throw new Error(`Unable to determine texture byte length for ${t} format.`)}function Um(n,e,t,i,r,s,a){let o=e.has("WEBGL_multisampled_render_to_texture")?e.get("WEBGL_multisampled_render_to_texture"):null,l=typeof navigator<"u"&&/OculusBrowser/g.test(navigator.userAgent),c=new re,h=new WeakMap,u,d=new WeakMap,p=!1;try{p=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function m(R,S){return p?new OffscreenCanvas(R,S):Ja("canvas")}function x(R,S,N){let j=1,C=de(R);if((C.width>N||C.height>N)&&(j=N/Math.max(C.width,C.height)),j<1){if(typeof HTMLImageElement<"u"&&R instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&R instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&R instanceof ImageBitmap||typeof VideoFrame<"u"&&R instanceof VideoFrame){let P=Math.floor(j*C.width),b=Math.floor(j*C.height);u===void 0&&(u=m(P,b));let L=S?m(P,b):u;return L.width=P,L.height=b,L.getContext("2d").drawImage(R,0,0,P,b),console.warn("THREE.WebGLRenderer: Texture has been resized from ("+C.width+"x"+C.height+") to ("+P+"x"+b+")."),L}return"data"in R&&console.warn("THREE.WebGLRenderer: Image in DataTexture is too big ("+C.width+"x"+C.height+")."),R}return R}function g(R){return R.generateMipmaps&&R.minFilter!==gi&&R.minFilter!==mi}function f(R){n.generateMipmap(R)}function y(R,S,N,j,C=!1){if(R!==null){if(n[R]!==void 0)return n[R];console.warn("THREE.WebGLRenderer: Attempt to use non-existing WebGL internal format '"+R+"'")}let P=S;if(S===n.RED&&(N===n.FLOAT&&(P=n.R32F),N===n.HALF_FLOAT&&(P=n.R16F),N===n.UNSIGNED_BYTE&&(P=n.R8)),S===n.RED_INTEGER&&(N===n.UNSIGNED_BYTE&&(P=n.R8UI),N===n.UNSIGNED_SHORT&&(P=n.R16UI),N===n.UNSIGNED_INT&&(P=n.R32UI),N===n.BYTE&&(P=n.R8I),N===n.SHORT&&(P=n.R16I),N===n.INT&&(P=n.R32I)),S===n.RG&&(N===n.FLOAT&&(P=n.RG32F),N===n.HALF_FLOAT&&(P=n.RG16F),N===n.UNSIGNED_BYTE&&(P=n.RG8)),S===n.RG_INTEGER&&(N===n.UNSIGNED_BYTE&&(P=n.RG8UI),N===n.UNSIGNED_SHORT&&(P=n.RG16UI),N===n.UNSIGNED_INT&&(P=n.RG32UI),N===n.BYTE&&(P=n.RG8I),N===n.SHORT&&(P=n.RG16I),N===n.INT&&(P=n.RG32I)),S===n.RGB_INTEGER&&(N===n.UNSIGNED_BYTE&&(P=n.RGB8UI),N===n.UNSIGNED_SHORT&&(P=n.RGB16UI),N===n.UNSIGNED_INT&&(P=n.RGB32UI),N===n.BYTE&&(P=n.RGB8I),N===n.SHORT&&(P=n.RGB16I),N===n.INT&&(P=n.RGB32I)),S===n.RGBA_INTEGER&&(N===n.UNSIGNED_BYTE&&(P=n.RGBA8UI),N===n.UNSIGNED_SHORT&&(P=n.RGBA16UI),N===n.UNSIGNED_INT&&(P=n.RGBA32UI),N===n.BYTE&&(P=n.RGBA8I),N===n.SHORT&&(P=n.RGBA16I),N===n.INT&&(P=n.RGBA32I)),S===n.RGB&&N===n.UNSIGNED_INT_5_9_9_9_REV&&(P=n.RGB9_E5),S===n.RGBA){let b=C?qa:Ye.getTransfer(j);N===n.FLOAT&&(P=n.RGBA32F),N===n.HALF_FLOAT&&(P=n.RGBA16F),N===n.UNSIGNED_BYTE&&(P=b===tt?n.SRGB8_ALPHA8:n.RGBA8),N===n.UNSIGNED_SHORT_4_4_4_4&&(P=n.RGBA4),N===n.UNSIGNED_SHORT_5_5_5_1&&(P=n.RGB5_A1)}return P!==n.R16F&&P!==n.R32F&&P!==n.RG16F&&P!==n.RG32F&&P!==n.RGBA16F&&P!==n.RGBA32F||e.get("EXT_color_buffer_float"),P}function v(R,S){let N;return R?S===null||S===Vn||S===Er?N=n.DEPTH24_STENCIL8:S===Bi?N=n.DEPTH32F_STENCIL8:S===ys&&(N=n.DEPTH24_STENCIL8,console.warn("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):S===null||S===Vn||S===Er?N=n.DEPTH_COMPONENT24:S===Bi?N=n.DEPTH_COMPONENT32F:S===ys&&(N=n.DEPTH_COMPONENT16),N}function _(R,S){return g(R)===!0||R.isFramebufferTexture&&R.minFilter!==gi&&R.minFilter!==mi?Math.log2(Math.max(S.width,S.height))+1:R.mipmaps!==void 0&&R.mipmaps.length>0?R.mipmaps.length:R.isCompressedTexture&&Array.isArray(R.image)?S.mipmaps.length:1}function E(R){let S=R.target;S.removeEventListener("dispose",E),function(N){let j=i.get(N);if(j.__webglInit===void 0)return;let C=N.source,P=d.get(C);if(P){let b=P[j.__cacheKey];b.usedTimes--,b.usedTimes===0&&A(N),Object.keys(P).length===0&&d.delete(C)}i.remove(N)}(S),S.isVideoTexture&&h.delete(S)}function T(R){let S=R.target;S.removeEventListener("dispose",T),function(N){let j=i.get(N);if(N.depthTexture&&N.depthTexture.dispose(),N.isWebGLCubeRenderTarget)for(let P=0;P<6;P++){if(Array.isArray(j.__webglFramebuffer[P]))for(let b=0;b<j.__webglFramebuffer[P].length;b++)n.deleteFramebuffer(j.__webglFramebuffer[P][b]);else n.deleteFramebuffer(j.__webglFramebuffer[P]);j.__webglDepthbuffer&&n.deleteRenderbuffer(j.__webglDepthbuffer[P])}else{if(Array.isArray(j.__webglFramebuffer))for(let P=0;P<j.__webglFramebuffer.length;P++)n.deleteFramebuffer(j.__webglFramebuffer[P]);else n.deleteFramebuffer(j.__webglFramebuffer);if(j.__webglDepthbuffer&&n.deleteRenderbuffer(j.__webglDepthbuffer),j.__webglMultisampledFramebuffer&&n.deleteFramebuffer(j.__webglMultisampledFramebuffer),j.__webglColorRenderbuffer)for(let P=0;P<j.__webglColorRenderbuffer.length;P++)j.__webglColorRenderbuffer[P]&&n.deleteRenderbuffer(j.__webglColorRenderbuffer[P]);j.__webglDepthRenderbuffer&&n.deleteRenderbuffer(j.__webglDepthRenderbuffer)}let C=N.textures;for(let P=0,b=C.length;P<b;P++){let L=i.get(C[P]);L.__webglTexture&&(n.deleteTexture(L.__webglTexture),a.memory.textures--),i.remove(C[P])}i.remove(N)}(S)}function A(R){let S=i.get(R);n.deleteTexture(S.__webglTexture);let N=R.source;delete d.get(N)[S.__cacheKey],a.memory.textures--}let B=0;function U(R,S){let N=i.get(R);if(R.isVideoTexture&&function(j){let C=a.render.frame;h.get(j)!==C&&(h.set(j,C),j.update())}(R),R.isRenderTargetTexture===!1&&R.version>0&&N.__version!==R.version){let j=R.image;if(j===null)console.warn("THREE.WebGLRenderer: Texture marked for update but no image data found.");else{if(j.complete!==!1)return void Y(N,R,S);console.warn("THREE.WebGLRenderer: Texture marked for update but image is incomplete")}}t.bindTexture(n.TEXTURE_2D,N.__webglTexture,n.TEXTURE0+S)}let W={[Hn]:n.REPEAT,[vs]:n.CLAMP_TO_EDGE,[Jl]:n.MIRRORED_REPEAT},V={[gi]:n.NEAREST,[Wp]:n.NEAREST_MIPMAP_NEAREST,[na]:n.NEAREST_MIPMAP_LINEAR,[mi]:n.LINEAR,[ol]:n.LINEAR_MIPMAP_NEAREST,[pn]:n.LINEAR_MIPMAP_LINEAR},F={512:n.NEVER,519:n.ALWAYS,513:n.LESS,[Bd]:n.LEQUAL,514:n.EQUAL,518:n.GEQUAL,516:n.GREATER,517:n.NOTEQUAL};function X(R,S){if(S.type!==Bi||e.has("OES_texture_float_linear")!==!1||S.magFilter!==mi&&S.magFilter!==ol&&S.magFilter!==na&&S.magFilter!==pn&&S.minFilter!==mi&&S.minFilter!==ol&&S.minFilter!==na&&S.minFilter!==pn||console.warn("THREE.WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),n.texParameteri(R,n.TEXTURE_WRAP_S,W[S.wrapS]),n.texParameteri(R,n.TEXTURE_WRAP_T,W[S.wrapT]),R!==n.TEXTURE_3D&&R!==n.TEXTURE_2D_ARRAY||n.texParameteri(R,n.TEXTURE_WRAP_R,W[S.wrapR]),n.texParameteri(R,n.TEXTURE_MAG_FILTER,V[S.magFilter]),n.texParameteri(R,n.TEXTURE_MIN_FILTER,V[S.minFilter]),S.compareFunction&&(n.texParameteri(R,n.TEXTURE_COMPARE_MODE,n.COMPARE_REF_TO_TEXTURE),n.texParameteri(R,n.TEXTURE_COMPARE_FUNC,F[S.compareFunction])),e.has("EXT_texture_filter_anisotropic")===!0){if(S.magFilter===gi||S.minFilter!==na&&S.minFilter!==pn||S.type===Bi&&e.has("OES_texture_float_linear")===!1)return;if(S.anisotropy>1||i.get(S).__currentAnisotropy){let N=e.get("EXT_texture_filter_anisotropic");n.texParameterf(R,N.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(S.anisotropy,r.getMaxAnisotropy())),i.get(S).__currentAnisotropy=S.anisotropy}}}function H(R,S){let N=!1;R.__webglInit===void 0&&(R.__webglInit=!0,S.addEventListener("dispose",E));let j=S.source,C=d.get(j);C===void 0&&(C={},d.set(j,C));let P=function(b){let L=[];return L.push(b.wrapS),L.push(b.wrapT),L.push(b.wrapR||0),L.push(b.magFilter),L.push(b.minFilter),L.push(b.anisotropy),L.push(b.internalFormat),L.push(b.format),L.push(b.type),L.push(b.generateMipmaps),L.push(b.premultiplyAlpha),L.push(b.flipY),L.push(b.unpackAlignment),L.push(b.colorSpace),L.join()}(S);if(P!==R.__cacheKey){C[P]===void 0&&(C[P]={texture:n.createTexture(),usedTimes:0},a.memory.textures++,N=!0),C[P].usedTimes++;let b=C[R.__cacheKey];b!==void 0&&(C[R.__cacheKey].usedTimes--,b.usedTimes===0&&A(S)),R.__cacheKey=P,R.__webglTexture=C[P].texture}return N}function Y(R,S,N){let j=n.TEXTURE_2D;(S.isDataArrayTexture||S.isCompressedArrayTexture)&&(j=n.TEXTURE_2D_ARRAY),S.isData3DTexture&&(j=n.TEXTURE_3D);let C=H(R,S),P=S.source;t.bindTexture(j,R.__webglTexture,n.TEXTURE0+N);let b=i.get(P);if(P.version!==b.__version||C===!0){t.activeTexture(n.TEXTURE0+N);let L=Ye.getPrimaries(Ye.workingColorSpace),I=S.colorSpace===xr?null:Ye.getPrimaries(S.colorSpace),Q=S.colorSpace===xr||L===I?n.NONE:n.BROWSER_DEFAULT_WEBGL;n.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,S.flipY),n.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,S.premultiplyAlpha),n.pixelStorei(n.UNPACK_ALIGNMENT,S.unpackAlignment),n.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,Q);let z=x(S.image,!1,r.maxTextureSize);z=fe(S,z);let ee=s.convert(S.format,S.colorSpace),oe=s.convert(S.type),te,me=y(S.internalFormat,ee,oe,S.colorSpace,S.isVideoTexture);X(j,S);let ve=S.mipmaps,_e=S.isVideoTexture!==!0,Le=b.__version===void 0||C===!0,Ve=P.dataReady,ze=_(S,z);if(S.isDepthTexture)me=v(S.format===Tr,S.type),Le&&(_e?t.texStorage2D(n.TEXTURE_2D,1,me,z.width,z.height):t.texImage2D(n.TEXTURE_2D,0,me,z.width,z.height,0,ee,oe,null));else if(S.isDataTexture)if(ve.length>0){_e&&Le&&t.texStorage2D(n.TEXTURE_2D,ze,me,ve[0].width,ve[0].height);for(let we=0,Xe=ve.length;we<Xe;we++)te=ve[we],_e?Ve&&t.texSubImage2D(n.TEXTURE_2D,we,0,0,te.width,te.height,ee,oe,te.data):t.texImage2D(n.TEXTURE_2D,we,me,te.width,te.height,0,ee,oe,te.data);S.generateMipmaps=!1}else _e?(Le&&t.texStorage2D(n.TEXTURE_2D,ze,me,z.width,z.height),Ve&&t.texSubImage2D(n.TEXTURE_2D,0,0,0,z.width,z.height,ee,oe,z.data)):t.texImage2D(n.TEXTURE_2D,0,me,z.width,z.height,0,ee,oe,z.data);else if(S.isCompressedTexture)if(S.isCompressedArrayTexture){_e&&Le&&t.texStorage3D(n.TEXTURE_2D_ARRAY,ze,me,ve[0].width,ve[0].height,z.depth);for(let we=0,Xe=ve.length;we<Xe;we++)if(te=ve[we],S.format!==oi)if(ee!==null)if(_e){if(Ve)if(S.layerUpdates.size>0){let Ke=sd(te.width,te.height,S.format,S.type);for(let ut of S.layerUpdates){let Se=te.data.subarray(ut*Ke/te.data.BYTES_PER_ELEMENT,(ut+1)*Ke/te.data.BYTES_PER_ELEMENT);t.compressedTexSubImage3D(n.TEXTURE_2D_ARRAY,we,0,0,ut,te.width,te.height,1,ee,Se,0,0)}S.clearLayerUpdates()}else t.compressedTexSubImage3D(n.TEXTURE_2D_ARRAY,we,0,0,0,te.width,te.height,z.depth,ee,te.data,0,0)}else t.compressedTexImage3D(n.TEXTURE_2D_ARRAY,we,me,te.width,te.height,z.depth,0,te.data,0,0);else console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else _e?Ve&&t.texSubImage3D(n.TEXTURE_2D_ARRAY,we,0,0,0,te.width,te.height,z.depth,ee,oe,te.data):t.texImage3D(n.TEXTURE_2D_ARRAY,we,me,te.width,te.height,z.depth,0,ee,oe,te.data)}else{_e&&Le&&t.texStorage2D(n.TEXTURE_2D,ze,me,ve[0].width,ve[0].height);for(let we=0,Xe=ve.length;we<Xe;we++)te=ve[we],S.format!==oi?ee!==null?_e?Ve&&t.compressedTexSubImage2D(n.TEXTURE_2D,we,0,0,te.width,te.height,ee,te.data):t.compressedTexImage2D(n.TEXTURE_2D,we,me,te.width,te.height,0,te.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):_e?Ve&&t.texSubImage2D(n.TEXTURE_2D,we,0,0,te.width,te.height,ee,oe,te.data):t.texImage2D(n.TEXTURE_2D,we,me,te.width,te.height,0,ee,oe,te.data)}else if(S.isDataArrayTexture)if(_e){if(Le&&t.texStorage3D(n.TEXTURE_2D_ARRAY,ze,me,z.width,z.height,z.depth),Ve)if(S.layerUpdates.size>0){let we=sd(z.width,z.height,S.format,S.type);for(let Xe of S.layerUpdates){let Ke=z.data.subarray(Xe*we/z.data.BYTES_PER_ELEMENT,(Xe+1)*we/z.data.BYTES_PER_ELEMENT);t.texSubImage3D(n.TEXTURE_2D_ARRAY,0,0,0,Xe,z.width,z.height,1,ee,oe,Ke)}S.clearLayerUpdates()}else t.texSubImage3D(n.TEXTURE_2D_ARRAY,0,0,0,0,z.width,z.height,z.depth,ee,oe,z.data)}else t.texImage3D(n.TEXTURE_2D_ARRAY,0,me,z.width,z.height,z.depth,0,ee,oe,z.data);else if(S.isData3DTexture)_e?(Le&&t.texStorage3D(n.TEXTURE_3D,ze,me,z.width,z.height,z.depth),Ve&&t.texSubImage3D(n.TEXTURE_3D,0,0,0,0,z.width,z.height,z.depth,ee,oe,z.data)):t.texImage3D(n.TEXTURE_3D,0,me,z.width,z.height,z.depth,0,ee,oe,z.data);else if(S.isFramebufferTexture){if(Le)if(_e)t.texStorage2D(n.TEXTURE_2D,ze,me,z.width,z.height);else{let we=z.width,Xe=z.height;for(let Ke=0;Ke<ze;Ke++)t.texImage2D(n.TEXTURE_2D,Ke,me,we,Xe,0,ee,oe,null),we>>=1,Xe>>=1}}else if(ve.length>0){if(_e&&Le){let we=de(ve[0]);t.texStorage2D(n.TEXTURE_2D,ze,me,we.width,we.height)}for(let we=0,Xe=ve.length;we<Xe;we++)te=ve[we],_e?Ve&&t.texSubImage2D(n.TEXTURE_2D,we,0,0,ee,oe,te):t.texImage2D(n.TEXTURE_2D,we,me,ee,oe,te);S.generateMipmaps=!1}else if(_e){if(Le){let we=de(z);t.texStorage2D(n.TEXTURE_2D,ze,me,we.width,we.height)}Ve&&t.texSubImage2D(n.TEXTURE_2D,0,0,0,ee,oe,z)}else t.texImage2D(n.TEXTURE_2D,0,me,ee,oe,z);g(S)&&f(j),b.__version=P.version,S.onUpdate&&S.onUpdate(S)}R.__version=S.version}function k(R,S,N,j,C,P){let b=s.convert(N.format,N.colorSpace),L=s.convert(N.type),I=y(N.internalFormat,b,L,N.colorSpace);if(!i.get(S).__hasExternalTextures){let Q=Math.max(1,S.width>>P),z=Math.max(1,S.height>>P);C===n.TEXTURE_3D||C===n.TEXTURE_2D_ARRAY?t.texImage3D(C,P,I,Q,z,S.depth,0,b,L,null):t.texImage2D(C,P,I,Q,z,0,b,L,null)}t.bindFramebuffer(n.FRAMEBUFFER,R),ae(S)?o.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,j,C,i.get(N).__webglTexture,0,$(S)):(C===n.TEXTURE_2D||C>=n.TEXTURE_CUBE_MAP_POSITIVE_X&&C<=n.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&n.framebufferTexture2D(n.FRAMEBUFFER,j,C,i.get(N).__webglTexture,P),t.bindFramebuffer(n.FRAMEBUFFER,null)}function ie(R,S,N){if(n.bindRenderbuffer(n.RENDERBUFFER,R),S.depthBuffer){let j=S.depthTexture,C=j&&j.isDepthTexture?j.type:null,P=v(S.stencilBuffer,C),b=S.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,L=$(S);ae(S)?o.renderbufferStorageMultisampleEXT(n.RENDERBUFFER,L,P,S.width,S.height):N?n.renderbufferStorageMultisample(n.RENDERBUFFER,L,P,S.width,S.height):n.renderbufferStorage(n.RENDERBUFFER,P,S.width,S.height),n.framebufferRenderbuffer(n.FRAMEBUFFER,b,n.RENDERBUFFER,R)}else{let j=S.textures;for(let C=0;C<j.length;C++){let P=j[C],b=s.convert(P.format,P.colorSpace),L=s.convert(P.type),I=y(P.internalFormat,b,L,P.colorSpace),Q=$(S);N&&ae(S)===!1?n.renderbufferStorageMultisample(n.RENDERBUFFER,Q,I,S.width,S.height):ae(S)?o.renderbufferStorageMultisampleEXT(n.RENDERBUFFER,Q,I,S.width,S.height):n.renderbufferStorage(n.RENDERBUFFER,I,S.width,S.height)}}n.bindRenderbuffer(n.RENDERBUFFER,null)}function J(R){let S=i.get(R),N=R.isWebGLCubeRenderTarget===!0;if(S.__boundDepthTexture!==R.depthTexture){let j=R.depthTexture;if(S.__depthDisposeCallback&&S.__depthDisposeCallback(),j){let C=()=>{delete S.__boundDepthTexture,delete S.__depthDisposeCallback,j.removeEventListener("dispose",C)};j.addEventListener("dispose",C),S.__depthDisposeCallback=C}S.__boundDepthTexture=j}if(R.depthTexture&&!S.__autoAllocateDepthBuffer){if(N)throw new Error("target.depthTexture not supported in Cube render targets");(function(j,C){if(C&&C.isWebGLCubeRenderTarget)throw new Error("Depth Texture with cube render targets is not supported");if(t.bindFramebuffer(n.FRAMEBUFFER,j),!C.depthTexture||!C.depthTexture.isDepthTexture)throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");i.get(C.depthTexture).__webglTexture&&C.depthTexture.image.width===C.width&&C.depthTexture.image.height===C.height||(C.depthTexture.image.width=C.width,C.depthTexture.image.height=C.height,C.depthTexture.needsUpdate=!0),U(C.depthTexture,0);let P=i.get(C.depthTexture).__webglTexture,b=$(C);if(C.depthTexture.format===xs)ae(C)?o.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,n.DEPTH_ATTACHMENT,n.TEXTURE_2D,P,0,b):n.framebufferTexture2D(n.FRAMEBUFFER,n.DEPTH_ATTACHMENT,n.TEXTURE_2D,P,0);else{if(C.depthTexture.format!==Tr)throw new Error("Unknown depthTexture format");ae(C)?o.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,n.DEPTH_STENCIL_ATTACHMENT,n.TEXTURE_2D,P,0,b):n.framebufferTexture2D(n.FRAMEBUFFER,n.DEPTH_STENCIL_ATTACHMENT,n.TEXTURE_2D,P,0)}})(S.__webglFramebuffer,R)}else if(N){S.__webglDepthbuffer=[];for(let j=0;j<6;j++)if(t.bindFramebuffer(n.FRAMEBUFFER,S.__webglFramebuffer[j]),S.__webglDepthbuffer[j]===void 0)S.__webglDepthbuffer[j]=n.createRenderbuffer(),ie(S.__webglDepthbuffer[j],R,!1);else{let C=R.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,P=S.__webglDepthbuffer[j];n.bindRenderbuffer(n.RENDERBUFFER,P),n.framebufferRenderbuffer(n.FRAMEBUFFER,C,n.RENDERBUFFER,P)}}else if(t.bindFramebuffer(n.FRAMEBUFFER,S.__webglFramebuffer),S.__webglDepthbuffer===void 0)S.__webglDepthbuffer=n.createRenderbuffer(),ie(S.__webglDepthbuffer,R,!1);else{let j=R.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,C=S.__webglDepthbuffer;n.bindRenderbuffer(n.RENDERBUFFER,C),n.framebufferRenderbuffer(n.FRAMEBUFFER,j,n.RENDERBUFFER,C)}t.bindFramebuffer(n.FRAMEBUFFER,null)}let se=[],le=[];function $(R){return Math.min(r.maxSamples,R.samples)}function ae(R){let S=i.get(R);return R.samples>0&&e.has("WEBGL_multisampled_render_to_texture")===!0&&S.__useRenderToTexture!==!1}function fe(R,S){let N=R.colorSpace,j=R.format,C=R.type;return R.isCompressedTexture===!0||R.isVideoTexture===!0||N!==_n&&N!==xr&&(Ye.getTransfer(N)===tt?j===oi&&C===nn||console.warn("THREE.WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):console.error("THREE.WebGLTextures: Unsupported texture color space:",N)),S}function de(R){return typeof HTMLImageElement<"u"&&R instanceof HTMLImageElement?(c.width=R.naturalWidth||R.width,c.height=R.naturalHeight||R.height):typeof VideoFrame<"u"&&R instanceof VideoFrame?(c.width=R.displayWidth,c.height=R.displayHeight):(c.width=R.width,c.height=R.height),c}this.allocateTextureUnit=function(){let R=B;return R>=r.maxTextures&&console.warn("THREE.WebGLTextures: Trying to use "+R+" texture units while this GPU supports only "+r.maxTextures),B+=1,R},this.resetTextureUnits=function(){B=0},this.setTexture2D=U,this.setTexture2DArray=function(R,S){let N=i.get(R);R.version>0&&N.__version!==R.version?Y(N,R,S):t.bindTexture(n.TEXTURE_2D_ARRAY,N.__webglTexture,n.TEXTURE0+S)},this.setTexture3D=function(R,S){let N=i.get(R);R.version>0&&N.__version!==R.version?Y(N,R,S):t.bindTexture(n.TEXTURE_3D,N.__webglTexture,n.TEXTURE0+S)},this.setTextureCube=function(R,S){let N=i.get(R);R.version>0&&N.__version!==R.version?function(j,C,P){if(C.image.length!==6)return;let b=H(j,C),L=C.source;t.bindTexture(n.TEXTURE_CUBE_MAP,j.__webglTexture,n.TEXTURE0+P);let I=i.get(L);if(L.version!==I.__version||b===!0){t.activeTexture(n.TEXTURE0+P);let Q=Ye.getPrimaries(Ye.workingColorSpace),z=C.colorSpace===xr?null:Ye.getPrimaries(C.colorSpace),ee=C.colorSpace===xr||Q===z?n.NONE:n.BROWSER_DEFAULT_WEBGL;n.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,C.flipY),n.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,C.premultiplyAlpha),n.pixelStorei(n.UNPACK_ALIGNMENT,C.unpackAlignment),n.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,ee);let oe=C.isCompressedTexture||C.image[0].isCompressedTexture,te=C.image[0]&&C.image[0].isDataTexture,me=[];for(let Se=0;Se<6;Se++)me[Se]=oe||te?te?C.image[Se].image:C.image[Se]:x(C.image[Se],!0,r.maxCubemapSize),me[Se]=fe(C,me[Se]);let ve=me[0],_e=s.convert(C.format,C.colorSpace),Le=s.convert(C.type),Ve=y(C.internalFormat,_e,Le,C.colorSpace),ze=C.isVideoTexture!==!0,we=I.__version===void 0||b===!0,Xe=L.dataReady,Ke,ut=_(C,ve);if(X(n.TEXTURE_CUBE_MAP,C),oe){ze&&we&&t.texStorage2D(n.TEXTURE_CUBE_MAP,ut,Ve,ve.width,ve.height);for(let Se=0;Se<6;Se++){Ke=me[Se].mipmaps;for(let Ge=0;Ge<Ke.length;Ge++){let Qe=Ke[Ge];C.format!==oi?_e!==null?ze?Xe&&t.compressedTexSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+Se,Ge,0,0,Qe.width,Qe.height,_e,Qe.data):t.compressedTexImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+Se,Ge,Ve,Qe.width,Qe.height,0,Qe.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):ze?Xe&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+Se,Ge,0,0,Qe.width,Qe.height,_e,Le,Qe.data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+Se,Ge,Ve,Qe.width,Qe.height,0,_e,Le,Qe.data)}}}else{if(Ke=C.mipmaps,ze&&we){Ke.length>0&&ut++;let Se=de(me[0]);t.texStorage2D(n.TEXTURE_CUBE_MAP,ut,Ve,Se.width,Se.height)}for(let Se=0;Se<6;Se++)if(te){ze?Xe&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+Se,0,0,0,me[Se].width,me[Se].height,_e,Le,me[Se].data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+Se,0,Ve,me[Se].width,me[Se].height,0,_e,Le,me[Se].data);for(let Ge=0;Ge<Ke.length;Ge++){let Qe=Ke[Ge].image[Se].image;ze?Xe&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+Se,Ge+1,0,0,Qe.width,Qe.height,_e,Le,Qe.data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+Se,Ge+1,Ve,Qe.width,Qe.height,0,_e,Le,Qe.data)}}else{ze?Xe&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+Se,0,0,0,_e,Le,me[Se]):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+Se,0,Ve,_e,Le,me[Se]);for(let Ge=0;Ge<Ke.length;Ge++){let Qe=Ke[Ge];ze?Xe&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+Se,Ge+1,0,0,_e,Le,Qe.image[Se]):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+Se,Ge+1,Ve,_e,Le,Qe.image[Se])}}}g(C)&&f(n.TEXTURE_CUBE_MAP),I.__version=L.version,C.onUpdate&&C.onUpdate(C)}j.__version=C.version}(N,R,S):t.bindTexture(n.TEXTURE_CUBE_MAP,N.__webglTexture,n.TEXTURE0+S)},this.rebindTextures=function(R,S,N){let j=i.get(R);S!==void 0&&k(j.__webglFramebuffer,R,R.texture,n.COLOR_ATTACHMENT0,n.TEXTURE_2D,0),N!==void 0&&J(R)},this.setupRenderTarget=function(R){let S=R.texture,N=i.get(R),j=i.get(S);R.addEventListener("dispose",T);let C=R.textures,P=R.isWebGLCubeRenderTarget===!0,b=C.length>1;if(b||(j.__webglTexture===void 0&&(j.__webglTexture=n.createTexture()),j.__version=S.version,a.memory.textures++),P){N.__webglFramebuffer=[];for(let L=0;L<6;L++)if(S.mipmaps&&S.mipmaps.length>0){N.__webglFramebuffer[L]=[];for(let I=0;I<S.mipmaps.length;I++)N.__webglFramebuffer[L][I]=n.createFramebuffer()}else N.__webglFramebuffer[L]=n.createFramebuffer()}else{if(S.mipmaps&&S.mipmaps.length>0){N.__webglFramebuffer=[];for(let L=0;L<S.mipmaps.length;L++)N.__webglFramebuffer[L]=n.createFramebuffer()}else N.__webglFramebuffer=n.createFramebuffer();if(b)for(let L=0,I=C.length;L<I;L++){let Q=i.get(C[L]);Q.__webglTexture===void 0&&(Q.__webglTexture=n.createTexture(),a.memory.textures++)}if(R.samples>0&&ae(R)===!1){N.__webglMultisampledFramebuffer=n.createFramebuffer(),N.__webglColorRenderbuffer=[],t.bindFramebuffer(n.FRAMEBUFFER,N.__webglMultisampledFramebuffer);for(let L=0;L<C.length;L++){let I=C[L];N.__webglColorRenderbuffer[L]=n.createRenderbuffer(),n.bindRenderbuffer(n.RENDERBUFFER,N.__webglColorRenderbuffer[L]);let Q=s.convert(I.format,I.colorSpace),z=s.convert(I.type),ee=y(I.internalFormat,Q,z,I.colorSpace,R.isXRRenderTarget===!0),oe=$(R);n.renderbufferStorageMultisample(n.RENDERBUFFER,oe,ee,R.width,R.height),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+L,n.RENDERBUFFER,N.__webglColorRenderbuffer[L])}n.bindRenderbuffer(n.RENDERBUFFER,null),R.depthBuffer&&(N.__webglDepthRenderbuffer=n.createRenderbuffer(),ie(N.__webglDepthRenderbuffer,R,!0)),t.bindFramebuffer(n.FRAMEBUFFER,null)}}if(P){t.bindTexture(n.TEXTURE_CUBE_MAP,j.__webglTexture),X(n.TEXTURE_CUBE_MAP,S);for(let L=0;L<6;L++)if(S.mipmaps&&S.mipmaps.length>0)for(let I=0;I<S.mipmaps.length;I++)k(N.__webglFramebuffer[L][I],R,S,n.COLOR_ATTACHMENT0,n.TEXTURE_CUBE_MAP_POSITIVE_X+L,I);else k(N.__webglFramebuffer[L],R,S,n.COLOR_ATTACHMENT0,n.TEXTURE_CUBE_MAP_POSITIVE_X+L,0);g(S)&&f(n.TEXTURE_CUBE_MAP),t.unbindTexture()}else if(b){for(let L=0,I=C.length;L<I;L++){let Q=C[L],z=i.get(Q);t.bindTexture(n.TEXTURE_2D,z.__webglTexture),X(n.TEXTURE_2D,Q),k(N.__webglFramebuffer,R,Q,n.COLOR_ATTACHMENT0+L,n.TEXTURE_2D,0),g(Q)&&f(n.TEXTURE_2D)}t.unbindTexture()}else{let L=n.TEXTURE_2D;if((R.isWebGL3DRenderTarget||R.isWebGLArrayRenderTarget)&&(L=R.isWebGL3DRenderTarget?n.TEXTURE_3D:n.TEXTURE_2D_ARRAY),t.bindTexture(L,j.__webglTexture),X(L,S),S.mipmaps&&S.mipmaps.length>0)for(let I=0;I<S.mipmaps.length;I++)k(N.__webglFramebuffer[I],R,S,n.COLOR_ATTACHMENT0,L,I);else k(N.__webglFramebuffer,R,S,n.COLOR_ATTACHMENT0,L,0);g(S)&&f(L),t.unbindTexture()}R.depthBuffer&&J(R)},this.updateRenderTargetMipmap=function(R){let S=R.textures;for(let N=0,j=S.length;N<j;N++){let C=S[N];if(g(C)){let P=R.isWebGLCubeRenderTarget?n.TEXTURE_CUBE_MAP:n.TEXTURE_2D,b=i.get(C).__webglTexture;t.bindTexture(P,b),f(P),t.unbindTexture()}}},this.updateMultisampleRenderTarget=function(R){if(R.samples>0){if(ae(R)===!1){let S=R.textures,N=R.width,j=R.height,C=n.COLOR_BUFFER_BIT,P=R.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,b=i.get(R),L=S.length>1;if(L)for(let I=0;I<S.length;I++)t.bindFramebuffer(n.FRAMEBUFFER,b.__webglMultisampledFramebuffer),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+I,n.RENDERBUFFER,null),t.bindFramebuffer(n.FRAMEBUFFER,b.__webglFramebuffer),n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0+I,n.TEXTURE_2D,null,0);t.bindFramebuffer(n.READ_FRAMEBUFFER,b.__webglMultisampledFramebuffer),t.bindFramebuffer(n.DRAW_FRAMEBUFFER,b.__webglFramebuffer);for(let I=0;I<S.length;I++){if(R.resolveDepthBuffer&&(R.depthBuffer&&(C|=n.DEPTH_BUFFER_BIT),R.stencilBuffer&&R.resolveStencilBuffer&&(C|=n.STENCIL_BUFFER_BIT)),L){n.framebufferRenderbuffer(n.READ_FRAMEBUFFER,n.COLOR_ATTACHMENT0,n.RENDERBUFFER,b.__webglColorRenderbuffer[I]);let Q=i.get(S[I]).__webglTexture;n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0,n.TEXTURE_2D,Q,0)}n.blitFramebuffer(0,0,N,j,0,0,N,j,C,n.NEAREST),l===!0&&(se.length=0,le.length=0,se.push(n.COLOR_ATTACHMENT0+I),R.depthBuffer&&R.resolveDepthBuffer===!1&&(se.push(P),le.push(P),n.invalidateFramebuffer(n.DRAW_FRAMEBUFFER,le)),n.invalidateFramebuffer(n.READ_FRAMEBUFFER,se))}if(t.bindFramebuffer(n.READ_FRAMEBUFFER,null),t.bindFramebuffer(n.DRAW_FRAMEBUFFER,null),L)for(let I=0;I<S.length;I++){t.bindFramebuffer(n.FRAMEBUFFER,b.__webglMultisampledFramebuffer),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+I,n.RENDERBUFFER,b.__webglColorRenderbuffer[I]);let Q=i.get(S[I]).__webglTexture;t.bindFramebuffer(n.FRAMEBUFFER,b.__webglFramebuffer),n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0+I,n.TEXTURE_2D,Q,0)}t.bindFramebuffer(n.DRAW_FRAMEBUFFER,b.__webglMultisampledFramebuffer)}else if(R.depthBuffer&&R.resolveDepthBuffer===!1&&l){let S=R.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT;n.invalidateFramebuffer(n.DRAW_FRAMEBUFFER,[S])}}},this.setupDepthRenderbuffer=J,this.setupFrameBufferTexture=k,this.useMultisampledRTT=ae}function Dm(n,e){return{convert:function(t,i=""){let r,s=Ye.getTransfer(i);if(t===nn)return n.UNSIGNED_BYTE;if(t===Th)return n.UNSIGNED_SHORT_4_4_4_4;if(t===Ah)return n.UNSIGNED_SHORT_5_5_5_1;if(t===Ld)return n.UNSIGNED_INT_5_9_9_9_REV;if(t===Pd)return n.BYTE;if(t===Id)return n.SHORT;if(t===ys)return n.UNSIGNED_SHORT;if(t===Eh)return n.INT;if(t===Vn)return n.UNSIGNED_INT;if(t===Bi)return n.FLOAT;if(t===Ii)return n.HALF_FLOAT;if(t===Ud)return n.ALPHA;if(t===Dd)return n.RGB;if(t===oi)return n.RGBA;if(t===Nd)return n.LUMINANCE;if(t===Od)return n.LUMINANCE_ALPHA;if(t===xs)return n.DEPTH_COMPONENT;if(t===Tr)return n.DEPTH_STENCIL;if(t===Rh)return n.RED;if(t===Ch)return n.RED_INTEGER;if(t===kd)return n.RG;if(t===Ph)return n.RG_INTEGER;if(t===Ih)return n.RGBA_INTEGER;if(t===Ba||t===za||t===Ha||t===Va)if(s===tt){if(r=e.get("WEBGL_compressed_texture_s3tc_srgb"),r===null)return null;if(t===Ba)return r.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(t===za)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(t===Ha)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(t===Va)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else{if(r=e.get("WEBGL_compressed_texture_s3tc"),r===null)return null;if(t===Ba)return r.COMPRESSED_RGB_S3TC_DXT1_EXT;if(t===za)return r.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(t===Ha)return r.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(t===Va)return r.COMPRESSED_RGBA_S3TC_DXT5_EXT}if(t===Kl||t===Ql||t===ec||t===tc){if(r=e.get("WEBGL_compressed_texture_pvrtc"),r===null)return null;if(t===Kl)return r.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(t===Ql)return r.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(t===ec)return r.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(t===tc)return r.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}if(t===ic||t===nc||t===rc){if(r=e.get("WEBGL_compressed_texture_etc"),r===null)return null;if(t===ic||t===nc)return s===tt?r.COMPRESSED_SRGB8_ETC2:r.COMPRESSED_RGB8_ETC2;if(t===rc)return s===tt?r.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:r.COMPRESSED_RGBA8_ETC2_EAC}if(t===sc||t===ac||t===oc||t===lc||t===cc||t===hc||t===uc||t===dc||t===pc||t===fc||t===mc||t===gc||t===vc||t===yc){if(r=e.get("WEBGL_compressed_texture_astc"),r===null)return null;if(t===sc)return s===tt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:r.COMPRESSED_RGBA_ASTC_4x4_KHR;if(t===ac)return s===tt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:r.COMPRESSED_RGBA_ASTC_5x4_KHR;if(t===oc)return s===tt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:r.COMPRESSED_RGBA_ASTC_5x5_KHR;if(t===lc)return s===tt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:r.COMPRESSED_RGBA_ASTC_6x5_KHR;if(t===cc)return s===tt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:r.COMPRESSED_RGBA_ASTC_6x6_KHR;if(t===hc)return s===tt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:r.COMPRESSED_RGBA_ASTC_8x5_KHR;if(t===uc)return s===tt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:r.COMPRESSED_RGBA_ASTC_8x6_KHR;if(t===dc)return s===tt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:r.COMPRESSED_RGBA_ASTC_8x8_KHR;if(t===pc)return s===tt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:r.COMPRESSED_RGBA_ASTC_10x5_KHR;if(t===fc)return s===tt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:r.COMPRESSED_RGBA_ASTC_10x6_KHR;if(t===mc)return s===tt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:r.COMPRESSED_RGBA_ASTC_10x8_KHR;if(t===gc)return s===tt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:r.COMPRESSED_RGBA_ASTC_10x10_KHR;if(t===vc)return s===tt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:r.COMPRESSED_RGBA_ASTC_12x10_KHR;if(t===yc)return s===tt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:r.COMPRESSED_RGBA_ASTC_12x12_KHR}if(t===Ga||t===xc||t===_c){if(r=e.get("EXT_texture_compression_bptc"),r===null)return null;if(t===Ga)return s===tt?r.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:r.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(t===xc)return r.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(t===_c)return r.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}if(t===Fd||t===Mc||t===Sc||t===bc){if(r=e.get("EXT_texture_compression_rgtc"),r===null)return null;if(t===Ga)return r.COMPRESSED_RED_RGTC1_EXT;if(t===Mc)return r.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(t===Sc)return r.COMPRESSED_RED_GREEN_RGTC2_EXT;if(t===bc)return r.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}return t===Er?n.UNSIGNED_INT_24_8:n[t]!==void 0?n[t]:null}}}var zc=class extends It{constructor(e=[]){super(),this.isArrayCamera=!0,this.cameras=e}},Zt=class extends xt{constructor(){super(),this.isGroup=!0,this.type="Group"}},Nm={type:"move"},fs=class{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new Zt,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new Zt,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new M,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new M),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new Zt,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new M,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new M),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){let t=this._hand;if(t)for(let i of e.hand.values())this._getHandJoint(t,i)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){return this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,i){let r=null,s=null,a=null,o=this._targetRay,l=this._grip,c=this._hand;if(e&&t.session.visibilityState!=="visible-blurred"){if(c&&e.hand){a=!0;for(let x of e.hand.values()){let g=t.getJointPose(x,i),f=this._getHandJoint(c,x);g!==null&&(f.matrix.fromArray(g.transform.matrix),f.matrix.decompose(f.position,f.rotation,f.scale),f.matrixWorldNeedsUpdate=!0,f.jointRadius=g.radius),f.visible=g!==null}let h=c.joints["index-finger-tip"],u=c.joints["thumb-tip"],d=h.position.distanceTo(u.position),p=.02,m=.005;c.inputState.pinching&&d>p+m?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!c.inputState.pinching&&d<=p-m&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else l!==null&&e.gripSpace&&(s=t.getPose(e.gripSpace,i),s!==null&&(l.matrix.fromArray(s.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,s.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(s.linearVelocity)):l.hasLinearVelocity=!1,s.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(s.angularVelocity)):l.hasAngularVelocity=!1));o!==null&&(r=t.getPose(e.targetRaySpace,i),r===null&&s!==null&&(r=s),r!==null&&(o.matrix.fromArray(r.transform.matrix),o.matrix.decompose(o.position,o.rotation,o.scale),o.matrixWorldNeedsUpdate=!0,r.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(r.linearVelocity)):o.hasLinearVelocity=!1,r.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(r.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent(Nm)))}return o!==null&&(o.visible=r!==null),l!==null&&(l.visible=s!==null),c!==null&&(c.visible=a!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){let i=new Zt;i.matrixAutoUpdate=!1,i.visible=!1,e.joints[t.jointName]=i,e.add(i)}return e.joints[t.jointName]}},Hc=class{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,t,i){if(this.texture===null){let r=new ti;e.properties.get(r).__webglTexture=t.texture,t.depthNear==i.depthNear&&t.depthFar==i.depthFar||(this.depthNear=t.depthNear,this.depthFar=t.depthFar),this.texture=r}}getMesh(e){if(this.texture!==null&&this.mesh===null){let t=e.cameras[0].viewport,i=new mt({vertexShader:`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,fragmentShader:`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`,uniforms:{depthColor:{value:this.texture},depthWidth:{value:t.z},depthHeight:{value:t.w}}});this.mesh=new pe(new Ms(20,20),i)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}},Vc=class extends gn{constructor(e,t){super();let i=this,r=null,s=1,a=null,o="local-floor",l=1,c=null,h=null,u=null,d=null,p=null,m=null,x=new Hc,g=t.getContextAttributes(),f=null,y=null,v=[],_=[],E=new re,T=null,A=new It;A.layers.enable(1),A.viewport=new $e;let B=new It;B.layers.enable(2),B.viewport=new $e;let U=[A,B],W=new zc;W.layers.enable(1),W.layers.enable(2);let V=null,F=null;function X($){let ae=_.indexOf($.inputSource);if(ae===-1)return;let fe=v[ae];fe!==void 0&&(fe.update($.inputSource,$.frame,c||a),fe.dispatchEvent({type:$.type,data:$.inputSource}))}function H(){r.removeEventListener("select",X),r.removeEventListener("selectstart",X),r.removeEventListener("selectend",X),r.removeEventListener("squeeze",X),r.removeEventListener("squeezestart",X),r.removeEventListener("squeezeend",X),r.removeEventListener("end",H),r.removeEventListener("inputsourceschange",Y);for(let $=0;$<v.length;$++){let ae=_[$];ae!==null&&(_[$]=null,v[$].disconnect(ae))}V=null,F=null,x.reset(),e.setRenderTarget(f),p=null,d=null,u=null,r=null,y=null,le.stop(),i.isPresenting=!1,e.setPixelRatio(T),e.setSize(E.width,E.height,!1),i.dispatchEvent({type:"sessionend"})}function Y($){for(let ae=0;ae<$.removed.length;ae++){let fe=$.removed[ae],de=_.indexOf(fe);de>=0&&(_[de]=null,v[de].disconnect(fe))}for(let ae=0;ae<$.added.length;ae++){let fe=$.added[ae],de=_.indexOf(fe);if(de===-1){for(let S=0;S<v.length;S++){if(S>=_.length){_.push(fe),de=S;break}if(_[S]===null){_[S]=fe,de=S;break}}if(de===-1)break}let R=v[de];R&&R.connect(fe)}}this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function($){let ae=v[$];return ae===void 0&&(ae=new fs,v[$]=ae),ae.getTargetRaySpace()},this.getControllerGrip=function($){let ae=v[$];return ae===void 0&&(ae=new fs,v[$]=ae),ae.getGripSpace()},this.getHand=function($){let ae=v[$];return ae===void 0&&(ae=new fs,v[$]=ae),ae.getHandSpace()},this.setFramebufferScaleFactor=function($){s=$,i.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function($){o=$,i.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||a},this.setReferenceSpace=function($){c=$},this.getBaseLayer=function(){return d!==null?d:p},this.getBinding=function(){return u},this.getFrame=function(){return m},this.getSession=function(){return r},this.setSession=async function($){if(r=$,r!==null){if(f=e.getRenderTarget(),r.addEventListener("select",X),r.addEventListener("selectstart",X),r.addEventListener("selectend",X),r.addEventListener("squeeze",X),r.addEventListener("squeezestart",X),r.addEventListener("squeezeend",X),r.addEventListener("end",H),r.addEventListener("inputsourceschange",Y),g.xrCompatible!==!0&&await t.makeXRCompatible(),T=e.getPixelRatio(),e.getSize(E),r.renderState.layers===void 0){let ae={antialias:g.antialias,alpha:!0,depth:g.depth,stencil:g.stencil,framebufferScaleFactor:s};p=new XRWebGLLayer(r,t,ae),r.updateRenderState({baseLayer:p}),e.setPixelRatio(1),e.setSize(p.framebufferWidth,p.framebufferHeight,!1),y=new $t(p.framebufferWidth,p.framebufferHeight,{format:oi,type:nn,colorSpace:e.outputColorSpace,stencilBuffer:g.stencil})}else{let ae=null,fe=null,de=null;g.depth&&(de=g.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,ae=g.stencil?Tr:xs,fe=g.stencil?Er:Vn);let R={colorFormat:t.RGBA8,depthFormat:de,scaleFactor:s};u=new XRWebGLBinding(r,t),d=u.createProjectionLayer(R),r.updateRenderState({layers:[d]}),e.setPixelRatio(1),e.setSize(d.textureWidth,d.textureHeight,!1),y=new $t(d.textureWidth,d.textureHeight,{format:oi,type:nn,depthTexture:new ro(d.textureWidth,d.textureHeight,fe,void 0,void 0,void 0,void 0,void 0,void 0,ae),stencilBuffer:g.stencil,colorSpace:e.outputColorSpace,samples:g.antialias?4:0,resolveDepthBuffer:d.ignoreDepthValues===!1})}y.isXRRenderTarget=!0,this.setFoveation(l),c=null,a=await r.requestReferenceSpace(o),le.setContext(r),le.start(),i.isPresenting=!0,i.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(r!==null)return r.environmentBlendMode},this.getDepthTexture=function(){return x.getDepthTexture()};let k=new M,ie=new M;function J($,ae){ae===null?$.matrixWorld.copy($.matrix):$.matrixWorld.multiplyMatrices(ae.matrixWorld,$.matrix),$.matrixWorldInverse.copy($.matrixWorld).invert()}this.updateCamera=function($){if(r===null)return;let ae=$.near,fe=$.far;x.texture!==null&&(x.depthNear>0&&(ae=x.depthNear),x.depthFar>0&&(fe=x.depthFar)),W.near=B.near=A.near=ae,W.far=B.far=A.far=fe,V===W.near&&F===W.far||(r.updateRenderState({depthNear:W.near,depthFar:W.far}),V=W.near,F=W.far);let de=$.parent,R=W.cameras;J(W,de);for(let S=0;S<R.length;S++)J(R[S],de);R.length===2?function(S,N,j){k.setFromMatrixPosition(N.matrixWorld),ie.setFromMatrixPosition(j.matrixWorld);let C=k.distanceTo(ie),P=N.projectionMatrix.elements,b=j.projectionMatrix.elements,L=P[14]/(P[10]-1),I=P[14]/(P[10]+1),Q=(P[9]+1)/P[5],z=(P[9]-1)/P[5],ee=(P[8]-1)/P[0],oe=(b[8]+1)/b[0],te=L*ee,me=L*oe,ve=C/(-ee+oe),_e=ve*-ee;if(N.matrixWorld.decompose(S.position,S.quaternion,S.scale),S.translateX(_e),S.translateZ(ve),S.matrixWorld.compose(S.position,S.quaternion,S.scale),S.matrixWorldInverse.copy(S.matrixWorld).invert(),P[10]===-1)S.projectionMatrix.copy(N.projectionMatrix),S.projectionMatrixInverse.copy(N.projectionMatrixInverse);else{let Le=L+ve,Ve=I+ve,ze=te-_e,we=me+(C-_e),Xe=Q*I/Ve*Le,Ke=z*I/Ve*Le;S.projectionMatrix.makePerspective(ze,we,Xe,Ke,Le,Ve),S.projectionMatrixInverse.copy(S.projectionMatrix).invert()}}(W,A,B):W.projectionMatrix.copy(A.projectionMatrix),function(S,N,j){j===null?S.matrix.copy(N.matrixWorld):(S.matrix.copy(j.matrixWorld),S.matrix.invert(),S.matrix.multiply(N.matrixWorld)),S.matrix.decompose(S.position,S.quaternion,S.scale),S.updateMatrixWorld(!0),S.projectionMatrix.copy(N.projectionMatrix),S.projectionMatrixInverse.copy(N.projectionMatrixInverse),S.isPerspectiveCamera&&(S.fov=2*Tc*Math.atan(1/S.projectionMatrix.elements[5]),S.zoom=1)}($,W,de)},this.getCamera=function(){return W},this.getFoveation=function(){if(d!==null||p!==null)return l},this.setFoveation=function($){l=$,d!==null&&(d.fixedFoveation=$),p!==null&&p.fixedFoveation!==void 0&&(p.fixedFoveation=$)},this.hasDepthSensing=function(){return x.texture!==null},this.getDepthSensingMesh=function(){return x.getMesh(W)};let se=null,le=new Gd;le.setAnimationLoop(function($,ae){if(h=ae.getViewerPose(c||a),m=ae,h!==null){let fe=h.views;p!==null&&(e.setRenderTargetFramebuffer(y,p.framebuffer),e.setRenderTarget(y));let de=!1;fe.length!==W.cameras.length&&(W.cameras.length=0,de=!0);for(let S=0;S<fe.length;S++){let N=fe[S],j=null;if(p!==null)j=p.getViewport(N);else{let P=u.getViewSubImage(d,N);j=P.viewport,S===0&&(e.setRenderTargetTextures(y,P.colorTexture,d.ignoreDepthValues?void 0:P.depthStencilTexture),e.setRenderTarget(y))}let C=U[S];C===void 0&&(C=new It,C.layers.enable(S),C.viewport=new $e,U[S]=C),C.matrix.fromArray(N.transform.matrix),C.matrix.decompose(C.position,C.quaternion,C.scale),C.projectionMatrix.fromArray(N.projectionMatrix),C.projectionMatrixInverse.copy(C.projectionMatrix).invert(),C.viewport.set(j.x,j.y,j.width,j.height),S===0&&(W.matrix.copy(C.matrix),W.matrix.decompose(W.position,W.quaternion,W.scale)),de===!0&&W.cameras.push(C)}let R=r.enabledFeatures;if(R&&R.includes("depth-sensing")){let S=u.getDepthInformation(fe[0]);S&&S.isValid&&S.texture&&x.init(e,S,r.renderState)}}for(let fe=0;fe<v.length;fe++){let de=_[fe],R=v[fe];de!==null&&R!==void 0&&R.update(de,ae,c||a)}se&&se($,ae),ae.detectedPlanes&&i.dispatchEvent({type:"planesdetected",data:ae}),m=null}),this.setAnimationLoop=function($){se=$},this.dispose=function(){}}},On=new li,Om=new Ie;function km(n,e){function t(r,s){r.matrixAutoUpdate===!0&&r.updateMatrix(),s.value.copy(r.matrix)}function i(r,s){r.opacity.value=s.opacity,s.color&&r.diffuse.value.copy(s.color),s.emissive&&r.emissive.value.copy(s.emissive).multiplyScalar(s.emissiveIntensity),s.map&&(r.map.value=s.map,t(s.map,r.mapTransform)),s.alphaMap&&(r.alphaMap.value=s.alphaMap,t(s.alphaMap,r.alphaMapTransform)),s.bumpMap&&(r.bumpMap.value=s.bumpMap,t(s.bumpMap,r.bumpMapTransform),r.bumpScale.value=s.bumpScale,s.side===Mt&&(r.bumpScale.value*=-1)),s.normalMap&&(r.normalMap.value=s.normalMap,t(s.normalMap,r.normalMapTransform),r.normalScale.value.copy(s.normalScale),s.side===Mt&&r.normalScale.value.negate()),s.displacementMap&&(r.displacementMap.value=s.displacementMap,t(s.displacementMap,r.displacementMapTransform),r.displacementScale.value=s.displacementScale,r.displacementBias.value=s.displacementBias),s.emissiveMap&&(r.emissiveMap.value=s.emissiveMap,t(s.emissiveMap,r.emissiveMapTransform)),s.specularMap&&(r.specularMap.value=s.specularMap,t(s.specularMap,r.specularMapTransform)),s.alphaTest>0&&(r.alphaTest.value=s.alphaTest);let a=e.get(s),o=a.envMap,l=a.envMapRotation;o&&(r.envMap.value=o,On.copy(l),On.x*=-1,On.y*=-1,On.z*=-1,o.isCubeTexture&&o.isRenderTargetTexture===!1&&(On.y*=-1,On.z*=-1),r.envMapRotation.value.setFromMatrix4(Om.makeRotationFromEuler(On)),r.flipEnvMap.value=o.isCubeTexture&&o.isRenderTargetTexture===!1?-1:1,r.reflectivity.value=s.reflectivity,r.ior.value=s.ior,r.refractionRatio.value=s.refractionRatio),s.lightMap&&(r.lightMap.value=s.lightMap,r.lightMapIntensity.value=s.lightMapIntensity,t(s.lightMap,r.lightMapTransform)),s.aoMap&&(r.aoMap.value=s.aoMap,r.aoMapIntensity.value=s.aoMapIntensity,t(s.aoMap,r.aoMapTransform))}return{refreshFogUniforms:function(r,s){s.color.getRGB(r.fogColor.value,Vd(n)),s.isFog?(r.fogNear.value=s.near,r.fogFar.value=s.far):s.isFogExp2&&(r.fogDensity.value=s.density)},refreshMaterialUniforms:function(r,s,a,o,l){s.isMeshBasicMaterial||s.isMeshLambertMaterial?i(r,s):s.isMeshToonMaterial?(i(r,s),function(c,h){h.gradientMap&&(c.gradientMap.value=h.gradientMap)}(r,s)):s.isMeshPhongMaterial?(i(r,s),function(c,h){c.specular.value.copy(h.specular),c.shininess.value=Math.max(h.shininess,1e-4)}(r,s)):s.isMeshStandardMaterial?(i(r,s),function(c,h){c.metalness.value=h.metalness,h.metalnessMap&&(c.metalnessMap.value=h.metalnessMap,t(h.metalnessMap,c.metalnessMapTransform)),c.roughness.value=h.roughness,h.roughnessMap&&(c.roughnessMap.value=h.roughnessMap,t(h.roughnessMap,c.roughnessMapTransform)),h.envMap&&(c.envMapIntensity.value=h.envMapIntensity)}(r,s),s.isMeshPhysicalMaterial&&function(c,h,u){c.ior.value=h.ior,h.sheen>0&&(c.sheenColor.value.copy(h.sheenColor).multiplyScalar(h.sheen),c.sheenRoughness.value=h.sheenRoughness,h.sheenColorMap&&(c.sheenColorMap.value=h.sheenColorMap,t(h.sheenColorMap,c.sheenColorMapTransform)),h.sheenRoughnessMap&&(c.sheenRoughnessMap.value=h.sheenRoughnessMap,t(h.sheenRoughnessMap,c.sheenRoughnessMapTransform))),h.clearcoat>0&&(c.clearcoat.value=h.clearcoat,c.clearcoatRoughness.value=h.clearcoatRoughness,h.clearcoatMap&&(c.clearcoatMap.value=h.clearcoatMap,t(h.clearcoatMap,c.clearcoatMapTransform)),h.clearcoatRoughnessMap&&(c.clearcoatRoughnessMap.value=h.clearcoatRoughnessMap,t(h.clearcoatRoughnessMap,c.clearcoatRoughnessMapTransform)),h.clearcoatNormalMap&&(c.clearcoatNormalMap.value=h.clearcoatNormalMap,t(h.clearcoatNormalMap,c.clearcoatNormalMapTransform),c.clearcoatNormalScale.value.copy(h.clearcoatNormalScale),h.side===Mt&&c.clearcoatNormalScale.value.negate())),h.dispersion>0&&(c.dispersion.value=h.dispersion),h.iridescence>0&&(c.iridescence.value=h.iridescence,c.iridescenceIOR.value=h.iridescenceIOR,c.iridescenceThicknessMinimum.value=h.iridescenceThicknessRange[0],c.iridescenceThicknessMaximum.value=h.iridescenceThicknessRange[1],h.iridescenceMap&&(c.iridescenceMap.value=h.iridescenceMap,t(h.iridescenceMap,c.iridescenceMapTransform)),h.iridescenceThicknessMap&&(c.iridescenceThicknessMap.value=h.iridescenceThicknessMap,t(h.iridescenceThicknessMap,c.iridescenceThicknessMapTransform))),h.transmission>0&&(c.transmission.value=h.transmission,c.transmissionSamplerMap.value=u.texture,c.transmissionSamplerSize.value.set(u.width,u.height),h.transmissionMap&&(c.transmissionMap.value=h.transmissionMap,t(h.transmissionMap,c.transmissionMapTransform)),c.thickness.value=h.thickness,h.thicknessMap&&(c.thicknessMap.value=h.thicknessMap,t(h.thicknessMap,c.thicknessMapTransform)),c.attenuationDistance.value=h.attenuationDistance,c.attenuationColor.value.copy(h.attenuationColor)),h.anisotropy>0&&(c.anisotropyVector.value.set(h.anisotropy*Math.cos(h.anisotropyRotation),h.anisotropy*Math.sin(h.anisotropyRotation)),h.anisotropyMap&&(c.anisotropyMap.value=h.anisotropyMap,t(h.anisotropyMap,c.anisotropyMapTransform))),c.specularIntensity.value=h.specularIntensity,c.specularColor.value.copy(h.specularColor),h.specularColorMap&&(c.specularColorMap.value=h.specularColorMap,t(h.specularColorMap,c.specularColorMapTransform)),h.specularIntensityMap&&(c.specularIntensityMap.value=h.specularIntensityMap,t(h.specularIntensityMap,c.specularIntensityMapTransform))}(r,s,l)):s.isMeshMatcapMaterial?(i(r,s),function(c,h){h.matcap&&(c.matcap.value=h.matcap)}(r,s)):s.isMeshDepthMaterial?i(r,s):s.isMeshDistanceMaterial?(i(r,s),function(c,h){let u=e.get(h).light;c.referencePosition.value.setFromMatrixPosition(u.matrixWorld),c.nearDistance.value=u.shadow.camera.near,c.farDistance.value=u.shadow.camera.far}(r,s)):s.isMeshNormalMaterial?i(r,s):s.isLineBasicMaterial?(function(c,h){c.diffuse.value.copy(h.color),c.opacity.value=h.opacity,h.map&&(c.map.value=h.map,t(h.map,c.mapTransform))}(r,s),s.isLineDashedMaterial&&function(c,h){c.dashSize.value=h.dashSize,c.totalSize.value=h.dashSize+h.gapSize,c.scale.value=h.scale}(r,s)):s.isPointsMaterial?function(c,h,u,d){c.diffuse.value.copy(h.color),c.opacity.value=h.opacity,c.size.value=h.size*u,c.scale.value=.5*d,h.map&&(c.map.value=h.map,t(h.map,c.uvTransform)),h.alphaMap&&(c.alphaMap.value=h.alphaMap,t(h.alphaMap,c.alphaMapTransform)),h.alphaTest>0&&(c.alphaTest.value=h.alphaTest)}(r,s,a,o):s.isSpriteMaterial?function(c,h){c.diffuse.value.copy(h.color),c.opacity.value=h.opacity,c.rotation.value=h.rotation,h.map&&(c.map.value=h.map,t(h.map,c.mapTransform)),h.alphaMap&&(c.alphaMap.value=h.alphaMap,t(h.alphaMap,c.alphaMapTransform)),h.alphaTest>0&&(c.alphaTest.value=h.alphaTest)}(r,s):s.isShadowMaterial?(r.color.value.copy(s.color),r.opacity.value=s.opacity):s.isShaderMaterial&&(s.uniformsNeedUpdate=!1)}}}function Fm(n,e,t,i){let r={},s={},a=[],o=n.getParameter(n.MAX_UNIFORM_BUFFER_BINDINGS);function l(u,d,p,m){let x=u.value,g=d+"_"+p;if(m[g]===void 0)return m[g]=typeof x=="number"||typeof x=="boolean"?x:x.clone(),!0;{let f=m[g];if(typeof x=="number"||typeof x=="boolean"){if(f!==x)return m[g]=x,!0}else if(f.equals(x)===!1)return f.copy(x),!0}return!1}function c(u){let d={boundary:0,storage:0};return typeof u=="number"||typeof u=="boolean"?(d.boundary=4,d.storage=4):u.isVector2?(d.boundary=8,d.storage=8):u.isVector3||u.isColor?(d.boundary=16,d.storage=12):u.isVector4?(d.boundary=16,d.storage=16):u.isMatrix3?(d.boundary=48,d.storage=48):u.isMatrix4?(d.boundary=64,d.storage=64):u.isTexture?console.warn("THREE.WebGLRenderer: Texture samplers can not be part of an uniforms group."):console.warn("THREE.WebGLRenderer: Unsupported uniform value type.",u),d}function h(u){let d=u.target;d.removeEventListener("dispose",h);let p=a.indexOf(d.__bindingPointIndex);a.splice(p,1),n.deleteBuffer(r[d.id]),delete r[d.id],delete s[d.id]}return{bind:function(u,d){let p=d.program;i.uniformBlockBinding(u,p)},update:function(u,d){let p=r[u.id];p===void 0&&(function(g){let f=g.uniforms,y=0,v=16;for(let E=0,T=f.length;E<T;E++){let A=Array.isArray(f[E])?f[E]:[f[E]];for(let B=0,U=A.length;B<U;B++){let W=A[B],V=Array.isArray(W.value)?W.value:[W.value];for(let F=0,X=V.length;F<X;F++){let H=c(V[F]),Y=y%v,k=Y%H.boundary,ie=Y+k;y+=k,ie!==0&&v-ie<H.storage&&(y+=v-ie),W.__data=new Float32Array(H.storage/Float32Array.BYTES_PER_ELEMENT),W.__offset=y,y+=H.storage}}}let _=y%v;_>0&&(y+=v-_),g.__size=y,g.__cache={}}(u),p=function(g){let f=function(){for(let E=0;E<o;E++)if(a.indexOf(E)===-1)return a.push(E),E;return console.error("THREE.WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}();g.__bindingPointIndex=f;let y=n.createBuffer(),v=g.__size,_=g.usage;return n.bindBuffer(n.UNIFORM_BUFFER,y),n.bufferData(n.UNIFORM_BUFFER,v,_),n.bindBuffer(n.UNIFORM_BUFFER,null),n.bindBufferBase(n.UNIFORM_BUFFER,f,y),y}(u),r[u.id]=p,u.addEventListener("dispose",h));let m=d.program;i.updateUBOMapping(u,m);let x=e.render.frame;s[u.id]!==x&&(function(g){let f=r[g.id],y=g.uniforms,v=g.__cache;n.bindBuffer(n.UNIFORM_BUFFER,f);for(let _=0,E=y.length;_<E;_++){let T=Array.isArray(y[_])?y[_]:[y[_]];for(let A=0,B=T.length;A<B;A++){let U=T[A];if(l(U,_,A,v)===!0){let W=U.__offset,V=Array.isArray(U.value)?U.value:[U.value],F=0;for(let X=0;X<V.length;X++){let H=V[X],Y=c(H);typeof H=="number"||typeof H=="boolean"?(U.__data[0]=H,n.bufferSubData(n.UNIFORM_BUFFER,W+F,U.__data)):H.isMatrix3?(U.__data[0]=H.elements[0],U.__data[1]=H.elements[1],U.__data[2]=H.elements[2],U.__data[3]=0,U.__data[4]=H.elements[3],U.__data[5]=H.elements[4],U.__data[6]=H.elements[5],U.__data[7]=0,U.__data[8]=H.elements[6],U.__data[9]=H.elements[7],U.__data[10]=H.elements[8],U.__data[11]=0):(H.toArray(U.__data,F),F+=Y.storage/Float32Array.BYTES_PER_ELEMENT)}n.bufferSubData(n.UNIFORM_BUFFER,W,U.__data)}}}n.bindBuffer(n.UNIFORM_BUFFER,null)}(u),s[u.id]=x)},dispose:function(){for(let u in r)n.deleteBuffer(r[u]);a=[],r={},s={}}}}var so=class{constructor(e={}){let{canvas:t=jp(),context:i=null,depth:r=!0,stencil:s=!1,alpha:a=!1,antialias:o=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:c=!1,powerPreference:h="default",failIfMajorPerformanceCaveat:u=!1}=e,d;if(this.isWebGLRenderer=!0,i!==null){if(typeof WebGLRenderingContext<"u"&&i instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");d=i.getContextAttributes().alpha}else d=a;let p=new Uint32Array(4),m=new Int32Array(4),x=null,g=null,f=[],y=[];this.domElement=t,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this._outputColorSpace=Vt,this.toneMapping=fn,this.toneMappingExposure=1;let v=this,_=!1,E=0,T=0,A=null,B=-1,U=null,W=new $e,V=new $e,F=null,X=new be(0),H=0,Y=t.width,k=t.height,ie=1,J=null,se=null,le=new $e(0,0,Y,k),$=new $e(0,0,Y,k),ae=!1,fe=new Pr,de=!1,R=!1,S=new Ie,N=new Ie,j=new M,C=new $e,P={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0},b=!1;function L(){return A===null?ie:1}let I,Q,z,ee,oe,te,me,ve,_e,Le,Ve,ze,we,Xe,Ke,ut,Se,Ge,Qe,Qs,er,ri,ji,Tn,D=i;function An(w,G){return t.getContext(w,G)}try{let w={alpha:!0,depth:r,stencil:s,antialias:o,premultipliedAlpha:l,preserveDrawingBuffer:c,powerPreference:h,failIfMajorPerformanceCaveat:u};if("setAttribute"in t&&t.setAttribute("data-engine",`three.js r${jl}`),t.addEventListener("webglcontextlost",Qh,!1),t.addEventListener("webglcontextrestored",eu,!1),t.addEventListener("webglcontextcreationerror",tu,!1),D===null){let G="webgl2";if(D=An(G,w),D===null)throw An(G)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}}catch(w){throw console.error("THREE.WebGLRenderer: "+w.message),w}function Kr(){I=new yf(D),I.init(),ri=new Dm(D,I),Q=new ff(D,I,e,ri),z=new Lm(D),Q.reverseDepthBuffer&&z.buffers.depth.setReversed(!0),ee=new Mf(D),oe=new Sm,te=new Um(D,I,z,oe,Q,ri,ee),me=new gf(v),ve=new vf(v),_e=new cf(D),ji=new df(D,_e),Le=new xf(D,_e,ee,ji),Ve=new bf(D,Le,_e,ee),Qe=new Sf(D,Q,te),ut=new mf(oe),ze=new Mm(v,me,ve,I,Q,ji,ut),we=new km(v,oe),Xe=new wm,Ke=new Cm(I),Ge=new uf(v,me,ve,z,Ve,d,l),Se=new Pm(v,Ve,Q),Tn=new Fm(D,ee,Q,z),Qs=new pf(D,I,ee),er=new _f(D,I,ee),ee.programs=ze.programs,v.capabilities=Q,v.extensions=I,v.properties=oe,v.renderLists=Xe,v.shadowMap=Se,v.state=z,v.info=ee}Kr();let Rt=new Vc(v,D);function Qh(w){w.preventDefault(),console.log("THREE.WebGLRenderer: Context Lost."),_=!0}function eu(){console.log("THREE.WebGLRenderer: Context Restored."),_=!1;let w=ee.autoReset,G=Se.enabled,Z=Se.autoUpdate,ne=Se.needsUpdate,q=Se.type;Kr(),ee.autoReset=w,Se.enabled=G,Se.autoUpdate=Z,Se.needsUpdate=ne,Se.type=q}function tu(w){console.error("THREE.WebGLRenderer: A WebGL context could not be created. Reason: ",w.statusMessage)}function iu(w){let G=w.target;G.removeEventListener("dispose",iu),function(Z){(function(ne){let q=oe.get(ne).programs;q!==void 0&&(q.forEach(function(he){ze.releaseProgram(he)}),ne.isShaderMaterial&&ze.releaseShaderCache(ne))})(Z),oe.remove(Z)}(G)}function nu(w,G,Z){w.transparent===!0&&w.side===2&&w.forceSinglePass===!1?(w.side=Mt,w.needsUpdate=!0,ta(w,G,Z),w.side=zi,w.needsUpdate=!0,ta(w,G,Z),w.side=2):ta(w,G,Z)}this.xr=Rt,this.getContext=function(){return D},this.getContextAttributes=function(){return D.getContextAttributes()},this.forceContextLoss=function(){let w=I.get("WEBGL_lose_context");w&&w.loseContext()},this.forceContextRestore=function(){let w=I.get("WEBGL_lose_context");w&&w.restoreContext()},this.getPixelRatio=function(){return ie},this.setPixelRatio=function(w){w!==void 0&&(ie=w,this.setSize(Y,k,!1))},this.getSize=function(w){return w.set(Y,k)},this.setSize=function(w,G,Z=!0){Rt.isPresenting?console.warn("THREE.WebGLRenderer: Can't change size while VR device is presenting."):(Y=w,k=G,t.width=Math.floor(w*ie),t.height=Math.floor(G*ie),Z===!0&&(t.style.width=w+"px",t.style.height=G+"px"),this.setViewport(0,0,w,G))},this.getDrawingBufferSize=function(w){return w.set(Y*ie,k*ie).floor()},this.setDrawingBufferSize=function(w,G,Z){Y=w,k=G,ie=Z,t.width=Math.floor(w*Z),t.height=Math.floor(G*Z),this.setViewport(0,0,w,G)},this.getCurrentViewport=function(w){return w.copy(W)},this.getViewport=function(w){return w.copy(le)},this.setViewport=function(w,G,Z,ne){w.isVector4?le.set(w.x,w.y,w.z,w.w):le.set(w,G,Z,ne),z.viewport(W.copy(le).multiplyScalar(ie).round())},this.getScissor=function(w){return w.copy($)},this.setScissor=function(w,G,Z,ne){w.isVector4?$.set(w.x,w.y,w.z,w.w):$.set(w,G,Z,ne),z.scissor(V.copy($).multiplyScalar(ie).round())},this.getScissorTest=function(){return ae},this.setScissorTest=function(w){z.setScissorTest(ae=w)},this.setOpaqueSort=function(w){J=w},this.setTransparentSort=function(w){se=w},this.getClearColor=function(w){return w.copy(Ge.getClearColor())},this.setClearColor=function(){Ge.setClearColor.apply(Ge,arguments)},this.getClearAlpha=function(){return Ge.getClearAlpha()},this.setClearAlpha=function(){Ge.setClearAlpha.apply(Ge,arguments)},this.clear=function(w=!0,G=!0,Z=!0){let ne=0;if(w){let q=!1;if(A!==null){let he=A.texture.format;q=he===Ih||he===Ph||he===Ch}if(q){let he=A.texture.type,ge=he===nn||he===Vn||he===ys||he===Er||he===Th||he===Ah,Me=Ge.getClearColor(),Te=Ge.getClearAlpha(),Ue=Me.r,Pe=Me.g,Ce=Me.b;ge?(p[0]=Ue,p[1]=Pe,p[2]=Ce,p[3]=Te,D.clearBufferuiv(D.COLOR,0,p)):(m[0]=Ue,m[1]=Pe,m[2]=Ce,m[3]=Te,D.clearBufferiv(D.COLOR,0,m))}else ne|=D.COLOR_BUFFER_BIT}G&&(ne|=D.DEPTH_BUFFER_BIT,D.clearDepth(this.capabilities.reverseDepthBuffer?0:1)),Z&&(ne|=D.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),D.clear(ne)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){t.removeEventListener("webglcontextlost",Qh,!1),t.removeEventListener("webglcontextrestored",eu,!1),t.removeEventListener("webglcontextcreationerror",tu,!1),Xe.dispose(),Ke.dispose(),oe.dispose(),me.dispose(),ve.dispose(),Ve.dispose(),ji.dispose(),Tn.dispose(),ze.dispose(),Rt.dispose(),Rt.removeEventListener("sessionstart",ru),Rt.removeEventListener("sessionend",su),Rn.stop()},this.renderBufferDirect=function(w,G,Z,ne,q,he){G===null&&(G=P);let ge=q.isMesh&&q.matrixWorld.determinant()<0,Me=function(qe,pt,Ot,Be,De){pt.isScene!==!0&&(pt=P),te.resetTextureUnits();let Mi=pt.fog,Pp=Be.isMeshStandardMaterial?pt.environment:null,Ip=A===null?v.outputColorSpace:A.isXRRenderTarget===!0?A.texture.colorSpace:_n,ia=(Be.isMeshStandardMaterial?ve:me).get(Be.envMap||Pp),Lp=Be.vertexColors===!0&&!!Ot.attributes.color&&Ot.attributes.color.itemSize===4,Up=!!Ot.attributes.tangent&&(!!Be.normalMap||Be.anisotropy>0),Dp=!!Ot.morphAttributes.position,Np=!!Ot.morphAttributes.normal,Op=!!Ot.morphAttributes.color,uu=fn;Be.toneMapped&&(A!==null&&A.isXRRenderTarget!==!0||(uu=v.toneMapping));let du=Ot.morphAttributes.position||Ot.morphAttributes.normal||Ot.morphAttributes.color,kp=du!==void 0?du.length:0,We=oe.get(Be),Fp=g.state.lights;if(de===!0&&(R===!0||qe!==U)){let pi=qe===U&&Be.id===B;ut.setState(Be,qe,pi)}let Si=!1;Be.version===We.__version?We.needsLights&&We.lightsStateVersion!==Fp.state.version||We.outputColorSpace!==Ip||De.isBatchedMesh&&We.batching===!1?Si=!0:De.isBatchedMesh||We.batching!==!0?De.isBatchedMesh&&We.batchingColor===!0&&De.colorTexture===null||De.isBatchedMesh&&We.batchingColor===!1&&De.colorTexture!==null||De.isInstancedMesh&&We.instancing===!1?Si=!0:De.isInstancedMesh||We.instancing!==!0?De.isSkinnedMesh&&We.skinning===!1?Si=!0:De.isSkinnedMesh||We.skinning!==!0?De.isInstancedMesh&&We.instancingColor===!0&&De.instanceColor===null||De.isInstancedMesh&&We.instancingColor===!1&&De.instanceColor!==null||De.isInstancedMesh&&We.instancingMorph===!0&&De.morphTexture===null||De.isInstancedMesh&&We.instancingMorph===!1&&De.morphTexture!==null||We.envMap!==ia||Be.fog===!0&&We.fog!==Mi?Si=!0:We.numClippingPlanes===void 0||We.numClippingPlanes===ut.numPlanes&&We.numIntersection===ut.numIntersection?(We.vertexAlphas!==Lp||We.vertexTangents!==Up||We.morphTargets!==Dp||We.morphNormals!==Np||We.morphColors!==Op||We.toneMapping!==uu||We.morphTargetsCount!==kp)&&(Si=!0):Si=!0:Si=!0:Si=!0:Si=!0:(Si=!0,We.__version=Be.version);let Cn=We.currentProgram;Si===!0&&(Cn=ta(Be,pt,De));let pu=!1,Qr=!1,sl=!1,yt=Cn.getUniforms(),an=We.uniforms;if(z.useProgram(Cn.program)&&(pu=!0,Qr=!0,sl=!0),Be.id!==B&&(B=Be.id,Qr=!0),pu||U!==qe){Q.reverseDepthBuffer?(S.copy(qe.projectionMatrix),function(Pn){let ot=Pn.elements;ot[2]=.5*ot[2]+.5*ot[3],ot[6]=.5*ot[6]+.5*ot[7],ot[10]=.5*ot[10]+.5*ot[11],ot[14]=.5*ot[14]+.5*ot[15]}(S),function(Pn){let ot=Pn.elements;ot[11]===-1?(ot[10]=-ot[10]-1,ot[14]=-ot[14]):(ot[10]=-ot[10],ot[14]=1-ot[14])}(S),yt.setValue(D,"projectionMatrix",S)):yt.setValue(D,"projectionMatrix",qe.projectionMatrix),yt.setValue(D,"viewMatrix",qe.matrixWorldInverse);let pi=yt.map.cameraPosition;pi!==void 0&&pi.setValue(D,j.setFromMatrixPosition(qe.matrixWorld)),Q.logarithmicDepthBuffer&&yt.setValue(D,"logDepthBufFC",2/(Math.log(qe.far+1)/Math.LN2)),(Be.isMeshPhongMaterial||Be.isMeshToonMaterial||Be.isMeshLambertMaterial||Be.isMeshBasicMaterial||Be.isMeshStandardMaterial||Be.isShaderMaterial)&&yt.setValue(D,"isOrthographic",qe.isOrthographicCamera===!0),U!==qe&&(U=qe,Qr=!0,sl=!0)}if(De.isSkinnedMesh){yt.setOptional(D,De,"bindMatrix"),yt.setOptional(D,De,"bindMatrixInverse");let pi=De.skeleton;pi&&(pi.boneTexture===null&&pi.computeBoneTexture(),yt.setValue(D,"boneTexture",pi.boneTexture,te))}De.isBatchedMesh&&(yt.setOptional(D,De,"batchingTexture"),yt.setValue(D,"batchingTexture",De._matricesTexture,te),yt.setOptional(D,De,"batchingIdTexture"),yt.setValue(D,"batchingIdTexture",De._indirectTexture,te),yt.setOptional(D,De,"batchingColorTexture"),De._colorsTexture!==null&&yt.setValue(D,"batchingColorTexture",De._colorsTexture,te));let al=Ot.morphAttributes;al.position===void 0&&al.normal===void 0&&al.color===void 0||Qe.update(De,Ot,Cn),(Qr||We.receiveShadow!==De.receiveShadow)&&(We.receiveShadow=De.receiveShadow,yt.setValue(D,"receiveShadow",De.receiveShadow)),Be.isMeshGouraudMaterial&&Be.envMap!==null&&(an.envMap.value=ia,an.flipEnvMap.value=ia.isCubeTexture&&ia.isRenderTargetTexture===!1?-1:1),Be.isMeshStandardMaterial&&Be.envMap===null&&pt.environment!==null&&(an.envMapIntensity.value=pt.environmentIntensity),Qr&&(yt.setValue(D,"toneMappingExposure",v.toneMappingExposure),We.needsLights&&(bi=sl,(Oi=an).ambientLightColor.needsUpdate=bi,Oi.lightProbe.needsUpdate=bi,Oi.directionalLights.needsUpdate=bi,Oi.directionalLightShadows.needsUpdate=bi,Oi.pointLights.needsUpdate=bi,Oi.pointLightShadows.needsUpdate=bi,Oi.spotLights.needsUpdate=bi,Oi.spotLightShadows.needsUpdate=bi,Oi.rectAreaLights.needsUpdate=bi,Oi.hemisphereLights.needsUpdate=bi),Mi&&Be.fog===!0&&we.refreshFogUniforms(an,Mi),we.refreshMaterialUniforms(an,Be,ie,k,g.state.transmissionRenderTarget[qe.id]),Sr.upload(D,cu(We),an,te));var Oi,bi;if(Be.isShaderMaterial&&Be.uniformsNeedUpdate===!0&&(Sr.upload(D,cu(We),an,te),Be.uniformsNeedUpdate=!1),Be.isSpriteMaterial&&yt.setValue(D,"center",De.center),yt.setValue(D,"modelViewMatrix",De.modelViewMatrix),yt.setValue(D,"normalMatrix",De.normalMatrix),yt.setValue(D,"modelMatrix",De.matrixWorld),Be.isShaderMaterial||Be.isRawShaderMaterial){let pi=Be.uniformsGroups;for(let Pn=0,ot=pi.length;Pn<ot;Pn++){let fu=pi[Pn];Tn.update(fu,Cn),Tn.bind(fu,Cn)}}return Cn}(w,G,Z,ne,q);z.setMaterial(ne,ge);let Te=Z.index,Ue=1;if(ne.wireframe===!0){if(Te=Le.getWireframeAttribute(Z),Te===void 0)return;Ue=2}let Pe=Z.drawRange,Ce=Z.attributes.position,je=Pe.start*Ue,vt=(Pe.start+Pe.count)*Ue;he!==null&&(je=Math.max(je,he.start*Ue),vt=Math.min(vt,(he.start+he.count)*Ue)),Te!==null?(je=Math.max(je,0),vt=Math.min(vt,Te.count)):Ce!=null&&(je=Math.max(je,0),vt=Math.min(vt,Ce.count));let dt=vt-je;if(dt<0||dt===1/0)return;let Ct;ji.setup(q,ne,Me,Z,Te);let rt=Qs;if(Te!==null&&(Ct=_e.get(Te),rt=er,rt.setIndex(Ct)),q.isMesh)ne.wireframe===!0?(z.setLineWidth(ne.wireframeLinewidth*L()),rt.setMode(D.LINES)):rt.setMode(D.TRIANGLES);else if(q.isLine){let qe=ne.linewidth;qe===void 0&&(qe=1),z.setLineWidth(qe*L()),q.isLineSegments?rt.setMode(D.LINES):q.isLineLoop?rt.setMode(D.LINE_LOOP):rt.setMode(D.LINE_STRIP)}else q.isPoints?rt.setMode(D.POINTS):q.isSprite&&rt.setMode(D.TRIANGLES);if(q.isBatchedMesh)if(q._multiDrawInstances!==null)rt.renderMultiDrawInstances(q._multiDrawStarts,q._multiDrawCounts,q._multiDrawCount,q._multiDrawInstances);else if(I.get("WEBGL_multi_draw"))rt.renderMultiDraw(q._multiDrawStarts,q._multiDrawCounts,q._multiDrawCount);else{let qe=q._multiDrawStarts,pt=q._multiDrawCounts,Ot=q._multiDrawCount,Be=Te?_e.get(Te).bytesPerElement:1,De=oe.get(ne).currentProgram.getUniforms();for(let Mi=0;Mi<Ot;Mi++)De.setValue(D,"_gl_DrawID",Mi),rt.render(qe[Mi]/Be,pt[Mi])}else if(q.isInstancedMesh)rt.renderInstances(je,dt,q.count);else if(Z.isInstancedBufferGeometry){let qe=Z._maxInstanceCount!==void 0?Z._maxInstanceCount:1/0,pt=Math.min(Z.instanceCount,qe);rt.renderInstances(je,dt,pt)}else rt.render(je,dt)},this.compile=function(w,G,Z=null){Z===null&&(Z=w),g=Ke.get(Z),g.init(G),y.push(g),Z.traverseVisible(function(q){q.isLight&&q.layers.test(G.layers)&&(g.pushLight(q),q.castShadow&&g.pushShadow(q))}),w!==Z&&w.traverseVisible(function(q){q.isLight&&q.layers.test(G.layers)&&(g.pushLight(q),q.castShadow&&g.pushShadow(q))}),g.setupLights();let ne=new Set;return w.traverse(function(q){if(!(q.isMesh||q.isPoints||q.isLine||q.isSprite))return;let he=q.material;if(he)if(Array.isArray(he))for(let ge=0;ge<he.length;ge++){let Me=he[ge];nu(Me,Z,q),ne.add(Me)}else nu(he,Z,q),ne.add(he)}),y.pop(),g=null,ne},this.compileAsync=function(w,G,Z=null){let ne=this.compile(w,G,Z);return new Promise(q=>{function he(){ne.forEach(function(ge){oe.get(ge).currentProgram.isReady()&&ne.delete(ge)}),ne.size!==0?setTimeout(he,10):q(w)}I.get("KHR_parallel_shader_compile")!==null?he():setTimeout(he,10)})};let nl=null;function ru(){Rn.stop()}function su(){Rn.start()}let Rn=new Gd;function rl(w,G,Z,ne){if(w.visible===!1)return;if(w.layers.test(G.layers)){if(w.isGroup)Z=w.renderOrder;else if(w.isLOD)w.autoUpdate===!0&&w.update(G);else if(w.isLight)g.pushLight(w),w.castShadow&&g.pushShadow(w);else if(w.isSprite){if(!w.frustumCulled||fe.intersectsSprite(w)){ne&&C.setFromMatrixPosition(w.matrixWorld).applyMatrix4(N);let he=Ve.update(w),ge=w.material;ge.visible&&x.push(w,he,ge,Z,C.z,null)}}else if((w.isMesh||w.isLine||w.isPoints)&&(!w.frustumCulled||fe.intersectsObject(w))){let he=Ve.update(w),ge=w.material;if(ne&&(w.boundingSphere!==void 0?(w.boundingSphere===null&&w.computeBoundingSphere(),C.copy(w.boundingSphere.center)):(he.boundingSphere===null&&he.computeBoundingSphere(),C.copy(he.boundingSphere.center)),C.applyMatrix4(w.matrixWorld).applyMatrix4(N)),Array.isArray(ge)){let Me=he.groups;for(let Te=0,Ue=Me.length;Te<Ue;Te++){let Pe=Me[Te],Ce=ge[Pe.materialIndex];Ce&&Ce.visible&&x.push(w,he,Ce,Z,C.z,Pe)}}else ge.visible&&x.push(w,he,ge,Z,C.z,null)}}let q=w.children;for(let he=0,ge=q.length;he<ge;he++)rl(q[he],G,Z,ne)}function au(w,G,Z,ne){let q=w.opaque,he=w.transmissive,ge=w.transparent;g.setupLightsView(Z),de===!0&&ut.setGlobalState(v.clippingPlanes,Z),ne&&z.viewport(W.copy(ne)),q.length>0&&ea(q,G,Z),he.length>0&&ea(he,G,Z),ge.length>0&&ea(ge,G,Z),z.buffers.depth.setTest(!0),z.buffers.depth.setMask(!0),z.buffers.color.setMask(!0),z.setPolygonOffset(!1)}function ou(w,G,Z,ne){if((Z.isScene===!0?Z.overrideMaterial:null)!==null)return;g.state.transmissionRenderTarget[ne.id]===void 0&&(g.state.transmissionRenderTarget[ne.id]=new $t(1,1,{generateMipmaps:!0,type:I.has("EXT_color_buffer_half_float")||I.has("EXT_color_buffer_float")?Ii:nn,minFilter:pn,samples:4,stencilBuffer:s,resolveDepthBuffer:!1,resolveStencilBuffer:!1,colorSpace:Ye.workingColorSpace}));let q=g.state.transmissionRenderTarget[ne.id],he=ne.viewport||W;q.setSize(he.z,he.w);let ge=v.getRenderTarget();v.setRenderTarget(q),v.getClearColor(X),H=v.getClearAlpha(),H<1&&v.setClearColor(16777215,.5),v.clear(),b&&Ge.render(Z);let Me=v.toneMapping;v.toneMapping=fn;let Te=ne.viewport;if(ne.viewport!==void 0&&(ne.viewport=void 0),g.setupLightsView(ne),de===!0&&ut.setGlobalState(v.clippingPlanes,ne),ea(w,Z,ne),te.updateMultisampleRenderTarget(q),te.updateRenderTargetMipmap(q),I.has("WEBGL_multisampled_render_to_texture")===!1){let Ue=!1;for(let Pe=0,Ce=G.length;Pe<Ce;Pe++){let je=G[Pe],vt=je.object,dt=je.geometry,Ct=je.material,rt=je.group;if(Ct.side===2&&vt.layers.test(ne.layers)){let qe=Ct.side;Ct.side=Mt,Ct.needsUpdate=!0,lu(vt,Z,ne,dt,Ct,rt),Ct.side=qe,Ct.needsUpdate=!0,Ue=!0}}Ue===!0&&(te.updateMultisampleRenderTarget(q),te.updateRenderTargetMipmap(q))}v.setRenderTarget(ge),v.setClearColor(X,H),Te!==void 0&&(ne.viewport=Te),v.toneMapping=Me}function ea(w,G,Z){let ne=G.isScene===!0?G.overrideMaterial:null;for(let q=0,he=w.length;q<he;q++){let ge=w[q],Me=ge.object,Te=ge.geometry,Ue=ne===null?ge.material:ne,Pe=ge.group;Me.layers.test(Z.layers)&&lu(Me,G,Z,Te,Ue,Pe)}}function lu(w,G,Z,ne,q,he){w.onBeforeRender(v,G,Z,ne,q,he),w.modelViewMatrix.multiplyMatrices(Z.matrixWorldInverse,w.matrixWorld),w.normalMatrix.getNormalMatrix(w.modelViewMatrix),q.onBeforeRender(v,G,Z,ne,w,he),q.transparent===!0&&q.side===2&&q.forceSinglePass===!1?(q.side=Mt,q.needsUpdate=!0,v.renderBufferDirect(Z,G,ne,q,w,he),q.side=zi,q.needsUpdate=!0,v.renderBufferDirect(Z,G,ne,q,w,he),q.side=2):v.renderBufferDirect(Z,G,ne,q,w,he),w.onAfterRender(v,G,Z,ne,q,he)}function ta(w,G,Z){G.isScene!==!0&&(G=P);let ne=oe.get(w),q=g.state.lights,he=g.state.shadowsArray,ge=q.state.version,Me=ze.getParameters(w,q.state,he,G,Z),Te=ze.getProgramCacheKey(Me),Ue=ne.programs;ne.environment=w.isMeshStandardMaterial?G.environment:null,ne.fog=G.fog,ne.envMap=(w.isMeshStandardMaterial?ve:me).get(w.envMap||ne.environment),ne.envMapRotation=ne.environment!==null&&w.envMap===null?G.environmentRotation:w.envMapRotation,Ue===void 0&&(w.addEventListener("dispose",iu),Ue=new Map,ne.programs=Ue);let Pe=Ue.get(Te);if(Pe!==void 0){if(ne.currentProgram===Pe&&ne.lightsStateVersion===ge)return hu(w,Me),Pe}else Me.uniforms=ze.getUniforms(w),w.onBeforeCompile(Me,v),Pe=ze.acquireProgram(Me,Te),Ue.set(Te,Pe),ne.uniforms=Me.uniforms;let Ce=ne.uniforms;return(w.isShaderMaterial||w.isRawShaderMaterial)&&w.clipping!==!0||(Ce.clippingPlanes=ut.uniform),hu(w,Me),ne.needsLights=function(je){return je.isMeshLambertMaterial||je.isMeshToonMaterial||je.isMeshPhongMaterial||je.isMeshStandardMaterial||je.isShadowMaterial||je.isShaderMaterial&&je.lights===!0}(w),ne.lightsStateVersion=ge,ne.needsLights&&(Ce.ambientLightColor.value=q.state.ambient,Ce.lightProbe.value=q.state.probe,Ce.directionalLights.value=q.state.directional,Ce.directionalLightShadows.value=q.state.directionalShadow,Ce.spotLights.value=q.state.spot,Ce.spotLightShadows.value=q.state.spotShadow,Ce.rectAreaLights.value=q.state.rectArea,Ce.ltc_1.value=q.state.rectAreaLTC1,Ce.ltc_2.value=q.state.rectAreaLTC2,Ce.pointLights.value=q.state.point,Ce.pointLightShadows.value=q.state.pointShadow,Ce.hemisphereLights.value=q.state.hemi,Ce.directionalShadowMap.value=q.state.directionalShadowMap,Ce.directionalShadowMatrix.value=q.state.directionalShadowMatrix,Ce.spotShadowMap.value=q.state.spotShadowMap,Ce.spotLightMatrix.value=q.state.spotLightMatrix,Ce.spotLightMap.value=q.state.spotLightMap,Ce.pointShadowMap.value=q.state.pointShadowMap,Ce.pointShadowMatrix.value=q.state.pointShadowMatrix),ne.currentProgram=Pe,ne.uniformsList=null,Pe}function cu(w){if(w.uniformsList===null){let G=w.currentProgram.getUniforms();w.uniformsList=Sr.seqWithValue(G.seq,w.uniforms)}return w.uniformsList}function hu(w,G){let Z=oe.get(w);Z.outputColorSpace=G.outputColorSpace,Z.batching=G.batching,Z.batchingColor=G.batchingColor,Z.instancing=G.instancing,Z.instancingColor=G.instancingColor,Z.instancingMorph=G.instancingMorph,Z.skinning=G.skinning,Z.morphTargets=G.morphTargets,Z.morphNormals=G.morphNormals,Z.morphColors=G.morphColors,Z.morphTargetsCount=G.morphTargetsCount,Z.numClippingPlanes=G.numClippingPlanes,Z.numIntersection=G.numClipIntersection,Z.vertexAlphas=G.vertexAlphas,Z.vertexTangents=G.vertexTangents,Z.toneMapping=G.toneMapping}Rn.setAnimationLoop(function(w){nl&&nl(w)}),typeof self<"u"&&Rn.setContext(self),this.setAnimationLoop=function(w){nl=w,Rt.setAnimationLoop(w),w===null?Rn.stop():Rn.start()},Rt.addEventListener("sessionstart",ru),Rt.addEventListener("sessionend",su),this.render=function(w,G){if(G!==void 0&&G.isCamera!==!0)return void console.error("THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.");if(_===!0)return;if(w.matrixWorldAutoUpdate===!0&&w.updateMatrixWorld(),G.parent===null&&G.matrixWorldAutoUpdate===!0&&G.updateMatrixWorld(),Rt.enabled===!0&&Rt.isPresenting===!0&&(Rt.cameraAutoUpdate===!0&&Rt.updateCamera(G),G=Rt.getCamera()),w.isScene===!0&&w.onBeforeRender(v,w,G,A),g=Ke.get(w,y.length),g.init(G),y.push(g),N.multiplyMatrices(G.projectionMatrix,G.matrixWorldInverse),fe.setFromProjectionMatrix(N),R=this.localClippingEnabled,de=ut.init(this.clippingPlanes,R),x=Xe.get(w,f.length),x.init(),f.push(x),Rt.enabled===!0&&Rt.isPresenting===!0){let he=v.xr.getDepthSensingMesh();he!==null&&rl(he,G,-1/0,v.sortObjects)}rl(w,G,0,v.sortObjects),x.finish(),v.sortObjects===!0&&x.sort(J,se),b=Rt.enabled===!1||Rt.isPresenting===!1||Rt.hasDepthSensing()===!1,b&&Ge.addToRenderList(x,w),this.info.render.frame++,de===!0&&ut.beginShadows();let Z=g.state.shadowsArray;Se.render(Z,w,G),de===!0&&ut.endShadows(),this.info.autoReset===!0&&this.info.reset();let ne=x.opaque,q=x.transmissive;if(g.setupLights(),G.isArrayCamera){let he=G.cameras;if(q.length>0)for(let ge=0,Me=he.length;ge<Me;ge++)ou(ne,q,w,he[ge]);b&&Ge.render(w);for(let ge=0,Me=he.length;ge<Me;ge++){let Te=he[ge];au(x,w,Te,Te.viewport)}}else q.length>0&&ou(ne,q,w,G),b&&Ge.render(w),au(x,w,G);A!==null&&(te.updateMultisampleRenderTarget(A),te.updateRenderTargetMipmap(A)),w.isScene===!0&&w.onAfterRender(v,w,G),ji.resetDefaultState(),B=-1,U=null,y.pop(),y.length>0?(g=y[y.length-1],de===!0&&ut.setGlobalState(v.clippingPlanes,g.state.camera)):g=null,f.pop(),x=f.length>0?f[f.length-1]:null},this.getActiveCubeFace=function(){return E},this.getActiveMipmapLevel=function(){return T},this.getRenderTarget=function(){return A},this.setRenderTargetTextures=function(w,G,Z){oe.get(w.texture).__webglTexture=G,oe.get(w.depthTexture).__webglTexture=Z;let ne=oe.get(w);ne.__hasExternalTextures=!0,ne.__autoAllocateDepthBuffer=Z===void 0,ne.__autoAllocateDepthBuffer||I.has("WEBGL_multisampled_render_to_texture")===!0&&(console.warn("THREE.WebGLRenderer: Render-to-texture extension was disabled because an external texture was provided"),ne.__useRenderToTexture=!1)},this.setRenderTargetFramebuffer=function(w,G){let Z=oe.get(w);Z.__webglFramebuffer=G,Z.__useDefaultFramebuffer=G===void 0},this.setRenderTarget=function(w,G=0,Z=0){A=w,E=G,T=Z;let ne=!0,q=null,he=!1,ge=!1;if(w){let Me=oe.get(w);if(Me.__useDefaultFramebuffer!==void 0)z.bindFramebuffer(D.FRAMEBUFFER,null),ne=!1;else if(Me.__webglFramebuffer===void 0)te.setupRenderTarget(w);else if(Me.__hasExternalTextures)te.rebindTextures(w,oe.get(w.texture).__webglTexture,oe.get(w.depthTexture).__webglTexture);else if(w.depthBuffer){let Pe=w.depthTexture;if(Me.__boundDepthTexture!==Pe){if(Pe!==null&&oe.has(Pe)&&(w.width!==Pe.image.width||w.height!==Pe.image.height))throw new Error("WebGLRenderTarget: Attached DepthTexture is initialized to the incorrect size.");te.setupDepthRenderbuffer(w)}}let Te=w.texture;(Te.isData3DTexture||Te.isDataArrayTexture||Te.isCompressedArrayTexture)&&(ge=!0);let Ue=oe.get(w).__webglFramebuffer;w.isWebGLCubeRenderTarget?(q=Array.isArray(Ue[G])?Ue[G][Z]:Ue[G],he=!0):q=w.samples>0&&te.useMultisampledRTT(w)===!1?oe.get(w).__webglMultisampledFramebuffer:Array.isArray(Ue)?Ue[Z]:Ue,W.copy(w.viewport),V.copy(w.scissor),F=w.scissorTest}else W.copy(le).multiplyScalar(ie).floor(),V.copy($).multiplyScalar(ie).floor(),F=ae;if(z.bindFramebuffer(D.FRAMEBUFFER,q)&&ne&&z.drawBuffers(w,q),z.viewport(W),z.scissor(V),z.setScissorTest(F),he){let Me=oe.get(w.texture);D.framebufferTexture2D(D.FRAMEBUFFER,D.COLOR_ATTACHMENT0,D.TEXTURE_CUBE_MAP_POSITIVE_X+G,Me.__webglTexture,Z)}else if(ge){let Me=oe.get(w.texture),Te=G||0;D.framebufferTextureLayer(D.FRAMEBUFFER,D.COLOR_ATTACHMENT0,Me.__webglTexture,Z||0,Te)}B=-1},this.readRenderTargetPixels=function(w,G,Z,ne,q,he,ge){if(!w||!w.isWebGLRenderTarget)return void console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let Me=oe.get(w).__webglFramebuffer;if(w.isWebGLCubeRenderTarget&&ge!==void 0&&(Me=Me[ge]),Me){z.bindFramebuffer(D.FRAMEBUFFER,Me);try{let Te=w.texture,Ue=Te.format,Pe=Te.type;if(!Q.textureFormatReadable(Ue))return void console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");if(!Q.textureTypeReadable(Pe))return void console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");G>=0&&G<=w.width-ne&&Z>=0&&Z<=w.height-q&&D.readPixels(G,Z,ne,q,ri.convert(Ue),ri.convert(Pe),he)}finally{let Te=A!==null?oe.get(A).__webglFramebuffer:null;z.bindFramebuffer(D.FRAMEBUFFER,Te)}}},this.readRenderTargetPixelsAsync=async function(w,G,Z,ne,q,he,ge){if(!w||!w.isWebGLRenderTarget)throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let Me=oe.get(w).__webglFramebuffer;if(w.isWebGLCubeRenderTarget&&ge!==void 0&&(Me=Me[ge]),Me){let Te=w.texture,Ue=Te.format,Pe=Te.type;if(!Q.textureFormatReadable(Ue))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(!Q.textureTypeReadable(Pe))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");if(G>=0&&G<=w.width-ne&&Z>=0&&Z<=w.height-q){z.bindFramebuffer(D.FRAMEBUFFER,Me);let Ce=D.createBuffer();D.bindBuffer(D.PIXEL_PACK_BUFFER,Ce),D.bufferData(D.PIXEL_PACK_BUFFER,he.byteLength,D.STREAM_READ),D.readPixels(G,Z,ne,q,ri.convert(Ue),ri.convert(Pe),0);let je=A!==null?oe.get(A).__webglFramebuffer:null;z.bindFramebuffer(D.FRAMEBUFFER,je);let vt=D.fenceSync(D.SYNC_GPU_COMMANDS_COMPLETE,0);return D.flush(),await function(dt,Ct,rt){return new Promise(function(qe,pt){setTimeout(function Ot(){switch(dt.clientWaitSync(Ct,dt.SYNC_FLUSH_COMMANDS_BIT,0)){case dt.WAIT_FAILED:pt();break;case dt.TIMEOUT_EXPIRED:setTimeout(Ot,rt);break;default:qe()}},rt)})}(D,vt,4),D.bindBuffer(D.PIXEL_PACK_BUFFER,Ce),D.getBufferSubData(D.PIXEL_PACK_BUFFER,0,he),D.deleteBuffer(Ce),D.deleteSync(vt),he}throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")}},this.copyFramebufferToTexture=function(w,G=null,Z=0){w.isTexture!==!0&&(Xa("WebGLRenderer: copyFramebufferToTexture function signature has changed."),G=arguments[0]||null,w=arguments[1]);let ne=Math.pow(2,-Z),q=Math.floor(w.image.width*ne),he=Math.floor(w.image.height*ne),ge=G!==null?G.x:0,Me=G!==null?G.y:0;te.setTexture2D(w,0),D.copyTexSubImage2D(D.TEXTURE_2D,Z,0,0,ge,Me,q,he),z.unbindTexture()},this.copyTextureToTexture=function(w,G,Z=null,ne=null,q=0){let he,ge,Me,Te,Ue,Pe;w.isTexture!==!0&&(Xa("WebGLRenderer: copyTextureToTexture function signature has changed."),ne=arguments[0]||null,w=arguments[1],G=arguments[2],q=arguments[3]||0,Z=null),Z!==null?(he=Z.max.x-Z.min.x,ge=Z.max.y-Z.min.y,Me=Z.min.x,Te=Z.min.y):(he=w.image.width,ge=w.image.height,Me=0,Te=0),ne!==null?(Ue=ne.x,Pe=ne.y):(Ue=0,Pe=0);let Ce=ri.convert(G.format),je=ri.convert(G.type);te.setTexture2D(G,0),D.pixelStorei(D.UNPACK_FLIP_Y_WEBGL,G.flipY),D.pixelStorei(D.UNPACK_PREMULTIPLY_ALPHA_WEBGL,G.premultiplyAlpha),D.pixelStorei(D.UNPACK_ALIGNMENT,G.unpackAlignment);let vt=D.getParameter(D.UNPACK_ROW_LENGTH),dt=D.getParameter(D.UNPACK_IMAGE_HEIGHT),Ct=D.getParameter(D.UNPACK_SKIP_PIXELS),rt=D.getParameter(D.UNPACK_SKIP_ROWS),qe=D.getParameter(D.UNPACK_SKIP_IMAGES),pt=w.isCompressedTexture?w.mipmaps[q]:w.image;D.pixelStorei(D.UNPACK_ROW_LENGTH,pt.width),D.pixelStorei(D.UNPACK_IMAGE_HEIGHT,pt.height),D.pixelStorei(D.UNPACK_SKIP_PIXELS,Me),D.pixelStorei(D.UNPACK_SKIP_ROWS,Te),w.isDataTexture?D.texSubImage2D(D.TEXTURE_2D,q,Ue,Pe,he,ge,Ce,je,pt.data):w.isCompressedTexture?D.compressedTexSubImage2D(D.TEXTURE_2D,q,Ue,Pe,pt.width,pt.height,Ce,pt.data):D.texSubImage2D(D.TEXTURE_2D,q,Ue,Pe,he,ge,Ce,je,pt),D.pixelStorei(D.UNPACK_ROW_LENGTH,vt),D.pixelStorei(D.UNPACK_IMAGE_HEIGHT,dt),D.pixelStorei(D.UNPACK_SKIP_PIXELS,Ct),D.pixelStorei(D.UNPACK_SKIP_ROWS,rt),D.pixelStorei(D.UNPACK_SKIP_IMAGES,qe),q===0&&G.generateMipmaps&&D.generateMipmap(D.TEXTURE_2D),z.unbindTexture()},this.copyTextureToTexture3D=function(w,G,Z=null,ne=null,q=0){let he,ge,Me,Te,Ue,Pe,Ce,je,vt;w.isTexture!==!0&&(Xa("WebGLRenderer: copyTextureToTexture3D function signature has changed."),Z=arguments[0]||null,ne=arguments[1]||null,w=arguments[2],G=arguments[3],q=arguments[4]||0);let dt=w.isCompressedTexture?w.mipmaps[q]:w.image;Z!==null?(he=Z.max.x-Z.min.x,ge=Z.max.y-Z.min.y,Me=Z.max.z-Z.min.z,Te=Z.min.x,Ue=Z.min.y,Pe=Z.min.z):(he=dt.width,ge=dt.height,Me=dt.depth,Te=0,Ue=0,Pe=0),ne!==null?(Ce=ne.x,je=ne.y,vt=ne.z):(Ce=0,je=0,vt=0);let Ct=ri.convert(G.format),rt=ri.convert(G.type),qe;if(G.isData3DTexture)te.setTexture3D(G,0),qe=D.TEXTURE_3D;else{if(!G.isDataArrayTexture&&!G.isCompressedArrayTexture)return void console.warn("THREE.WebGLRenderer.copyTextureToTexture3D: only supports THREE.DataTexture3D and THREE.DataTexture2DArray.");te.setTexture2DArray(G,0),qe=D.TEXTURE_2D_ARRAY}D.pixelStorei(D.UNPACK_FLIP_Y_WEBGL,G.flipY),D.pixelStorei(D.UNPACK_PREMULTIPLY_ALPHA_WEBGL,G.premultiplyAlpha),D.pixelStorei(D.UNPACK_ALIGNMENT,G.unpackAlignment);let pt=D.getParameter(D.UNPACK_ROW_LENGTH),Ot=D.getParameter(D.UNPACK_IMAGE_HEIGHT),Be=D.getParameter(D.UNPACK_SKIP_PIXELS),De=D.getParameter(D.UNPACK_SKIP_ROWS),Mi=D.getParameter(D.UNPACK_SKIP_IMAGES);D.pixelStorei(D.UNPACK_ROW_LENGTH,dt.width),D.pixelStorei(D.UNPACK_IMAGE_HEIGHT,dt.height),D.pixelStorei(D.UNPACK_SKIP_PIXELS,Te),D.pixelStorei(D.UNPACK_SKIP_ROWS,Ue),D.pixelStorei(D.UNPACK_SKIP_IMAGES,Pe),w.isDataTexture||w.isData3DTexture?D.texSubImage3D(qe,q,Ce,je,vt,he,ge,Me,Ct,rt,dt.data):G.isCompressedArrayTexture?D.compressedTexSubImage3D(qe,q,Ce,je,vt,he,ge,Me,Ct,dt.data):D.texSubImage3D(qe,q,Ce,je,vt,he,ge,Me,Ct,rt,dt),D.pixelStorei(D.UNPACK_ROW_LENGTH,pt),D.pixelStorei(D.UNPACK_IMAGE_HEIGHT,Ot),D.pixelStorei(D.UNPACK_SKIP_PIXELS,Be),D.pixelStorei(D.UNPACK_SKIP_ROWS,De),D.pixelStorei(D.UNPACK_SKIP_IMAGES,Mi),q===0&&G.generateMipmaps&&D.generateMipmap(qe),z.unbindTexture()},this.initRenderTarget=function(w){oe.get(w).__webglFramebuffer===void 0&&te.setupRenderTarget(w)},this.initTexture=function(w){w.isCubeTexture?te.setTextureCube(w,0):w.isData3DTexture?te.setTexture3D(w,0):w.isDataArrayTexture||w.isCompressedArrayTexture?te.setTexture2DArray(w,0):te.setTexture2D(w,0),z.unbindTexture()},this.resetState=function(){E=0,T=0,A=null,z.reset(),ji.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return Ar}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;let t=this.getContext();t.drawingBufferColorSpace=e===Lh?"display-p3":"srgb",t.unpackColorSpace=Ye.workingColorSpace===Eo?"display-p3":"srgb"}};var vn=class extends xt{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new li,this.environmentIntensity=1,this.environmentRotation=new li,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,t){return super.copy(e,t),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){let t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(t.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(t.object.backgroundIntensity=this.backgroundIntensity),t.object.backgroundRotation=this.backgroundRotation.toArray(),this.environmentIntensity!==1&&(t.object.environmentIntensity=this.environmentIntensity),t.object.environmentRotation=this.environmentRotation.toArray(),t}},Gc=class{constructor(e,t){this.isInterleavedBuffer=!0,this.array=e,this.stride=t,this.count=e!==void 0?e.length/t:0,this.usage=Ec,this.updateRanges=[],this.version=0,this.uuid=tn()}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.array=new e.array.constructor(e.array),this.count=e.count,this.stride=e.stride,this.usage=e.usage,this}copyAt(e,t,i){e*=this.stride,i*=t.stride;for(let r=0,s=this.stride;r<s;r++)this.array[e+r]=t.array[i+r];return this}set(e,t=0){return this.array.set(e,t),this}clone(e){e.arrayBuffers===void 0&&(e.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=tn()),e.arrayBuffers[this.array.buffer._uuid]===void 0&&(e.arrayBuffers[this.array.buffer._uuid]=this.array.slice(0).buffer);let t=new this.array.constructor(e.arrayBuffers[this.array.buffer._uuid]),i=new this.constructor(t,this.stride);return i.setUsage(this.usage),i}onUpload(e){return this.onUploadCallback=e,this}toJSON(e){return e.arrayBuffers===void 0&&(e.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=tn()),e.arrayBuffers[this.array.buffer._uuid]===void 0&&(e.arrayBuffers[this.array.buffer._uuid]=Array.from(new Uint32Array(this.array.buffer))),{uuid:this.uuid,buffer:this.array.buffer._uuid,type:this.array.constructor.name,stride:this.stride}}},qt=new M,ao=class n{constructor(e,t,i,r=!1){this.isInterleavedBufferAttribute=!0,this.name="",this.data=e,this.itemSize=t,this.offset=i,this.normalized=r}get count(){return this.data.count}get array(){return this.data.array}set needsUpdate(e){this.data.needsUpdate=e}applyMatrix4(e){for(let t=0,i=this.data.count;t<i;t++)qt.fromBufferAttribute(this,t),qt.applyMatrix4(e),this.setXYZ(t,qt.x,qt.y,qt.z);return this}applyNormalMatrix(e){for(let t=0,i=this.count;t<i;t++)qt.fromBufferAttribute(this,t),qt.applyNormalMatrix(e),this.setXYZ(t,qt.x,qt.y,qt.z);return this}transformDirection(e){for(let t=0,i=this.count;t<i;t++)qt.fromBufferAttribute(this,t),qt.transformDirection(e),this.setXYZ(t,qt.x,qt.y,qt.z);return this}getComponent(e,t){let i=this.array[e*this.data.stride+this.offset+t];return this.normalized&&(i=Fi(i,this.array)),i}setComponent(e,t,i){return this.normalized&&(i=et(i,this.array)),this.data.array[e*this.data.stride+this.offset+t]=i,this}setX(e,t){return this.normalized&&(t=et(t,this.array)),this.data.array[e*this.data.stride+this.offset]=t,this}setY(e,t){return this.normalized&&(t=et(t,this.array)),this.data.array[e*this.data.stride+this.offset+1]=t,this}setZ(e,t){return this.normalized&&(t=et(t,this.array)),this.data.array[e*this.data.stride+this.offset+2]=t,this}setW(e,t){return this.normalized&&(t=et(t,this.array)),this.data.array[e*this.data.stride+this.offset+3]=t,this}getX(e){let t=this.data.array[e*this.data.stride+this.offset];return this.normalized&&(t=Fi(t,this.array)),t}getY(e){let t=this.data.array[e*this.data.stride+this.offset+1];return this.normalized&&(t=Fi(t,this.array)),t}getZ(e){let t=this.data.array[e*this.data.stride+this.offset+2];return this.normalized&&(t=Fi(t,this.array)),t}getW(e){let t=this.data.array[e*this.data.stride+this.offset+3];return this.normalized&&(t=Fi(t,this.array)),t}setXY(e,t,i){return e=e*this.data.stride+this.offset,this.normalized&&(t=et(t,this.array),i=et(i,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=i,this}setXYZ(e,t,i,r){return e=e*this.data.stride+this.offset,this.normalized&&(t=et(t,this.array),i=et(i,this.array),r=et(r,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=i,this.data.array[e+2]=r,this}setXYZW(e,t,i,r,s){return e=e*this.data.stride+this.offset,this.normalized&&(t=et(t,this.array),i=et(i,this.array),r=et(r,this.array),s=et(s,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=i,this.data.array[e+2]=r,this.data.array[e+3]=s,this}clone(e){if(e===void 0){console.log("THREE.InterleavedBufferAttribute.clone(): Cloning an interleaved buffer attribute will de-interleave buffer data.");let t=[];for(let i=0;i<this.count;i++){let r=i*this.data.stride+this.offset;for(let s=0;s<this.itemSize;s++)t.push(this.data.array[r+s])}return new St(new this.array.constructor(t),this.itemSize,this.normalized)}return e.interleavedBuffers===void 0&&(e.interleavedBuffers={}),e.interleavedBuffers[this.data.uuid]===void 0&&(e.interleavedBuffers[this.data.uuid]=this.data.clone(e)),new n(e.interleavedBuffers[this.data.uuid],this.itemSize,this.offset,this.normalized)}toJSON(e){if(e===void 0){console.log("THREE.InterleavedBufferAttribute.toJSON(): Serializing an interleaved buffer attribute will de-interleave buffer data.");let t=[];for(let i=0;i<this.count;i++){let r=i*this.data.stride+this.offset;for(let s=0;s<this.itemSize;s++)t.push(this.data.array[r+s])}return{itemSize:this.itemSize,type:this.array.constructor.name,array:t,normalized:this.normalized}}return e.interleavedBuffers===void 0&&(e.interleavedBuffers={}),e.interleavedBuffers[this.data.uuid]===void 0&&(e.interleavedBuffers[this.data.uuid]=this.data.toJSON(e)),{isInterleavedBufferAttribute:!0,itemSize:this.itemSize,data:this.data.uuid,offset:this.offset,normalized:this.normalized}}},Gn=class extends Hi{constructor(e){super(),this.isSpriteMaterial=!0,this.type="SpriteMaterial",this.color=new be(16777215),this.map=null,this.alphaMap=null,this.rotation=0,this.sizeAttenuation=!0,this.transparent=!0,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.alphaMap=e.alphaMap,this.rotation=e.rotation,this.sizeAttenuation=e.sizeAttenuation,this.fog=e.fog,this}},fr,os=new M,mr=new M,gr=new M,vr=new re,ls=new re,Yd=new Ie,wa=new M,cs=new M,Ea=new M,ad=new re,kl=new re,od=new re,Ur=class extends xt{constructor(e=new Gn){if(super(),this.isSprite=!0,this.type="Sprite",fr===void 0){fr=new Je;let t=new Float32Array([-.5,-.5,0,0,0,.5,-.5,0,1,0,.5,.5,0,1,1,-.5,.5,0,0,1]),i=new Gc(t,5);fr.setIndex([0,1,2,0,2,3]),fr.setAttribute("position",new ao(i,3,0,!1)),fr.setAttribute("uv",new ao(i,2,3,!1))}this.geometry=fr,this.material=e,this.center=new re(.5,.5)}raycast(e,t){e.camera===null&&console.error('THREE.Sprite: "Raycaster.camera" needs to be set in order to raycast against sprites.'),mr.setFromMatrixScale(this.matrixWorld),Yd.copy(e.camera.matrixWorld),this.modelViewMatrix.multiplyMatrices(e.camera.matrixWorldInverse,this.matrixWorld),gr.setFromMatrixPosition(this.modelViewMatrix),e.camera.isPerspectiveCamera&&this.material.sizeAttenuation===!1&&mr.multiplyScalar(-gr.z);let i=this.material.rotation,r,s;i!==0&&(s=Math.cos(i),r=Math.sin(i));let a=this.center;Ta(wa.set(-.5,-.5,0),gr,a,mr,r,s),Ta(cs.set(.5,-.5,0),gr,a,mr,r,s),Ta(Ea.set(.5,.5,0),gr,a,mr,r,s),ad.set(0,0),kl.set(1,0),od.set(1,1);let o=e.ray.intersectTriangle(wa,cs,Ea,!1,os);if(o===null&&(Ta(cs.set(-.5,.5,0),gr,a,mr,r,s),kl.set(0,1),o=e.ray.intersectTriangle(wa,Ea,cs,!1,os),o===null))return;let l=e.ray.origin.distanceTo(os);l<e.near||l>e.far||t.push({distance:l,point:os.clone(),uv:en.getInterpolation(os,wa,cs,Ea,ad,kl,od,new re),face:null,object:this})}copy(e,t){return super.copy(e,t),e.center!==void 0&&this.center.copy(e.center),this.material=e.material,this}};function Ta(n,e,t,i,r,s){vr.subVectors(n,t).addScalar(.5).multiply(i),r!==void 0?(ls.x=s*vr.x-r*vr.y,ls.y=r*vr.x+s*vr.y):ls.copy(vr),n.copy(e),n.x+=ls.x,n.y+=ls.y,n.applyMatrix4(Yd)}var H0=new M,V0=new M;var G0=new M,W0=new $e,X0=new $e,j0=new M,q0=new Ie,Y0=new M,Z0=new Ci,$0=new Ie,J0=new Rr;var Ss=class extends ti{constructor(e=null,t=1,i=1,r,s,a,o,l,c=1003,h=1003,u,d){super(null,a,o,l,c,h,r,s,u,d),this.isDataTexture=!0,this.image={data:e,width:t,height:i},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}},K0=new Ie,Q0=new Ie;var oo=class extends St{constructor(e,t,i,r=1){super(e,t,i),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=r}copy(e){return super.copy(e),this.meshPerAttribute=e.meshPerAttribute,this}toJSON(){let e=super.toJSON();return e.meshPerAttribute=this.meshPerAttribute,e.isInstancedBufferAttribute=!0,e}},yr=new Ie,ld=new Ie,Aa=[],cd=new Ri,Bm=new Ie,hs=new pe,us=new Ci,lo=class extends pe{constructor(e,t,i){super(e,t),this.isInstancedMesh=!0,this.instanceMatrix=new oo(new Float32Array(16*i),16),this.instanceColor=null,this.morphTexture=null,this.count=i,this.boundingBox=null,this.boundingSphere=null;for(let r=0;r<i;r++)this.setMatrixAt(r,Bm)}computeBoundingBox(){let e=this.geometry,t=this.count;this.boundingBox===null&&(this.boundingBox=new Ri),e.boundingBox===null&&e.computeBoundingBox(),this.boundingBox.makeEmpty();for(let i=0;i<t;i++)this.getMatrixAt(i,yr),cd.copy(e.boundingBox).applyMatrix4(yr),this.boundingBox.union(cd)}computeBoundingSphere(){let e=this.geometry,t=this.count;this.boundingSphere===null&&(this.boundingSphere=new Ci),e.boundingSphere===null&&e.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let i=0;i<t;i++)this.getMatrixAt(i,yr),us.copy(e.boundingSphere).applyMatrix4(yr),this.boundingSphere.union(us)}copy(e,t){return super.copy(e,t),this.instanceMatrix.copy(e.instanceMatrix),e.morphTexture!==null&&(this.morphTexture=e.morphTexture.clone()),e.instanceColor!==null&&(this.instanceColor=e.instanceColor.clone()),this.count=e.count,e.boundingBox!==null&&(this.boundingBox=e.boundingBox.clone()),e.boundingSphere!==null&&(this.boundingSphere=e.boundingSphere.clone()),this}getColorAt(e,t){t.fromArray(this.instanceColor.array,3*e)}getMatrixAt(e,t){t.fromArray(this.instanceMatrix.array,16*e)}getMorphAt(e,t){let i=t.morphTargetInfluences,r=this.morphTexture.source.data.data,s=e*(i.length+1)+1;for(let a=0;a<i.length;a++)i[a]=r[s+a]}raycast(e,t){let i=this.matrixWorld,r=this.count;if(hs.geometry=this.geometry,hs.material=this.material,hs.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),us.copy(this.boundingSphere),us.applyMatrix4(i),e.ray.intersectsSphere(us)!==!1))for(let s=0;s<r;s++){this.getMatrixAt(s,yr),ld.multiplyMatrices(i,yr),hs.matrixWorld=ld,hs.raycast(e,Aa);for(let a=0,o=Aa.length;a<o;a++){let l=Aa[a];l.instanceId=s,l.object=this,t.push(l)}Aa.length=0}}setColorAt(e,t){this.instanceColor===null&&(this.instanceColor=new oo(new Float32Array(3*this.instanceMatrix.count).fill(1),3)),t.toArray(this.instanceColor.array,3*e)}setMatrixAt(e,t){t.toArray(this.instanceMatrix.array,16*e)}setMorphAt(e,t){let i=t.morphTargetInfluences,r=i.length+1;this.morphTexture===null&&(this.morphTexture=new Ss(new Float32Array(r*this.count),r,this.count,Rh,Bi));let s=this.morphTexture.source.data.data,a=0;for(let c=0;c<i.length;c++)a+=i[c];let o=this.geometry.morphTargetsRelative?1:1-a,l=r*e;s[l]=o,s.set(i,l+1)}updateMorphTargets(){}dispose(){return this.dispatchEvent({type:"dispose"}),this.morphTexture!==null&&(this.morphTexture.dispose(),this.morphTexture=null),this}};var Wc=class{constructor(){this.index=0,this.pool=[],this.list=[]}push(e,t,i){let r=this.pool,s=this.list;this.index>=r.length&&r.push({start:-1,count:-1,z:-1,index:-1});let a=r[this.index];s.push(a),this.index++,a.start=e.start,a.count=e.count,a.z=t,a.index=i}reset(){this.list.length=0,this.index=0}},eg=new Ie,tg=new Ie,ig=new Ie,ng=new be(1,1,1),rg=new Ie,sg=new Pr,ag=new Ri,og=new Ci,lg=new M,cg=new M,hg=new M,ug=new Wc,dg=new pe;var bs=class extends Hi{constructor(e){super(),this.isLineBasicMaterial=!0,this.type="LineBasicMaterial",this.color=new be(16777215),this.map=null,this.linewidth=1,this.linecap="round",this.linejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.linewidth=e.linewidth,this.linecap=e.linecap,this.linejoin=e.linejoin,this.fog=e.fog,this}},co=new M,ho=new M,hd=new Ie,ds=new Rr,Ra=new Ci,Fl=new M,ud=new M,Xc=class extends xt{constructor(e=new Je,t=new bs){super(),this.isLine=!0,this.type="Line",this.geometry=e,this.material=t,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}computeLineDistances(){let e=this.geometry;if(e.index===null){let t=e.attributes.position,i=[0];for(let r=1,s=t.count;r<s;r++)co.fromBufferAttribute(t,r-1),ho.fromBufferAttribute(t,r),i[r]=i[r-1],i[r]+=co.distanceTo(ho);e.setAttribute("lineDistance",new Ae(i,1))}else console.warn("THREE.Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}raycast(e,t){let i=this.geometry,r=this.matrixWorld,s=e.params.Line.threshold,a=i.drawRange;if(i.boundingSphere===null&&i.computeBoundingSphere(),Ra.copy(i.boundingSphere),Ra.applyMatrix4(r),Ra.radius+=s,e.ray.intersectsSphere(Ra)===!1)return;hd.copy(r).invert(),ds.copy(e.ray).applyMatrix4(hd);let o=s/((this.scale.x+this.scale.y+this.scale.z)/3),l=o*o,c=this.isLineSegments?2:1,h=i.index,u=i.attributes.position;if(h!==null){let d=Math.max(0,a.start),p=Math.min(h.count,a.start+a.count);for(let m=d,x=p-1;m<x;m+=c){let g=h.getX(m),f=h.getX(m+1),y=Ca(this,e,ds,l,g,f);y&&t.push(y)}if(this.isLineLoop){let m=h.getX(p-1),x=h.getX(d),g=Ca(this,e,ds,l,m,x);g&&t.push(g)}}else{let d=Math.max(0,a.start),p=Math.min(u.count,a.start+a.count);for(let m=d,x=p-1;m<x;m+=c){let g=Ca(this,e,ds,l,m,m+1);g&&t.push(g)}if(this.isLineLoop){let m=Ca(this,e,ds,l,p-1,d);m&&t.push(m)}}}updateMorphTargets(){let e=this.geometry.morphAttributes,t=Object.keys(e);if(t.length>0){let i=e[t[0]];if(i!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,s=i.length;r<s;r++){let a=i[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=r}}}}};function Ca(n,e,t,i,r,s){let a=n.geometry.attributes.position;if(co.fromBufferAttribute(a,r),ho.fromBufferAttribute(a,s),t.distanceSqToSegment(co,ho,Fl,ud)>i)return;Fl.applyMatrix4(n.matrixWorld);let o=e.ray.origin.distanceTo(Fl);return o<e.near||o>e.far?void 0:{distance:o,point:ud.clone().applyMatrix4(n.matrixWorld),index:r,face:null,faceIndex:null,barycoord:null,object:n}}var dd=new M,pd=new M,uo=class extends Xc{constructor(e,t){super(e,t),this.isLineSegments=!0,this.type="LineSegments"}computeLineDistances(){let e=this.geometry;if(e.index===null){let t=e.attributes.position,i=[];for(let r=0,s=t.count;r<s;r+=2)dd.fromBufferAttribute(t,r),pd.fromBufferAttribute(t,r+1),i[r]=r===0?0:i[r-1],i[r+1]=i[r]+dd.distanceTo(pd);e.setAttribute("lineDistance",new Ae(i,1))}else console.warn("THREE.LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}};var Dr=class extends Hi{constructor(e){super(),this.isPointsMaterial=!0,this.type="PointsMaterial",this.color=new be(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.alphaMap=e.alphaMap,this.size=e.size,this.sizeAttenuation=e.sizeAttenuation,this.fog=e.fog,this}},fd=new Ie,jc=new Rr,Pa=new Ci,Ia=new M,ws=class extends xt{constructor(e=new Je,t=new Dr){super(),this.isPoints=!0,this.type="Points",this.geometry=e,this.material=t,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}raycast(e,t){let i=this.geometry,r=this.matrixWorld,s=e.params.Points.threshold,a=i.drawRange;if(i.boundingSphere===null&&i.computeBoundingSphere(),Pa.copy(i.boundingSphere),Pa.applyMatrix4(r),Pa.radius+=s,e.ray.intersectsSphere(Pa)===!1)return;fd.copy(r).invert(),jc.copy(e.ray).applyMatrix4(fd);let o=s/((this.scale.x+this.scale.y+this.scale.z)/3),l=o*o,c=i.index,h=i.attributes.position;if(c!==null)for(let u=Math.max(0,a.start),d=Math.min(c.count,a.start+a.count);u<d;u++){let p=c.getX(u);Ia.fromBufferAttribute(h,p),md(Ia,p,l,r,e,t,this)}else for(let u=Math.max(0,a.start),d=Math.min(h.count,a.start+a.count);u<d;u++)Ia.fromBufferAttribute(h,u),md(Ia,u,l,r,e,t,this)}updateMorphTargets(){let e=this.geometry.morphAttributes,t=Object.keys(e);if(t.length>0){let i=e[t[0]];if(i!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,s=i.length;r<s;r++){let a=i[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=r}}}}};function md(n,e,t,i,r,s,a){let o=jc.distanceSqToPoint(n);if(o<t){let l=new M;jc.closestPointToPoint(n,l),l.applyMatrix4(i);let c=r.ray.origin.distanceTo(l);if(c<r.near||c>r.far)return;s.push({distance:c,distanceToRay:Math.sqrt(o),point:l,index:e,face:null,faceIndex:null,barycoord:null,object:a})}}var yn=class extends ti{constructor(e,t,i,r,s,a,o,l,c){super(e,t,i,r,s,a,o,l,c),this.isCanvasTexture=!0,this.needsUpdate=!0}},vi=class{constructor(){this.type="Curve",this.arcLengthDivisions=200}getPoint(){return console.warn("THREE.Curve: .getPoint() not implemented."),null}getPointAt(e,t){let i=this.getUtoTmapping(e);return this.getPoint(i,t)}getPoints(e=5){let t=[];for(let i=0;i<=e;i++)t.push(this.getPoint(i/e));return t}getSpacedPoints(e=5){let t=[];for(let i=0;i<=e;i++)t.push(this.getPointAt(i/e));return t}getLength(){let e=this.getLengths();return e[e.length-1]}getLengths(e=this.arcLengthDivisions){if(this.cacheArcLengths&&this.cacheArcLengths.length===e+1&&!this.needsUpdate)return this.cacheArcLengths;this.needsUpdate=!1;let t=[],i,r=this.getPoint(0),s=0;t.push(0);for(let a=1;a<=e;a++)i=this.getPoint(a/e),s+=i.distanceTo(r),t.push(s),r=i;return this.cacheArcLengths=t,t}updateArcLengths(){this.needsUpdate=!0,this.getLengths()}getUtoTmapping(e,t){let i=this.getLengths(),r=0,s=i.length,a;a=t||e*i[s-1];let o,l=0,c=s-1;for(;l<=c;)if(r=Math.floor(l+(c-l)/2),o=i[r]-a,o<0)l=r+1;else{if(!(o>0)){c=r;break}c=r-1}if(r=c,i[r]===a)return r/(s-1);let h=i[r];return(r+(a-h)/(i[r+1]-h))/(s-1)}getTangent(e,t){let r=e-1e-4,s=e+1e-4;r<0&&(r=0),s>1&&(s=1);let a=this.getPoint(r),o=this.getPoint(s),l=t||(a.isVector2?new re:new M);return l.copy(o).sub(a).normalize(),l}getTangentAt(e,t){let i=this.getUtoTmapping(e);return this.getTangent(i,t)}computeFrenetFrames(e,t){let i=new M,r=[],s=[],a=[],o=new M,l=new Ie;for(let p=0;p<=e;p++){let m=p/e;r[p]=this.getTangentAt(m,new M)}s[0]=new M,a[0]=new M;let c=Number.MAX_VALUE,h=Math.abs(r[0].x),u=Math.abs(r[0].y),d=Math.abs(r[0].z);h<=c&&(c=h,i.set(1,0,0)),u<=c&&(c=u,i.set(0,1,0)),d<=c&&i.set(0,0,1),o.crossVectors(r[0],i).normalize(),s[0].crossVectors(r[0],o),a[0].crossVectors(r[0],s[0]);for(let p=1;p<=e;p++){if(s[p]=s[p-1].clone(),a[p]=a[p-1].clone(),o.crossVectors(r[p-1],r[p]),o.length()>Number.EPSILON){o.normalize();let m=Math.acos(kt(r[p-1].dot(r[p]),-1,1));s[p].applyMatrix4(l.makeRotationAxis(o,m))}a[p].crossVectors(r[p],s[p])}if(t===!0){let p=Math.acos(kt(s[0].dot(s[e]),-1,1));p/=e,r[0].dot(o.crossVectors(s[0],s[e]))>0&&(p=-p);for(let m=1;m<=e;m++)s[m].applyMatrix4(l.makeRotationAxis(r[m],p*m)),a[m].crossVectors(r[m],s[m])}return{tangents:r,normals:s,binormals:a}}clone(){return new this.constructor().copy(this)}copy(e){return this.arcLengthDivisions=e.arcLengthDivisions,this}toJSON(){let e={metadata:{version:4.6,type:"Curve",generator:"Curve.toJSON"}};return e.arcLengthDivisions=this.arcLengthDivisions,e.type=this.type,e}fromJSON(e){return this.arcLengthDivisions=e.arcLengthDivisions,this}},Es=class extends vi{constructor(e=0,t=0,i=1,r=1,s=0,a=2*Math.PI,o=!1,l=0){super(),this.isEllipseCurve=!0,this.type="EllipseCurve",this.aX=e,this.aY=t,this.xRadius=i,this.yRadius=r,this.aStartAngle=s,this.aEndAngle=a,this.aClockwise=o,this.aRotation=l}getPoint(e,t=new re){let i=t,r=2*Math.PI,s=this.aEndAngle-this.aStartAngle,a=Math.abs(s)<Number.EPSILON;for(;s<0;)s+=r;for(;s>r;)s-=r;s<Number.EPSILON&&(s=a?0:r),this.aClockwise!==!0||a||(s===r?s=-r:s-=r);let o=this.aStartAngle+e*s,l=this.aX+this.xRadius*Math.cos(o),c=this.aY+this.yRadius*Math.sin(o);if(this.aRotation!==0){let h=Math.cos(this.aRotation),u=Math.sin(this.aRotation),d=l-this.aX,p=c-this.aY;l=d*h-p*u+this.aX,c=d*u+p*h+this.aY}return i.set(l,c)}copy(e){return super.copy(e),this.aX=e.aX,this.aY=e.aY,this.xRadius=e.xRadius,this.yRadius=e.yRadius,this.aStartAngle=e.aStartAngle,this.aEndAngle=e.aEndAngle,this.aClockwise=e.aClockwise,this.aRotation=e.aRotation,this}toJSON(){let e=super.toJSON();return e.aX=this.aX,e.aY=this.aY,e.xRadius=this.xRadius,e.yRadius=this.yRadius,e.aStartAngle=this.aStartAngle,e.aEndAngle=this.aEndAngle,e.aClockwise=this.aClockwise,e.aRotation=this.aRotation,e}fromJSON(e){return super.fromJSON(e),this.aX=e.aX,this.aY=e.aY,this.xRadius=e.xRadius,this.yRadius=e.yRadius,this.aStartAngle=e.aStartAngle,this.aEndAngle=e.aEndAngle,this.aClockwise=e.aClockwise,this.aRotation=e.aRotation,this}},qc=class extends Es{constructor(e,t,i,r,s,a){super(e,t,i,i,r,s,a),this.isArcCurve=!0,this.type="ArcCurve"}};function Dh(){let n=0,e=0,t=0,i=0;function r(s,a,o,l){n=s,e=o,t=-3*s+3*a-2*o-l,i=2*s-2*a+o+l}return{initCatmullRom:function(s,a,o,l,c){r(a,o,c*(o-s),c*(l-a))},initNonuniformCatmullRom:function(s,a,o,l,c,h,u){let d=(a-s)/c-(o-s)/(c+h)+(o-a)/h,p=(o-a)/h-(l-a)/(h+u)+(l-o)/u;d*=h,p*=h,r(a,o,d,p)},calc:function(s){let a=s*s;return n+e*s+t*a+i*(a*s)}}}var La=new M,Bl=new Dh,zl=new Dh,Hl=new Dh,Yc=class extends vi{constructor(e=[],t=!1,i="centripetal",r=.5){super(),this.isCatmullRomCurve3=!0,this.type="CatmullRomCurve3",this.points=e,this.closed=t,this.curveType=i,this.tension=r}getPoint(e,t=new M){let i=t,r=this.points,s=r.length,a=(s-(this.closed?0:1))*e,o,l,c=Math.floor(a),h=a-c;this.closed?c+=c>0?0:(Math.floor(Math.abs(c)/s)+1)*s:h===0&&c===s-1&&(c=s-2,h=1),this.closed||c>0?o=r[(c-1)%s]:(La.subVectors(r[0],r[1]).add(r[0]),o=La);let u=r[c%s],d=r[(c+1)%s];if(this.closed||c+2<s?l=r[(c+2)%s]:(La.subVectors(r[s-1],r[s-2]).add(r[s-1]),l=La),this.curveType==="centripetal"||this.curveType==="chordal"){let p=this.curveType==="chordal"?.5:.25,m=Math.pow(o.distanceToSquared(u),p),x=Math.pow(u.distanceToSquared(d),p),g=Math.pow(d.distanceToSquared(l),p);x<1e-4&&(x=1),m<1e-4&&(m=x),g<1e-4&&(g=x),Bl.initNonuniformCatmullRom(o.x,u.x,d.x,l.x,m,x,g),zl.initNonuniformCatmullRom(o.y,u.y,d.y,l.y,m,x,g),Hl.initNonuniformCatmullRom(o.z,u.z,d.z,l.z,m,x,g)}else this.curveType==="catmullrom"&&(Bl.initCatmullRom(o.x,u.x,d.x,l.x,this.tension),zl.initCatmullRom(o.y,u.y,d.y,l.y,this.tension),Hl.initCatmullRom(o.z,u.z,d.z,l.z,this.tension));return i.set(Bl.calc(h),zl.calc(h),Hl.calc(h)),i}copy(e){super.copy(e),this.points=[];for(let t=0,i=e.points.length;t<i;t++){let r=e.points[t];this.points.push(r.clone())}return this.closed=e.closed,this.curveType=e.curveType,this.tension=e.tension,this}toJSON(){let e=super.toJSON();e.points=[];for(let t=0,i=this.points.length;t<i;t++){let r=this.points[t];e.points.push(r.toArray())}return e.closed=this.closed,e.curveType=this.curveType,e.tension=this.tension,e}fromJSON(e){super.fromJSON(e),this.points=[];for(let t=0,i=e.points.length;t<i;t++){let r=e.points[t];this.points.push(new M().fromArray(r))}return this.closed=e.closed,this.curveType=e.curveType,this.tension=e.tension,this}};function gd(n,e,t,i,r){let s=.5*(i-e),a=.5*(r-t),o=n*n;return(2*t-2*i+s+a)*(n*o)+(-3*t+3*i-2*s-a)*o+s*n+t}function ms(n,e,t,i){return function(r,s){let a=1-r;return a*a*s}(n,e)+function(r,s){return 2*(1-r)*r*s}(n,t)+function(r,s){return r*r*s}(n,i)}function gs(n,e,t,i,r){return function(s,a){let o=1-s;return o*o*o*a}(n,e)+function(s,a){let o=1-s;return 3*o*o*s*a}(n,t)+function(s,a){return 3*(1-s)*s*s*a}(n,i)+function(s,a){return s*s*s*a}(n,r)}var po=class extends vi{constructor(e=new re,t=new re,i=new re,r=new re){super(),this.isCubicBezierCurve=!0,this.type="CubicBezierCurve",this.v0=e,this.v1=t,this.v2=i,this.v3=r}getPoint(e,t=new re){let i=t,r=this.v0,s=this.v1,a=this.v2,o=this.v3;return i.set(gs(e,r.x,s.x,a.x,o.x),gs(e,r.y,s.y,a.y,o.y)),i}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this.v3.copy(e.v3),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e.v3=this.v3.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this.v3.fromArray(e.v3),this}},Zc=class extends vi{constructor(e=new M,t=new M,i=new M,r=new M){super(),this.isCubicBezierCurve3=!0,this.type="CubicBezierCurve3",this.v0=e,this.v1=t,this.v2=i,this.v3=r}getPoint(e,t=new M){let i=t,r=this.v0,s=this.v1,a=this.v2,o=this.v3;return i.set(gs(e,r.x,s.x,a.x,o.x),gs(e,r.y,s.y,a.y,o.y),gs(e,r.z,s.z,a.z,o.z)),i}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this.v3.copy(e.v3),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e.v3=this.v3.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this.v3.fromArray(e.v3),this}},fo=class extends vi{constructor(e=new re,t=new re){super(),this.isLineCurve=!0,this.type="LineCurve",this.v1=e,this.v2=t}getPoint(e,t=new re){let i=t;return e===1?i.copy(this.v2):(i.copy(this.v2).sub(this.v1),i.multiplyScalar(e).add(this.v1)),i}getPointAt(e,t){return this.getPoint(e,t)}getTangent(e,t=new re){return t.subVectors(this.v2,this.v1).normalize()}getTangentAt(e,t){return this.getTangent(e,t)}copy(e){return super.copy(e),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},$c=class extends vi{constructor(e=new M,t=new M){super(),this.isLineCurve3=!0,this.type="LineCurve3",this.v1=e,this.v2=t}getPoint(e,t=new M){let i=t;return e===1?i.copy(this.v2):(i.copy(this.v2).sub(this.v1),i.multiplyScalar(e).add(this.v1)),i}getPointAt(e,t){return this.getPoint(e,t)}getTangent(e,t=new M){return t.subVectors(this.v2,this.v1).normalize()}getTangentAt(e,t){return this.getTangent(e,t)}copy(e){return super.copy(e),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},mo=class extends vi{constructor(e=new re,t=new re,i=new re){super(),this.isQuadraticBezierCurve=!0,this.type="QuadraticBezierCurve",this.v0=e,this.v1=t,this.v2=i}getPoint(e,t=new re){let i=t,r=this.v0,s=this.v1,a=this.v2;return i.set(ms(e,r.x,s.x,a.x),ms(e,r.y,s.y,a.y)),i}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},go=class extends vi{constructor(e=new M,t=new M,i=new M){super(),this.isQuadraticBezierCurve3=!0,this.type="QuadraticBezierCurve3",this.v0=e,this.v1=t,this.v2=i}getPoint(e,t=new M){let i=t,r=this.v0,s=this.v1,a=this.v2;return i.set(ms(e,r.x,s.x,a.x),ms(e,r.y,s.y,a.y),ms(e,r.z,s.z,a.z)),i}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},vo=class extends vi{constructor(e=[]){super(),this.isSplineCurve=!0,this.type="SplineCurve",this.points=e}getPoint(e,t=new re){let i=t,r=this.points,s=(r.length-1)*e,a=Math.floor(s),o=s-a,l=r[a===0?a:a-1],c=r[a],h=r[a>r.length-2?r.length-1:a+1],u=r[a>r.length-3?r.length-1:a+2];return i.set(gd(o,l.x,c.x,h.x,u.x),gd(o,l.y,c.y,h.y,u.y)),i}copy(e){super.copy(e),this.points=[];for(let t=0,i=e.points.length;t<i;t++){let r=e.points[t];this.points.push(r.clone())}return this}toJSON(){let e=super.toJSON();e.points=[];for(let t=0,i=this.points.length;t<i;t++){let r=this.points[t];e.points.push(r.toArray())}return e}fromJSON(e){super.fromJSON(e),this.points=[];for(let t=0,i=e.points.length;t<i;t++){let r=e.points[t];this.points.push(new re().fromArray(r))}return this}},yo=Object.freeze({__proto__:null,ArcCurve:qc,CatmullRomCurve3:Yc,CubicBezierCurve:po,CubicBezierCurve3:Zc,EllipseCurve:Es,LineCurve:fo,LineCurve3:$c,QuadraticBezierCurve:mo,QuadraticBezierCurve3:go,SplineCurve:vo}),Jc=class extends vi{constructor(){super(),this.type="CurvePath",this.curves=[],this.autoClose=!1}add(e){this.curves.push(e)}closePath(){let e=this.curves[0].getPoint(0),t=this.curves[this.curves.length-1].getPoint(1);if(!e.equals(t)){let i=e.isVector2===!0?"LineCurve":"LineCurve3";this.curves.push(new yo[i](t,e))}return this}getPoint(e,t){let i=e*this.getLength(),r=this.getCurveLengths(),s=0;for(;s<r.length;){if(r[s]>=i){let a=r[s]-i,o=this.curves[s],l=o.getLength(),c=l===0?0:1-a/l;return o.getPointAt(c,t)}s++}return null}getLength(){let e=this.getCurveLengths();return e[e.length-1]}updateArcLengths(){this.needsUpdate=!0,this.cacheLengths=null,this.getCurveLengths()}getCurveLengths(){if(this.cacheLengths&&this.cacheLengths.length===this.curves.length)return this.cacheLengths;let e=[],t=0;for(let i=0,r=this.curves.length;i<r;i++)t+=this.curves[i].getLength(),e.push(t);return this.cacheLengths=e,e}getSpacedPoints(e=40){let t=[];for(let i=0;i<=e;i++)t.push(this.getPoint(i/e));return this.autoClose&&t.push(t[0]),t}getPoints(e=12){let t=[],i;for(let r=0,s=this.curves;r<s.length;r++){let a=s[r],o=a.isEllipseCurve?2*e:a.isLineCurve||a.isLineCurve3?1:a.isSplineCurve?e*a.points.length:e,l=a.getPoints(o);for(let c=0;c<l.length;c++){let h=l[c];i&&i.equals(h)||(t.push(h),i=h)}}return this.autoClose&&t.length>1&&!t[t.length-1].equals(t[0])&&t.push(t[0]),t}copy(e){super.copy(e),this.curves=[];for(let t=0,i=e.curves.length;t<i;t++){let r=e.curves[t];this.curves.push(r.clone())}return this.autoClose=e.autoClose,this}toJSON(){let e=super.toJSON();e.autoClose=this.autoClose,e.curves=[];for(let t=0,i=this.curves.length;t<i;t++){let r=this.curves[t];e.curves.push(r.toJSON())}return e}fromJSON(e){super.fromJSON(e),this.autoClose=e.autoClose,this.curves=[];for(let t=0,i=e.curves.length;t<i;t++){let r=e.curves[t];this.curves.push(new yo[r.type]().fromJSON(r))}return this}},Ts=class extends Jc{constructor(e){super(),this.type="Path",this.currentPoint=new re,e&&this.setFromPoints(e)}setFromPoints(e){this.moveTo(e[0].x,e[0].y);for(let t=1,i=e.length;t<i;t++)this.lineTo(e[t].x,e[t].y);return this}moveTo(e,t){return this.currentPoint.set(e,t),this}lineTo(e,t){let i=new fo(this.currentPoint.clone(),new re(e,t));return this.curves.push(i),this.currentPoint.set(e,t),this}quadraticCurveTo(e,t,i,r){let s=new mo(this.currentPoint.clone(),new re(e,t),new re(i,r));return this.curves.push(s),this.currentPoint.set(i,r),this}bezierCurveTo(e,t,i,r,s,a){let o=new po(this.currentPoint.clone(),new re(e,t),new re(i,r),new re(s,a));return this.curves.push(o),this.currentPoint.set(s,a),this}splineThru(e){let t=[this.currentPoint.clone()].concat(e),i=new vo(t);return this.curves.push(i),this.currentPoint.copy(e[e.length-1]),this}arc(e,t,i,r,s,a){let o=this.currentPoint.x,l=this.currentPoint.y;return this.absarc(e+o,t+l,i,r,s,a),this}absarc(e,t,i,r,s,a){return this.absellipse(e,t,i,i,r,s,a),this}ellipse(e,t,i,r,s,a,o,l){let c=this.currentPoint.x,h=this.currentPoint.y;return this.absellipse(e+c,t+h,i,r,s,a,o,l),this}absellipse(e,t,i,r,s,a,o,l){let c=new Es(e,t,i,r,s,a,o,l);if(this.curves.length>0){let u=c.getPoint(0);u.equals(this.currentPoint)||this.lineTo(u.x,u.y)}this.curves.push(c);let h=c.getPoint(1);return this.currentPoint.copy(h),this}copy(e){return super.copy(e),this.currentPoint.copy(e.currentPoint),this}toJSON(){let e=super.toJSON();return e.currentPoint=this.currentPoint.toArray(),e}fromJSON(e){return super.fromJSON(e),this.currentPoint.fromArray(e.currentPoint),this}},xo=class n extends Je{constructor(e=[new re(0,-.5),new re(.5,0),new re(0,.5)],t=12,i=0,r=2*Math.PI){super(),this.type="LatheGeometry",this.parameters={points:e,segments:t,phiStart:i,phiLength:r},t=Math.floor(t),r=kt(r,0,2*Math.PI);let s=[],a=[],o=[],l=[],c=[],h=1/t,u=new M,d=new re,p=new M,m=new M,x=new M,g=0,f=0;for(let y=0;y<=e.length-1;y++)switch(y){case 0:g=e[y+1].x-e[y].x,f=e[y+1].y-e[y].y,p.x=1*f,p.y=-g,p.z=0*f,x.copy(p),p.normalize(),l.push(p.x,p.y,p.z);break;case e.length-1:l.push(x.x,x.y,x.z);break;default:g=e[y+1].x-e[y].x,f=e[y+1].y-e[y].y,p.x=1*f,p.y=-g,p.z=0*f,m.copy(p),p.x+=x.x,p.y+=x.y,p.z+=x.z,p.normalize(),l.push(p.x,p.y,p.z),x.copy(m)}for(let y=0;y<=t;y++){let v=i+y*h*r,_=Math.sin(v),E=Math.cos(v);for(let T=0;T<=e.length-1;T++){u.x=e[T].x*_,u.y=e[T].y,u.z=e[T].x*E,a.push(u.x,u.y,u.z),d.x=y/t,d.y=T/(e.length-1),o.push(d.x,d.y);let A=l[3*T+0]*_,B=l[3*T+1],U=l[3*T+0]*E;c.push(A,B,U)}}for(let y=0;y<t;y++)for(let v=0;v<e.length-1;v++){let _=v+y*e.length,E=_,T=_+e.length,A=_+e.length+1,B=_+1;s.push(E,T,B),s.push(A,B,T)}this.setIndex(s),this.setAttribute("position",new Ae(a,3)),this.setAttribute("uv",new Ae(o,2)),this.setAttribute("normal",new Ae(c,3))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.points,e.segments,e.phiStart,e.phiLength)}},Kc=class n extends xo{constructor(e=1,t=1,i=4,r=8){let s=new Ts;s.absarc(0,-t/2,e,1.5*Math.PI,0),s.absarc(0,t/2,e,0,.5*Math.PI),super(s.getPoints(i),r),this.type="CapsuleGeometry",this.parameters={radius:e,length:t,capSegments:i,radialSegments:r}}static fromJSON(e){return new n(e.radius,e.length,e.capSegments,e.radialSegments)}},As=class n extends Je{constructor(e=1,t=32,i=0,r=2*Math.PI){super(),this.type="CircleGeometry",this.parameters={radius:e,segments:t,thetaStart:i,thetaLength:r},t=Math.max(3,t);let s=[],a=[],o=[],l=[],c=new M,h=new re;a.push(0,0,0),o.push(0,0,1),l.push(.5,.5);for(let u=0,d=3;u<=t;u++,d+=3){let p=i+u/t*r;c.x=e*Math.cos(p),c.y=e*Math.sin(p),a.push(c.x,c.y,c.z),o.push(0,0,1),h.x=(a[d]/e+1)/2,h.y=(a[d+1]/e+1)/2,l.push(h.x,h.y)}for(let u=1;u<=t;u++)s.push(u,u+1,0);this.setIndex(s),this.setAttribute("position",new Ae(a,3)),this.setAttribute("normal",new Ae(o,3)),this.setAttribute("uv",new Ae(l,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.radius,e.segments,e.thetaStart,e.thetaLength)}},Wt=class n extends Je{constructor(e=1,t=1,i=1,r=32,s=1,a=!1,o=0,l=2*Math.PI){super(),this.type="CylinderGeometry",this.parameters={radiusTop:e,radiusBottom:t,height:i,radialSegments:r,heightSegments:s,openEnded:a,thetaStart:o,thetaLength:l};let c=this;r=Math.floor(r),s=Math.floor(s);let h=[],u=[],d=[],p=[],m=0,x=[],g=i/2,f=0;function y(v){let _=m,E=new re,T=new M,A=0,B=v===!0?e:t,U=v===!0?1:-1;for(let V=1;V<=r;V++)u.push(0,g*U,0),d.push(0,U,0),p.push(.5,.5),m++;let W=m;for(let V=0;V<=r;V++){let F=V/r*l+o,X=Math.cos(F),H=Math.sin(F);T.x=B*H,T.y=g*U,T.z=B*X,u.push(T.x,T.y,T.z),d.push(0,U,0),E.x=.5*X+.5,E.y=.5*H*U+.5,p.push(E.x,E.y),m++}for(let V=0;V<r;V++){let F=_+V,X=W+V;v===!0?h.push(X,X+1,F):h.push(X+1,X,F),A+=3}c.addGroup(f,A,v===!0?1:2),f+=A}(function(){let v=new M,_=new M,E=0,T=(t-e)/i;for(let A=0;A<=s;A++){let B=[],U=A/s,W=U*(t-e)+e;for(let V=0;V<=r;V++){let F=V/r,X=F*l+o,H=Math.sin(X),Y=Math.cos(X);_.x=W*H,_.y=-U*i+g,_.z=W*Y,u.push(_.x,_.y,_.z),v.set(H,T,Y).normalize(),d.push(v.x,v.y,v.z),p.push(F,1-U),B.push(m++)}x.push(B)}for(let A=0;A<r;A++)for(let B=0;B<s;B++){let U=x[B][A],W=x[B+1][A],V=x[B+1][A+1],F=x[B][A+1];e>0&&(h.push(U,W,F),E+=3),t>0&&(h.push(W,V,F),E+=3)}c.addGroup(f,E,0),f+=E})(),a===!1&&(e>0&&y(!0),t>0&&y(!1)),this.setIndex(h),this.setAttribute("position",new Ae(u,3)),this.setAttribute("normal",new Ae(d,3)),this.setAttribute("uv",new Ae(p,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.radiusTop,e.radiusBottom,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}},Rs=class n extends Wt{constructor(e=1,t=1,i=32,r=1,s=!1,a=0,o=2*Math.PI){super(0,e,t,i,r,s,a,o),this.type="ConeGeometry",this.parameters={radius:e,height:t,radialSegments:i,heightSegments:r,openEnded:s,thetaStart:a,thetaLength:o}}static fromJSON(e){return new n(e.radius,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}},Wn=class n extends Je{constructor(e=[],t=[],i=1,r=0){super(),this.type="PolyhedronGeometry",this.parameters={vertices:e,indices:t,radius:i,detail:r};let s=[],a=[];function o(d,p,m,x){let g=x+1,f=[];for(let y=0;y<=g;y++){f[y]=[];let v=d.clone().lerp(m,y/g),_=p.clone().lerp(m,y/g),E=g-y;for(let T=0;T<=E;T++)f[y][T]=T===0&&y===g?v:v.clone().lerp(_,T/E)}for(let y=0;y<g;y++)for(let v=0;v<2*(g-y)-1;v++){let _=Math.floor(v/2);v%2==0?(l(f[y][_+1]),l(f[y+1][_]),l(f[y][_])):(l(f[y][_+1]),l(f[y+1][_+1]),l(f[y+1][_]))}}function l(d){s.push(d.x,d.y,d.z)}function c(d,p){let m=3*d;p.x=e[m+0],p.y=e[m+1],p.z=e[m+2]}function h(d,p,m,x){x<0&&d.x===1&&(a[p]=d.x-1),m.x===0&&m.z===0&&(a[p]=x/2/Math.PI+.5)}function u(d){return Math.atan2(d.z,-d.x)}(function(d){let p=new M,m=new M,x=new M;for(let g=0;g<t.length;g+=3)c(t[g+0],p),c(t[g+1],m),c(t[g+2],x),o(p,m,x,d)})(r),function(d){let p=new M;for(let m=0;m<s.length;m+=3)p.x=s[m+0],p.y=s[m+1],p.z=s[m+2],p.normalize().multiplyScalar(d),s[m+0]=p.x,s[m+1]=p.y,s[m+2]=p.z}(i),function(){let d=new M;for(let m=0;m<s.length;m+=3){d.x=s[m+0],d.y=s[m+1],d.z=s[m+2];let x=u(d)/2/Math.PI+.5,g=(p=d,Math.atan2(-p.y,Math.sqrt(p.x*p.x+p.z*p.z))/Math.PI+.5);a.push(x,1-g)}var p;(function(){let m=new M,x=new M,g=new M,f=new M,y=new re,v=new re,_=new re;for(let E=0,T=0;E<s.length;E+=9,T+=6){m.set(s[E+0],s[E+1],s[E+2]),x.set(s[E+3],s[E+4],s[E+5]),g.set(s[E+6],s[E+7],s[E+8]),y.set(a[T+0],a[T+1]),v.set(a[T+2],a[T+3]),_.set(a[T+4],a[T+5]),f.copy(m).add(x).add(g).divideScalar(3);let A=u(f);h(y,T+0,m,A),h(v,T+2,x,A),h(_,T+4,g,A)}})(),function(){for(let m=0;m<a.length;m+=6){let x=a[m+0],g=a[m+2],f=a[m+4],y=Math.max(x,g,f),v=Math.min(x,g,f);y>.9&&v<.1&&(x<.2&&(a[m+0]+=1),g<.2&&(a[m+2]+=1),f<.2&&(a[m+4]+=1))}}()}(),this.setAttribute("position",new Ae(s,3)),this.setAttribute("normal",new Ae(s.slice(),3)),this.setAttribute("uv",new Ae(a,2)),r===0?this.computeVertexNormals():this.normalizeNormals()}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.vertices,e.indices,e.radius,e.details)}},Qc=class n extends Wn{constructor(e=1,t=0){let i=(1+Math.sqrt(5))/2,r=1/i;super([-1,-1,-1,-1,-1,1,-1,1,-1,-1,1,1,1,-1,-1,1,-1,1,1,1,-1,1,1,1,0,-r,-i,0,-r,i,0,r,-i,0,r,i,-r,-i,0,-r,i,0,r,-i,0,r,i,0,-i,0,-r,i,0,-r,-i,0,r,i,0,r],[3,11,7,3,7,15,3,15,13,7,19,17,7,17,6,7,6,15,17,4,8,17,8,10,17,10,6,8,0,16,8,16,2,8,2,10,0,12,1,0,1,18,0,18,16,6,10,2,6,2,13,6,13,15,2,16,18,2,18,3,2,3,13,18,1,9,18,9,11,18,11,3,4,14,12,4,12,0,4,0,8,11,9,5,11,5,19,11,19,7,19,5,14,19,14,4,19,4,17,1,12,14,1,14,5,1,5,9],e,t),this.type="DodecahedronGeometry",this.parameters={radius:e,detail:t}}static fromJSON(e){return new n(e.radius,e.detail)}},Ua=new M,Da=new M,Vl=new M,Na=new en,eh=class extends Je{constructor(e=null,t=1){if(super(),this.type="EdgesGeometry",this.parameters={geometry:e,thresholdAngle:t},e!==null){let r=Math.pow(10,4),s=Math.cos(Wa*t),a=e.getIndex(),o=e.getAttribute("position"),l=a?a.count:o.count,c=[0,0,0],h=["a","b","c"],u=new Array(3),d={},p=[];for(let m=0;m<l;m+=3){a?(c[0]=a.getX(m),c[1]=a.getX(m+1),c[2]=a.getX(m+2)):(c[0]=m,c[1]=m+1,c[2]=m+2);let{a:x,b:g,c:f}=Na;if(x.fromBufferAttribute(o,c[0]),g.fromBufferAttribute(o,c[1]),f.fromBufferAttribute(o,c[2]),Na.getNormal(Vl),u[0]=`${Math.round(x.x*r)},${Math.round(x.y*r)},${Math.round(x.z*r)}`,u[1]=`${Math.round(g.x*r)},${Math.round(g.y*r)},${Math.round(g.z*r)}`,u[2]=`${Math.round(f.x*r)},${Math.round(f.y*r)},${Math.round(f.z*r)}`,u[0]!==u[1]&&u[1]!==u[2]&&u[2]!==u[0])for(let y=0;y<3;y++){let v=(y+1)%3,_=u[y],E=u[v],T=Na[h[y]],A=Na[h[v]],B=`${_}_${E}`,U=`${E}_${_}`;U in d&&d[U]?(Vl.dot(d[U].normal)<=s&&(p.push(T.x,T.y,T.z),p.push(A.x,A.y,A.z)),d[U]=null):B in d||(d[B]={index0:c[y],index1:c[v],normal:Vl.clone()})}}for(let m in d)if(d[m]){let{index0:x,index1:g}=d[m];Ua.fromBufferAttribute(o,x),Da.fromBufferAttribute(o,g),p.push(Ua.x,Ua.y,Ua.z),p.push(Da.x,Da.y,Da.z)}this.setAttribute("position",new Ae(p,3))}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}},Nr=class extends Ts{constructor(e){super(e),this.uuid=tn(),this.type="Shape",this.holes=[]}getPointsHoles(e){let t=[];for(let i=0,r=this.holes.length;i<r;i++)t[i]=this.holes[i].getPoints(e);return t}extractPoints(e){return{shape:this.getPoints(e),holes:this.getPointsHoles(e)}}copy(e){super.copy(e),this.holes=[];for(let t=0,i=e.holes.length;t<i;t++){let r=e.holes[t];this.holes.push(r.clone())}return this}toJSON(){let e=super.toJSON();e.uuid=this.uuid,e.holes=[];for(let t=0,i=this.holes.length;t<i;t++){let r=this.holes[t];e.holes.push(r.toJSON())}return e}fromJSON(e){super.fromJSON(e),this.uuid=e.uuid,this.holes=[];for(let t=0,i=e.holes.length;t<i;t++){let r=e.holes[t];this.holes.push(new Ts().fromJSON(r))}return this}},zm=function(n,e,t=2){let i=e&&e.length,r=i?e[0]*t:n.length,s=vd(n,0,r,t,!0),a=[];if(!s||s.next===s.prev)return a;let o,l,c,h,u,d,p;if(i&&(s=function(m,x,g,f){let y=[],v,_,E,T,A;for(v=0,_=x.length;v<_;v++)E=x[v]*f,T=v<_-1?x[v+1]*f:m.length,A=vd(m,E,T,f,!1),A===A.next&&(A.steiner=!0),y.push(Ym(A));for(y.sort(Xm),v=0;v<y.length;v++)g=jm(y[v],g);return g}(n,e,s,t)),n.length>80*t){o=c=n[0],l=h=n[1];for(let m=t;m<r;m+=t)u=n[m],d=n[m+1],u<o&&(o=u),d<l&&(l=d),u>c&&(c=u),d>h&&(h=d);p=Math.max(c-o,h-l),p=p!==0?32767/p:0}return Cs(s,a,t,o,l,p,0),a};function vd(n,e,t,i,r){let s,a;if(r===function(o,l,c,h){let u=0;for(let d=l,p=c-h;d<c;d+=h)u+=(o[p]-o[d])*(o[d+1]+o[p+1]),p=d;return u}(n,e,t,i)>0)for(s=e;s<t;s+=i)a=yd(s,n[s],n[s+1],a);else for(s=t-i;s>=e;s-=i)a=yd(s,n[s],n[s+1],a);return a&&Ao(a,a.next)&&(Is(a),a=a.next),a}function Xn(n,e){if(!n)return n;e||(e=n);let t,i=n;do if(t=!1,i.steiner||!Ao(i,i.next)&&ft(i.prev,i,i.next)!==0)i=i.next;else{if(Is(i),i=e=i.prev,i===i.next)break;t=!0}while(t||i!==e);return e}function Cs(n,e,t,i,r,s,a){if(!n)return;!a&&s&&function(h,u,d,p){let m=h;do m.z===0&&(m.z=th(m.x,m.y,u,d,p)),m.prevZ=m.prev,m.nextZ=m.next,m=m.next;while(m!==h);m.prevZ.nextZ=null,m.prevZ=null,function(x){let g,f,y,v,_,E,T,A,B=1;do{for(f=x,x=null,_=null,E=0;f;){for(E++,y=f,T=0,g=0;g<B&&(T++,y=y.nextZ,y);g++);for(A=B;T>0||A>0&&y;)T!==0&&(A===0||!y||f.z<=y.z)?(v=f,f=f.nextZ,T--):(v=y,y=y.nextZ,A--),_?_.nextZ=v:x=v,v.prevZ=_,_=v;f=y}_.nextZ=null,B*=2}while(E>1)}(m)}(n,i,r,s);let o,l,c=n;for(;n.prev!==n.next;)if(o=n.prev,l=n.next,s?Vm(n,i,r,s):Hm(n))e.push(o.i/t|0),e.push(n.i/t|0),e.push(l.i/t|0),Is(n),n=l.next,c=l.next;else if((n=l)===c){a?a===1?Cs(n=Gm(Xn(n),e,t),e,t,i,r,s,2):a===2&&Wm(n,e,t,i,r,s):Cs(Xn(n),e,t,i,r,s,1);break}}function Hm(n){let e=n.prev,t=n,i=n.next;if(ft(e,t,i)>=0)return!1;let r=e.x,s=t.x,a=i.x,o=e.y,l=t.y,c=i.y,h=r<s?r<a?r:a:s<a?s:a,u=o<l?o<c?o:c:l<c?l:c,d=r>s?r>a?r:a:s>a?s:a,p=o>l?o>c?o:c:l>c?l:c,m=i.next;for(;m!==e;){if(m.x>=h&&m.x<=d&&m.y>=u&&m.y<=p&&_r(r,o,s,l,a,c,m.x,m.y)&&ft(m.prev,m,m.next)>=0)return!1;m=m.next}return!0}function Vm(n,e,t,i){let r=n.prev,s=n,a=n.next;if(ft(r,s,a)>=0)return!1;let o=r.x,l=s.x,c=a.x,h=r.y,u=s.y,d=a.y,p=o<l?o<c?o:c:l<c?l:c,m=h<u?h<d?h:d:u<d?u:d,x=o>l?o>c?o:c:l>c?l:c,g=h>u?h>d?h:d:u>d?u:d,f=th(p,m,e,t,i),y=th(x,g,e,t,i),v=n.prevZ,_=n.nextZ;for(;v&&v.z>=f&&_&&_.z<=y;){if(v.x>=p&&v.x<=x&&v.y>=m&&v.y<=g&&v!==r&&v!==a&&_r(o,h,l,u,c,d,v.x,v.y)&&ft(v.prev,v,v.next)>=0||(v=v.prevZ,_.x>=p&&_.x<=x&&_.y>=m&&_.y<=g&&_!==r&&_!==a&&_r(o,h,l,u,c,d,_.x,_.y)&&ft(_.prev,_,_.next)>=0))return!1;_=_.nextZ}for(;v&&v.z>=f;){if(v.x>=p&&v.x<=x&&v.y>=m&&v.y<=g&&v!==r&&v!==a&&_r(o,h,l,u,c,d,v.x,v.y)&&ft(v.prev,v,v.next)>=0)return!1;v=v.prevZ}for(;_&&_.z<=y;){if(_.x>=p&&_.x<=x&&_.y>=m&&_.y<=g&&_!==r&&_!==a&&_r(o,h,l,u,c,d,_.x,_.y)&&ft(_.prev,_,_.next)>=0)return!1;_=_.nextZ}return!0}function Gm(n,e,t){let i=n;do{let r=i.prev,s=i.next.next;!Ao(r,s)&&Zd(r,i,i.next,s)&&Ps(r,s)&&Ps(s,r)&&(e.push(r.i/t|0),e.push(i.i/t|0),e.push(s.i/t|0),Is(i),Is(i.next),i=n=s),i=i.next}while(i!==n);return Xn(i)}function Wm(n,e,t,i,r,s){let a=n;do{let o=a.next.next;for(;o!==a.prev;){if(a.i!==o.i&&Zm(a,o)){let l=$d(a,o);return a=Xn(a,a.next),l=Xn(l,l.next),Cs(a,e,t,i,r,s,0),void Cs(l,e,t,i,r,s,0)}o=o.next}a=a.next}while(a!==n)}function Xm(n,e){return n.x-e.x}function jm(n,e){let t=function(r,s){let a,o=s,l=-1/0,c=r.x,h=r.y;do{if(h<=o.y&&h>=o.next.y&&o.next.y!==o.y){let g=o.x+(h-o.y)*(o.next.x-o.x)/(o.next.y-o.y);if(g<=c&&g>l&&(l=g,a=o.x<o.next.x?o:o.next,g===c))return a}o=o.next}while(o!==s);if(!a)return null;let u=a,d=a.x,p=a.y,m,x=1/0;o=a;do c>=o.x&&o.x>=d&&c!==o.x&&_r(h<p?c:l,h,d,p,h<p?l:c,h,o.x,o.y)&&(m=Math.abs(h-o.y)/(c-o.x),Ps(o,r)&&(m<x||m===x&&(o.x>a.x||o.x===a.x&&qm(a,o)))&&(a=o,x=m)),o=o.next;while(o!==u);return a}(n,e);if(!t)return e;let i=$d(t,n);return Xn(i,i.next),Xn(t,t.next)}function qm(n,e){return ft(n.prev,n,e.prev)<0&&ft(e.next,n,n.next)<0}function th(n,e,t,i,r){return(n=1431655765&((n=858993459&((n=252645135&((n=16711935&((n=(n-t)*r|0)|n<<8))|n<<4))|n<<2))|n<<1))|(e=1431655765&((e=858993459&((e=252645135&((e=16711935&((e=(e-i)*r|0)|e<<8))|e<<4))|e<<2))|e<<1))<<1}function Ym(n){let e=n,t=n;do(e.x<t.x||e.x===t.x&&e.y<t.y)&&(t=e),e=e.next;while(e!==n);return t}function _r(n,e,t,i,r,s,a,o){return(r-a)*(e-o)>=(n-a)*(s-o)&&(n-a)*(i-o)>=(t-a)*(e-o)&&(t-a)*(s-o)>=(r-a)*(i-o)}function Zm(n,e){return n.next.i!==e.i&&n.prev.i!==e.i&&!function(t,i){let r=t;do{if(r.i!==t.i&&r.next.i!==t.i&&r.i!==i.i&&r.next.i!==i.i&&Zd(r,r.next,t,i))return!0;r=r.next}while(r!==t);return!1}(n,e)&&(Ps(n,e)&&Ps(e,n)&&function(t,i){let r=t,s=!1,a=(t.x+i.x)/2,o=(t.y+i.y)/2;do r.y>o!=r.next.y>o&&r.next.y!==r.y&&a<(r.next.x-r.x)*(o-r.y)/(r.next.y-r.y)+r.x&&(s=!s),r=r.next;while(r!==t);return s}(n,e)&&(ft(n.prev,n,e.prev)||ft(n,e.prev,e))||Ao(n,e)&&ft(n.prev,n,n.next)>0&&ft(e.prev,e,e.next)>0)}function ft(n,e,t){return(e.y-n.y)*(t.x-e.x)-(e.x-n.x)*(t.y-e.y)}function Ao(n,e){return n.x===e.x&&n.y===e.y}function Zd(n,e,t,i){let r=ka(ft(n,e,t)),s=ka(ft(n,e,i)),a=ka(ft(t,i,n)),o=ka(ft(t,i,e));return r!==s&&a!==o||!(r!==0||!Oa(n,t,e))||!(s!==0||!Oa(n,i,e))||!(a!==0||!Oa(t,n,i))||!(o!==0||!Oa(t,e,i))}function Oa(n,e,t){return e.x<=Math.max(n.x,t.x)&&e.x>=Math.min(n.x,t.x)&&e.y<=Math.max(n.y,t.y)&&e.y>=Math.min(n.y,t.y)}function ka(n){return n>0?1:n<0?-1:0}function Ps(n,e){return ft(n.prev,n,n.next)<0?ft(n,e,n.next)>=0&&ft(n,n.prev,e)>=0:ft(n,e,n.prev)<0||ft(n,n.next,e)<0}function $d(n,e){let t=new ih(n.i,n.x,n.y),i=new ih(e.i,e.x,e.y),r=n.next,s=e.prev;return n.next=e,e.prev=n,t.next=r,r.prev=t,i.next=t,t.prev=i,s.next=i,i.prev=s,i}function yd(n,e,t,i){let r=new ih(n,e,t);return i?(r.next=i.next,r.prev=i,i.next.prev=r,i.next=r):(r.prev=r,r.next=r),r}function Is(n){n.next.prev=n.prev,n.prev.next=n.next,n.prevZ&&(n.prevZ.nextZ=n.nextZ),n.nextZ&&(n.nextZ.prevZ=n.prevZ)}function ih(n,e,t){this.i=n,this.x=e,this.y=t,this.prev=null,this.next=null,this.z=0,this.prevZ=null,this.nextZ=null,this.steiner=!1}var mn=class n{static area(e){let t=e.length,i=0;for(let r=t-1,s=0;s<t;r=s++)i+=e[r].x*e[s].y-e[s].x*e[r].y;return .5*i}static isClockWise(e){return n.area(e)<0}static triangulateShape(e,t){let i=[],r=[],s=[];xd(e),_d(i,e);let a=e.length;t.forEach(xd);for(let l=0;l<t.length;l++)r.push(a),a+=t[l].length,_d(i,t[l]);let o=zm(i,r);for(let l=0;l<o.length;l+=3)s.push(o.slice(l,l+3));return s}};function xd(n){let e=n.length;e>2&&n[e-1].equals(n[0])&&n.pop()}function _d(n,e){for(let t=0;t<e.length;t++)n.push(e[t].x),n.push(e[t].y)}var Ls=class n extends Je{constructor(e=new Nr([new re(.5,.5),new re(-.5,.5),new re(-.5,-.5),new re(.5,-.5)]),t={}){super(),this.type="ExtrudeGeometry",this.parameters={shapes:e,options:t},e=Array.isArray(e)?e:[e];let i=this,r=[],s=[];for(let o=0,l=e.length;o<l;o++)a(e[o]);function a(o){let l=[],c=t.curveSegments!==void 0?t.curveSegments:12,h=t.steps!==void 0?t.steps:1,u=t.depth!==void 0?t.depth:1,d=t.bevelEnabled===void 0||t.bevelEnabled,p=t.bevelThickness!==void 0?t.bevelThickness:.2,m=t.bevelSize!==void 0?t.bevelSize:p-.1,x=t.bevelOffset!==void 0?t.bevelOffset:0,g=t.bevelSegments!==void 0?t.bevelSegments:3,f=t.extrudePath,y=t.UVGenerator!==void 0?t.UVGenerator:$m,v,_,E,T,A,B=!1;f&&(v=f.getSpacedPoints(h),B=!0,d=!1,_=f.computeFrenetFrames(h,!1),E=new M,T=new M,A=new M),d||(g=0,p=0,m=0,x=0);let U=o.extractPoints(c),W=U.shape,V=U.holes;if(!mn.isClockWise(W)){W=W.reverse();for(let C=0,P=V.length;C<P;C++){let b=V[C];mn.isClockWise(b)&&(V[C]=b.reverse())}}let F=mn.triangulateShape(W,V),X=W;for(let C=0,P=V.length;C<P;C++){let b=V[C];W=W.concat(b)}function H(C,P,b){return P||console.error("THREE.ExtrudeGeometry: vec does not exist"),C.clone().addScaledVector(P,b)}let Y=W.length,k=F.length;function ie(C,P,b){let L,I,Q,z=C.x-P.x,ee=C.y-P.y,oe=b.x-C.x,te=b.y-C.y,me=z*z+ee*ee,ve=z*te-ee*oe;if(Math.abs(ve)>Number.EPSILON){let _e=Math.sqrt(me),Le=Math.sqrt(oe*oe+te*te),Ve=P.x-ee/_e,ze=P.y+z/_e,we=((b.x-te/Le-Ve)*te-(b.y+oe/Le-ze)*oe)/(z*te-ee*oe);L=Ve+z*we-C.x,I=ze+ee*we-C.y;let Xe=L*L+I*I;if(Xe<=2)return new re(L,I);Q=Math.sqrt(Xe/2)}else{let _e=!1;z>Number.EPSILON?oe>Number.EPSILON&&(_e=!0):z<-Number.EPSILON?oe<-Number.EPSILON&&(_e=!0):Math.sign(ee)===Math.sign(te)&&(_e=!0),_e?(L=-ee,I=z,Q=Math.sqrt(me)):(L=z,I=ee,Q=Math.sqrt(me/2))}return new re(L/Q,I/Q)}let J=[];for(let C=0,P=X.length,b=P-1,L=C+1;C<P;C++,b++,L++)b===P&&(b=0),L===P&&(L=0),J[C]=ie(X[C],X[b],X[L]);let se=[],le,$=J.concat();for(let C=0,P=V.length;C<P;C++){let b=V[C];le=[];for(let L=0,I=b.length,Q=I-1,z=L+1;L<I;L++,Q++,z++)Q===I&&(Q=0),z===I&&(z=0),le[L]=ie(b[L],b[Q],b[z]);se.push(le),$=$.concat(le)}for(let C=0;C<g;C++){let P=C/g,b=p*Math.cos(P*Math.PI/2),L=m*Math.sin(P*Math.PI/2)+x;for(let I=0,Q=X.length;I<Q;I++){let z=H(X[I],J[I],L);de(z.x,z.y,-b)}for(let I=0,Q=V.length;I<Q;I++){let z=V[I];le=se[I];for(let ee=0,oe=z.length;ee<oe;ee++){let te=H(z[ee],le[ee],L);de(te.x,te.y,-b)}}}let ae=m+x;for(let C=0;C<Y;C++){let P=d?H(W[C],$[C],ae):W[C];B?(T.copy(_.normals[0]).multiplyScalar(P.x),E.copy(_.binormals[0]).multiplyScalar(P.y),A.copy(v[0]).add(T).add(E),de(A.x,A.y,A.z)):de(P.x,P.y,0)}for(let C=1;C<=h;C++)for(let P=0;P<Y;P++){let b=d?H(W[P],$[P],ae):W[P];B?(T.copy(_.normals[C]).multiplyScalar(b.x),E.copy(_.binormals[C]).multiplyScalar(b.y),A.copy(v[C]).add(T).add(E),de(A.x,A.y,A.z)):de(b.x,b.y,u/h*C)}for(let C=g-1;C>=0;C--){let P=C/g,b=p*Math.cos(P*Math.PI/2),L=m*Math.sin(P*Math.PI/2)+x;for(let I=0,Q=X.length;I<Q;I++){let z=H(X[I],J[I],L);de(z.x,z.y,u+b)}for(let I=0,Q=V.length;I<Q;I++){let z=V[I];le=se[I];for(let ee=0,oe=z.length;ee<oe;ee++){let te=H(z[ee],le[ee],L);B?de(te.x,te.y+v[h-1].y,v[h-1].x+b):de(te.x,te.y,u+b)}}}function fe(C,P){let b=C.length;for(;--b>=0;){let L=b,I=b-1;I<0&&(I=C.length-1);for(let Q=0,z=h+2*g;Q<z;Q++){let ee=Y*Q,oe=Y*(Q+1);S(P+L+ee,P+I+ee,P+I+oe,P+L+oe)}}}function de(C,P,b){l.push(C),l.push(P),l.push(b)}function R(C,P,b){N(C),N(P),N(b);let L=r.length/3,I=y.generateTopUV(i,r,L-3,L-2,L-1);j(I[0]),j(I[1]),j(I[2])}function S(C,P,b,L){N(C),N(P),N(L),N(P),N(b),N(L);let I=r.length/3,Q=y.generateSideWallUV(i,r,I-6,I-3,I-2,I-1);j(Q[0]),j(Q[1]),j(Q[3]),j(Q[1]),j(Q[2]),j(Q[3])}function N(C){r.push(l[3*C+0]),r.push(l[3*C+1]),r.push(l[3*C+2])}function j(C){s.push(C.x),s.push(C.y)}(function(){let C=r.length/3;if(d){let P=0,b=Y*P;for(let L=0;L<k;L++){let I=F[L];R(I[2]+b,I[1]+b,I[0]+b)}P=h+2*g,b=Y*P;for(let L=0;L<k;L++){let I=F[L];R(I[0]+b,I[1]+b,I[2]+b)}}else{for(let P=0;P<k;P++){let b=F[P];R(b[2],b[1],b[0])}for(let P=0;P<k;P++){let b=F[P];R(b[0]+Y*h,b[1]+Y*h,b[2]+Y*h)}}i.addGroup(C,r.length/3-C,0)})(),function(){let C=r.length/3,P=0;fe(X,P),P+=X.length;for(let b=0,L=V.length;b<L;b++){let I=V[b];fe(I,P),P+=I.length}i.addGroup(C,r.length/3-C,1)}()}this.setAttribute("position",new Ae(r,3)),this.setAttribute("uv",new Ae(s,2)),this.computeVertexNormals()}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}toJSON(){let e=super.toJSON();return function(t,i,r){if(r.shapes=[],Array.isArray(t))for(let s=0,a=t.length;s<a;s++){let o=t[s];r.shapes.push(o.uuid)}else r.shapes.push(t.uuid);return r.options=Object.assign({},i),i.extrudePath!==void 0&&(r.options.extrudePath=i.extrudePath.toJSON()),r}(this.parameters.shapes,this.parameters.options,e)}static fromJSON(e,t){let i=[];for(let s=0,a=e.shapes.length;s<a;s++){let o=t[e.shapes[s]];i.push(o)}let r=e.options.extrudePath;return r!==void 0&&(e.options.extrudePath=new yo[r.type]().fromJSON(r)),new n(i,e.options)}},$m={generateTopUV:function(n,e,t,i,r){let s=e[3*t],a=e[3*t+1],o=e[3*i],l=e[3*i+1],c=e[3*r],h=e[3*r+1];return[new re(s,a),new re(o,l),new re(c,h)]},generateSideWallUV:function(n,e,t,i,r,s){let a=e[3*t],o=e[3*t+1],l=e[3*t+2],c=e[3*i],h=e[3*i+1],u=e[3*i+2],d=e[3*r],p=e[3*r+1],m=e[3*r+2],x=e[3*s],g=e[3*s+1],f=e[3*s+2];return Math.abs(o-h)<Math.abs(a-c)?[new re(a,1-l),new re(c,1-u),new re(d,1-m),new re(x,1-f)]:[new re(o,1-l),new re(h,1-u),new re(p,1-m),new re(g,1-f)]}},xn=class n extends Wn{constructor(e=1,t=0){let i=(1+Math.sqrt(5))/2;super([-1,i,0,1,i,0,-1,-i,0,1,-i,0,0,-1,i,0,1,i,0,-1,-i,0,1,-i,i,0,-1,i,0,1,-i,0,-1,-i,0,1],[0,11,5,0,5,1,0,1,7,0,7,10,0,10,11,1,5,9,5,11,4,11,10,2,10,7,6,7,1,8,3,9,4,3,4,2,3,2,6,3,6,8,3,8,9,4,9,5,2,4,11,6,2,10,8,6,7,9,8,1],e,t),this.type="IcosahedronGeometry",this.parameters={radius:e,detail:t}}static fromJSON(e){return new n(e.radius,e.detail)}},nh=class n extends Wn{constructor(e=1,t=0){super([1,0,0,-1,0,0,0,1,0,0,-1,0,0,0,1,0,0,-1],[0,2,4,0,4,3,0,3,5,0,5,2,1,2,5,1,5,3,1,3,4,1,4,2],e,t),this.type="OctahedronGeometry",this.parameters={radius:e,detail:t}}static fromJSON(e){return new n(e.radius,e.detail)}},Or=class n extends Je{constructor(e=.5,t=1,i=32,r=1,s=0,a=2*Math.PI){super(),this.type="RingGeometry",this.parameters={innerRadius:e,outerRadius:t,thetaSegments:i,phiSegments:r,thetaStart:s,thetaLength:a},i=Math.max(3,i);let o=[],l=[],c=[],h=[],u=e,d=(t-e)/(r=Math.max(1,r)),p=new M,m=new re;for(let x=0;x<=r;x++){for(let g=0;g<=i;g++){let f=s+g/i*a;p.x=u*Math.cos(f),p.y=u*Math.sin(f),l.push(p.x,p.y,p.z),c.push(0,0,1),m.x=(p.x/t+1)/2,m.y=(p.y/t+1)/2,h.push(m.x,m.y)}u+=d}for(let x=0;x<r;x++){let g=x*(i+1);for(let f=0;f<i;f++){let y=f+g,v=y,_=y+i+1,E=y+i+2,T=y+1;o.push(v,_,T),o.push(_,E,T)}}this.setIndex(o),this.setAttribute("position",new Ae(l,3)),this.setAttribute("normal",new Ae(c,3)),this.setAttribute("uv",new Ae(h,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.innerRadius,e.outerRadius,e.thetaSegments,e.phiSegments,e.thetaStart,e.thetaLength)}},rh=class n extends Je{constructor(e=new Nr([new re(0,.5),new re(-.5,-.5),new re(.5,-.5)]),t=12){super(),this.type="ShapeGeometry",this.parameters={shapes:e,curveSegments:t};let i=[],r=[],s=[],a=[],o=0,l=0;if(Array.isArray(e)===!1)c(e);else for(let h=0;h<e.length;h++)c(e[h]),this.addGroup(o,l,h),o+=l,l=0;function c(h){let u=r.length/3,d=h.extractPoints(t),p=d.shape,m=d.holes;mn.isClockWise(p)===!1&&(p=p.reverse());for(let g=0,f=m.length;g<f;g++){let y=m[g];mn.isClockWise(y)===!0&&(m[g]=y.reverse())}let x=mn.triangulateShape(p,m);for(let g=0,f=m.length;g<f;g++){let y=m[g];p=p.concat(y)}for(let g=0,f=p.length;g<f;g++){let y=p[g];r.push(y.x,y.y,0),s.push(0,0,1),a.push(y.x,y.y)}for(let g=0,f=x.length;g<f;g++){let y=x[g],v=y[0]+u,_=y[1]+u,E=y[2]+u;i.push(v,_,E),l+=3}}this.setIndex(i),this.setAttribute("position",new Ae(r,3)),this.setAttribute("normal",new Ae(s,3)),this.setAttribute("uv",new Ae(a,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}toJSON(){let e=super.toJSON();return function(t,i){if(i.shapes=[],Array.isArray(t))for(let r=0,s=t.length;r<s;r++){let a=t[r];i.shapes.push(a.uuid)}else i.shapes.push(t.uuid);return i}(this.parameters.shapes,e)}static fromJSON(e,t){let i=[];for(let r=0,s=e.shapes.length;r<s;r++){let a=t[e.shapes[r]];i.push(a)}return new n(i,e.curveSegments)}},yi=class n extends Je{constructor(e=1,t=32,i=16,r=0,s=2*Math.PI,a=0,o=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:e,widthSegments:t,heightSegments:i,phiStart:r,phiLength:s,thetaStart:a,thetaLength:o},t=Math.max(3,Math.floor(t)),i=Math.max(2,Math.floor(i));let l=Math.min(a+o,Math.PI),c=0,h=[],u=new M,d=new M,p=[],m=[],x=[],g=[];for(let f=0;f<=i;f++){let y=[],v=f/i,_=0;f===0&&a===0?_=.5/t:f===i&&l===Math.PI&&(_=-.5/t);for(let E=0;E<=t;E++){let T=E/t;u.x=-e*Math.cos(r+T*s)*Math.sin(a+v*o),u.y=e*Math.cos(a+v*o),u.z=e*Math.sin(r+T*s)*Math.sin(a+v*o),m.push(u.x,u.y,u.z),d.copy(u).normalize(),x.push(d.x,d.y,d.z),g.push(T+_,1-v),y.push(c++)}h.push(y)}for(let f=0;f<i;f++)for(let y=0;y<t;y++){let v=h[f][y+1],_=h[f][y],E=h[f+1][y],T=h[f+1][y+1];(f!==0||a>0)&&p.push(v,_,T),(f!==i-1||l<Math.PI)&&p.push(_,E,T)}this.setIndex(p),this.setAttribute("position",new Ae(m,3)),this.setAttribute("normal",new Ae(x,3)),this.setAttribute("uv",new Ae(g,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.radius,e.widthSegments,e.heightSegments,e.phiStart,e.phiLength,e.thetaStart,e.thetaLength)}},Us=class n extends Wn{constructor(e=1,t=0){super([1,1,1,-1,-1,1,-1,1,-1,1,-1,-1],[2,1,0,0,3,2,1,3,0,2,3,1],e,t),this.type="TetrahedronGeometry",this.parameters={radius:e,detail:t}}static fromJSON(e){return new n(e.radius,e.detail)}},kr=class n extends Je{constructor(e=1,t=.4,i=12,r=48,s=2*Math.PI){super(),this.type="TorusGeometry",this.parameters={radius:e,tube:t,radialSegments:i,tubularSegments:r,arc:s},i=Math.floor(i),r=Math.floor(r);let a=[],o=[],l=[],c=[],h=new M,u=new M,d=new M;for(let p=0;p<=i;p++)for(let m=0;m<=r;m++){let x=m/r*s,g=p/i*Math.PI*2;u.x=(e+t*Math.cos(g))*Math.cos(x),u.y=(e+t*Math.cos(g))*Math.sin(x),u.z=t*Math.sin(g),o.push(u.x,u.y,u.z),h.x=e*Math.cos(x),h.y=e*Math.sin(x),d.subVectors(u,h).normalize(),l.push(d.x,d.y,d.z),c.push(m/r),c.push(p/i)}for(let p=1;p<=i;p++)for(let m=1;m<=r;m++){let x=(r+1)*p+m-1,g=(r+1)*(p-1)+m-1,f=(r+1)*(p-1)+m,y=(r+1)*p+m;a.push(x,g,y),a.push(g,f,y)}this.setIndex(a),this.setAttribute("position",new Ae(o,3)),this.setAttribute("normal",new Ae(l,3)),this.setAttribute("uv",new Ae(c,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.radius,e.tube,e.radialSegments,e.tubularSegments,e.arc)}},sh=class n extends Je{constructor(e=1,t=.4,i=64,r=8,s=2,a=3){super(),this.type="TorusKnotGeometry",this.parameters={radius:e,tube:t,tubularSegments:i,radialSegments:r,p:s,q:a},i=Math.floor(i),r=Math.floor(r);let o=[],l=[],c=[],h=[],u=new M,d=new M,p=new M,m=new M,x=new M,g=new M,f=new M;for(let v=0;v<=i;++v){let _=v/i*s*Math.PI*2;y(_,s,a,e,p),y(_+.01,s,a,e,m),g.subVectors(m,p),f.addVectors(m,p),x.crossVectors(g,f),f.crossVectors(x,g),x.normalize(),f.normalize();for(let E=0;E<=r;++E){let T=E/r*Math.PI*2,A=-t*Math.cos(T),B=t*Math.sin(T);u.x=p.x+(A*f.x+B*x.x),u.y=p.y+(A*f.y+B*x.y),u.z=p.z+(A*f.z+B*x.z),l.push(u.x,u.y,u.z),d.subVectors(u,p).normalize(),c.push(d.x,d.y,d.z),h.push(v/i),h.push(E/r)}}for(let v=1;v<=i;v++)for(let _=1;_<=r;_++){let E=(r+1)*(v-1)+(_-1),T=(r+1)*v+(_-1),A=(r+1)*v+_,B=(r+1)*(v-1)+_;o.push(E,T,B),o.push(T,A,B)}function y(v,_,E,T,A){let B=Math.cos(v),U=Math.sin(v),W=E/_*v,V=Math.cos(W);A.x=T*(2+V)*.5*B,A.y=T*(2+V)*U*.5,A.z=T*Math.sin(W)*.5}this.setIndex(o),this.setAttribute("position",new Ae(l,3)),this.setAttribute("normal",new Ae(c,3)),this.setAttribute("uv",new Ae(h,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.radius,e.tube,e.tubularSegments,e.radialSegments,e.p,e.q)}},ah=class n extends Je{constructor(e=new go(new M(-1,-1,0),new M(-1,1,0),new M(1,1,0)),t=64,i=1,r=8,s=!1){super(),this.type="TubeGeometry",this.parameters={path:e,tubularSegments:t,radius:i,radialSegments:r,closed:s};let a=e.computeFrenetFrames(t,s);this.tangents=a.tangents,this.normals=a.normals,this.binormals=a.binormals;let o=new M,l=new M,c=new re,h=new M,u=[],d=[],p=[],m=[];function x(g){h=e.getPointAt(g/t,h);let f=a.normals[g],y=a.binormals[g];for(let v=0;v<=r;v++){let _=v/r*Math.PI*2,E=Math.sin(_),T=-Math.cos(_);l.x=T*f.x+E*y.x,l.y=T*f.y+E*y.y,l.z=T*f.z+E*y.z,l.normalize(),d.push(l.x,l.y,l.z),o.x=h.x+i*l.x,o.y=h.y+i*l.y,o.z=h.z+i*l.z,u.push(o.x,o.y,o.z)}}(function(){for(let g=0;g<t;g++)x(g);x(s===!1?t:0),function(){for(let g=0;g<=t;g++)for(let f=0;f<=r;f++)c.x=g/t,c.y=f/r,p.push(c.x,c.y)}(),function(){for(let g=1;g<=t;g++)for(let f=1;f<=r;f++){let y=(r+1)*(g-1)+(f-1),v=(r+1)*g+(f-1),_=(r+1)*g+f,E=(r+1)*(g-1)+f;m.push(y,v,E),m.push(v,_,E)}}()})(),this.setIndex(m),this.setAttribute("position",new Ae(u,3)),this.setAttribute("normal",new Ae(d,3)),this.setAttribute("uv",new Ae(p,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}toJSON(){let e=super.toJSON();return e.path=this.parameters.path.toJSON(),e}static fromJSON(e){return new n(new yo[e.path.type]().fromJSON(e.path),e.tubularSegments,e.radius,e.radialSegments,e.closed)}},oh=class extends Je{constructor(e=null){if(super(),this.type="WireframeGeometry",this.parameters={geometry:e},e!==null){let t=[],i=new Set,r=new M,s=new M;if(e.index!==null){let a=e.attributes.position,o=e.index,l=e.groups;l.length===0&&(l=[{start:0,count:o.count,materialIndex:0}]);for(let c=0,h=l.length;c<h;++c){let u=l[c],d=u.start;for(let p=d,m=d+u.count;p<m;p+=3)for(let x=0;x<3;x++){let g=o.getX(p+x),f=o.getX(p+(x+1)%3);r.fromBufferAttribute(a,g),s.fromBufferAttribute(a,f),Md(r,s,i)===!0&&(t.push(r.x,r.y,r.z),t.push(s.x,s.y,s.z))}}}else{let a=e.attributes.position;for(let o=0,l=a.count/3;o<l;o++)for(let c=0;c<3;c++){let h=3*o+c,u=3*o+(c+1)%3;r.fromBufferAttribute(a,h),s.fromBufferAttribute(a,u),Md(r,s,i)===!0&&(t.push(r.x,r.y,r.z),t.push(s.x,s.y,s.z))}}this.setAttribute("position",new Ae(t,3))}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}};function Md(n,e,t){let i=`${n.x},${n.y},${n.z}-${e.x},${e.y},${e.z}`,r=`${e.x},${e.y},${e.z}-${n.x},${n.y},${n.z}`;return t.has(i)!==!0&&t.has(r)!==!0&&(t.add(i),t.add(r),!0)}var pg=Object.freeze({__proto__:null,BoxGeometry:Ut,CapsuleGeometry:Kc,CircleGeometry:As,ConeGeometry:Rs,CylinderGeometry:Wt,DodecahedronGeometry:Qc,EdgesGeometry:eh,ExtrudeGeometry:Ls,IcosahedronGeometry:xn,LatheGeometry:xo,OctahedronGeometry:nh,PlaneGeometry:Ms,PolyhedronGeometry:Wn,RingGeometry:Or,ShapeGeometry:rh,SphereGeometry:yi,TetrahedronGeometry:Us,TorusGeometry:kr,TorusKnotGeometry:sh,TubeGeometry:ah,WireframeGeometry:oh});var _o=class extends mt{constructor(e){super(e),this.isRawShaderMaterial=!0,this.type="RawShaderMaterial"}},Dt=class extends Hi{constructor(e){super(),this.isMeshStandardMaterial=!0,this.defines={STANDARD:""},this.type="MeshStandardMaterial",this.color=new be(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new be(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=0,this.normalScale=new re(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new li,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.defines={STANDARD:""},this.color.copy(e.color),this.roughness=e.roughness,this.metalness=e.metalness,this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.roughnessMap=e.roughnessMap,this.metalnessMap=e.metalnessMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.envMapIntensity=e.envMapIntensity,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}};function Fa(n,e,t){return!n||!t&&n.constructor===e?n:typeof e.BYTES_PER_ELEMENT=="number"?new e(n):Array.prototype.slice.call(n)}function Jm(n){return ArrayBuffer.isView(n)&&!(n instanceof DataView)}var Fr=class{constructor(e,t,i,r){this.parameterPositions=e,this._cachedIndex=0,this.resultBuffer=r!==void 0?r:new t.constructor(i),this.sampleValues=t,this.valueSize=i,this.settings=null,this.DefaultSettings_={}}evaluate(e){let t=this.parameterPositions,i=this._cachedIndex,r=t[i],s=t[i-1];t:{e:{let a;i:{n:if(!(e<r)){for(let o=i+2;;){if(r===void 0){if(e<s)break n;return i=t.length,this._cachedIndex=i,this.copySampleValue_(i-1)}if(i===o)break;if(s=r,r=t[++i],e<r)break e}a=t.length;break i}if(e>=s)break t;{let o=t[1];e<o&&(i=2,s=o);for(let l=i-2;;){if(s===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(i===l)break;if(r=s,s=t[--i-1],e>=s)break e}a=i,i=0}}for(;i<a;){let o=i+a>>>1;e<t[o]?a=o:i=o+1}if(r=t[i],s=t[i-1],s===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(r===void 0)return i=t.length,this._cachedIndex=i,this.copySampleValue_(i-1)}this._cachedIndex=i,this.intervalChanged_(i,s,r)}return this.interpolate_(i,s,e,r)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(e){let t=this.resultBuffer,i=this.sampleValues,r=this.valueSize,s=e*r;for(let a=0;a!==r;++a)t[a]=i[s+a];return t}interpolate_(){throw new Error("call to abstract method")}intervalChanged_(){}},lh=class extends Fr{constructor(e,t,i,r){super(e,t,i,r),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:gu,endingEnd:gu}}intervalChanged_(e,t,i){let r=this.parameterPositions,s=e-2,a=e+1,o=r[s],l=r[a];if(o===void 0)switch(this.getSettings_().endingStart){case vu:s=e,o=2*t-i;break;case yu:s=r.length-2,o=t+r[s]-r[s+1];break;default:s=e,o=i}if(l===void 0)switch(this.getSettings_().endingEnd){case vu:a=e,l=2*i-t;break;case yu:a=1,l=i+r[1]-r[0];break;default:a=e-1,l=t}let c=.5*(i-t),h=this.valueSize;this._weightPrev=c/(t-o),this._weightNext=c/(l-i),this._offsetPrev=s*h,this._offsetNext=a*h}interpolate_(e,t,i,r){let s=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=e*o,c=l-o,h=this._offsetPrev,u=this._offsetNext,d=this._weightPrev,p=this._weightNext,m=(i-t)/(r-t),x=m*m,g=x*m,f=-d*g+2*d*x-d*m,y=(1+d)*g+(-1.5-2*d)*x+(-.5+d)*m+1,v=(-1-p)*g+(1.5+p)*x+.5*m,_=p*g-p*x;for(let E=0;E!==o;++E)s[E]=f*a[h+E]+y*a[c+E]+v*a[l+E]+_*a[u+E];return s}},ch=class extends Fr{constructor(e,t,i,r){super(e,t,i,r)}interpolate_(e,t,i,r){let s=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=e*o,c=l-o,h=(i-t)/(r-t),u=1-h;for(let d=0;d!==o;++d)s[d]=a[c+d]*u+a[l+d]*h;return s}},hh=class extends Fr{constructor(e,t,i,r){super(e,t,i,r)}interpolate_(e){return this.copySampleValue_(e-1)}},Ai=class{constructor(e,t,i,r){if(e===void 0)throw new Error("THREE.KeyframeTrack: track name is undefined");if(t===void 0||t.length===0)throw new Error("THREE.KeyframeTrack: no keyframes in track named "+e);this.name=e,this.times=Fa(t,this.TimeBufferType),this.values=Fa(i,this.ValueBufferType),this.setInterpolation(r||this.DefaultInterpolation)}static toJSON(e){let t=e.constructor,i;if(t.toJSON!==this.toJSON)i=t.toJSON(e);else{i={name:e.name,times:Fa(e.times,Array),values:Fa(e.values,Array)};let r=e.getInterpolation();r!==e.DefaultInterpolation&&(i.interpolation=r)}return i.type=e.ValueTypeName,i}InterpolantFactoryMethodDiscrete(e){return new hh(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodLinear(e){return new ch(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodSmooth(e){return new lh(this.times,this.values,this.getValueSize(),e)}setInterpolation(e){let t;switch(e){case ja:t=this.InterpolantFactoryMethodDiscrete;break;case wc:t=this.InterpolantFactoryMethodLinear;break;case ll:t=this.InterpolantFactoryMethodSmooth}if(t===void 0){let i="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0){if(e===this.DefaultInterpolation)throw new Error(i);this.setInterpolation(this.DefaultInterpolation)}return console.warn("THREE.KeyframeTrack:",i),this}return this.createInterpolant=t,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return ja;case this.InterpolantFactoryMethodLinear:return wc;case this.InterpolantFactoryMethodSmooth:return ll}}getValueSize(){return this.values.length/this.times.length}shift(e){if(e!==0){let t=this.times;for(let i=0,r=t.length;i!==r;++i)t[i]+=e}return this}scale(e){if(e!==1){let t=this.times;for(let i=0,r=t.length;i!==r;++i)t[i]*=e}return this}trim(e,t){let i=this.times,r=i.length,s=0,a=r-1;for(;s!==r&&i[s]<e;)++s;for(;a!==-1&&i[a]>t;)--a;if(++a,s!==0||a!==r){s>=a&&(a=Math.max(a,1),s=a-1);let o=this.getValueSize();this.times=i.slice(s,a),this.values=this.values.slice(s*o,a*o)}return this}validate(){let e=!0,t=this.getValueSize();t-Math.floor(t)!=0&&(console.error("THREE.KeyframeTrack: Invalid value size in track.",this),e=!1);let i=this.times,r=this.values,s=i.length;s===0&&(console.error("THREE.KeyframeTrack: Track is empty.",this),e=!1);let a=null;for(let o=0;o!==s;o++){let l=i[o];if(typeof l=="number"&&isNaN(l)){console.error("THREE.KeyframeTrack: Time is not a valid number.",this,o,l),e=!1;break}if(a!==null&&a>l){console.error("THREE.KeyframeTrack: Out of order keys.",this,o,l,a),e=!1;break}a=l}if(r!==void 0&&Jm(r))for(let o=0,l=r.length;o!==l;++o){let c=r[o];if(isNaN(c)){console.error("THREE.KeyframeTrack: Value is not a valid number.",this,o,c),e=!1;break}}return e}optimize(){let e=this.times.slice(),t=this.values.slice(),i=this.getValueSize(),r=this.getInterpolation()===ll,s=e.length-1,a=1;for(let o=1;o<s;++o){let l=!1,c=e[o];if(c!==e[o+1]&&(o!==1||c!==e[0]))if(r)l=!0;else{let h=o*i,u=h-i,d=h+i;for(let p=0;p!==i;++p){let m=t[h+p];if(m!==t[u+p]||m!==t[d+p]){l=!0;break}}}if(l){if(o!==a){e[a]=e[o];let h=o*i,u=a*i;for(let d=0;d!==i;++d)t[u+d]=t[h+d]}++a}}if(s>0){e[a]=e[s];for(let o=s*i,l=a*i,c=0;c!==i;++c)t[l+c]=t[o+c];++a}return a!==e.length?(this.times=e.slice(0,a),this.values=t.slice(0,a*i)):(this.times=e,this.values=t),this}clone(){let e=this.times.slice(),t=this.values.slice(),i=new this.constructor(this.name,e,t);return i.createInterpolant=this.createInterpolant,i}};Ai.prototype.TimeBufferType=Float32Array,Ai.prototype.ValueBufferType=Float32Array,Ai.prototype.DefaultInterpolation=wc;var Bn=class extends Ai{constructor(e,t,i){super(e,t,i)}};Bn.prototype.ValueTypeName="bool",Bn.prototype.ValueBufferType=Array,Bn.prototype.DefaultInterpolation=ja,Bn.prototype.InterpolantFactoryMethodLinear=void 0,Bn.prototype.InterpolantFactoryMethodSmooth=void 0;var uh=class extends Ai{};uh.prototype.ValueTypeName="color";var dh=class extends Ai{};dh.prototype.ValueTypeName="number";var ph=class extends Fr{constructor(e,t,i,r){super(e,t,i,r)}interpolate_(e,t,i,r){let s=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=(i-t)/(r-t),c=e*o;for(let h=c+o;c!==h;c+=4)Gt.slerpFlat(s,0,a,c-o,a,c,l);return s}},Mo=class extends Ai{InterpolantFactoryMethodLinear(e){return new ph(this.times,this.values,this.getValueSize(),e)}};Mo.prototype.ValueTypeName="quaternion",Mo.prototype.InterpolantFactoryMethodSmooth=void 0;var zn=class extends Ai{constructor(e,t,i){super(e,t,i)}};zn.prototype.ValueTypeName="string",zn.prototype.ValueBufferType=Array,zn.prototype.DefaultInterpolation=ja,zn.prototype.InterpolantFactoryMethodLinear=void 0,zn.prototype.InterpolantFactoryMethodSmooth=void 0;var fh=class extends Ai{};fh.prototype.ValueTypeName="vector";var mh=class{constructor(e,t,i){let r=this,s,a=!1,o=0,l=0,c=[];this.onStart=void 0,this.onLoad=e,this.onProgress=t,this.onError=i,this.itemStart=function(h){l++,a===!1&&r.onStart!==void 0&&r.onStart(h,o,l),a=!0},this.itemEnd=function(h){o++,r.onProgress!==void 0&&r.onProgress(h,o,l),o===l&&(a=!1,r.onLoad!==void 0&&r.onLoad())},this.itemError=function(h){r.onError!==void 0&&r.onError(h)},this.resolveURL=function(h){return s?s(h):h},this.setURLModifier=function(h){return s=h,this},this.addHandler=function(h,u){return c.push(h,u),this},this.removeHandler=function(h){let u=c.indexOf(h);return u!==-1&&c.splice(u,2),this},this.getHandler=function(h){for(let u=0,d=c.length;u<d;u+=2){let p=c[u],m=c[u+1];if(p.global&&(p.lastIndex=0),p.test(h))return m}return null}}},Km=new mh,gh=class{constructor(e){this.manager=e!==void 0?e:Km,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={}}load(){}loadAsync(e,t){let i=this;return new Promise(function(r,s){i.load(e,r,t,s)})}parse(){}setCrossOrigin(e){return this.crossOrigin=e,this}setWithCredentials(e){return this.withCredentials=e,this}setPath(e){return this.path=e,this}setResourcePath(e){return this.resourcePath=e,this}setRequestHeader(e){return this.requestHeader=e,this}};gh.DEFAULT_MATERIAL_NAME="__DEFAULT";var Ds=class extends xt{constructor(e,t=1){super(),this.isLight=!0,this.type="Light",this.color=new be(e),this.intensity=t}dispose(){}copy(e,t){return super.copy(e,t),this.color.copy(e.color),this.intensity=e.intensity,this}toJSON(e){let t=super.toJSON(e);return t.object.color=this.color.getHex(),t.object.intensity=this.intensity,this.groundColor!==void 0&&(t.object.groundColor=this.groundColor.getHex()),this.distance!==void 0&&(t.object.distance=this.distance),this.angle!==void 0&&(t.object.angle=this.angle),this.decay!==void 0&&(t.object.decay=this.decay),this.penumbra!==void 0&&(t.object.penumbra=this.penumbra),this.shadow!==void 0&&(t.object.shadow=this.shadow.toJSON()),this.target!==void 0&&(t.object.target=this.target.uuid),t}};var Gl=new Ie,Sd=new M,bd=new M,So=class{constructor(e){this.camera=e,this.intensity=1,this.bias=0,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new re(512,512),this.map=null,this.mapPass=null,this.matrix=new Ie,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new Pr,this._frameExtents=new re(1,1),this._viewportCount=1,this._viewports=[new $e(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(e){let t=this.camera,i=this.matrix;Sd.setFromMatrixPosition(e.matrixWorld),t.position.copy(Sd),bd.setFromMatrixPosition(e.target.matrixWorld),t.lookAt(bd),t.updateMatrixWorld(),Gl.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse),this._frustum.setFromProjectionMatrix(Gl),i.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),i.multiply(Gl)}getViewport(e){return this._viewports[e]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(e){return this.camera=e.camera.clone(),this.intensity=e.intensity,this.bias=e.bias,this.radius=e.radius,this.mapSize.copy(e.mapSize),this}clone(){return new this.constructor().copy(this)}toJSON(){let e={};return this.intensity!==1&&(e.intensity=this.intensity),this.bias!==0&&(e.bias=this.bias),this.normalBias!==0&&(e.normalBias=this.normalBias),this.radius!==1&&(e.radius=this.radius),this.mapSize.x===512&&this.mapSize.y===512||(e.mapSize=this.mapSize.toArray()),e.camera=this.camera.toJSON(!1).object,delete e.camera.matrix,e}};var wd=new Ie,ps=new M,Wl=new M,vh=class extends So{constructor(){super(new It(90,1,.5,500)),this.isPointLightShadow=!0,this._frameExtents=new re(4,2),this._viewportCount=6,this._viewports=[new $e(2,1,1,1),new $e(0,1,1,1),new $e(3,1,1,1),new $e(1,1,1,1),new $e(3,0,1,1),new $e(1,0,1,1)],this._cubeDirections=[new M(1,0,0),new M(-1,0,0),new M(0,0,1),new M(0,0,-1),new M(0,1,0),new M(0,-1,0)],this._cubeUps=[new M(0,1,0),new M(0,1,0),new M(0,1,0),new M(0,1,0),new M(0,0,1),new M(0,0,-1)]}updateMatrices(e,t=0){let i=this.camera,r=this.matrix,s=e.distance||i.far;s!==i.far&&(i.far=s,i.updateProjectionMatrix()),ps.setFromMatrixPosition(e.matrixWorld),i.position.copy(ps),Wl.copy(i.position),Wl.add(this._cubeDirections[t]),i.up.copy(this._cubeUps[t]),i.lookAt(Wl),i.updateMatrixWorld(),r.makeTranslation(-ps.x,-ps.y,-ps.z),wd.multiplyMatrices(i.projectionMatrix,i.matrixWorldInverse),this._frustum.setFromProjectionMatrix(wd)}},jn=class extends Ds{constructor(e,t,i=0,r=2){super(e,t),this.isPointLight=!0,this.type="PointLight",this.distance=i,this.decay=r,this.shadow=new vh}get power(){return 4*this.intensity*Math.PI}set power(e){this.intensity=e/(4*Math.PI)}dispose(){this.shadow.dispose()}copy(e,t){return super.copy(e,t),this.distance=e.distance,this.decay=e.decay,this.shadow=e.shadow.clone(),this}},yh=class extends So{constructor(){super(new Ir(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}},qn=class extends Ds{constructor(e,t){super(e,t),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(xt.DEFAULT_UP),this.updateMatrix(),this.target=new xt,this.shadow=new yh}dispose(){this.shadow.dispose()}copy(e){return super.copy(e),this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}},Br=class extends Ds{constructor(e,t){super(e,t),this.isAmbientLight=!0,this.type="AmbientLight"}};var fg=new Ie,mg=new Ie,gg=new Ie;var bo=class{constructor(e=!0){this.autoStart=e,this.startTime=0,this.oldTime=0,this.elapsedTime=0,this.running=!1}start(){this.startTime=Ed(),this.oldTime=this.startTime,this.elapsedTime=0,this.running=!0}stop(){this.getElapsedTime(),this.running=!1,this.autoStart=!1}getElapsedTime(){return this.getDelta(),this.elapsedTime}getDelta(){let e=0;if(this.autoStart&&!this.running)return this.start(),0;if(this.running){let t=Ed();e=(t-this.oldTime)/1e3,this.oldTime=t,this.elapsedTime+=e}return e}};function Ed(){return performance.now()}var vg=new M,yg=new Gt,xg=new M,_g=new M;var Mg=new M,Sg=new Gt,bg=new M,wg=new M;var Nh="\\[\\]\\.:\\/",Qm=new RegExp("["+Nh+"]","g"),Xl="[^"+Nh+"]",e0="[^"+Nh.replace("\\.","")+"]",t0=new RegExp("^"+/((?:WC+[\/:])*)/.source.replace("WC",Xl)+/(WCOD+)?/.source.replace("WCOD",e0)+/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",Xl)+/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",Xl)+"$"),i0=["material","materials","bones","map"],lt=class n{constructor(e,t,i){this.path=t,this.parsedPath=i||n.parseTrackName(t),this.node=n.findNode(e,this.parsedPath.nodeName),this.rootNode=e,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(e,t,i){return e&&e.isAnimationObjectGroup?new n.Composite(e,t,i):new n(e,t,i)}static sanitizeNodeName(e){return e.replace(/\s/g,"_").replace(Qm,"")}static parseTrackName(e){let t=t0.exec(e);if(t===null)throw new Error("PropertyBinding: Cannot parse trackName: "+e);let i={nodeName:t[2],objectName:t[3],objectIndex:t[4],propertyName:t[5],propertyIndex:t[6]},r=i.nodeName&&i.nodeName.lastIndexOf(".");if(r!==void 0&&r!==-1){let s=i.nodeName.substring(r+1);i0.indexOf(s)!==-1&&(i.nodeName=i.nodeName.substring(0,r),i.objectName=s)}if(i.propertyName===null||i.propertyName.length===0)throw new Error("PropertyBinding: can not parse propertyName from trackName: "+e);return i}static findNode(e,t){if(t===void 0||t===""||t==="."||t===-1||t===e.name||t===e.uuid)return e;if(e.skeleton){let i=e.skeleton.getBoneByName(t);if(i!==void 0)return i}if(e.children){let i=function(s){for(let a=0;a<s.length;a++){let o=s[a];if(o.name===t||o.uuid===t)return o;let l=i(o.children);if(l)return l}return null},r=i(e.children);if(r)return r}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(e,t){e[t]=this.targetObject[this.propertyName]}_getValue_array(e,t){let i=this.resolvedProperty;for(let r=0,s=i.length;r!==s;++r)e[t++]=i[r]}_getValue_arrayElement(e,t){e[t]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(e,t){this.resolvedProperty.toArray(e,t)}_setValue_direct(e,t){this.targetObject[this.propertyName]=e[t]}_setValue_direct_setNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(e,t){let i=this.resolvedProperty;for(let r=0,s=i.length;r!==s;++r)i[r]=e[t++]}_setValue_array_setNeedsUpdate(e,t){let i=this.resolvedProperty;for(let r=0,s=i.length;r!==s;++r)i[r]=e[t++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(e,t){let i=this.resolvedProperty;for(let r=0,s=i.length;r!==s;++r)i[r]=e[t++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(e,t){this.resolvedProperty[this.propertyIndex]=e[t]}_setValue_arrayElement_setNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(e,t){this.resolvedProperty.fromArray(e,t)}_setValue_fromArray_setNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(e,t){this.bind(),this.getValue(e,t)}_setValue_unbound(e,t){this.bind(),this.setValue(e,t)}bind(){let e=this.node,t=this.parsedPath,i=t.objectName,r=t.propertyName,s=t.propertyIndex;if(e||(e=n.findNode(this.rootNode,t.nodeName),this.node=e),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!e)return void console.warn("THREE.PropertyBinding: No target node found for track: "+this.path+".");if(i){let c=t.objectIndex;switch(i){case"materials":if(!e.material)return void console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);if(!e.material.materials)return void console.error("THREE.PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);e=e.material.materials;break;case"bones":if(!e.skeleton)return void console.error("THREE.PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);e=e.skeleton.bones;for(let h=0;h<e.length;h++)if(e[h].name===c){c=h;break}break;case"map":if("map"in e){e=e.map;break}if(!e.material)return void console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);if(!e.material.map)return void console.error("THREE.PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);e=e.material.map;break;default:if(e[i]===void 0)return void console.error("THREE.PropertyBinding: Can not bind to objectName of node undefined.",this);e=e[i]}if(c!==void 0){if(e[c]===void 0)return void console.error("THREE.PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,e);e=e[c]}}let a=e[r];if(a===void 0){let c=t.nodeName;return void console.error("THREE.PropertyBinding: Trying to update property for track: "+c+"."+r+" but it wasn't found.",e)}let o=this.Versioning.None;this.targetObject=e,e.needsUpdate!==void 0?o=this.Versioning.NeedsUpdate:e.matrixWorldNeedsUpdate!==void 0&&(o=this.Versioning.MatrixWorldNeedsUpdate);let l=this.BindingType.Direct;if(s!==void 0){if(r==="morphTargetInfluences"){if(!e.geometry)return void console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);if(!e.geometry.morphAttributes)return void console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);e.morphTargetDictionary[s]!==void 0&&(s=e.morphTargetDictionary[s])}l=this.BindingType.ArrayElement,this.resolvedProperty=a,this.propertyIndex=s}else a.fromArray!==void 0&&a.toArray!==void 0?(l=this.BindingType.HasFromToArray,this.resolvedProperty=a):Array.isArray(a)?(l=this.BindingType.EntireArray,this.resolvedProperty=a):this.propertyName=r;this.getValue=this.GetterByBindingType[l],this.setValue=this.SetterByBindingTypeAndVersioning[l][o]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}};lt.Composite=class{constructor(n,e,t){let i=t||lt.parseTrackName(e);this._targetGroup=n,this._bindings=n.subscribe_(e,i)}getValue(n,e){this.bind();let t=this._targetGroup.nCachedObjects_,i=this._bindings[t];i!==void 0&&i.getValue(n,e)}setValue(n,e){let t=this._bindings;for(let i=this._targetGroup.nCachedObjects_,r=t.length;i!==r;++i)t[i].setValue(n,e)}bind(){let n=this._bindings;for(let e=this._targetGroup.nCachedObjects_,t=n.length;e!==t;++e)n[e].bind()}unbind(){let n=this._bindings;for(let e=this._targetGroup.nCachedObjects_,t=n.length;e!==t;++e)n[e].unbind()}},lt.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3},lt.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2},lt.prototype.GetterByBindingType=[lt.prototype._getValue_direct,lt.prototype._getValue_array,lt.prototype._getValue_arrayElement,lt.prototype._getValue_toArray],lt.prototype.SetterByBindingTypeAndVersioning=[[lt.prototype._setValue_direct,lt.prototype._setValue_direct_setNeedsUpdate,lt.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[lt.prototype._setValue_array,lt.prototype._setValue_array_setNeedsUpdate,lt.prototype._setValue_array_setMatrixWorldNeedsUpdate],[lt.prototype._setValue_arrayElement,lt.prototype._setValue_arrayElement_setNeedsUpdate,lt.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[lt.prototype._setValue_fromArray,lt.prototype._setValue_fromArray_setNeedsUpdate,lt.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];var Eg=new Float32Array(1);var Tg=new Ie;var Ag=new re;var Rg=new M,Cg=new M;var Pg=new M;var Ig=new M,Lg=new Ie,Ug=new Ie;var Dg=new M,Ng=new be,Og=new be;var kg=new M,Fg=new M,Bg=new M;var zg=new M,Hg=new _s;var Vg=new Ri;var Gg=new M;typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:jl}})),typeof window<"u"&&(window.__THREE__?console.warn("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=jl);var Ro={name:"CopyShader",uniforms:{tDiffuse:{value:null},opacity:{value:1}},vertexShader:`

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		uniform float opacity;

		uniform sampler2D tDiffuse;

		varying vec2 vUv;

		void main() {

			vec4 texel = texture2D( tDiffuse, vUv );
			gl_FragColor = opacity * texel;


		}`};var ci=class{constructor(){this.isPass=!0,this.enabled=!0,this.needsSwap=!0,this.clear=!1,this.renderToScreen=!1}setSize(){}render(){console.error("THREE.Pass: .render() must be implemented in derived pass.")}dispose(){}},n0=new Ir(-1,1,1,-1,0,1),Oh=class extends Je{constructor(){super(),this.setAttribute("position",new Ae([-1,3,0,-1,-1,0,3,-1,0],3)),this.setAttribute("uv",new Ae([0,2,0,0,2,0],2))}},r0=new Oh,Sn=class{constructor(e){this._mesh=new pe(r0,e)}dispose(){this._mesh.geometry.dispose()}render(e){e.render(this._mesh,n0)}get material(){return this._mesh.material}set material(e){this._mesh.material=e}};var Co=class extends ci{constructor(e,t){super(),this.textureID=t!==void 0?t:"tDiffuse",e instanceof mt?(this.uniforms=e.uniforms,this.material=e):e&&(this.uniforms=Mn.clone(e.uniforms),this.material=new mt({name:e.name!==void 0?e.name:"unspecified",defines:Object.assign({},e.defines),uniforms:this.uniforms,vertexShader:e.vertexShader,fragmentShader:e.fragmentShader})),this.fsQuad=new Sn(this.material)}render(e,t,i){this.uniforms[this.textureID]&&(this.uniforms[this.textureID].value=i.texture),this.fsQuad.material=this.material,this.renderToScreen?(e.setRenderTarget(null),this.fsQuad.render(e)):(e.setRenderTarget(t),this.clear&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),this.fsQuad.render(e))}dispose(){this.material.dispose(),this.fsQuad.dispose()}};var ks=class extends ci{constructor(e,t){super(),this.scene=e,this.camera=t,this.clear=!0,this.needsSwap=!1,this.inverse=!1}render(e,t,i){let r=e.getContext(),s=e.state;s.buffers.color.setMask(!1),s.buffers.depth.setMask(!1),s.buffers.color.setLocked(!0),s.buffers.depth.setLocked(!0);let a,o;this.inverse?(a=0,o=1):(a=1,o=0),s.buffers.stencil.setTest(!0),s.buffers.stencil.setOp(r.REPLACE,r.REPLACE,r.REPLACE),s.buffers.stencil.setFunc(r.ALWAYS,a,4294967295),s.buffers.stencil.setClear(o),s.buffers.stencil.setLocked(!0),e.setRenderTarget(i),this.clear&&e.clear(),e.render(this.scene,this.camera),e.setRenderTarget(t),this.clear&&e.clear(),e.render(this.scene,this.camera),s.buffers.color.setLocked(!1),s.buffers.depth.setLocked(!1),s.buffers.color.setMask(!0),s.buffers.depth.setMask(!0),s.buffers.stencil.setLocked(!1),s.buffers.stencil.setFunc(r.EQUAL,1,4294967295),s.buffers.stencil.setOp(r.KEEP,r.KEEP,r.KEEP),s.buffers.stencil.setLocked(!0)}},Po=class extends ci{constructor(){super(),this.needsSwap=!1}render(e){e.state.buffers.stencil.setLocked(!1),e.state.buffers.stencil.setTest(!1)}};var Io=class{constructor(e,t){if(this.renderer=e,this._pixelRatio=e.getPixelRatio(),t===void 0){let i=e.getSize(new re);this._width=i.width,this._height=i.height,t=new $t(this._width*this._pixelRatio,this._height*this._pixelRatio,{type:Ii}),t.texture.name="EffectComposer.rt1"}else this._width=t.width,this._height=t.height;this.renderTarget1=t,this.renderTarget2=t.clone(),this.renderTarget2.texture.name="EffectComposer.rt2",this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2,this.renderToScreen=!0,this.passes=[],this.copyPass=new Co(Ro),this.copyPass.material.blending=Ad,this.clock=new bo}swapBuffers(){let e=this.readBuffer;this.readBuffer=this.writeBuffer,this.writeBuffer=e}addPass(e){this.passes.push(e),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}insertPass(e,t){this.passes.splice(t,0,e),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}removePass(e){let t=this.passes.indexOf(e);t!==-1&&this.passes.splice(t,1)}isLastEnabledPass(e){for(let t=e+1;t<this.passes.length;t++)if(this.passes[t].enabled)return!1;return!0}render(e){e===void 0&&(e=this.clock.getDelta());let t=this.renderer.getRenderTarget(),i=!1;for(let r=0,s=this.passes.length;r<s;r++){let a=this.passes[r];if(a.enabled!==!1){if(a.renderToScreen=this.renderToScreen&&this.isLastEnabledPass(r),a.render(this.renderer,this.writeBuffer,this.readBuffer,e,i),a.needsSwap){if(i){let o=this.renderer.getContext(),l=this.renderer.state.buffers.stencil;l.setFunc(o.NOTEQUAL,1,4294967295),this.copyPass.render(this.renderer,this.writeBuffer,this.readBuffer,e),l.setFunc(o.EQUAL,1,4294967295)}this.swapBuffers()}ks!==void 0&&(a instanceof ks?i=!0:a instanceof Po&&(i=!1))}}this.renderer.setRenderTarget(t)}reset(e){if(e===void 0){let t=this.renderer.getSize(new re);this._pixelRatio=this.renderer.getPixelRatio(),this._width=t.width,this._height=t.height,e=this.renderTarget1.clone(),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.renderTarget1=e,this.renderTarget2=e.clone(),this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2}setSize(e,t){this._width=e,this._height=t;let i=this._width*this._pixelRatio,r=this._height*this._pixelRatio;this.renderTarget1.setSize(i,r),this.renderTarget2.setSize(i,r);for(let s=0;s<this.passes.length;s++)this.passes[s].setSize(i,r)}setPixelRatio(e){this._pixelRatio=e,this.setSize(this._width,this._height)}dispose(){this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.copyPass.dispose()}};var Lo=class extends ci{constructor(e,t,i=null,r=null,s=null){super(),this.scene=e,this.camera=t,this.overrideMaterial=i,this.clearColor=r,this.clearAlpha=s,this.clear=!0,this.clearDepth=!1,this.needsSwap=!1,this._oldClearColor=new be}render(e,t,i){let r=e.autoClear;e.autoClear=!1;let s,a;this.overrideMaterial!==null&&(a=this.scene.overrideMaterial,this.scene.overrideMaterial=this.overrideMaterial),this.clearColor!==null&&(e.getClearColor(this._oldClearColor),e.setClearColor(this.clearColor,e.getClearAlpha())),this.clearAlpha!==null&&(s=e.getClearAlpha(),e.setClearAlpha(this.clearAlpha)),this.clearDepth==!0&&e.clearDepth(),e.setRenderTarget(this.renderToScreen?null:i),this.clear===!0&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),e.render(this.scene,this.camera),this.clearColor!==null&&e.setClearColor(this._oldClearColor),this.clearAlpha!==null&&e.setClearAlpha(s),this.overrideMaterial!==null&&(this.scene.overrideMaterial=a),e.autoClear=r}};var Jd={name:"LuminosityHighPassShader",shaderID:"luminosityHighPass",uniforms:{tDiffuse:{value:null},luminosityThreshold:{value:1},smoothWidth:{value:1},defaultColor:{value:new be(0)},defaultOpacity:{value:0}},vertexShader:`

		varying vec2 vUv;

		void main() {

			vUv = uv;

			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		uniform sampler2D tDiffuse;
		uniform vec3 defaultColor;
		uniform float defaultOpacity;
		uniform float luminosityThreshold;
		uniform float smoothWidth;

		varying vec2 vUv;

		void main() {

			vec4 texel = texture2D( tDiffuse, vUv );

			float v = luminance( texel.xyz );

			vec4 outputColor = vec4( defaultColor.rgb, defaultOpacity );

			float alpha = smoothstep( luminosityThreshold, luminosityThreshold + smoothWidth, v );

			gl_FragColor = mix( outputColor, texel, alpha );

		}`};var Hr=class n extends ci{constructor(e,t,i,r){super(),this.strength=t!==void 0?t:1,this.radius=i,this.threshold=r,this.resolution=e!==void 0?new re(e.x,e.y):new re(256,256),this.clearColor=new be(0,0,0),this.renderTargetsHorizontal=[],this.renderTargetsVertical=[],this.nMips=5;let s=Math.round(this.resolution.x/2),a=Math.round(this.resolution.y/2);this.renderTargetBright=new $t(s,a,{type:Ii}),this.renderTargetBright.texture.name="UnrealBloomPass.bright",this.renderTargetBright.texture.generateMipmaps=!1;for(let u=0;u<this.nMips;u++){let d=new $t(s,a,{type:Ii});d.texture.name="UnrealBloomPass.h"+u,d.texture.generateMipmaps=!1,this.renderTargetsHorizontal.push(d);let p=new $t(s,a,{type:Ii});p.texture.name="UnrealBloomPass.v"+u,p.texture.generateMipmaps=!1,this.renderTargetsVertical.push(p),s=Math.round(s/2),a=Math.round(a/2)}let o=Jd;this.highPassUniforms=Mn.clone(o.uniforms),this.highPassUniforms.luminosityThreshold.value=r,this.highPassUniforms.smoothWidth.value=.01,this.materialHighPassFilter=new mt({uniforms:this.highPassUniforms,vertexShader:o.vertexShader,fragmentShader:o.fragmentShader}),this.separableBlurMaterials=[];let l=[3,5,7,9,11];s=Math.round(this.resolution.x/2),a=Math.round(this.resolution.y/2);for(let u=0;u<this.nMips;u++)this.separableBlurMaterials.push(this.getSeperableBlurMaterial(l[u])),this.separableBlurMaterials[u].uniforms.invSize.value=new re(1/s,1/a),s=Math.round(s/2),a=Math.round(a/2);this.compositeMaterial=this.getCompositeMaterial(this.nMips),this.compositeMaterial.uniforms.blurTexture1.value=this.renderTargetsVertical[0].texture,this.compositeMaterial.uniforms.blurTexture2.value=this.renderTargetsVertical[1].texture,this.compositeMaterial.uniforms.blurTexture3.value=this.renderTargetsVertical[2].texture,this.compositeMaterial.uniforms.blurTexture4.value=this.renderTargetsVertical[3].texture,this.compositeMaterial.uniforms.blurTexture5.value=this.renderTargetsVertical[4].texture,this.compositeMaterial.uniforms.bloomStrength.value=t,this.compositeMaterial.uniforms.bloomRadius.value=.1;let c=[1,.8,.6,.4,.2];this.compositeMaterial.uniforms.bloomFactors.value=c,this.bloomTintColors=[new M(1,1,1),new M(1,1,1),new M(1,1,1),new M(1,1,1),new M(1,1,1)],this.compositeMaterial.uniforms.bloomTintColors.value=this.bloomTintColors;let h=Ro;this.copyUniforms=Mn.clone(h.uniforms),this.blendMaterial=new mt({uniforms:this.copyUniforms,vertexShader:h.vertexShader,fragmentShader:h.fragmentShader,blending:Pi,depthTest:!1,depthWrite:!1,transparent:!0}),this.enabled=!0,this.needsSwap=!1,this._oldClearColor=new be,this.oldClearAlpha=1,this.basic=new Lt,this.fsQuad=new Sn(null)}dispose(){for(let e=0;e<this.renderTargetsHorizontal.length;e++)this.renderTargetsHorizontal[e].dispose();for(let e=0;e<this.renderTargetsVertical.length;e++)this.renderTargetsVertical[e].dispose();this.renderTargetBright.dispose();for(let e=0;e<this.separableBlurMaterials.length;e++)this.separableBlurMaterials[e].dispose();this.compositeMaterial.dispose(),this.blendMaterial.dispose(),this.basic.dispose(),this.fsQuad.dispose()}setSize(e,t){let i=Math.round(e/2),r=Math.round(t/2);this.renderTargetBright.setSize(i,r);for(let s=0;s<this.nMips;s++)this.renderTargetsHorizontal[s].setSize(i,r),this.renderTargetsVertical[s].setSize(i,r),this.separableBlurMaterials[s].uniforms.invSize.value=new re(1/i,1/r),i=Math.round(i/2),r=Math.round(r/2)}render(e,t,i,r,s){e.getClearColor(this._oldClearColor),this.oldClearAlpha=e.getClearAlpha();let a=e.autoClear;e.autoClear=!1,e.setClearColor(this.clearColor,0),s&&e.state.buffers.stencil.setTest(!1),this.renderToScreen&&(this.fsQuad.material=this.basic,this.basic.map=i.texture,e.setRenderTarget(null),e.clear(),this.fsQuad.render(e)),this.highPassUniforms.tDiffuse.value=i.texture,this.highPassUniforms.luminosityThreshold.value=this.threshold,this.fsQuad.material=this.materialHighPassFilter,e.setRenderTarget(this.renderTargetBright),e.clear(),this.fsQuad.render(e);let o=this.renderTargetBright;for(let l=0;l<this.nMips;l++)this.fsQuad.material=this.separableBlurMaterials[l],this.separableBlurMaterials[l].uniforms.colorTexture.value=o.texture,this.separableBlurMaterials[l].uniforms.direction.value=n.BlurDirectionX,e.setRenderTarget(this.renderTargetsHorizontal[l]),e.clear(),this.fsQuad.render(e),this.separableBlurMaterials[l].uniforms.colorTexture.value=this.renderTargetsHorizontal[l].texture,this.separableBlurMaterials[l].uniforms.direction.value=n.BlurDirectionY,e.setRenderTarget(this.renderTargetsVertical[l]),e.clear(),this.fsQuad.render(e),o=this.renderTargetsVertical[l];this.fsQuad.material=this.compositeMaterial,this.compositeMaterial.uniforms.bloomStrength.value=this.strength,this.compositeMaterial.uniforms.bloomRadius.value=this.radius,this.compositeMaterial.uniforms.bloomTintColors.value=this.bloomTintColors,e.setRenderTarget(this.renderTargetsHorizontal[0]),e.clear(),this.fsQuad.render(e),this.fsQuad.material=this.blendMaterial,this.copyUniforms.tDiffuse.value=this.renderTargetsHorizontal[0].texture,s&&e.state.buffers.stencil.setTest(!0),this.renderToScreen?(e.setRenderTarget(null),this.fsQuad.render(e)):(e.setRenderTarget(i),this.fsQuad.render(e)),e.setClearColor(this._oldClearColor,this.oldClearAlpha),e.autoClear=a}getSeperableBlurMaterial(e){let t=[];for(let i=0;i<e;i++)t.push(.39894*Math.exp(-.5*i*i/(e*e))/e);return new mt({defines:{KERNEL_RADIUS:e},uniforms:{colorTexture:{value:null},invSize:{value:new re(.5,.5)},direction:{value:new re(.5,.5)},gaussianCoefficients:{value:t}},vertexShader:`varying vec2 vUv;
				void main() {
					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
				}`,fragmentShader:`#include <common>
				varying vec2 vUv;
				uniform sampler2D colorTexture;
				uniform vec2 invSize;
				uniform vec2 direction;
				uniform float gaussianCoefficients[KERNEL_RADIUS];

				void main() {
					float weightSum = gaussianCoefficients[0];
					vec3 diffuseSum = texture2D( colorTexture, vUv ).rgb * weightSum;
					for( int i = 1; i < KERNEL_RADIUS; i ++ ) {
						float x = float(i);
						float w = gaussianCoefficients[i];
						vec2 uvOffset = direction * invSize * x;
						vec3 sample1 = texture2D( colorTexture, vUv + uvOffset ).rgb;
						vec3 sample2 = texture2D( colorTexture, vUv - uvOffset ).rgb;
						diffuseSum += (sample1 + sample2) * w;
						weightSum += 2.0 * w;
					}
					gl_FragColor = vec4(diffuseSum/weightSum, 1.0);
				}`})}getCompositeMaterial(e){return new mt({defines:{NUM_MIPS:e},uniforms:{blurTexture1:{value:null},blurTexture2:{value:null},blurTexture3:{value:null},blurTexture4:{value:null},blurTexture5:{value:null},bloomStrength:{value:1},bloomFactors:{value:null},bloomTintColors:{value:null},bloomRadius:{value:0}},vertexShader:`varying vec2 vUv;
				void main() {
					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
				}`,fragmentShader:`varying vec2 vUv;
				uniform sampler2D blurTexture1;
				uniform sampler2D blurTexture2;
				uniform sampler2D blurTexture3;
				uniform sampler2D blurTexture4;
				uniform sampler2D blurTexture5;
				uniform float bloomStrength;
				uniform float bloomRadius;
				uniform float bloomFactors[NUM_MIPS];
				uniform vec3 bloomTintColors[NUM_MIPS];

				float lerpBloomFactor(const in float factor) {
					float mirrorFactor = 1.2 - factor;
					return mix(factor, mirrorFactor, bloomRadius);
				}

				void main() {
					gl_FragColor = bloomStrength * ( lerpBloomFactor(bloomFactors[0]) * vec4(bloomTintColors[0], 1.0) * texture2D(blurTexture1, vUv) +
						lerpBloomFactor(bloomFactors[1]) * vec4(bloomTintColors[1], 1.0) * texture2D(blurTexture2, vUv) +
						lerpBloomFactor(bloomFactors[2]) * vec4(bloomTintColors[2], 1.0) * texture2D(blurTexture3, vUv) +
						lerpBloomFactor(bloomFactors[3]) * vec4(bloomTintColors[3], 1.0) * texture2D(blurTexture4, vUv) +
						lerpBloomFactor(bloomFactors[4]) * vec4(bloomTintColors[4], 1.0) * texture2D(blurTexture5, vUv) );
				}`})}};Hr.BlurDirectionX=new re(1,0);Hr.BlurDirectionY=new re(0,1);var Kd={name:"OutputShader",uniforms:{tDiffuse:{value:null},toneMappingExposure:{value:1}},vertexShader:`
		precision highp float;

		uniform mat4 modelViewMatrix;
		uniform mat4 projectionMatrix;

		attribute vec3 position;
		attribute vec2 uv;

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`
	
		precision highp float;

		uniform sampler2D tDiffuse;

		#include <tonemapping_pars_fragment>
		#include <colorspace_pars_fragment>

		varying vec2 vUv;

		void main() {

			gl_FragColor = texture2D( tDiffuse, vUv );

			// tone mapping

			#ifdef LINEAR_TONE_MAPPING

				gl_FragColor.rgb = LinearToneMapping( gl_FragColor.rgb );

			#elif defined( REINHARD_TONE_MAPPING )

				gl_FragColor.rgb = ReinhardToneMapping( gl_FragColor.rgb );

			#elif defined( CINEON_TONE_MAPPING )

				gl_FragColor.rgb = CineonToneMapping( gl_FragColor.rgb );

			#elif defined( ACES_FILMIC_TONE_MAPPING )

				gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );

			#elif defined( AGX_TONE_MAPPING )

				gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );

			#elif defined( NEUTRAL_TONE_MAPPING )

				gl_FragColor.rgb = NeutralToneMapping( gl_FragColor.rgb );

			#endif

			// color space

			#ifdef SRGB_TRANSFER

				gl_FragColor = sRGBTransferOETF( gl_FragColor );

			#endif

		}`};var Uo=class extends ci{constructor(){super();let e=Kd;this.uniforms=Mn.clone(e.uniforms),this.material=new _o({name:e.name,uniforms:this.uniforms,vertexShader:e.vertexShader,fragmentShader:e.fragmentShader}),this.fsQuad=new Sn(this.material),this._outputColorSpace=null,this._toneMapping=null}render(e,t,i){this.uniforms.tDiffuse.value=i.texture,this.uniforms.toneMappingExposure.value=e.toneMappingExposure,(this._outputColorSpace!==e.outputColorSpace||this._toneMapping!==e.toneMapping)&&(this._outputColorSpace=e.outputColorSpace,this._toneMapping=e.toneMapping,this.material.defines={},Ye.getTransfer(this._outputColorSpace)===tt&&(this.material.defines.SRGB_TRANSFER=""),this._toneMapping===_h?this.material.defines.LINEAR_TONE_MAPPING="":this._toneMapping===Mh?this.material.defines.REINHARD_TONE_MAPPING="":this._toneMapping===Sh?this.material.defines.CINEON_TONE_MAPPING="":this._toneMapping===Ns?this.material.defines.ACES_FILMIC_TONE_MAPPING="":this._toneMapping===bh?this.material.defines.AGX_TONE_MAPPING="":this._toneMapping===wh&&(this.material.defines.NEUTRAL_TONE_MAPPING=""),this.material.needsUpdate=!0),this.renderToScreen===!0?(e.setRenderTarget(null),this.fsQuad.render(e)):(e.setRenderTarget(t),this.clear&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),this.fsQuad.render(e))}dispose(){this.material.dispose(),this.fsQuad.dispose()}};var Do=class extends vn{constructor(){super();let e=new Ut;e.deleteAttribute("uv");let t=new Dt({side:Mt}),i=new Dt,r=new jn(16777215,900,28,2);r.position.set(.418,16.199,.3),this.add(r);let s=new pe(e,t);s.position.set(-.757,13.219,.717),s.scale.set(31.713,28.305,28.591),this.add(s);let a=new pe(e,i);a.position.set(-10.906,2.009,1.846),a.rotation.set(0,-.195,0),a.scale.set(2.328,7.905,4.651),this.add(a);let o=new pe(e,i);o.position.set(-5.607,-.754,-.758),o.rotation.set(0,.994,0),o.scale.set(1.97,1.534,3.955),this.add(o);let l=new pe(e,i);l.position.set(6.167,.857,7.803),l.rotation.set(0,.561,0),l.scale.set(3.927,6.285,3.687),this.add(l);let c=new pe(e,i);c.position.set(-2.017,.018,6.124),c.rotation.set(0,.333,0),c.scale.set(2.002,4.566,2.064),this.add(c);let h=new pe(e,i);h.position.set(2.291,-.756,-2.621),h.rotation.set(0,-.286,0),h.scale.set(1.546,1.552,1.496),this.add(h);let u=new pe(e,i);u.position.set(-2.193,-.369,-5.547),u.rotation.set(0,.516,0),u.scale.set(3.875,3.487,2.986),this.add(u);let d=new pe(e,Vr(50));d.position.set(-16.116,14.37,8.208),d.scale.set(.1,2.428,2.739),this.add(d);let p=new pe(e,Vr(50));p.position.set(-16.109,18.021,-8.207),p.scale.set(.1,2.425,2.751),this.add(p);let m=new pe(e,Vr(17));m.position.set(14.904,12.198,-1.832),m.scale.set(.15,4.265,6.331),this.add(m);let x=new pe(e,Vr(43));x.position.set(-.462,8.89,14.52),x.scale.set(4.38,5.441,.088),this.add(x);let g=new pe(e,Vr(20));g.position.set(3.235,11.486,-12.541),g.scale.set(2.5,2,.1),this.add(g);let f=new pe(e,Vr(100));f.position.set(0,20,0),f.scale.set(1,.1,1),this.add(f)}dispose(){let e=new Set;this.traverse(t=>{t.isMesh&&(e.add(t.geometry),e.add(t.material))});for(let t of e)t.dispose()}};function Vr(n){let e=new Lt;return e.color.setScalar(n),e}var{U:Oo}=window.XA,Ft={pulse:{name:"Pulse Laser",dmg:9,cool:.24,heat:4.5,color:16724016,snd:"pulse",price:400,tech:1},beam:{name:"Beam Laser",dmg:7,cool:.11,heat:3,color:16764992,snd:"beam",price:1e3,tech:4},military:{name:"Military Laser",dmg:11,cool:.1,heat:3.2,color:4259728,snd:"military",price:6e3,tech:10},mining:{name:"Mining Laser",dmg:15,cool:.45,heat:6.5,color:4245759,snd:"mining",price:800,tech:4,mining:!0}},Bh=[{id:"fuel",name:"Fuel (refill)",tech:1,desc:"Fills the tanks. 2 Cr per light year."},{id:"missile",name:"Homing Missile",price:30,tech:1,desc:"Lock a target with T and launch with M."},{id:"laser_f",name:"Front Laser",tech:1,laser:"front",desc:"Choose the type with left / right."},{id:"laser_r",name:"Rear Laser",tech:3,laser:"rear",desc:"Fires when you look backwards (view 2)."},{id:"bay",name:"Large Cargo Bay",price:400,tech:1,desc:"Adds 50 % to the cargo capacity."},{id:"ecm",name:"E.C.M. System",price:600,tech:2,desc:"Destroys all missiles in range (key Z)."},{id:"scoop",name:"Fuel Scoops",price:525,tech:5,desc:"Scoop cargo canisters and skim fuel from stars."},{id:"pod",name:"Escape Pod",price:1e3,tech:6,desc:"Saves your life and your credits (Delete key)."},{id:"bomb",name:"Energy Bomb",price:900,tech:7,desc:"Destroys every small ship nearby (key B)."},{id:"energy",name:"Extra Energy Unit",price:1500,tech:8,desc:"Recharges energy and shields twice as fast."},{id:"shield",name:"Shield Booster",price:2500,tech:9,desc:"Shields are 50 % stronger."},{id:"dock",name:"Docking Computer",price:1500,tech:9,desc:"Docks for you (key L)."},{id:"galactic",name:"Galactic Hyperdrive",price:5e3,tech:10,desc:"One jump to the next galaxy (key G). Used up."}],hi={kestrel:{name:"Kestrel Mk II",role:"trader",price:45e3,cargo:20,speed:320,roll:2.4,pitch:1.2,shields:60,energy:100,missiles:4,fuel:7,size:42,kill:1,bounty:0},wren:{name:"Wren Courier",role:"trader",price:28e3,cargo:10,speed:430,roll:3,pitch:1.5,shields:45,energy:80,missiles:2,fuel:7,size:30,kill:.6,bounty:0},mule:{name:"Mule Hauler",role:"trader",price:62e3,cargo:60,speed:230,roll:1.6,pitch:.9,shields:80,energy:120,missiles:2,fuel:7,size:64,kill:1,bounty:0},falcon:{name:"Falcon Interceptor",role:"fighter",price:96e3,cargo:12,speed:430,roll:3.2,pitch:1.6,shields:110,energy:140,missiles:4,fuel:7,size:38,kill:2,bounty:0},atlas:{name:"Atlas Freighter",role:"trader",price:165e3,cargo:140,speed:200,roll:1.2,pitch:.7,shields:150,energy:200,missiles:3,fuel:8,size:110,kill:2,bounty:0},vanguard:{name:"Vanguard Gunship",role:"fighter",price:245e3,cargo:40,speed:340,roll:2.5,pitch:1.3,shields:190,energy:230,missiles:6,fuel:7,size:60,kill:3,bounty:0},seraph:{name:"Seraph Explorer",role:"fighter",price:39e4,cargo:70,speed:390,roll:2.6,pitch:1.35,shields:210,energy:260,missiles:5,fuel:10,size:72,kill:3,bounty:0},jackal:{name:"Jackal Raider",role:"pirate",cargo:4,speed:400,roll:3,pitch:1.6,shields:40,energy:70,missiles:1,size:32,kill:1,bounty:40},raptor:{name:"Raptor Corsair",role:"pirate",cargo:10,speed:360,roll:2.4,pitch:1.3,shields:90,energy:130,missiles:2,size:48,kill:2,bounty:120},warden:{name:"Warden Patrol",role:"police",cargo:0,speed:450,roll:3,pitch:1.6,shields:90,energy:120,missiles:2,size:40,kill:2,bounty:0},xyrrid:{name:"Xyrrid Hive Ship",role:"alien",cargo:0,speed:260,roll:1.2,pitch:.8,shields:400,energy:500,missiles:0,size:140,kill:8,bounty:600},drone:{name:"Xyrrid Drone",role:"alien",cargo:0,speed:460,roll:3.4,pitch:1.8,shields:30,energy:50,missiles:0,size:22,kill:1,bounty:60},asteroid:{name:"Asteroid",role:"rock",cargo:0,speed:20,roll:.3,pitch:.3,shields:0,energy:120,missiles:0,size:90,kill:.1,bounty:0},boulder:{name:"Boulder",role:"rock",cargo:0,speed:40,roll:.5,pitch:.5,shields:0,energy:30,missiles:0,size:34,kill:.05,bounty:0},canister:{name:"Cargo Canister",role:"cargo",cargo:0,speed:0,roll:1,pitch:1,shields:0,energy:18,missiles:0,size:12,kill:0,bounty:0},pod:{name:"Escape Pod",role:"cargo",cargo:0,speed:60,roll:1,pitch:1,shields:0,energy:10,missiles:0,size:10,kill:0,bounty:0},missile:{name:"Missile",role:"missile",cargo:0,speed:720,roll:3,pitch:2.6,shields:0,energy:6,missiles:0,size:9,kill:.1,bounty:0}},Qd=["wren","kestrel","mule","falcon","atlas","vanguard","seraph"],kh={};function ep(n,e,t){let i=n+e+t;if(kh[i])return kh[i];let r=document.createElement("canvas");r.width=r.height=256;let s=r.getContext("2d"),a=Oo.rng(t);s.fillStyle=n,s.fillRect(0,0,256,256);for(let l=0;l<40;l++){let c=a()*256,h=a()*256,u=20+a()*80,d=10+a()*50;s.fillStyle=`rgba(${a()<.5?"0,0,0":"255,255,255"},${.04+a()*.06})`,s.fillRect(c,h,u,d)}s.strokeStyle="rgba(0,0,0,0.45)",s.lineWidth=1.5;for(let l=0;l<18;l++){let c=Math.floor(a()*16)*16,h=Math.floor(a()*16)*16;s.strokeRect(c+.5,h+.5,32+Math.floor(a()*3)*16,16+Math.floor(a()*3)*16)}s.fillStyle="rgba(0,0,0,0.5)";for(let l=0;l<120;l++)s.fillRect(Math.floor(a()*64)*4,Math.floor(a()*64)*4,1.5,1.5);e&&(s.fillStyle=e,s.fillRect(0,100,256,18),s.fillStyle="rgba(255,255,255,0.6)",s.fillRect(0,96,256,3));let o=new yn(r);return o.wrapS=o.wrapT=Hn,o.colorSpace=Vt,o.anisotropy=4,kh[i]=o,o}var No=null;function zh(){if(No)return No;let n=document.createElement("canvas");n.width=n.height=128;let e=n.getContext("2d"),t=e.createRadialGradient(64,64,0,64,64,64);return t.addColorStop(0,"rgba(255,255,255,1)"),t.addColorStop(.2,"rgba(255,255,255,0.8)"),t.addColorStop(.45,"rgba(255,255,255,0.25)"),t.addColorStop(1,"rgba(255,255,255,0)"),e.fillStyle=t,e.fillRect(0,0,128,128),No=new yn(n),No}function ii(n,e,t=1){let i=new Gn({map:zh(),color:n,transparent:!0,opacity:t,blending:Pi,depthWrite:!1}),r=new Ur(i);return r.scale.set(e,e,1),r}function Fh(n,e,t=.35,i=0,r=1.2){let s=new Nr(n.map(([h,u])=>new re(h,u))),a=new Ls(s,{depth:e,bevelEnabled:!0,bevelThickness:r,bevelSize:r,bevelSegments:1});a.rotateX(Math.PI/2),a.translate(0,e/2,0);let o=a.attributes.position,l=1e9,c=-1e9;for(let h=0;h<o.count;h++)l=Math.min(l,o.getZ(h)),c=Math.max(c,o.getZ(h));for(let h=0;h<o.count;h++){let u=o.getY(h),d=(u+e/2)/e,p=1-t*d;o.setX(h,o.getX(h)*p);let m=(o.getZ(h)-l)/(c-l);o.setY(h,u*(.35+.65*m)-i*(1-m))}return a.computeVertexNormals(),a}function bn(n,e={}){return new Dt(Object.assign({color:n,metalness:.55,roughness:.42,flatShading:!0},e))}var s0={kestrel:{outline:[[0,-22],[9,-6],[24,10],[22,16],[-22,16],[-24,10],[-9,-6]],h:9,taper:.45,col:"#d0d4dc",stripe:"#2a6aff",eng:[[-8,0,3.2],[8,0,3.2]],cock:[0,3.5,-8,4],fins:[[0,4,12,7]],glow:4235519},wren:{outline:[[0,-18],[6,-4],[8,8],[14,12],[-14,12],[-8,8],[-6,-4]],h:6,taper:.4,col:"#f0e0c0",stripe:"#e0602a",eng:[[0,0,3.4]],cock:[0,2.6,-6,3.2],wings:[[[8,2],[20,10],[20,13],[8,11]]],glow:16748608},mule:{outline:[[0,-26],[14,-18],[18,0],[18,30],[-18,30],[-18,0],[-14,-18]],h:16,taper:.25,col:"#b8b070",stripe:"#3a3a3a",eng:[[-9,-3,4],[9,-3,4],[-9,4,3],[9,4,3]],cock:[0,7,-16,4.5],boxes:[[-23,0,6,5,9,26],[23,0,6,5,9,26]],glow:16764992},falcon:{outline:[[0,-24],[5,-8],[8,6],[6,14],[-6,14],[-8,6],[-5,-8]],h:7,taper:.4,col:"#c03030",stripe:"#f0f0f0",eng:[[-3.5,0,2.8],[3.5,0,2.8]],cock:[0,3,-9,3.4],wings:[[[7,0],[26,12],[26,15],[6,12]],[[-7,0],[-6,12],[-26,15],[-26,12]]],fins:[[-7,4,10,6],[7,4,10,6]],guns:[[-21,0,12],[21,0,12]],glow:16732208},atlas:{outline:[[0,-50],[18,-36],[26,0],[26,56],[-26,56],[-26,0],[-18,-36]],h:24,taper:.2,col:"#7a8a9a",stripe:"#ffb020",eng:[[-14,-4,6],[14,-4,6],[0,6,6]],cock:[0,10,-34,6],boxes:[[-34,-2,0,8,14,70],[34,-2,0,8,14,70],[0,16,14,18,6,50]],glow:16760928},vanguard:{outline:[[0,-32],[10,-14],[16,4],[22,20],[-22,20],[-16,4],[-10,-14]],h:12,taper:.4,col:"#3a4a3a",stripe:"#d0d040",eng:[[-10,0,4],[10,0,4],[0,2,3]],cock:[0,5,-14,4.5],wings:[[[16,2],[34,18],[34,24],[16,18]],[[-16,2],[-16,18],[-34,24],[-34,18]]],fins:[[-14,6,14,9],[14,6,14,9]],guns:[[-32,0,24],[32,0,24],[-6,-3,-26],[6,-3,-26]],glow:8453984},seraph:{outline:[[0,-38],[7,-20],[12,0],[20,22],[10,30],[-10,30],[-20,22],[-12,0],[-7,-20]],h:10,taper:.5,col:"#e8ecf4",stripe:"#8a3aff",eng:[[-7,0,4],[7,0,4]],cock:[0,4.5,-18,4.5],wings:[[[11,4],[38,26],[40,30],[14,26]],[[-11,4],[-14,26],[-40,30],[-38,26]]],fins:[[0,5,20,12]],glow:11559167},jackal:{outline:[[0,-18],[10,0],[14,12],[-14,12],[-10,0]],h:6,taper:.5,col:"#3a3036",stripe:"#d02a2a",eng:[[-5,0,2.6],[5,0,2.6]],cock:[0,2.6,-4,3],fins:[[-12,3,9,7],[12,3,9,7]],guns:[[-8,-1,-10],[8,-1,-10]],glow:16724016},raptor:{outline:[[0,-28],[8,-12],[24,-4],[26,6],[12,20],[-12,20],[-26,6],[-24,-4],[-8,-12]],h:9,taper:.45,col:"#4a2a1a",stripe:"#e0a020",eng:[[-7,0,3.4],[7,0,3.4]],cock:[0,4,-10,4],fins:[[-20,4,2,9],[20,4,2,9]],guns:[[-24,0,-6],[24,0,-6]],glow:16740384},warden:{outline:[[0,-24],[8,-6],[16,10],[12,16],[-12,16],[-16,10],[-8,-6]],h:8,taper:.45,col:"#1a2a6a",stripe:"#f0f0f0",eng:[[-5,0,3],[5,0,3]],cock:[0,3.4,-8,3.6],fins:[[0,4,10,8]],guns:[[-14,0,0],[14,0,0]],lights:!0,glow:4235519},drone:{outline:[[0,-14],[10,-4],[10,6],[0,12],[-10,6],[-10,-4]],h:6,taper:.7,col:"#2a5a3a",stripe:null,eng:[[0,0,3]],alien:!0,glow:6356880},xyrrid:{outline:[[0,-70],[50,-50],[70,0],[50,50],[0,70],[-50,50],[-70,0],[-50,-50]],h:30,taper:.55,col:"#1a3a2a",stripe:null,eng:[[-30,0,8],[30,0,8],[0,0,10]],alien:!0,glow:6356880},pod:{outline:[[0,-6],[4,-2],[4,4],[-4,4],[-4,-2]],h:4,taper:.4,col:"#e0e0e0",stripe:"#ff6020",eng:[[0,0,1.4]],glow:16752704}};function Yn(n){let e=new Zt,t=s0[n];if(n==="asteroid"||n==="boulder")return a0(hi[n].size*.5,Math.random()*1e6);if(n==="canister")return o0();if(n==="missile")return l0();let i=ep(t.col,t.stripe,n.length*977);i.repeat.set(.04,.04);let r=bn(16777215,{map:i,metalness:t.alien?.2:.6,roughness:t.alien?.7:.38}),s=bn(2237740,{metalness:.7,roughness:.5}),a=new pe(Fh(t.outline,t.h,t.taper,t.h*.15),r);e.add(a);let o=new pe(Fh(t.outline.map(([u,d])=>[u*.8,d*.85]),t.h*.35,.1),s);o.position.y=-t.h*.42,e.add(o);for(let u of t.wings||[]){let d=new pe(Fh(u,t.h*.22,.2,0,.6),r);d.position.y=-t.h*.1,e.add(d)}for(let u of t.boxes||[]){let[d,p,m,x,g,f]=u,y=new pe(new Ut(x,g,f),r);y.position.set(d,p,m),e.add(y);let v=new pe(new Ut(x+.6,g*.25,f*.95),s);v.position.set(d,p+g*.3,m),e.add(v)}for(let u of t.fins||[]){let[d,p,m,x]=u,g=new Ut(1.4,x,x*1.3),f=g.attributes.position;for(let v=0;v<f.count;v++)f.getY(v)>0&&(f.setZ(v,f.getZ(v)*.45+x*.55),f.setX(v,f.getX(v)*.4));g.computeVertexNormals();let y=new pe(g,r);y.position.set(d,Math.min(p,t.h*.3)+x*.5,m),e.add(y)}let l=new be(t.glow);e.userData.engines=[];let c=Math.max(...t.outline.map(u=>u[1]));for(let[u,d,p]of t.eng){let m=new pe(new Wt(p,p*1.25,p*2.6,12,1,!0),s);m.rotation.x=Math.PI/2,m.position.set(u,d,c-p*.6),e.add(m);let x=new pe(new As(p*1.1,16),new Lt({color:l.clone().multiplyScalar(2.2)}));x.position.set(u,d,c+p*.65),e.add(x);let g=ii(t.glow,p*4.5,.85);g.position.set(u,d,c+p*1.2),e.add(g),e.userData.engines.push(g)}if(t.cock){let[u,d,p,m]=t.cock,x=new pe(new yi(m,16,10,0,Math.PI*2,0,Math.PI/2),new Dt({color:662074,metalness:1,roughness:.08,emissive:666202,emissiveIntensity:.6}));x.scale.set(1,.7,2),x.position.set(u,d,p),e.add(x)}for(let[u,d,p]of t.guns||[]){let m=new pe(new Wt(.6,.9,12,6),s);m.rotation.x=Math.PI/2,m.position.set(u,d,p-4),e.add(m)}let h=Math.max(...t.outline.map(u=>Math.abs(u[0])),...(t.wings||[]).flat().map(u=>Math.abs(u[0])));e.userData.navLights=[];for(let[u,d]of[[-1,16719904],[1,2162496]]){let p=ii(d,Math.max(4,t.h*.8),1);p.position.set(u*h*.95,0,c*.5),e.add(p),e.userData.navLights.push(p)}if(t.lights){let u=ii(4227327,10,1);u.position.set(0,t.h*.8,c*.3),e.add(u),e.userData.siren=u}if(t.alien){let u=new pe(new xn(t.h*.6,1),new Dt({color:1060896,emissive:4259712,emissiveIntensity:1.2,flatShading:!0}));u.position.y=t.h*.3,e.add(u),e.userData.core=u}return e.traverse(u=>{u.isMesh&&(u.castShadow=!1,u.receiveShadow=!1)}),e}function a0(n,e){let t=new xn(n,2),i=t.attributes.position,r=Oo.rng(e|0),s=Array.from({length:6},()=>[new M(r()-.5,r()-.5,r()-.5).normalize(),r()*.35]),a=new M;for(let c=0;c<i.count;c++){a.fromBufferAttribute(i,c);let h=a.clone().normalize(),u=1+(Oo.hash(Math.floor((h.x+2)*50)*7+Math.floor((h.y+2)*50)*131+Math.floor((h.z+2)*50)*977)-.5)*.12;for(let[d,p]of s)u-=Math.max(0,h.dot(d)-.7)*p*2;a.multiplyScalar(u),i.setXYZ(c,a.x,a.y*.8,a.z)}t.computeVertexNormals();let o=new pe(t,new Dt({color:6971480,roughness:.95,metalness:.05,flatShading:!0})),l=new Zt;return l.add(o),l}function o0(){let n=new Zt,e=new pe(new Wt(5,5,12,8),bn(9079440)),t=new pe(new Wt(5.3,5.3,2.5,8),bn(16748576,{emissive:4200448}));n.add(e,t);let i=ii(16752688,10,.9);return i.position.y=7,n.add(i),n}function l0(){let n=new Zt,e=new pe(new Wt(1.2,1.2,12,8),bn(13684944));e.rotation.x=Math.PI/2,n.add(e);let t=new pe(new Rs(1.2,4,8),bn(16724e3));t.rotation.x=-Math.PI/2,t.position.z=-8,n.add(t);let i=ii(16752704,14,1);return i.position.z=7,n.add(i),n.userData.engines=[i],n}function tp(n){let e=new Zt,t=Oo.rng(n),i=ep("#7c828c","#3a6ab0",n);i.repeat.set(4,2);let r=bn(16777215,{map:i,metalness:.5,roughness:.5}),s=bn(2764342,{metalness:.6,roughness:.6}),a=new pe(new Wt(220,260,520,12,1),r);a.rotation.x=Math.PI/2,e.add(a);let o=new pe(new Wt(225,225,20,12,1),s);o.rotation.x=Math.PI/2,o.position.z=268,e.add(o);let l=new pe(new Ut(150,60,30),new Lt({color:0}));l.position.z=272,e.add(l);let c=new Lt({color:6340863});for(let[v,_,E,T]of[[170,6,0,33],[170,6,0,-33],[6,66,85,0],[6,66,-85,0]]){let A=new pe(new Ut(v,_,6),c);A.position.set(E,T,286),e.add(A)}e.userData.slotLights=[];for(let v=0;v<8;v++){let _=ii(v%2?6340863:16777215,26,1);_.position.set(-90+v%4*60,v<4?50:-50,290),e.add(_),e.userData.slotLights.push(_)}let h=new pe(new kr(900,70,12,48),r);e.add(h);let u=new pe(new kr(900,74,4,48),new Dt({color:1118481,emissive:16767120,emissiveIntensity:0,wireframe:!1}));u.scale.set(1,1,.2),e.add(u);for(let v=0;v<4;v++){let _=new pe(new Ut(700,50,60),s),E=v/4*Math.PI*2+Math.PI/4;_.position.set(Math.cos(E)*560,Math.sin(E)*560,0),_.rotation.z=E,e.add(_)}let d=new Lt({color:16769184}),p=new lo(new Ut(18,8,2),d,192),m=new xt,x=0;for(let v=0;v<96;v++)for(let _ of[72,-72]){if(t()<.25)continue;let E=v/96*Math.PI*2;m.position.set(Math.cos(E)*900,Math.sin(E)*900,_),m.rotation.set(0,0,E+Math.PI/2),m.updateMatrix(),p.setMatrixAt(x++,m.matrix)}p.count=x,e.add(p);let g=new Dt({color:1714794,metalness:.8,roughness:.25,emissive:330272});for(let v of[-1,1]){let _=new pe(new Ut(600,4,160),g);_.position.set(v*1350,0,-150),e.add(_);let E=new pe(new Ut(400,20,20),s);E.position.set(v*1100,0,-150),e.add(E)}let f=new pe(new Wt(8,8,500,6),s);f.rotation.x=Math.PI/2,f.position.z=-500,e.add(f);let y=ii(16724016,80,1);return y.position.z=-760,e.add(y),e.userData.beacon=y,e}var Wh={};mu(Wh,{CHART_H:()=>rn,CHART_W:()=>Vi,ECONOMY:()=>Fs,GALAXIES:()=>c0,GALAXY_NAMES:()=>Bo,GOODS:()=>Jt,GOOD_INDEX:()=>h0,GOV:()=>Bs,LY:()=>Zn,PLANET_TYPES:()=>zs,RANKS:()=>Vh,SYSTEMS:()=>cp,dist:()=>Li,galaxy:()=>Kt,inRange:()=>p0,legalName:()=>Wr,market:()=>Gh,rankOf:()=>Ui});var{U:Gr}=window.XA,c0=8,cp=256,Vi=1024,rn=512,Zn=12,Fs=["Rich Industrial","Average Industrial","Poor Industrial","Mainly Industrial","Mainly Agricultural","Rich Agricultural","Average Agricultural","Poor Agricultural"],Bs=["Anarchy","Feudal","Multi-Government","Dictatorship","Communist","Confederacy","Democracy","Corporate State"],Bo=["Cygnus Reach","The Amber Drift","Orion Shallows","Veil of Kesh","The Iron Spiral","Lumen Expanse","Thalassa Cluster","The Far Rim"],Jt=[{id:"food",name:"Food",unit:"t",base:19,grad:-2,mask:7,qbase:6,qmask:15,legal:0},{id:"textiles",name:"Textiles",unit:"t",base:21,grad:-1,mask:7,qbase:10,qmask:15,legal:0},{id:"radio",name:"Radioactives",unit:"t",base:64,grad:-3,mask:15,qbase:2,qmask:7,legal:0},{id:"droids",name:"Service Droids",unit:"t",base:39,grad:-5,mask:31,qbase:0,qmask:31,legal:1},{id:"spirits",name:"Spirits",unit:"t",base:82,grad:-5,mask:15,qbase:18,qmask:15,legal:0},{id:"lux",name:"Luxuries",unit:"t",base:192,grad:8,mask:3,qbase:16,qmask:3,legal:0},{id:"narc",name:"Narcotics",unit:"t",base:230,grad:28,mask:120,qbase:6,qmask:120,legal:3},{id:"comp",name:"Computers",unit:"t",base:151,grad:14,mask:31,qbase:54,qmask:7,legal:0},{id:"mach",name:"Machinery",unit:"t",base:115,grad:6,mask:15,qbase:40,qmask:7,legal:0},{id:"alloys",name:"Alloys",unit:"t",base:77,grad:1,mask:31,qbase:30,qmask:31,legal:0},{id:"arms",name:"Firearms",unit:"t",base:121,grad:13,mask:7,qbase:4,qmask:7,legal:2},{id:"furs",name:"Furs",unit:"t",base:174,grad:-9,mask:63,qbase:2,qmask:31,legal:0},{id:"minerals",name:"Minerals",unit:"t",base:31,grad:-1,mask:3,qbase:52,qmask:7,legal:0},{id:"gold",name:"Gold",unit:"kg",base:95,grad:-1,mask:7,qbase:6,qmask:31,legal:0},{id:"platinum",name:"Platinum",unit:"kg",base:168,grad:-2,mask:31,qbase:3,qmask:15,legal:0},{id:"gems",name:"Gemstones",unit:"g",base:44,grad:-1,mask:15,qbase:2,qmask:7,legal:0},{id:"alien",name:"Alien Artifacts",unit:"t",base:52,grad:15,mask:63,qbase:0,qmask:0,legal:0}],h0=Object.fromEntries(Jt.map((n,e)=>[n.id,e])),ip=["za","ce","bi","so","us","es","ar","ma","in","di","re","a","er","at","en","be","ra","la","ve","ti","ed","or","qu","an","te","is","ri","on","lo","ka","xe","vy","ny","ur","ol","ix","em","tho","ga","dru","sel","op","ny","zu","ha","mir","ok","el"];function u0(n){let e=n()<.35?2:n()<.85?3:4,t="";for(let i=0;i<e;i++)t+=ip[Math.floor(n()*ip.length)];return t=t.slice(0,9),t[0].toUpperCase()+t.slice(1)}var np=["Large","Fierce","Small","Green","Red","Yellow","Blue","Black","Harmless","Slimy","Bug-Eyed","Horned","Bony","Fat","Furry","Feathered","Six-Legged","Crystalline"],ko=["Rodents","Frogs","Lizards","Lobsters","Birds","Humanoids","Felines","Insects","Molluscs","Fungoids","Otters","Moths"],rp=["famous","noted","well known","notorious","celebrated","infamous","loved"],Fo=["its ancient {X} forests","its {X} tea ceremonies","its vast oceans of {X}","its mad {X} sport","its exotic {X} cuisine","its unusual {X} poetry","its endless {X} festivals","its deadly {X} storms","its lethargic {X} zoos","its fabulous {X} night markets","its spectacular {X} geysers","its hostile {X} jungles"],sp=["moss","glass","coral","jelly","lava","crystal","fungus","orchid","salt","sand","pepper","ice"],ap=["a plague of {S}","frequent outbreaks of {S}","a deep fear of {S}","the unpredictable {S}","its vicious {S} wrestling","its love of {S} racing"],op=["The locals are said to be extremely polite to visitors.","Watch out for the customs officers \u2013 they are bored.","Travellers praise the station's noodle bars.","The planet has no moon and is a little sad about it.","Pilots are advised to avoid the outer asteroid belt.","Its orbital station is said to smell of cinnamon.","Nobody remembers who built the old ruins here.","Tourists come for the sunsets and leave for the taxes.","The local bureaucracy is legendary throughout the sector."],zs={terran:{pal:[[0,"#123a8a"],[.47,"#1e5ab0"],[.5,"#d8c890"],[.53,"#3a8a3a"],[.7,"#2a6a2a"],[.82,"#7a6a4a"],[.92,"#e8e8f0"]],clouds:.6,atmo:"#6ab0ff"},ocean:{pal:[[0,"#082a6a"],[.6,"#1a5ab0"],[.66,"#e0d8a0"],[.7,"#4aa04a"],[.9,"#f0f0f0"]],clouds:.7,atmo:"#7ac0ff"},desert:{pal:[[0,"#6a3a1a"],[.35,"#b0703a"],[.55,"#e0a860"],[.75,"#c08040"],[.9,"#f0d8a0"]],clouds:.15,atmo:"#ffc080"},ice:{pal:[[0,"#3a5a7a"],[.4,"#8aa8c0"],[.6,"#bcd0e0"],[1,"#dce6f0"]],clouds:.3,atmo:"#a0c8f0"},jungle:{pal:[[0,"#0a3a3a"],[.4,"#1a6a3a"],[.42,"#3a8a2a"],[.7,"#2a7a1a"],[.85,"#5a8a2a"],[1,"#8aa04a"]],clouds:.75,atmo:"#80ffb0"},volcanic:{pal:[[0,"#ff6a1a"],[.25,"#a02a0a"],[.3,"#2a1a1a"],[.7,"#3a2a2a"],[1,"#6a5a5a"]],clouds:.25,atmo:"#ff8040",glow:!0},toxic:{pal:[[0,"#3a4a0a"],[.4,"#6a8a1a"],[.6,"#a0b02a"],[.8,"#d0c84a"],[1,"#f0e8a0"]],clouds:.8,atmo:"#c8ff60"},barren:{pal:[[0,"#3a3a3a"],[.4,"#6a6060"],[.7,"#9a9088"],[1,"#d0c8c0"]],clouds:0,atmo:"#a0a0b0"}},lp=[{cls:"M",color:"#ff8a5a",size:.7},{cls:"K",color:"#ffb870",size:.85},{cls:"G",color:"#fff2c0",size:1},{cls:"F",color:"#fffaf0",size:1.15},{cls:"A",color:"#d0e0ff",size:1.35},{cls:"B",color:"#a8c0ff",size:1.6}],Hh=[];function Kt(n){if(Hh[n])return Hh[n];let e=Gr.rng(20903+n*7919),t=[],i=new Set;for(let r=0;r<cp;r++){let s;do s=u0(e);while(i.has(s));i.add(s);let a,o;if(e()<.7){let l=Math.floor(e()*3),c=e(),h=l*2.1+c*3.2+n;a=Vi/2+Math.cos(h)*(60+c*420)+(e()-.5)*90,o=rn/2+Math.sin(h)*(30+c*210)+(e()-.5)*60}else a=20+e()*(Vi-40),o=20+e()*(rn-40);a=Gr.clamp(a,16,Vi-16),o=Gr.clamp(o,16,rn-16),t.push({gi:n,i:r,name:s,x:a,y:o,r:Gr.rng(40503+n*100003+r*131)})}for(let r=0;r<3;r++)for(let s of t){let a=null,o=1e9;for(let l of t)if(l!==s){let c=Math.hypot(l.x-s.x,l.y-s.y);c<o&&(o=c,a=l)}if(o>6.2*Zn){let l=5*Zn/o;s.x=a.x+(s.x-a.x)*l,s.y=a.y+(s.y-a.y)*l}}for(let r of t)d0(r);return Hh[n]=t,t}function d0(n){let e=n.r;n.gov=Math.floor(e()*8),n.econ=Math.floor(e()*8),n.gov<=1&&(n.econ=Math.max(n.econ,2)),n.tech=Gr.clamp(Math.floor((7-n.econ)*.9+n.gov*.5+e()*4)+1,1,15),n.pop=Math.round((n.tech*4+n.econ+n.gov+1+e()*4)*10)/100,n.prod=Math.round((7-n.econ+3)*(n.gov+4)*n.pop*80),n.radius=2500+Math.floor(e()*4500),n.species=e()<.5?"Human Colonials":`${np[Math.floor(e()*np.length)]} ${ko[Math.floor(e()*ko.length)]}`;let t=()=>sp[Math.floor(e()*sp.length)],i=Fo[Math.floor(e()*Fo.length)].replace("{X}",t()),r=e()<.5?Fo[Math.floor(e()*Fo.length)].replace("{X}",t()):ap[Math.floor(e()*ap.length)].replace("{S}",`${ko[Math.floor(e()*ko.length)].toLowerCase()}`);n.desc=`${n.name} is ${rp[Math.floor(e()*rp.length)]} for ${i} and ${r===i?"its friendly people":r}. ${op[Math.floor(e()*op.length)]}`;let a=n.econ>=4?["terran","ocean","jungle","terran","ice"]:["desert","volcanic","toxic","barren","terran","ice"];n.ptype=a[Math.floor(e()*a.length)],n.star=lp[Math.floor(e()*lp.length)],n.rings=e()<.25,n.moons=Math.floor(e()*3),n.seed=Math.floor(e()*1e9),n.hue=e(),n.nebula=[e(),e(),e()]}var Li=(n,e)=>Math.hypot(n.x-e.x,n.y-e.y)/Zn,p0=(n,e,t)=>e.filter(i=>i!==n&&Li(n,i)<=t);function Gh(n,e){return Jt.map(t=>{let i=(t.base+(e&t.mask)+n.econ*t.grad)*.4,r=t.qbase+(e&t.qmask)-n.econ*t.grad&63;return t.id==="alien"&&(r=0),t.legal>=2&&n.gov>=5&&(r=0),{price:Math.max(.4,i),qty:Gr.clamp(r,0,63)}})}var Vh=[[0,"Harmless"],[4,"Mostly Harmless"],[10,"Poor"],[20,"Average"],[40,"Above Average"],[80,"Competent"],[180,"Dangerous"],[400,"Deadly"],[900,"LEGEND"]];function Ui(n){let e=Vh[0][1];for(let[t,i]of Vh)n>=t&&(e=i);return e}function Wr(n){return n>=50?"Fugitive":n>0?"Offender":"Clean"}var Xh=`/* STARHAUL: background worker that paints planet surfaces, clouds, night lights and the nebula sky (seamless 3D noise). */
"use strict";

function rng(seed) { let s = (seed >>> 0) || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
function makeNoise(seed) {
  const r = rng(seed), perm = new Uint8Array(512), vals = new Float32Array(256);
  for (let i = 0; i < 256; i++) { perm[i] = i; vals[i] = r(); }
  for (let i = 255; i > 0; i--) { const j = Math.floor(r() * (i + 1)); const t = perm[i]; perm[i] = perm[j]; perm[j] = t; }
  for (let i = 0; i < 256; i++) perm[i + 256] = perm[i];
  const h = (x, y, z) => vals[perm[perm[perm[x & 255] + (y & 255)] + (z & 255)]];
  const sm = (t) => t * t * (3 - 2 * t);
  return function (x, y, z) {
    const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
    const xf = sm(x - xi), yf = sm(y - yi), zf = sm(z - zi);
    const a = h(xi, yi, zi), b = h(xi + 1, yi, zi), c = h(xi, yi + 1, zi), d = h(xi + 1, yi + 1, zi);
    const e = h(xi, yi, zi + 1), f = h(xi + 1, yi, zi + 1), g = h(xi, yi + 1, zi + 1), k = h(xi + 1, yi + 1, zi + 1);
    const x1 = a + (b - a) * xf, x2 = c + (d - c) * xf, x3 = e + (f - e) * xf, x4 = g + (k - g) * xf;
    const y1 = x1 + (x2 - x1) * yf, y2 = x3 + (x4 - x3) * yf;
    return y1 + (y2 - y1) * zf;
  };
}
function fbm(n, x, y, z, oct, lac = 2.03, gain = 0.5) {
  let s = 0, a = 0.5, f = 1, norm = 0;
  for (let i = 0; i < oct; i++) { s += a * n(x * f + i * 17.3, y * f + i * 5.1, z * f + i * 11.7); norm += a; a *= gain; f *= lac; }
  return s / norm;
}
function hexToRgb(h) { const v = parseInt(h.slice(1), 16); return [(v >> 16) & 255, (v >> 8) & 255, v & 255]; }
function palette(stops) {
  const lut = new Uint8Array(256 * 3);
  const st = stops.map(([p, c]) => [p, hexToRgb(c)]);
  for (let i = 0; i < 256; i++) {
    const t = i / 255;
    let k = 0; while (k < st.length - 2 && t > st[k + 1][0]) k++;
    const [p0, c0] = st[k], [p1, c1] = st[Math.min(k + 1, st.length - 1)];
    const u = p1 > p0 ? Math.min(1, Math.max(0, (t - p0) / (p1 - p0))) : 0;
    for (let j = 0; j < 3; j++) lut[i * 3 + j] = c0[j] + (c1[j] - c0[j]) * u;
  }
  return lut;
}

function planet(o) {
  const W = o.w, H = o.h, n = makeNoise(o.seed), n2 = makeNoise(o.seed + 7), lut = palette(o.pal);
  const color = new Uint8ClampedArray(W * H * 4), night = new Uint8ClampedArray(W * H * 4);
  const cW = W / 2, cH = H / 2, clouds = new Uint8ClampedArray(cW * cH * 4);
  const scale = o.scale || 2.2, sea = o.sea || 0.47, iceCaps = o.ice;
  for (let y = 0; y < H; y++) {
    const lat = (y / (H - 1) - 0.5) * Math.PI, cl = Math.cos(lat), sl = Math.sin(lat);
    for (let x = 0; x < W; x++) {
      const lon = (x / W) * Math.PI * 2, px = cl * Math.cos(lon), pz = cl * Math.sin(lon), py = sl;
      const warp = fbm(n2, px * 1.5, py * 1.5, pz * 1.5, 3) - 0.5;
      let h = fbm(n, px * scale + warp, py * scale + warp, pz * scale + warp, 6);
      h = Math.min(1, Math.max(0, (h - 0.5) * 1.9 + 0.5));
      let idx = Math.floor(h * 255);
      const i4 = (y * W + x) * 4;
      let r = lut[idx * 3], g = lut[idx * 3 + 1], b = lut[idx * 3 + 2];
      // ice caps
      const pol = Math.abs(sl);
      if (iceCaps && pol > 0.82 - (fbm(n2, px * 4, py * 4, pz * 4, 2) - 0.5) * 0.2) { r = 235; g = 240; b = 250; }
      // fine detail
      const d = (fbm(n2, px * 18, py * 18, pz * 18, 2) - 0.5) * 30;
      color[i4] = r + d; color[i4 + 1] = g + d; color[i4 + 2] = b + d; color[i4 + 3] = 255;
      // night lights on land (cities) or glowing lava
      let L = 0;
      if (o.lights && h > sea + 0.03 && h < 0.8) { const c = fbm(n2, px * 40, py * 40, pz * 40, 2); if (c > 0.62) L = (c - 0.62) * 900 * o.lights; }
      if (o.lava && h < 0.25) L = (0.25 - h) * 1000;
      night[i4] = o.lava ? Math.min(255, L) : Math.min(255, L); night[i4 + 1] = o.lava ? Math.min(255, L * 0.35) : Math.min(255, L * 0.8); night[i4 + 2] = o.lava ? 0 : Math.min(255, L * 0.45); night[i4 + 3] = 255;
    }
  }
  if (o.clouds > 0) {
    const n3 = makeNoise(o.seed + 99);
    for (let y = 0; y < cH; y++) {
      const lat = (y / (cH - 1) - 0.5) * Math.PI, cl = Math.cos(lat), sl = Math.sin(lat);
      for (let x = 0; x < cW; x++) {
        const lon = (x / cW) * Math.PI * 2, px = cl * Math.cos(lon), pz = cl * Math.sin(lon), py = sl * 2.2;
        const w = fbm(n2, px * 2, py * 2, pz * 2, 3) * 1.5;
        const c = fbm(n3, px * 3 + w, py * 3 + w, pz * 3 + w, 5);
        const a = Math.max(0, Math.min(1, (c - (1 - o.clouds * 0.62)) * 3.2));
        const i4 = (y * cW + x) * 4;
        clouds[i4] = clouds[i4 + 1] = clouds[i4 + 2] = 255; clouds[i4 + 3] = a * 255;
      }
    }
  }
  return { color, night, clouds, w: W, h: H, cw: cW, ch: cH };
}

function nebula(o) {
  const W = o.w, H = o.h, n = makeNoise(o.seed), n2 = makeNoise(o.seed + 3), out = new Uint8ClampedArray(W * H * 4);
  const [c1, c2] = [hexToRgb(o.c1), hexToRgb(o.c2)];
  for (let y = 0; y < H; y++) {
    const lat = (y / (H - 1) - 0.5) * Math.PI, cl = Math.cos(lat), sl = Math.sin(lat);
    for (let x = 0; x < W; x++) {
      const lon = (x / W) * Math.PI * 2, px = cl * Math.cos(lon), pz = cl * Math.sin(lon), py = sl;
      const w = fbm(n2, px * 2, py * 2, pz * 2, 3);
      const v = fbm(n, px * 2.5 + w, py * 2.5 + w, pz * 2.5 + w, 6);
      const band = Math.exp(-Math.pow((py + (w - 0.5) * 0.6) * 2.6, 2)); // a milky band
      const a = Math.max(0, v - 0.47) * 1.6 * (0.25 + band);
      const m = fbm(n2, px * 5, py * 5, pz * 5, 3);
      const i4 = (y * W + x) * 4;
      out[i4] = (c1[0] * (1 - m) + c2[0] * m) * a; out[i4 + 1] = (c1[1] * (1 - m) + c2[1] * m) * a; out[i4 + 2] = (c1[2] * (1 - m) + c2[2] * m) * a; out[i4 + 3] = 255;
    }
  }
  return { sky: out, w: W, h: H };
}

self.onmessage = (e) => {
  const o = e.data;
  if (o.kind === "planet") { const r = planet(o); self.postMessage({ id: o.id, kind: "planet", ...r }, [r.color.buffer, r.night.buffer, r.clouds.buffer]); }
  else if (o.kind === "nebula") { const r = nebula(o); self.postMessage({ id: o.id, kind: "nebula", ...r }, [r.sky.buffer]); }
};
`;var{U:Xr}=window.XA,m0=45e4;function hp(n,e,t,i){return new mt({uniforms:{color:{value:new be(n)},sunDir:{value:new M(1,0,0)},power:{value:e},strength:{value:t}},vertexShader:`
      #include <common>
      #include <logdepthbuf_pars_vertex>
      varying vec3 vN; varying vec3 vV; varying vec3 vWN;
      void main() {
        vN = normalize(normalMatrix * normal);
        vWN = normalize(mat3(modelMatrix) * normal);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vV = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
        #include <logdepthbuf_vertex>
      }`,fragmentShader:`
      #include <logdepthbuf_pars_fragment>
      uniform vec3 color; uniform vec3 sunDir; uniform float power; uniform float strength;
      varying vec3 vN; varying vec3 vV; varying vec3 vWN;
      void main() {
        #include <logdepthbuf_fragment>
        float f = 1.0 - abs(dot(vN, vV));
        float rim = pow(f, power) * strength;
        float lit = 0.12 + 0.88 * smoothstep(-0.25, 0.6, dot(vWN, sunDir));
        gl_FragColor = vec4(color * rim * lit, rim * lit);
      }`,side:i,transparent:!0,blending:Pi,depthWrite:!1})}function g0(){return new mt({uniforms:{t:{value:0},amp:{value:0},col:{value:new be(6332671)}},vertexShader:`
      #include <common>
      #include <logdepthbuf_pars_vertex>
      varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      #include <logdepthbuf_vertex>
      }`,fragmentShader:`
      #include <logdepthbuf_pars_fragment>
      uniform float t; uniform float amp; uniform vec3 col; varying vec2 vUv;
      float h(float n) { return fract(sin(n) * 43758.5453); }
      void main() {
        #include <logdepthbuf_fragment>
        float a = floor(vUv.x * 90.0);
        float s = fract(vUv.y * (1.0 + h(a) * 2.0) * 3.0 + t * (1.5 + h(a + 7.0) * 3.0));
        float streak = smoothstep(0.0, 0.05, s) * smoothstep(0.35, 0.05, s) * step(0.35, h(a + 3.0));
        float rings = pow(abs(sin(vUv.y * 40.0 + t * 30.0)), 30.0) * 0.6;
        float fade = smoothstep(0.0, 0.25, vUv.y) * smoothstep(1.0, 0.6, vUv.y);
        vec3 c = mix(col, vec3(1.0), streak * 0.6) * (streak + rings * 0.5 + 0.08);
        gl_FragColor = vec4(c * amp * fade, 1.0);
      }`,side:Mt,transparent:!0,blending:Pi,depthWrite:!1,depthTest:!1})}var Ho=class{constructor(e){let t=this.renderer=new so({canvas:e,antialias:!0,logarithmicDepthBuffer:!0,powerPreference:"high-performance"});t.toneMapping=Ns,t.toneMappingExposure=1.05,t.outputColorSpace=Vt,this.scene=new vn;let i=new Lr(t);this.scene.environment=i.fromScene(new Do,.04).texture,this.scene.environmentIntensity=.45,this.camera=new It(70,16/9,.5,4e6),this.scene.add(this.camera),this.sun=new qn(16777215,2.7),this.scene.add(this.sun,this.sun.target),this.stationLight=new jn(10535167,0,7e3,1),this.scene.add(this.stationLight),this.ambient=new Br(4871280,.8),this.scene.add(this.ambient),this.composer=new Io(t),this.composer.addPass(new Lo(this.scene,this.camera)),this.bloom=new Hr(new re(512,512),.75,.5,.92),this.composer.addPass(this.bloom),this.composer.addPass(new Uo),this.sysGroup=new Zt,this.scene.add(this.sysGroup),this.skyGroup=new Zt,this.scene.add(this.skyGroup),this.fx=[],this.beams=[],this.jobs=new Map,this.jobId=0;let r=s=>{let a=this.jobs.get(s.data.id);a&&(this.jobs.delete(s.data.id),a(s.data))};try{this.worker=new Worker(URL.createObjectURL(new Blob([Xh],{type:"text/javascript"}))),this.worker.onmessage=r,this.worker.onerror=()=>this.useLocalPainter(r)}catch{this.useLocalPainter(r)}this.makeStars(),this.makeDust(),this.makeTunnel(),this.shake=0,this.flashLights=[];for(let s=0;s<3;s++){let a=new jn(16752720,0,1,1.5);a.userData.busy=!1,this.scene.add(a),this.flashLights.push(a)}this.quality=XA.Store.get("quality",1)}useLocalPainter(e){if(this.local)return;let t={postMessage:i=>setTimeout(()=>e({data:i}),0)};new Function("self",Xh)(t),this.local=t,this.worker={postMessage:i=>setTimeout(()=>t.onmessage({data:i}),0)};for(let i of this.jobs.values())i.msg&&this.worker.postMessage(i.msg)}job(e){return new Promise(t=>{let i=++this.jobId,r=Object.assign({id:i},e);t.msg=r,this.jobs.set(i,t),this.worker.postMessage(r)})}resize(e,t,i){this.renderer.setPixelRatio(i),this.renderer.setSize(e,t,!1),this.composer.setPixelRatio(i),this.composer.setSize(e,t),this.camera.aspect=e/t,this.camera.updateProjectionMatrix()}makeStars(){let e=Xr.rng(42);for(let[t,i]of[[5e3,1.6],[1200,2.6],[220,4]]){let r=new Float32Array(t*3),s=new Float32Array(t*3);for(let l=0;l<t;l++){let c=new M(e()*2-1,e()*2-1,e()*2-1).normalize().multiplyScalar(14e5);e()<.5&&(c.y*=.35),c.normalize().multiplyScalar(14e5),r.set([c.x,c.y,c.z],l*3);let h=e(),u=h<.2?[1,.75,.6]:h<.4?[.7,.8,1]:[1,1,1],d=.5+e()*.5;s.set([u[0]*d,u[1]*d,u[2]*d],l*3)}let a=new Je;a.setAttribute("position",new St(r,3)),a.setAttribute("color",new St(s,3));let o=new ws(a,new Dr({size:i,sizeAttenuation:!1,vertexColors:!0,depthWrite:!1}));o.renderOrder=-9,o.frustumCulled=!1,this.skyGroup.add(o)}this.nebula=new pe(new yi(15e5,48,24),new Lt({color:16777215,side:Mt,depthWrite:!1,transparent:!0,opacity:1})),this.nebula.renderOrder=-10,this.nebula.frustumCulled=!1,this.skyGroup.add(this.nebula)}makeDust(){this.dustPts=new Float32Array(500*3);for(let i=0;i<500*3;i++)this.dustPts[i]=(Math.random()-.5)*1600;let t=new Je;this.dustPos=new Float32Array(500*6),t.setAttribute("position",new St(this.dustPos,3)),this.dust=new uo(t,new bs({color:10137808,transparent:!0,opacity:.55,blending:Pi,depthWrite:!1})),this.dust.frustumCulled=!1,this.scene.add(this.dust)}updateDust(e,t){let i=this.dustPts.length/3,r=800,s=t.length(),a=Math.min(.06,40/Math.max(1,s)),o=t.clone().multiplyScalar(-a*Math.min(1,s/100)-.002);for(let l=0;l<i;l++){let c=this.dustPts[l*3],h=this.dustPts[l*3+1],u=this.dustPts[l*3+2];c=((c-e.x+r)%(2*r)+2*r)%(2*r)-r+e.x,h=((h-e.y+r)%(2*r)+2*r)%(2*r)-r+e.y,u=((u-e.z+r)%(2*r)+2*r)%(2*r)-r+e.z,this.dustPts[l*3]=c,this.dustPts[l*3+1]=h,this.dustPts[l*3+2]=u,this.dustPos.set([c,h,u,c+o.x-.5,h+o.y,u+o.z],l*6)}this.dust.geometry.attributes.position.needsUpdate=!0,this.dust.material.opacity=Xr.clamp(s/150,.15,.6)}makeTunnel(){this.tunnel=new pe(new Wt(70,70,6e3,48,1,!0),g0()),this.tunnel.rotation.x=Math.PI/2,this.tunnel.position.z=-1500,this.tunnel.visible=!1,this.tunnel.renderOrder=50,this.camera.add(this.tunnel)}setTunnel(e,t,i){let r=this.tunnel.material.uniforms;r.amp.value=e,r.t.value=t,i&&r.col.value.set(i),this.tunnel.visible=e>.01}clearSystem(){for(let e of[...this.sysGroup.children])this.sysGroup.remove(e),e.traverse(t=>{t.geometry&&t.geometry.dispose()});this.sys=null,this.planet=null,this.station=null}async buildSystem(e,t={}){this.clearSystem();let i=Xr.rng(e.seed),r=zs[e.ptype],s=e.radius*2.5,a=new M(i()*2-1,(i()-.5)*.6,i()*2-1).normalize(),o={sys:e,R:s,sunDir:a,sunPos:a.clone().multiplyScalar(m0),planetPos:new M(0,0,0)};this.sys=o;let l=t.lowres?.5:1,[c,h]=await Promise.all([this.job({kind:"planet",seed:e.seed,w:1024*l,h:512*l,pal:r.pal,clouds:r.clouds,ice:e.ptype==="terran"||e.ptype==="ocean"||e.ptype==="jungle",lights:e.econ<=3&&r.clouds>0?1.4-e.econ*.3:0,lava:!!r.glow,sea:.47}),this.job({kind:"nebula",seed:e.seed+5,w:1024*l,h:512*l,c1:up(e.nebula[0],.7,.45),c2:up(e.nebula[1],.6,.35)})]);if(this.sys!==o)return o;let u=(V,F,X)=>{let H=new Ss(V,F,X,oi);return H.colorSpace=Vt,H.wrapS=Hn,H.flipY=!1,H.needsUpdate=!0,H.generateMipmaps=!0,H.minFilter=pn,H.magFilter=mi,H.anisotropy=8,H},d=u(c.color,c.w,c.h),p=u(c.night,c.w,c.h),m=new yi(s,128,64);dp(m);let x=new pe(m,new Dt({map:d,bumpMap:d,bumpScale:2.5,roughness:.85,metalness:0,emissiveMap:p,emissive:16777215,emissiveIntensity:r.glow?1.4:.9,envMapIntensity:0}));if(x.rotation.z=.3,this.sysGroup.add(x),o.planet=x,r.clouds>0){let V=u(c.clouds,c.cw,c.ch),F=new yi(s*1.012,96,48);dp(F);let X=new pe(F,new Dt({map:V,transparent:!0,depthWrite:!1,roughness:1,metalness:0,envMapIntensity:0}));X.rotation.z=.3,this.sysGroup.add(X),o.clouds=X}o.atmo=[hp(r.atmo,3,1.3,zi),hp(r.atmo,2,1.6,Mt)];let g=new pe(new yi(s*1.02,96,48),o.atmo[0]),f=new pe(new yi(s*1.12,96,48),o.atmo[1]);o.atmo[1].fragmentShader=o.atmo[1].fragmentShader.replace("float f = 1.0 - abs(dot(vN, vV));","float f = abs(dot(vN, vV)); f = smoothstep(0.0, 1.0, f) * (1.0 - smoothstep(0.55, 1.0, f));"),this.sysGroup.add(g,f);for(let V of o.atmo)V.uniforms.sunDir.value.copy(a);if(e.rings&&e.ptype!=="terran"){let V=new Or(s*1.45,s*2.4,160,1),F=V.attributes.position,X=V.attributes.uv;for(let se=0;se<F.count;se++){let le=Math.hypot(F.getX(se),F.getY(se));X.setXY(se,(le-s*1.45)/(s*.95),.5)}let H=document.createElement("canvas");H.width=512,H.height=4;let Y=H.getContext("2d"),k=Xr.rng(e.seed+3);for(let se=0;se<512;se++){let le=(.2+k()*.6)*(.5+.5*Math.sin(se*.07+k()));Y.fillStyle=`rgba(${200+k()*50},${180+k()*50},${150+k()*60},${le})`,Y.fillRect(se,0,1,4)}let ie=new yn(H);ie.colorSpace=Vt;let J=new pe(V,new Dt({map:ie,transparent:!0,side:xh,depthWrite:!1,roughness:1,envMapIntensity:0}));J.rotation.x=Math.PI/2-.35,J.rotation.y=.2,this.sysGroup.add(J),o.ring=J}o.moons=[];for(let V=0;V<e.moons;V++){let F=s*(.12+i()*.15),X=new xn(F,5),H=X.attributes.position,Y=new M;for(let se=0;se<H.count;se++){Y.fromBufferAttribute(H,se);let le=Y.clone().normalize(),$=1+(Xr.hash(Math.floor((le.x+2)*30)+Math.floor((le.y+2)*30)*97+Math.floor((le.z+2)*30)*9311,V)-.5)*.03;Y.multiplyScalar($),H.setXYZ(se,Y.x,Y.y,Y.z)}X.computeVertexNormals();let k=new pe(X,new Dt({color:new be().setHSL(i()*.15,.1,.5),roughness:1,flatShading:!1,envMapIntensity:0})),ie=i()*Math.PI*2,J=s*(3+i()*3);k.position.set(Math.cos(ie)*J,(i()-.5)*s,Math.sin(ie)*J),this.sysGroup.add(k),o.moons.push({mesh:k,r:F})}let y=new be(e.star.color),v=26e3*e.star.size,_=new pe(new yi(v,48,24),new Lt({color:y.clone().multiplyScalar(2.2),toneMapped:!1}));_.position.copy(o.sunPos),this.sysGroup.add(_);let E=ii(y,v*3.6,.7),T=ii(y,v*11,.1);E.position.copy(o.sunPos),T.position.copy(o.sunPos),E.material.toneMapped=!1,this.sysGroup.add(E,T),o.sunR=v,o.sunMesh=_,this.sun.color.copy(y).lerp(new be(1,1,1),.5),this.sun.position.copy(a.clone().multiplyScalar(1e3)),this.sun.target.position.set(0,0,0);let A=a.clone().add(new M(i()-.5,(i()-.5)*.6,i()-.5)).normalize(),B=tp(e.seed);B.position.copy(A.clone().multiplyScalar(s*1.7));let U=new Gt().setFromUnitVectors(new M(0,0,1),A);B.quaternion.copy(U),this.sysGroup.add(B),o.station=B,o.stationAxis=A.clone(),o.stationSpin=0,this.stationLight.position.copy(B.position).add(A.clone().multiplyScalar(700)),this.stationLight.intensity=2;let W=u(h.sky,h.w,h.h);return this.nebula.material.map=W,this.nebula.material.needsUpdate=!0,o}update(e,t){let i=this.sys;if(this.skyGroup.position.copy(this.camera.getWorldPosition(new M)),i&&i.planet){i.clouds&&(i.clouds.rotation.y+=e*.004),i.planet.rotation.y+=e*.0015,i.stationSpin+=e*.25;let r=i.station;r.quaternion.setFromUnitVectors(new M(0,0,1),i.stationAxis),r.rotateZ(i.stationSpin),r.userData.beacon.material.opacity=Math.sin(t*4)>.3?1:.1,r.userData.slotLights.forEach((s,a)=>{s.material.opacity=.4+.6*(Math.sin(t*6-a)>0?1:0)})}for(let r of this.beams)r.life-=e,r.mesh.material.opacity=Math.max(0,r.life/r.max),r.flash&&(r.flash.material.opacity=r.mesh.material.opacity);this.beams=this.beams.filter(r=>r.life<=0?(this.scene.remove(r.mesh),r.flash&&this.scene.remove(r.flash),r.mesh.geometry.dispose(),!1):!0);for(let r of this.fx)r.update(e);this.fx=this.fx.filter(r=>r.dead?(r.dispose(this.scene),!1):!0)}render(){this.composer.render()}beam(e,t,i,r=1.4,s=.09,a=!0){let o=t.clone().sub(e),l=o.length(),c=new Wt(r,r*.6,l,6,1,!0);c.translate(0,l/2,0),c.rotateX(Math.PI/2);let h=new pe(c,new Lt({color:new be(i).multiplyScalar(3),transparent:!0,blending:Pi,depthWrite:!1,toneMapped:!1}));h.position.copy(e),h.lookAt(t),this.scene.add(h);let u={mesh:h,life:s,max:s};a&&(u.flash=ii(i,r*30,1),u.flash.position.copy(t),this.scene.add(u.flash)),this.beams.push(u)}explode(e,t,i={}){let r=new Vo(this,e,t,i);return this.fx.push(r),this.shake=Math.max(this.shake,i.shake||0),r}spark(e,t,i=20){let r=new Vo(this,e,i,{small:!0,color:t});this.fx.push(r)}};function up(n,e,t){return"#"+new be().setHSL(n,e,t).getHexString()}function dp(n){let e=n.attributes.uv;for(let t=0;t<e.count;t++)e.setY(t,1-e.getY(t))}var zo=null;function v0(){if(zo)return zo;let n=document.createElement("canvas");n.width=n.height=128;let e=n.getContext("2d");for(let t=0;t<30;t++){let i=64+(Math.random()-.5)*50,r=64+(Math.random()-.5)*50,s=15+Math.random()*30,a=e.createRadialGradient(i,r,0,i,r,s);a.addColorStop(0,"rgba(255,255,255,0.25)"),a.addColorStop(1,"rgba(255,255,255,0)"),e.fillStyle=a,e.fillRect(0,0,128,128)}return zo=new yn(n),zo}var Vo=class{constructor(e,t,i,r){this.world=e,this.t=0,this.dead=!1,this.parts=[],this.size=i;let s=e.scene,a=r.small,o=h=>(s.add(h),h),l=a?5:Math.min(60,14+Math.floor(i/6)),c=r.color?[r.color]:[16765056,16748592,16734752,16769184];for(let h=0;h<l;h++){let u=ii(Xr.pick(c),1,1),p=new M(Math.random()-.5,Math.random()-.5,Math.random()-.5).normalize().multiplyScalar(i*(.4+Math.random()*1.6)*(a?1.5:1));u.position.copy(t),o(u),this.parts.push({o:u,v:p,grow:i*(1.2+Math.random()*2.2),life:(a?.35:.9)+Math.random()*(a?.2:1.1),delay:a?0:Math.random()*.25,kind:"fire"})}if(a)this.max=.7;else{let h=ii(16777215,1,1);h.material.toneMapped=!1,h.position.copy(t),o(h),this.parts.push({o:h,v:new M,grow:i*9,life:.45,delay:0,kind:"flash"});for(let f=0;f<Math.min(24,6+i/10);f++){let y=new Gn({map:v0(),color:3156520,transparent:!0,opacity:0,depthWrite:!1}),v=new Ur(y);v.position.copy(t),o(v);let _=new M(Math.random()-.5,Math.random()-.5,Math.random()-.5).normalize().multiplyScalar(i*(.2+Math.random()*.6));this.parts.push({o:v,v:_,grow:i*(2+Math.random()*3),life:2.5+Math.random()*2,delay:.3,kind:"smoke",rot:Math.random()-.5})}let u=Math.floor(Math.min(400,60+i*2)),d=new Float32Array(u*3);this.sparkV=[];for(let f=0;f<u;f++)d.set([t.x,t.y,t.z],f*3),this.sparkV.push(new M(Math.random()-.5,Math.random()-.5,Math.random()-.5).normalize().multiplyScalar(i*(2+Math.random()*7)));let p=new Je;p.setAttribute("position",new St(d,3)),this.sparks=o(new ws(p,new Dr({map:zh(),color:16769184,size:Math.max(3,i*.14),transparent:!0,blending:Pi,depthWrite:!1,toneMapped:!1}))),this.sparks.frustumCulled=!1;let m=o(new pe(new Or(.8,1,64),new Lt({color:10146047,transparent:!0,blending:Pi,side:xh,depthWrite:!1,toneMapped:!1})));m.position.copy(t),m.lookAt(t.clone().add(new M(Math.random()-.5,1,Math.random()-.5))),this.ring=m,this.debris=[];let x=new Dt({color:r.debrisColor||9079440,metalness:.6,roughness:.5,flatShading:!0,emissive:4198400});for(let f=0;f<Math.min(18,3+i/8);f++){let y=o(new pe(new Us(i*(.06+Math.random()*.12)),x));y.position.copy(t);let v=ii(16744496,i*.14,.9);y.add(v),this.debris.push({o:y,v:new M(Math.random()-.5,Math.random()-.5,Math.random()-.5).normalize().multiplyScalar(i*(1+Math.random()*3)),r:new M(Math.random()*6,Math.random()*6,Math.random()*6),ember:v})}let g=e.flashLights.find(f=>!f.userData.busy);g&&(g.userData.busy=!0,g.distance=i*40,g.position.copy(t),g.intensity=60,this.light=g),this.max=5}}update(e){this.t+=e;let t=this.t;for(let i of this.parts){let r=(t-i.delay)/i.life;if(r<0){i.o.visible=!1;continue}if(i.o.visible=r<1,!(r>=1)){if(i.o.position.addScaledVector(i.v,e),i.v.multiplyScalar(1-e*1.2),i.kind==="fire"){let s=i.grow*(.3+Math.sqrt(r));i.o.scale.set(s,s,1),i.o.material.opacity=(1-r)*(1-r),i.o.material.color.lerp(new be(16723984),e*1.5)}else if(i.kind==="flash"){let s=i.grow*Math.sqrt(r);i.o.scale.set(s,s,1),i.o.material.opacity=1-r}else if(i.kind==="smoke"){let s=i.grow*(.4+r);i.o.scale.set(s,s,1),i.o.material.opacity=Math.sin(r*Math.PI)*.6,i.o.material.rotation+=i.rot*e}}}if(this.sparks){let i=this.sparks.geometry.attributes.position;for(let r=0;r<this.sparkV.length;r++){let s=this.sparkV[r];i.setXYZ(r,i.getX(r)+s.x*e,i.getY(r)+s.y*e,i.getZ(r)+s.z*e),s.multiplyScalar(1-e*.6)}i.needsUpdate=!0,this.sparks.material.opacity=Math.max(0,1-t/1.8)}if(this.ring){let i=this.size*(1+t*14);this.ring.scale.set(i,i,i),this.ring.material.opacity=Math.max(0,.9-t*.9)}if(this.debris)for(let i of this.debris)i.o.position.addScaledVector(i.v,e),i.o.rotation.x+=i.r.x*e,i.o.rotation.y+=i.r.y*e,i.ember.material.opacity=Math.max(0,1-t/1.8);this.light&&(this.light.intensity=Math.max(0,60*(1-t/1.2))),t>this.max&&(this.dead=!0)}dispose(e){for(let t of this.parts)e.remove(t.o),t.o.material.dispose();if(this.sparks&&(e.remove(this.sparks),this.sparks.geometry.dispose()),this.ring&&(e.remove(this.ring),this.ring.geometry.dispose()),this.debris)for(let t of this.debris)e.remove(t.o),t.o.geometry.dispose();this.light&&(this.light.intensity=0,this.light.userData.busy=!1)}};var Yh={};mu(Yh,{G:()=>K,HS:()=>sn,addScore:()=>Gs,buy:()=>jh,canPay:()=>Vs,cargoCap:()=>jr,cargoFree:()=>qr,cargoUsed:()=>$n,earn:()=>Zr,enterMarket:()=>Ws,fuelMax:()=>Xt,hasSave:()=>Ys,illegalCargo:()=>Xs,load:()=>qs,msg:()=>xe,newCommander:()=>Go,pay:()=>Yr,save:()=>Di,sell:()=>qh,shipDef:()=>Qt,shipValue:()=>js,startSystem:()=>pp,sys:()=>it});var{U:Nv,Store:Hs}=window.XA,K=window.XA.G={cheat:!1,cmdr:null,market:null,msgs:[],state:"boot",playTime:0};function pp(){let n=Kt(0),e=n[0],t=-1e9;for(let i of n){let r=(i.gov>=5?30:0)+i.tech*2-Math.hypot(i.x-512,i.y-256)/20+(i.econ>=2&&i.econ<=5?10:0);r>t&&(t=r,e=i)}return e}function Go(n){let e=pp();return{name:n||"JAMESON",credits:100,gi:0,si:e.i,target:-1,ship:"kestrel",fuel:7,cargo:{},cost:{},equip:{},missiles:3,lasers:{front:"pulse",rear:null},legal:0,killPts:0,kills:0,score:0,visited:[`0:${e.i}`],time:0,trades:0,profit:0,deaths:0,cheated:!1,created:Date.now()}}var it=()=>Kt(K.cmdr.gi)[K.cmdr.si],Qt=()=>hi[K.cmdr.ship],jr=()=>Math.round(Qt().cargo*(K.cmdr.equip.bay?1.5:1)),$n=()=>Object.entries(K.cmdr.cargo).reduce((n,[e,t])=>n+(Jt.find(i=>i.id===e).unit==="t"?t:0),0),qr=()=>jr()-$n(),Xt=()=>Qt().fuel;function Yr(n){return n<=0||K.cheat?!0:K.cmdr.credits+1e-6<n?!1:(K.cmdr.credits=Math.round((K.cmdr.credits-n)*10)/10,!0)}function Vs(n){return K.cheat||K.cmdr.credits+1e-6>=n}function Zr(n){K.cmdr.credits=Math.round((K.cmdr.credits+n)*10)/10}function Gs(n){if(K.cheat){K.cmdr.cheated=!0;return}K.cmdr.score+=Math.round(n)}function Ws(){let n=it(),e=Math.floor(Math.random()*256);K.market={key:`${n.gi}:${n.i}`,list:Gh(n,e)}}function jh(n,e=1){let t=K.cmdr,i=K.market.list[n],r=Jt[n],s=0;for(let a=0;a<e&&!(i.qty<=0||r.unit==="t"&&qr()<=0||!Yr(i.price));a++){let o=t.cargo[r.id]||0;t.cost[r.id]=((t.cost[r.id]||0)*o+i.price)/(o+1),t.cargo[r.id]=o+1,i.qty--,s++}return s}function qh(n,e=1){let t=K.cmdr,i=K.market.list[n],r=Jt[n],s=0;for(let a=0;a<e;a++){let o=t.cargo[r.id]||0;if(o<=0)break;Zr(i.price);let l=i.price-(t.cost[r.id]||i.price*.8);l>0&&Gs(l*2),t.profit+=l,t.cargo[r.id]=o-1,i.qty++,s++,t.cargo[r.id]<=0&&(delete t.cargo[r.id],delete t.cost[r.id])}return s&&t.trades++,s}function Xs(){let n=0;for(let[e,t]of Object.entries(K.cmdr.cargo))n+=Jt.find(i=>i.id===e).legal*t;return n}function js(){let n=K.cmdr,t=(hi[n.ship].price||3e4)*.6;for(let[i,r]of Object.entries(n.equip))r&&(t+=200);return n.lasers.front&&(t+=Ft[n.lasers.front].price*.5),n.lasers.rear&&(t+=Ft[n.lasers.rear].price*.5),Math.round(t)}function xe(n,e="#9ad8ff",t=3.5){K.msgs.push({text:n,color:e,t:0,dur:t}),K.msgs.length>5&&K.msgs.shift()}function Di(n="career"){K.cmdr&&Hs.set("save."+n,K.cmdr)}function qs(n="career"){let e=Hs.get("save."+n,null);return e?(K.cmdr=Object.assign(Go(e.name),e),!0):!1}var Ys=(n="career")=>!!Hs.get("save."+n,null),y0=[["ADA VEX",6e4,"Deadly"],["KORRIGAN",42e3,"Dangerous"],["MIRA SOL",3e4,"Competent"],["T. HAWKE",21e3,"Competent"],["NULL",14e3,"Above Average"],["OLD JO",9e3,"Average"],["BIX",5500,"Average"],["QUILL",3e3,"Poor"],["ROOKIE",1500,"Mostly Harmless"],["DRIFTER",600,"Harmless"]].map(([n,e,t])=>({name:n,score:e,rank:t,date:""})),sn={list(){let n=Hs.get("scores",null);return Array.isArray(n)&&n.length?n:y0.slice()},rank(n){if(n<=0)return-1;let e=sn.list(),t=0;for(;t<e.length&&e[t].score>=n;)t++;return t<10?t:-1},add(n){let e=sn.list();n.date=new Date().toISOString().slice(0,10),e.push(n),e.sort((i,r)=>r.score-i.score);let t=e.slice(0,10);return Hs.set("scores",t),t.indexOf(n)}};var{U:ke}=window.XA,ct=window.XA.Input,Ee=window.XA.Audio,x0=new M(0,0,-1),$r=new M(0,1,0),Vv=new M(1,0,0);var wn=new Ie,Jr=new Gt,Et=new M,Jn=new M,fp=new M,Wo=16e3,mp=5e3,gp=26,_0={jackal:5,raptor:7,warden:7,drone:5,xyrrid:11,kestrel:4,wren:3,mule:4,atlas:5,falcon:8,vanguard:9,seraph:8},Xo=class{constructor(e){this.w=e,this.player=new xt,e.scene.add(this.player),this.ents=[],this.view=0,this.time=0,this.cb={},this.p=null}resetPlayer(){let e=Qt(),t=K.cmdr,i=e.shields*(t.equip.shield?1.5:1);this.p={speed:0,max:e.speed,shF:i,shA:i,shMax:i,energy:e.energy,eMax:e.energy,laserT:0,cabinT:20,alt:1e9,rate:{p:0,r:0,y:0},cool:0,jump:!1,hyper:null,dc:null,lock:null,alive:!0,flash:0,hitDir:0,legalT:0,scoopT:0,overheat:!1,ecmT:0,mouseStick:{x:0,y:0},fireHeld:!1},this.pmesh&&this.player.remove(this.pmesh),this.pmesh=Yn(t.ship),this.pmesh.visible=!1,this.player.add(this.pmesh),this.setView(this.view===4?4:0)}clearEnts(){for(let e of this.ents)this.w.scene.remove(e.mesh);this.ents=[],this.p&&(this.p.lock=null)}begin(e){this.clearEnts();let t=this.w.sys;this.S=t,this.mode="fly",this.encT=ke.rand(20,40),this.dead=null,this.pod=null,this.jumpFx=null,this.w.sysGroup.visible=!0,this.w.skyGroup.visible=!0;let i=this.player;if(i.parent!==this.w.scene&&this.w.scene.add(i),e==="launch"){let r=t.stationAxis;i.position.copy(t.station.position).addScaledVector(r,420),i.quaternion.setFromRotationMatrix(wn.lookAt(new M,r,$r)),this.p.speed=this.p.max*.45,this.launchFx=1.4,Ee.sfx("launch"),this.encounter("police",t.station.position.clone().addScaledVector(r,5e3),1+ke.randi(0,1)),this.encounter("traders",t.station.position.clone().addScaledVector(r,9e3).add(st(4e3)),ke.randi(1,2))}else{let r=e==="misjump",s=t.sunDir.clone().add(st(.8)).normalize(),a=t.R*(r?14:5.5+Math.random()*2);i.position.copy(s.multiplyScalar(a)),i.quaternion.setFromRotationMatrix(wn.lookAt(i.position,t.station.position,$r)),this.p.speed=this.p.max*.5,this.arriveFx=1;let o=i.position.clone().addScaledVector(ht(i),7e3);if(r)this.encounter("aliens",o,1),xe("WARNING: hyperspace malfunction!","#ff6060",5),Ee.playSong("alien");else{let l=it();Math.random()<(.1+(7-l.gov)*.07)*this.threat()&&this.encounter("pirates",o.clone().add(st(3e3)),this.pirateGroup(l)),Math.random()<.45&&this.encounter("traders",i.position.clone().add(st(9e3)),ke.randi(1,2)),Math.random()<.3&&this.encounter("rocks",o.clone().add(st(4e3)),ke.randi(3,6)),K.cmdr.legal>=50&&Math.random()<.5&&this.encounter("hunters",o.clone().add(st(3e3)),ke.randi(1,2))}}this.playSpaceSong()}threat(){let e=K.cmdr;return ke.clamp(.3+e.killPts/60+e.time/5400,.3,1)}pirateGroup(e){let t=e.gov<=1?4:2;return ke.randi(1,Math.max(1,Math.round(t*this.threat())))}playSpaceSong(){if(this.mode!=="fly")return;let e=it();Ee.playSong(e.gov<=1?"outlaw":e.econ<=2?"forge":e.econ>=5?"frontier":"void")}setView(e){this.view=e;let t=this.w.camera,i=Qt();t.parent!==this.player&&this.player.add(t),t.position.set(0,0,0),t.rotation.set(0,0,0),e===1&&(t.rotation.y=Math.PI),e===2&&(t.rotation.y=Math.PI/2),e===3&&(t.rotation.y=-Math.PI/2),e===4&&(t.position.set(0,i.size*.42,i.size*1.9),t.rotation.x=-.12),this.pmesh&&(this.pmesh.visible=e===4),this.camBase=t.position.clone()}spawn(e,t,i={}){let r=hi[e],s=Yn(e);s.position.copy(t),i.quat?s.quaternion.copy(i.quat):s.quaternion.setFromEuler(new li(Math.random()*6,Math.random()*6,Math.random()*6)),this.w.scene.add(s);let a={type:e,def:r,mesh:s,pos:s.position,quat:s.quaternion,role:i.role||r.role,speed:i.speed??r.speed*.6,shields:r.shields,energy:r.energy,eMax:r.energy,r:r.size*.55,state:"cruise",t:0,cool:ke.rand(.5,1.5),skill:i.skill??ke.rand(.3,.9),missiles:r.missiles,target:i.target||null,aggro:null,hostile:!!i.hostile,vel:new M,spin:i.spin||null,good:i.good,qty:i.qty||1,life:i.life||0,flash:0,ecm:i.ecm||!1,dest:null,alive:!0,drift:i.drift||null,owner:i.owner||null,bounty:r.bounty,legalTag:i.legalTag||0,launchT:0};return(a.role==="rock"||a.role==="cargo")&&(a.spin=new M(ke.rand(-.6,.6),ke.rand(-.6,.6),ke.rand(-.6,.6)),a.drift=a.drift||st(r.speed),a.speed=0),this.ents.push(a),a}encounter(e,t,i){let r=[];if(this.ents.filter(l=>l.role!=="rock"&&l.role!=="cargo"&&l.role!=="missile").length>14&&e!=="aliens")return r;let a=this.player.position,o=l=>new Gt().setFromRotationMatrix(wn.lookAt(l,a,$r));for(let l=0;l<i;l++){let c=t.clone().add(st(1200)),h;if(e==="pirates"){let u=Math.random()<.3?"raptor":"jackal",d=this.threat(),p=Object.keys(K.cmdr.cargo).length>0,m=it().gov<=1||Math.random()<(p?.35+.55*d:.6*d);h=this.spawn(u,c,{quat:o(c),role:"pirate",hostile:m,target:m?"player":null,skill:ke.rand(.25,.6)+Math.min(.35,K.cmdr.killPts/600)}),h.ecm=u==="raptor"&&Math.random()<.4}else if(e==="traders"){let u=ke.pick(["kestrel","mule","atlas","wren","mule"]);h=this.spawn(u,c,{role:"trader",skill:ke.rand(.1,.5)}),h.goStation=Math.random()<.6,h.quat.setFromRotationMatrix(wn.lookAt(c,h.goStation?this.S.station.position:c.clone().add(st(1)),$r))}else if(e==="police")h=this.spawn("warden",c,{role:"police",skill:ke.rand(.5,.85),ecm:!0}),K.cmdr.legal>=50&&(h.hostile=!0,h.target="player");else if(e==="hunters")h=this.spawn(ke.pick(["falcon","vanguard","falcon"]),c,{quat:o(c),role:"hunter",skill:ke.rand(.55,.9),hostile:K.cmdr.legal>=50,target:K.cmdr.legal>=50?"player":null});else if(e==="rocks")h=this.spawn(Math.random()<.75?"asteroid":"boulder",t.clone().add(st(2500)),{}),h.mesh.scale.setScalar(ke.rand(.7,1.6)),h.r*=h.mesh.scale.x;else if(e==="aliens"){l===0&&(h=this.spawn("xyrrid",c,{quat:o(c),role:"alien",hostile:!0,target:"player",skill:.6}));for(let u=0;u<3;u++)r.push(this.spawn("drone",c.clone().add(st(800)),{quat:o(c),role:"alien",hostile:!0,target:"player",skill:ke.rand(.4,.7)}))}if(h&&r.push(h),e==="aliens")break}return r}removeEnt(e){e.alive=!1,this.w.scene.remove(e.mesh),this.p&&this.p.lock===e&&(this.p.lock=null)}update(e){this.time+=e;let t=this.p;if(this.mode==="jump"){this.updateHyperTunnel(e);return}if(this.dead){this.updateDead(e),this.updateEnts(e);return}if(this.pod){this.updatePod(e),this.updateEnts(e);return}if(this.controls(e),this.updatePlayer(e),this.updateEnts(e),this.collisions(e),this.spawner(e),this.w.updateDust(this.player.position,ht(this.player).multiplyScalar(t.jump?t.max*3:t.speed)),this.launchFx>0?(this.launchFx-=e,this.w.setTunnel(Math.max(0,this.launchFx/1.4)*1.2,this.time,10146047)):this.arriveFx>0?(this.arriveFx-=e,this.w.setTunnel(Math.max(0,this.arriveFx)*.6,this.time*2,8429823)):t.jump||this.w.setTunnel(0,0),this.pmesh&&this.pmesh.userData.engines)for(let i of this.pmesh.userData.engines)i.material.opacity=.3+.7*(t.speed/t.max);Ee.setEngine(t.speed/t.max,t.jump)}autopilot(e){let t=this.p,i=this.player,r=null,s=12e3;for(let o of this.ents)if(o.alive&&(o.hostile||o.role==="rock")&&o.role!=="missile"){let l=o.pos.distanceTo(i.position);l<s&&(s=l,r=o)}if(t.fireHeld=!1,!r){t.speed=t.max*.5;return}let a=Jn.subVectors(r.pos,i.position).normalize();Jr.setFromRotationMatrix(wn.lookAt(Et.set(0,0,0),a,new M(0,1,0).applyQuaternion(i.quaternion))),i.quaternion.rotateTowards(Jr,2.2*e),t.speed=s>1500?t.max:t.max*.3,t.fireHeld=ht(i).angleTo(a)<.05&&s<5e3,K.cmdr.missiles>0&&s<4e3&&Math.random()<e*.1&&(t.lock=r,this.fireMissile())}controls(e){if(K.autopilot){this.autopilot(e);return}let t=this.p,i=K.cmdr,r=ct.pad,s=ct.mouse,a=0,o=0,l=0;if(ct.held("pitchUp")&&(a+=1),ct.held("pitchDown")&&(a-=1),ct.held("rollL")&&(o-=1),ct.held("rollR")&&(o+=1),ct.held("yawL")&&(l-=1),ct.held("yawR")&&(l+=1),r.connected&&(a+=r.axes[1],o+=r.axes[0],l+=r.axes[2]),ct.lastDevice==="mouse"&&s.inside&&!this.p.dc){let d=s.nx,p=s.ny,m=x=>Math.abs(x)<.05?0:(x-Math.sign(x)*.05)/.95;o+=m(d)*1.2,l+=m(d)*.35,a+=m(p)*1.2}ct.invert&&(a=-a),a=ke.clamp(a,-1,1),o=ke.clamp(o,-1,1),l=ke.clamp(l,-1,1);let c=Math.min(1,e*7);t.rate.p+=(a-t.rate.p)*c,t.rate.r+=(o-t.rate.r)*c,t.rate.y+=(l-t.rate.y)*c;let h=0;ct.held("faster")&&(h+=1),ct.held("slower")&&(h-=1),r.connected&&(h+=(r.values[7]||0)-(r.values[6]||0)),s.wheel&&(t.speed=ke.clamp(t.speed-s.wheel*t.max*.08,0,t.max)),t.speed=ke.clamp(t.speed+h*t.max*.9*e,0,t.max);let u=d=>ct.pressed.has(d);(u("KeyJ")||ct.padHit(3))&&this.toggleJump(),(u("KeyH")||ct.padHit(12))&&this.startHyper(!1),u("KeyG")&&this.startHyper(!0),(u("KeyT")||ct.padHit(2)||s.mclicked)&&this.lockTarget(),(u("KeyM")||ct.padHit(1)||s.rclicked)&&this.fireMissile(),(u("KeyZ")||ct.padHit(4))&&this.ecm(!0),(u("KeyB")||ct.padHit(14))&&this.energyBomb(),(u("KeyL")||ct.padHit(13))&&this.toggleDockComputer(),(u("Delete")||u("End"))&&this.escapePod(),u("Digit1")&&this.setView(0),u("Digit2")&&this.setView(1),u("Digit3")&&this.setView(2),u("Digit4")&&this.setView(3),(u("Digit5")||u("KeyC")||ct.padHit(5))&&this.setView(this.view===4?0:4),ct.padHit(15)&&this.setView(this.view===1?0:1),t.fireHeld=ct.held("fire")||r.connected&&r.buttons[0]||ct.lastDevice==="mouse"&&(s.buttons&1)===1}updatePlayer(e){let t=this.p,i=K.cmdr,r=Qt(),s=this.player,a=this.S;t.dc?this.dockComputer(e):(s.rotateX(t.rate.p*r.pitch*e),s.rotateZ(-t.rate.r*r.roll*e),s.rotateY(-t.rate.y*r.pitch*.5*e));let o=ht(s),l=t.jump?t.max*gp:t.speed;s.position.addScaledVector(o,l*e),t.jump&&this.massLocked()&&(t.jump=!1,Ee.sfx("jumpOff"),xe("Mass locked","#ffd060")),t.jump&&this.w.setTunnel(.25,this.time*.5,6324479);let c=i.equip.energy?2:1;t.energy=Math.min(t.eMax,t.energy+t.eMax*.025*c*e);for(let d of["shF","shA"])if(t[d]<t.shMax&&t.energy>t.eMax*.15){let p=Math.min(t.shMax-t[d],t.shMax*.06*c*e);t[d]+=p,t.energy-=p*.35}t.laserT=Math.max(0,t.laserT-e*14),t.overheat&&t.laserT<60&&(t.overheat=!1);let h=s.position.distanceTo(a.sunPos)-a.sunR,u=ke.clamp(1-h/(a.sunR*3),0,1);if(t.cabinT+=(20+u*260-t.cabinT)*Math.min(1,e*.8),t.cabinT>100&&(this.hurt((t.cabinT-100)*.3*e,null,!0),Math.random()<e*2&&xe("Cabin temperature critical!","#ff6060")),i.equip.scoop&&u>.55&&t.speed>t.max*.4&&i.fuel<Xt()&&(i.fuel=Math.min(Xt(),i.fuel+e*.25),t.scoopT+=e,t.scoopT>.4&&(t.scoopT=0,Ee.sfx("fuel")),Math.random()<e&&xe("Fuel scooping","#ffd060",1.5)),t.alt=s.position.length()-a.R,t.alt<0&&this.crash("planet"),h<0&&this.crash("sun"),t.cool-=e,t.fireHeld&&!t.dc&&this.firePlayerLaser(),t.flash=Math.max(0,t.flash-e*2.5),t.hyper&&(t.hyper.t-=e,Math.floor(t.hyper.t+e)!==Math.floor(t.hyper.t)&&t.hyper.t>0&&Ee.sfx("beep"),t.hyper.t<=0&&this.doHyper()),t.legalT=Math.max(0,t.legalT-e),t.ecmT=Math.max(0,t.ecmT-e),this.w.shake>0){let d=this.w.shake;this.w.shake=Math.max(0,d-e*30),this.w.camera.position.copy(this.camBase).add(new M((Math.random()-.5)*d*.3,(Math.random()-.5)*d*.3,0))}else this.camBase&&this.w.camera.position.copy(this.camBase)}massLocked(){let e=this.player.position;for(let t of this.ents)if(t.alive&&t.role!=="rock"&&t.role!=="cargo"&&t.role!=="missile"&&t.pos.distanceTo(e)<mp)return!0;return e.distanceTo(this.S.station.position)<6e3||e.length()<this.S.R*1.25||e.distanceTo(this.S.sunPos)<this.S.sunR*2}toggleJump(){let e=this.p;if(e.jump){e.jump=!1,Ee.sfx("jumpOff");return}if(this.massLocked()){xe("Mass locked \u2013 jump drive unavailable","#ffd060"),Ee.sfx("deny");return}e.jump=!0,Ee.sfx("jumpOn"),this.jumpEncT=3}firePlayerLaser(){let e=this.p,t=K.cmdr,i=this.view===1,r=i?t.lasers.rear:t.lasers.front;if(!r||this.view===2||this.view===3||e.cool>0||e.overheat||e.energy<4)return;let s=Ft[r];e.cool=s.cool,e.laserT+=s.heat,e.energy-=.6,e.laserT>=100&&(e.overheat=!0,xe("Laser overheated","#ff9040",2)),Ee.sfx(s.snd);let a=this.player,o=i?ht(a).negate():ht(a),l=a.position.clone(),c=this.rayHit(l,o,7e3,null),h=c?c.point:l.clone().addScaledVector(o,7e3),u=new M(1,0,0).applyQuaternion(a.quaternion),d=new M(0,-1,0).applyQuaternion(a.quaternion);for(let p of[-1,1])this.w.beam(l.clone().addScaledVector(u,p*9).addScaledVector(d,5).addScaledVector(o,6),h,s.color,1.2,.08,!!c);c&&c.ent?this.damageEnt(c.ent,s.dmg*(.85+Math.random()*.3),"player",s):c&&c.station&&this.stationHit()}rayHit(e,t,i,r){let s=null,a=i;for(let c of this.ents){if(!c.alive||c===r)continue;Et.subVectors(c.pos,e);let h=Et.dot(t);if(h<0||h>a)continue;let u=Et.lengthSq()-h*h;u<c.r*c.r&&(a=h,s={ent:c,point:e.clone().addScaledVector(t,Math.max(0,h-Math.sqrt(Math.max(0,c.r*c.r-u))))})}let o=this.S.station.position;Et.subVectors(o,e);let l=Et.dot(t);return l>0&&l<a&&Et.lengthSq()-l*l<300*300?{station:!0,point:e.clone().addScaledVector(t,l-250)}:s}lockTarget(){let e=this.player,t=this.view===1?ht(e).negate():ht(e),i=null,r=.35;for(let s of this.ents){if(!s.alive||s.role==="cargo"||s.role==="missile"||(Et.subVectors(s.pos,e.position),Et.length()>Wo))continue;let o=Et.normalize().angleTo(t);o<r&&(r=o,i=s)}if(!i){let s=this.ents.filter(o=>o.alive&&o.role!=="cargo"&&o.role!=="missile"&&o.pos.distanceTo(e.position)<Wo).sort((o,l)=>o.pos.distanceTo(e.position)-l.pos.distanceTo(e.position));if(!s.length){xe("No target","#9ad8ff",1.5);return}let a=s.indexOf(this.p.lock);i=s[(a+1)%s.length]}this.p.lock=i,Ee.sfx("lock"),xe(`Target: ${i.def.name}`,"#ffd060",2)}fireMissile(){let e=K.cmdr,t=this.p;if(e.missiles<=0){xe("No missiles left","#ff9040",2),Ee.sfx("deny");return}if((!t.lock||!t.lock.alive)&&(this.lockTarget(),!t.lock))return;e.missiles--;let i=this.player,r=i.position.clone().addScaledVector(new M(0,-1,0).applyQuaternion(i.quaternion),10).addScaledVector(ht(i),30),s=this.spawn("missile",r,{quat:i.quaternion.clone(),role:"missile",speed:Math.max(t.speed,300),target:t.lock,owner:"player",life:16});return Ee.sfx("missile"),xe("Missile launched","#ffd060",2),t.lock.role!=="pirate"&&t.lock.role!=="alien"&&t.lock.role!=="rock"&&(t.lock.aggro="player"),s}npcMissile(e,t){if(e.missiles<=0)return;e.missiles--;let i=ht(e.mesh);this.spawn("missile",e.pos.clone().addScaledVector(i,e.r+15),{quat:e.quat.clone(),role:"missile",speed:e.speed+100,target:t,owner:e,life:14}),Ee.sfx("missile"),t==="player"&&(xe("INCOMING MISSILE!","#ff4040",4),Ee.sfx("alarm"))}ecm(e){if(e){if(!K.cmdr.equip.ecm){xe("No E.C.M. system fitted","#ff9040",2),Ee.sfx("deny");return}if(this.p.ecmT>0)return;this.p.ecmT=1.2}Ee.sfx("ecm");let t=this.player.position;for(let i of this.ents)i.role==="missile"&&i.alive&&i.pos.distanceTo(t)<3e4&&(this.w.spark(i.pos,8438015,30),this.removeEnt(i));e||xe("E.C.M. detected","#80c0ff",2)}energyBomb(){let e=K.cmdr;if(!e.equip.bomb){xe("No energy bomb fitted","#ff9040",2),Ee.sfx("deny");return}e.equip.bomb=!1,Ee.sfx("bomb"),this.w.shake=25,this.bombFlash=1;for(let t of[...this.ents])if(!(!t.alive||t.pos.distanceTo(this.player.position)>15e3)){if(t.type==="xyrrid"){this.damageEnt(t,300,"player",null);continue}t.role!=="cargo"&&this.destroyEnt(t,"player")}}escapePod(){if(!K.cmdr.equip.pod){xe("No escape pod fitted","#ff9040",2),Ee.sfx("deny");return}Ee.sfx("pod"),this.pod={t:0,pos:this.player.position.clone(),vel:ht(this.player).multiplyScalar(-150).add(new M(0,60,0).applyQuaternion(this.player.quaternion))},this.setView(4),this.pod.mesh=Yn("pod"),this.pod.mesh.position.copy(this.player.position),this.w.scene.add(this.pod.mesh),xe("Escape pod launched","#ffd060",4)}updatePod(e){let t=this.pod;t.t+=e,t.mesh.position.addScaledVector(t.vel,e);let i=this.w.camera;i.parent!==this.w.scene&&this.w.scene.attach(i),i.position.copy(t.mesh.position).add(new M(30,20,60)),i.lookAt(t.t<1.5?this.player.position:t.mesh.position),t.t>1.3&&!t.boom&&(t.boom=!0,this.player.visible=!1,this.w.explode(this.player.position,70,{shake:10}),Ee.sfx("explodeL")),t.t>4.5&&(this.w.scene.remove(t.mesh),this.pod=null,this.player.visible=!0,this.cb.escape&&this.cb.escape()),this.w.updateDust(i.position,t.vel),Ee.setEngine(-1)}hurt(e,t,i){let r=this.p;if(r.alive){if(K.cheat){t&&this.w.spark(this.player.position.clone().add(t.clone().sub(this.player.position).setLength(25)),8438015,18);return}if(!i){let s=t?ht(this.player).dot(Et.subVectors(t,this.player.position))>0:!0,a=s?"shF":"shA",o=Math.min(r[a],e);r[a]-=o,e-=o,r.hitDir=s?1:-1,o>0&&Ee.sfx("hitShield"),t&&this.w.spark(this.player.position.clone().add(t.clone().sub(this.player.position).setLength(28)),o>0?6336767:16744512,22)}e>0&&(r.energy-=e,r.flash=Math.min(1,r.flash+.5),i||Ee.sfx("hitHull"),this.w.shake=Math.max(this.w.shake,6),r.energy<r.eMax*.25&&Math.random()<.3&&xe("ENERGY LOW","#ff4040",2),r.energy<=0&&this.die())}}die(){let e=this.p;if(!e.alive)return;e.alive=!1,e.jump=!1,e.dc=null,this.dead={t:0,pos:this.player.position.clone()},this.w.explode(this.player.position,90,{shake:30}),Ee.sfx("explodeL"),Ee.setEngine(-1),Ee.jingle("gameover"),this.player.visible=!1;let t=this.w.camera;this.w.scene.attach(t),this.dead.camDir=st(1).normalize(),xe("GAME OVER","#ff4040",6)}updateDead(e){let t=this.dead;t.t+=e;let i=this.w.camera;i.position.copy(t.pos).addScaledVector(t.camDir,120+t.t*70),i.lookAt(t.pos),t.t>1.2&&!t.second&&(t.second=!0,this.w.explode(t.pos.clone().add(st(30)),60,{}),Ee.sfx("explodeS")),t.t>5&&!t.done&&(t.done=!0,this.cb.death&&this.cb.death())}crash(e){if(K.cheat){let t=this.player.position;e==="planet"?t.setLength(this.S.R+60):t.sub(this.S.sunPos).setLength(this.S.sunR+200).add(this.S.sunPos),this.p.speed*=.3;return}xe(e==="sun"?"You flew into the star":"You crashed into the planet","#ff4040",5),this.p.energy=0,this.die()}damageEnt(e,t,i,r){if(!e.alive)return;e.flash=.1,r&&r.mining&&e.role==="rock"&&(t*=2.5);let s=Math.min(e.shields,t*.8);e.shields-=s,e.energy-=t-s,i==="player"?(Ee.sfx("hitEnemy"),this.w.spark(e.pos.clone().add(Et.subVectors(this.player.position,e.pos).setLength(e.r*.8)),s>0?8438015:16752704,e.r*.6),e.role==="police"?this.crime(8,"Attacking the police"):e.role==="trader"&&!e.hostile&&this.crime(2,null),e.role!=="rock"&&e.role!=="cargo"&&e.role!=="missile"&&(e.aggro="player",(e.role!=="trader"||e.def.missiles>2)&&(e.hostile=!0)),this.nearStationAlert(e)):i&&i!=="player"&&i.alive&&(e.aggro=i),e.energy<=0&&this.destroyEnt(e,i,r)}crime(e,t){let i=K.cmdr,r=i.legal;if(i.legal=Math.min(255,i.legal+e),r<50&&i.legal>=50){xe("You are now a FUGITIVE","#ff4040",4);for(let s of this.ents)(s.role==="police"||s.role==="hunter")&&(s.hostile=!0,s.target="player")}else r===0&&i.legal>0?xe("Legal status: offender","#ff9040",3):t&&this.p.legalT<=0&&xe(t,"#ff9040",2);this.p.legalT=3}nearStationAlert(e){if(!(this.player.position.distanceTo(this.S.station.position)>25e3||e.role==="pirate"||e.role==="alien"||e.role==="rock")&&!this.stationAngry){this.stationAngry=!0,xe("Station security alerted!","#ff4040",4),Ee.sfx("alarm");let t=this.S.stationAxis,i=this.encounter("police",this.S.station.position.clone().addScaledVector(t,900),3);for(let r of i)r.hostile=!0,r.target="player",r.quat.setFromRotationMatrix(wn.lookAt(r.pos,this.player.position,$r))}}stationHit(){this.crime(16,"Firing at the station!"),this.stationAngry=!1,this.nearStationAlert({role:"station",pos:this.S.station.position})}destroyEnt(e,t,i){if(!e.alive)return;this.removeEnt(e);let r=e.def.size>60,s=this.player.position.distanceTo(e.pos);if(e.role==="missile"){this.w.explode(e.pos,25,{}),Ee.sfx("explodeS");return}if(this.w.explode(e.pos,e.def.size*(e.role==="cargo"?.8:1.6),{shake:Math.max(0,14-s/400)*(r?2:1),debrisColor:e.role==="rock"?6971480:10132128}),r&&setTimeout(()=>{this.mode==="fly"&&this.w.explode(e.pos.clone().add(st(e.r)),e.def.size,{})},350),Ee.sfx(r||e.def.size>45?"explodeL":"explodeS"),e.role==="rock")if(e.type==="asteroid"&&i&&i.mining)for(let a=0;a<ke.randi(2,3);a++)this.spawn("boulder",e.pos.clone().add(st(e.r)),{});else e.type==="boulder"&&i&&i.mining&&this.dropCanister(e.pos,Math.random()<.15?"gems":Math.random()<.3?"radio":"minerals",ke.randi(1,2));else if(e.role!=="cargo"){let a=e.role==="alien"?e.type==="xyrrid"?3:Math.random()<.3?1:0:Math.random()<.6?ke.randi(0,Math.min(3,1+Math.floor(e.def.cargo/20))):0;for(let o=0;o<a;o++)this.dropCanister(e.pos,e.role==="alien"?"alien":e.role==="pirate"?ke.pick(["narc","arms","gold","lux","comp"]):ke.pick(["food","textiles","mach","comp","spirits","alloys","lux"]),1);e.role==="trader"&&Math.random()<.3&&this.spawn("pod",e.pos.clone().add(st(e.r)),{role:"cargo",good:"droids",drift:st(60)})}if(t==="player"){let a=K.cmdr;if(e.role!=="cargo"){let o=Ui(a.killPts);a.killPts+=e.def.kill,a.kills+=e.def.kill>=.5?1:0,Gs(e.def.kill*100+e.bounty),e.bounty>0&&(Zr(e.bounty),xe(`Bounty: ${e.bounty} Cr`,"#60ff90",3),Ee.sfx("sell")),e.role==="police"&&this.crime(64,null),e.role==="trader"&&this.crime(16,null),Ui(a.killPts)!==o&&(xe(`Well done, Commander! Rank: ${Ui(a.killPts)}`,"#ffd060",5),Ee.jingle("rank"),setTimeout(()=>this.playSpaceSong(),2500))}}}dropCanister(e,t,i){this.spawn("canister",e.clone().add(st(30)),{role:"cargo",good:t,qty:i,drift:st(70)})}updateEnts(e){let t=this.player.position;for(let i of this.ents){if(!i.alive)continue;i.t+=e,i.flash=Math.max(0,i.flash-e),i.role==="rock"||i.role==="cargo"?(i.pos.addScaledVector(i.drift,e),i.mesh.rotation.x+=i.spin.x*e,i.mesh.rotation.y+=i.spin.y*e,i.mesh.rotation.z+=i.spin.z*e):i.role==="missile"?this.missileAI(i,e):this.shipAI(i,e);let r=i.mesh.userData;if(r.engines)for(let s of r.engines)s.material.opacity=.25+.75*ke.clamp(i.speed/i.def.speed,0,1);r.navLights&&r.navLights.forEach((s,a)=>{s.material.opacity=Math.sin(this.time*3+a)>.5?1:.15}),r.siren&&r.siren.material.color.setHex(Math.sin(this.time*12)>0?4227327:16724016),r.core&&(r.core.rotation.y+=e*2),i.pos.distanceTo(t)>6e4&&!this.dead&&this.removeEnt(i)}this.ents=this.ents.filter(i=>i.alive)}targetOf(e){return e.target==="player"?this.p.alive?{pos:this.player.position,vel:ht(this.player).multiplyScalar(this.p.speed),r:Qt().size*.5,isPlayer:!0}:null:e.target&&e.target.alive?{pos:e.target.pos,vel:ht(e.target.mesh).multiplyScalar(e.target.speed),r:e.target.r,ent:e.target}:null}chooseTarget(e){let t=K.cmdr,i=this.player.position,r=e.pos.distanceTo(i);if(e.aggro){e.target=e.aggro,e.hostile=!0;return}let s=(a,o)=>{let l=null,c=o;for(let h of this.ents)if(h.alive&&h!==e&&h.role===a){let u=h.pos.distanceTo(e.pos);u<c&&(c=u,l=h)}return l};e.role==="pirate"?e.target=e.hostile?"player":s("trader",9e3):e.role==="police"?e.target=t.legal>=50&&r<25e3||e.hostile?"player":s("pirate",14e3)||s("alien",14e3):e.role==="hunter"?e.target=t.legal>=50?"player":null:e.role==="alien"?e.target="player":e.target=null}shipAI(e,t){let i=ht(e.mesh);e.retarget=(e.retarget??0)-t,e.retarget<=0&&(e.retarget=1,this.chooseTarget(e));let r=this.targetOf(e);e.cool-=t;let s=null,a=e.def.speed*.6;if(e.state!=="flee"&&e.energy<e.eMax*.25&&(e.role==="pirate"||e.role==="trader"||e.role==="hunter")&&Math.random()<t*.6&&(e.state="flee",e.t=0),e.state==="flee"){let o=r?r.pos:this.player.position;s=Jn.subVectors(e.pos,o).normalize(),a=e.def.speed,e.t>12&&(e.state="cruise")}else if(r){let o=Jn.subVectors(r.pos,e.pos),l=o.length();if(e.state==="break")s=e.breakDir,a=e.def.speed,e.t>e.breakT&&(e.state="attack");else{e.state="attack",s=fp.copy(r.pos).addScaledVector(r.vel,l/2200*e.skill).sub(e.pos).normalize(),a=l>2500?e.def.speed:e.def.speed*(.45+.4*e.skill);let h=i.angleTo(s);h<.12&&l<4200&&e.cool<=0&&this.npcShoot(e,r,h,l),l<e.r+r.r+220&&(e.state="break",e.t=0,e.breakT=ke.rand(1.2,2.6),e.breakDir=o.clone().negate().normalize().add(st(1.4)).normalize()),e.missiles>0&&l>1500&&l<7e3&&Math.random()<t*.05*(e.role==="police"?.5:1)&&this.npcMissile(e,r.isPlayer?"player":r.ent),e.type==="xyrrid"&&e.t>0&&(e.spawnT=(e.spawnT??6)-t,e.spawnT<=0&&this.ents.filter(u=>u.type==="drone").length<5&&(e.spawnT=9,this.spawn("drone",e.pos.clone().add(st(e.r)),{quat:e.quat.clone(),role:"alien",hostile:!0,target:"player",skill:.5})))}if(e.ecm&&Math.random()<t*2){for(let c of this.ents)if(c.role==="missile"&&c.target===e&&c.pos.distanceTo(e.pos)<2500){this.ecm(!1),e.ecm=Math.random()<.5;break}}}else{let o=this.S.station.position;if(e.role==="trader"&&e.goStation){let l=fp.copy(o).addScaledVector(this.S.stationAxis,2500);if(s=Jn.subVectors(l,e.pos).normalize(),a=e.def.speed*.7,e.pos.distanceTo(l)<600){this.removeEnt(e);return}}else e.role==="police"||e.role==="hunter"||e.role==="pirate"?((!e.dest||e.pos.distanceTo(e.dest)<800)&&(e.dest=(e.role==="police"?o.clone().addScaledVector(this.S.stationAxis,4e3):e.pos.clone()).add(st(6e3))),s=Jn.subVectors(e.dest,e.pos).normalize()):s=i}s&&this.steer(e,s,t),e.speed+=(a-e.speed)*Math.min(1,t*1.5),e.pos.addScaledVector(ht(e.mesh),e.speed*t)}steer(e,t,i){Jr.setFromRotationMatrix(wn.lookAt(Et.set(0,0,0),t,$r)),e.quat.rotateTowards(Jr,e.def.pitch*(.8+e.skill*.6)*i)}npcShoot(e,t,i,r){e.cool=ke.rand(.35,.8)*(1.4-e.skill*.6);let s=ht(e.mesh),a=e.pos.clone().addScaledVector(s,e.r),o=.02+e.skill*.05,l=i<o+t.r/Math.max(200,r)&&Math.random()<.55+e.skill*.35,c=t.pos.clone().add(st(l?t.r*.3:t.r*3+40)),h=e.role==="alien"?6356880:e.role==="police"?6332671:16728128;if(this.w.beam(a,c,h,e.def.size>60?2.4:1.3,.1,l),r<5e3&&Ee.sfx("enemyLaser"),!l)return;let u=_0[e.type]||5;t.isPlayer?this.hurt(u,e.pos):this.damageEnt(t.ent,u,e,null)}missileAI(e,t){e.life-=t;let i=this.targetOf(e);if(!i||e.life<=0){this.destroyEnt(e,null);return}let r=Jn.subVectors(i.pos,e.pos),s=r.length();this.steer(e,r.normalize(),t*2.6),e.speed=Math.min(s<600?420:e.def.speed,e.speed+400*t),e.pos.addScaledVector(ht(e.mesh),e.speed*t),s<i.r+60&&(this.removeEnt(e),this.w.explode(e.pos,45,{shake:i.isPlayer?18:4}),Ee.sfx("explodeS"),i.isPlayer?this.hurt(75,e.pos):this.damageEnt(i.ent,260,e.owner==="player"?"player":e.owner,null))}collisions(e){let t=this.p,i=this.player,r=i.position,s=Qt().size*.45;for(let a of this.ents){if(!a.alive||a.role==="missile"||a.pos.distanceTo(r)>a.r+s)continue;if(a.role==="cargo"){if(K.cmdr.equip.scoop&&qr()>0&&ht(i).dot(Et.subVectors(a.pos,r))>-5){let h=Jt.find(u=>u.id===a.good);K.cmdr.cargo[a.good]=(K.cmdr.cargo[a.good]||0)+a.qty,K.cmdr.cost[a.good]||(K.cmdr.cost[a.good]=0),xe(`Scooped: ${a.qty} ${h.unit} ${h.name}`,"#60ff90",2.5),Ee.sfx("scoop"),this.removeEnt(a),h.legal&&K.cmdr.legal<50&&this.crime(0,null)}else this.destroyEnt(a,null),this.hurt(10,a.pos);continue}let l=Et.subVectors(r,a.pos).normalize();r.copy(a.pos).addScaledVector(l,a.r+s+2);let c=8+t.speed*.08;this.hurt(c,a.pos),this.damageEnt(a,c*1.5,a.role==="trader"||a.role==="police"?null:"player",null),t.speed*=.4,Ee.sfx("hitHull")}this.stationCollide(e)}stationCollide(e){let t=this.p,i=this.S,r=i.station,s=this.player;if(s.position.distanceTo(r.position)>2500)return;let a=r.worldToLocal(s.position.clone()),o=Math.hypot(a.x,a.y);if(a.z>250&&a.z<300&&Math.abs(a.x)<78&&Math.abs(a.y)<32){let c=ht(s).applyQuaternion(r.quaternion.clone().invert()),h=new M(1,0,0).applyQuaternion(s.quaternion).applyQuaternion(r.quaternion.clone().invert()),u=c.z<-.88&&Math.abs(h.y)<.5;if(u&&(t.speed<t.max*.75||t.dc)){this.docked();return}if(!u){this.bounceStation(a,"Misaligned with the docking slot!");return}}if(t.dc)return;if(Math.abs(a.z)<290&&o<270){this.bounceStation(a,"Collision with the station!");return}Math.hypot(o-900,a.z)<95&&this.bounceStation(a,"Collision with the station!")}bounceStation(e,t){let i=this.p,r=this.S.station,s=e.clone();s.z+=40;let a=s.normalize();this.player.position.copy(r.localToWorld(e.clone().addScaledVector(a,40))),this.hurt(20+i.speed*.25,r.position),i.speed=0,this.player.quaternion.multiply(new Gt().setFromEuler(new li(.3,0,0))),xe(t,"#ff6060",2.5),Ee.sfx("hitHull")}docked(){Ee.sfx("dock"),this.p.jump=!1,this.p.dc=null,this.mode="docked",Ee.setEngine(-1),this.clearEnts(),this.w.setTunnel(0,0),this.cb.dock&&this.cb.dock()}toggleDockComputer(){let e=this.p;if(e.dc){e.dc=null,xe("Docking computer off","#9ad8ff"),this.playSpaceSong();return}if(!K.cmdr.equip.dock){xe("No docking computer fitted","#ff9040",2),Ee.sfx("deny");return}if(this.player.position.distanceTo(this.S.station.position)>12e4){xe("Station out of range","#ff9040",2);return}e.dc={phase:0},e.jump=!1,xe("Docking computer engaged","#60ff90",3),Ee.playSong("waltz")}dockComputer(e){let t=this.p,i=this.S,r=this.player,s=i.station,a=i.stationAxis,o=s.position.clone().addScaledVector(a,3200);if(t.dc.phase===0){let l=Jn.subVectors(o,r.position),c=l.length();Jr.setFromRotationMatrix(wn.lookAt(Et.set(0,0,0),l.normalize(),new M(0,1,0).applyQuaternion(r.quaternion))),r.quaternion.rotateTowards(Jr,1.2*e);let h=ht(r).dot(l)>.95,u=c>16e3&&h&&!this.ents.some(d=>d.alive&&d.role!=="rock"&&d.role!=="cargo"&&d.role!=="missile"&&d.pos.distanceTo(r.position)<mp&&d.hostile);t.speed=h?Math.min(t.max,c*.4):t.max*.25,u&&r.position.addScaledVector(ht(r),Math.min(c-12e3,t.max*gp)*e),c<250&&(t.dc.phase=1)}else{let l=s.quaternion.clone();r.quaternion.rotateTowards(l,1.6*e);let c=s.worldToLocal(r.position.clone());c.x*=1-Math.min(1,e*2),c.y*=1-Math.min(1,e*2),r.position.copy(s.localToWorld(c)),t.speed=r.quaternion.angleTo(l)<.08?Math.min(t.max*.6,240):20}}spawner(e){let t=this.p,i=it(),r=this.player.position;if(this.encT-=e*(t.jump?2.5:1),this.encT>0)return;this.encT=ke.rand(25,50)*(1.6-.6*this.threat());let s=r.distanceTo(this.S.station.position)<3e4,a=r.clone().addScaledVector(ht(this.player),t.jump?9e3:8e3).add(st(3e3)),o=Math.random();if(s)o<.5?this.encounter("traders",a,ke.randi(1,2)):o<.75?this.encounter("police",a,1):K.cmdr.legal>=50&&this.encounter("hunters",a,1);else{let l=(.12+(7-i.gov)*.06)*(.4+.6*this.threat());o<l?(this.encounter("pirates",a,this.pirateGroup(i)),t.jump&&xe("Interdiction! Hostile ships nearby","#ff6060")):o<l+.25?this.encounter("traders",a,ke.randi(1,2)):o<l+.4?this.encounter("rocks",a,ke.randi(3,6)):o<l+.45&&K.cmdr.legal>=50?this.encounter("hunters",a,ke.randi(1,2)):o<l+.47&&K.cmdr.killPts>40&&this.encounter("aliens",a,1)}}startHyper(e){let t=K.cmdr,i=this.p;if(i.hyper){i.hyper=null,xe("Hyperspace cancelled","#9ad8ff");return}if(e){if(!t.equip.galactic){xe("No galactic hyperdrive fitted","#ff9040",2),Ee.sfx("deny");return}i.hyper={t:3.99,galactic:!0},Ee.sfx("hyperCharge"),xe("Galactic hyperdrive charging","#ffd060");return}if(t.target<0||t.target===t.si){xe("Select a destination on the star map first (Tab)","#ff9040",3),Ee.sfx("deny");return}let r=Kt(t.gi)[t.target],s=Li(it(),r);if(s>Xt()){xe("Destination out of range","#ff9040",2),Ee.sfx("deny");return}if(s>t.fuel){xe("Not enough fuel","#ff9040",2),Ee.sfx("deny");return}i.hyper={t:3.99,galactic:!1,target:t.target},Ee.sfx("hyperCharge"),xe(`Hyperspace to ${r.name}`,"#ffd060")}doHyper(){let e=K.cmdr,t=this.p,i=t.hyper;if(t.hyper=null,t.jump=!1,t.dc=null,i.galactic)e.equip.galactic=!1,e.gi=(e.gi+1)%8;else{let s=Kt(e.gi)[i.target];e.fuel=Math.max(0,e.fuel-Li(it(),s)),e.si=i.target,e.target=-1}e.legal=Math.max(0,Math.floor(e.legal*.9)-(e.legal<50?2:0));let r=`${e.gi}:${e.si}`;e.visited.includes(r)||(e.visited.push(r),Gs(25)),this.misjump=!i.galactic&&Math.random()<.025,this.mode="jump",this.jumpFx={t:0,ready:!1},this.clearEnts(),this.w.sysGroup.visible=!1,this.w.skyGroup.visible=!1,Ee.sfx("hyper"),Ee.stopMusic(),Ee.setEngine(.2,!0),this.stationAngry=!1,this.cb.hyper&&this.cb.hyper(()=>{this.jumpFx.ready=!0})}updateHyperTunnel(e){let t=this.jumpFx;t.t+=e;let i=Math.min(1,t.t*2)*(t.ready&&t.t>2.6?Math.max(0,1-(t.t-2.6)*2):1);this.w.setTunnel(1.4*i+.01,t.t*1.5,6982399),this.w.updateDust(this.player.position,ht(this.player).multiplyScalar(6e3)),t.ready&&t.t>3&&(this.w.setTunnel(0,0),this.begin(this.misjump?"misjump":"hyper"),this.cb.arrived&&this.cb.arrived())}scanner(){let e=this.player,t=e.quaternion.clone().invert(),i=[];for(let s of this.ents){if(!s.alive)continue;let a=Et.subVectors(s.pos,e.position);if(a.length()>Wo)continue;let o=a.clone().applyQuaternion(t);i.push({e:s,x:o.x,y:o.y,z:o.z})}let r=Et.subVectors(this.S.station.position,e.position);if(r.length()<Wo*1.5){let s=r.clone().applyQuaternion(t);i.push({station:!0,x:s.x,y:s.y,z:s.z})}return i}compass(){let e=this.S,t=this.player,i=t.quaternion.clone().invert(),r=Et.subVectors(e.station.position,t.position),s=r.length()<e.R*3?e.station.position:new M,a=s.clone().sub(t.position).applyQuaternion(i).normalize();return{x:a.x,y:a.y,z:a.z,station:s!==void 0&&r.length()<e.R*3}}};function ht(n){return x0.clone().applyQuaternion(n.quaternion)}function st(n){return new M(Math.random()-.5,Math.random()-.5,Math.random()-.5).multiplyScalar(2*n)}var{U:Nt}=window.XA,jo=window.XA.Input,Fe="Orbitron, 'Segoe UI', Arial, sans-serif",Yo="Rajdhani, 'Segoe UI', Arial, sans-serif",ui="#5ad8ff",Zs="rgba(90,216,255,";function ce(n,e,t,i,r,s="#fff",a="left",o=Yo,l=600){n.font=`${l} ${r}px ${o}`,n.textAlign=a,n.textBaseline="middle",n.fillStyle=s,n.fillText(e,t,i)}function Tt(n,e,t,i,r,s,a="center",o=Fe){n.save(),n.font=`700 ${r}px ${o}`,n.textAlign=a,n.textBaseline="middle",n.lineJoin="round",n.strokeStyle=s,n.globalAlpha*=.12,n.lineWidth=r*.55,n.strokeText(e,t,i),n.globalAlpha/=.12,n.globalAlpha*=.22,n.lineWidth=r*.25,n.strokeText(e,t,i),n.globalAlpha/=.22,n.fillStyle=s,n.fillText(e,t,i),n.restore()}function En(n,e,t,i,r,s,a,o,l){n.fillStyle="rgba(10,20,40,0.7)",n.fillRect(e,t,i,r);let c=l&&s<.25&&Math.floor(performance.now()/250)%2;n.fillStyle=c?"#ff4040":a,n.fillRect(e+1,t+1,Math.max(0,(i-2)*Nt.clamp(s,0,1)),r-2),n.strokeStyle=Zs+"0.5)",n.lineWidth=1,n.strokeRect(e+.5,t+.5,i-1,r-1),ce(n,o,e-8,t+r/2+1,13,ui,"right",Fe,700)}var M0={pirate:"#ff5050",alien:"#60ff90",police:"#6aa0ff",trader:"#ffe060",hunter:"#ff9a40",rock:"#b0a090",cargo:"#ffb040",missile:"#ffffff"},vp=n=>n.hostile&&n.role!=="police"?"#ff5050":M0[n.role]||"#fff",xi=new M;function xp(n,e,t,i,r){let s=i.p,a=K.cmdr,o=i.w.camera;if(!s)return;let l=!!i.dead,c=!!i.pod;if(s.flash>0){let k=n.createRadialGradient(e/2,t/2,t*.3,e/2,t/2,t*.8);k.addColorStop(0,"rgba(255,0,0,0)"),k.addColorStop(1,`rgba(255,30,10,${s.flash*.6})`),n.fillStyle=k,n.fillRect(0,0,e,t)}if(s.cabinT>60&&(n.fillStyle=`rgba(255,120,30,${Math.min(.35,(s.cabinT-60)/400)})`,n.fillRect(0,0,e,t)),i.bombFlash>0&&(i.bombFlash-=1/60,n.fillStyle=`rgba(255,255,255,${i.bombFlash})`,n.fillRect(0,0,e,t)),l||c||i.mode==="jump"){qo(n,e,t),i.mode==="jump"&&Tt(n,"HYPERSPACE",e/2,t*.18,30,ui);return}for(let k of i.ents){if(!k.alive)continue;let ie=k.pos.distanceTo(i.player.position);if(ie>16e3||(xi.copy(k.pos).project(o),xi.z>1||Math.abs(xi.x)>1.1||Math.abs(xi.y)>1.1))continue;let J=(xi.x+1)/2*e,se=(1-xi.y)/2*t,le=Nt.clamp(k.r*t/(ie*.9),10,120),$=vp(k),ae=s.lock===k;n.strokeStyle=$,n.lineWidth=ae?2.5:1.5,n.globalAlpha=ae?1:.75;let fe=le*.35;for(let[de,R]of[[-1,-1],[1,-1],[1,1],[-1,1]])n.beginPath(),n.moveTo(J+de*le,se+R*le-R*fe),n.lineTo(J+de*le,se+R*le),n.lineTo(J+de*le-de*fe,se+R*le),n.stroke();if(ae&&(n.beginPath(),n.moveTo(J,se-le-12),n.lineTo(J+8,se-le-4),n.lineTo(J-8,se-le-4),n.closePath(),n.fillStyle="#ff4040",n.fill()),(ae||ie<4e3)&&(ce(n,k.def.name,J+le+6,se-8,14,$),ce(n,`${(ie/1e3).toFixed(1)} km`,J+le+6,se+8,13,$)),ae&&k.role!=="cargo"){let de=(k.energy+k.shields)/(k.eMax+k.def.shields||1);n.fillStyle="rgba(0,0,0,0.5)",n.fillRect(J-le,se+le+6,le*2,4),n.fillStyle=$,n.fillRect(J-le,se+le+6,le*2*Nt.clamp(de,0,1),4)}n.globalAlpha=1}let h=i.S.station.position;if(xi.copy(h).project(o),xi.z<1&&Math.abs(xi.x)<1&&Math.abs(xi.y)<1){let k=(xi.x+1)/2*e,ie=(1-xi.y)/2*t,J=h.distanceTo(i.player.position);n.strokeStyle="#ffffff",n.lineWidth=1.5,n.beginPath(),n.arc(k,ie,14,0,Nt.TAU),n.stroke(),ce(n,`STATION ${(J/1e3).toFixed(1)} km`,k+20,ie,14,"#ffffff")}if(i.view!==4){let k=e/2,ie=t/2,J=i.view===1?a.lasers.rear:i.view===0?a.lasers.front:null;n.strokeStyle=J?ui:"rgba(90,216,255,0.35)",n.lineWidth=1.5;for(let se of[0,1,2,3]){let le=se*Math.PI/2;n.beginPath(),n.moveTo(k+Math.cos(le)*10,ie+Math.sin(le)*10),n.lineTo(k+Math.cos(le)*26,ie+Math.sin(le)*26),n.stroke()}n.beginPath(),n.arc(k,ie,2,0,Nt.TAU),n.fillStyle=ui,n.fill(),i.view!==0&&Tt(n,["","REAR VIEW","LEFT VIEW","RIGHT VIEW"][i.view],k,70,18,ui)}jo.lastDevice==="mouse"&&jo.mouse.inside&&(n.strokeStyle="rgba(255,220,120,0.8)",n.lineWidth=1.5,n.beginPath(),n.arc(jo.mouse.x,jo.mouse.y,8,0,Nt.TAU),n.stroke(),n.beginPath(),n.arc(e/2,t/2,t*.05*.5/.5*.5,0,Nt.TAU),n.strokeStyle="rgba(255,220,120,0.25)",n.stroke());let u=Math.min(e,1280),d=(e-u)/2,p=t-170,m=n.createLinearGradient(0,p,0,t);m.addColorStop(0,"rgba(5,12,25,0)"),m.addColorStop(.25,"rgba(5,12,25,0.65)"),m.addColorStop(1,"rgba(5,12,25,0.9)"),n.fillStyle=m,n.fillRect(d,p,u,170);let x=d+70,g=170;En(n,x,p+40,g,12,s.shF/s.shMax,"#40a0ff","FS"),En(n,x,p+58,g,12,s.shA/s.shMax,"#40a0ff","AS"),En(n,x,p+76,g,12,a.fuel/Xt(),"#ffd040","FU"),En(n,x,p+94,g,12,(s.cabinT-20)/180,"#ff7040","CT"),En(n,x,p+112,g,12,s.laserT/100,s.overheat?"#ff2020":"#ff9040","LT"),En(n,x,p+130,g,12,Math.min(1,s.alt/(i.S.R*2)),"#60ff90","AL",!0);for(let k=0;k<Qt().missiles;k++){let ie=x+k*22,J=p+152;n.fillStyle=k<a.missiles?s.lock&&k===a.missiles-1?"#ff4040":"#60ff90":"rgba(90,216,255,0.15)",n.fillRect(ie,J,16,8)}let f=d+u-70-g;En(n,f,p+40,g,12,s.speed/s.max,"#60ff90","SP"),yp(n,f,p+58,g,12,s.rate.r,"RL"),yp(n,f,p+76,g,12,s.rate.p,"DC");for(let k=0;k<4;k++)En(n,f,p+94+k*18,g,12,Nt.clamp(s.energy/s.eMax*4-(3-k),0,1),"#40ff90",`${4-k}`,k===3);let y=e/2,v=p+98,_=210,E=64;n.save(),n.fillStyle="rgba(10,40,60,0.45)",n.beginPath(),n.ellipse(y,v,_,E,0,0,Nt.TAU),n.fill(),n.strokeStyle=Zs+"0.6)",n.lineWidth=1.5,n.stroke(),n.strokeStyle=Zs+"0.25)",n.lineWidth=1,n.beginPath(),n.ellipse(y,v,_*.5,E*.5,0,0,Nt.TAU),n.stroke(),n.beginPath(),n.moveTo(y-_,v),n.lineTo(y+_,v),n.moveTo(y,v-E),n.lineTo(y,v+E),n.stroke(),n.beginPath(),n.moveTo(y,v),n.lineTo(y-_*.7,v-E*.7),n.moveTo(y,v),n.lineTo(y+_*.7,v-E*.7),n.stroke();let T=16e3;for(let k of i.scanner()){let ie=k.x/T,J=k.z/T;if(ie*ie+J*J>1.2&&!k.station)continue;let se=y+Nt.clamp(ie,-1.1,1.1)*_,le=v+Nt.clamp(J,-1.1,1.1)*E,$=Nt.clamp(k.y/T,-1.4,1.4)*E*1.3,ae=k.station?"#ffffff":vp(k.e);n.strokeStyle=ae,n.lineWidth=1.5,n.beginPath(),n.moveTo(se,le),n.lineTo(se,le-$),n.stroke(),n.fillStyle=ae,k.station?n.fillRect(se-5,le-$-5,10,10):k.e.role==="missile"?n.fillRect(se-1.5,le-$-1.5,3,3):(n.fillRect(se-4,le-$-2,8,4),s.lock===k.e&&(n.strokeStyle="#ff4040",n.strokeRect(se-7,le-$-5,14,10)))}n.restore();let A=i.compass(),B=y+_+52,U=p+60;n.strokeStyle=Zs+"0.7)",n.lineWidth=1.5,n.beginPath(),n.arc(B,U,22,0,Nt.TAU),n.stroke();let W=Nt.clamp(A.x,-1,1)*18,V=Nt.clamp(-A.y,-1,1)*18;n.beginPath(),n.arc(B+W,U+V,4,0,Nt.TAU),A.z<0?(n.fillStyle=A.station?"#ffffff":"#ffd040",n.fill()):(n.strokeStyle=A.station?"#ffffff":"#ffd040",n.stroke()),ce(n,A.station?"STN":"PLN",B,U+34,12,ui,"center",Fe,700);let F=(k,ie,J,se,le="#60ff90")=>{n.fillStyle=se?le:"rgba(90,216,255,0.15)",n.font=`700 12px ${Fe}`,n.textAlign="center",n.fillText(k,ie,J)},X=y-_-52;F("JUMP",X,p+40,s.jump,"#6aa0ff"),F("ECM",X,p+58,!!a.equip.ecm,"#60ff90"),F("DOCK",X,p+76,!!s.dc,"#ffd040"),F("SAFE",X,p+94,i.player.position.distanceTo(i.S.station.position)<3e4,"#60ff90"),F("BOMB",X,p+112,!!a.equip.bomb,"#ff9040"),F(Wr(a.legal).toUpperCase(),X,p+130,a.legal>0,a.legal>=50?"#ff4040":"#ff9040");let H=it();ce(n,`${H.name.toUpperCase()}`,20,22,20,"#ffffff","left",Fe,700),ce(n,`${Math.round(s.jump?s.max*26:s.speed)} m/s \xB7 ${Ui(a.killPts)}`,20,46,15,ui);let Y=a.target>=0&&a.target!==a.si?Kt(a.gi)[a.target]:null;ce(n,Y?`\u2192 ${Y.name}  ${Li(H,Y).toFixed(1)} ly`:"No destination (Tab)",e-20,22,16,Y?"#ffd040":"rgba(255,255,255,0.5)","right",Fe,700),ce(n,`Fuel ${a.fuel.toFixed(1)} ly \xB7 Cargo ${$n()}/${jr()} t`,e-20,46,15,ui,"right"),K.cheat&&(n.fillStyle="#ffd040",n.beginPath(),n.arc(e-12,t-12,4,0,Nt.TAU),n.fill()),s.hyper&&Tt(n,`${s.hyper.galactic?"GALACTIC JUMP":"HYPERSPACE"} ${Math.ceil(s.hyper.t)}`,e/2,t*.28,40,"#ffd040"),s.dc&&Tt(n,"DOCKING COMPUTER",e/2,t*.2,22,"#60ff90"),s.alt<i.S.R*.05&&Math.floor(r*3)%2&&Tt(n,"ALTITUDE WARNING",e/2,t*.36,26,"#ff4040"),s.energy<s.eMax*.25&&Math.floor(r*3)%2&&Tt(n,"ENERGY LOW",e/2,t*.4,24,"#ff4040"),qo(n,e,t)}function yp(n,e,t,i,r,s,a){n.fillStyle="rgba(10,20,40,0.7)",n.fillRect(e,t,i,r),n.strokeStyle=Zs+"0.5)",n.strokeRect(e+.5,t+.5,i-1,r-1),n.fillStyle="rgba(90,216,255,0.3)",n.fillRect(e+i/2-.5,t,1,r),n.fillStyle="#ffd040",n.fillRect(e+i/2+s*(i/2-4)-3,t+1,6,r-2),ce(n,a,e-8,t+r/2+1,13,ui,"right",Fe,700)}function qo(n,e,t){K.msgs.forEach((r,s)=>{let a=Math.min(1,(r.dur-r.t)*2,r.t*8);n.globalAlpha=Math.max(0,a),Tt(n,r.text,e/2,110+s*30,20,r.color,"center",Yo),n.globalAlpha=1})}function Zo(n){for(let e of K.msgs)e.t+=n;K.msgs=K.msgs.filter(e=>e.t<e.dur)}var{U:Ze,Store:$o}=window.XA,O=window.XA.Input,ye=window.XA.Audio,at=window.__S={},Re=null;function Mp(n){Re=n}var jt=(n,e,t,i,r)=>n.x>=e&&n.x<=e+i&&n.y>=t&&n.y<=t+r,$s={wren:1,kestrel:3,mule:4,falcon:7,atlas:8,vanguard:10,seraph:12};function ni(n,e,t,i,r,s=.82){n.fillStyle=`rgba(6,14,30,${s})`,n.fillRect(e,t,i,r),n.strokeStyle="rgba(90,216,255,0.55)",n.lineWidth=1.5,n.strokeRect(e+.5,t+.5,i-1,r-1),n.fillStyle="rgba(90,216,255,0.8)",n.fillRect(e,t,18,3),n.fillRect(e+i-18,t+r-3,18,3)}function Js(n,e,t,i,r,s,a,o){n.font=`500 ${a}px ${Yo}`,n.textAlign="left",n.textBaseline="middle",n.fillStyle=o;let l="",c=i;for(let h of e.split(" ")){let u=l?l+" "+h:h;n.measureText(u).width>r&&l?(n.fillText(l,t,c),l=h,c+=s):l=u}return l&&n.fillText(l,t,c),c+s}function Sp(n,e,t,i){n.save(),n.font=`900 92px ${Fe}`,n.textAlign="center",n.textBaseline="middle",n.lineJoin="round",n.strokeStyle="#3aa0ff";for(let[s,a]of[[26,.08],[14,.14],[6,.25]])n.globalAlpha=a,n.lineWidth=s,n.strokeText("STARHAUL",e/2,t);n.globalAlpha=1;let r=n.createLinearGradient(0,t-46,0,t+46);r.addColorStop(0,"#ffffff"),r.addColorStop(.55,"#9ad8ff"),r.addColorStop(.56,"#3a8aff"),r.addColorStop(1,"#1a3aa0"),n.fillStyle=r,n.fillText("STARHAUL",e/2,t),n.restore(),Tt(n,"TRADE \xB7 FIGHT \xB7 BECOME A LEGEND",e/2,t+66,18,"#9ad8ff","center",Fe)}function Jo(n,e,t=440,i=44,r=8,s=.5){return{items:n,sel:0,y:e,w:t,h:i,gap:r,fx:s}}function Ko(n,e){let t=n.items.filter(o=>!o.hidden||!o.hidden()),i=t.length;n.sel>=i&&(n.sel=0),O.hit("up")&&(n.sel=(n.sel+i-1)%i,ye.sfx("menuMove")),O.hit("down")&&(n.sel=(n.sel+1)%i,ye.sfx("menuMove"));let r=-1,s=e*n.fx;t.forEach((o,l)=>{jt(O.mouse,s-n.w/2,n.y+l*(n.h+n.gap),n.w,n.h)&&(r=l)}),O.mouse.moved&&r>=0&&r!==n.sel&&(n.sel=r,ye.sfx("menuMove"));let a=t[n.sel];a.adjust&&(O.hit("left")&&a.adjust(-1),O.hit("right")&&a.adjust(1)),(O.hit("confirm")||O.mouse.clicked&&r===n.sel&&r>=0)&&(a.action?(ye.sfx("menuOk"),a.action()):a.adjust&&a.adjust(1))}function Qo(n,e,t,i){let r=e.items.filter(a=>!a.hidden||!a.hidden()),s=t*e.fx;r.forEach((a,o)=>{let l=e.y+o*(e.h+e.gap),c=o===e.sel;n.fillStyle=c?`rgba(58,160,255,${.35+.1*Math.sin(i*5)})`:"rgba(6,14,30,0.55)",n.fillRect(s-e.w/2,l,e.w,e.h),n.strokeStyle=c?"#9ad8ff":"rgba(90,216,255,0.25)",n.lineWidth=1.5,n.strokeRect(s-e.w/2+.5,l+.5,e.w-1,e.h-1);let h=typeof a.label=="function"?a.label():a.label;ce(n,h,s,l+e.h/2+1,c?19:17,c?"#ffffff":"#bfe6ff","center",Fe,700)})}var di=null;function _p(n){let e=Re.world;return di&&e.scene.remove(di),di=Yn(n),e.scene.add(di),di}function S0(n,e,t=3800){let i=Re.world,r=i.sys;if(!r)return;let s=i.camera;s.parent!==i.scene&&i.scene.attach(s);let a=r.station.position,o=r.stationAxis,l=new M().crossVectors(o,new M(0,1,0)).normalize(),c=new M().crossVectors(l,o).normalize(),h=e*.05;s.position.copy(a).addScaledVector(o,t*.8).addScaledVector(l,Math.cos(h)*t*.7).addScaledVector(c,Math.sin(h)*t*.35+t*.15),s.up.set(0,1,0),s.lookAt(a.clone().addScaledVector(o,-800))}at.boot={t:0,ready:!1,enter(){this.t=0},input(){this.t>.2&&(O.pressed.size||O.mouse.clicked||O.pad.pressed.size)&&(ye.init(),Re.setState("title"))},update(n){this.t+=n},draw(n,e,t){n.fillStyle="#02040a",n.fillRect(0,0,e,t),Sp(n,e,t*.38,this.t),Math.floor(this.t*2)%2===0&&Tt(n,"PRESS ANY KEY \xB7 CLICK \xB7 OR PRESS A BUTTON",e/2,t*.68,18,"#ffd060","center",Fe),ce(n,"Best with sound on \xB7 F = fullscreen \xB7 N = mute",e/2,t-30,16,"#7aa8c8","center")},uses3D:!1};at.title={t:0,idle:0,menu:Jo([{label:"CONTINUE CAREER",hidden:()=>!Ys("career"),action:()=>{qs("career")&&Re.dockAt(!0)}},{label:"NEW CAREER",action:()=>Re.setState("newcareer")},{label:"LOAD BACKUP SAVE",hidden:()=>!Ys("backup"),action:()=>{qs("backup")&&(Di("career"),Re.dockAt(!0))}},{label:"CONTROLS",action:()=>Re.setState("controls",{back:"title"})},{label:"OPTIONS",action:()=>Re.setState("options",{back:"title"})},{label:"HIGHSCORES",action:()=>Re.setState("highscores")}],300,380,44,8,.24),enter(){if(this.t=0,ye.playSong("title"),Re.flight.mode="title",Re.flight.clearEnts(),Re.world.setTunnel(0,0),ye.setEngine(-1),K.autopilot=!1,Re.world.sysGroup.visible=!0,Re.world.skyGroup.visible=!0,!Re.world.sys||!this.built){this.built=!0;let e=Kt(Ze.randi(0,7))[Ze.randi(0,255)];Re.world.buildSystem(e)}this.ship=Ze.pick(["falcon","seraph","vanguard","kestrel","raptor","atlas"]),_p(this.ship)},show(n){this.ship=n,_p(n)},input(n,e){Ko(this.menu,e)},update(n){this.t+=n;let e=Re.world,t=e.sys;if(!t||!di)return;let i=e.camera;i.parent!==e.scene&&e.scene.attach(i);let r=t.sunDir.clone().multiplyScalar(t.R*1.6).add(new M(0,t.R*.25,0));di.position.copy(r),di.rotation.set(.15*Math.sin(this.t*.4),this.t*.15,.25*Math.sin(this.t*.3));let s=hi[this.ship].size*1.9;if(i.position.copy(r).add(new M(Math.cos(this.t*.1)*s,s*.3,Math.sin(this.t*.1)*s)),i.up.set(0,1,0),i.lookAt(r),i.translateX(-s*.42),di.userData.engines)for(let a of di.userData.engines)a.material.opacity=.7+.3*Math.sin(this.t*20)},draw(n,e,t){Re.world.sys||(n.fillStyle="#02040a",n.fillRect(0,0,e,t)),n.save(),n.translate(-e*.26,0),Sp(n,e,150,this.t),n.restore(),Qo(n,this.menu,e,this.t),ce(n,hi[this.ship].name,e-24,t-24,16,"rgba(190,230,255,0.7)","right",Fe,700),ce(n,"Arrows / W S + Enter \xB7 mouse \xB7 gamepad",24,t-24,15,"rgba(190,230,255,0.7)","left"),K.cheat&&(n.fillStyle="#ffd040",n.beginPath(),n.arc(e-12,12,4,0,Ze.TAU),n.fill())},uses3D:!0};at.newcareer={t:0,name:"",enter(){this.t=0,this.name=$o.get("lastName","JAMESON")},input(){for(let n of O.typed){let e=n.toUpperCase();/^[A-Z0-9 .\-']$/.test(e)&&this.name.length<14&&(this.name+=e,ye.sfx("menuMove"))}if(O.pressed.has("Backspace")&&(this.name=this.name.slice(0,-1),ye.sfx("menuBack")),O.pressed.has("Escape")||O.padHit(1)){Re.setState("title");return}if(O.pressed.has("Enter")||O.pressed.has("NumpadEnter")||O.padHit(0)||O.padHit(9)||O.mouse.clicked){let n=this.name.trim()||"JAMESON";$o.set("lastName",n),K.cmdr=Go(n),Di("career"),ye.sfx("menuOk"),Re.dockAt(!0)}},update(n){this.t+=n,at.title.update(n)},draw(n,e,t){n.fillStyle="rgba(2,4,10,0.55)",n.fillRect(0,0,e,t),Tt(n,"NEW CAREER",e/2,150,40,"#9ad8ff"),Js(n,"You start with a used Kestrel Mk II, a pulse laser, three missiles, a full tank \u2013 and 100 credits. Buy low, sell high, hunt pirates, avoid the police, and make a name for yourself among the stars.",e/2-330,220,660,28,20,"#d8eeff"),ce(n,"Commander name:",e/2,360,20,ui,"center",Fe,700),ni(n,e/2-240,385,480,64),ce(n,this.name+(Math.floor(this.t*2.5)%2?"_":" "),e/2,418,32,"#ffffff","center",Fe,700),ce(n,"Type a name \xB7 Enter / click / A starts \xB7 Esc goes back",e/2,490,17,"#7aa8c8","center"),ce(n,"Starting a new career replaces the current autosave (your backup save stays).",e/2,520,15,"#7aa8c8","center")},uses3D:!0};var Kn={cx:512,cy:256,zoom:1,hover:null,search:"",searchT:0,reset(){let n=it();this.cx=n.x,this.cy=n.y;let e=K.cmdr;this.hover=e.target>=0?Kt(e.gi)[e.target]:n,this.hover!==n&&(this.cx=this.hover.x,this.cy=this.hover.y)},rect(n,e,t=90,i=40){let r=Math.min(n-420,1100),s=e-t-i;return{x:30,y:t,w:r,h:s}},toScreen(n,e,t){let i=n.w/Vi*this.zoom,r=this.zoom===1?Vi/2:this.cx,s=this.zoom===1?rn/2:this.cy;return[n.x+n.w/2+(e-r)*i,n.y+n.h/2+(t-s)*i*(this.zoom===1?n.h/n.w*(Vi/rn):1)]},input(n,e,t){let i=this.rect(e,t),r=Kt(K.cmdr.gi),s=0,a=0;O.held("left")&&(s-=1),O.held("right")&&(s+=1),O.held("up")&&(a-=1),O.held("down")&&(a+=1),O.pad.connected&&(s+=O.pad.axes[0],a+=O.pad.axes[1]);let o=(this.zoom===1?300:90)*n;if((s||a)&&(this.cx=Ze.clamp(this.cx+s*o,0,Vi),this.cy=Ze.clamp(this.cy+a*o,0,rn),this.pickNear(r,this.cx,this.cy)),(O.mouse.wheel||O.key("KeyZ")||O.padHit(3))&&(this.zoom=this.zoom===1?4:1,this.hover&&(this.cx=this.hover.x,this.cy=this.hover.y),ye.sfx("menuMove")),jt(O.mouse,i.x,i.y,i.w,i.h)&&(O.mouse.moved||O.mouse.clicked)){let l=null,c=30;for(let h of r){let[u,d]=this.toScreen(i,h.x,h.y),p=Math.hypot(u-O.mouse.x,d-O.mouse.y);p<c&&(c=p,l=h)}l&&(this.hover=l,this.zoom!==1&&O.mouse.clicked),O.mouse.clicked&&l&&this.select(l)}for(let l of O.typed)/^[a-zA-Z]$/.test(l)&&(this.search+=l.toLowerCase(),this.searchT=1.5);if(this.searchT>0){this.searchT-=n;let l=r.find(c=>c.name.toLowerCase().startsWith(this.search));l&&(this.hover=l,this.cx=l.x,this.cy=l.y),this.searchT<=0&&(this.search="")}(O.pressed.has("Enter")||O.pressed.has("Space")||O.padHit(0))&&this.hover&&this.select(this.hover)},pickNear(n,e,t){let i=null,r=1e9;for(let s of n){let a=Math.hypot(s.x-e,s.y-t);a<r&&(r=a,i=s)}this.hover=i},select(n){let e=K.cmdr;if(n.i===e.si){e.target=-1,ye.sfx("menuBack");return}e.target=n.i,ye.sfx("lock");let t=Li(it(),n);xe(t<=Math.min(e.fuel,Xt())?`Destination: ${n.name} (${t.toFixed(1)} ly)`:`${n.name} is out of range (${t.toFixed(1)} ly)`,t<=e.fuel?"#60ff90":"#ff9040",2.5)},draw(n,e,t,i,r=90){let s=this.rect(e,t,r),a=K.cmdr,o=Kt(a.gi),l=it();ni(n,s.x,s.y,s.w,s.h,.88),n.save(),n.beginPath(),n.rect(s.x,s.y,s.w,s.h),n.clip(),n.strokeStyle="rgba(90,216,255,0.07)",n.lineWidth=1;for(let f=0;f<=Vi;f+=64){let[y]=this.toScreen(s,f,0);n.beginPath(),n.moveTo(y,s.y),n.lineTo(y,s.y+s.h),n.stroke()}for(let f=0;f<=rn;f+=64){let[,y]=this.toScreen(s,0,f);n.beginPath(),n.moveTo(s.x,y),n.lineTo(s.x+s.w,y),n.stroke()}let[c,h]=this.toScreen(s,l.x,l.y),[u]=this.toScreen(s,l.x+a.fuel*Zn,l.y),[d]=this.toScreen(s,l.x+Xt()*Zn,l.y);if(n.strokeStyle="rgba(255,210,80,0.25)",n.setLineDash([4,6]),n.beginPath(),n.arc(c,h,d-c,0,Ze.TAU),n.stroke(),n.setLineDash([]),n.fillStyle="rgba(90,255,150,0.06)",n.strokeStyle="rgba(90,255,150,0.5)",n.beginPath(),n.arc(c,h,u-c,0,Ze.TAU),n.fill(),n.stroke(),a.target>=0){let f=o[a.target],[y,v]=this.toScreen(s,f.x,f.y);n.strokeStyle="rgba(255,210,80,0.8)",n.lineWidth=2,n.beginPath(),n.moveTo(c,h),n.lineTo(y,v),n.stroke()}let p=this.zoom>1;for(let f of o){let[y,v]=this.toScreen(s,f.x,f.y);if(y<s.x-10||y>s.x+s.w+10||v<s.y-10||v>s.y+s.h+10)continue;let _=`hsl(${120-(7-f.econ)*15+(f.econ>=4?0:-60)},80%,${55+f.tech*2}%)`,E=(p?4:1.6)+f.tech*(p?.35:.12);n.fillStyle=f.econ>=4?`hsl(${90+f.econ*4},70%,55%)`:`hsl(${20+f.econ*8},90%,58%)`,n.beginPath(),n.arc(y,v,E,0,Ze.TAU),n.fill(),(p||f===this.hover||f.i===a.target)&&ce(n,f.name,y+E+4,v,p?14:12,f.i===a.target?"#ffd040":"rgba(220,240,255,0.85)"),f.i===a.target&&(n.strokeStyle="#ffd040",n.lineWidth=2,n.beginPath(),n.arc(y,v,E+6,0,Ze.TAU),n.stroke())}if(n.strokeStyle="#ffffff",n.lineWidth=2,n.beginPath(),n.moveTo(c-14,h),n.lineTo(c+14,h),n.moveTo(c,h-14),n.lineTo(c,h+14),n.stroke(),this.hover){let[f,y]=this.toScreen(s,this.hover.x,this.hover.y);n.strokeStyle=`rgba(90,216,255,${.6+.4*Math.sin(i*6)})`,n.lineWidth=2,n.strokeRect(f-10,y-10,20,20)}n.restore(),ce(n,`${Bo[a.gi].toUpperCase()} \xB7 GALAXY ${a.gi+1}${this.zoom>1?" \xB7 LOCAL CHART":""}`,s.x+12,s.y+16,14,ui,"left",Fe,700),this.search&&ce(n,`Search: ${this.search}`,s.x+s.w-12,s.y+16,15,"#ffd040","right");let m=s.x+s.w+16,x=e-m-30;ni(n,m,s.y,x,s.h,.88);let g=this.hover||l;if(g){let f=s.y+30;ce(n,g.name.toUpperCase(),m+16,f,24,"#ffffff","left",Fe,700),f+=30;let y=Li(l,g);ce(n,g===l?"Your current location":`${y.toFixed(1)} light years ${y<=a.fuel?"\xB7 in range":y<=Xt()?"\xB7 needs more fuel":"\xB7 out of range"}`,m+16,f,16,g===l||y<=a.fuel?"#60ff90":"#ff9040"),f+=30;for(let[v,_]of[["Economy",Fs[g.econ]],["Government",Bs[g.gov]],["Tech level",g.tech],["Population",`${g.pop.toFixed(1)} billion`],["Inhabitants",g.species],["World",`${g.ptype}, ${g.star.cls}-class star`]])ce(n,v,m+16,f,15,"#7aa8c8"),ce(n,String(_),m+x-16,f,15,"#ffffff","right"),f+=22;f+=8,Js(n,g.desc,m+16,f,x-32,21,15,"#bfe6ff"),bp(n,m+x/2,s.y+s.h-80,52,g,i)}ce(n,"Move: arrows / stick / mouse \xB7 Select: Enter / click \xB7 Zoom: Z / wheel \xB7 Type a name to search",s.x,s.y+s.h+22,15,"#7aa8c8")}};function bp(n,e,t,i,r,s){let a=zs[r.ptype],o=a.pal,l=n.createRadialGradient(e-i*.35,t-i*.35,i*.1,e,t,i);l.addColorStop(0,o[Math.min(o.length-1,3)][1]),l.addColorStop(.6,o[1][1]),l.addColorStop(1,"#000"),n.fillStyle=l,n.beginPath(),n.arc(e,t,i,0,Ze.TAU),n.fill(),n.strokeStyle=a.atmo,n.globalAlpha=.6,n.lineWidth=3,n.beginPath(),n.arc(e,t,i+2,0,Ze.TAU),n.stroke(),n.globalAlpha=1,r.rings&&r.ptype!=="terran"&&(n.strokeStyle="rgba(230,210,170,0.7)",n.lineWidth=4,n.beginPath(),n.ellipse(e,t,i*1.8,i*.45,-.3,0,Ze.TAU),n.stroke())}var _i=["LAUNCH","MARKET","OUTFITTING","SHIPYARD","STAR MAP","SYSTEM","COMMANDER"];at.docked={t:0,tab:1,row:0,laserSel:{},shipSel:0,confirm:null,enter(n){this.t=0,this.row=0,this.confirm=null,n&&n.tab!==void 0&&(this.tab=n.tab),ye.playSong("docked"),Re.flight.mode="docked",XA.Main.setCursor(!0),Kn.reset(),di&&(Re.world.scene.remove(di),di=null),this.preview=null},input(n,e,t){let i=K.cmdr;if(this.confirm){if(O.hit("confirm")||O.key("KeyY")||O.padHit(0)){let c=this.confirm.yes;this.confirm=null,c()}else(O.hit("back")||O.key("KeyN")||O.padHit(1))&&(this.confirm=null);return}let r=this.tab,s=this.tab!==4;(s&&O.key("KeyQ")||O.key("PageUp")||O.padHit(4))&&(this.tab=(this.tab+_i.length-1)%_i.length),(s&&O.key("KeyE")||O.key("PageDown")||O.key("Tab")||O.padHit(5))&&(this.tab=(this.tab+1)%_i.length);for(let c=0;c<7;c++)O.key("Digit"+(c+1))&&this.tab!==4&&(this.tab=c);let a=Math.min(e-60,1220)/_i.length,o=(e-a*_i.length)/2;if(O.mouse.clicked&&_i.forEach((c,h)=>{jt(O.mouse,o+h*a,20,a-6,40)&&(this.tab=h)}),r!==this.tab){this.row=0,ye.sfx("menuMove"),this.tab===4&&Kn.reset();return}if(O.key("Escape")&&this.tab!==0){this.tab=0,ye.sfx("menuBack");return}let l=_i[this.tab];l==="LAUNCH"?((O.hit("confirm")||O.padHit(0)||O.mouse.clicked&&jt(O.mouse,e/2-160,300,320,70))&&Re.launch(),(O.key("Escape")||O.padHit(1))&&(this.confirm={text:"Quit to the title screen? Your career was saved when you docked.",yes:()=>Re.setState("title")})):l==="MARKET"?this.marketInput(e,t):l==="OUTFITTING"?this.outfitInput(e,t):l==="SHIPYARD"?this.shipyardInput(e,t):l==="STAR MAP"?Kn.input(n,e,t):l==="COMMANDER"&&this.cmdrInput(e,t)},rows(n,e,t,i){O.hit("up")&&(this.row=(this.row+n-1)%n,ye.sfx("menuMove")),O.hit("down")&&(this.row=(this.row+1)%n,ye.sfx("menuMove"));for(let r=0;r<n;r++)jt(O.mouse,40,t+r*i,e-80,i)&&O.mouse.moved&&this.row!==r&&(this.row=r)},marketInput(n,e){this.rows(Jt.length,n,130,28);let r=O.held("faster")?10:1,s=n/2+330,a=0,o=0;if((O.hit("right")||O.key("NumpadAdd")||O.key("Equal"))&&(a=r),(O.hit("left")||O.key("NumpadSubtract")||O.key("Minus"))&&(o=r),O.padHit(0)&&(a=1),O.padHit(2)&&(o=1),O.mouse.clicked)for(let l=0;l<Jt.length;l++){let c=130+l*28;jt(O.mouse,s,c+2,34,24)&&(this.row=l,o=1),jt(O.mouse,s+40,c+2,34,24)&&(this.row=l,a=1),jt(O.mouse,s+80,c+2,50,24)&&(this.row=l,a=99),jt(O.mouse,s+136,c+2,50,24)&&(this.row=l,o=999)}if(O.key("KeyA")&&O.held("faster")&&(o=999),a){let l=jh(this.row,a);ye.sfx(l?"buy":"deny"),l||xe(qr()<=0?"Cargo hold full":Vs(K.market.list[this.row].price)?"Sold out":"Not enough credits","#ff9040",1.5)}if(o){let l=qh(this.row,o);ye.sfx(l?"sell":"deny")}},outfitList(){let n=it(),e=K.cmdr;return Bh.map(t=>{let i=Object.assign({},t),r=Qt();if(i.ok=n.tech>=t.tech,t.id==="fuel")i.price=Math.max(0,(Xt()-e.fuel)*2),i.owned=e.fuel>=Xt()-.01,i.status=`${e.fuel.toFixed(1)} / ${Xt()} ly`;else if(t.id==="missile")i.owned=e.missiles>=r.missiles,i.status=`${e.missiles} / ${r.missiles}`;else if(t.laser){let s=Object.keys(Ft).filter(c=>Ft[c].tech<=n.tech),a=e.lasers[t.laser],o=this.laserSel[t.laser]??s.indexOf(a);o<0&&(o=0),this.laserSel[t.laser]=o%Math.max(1,s.length);let l=s[this.laserSel[t.laser]];i.pick=l,i.price=l?Ft[l].price:0,i.owned=a===l,i.status=a?Ft[a].name:"none",i.name=`${t.name}: \u25C2 ${l?Ft[l].name:"-"} \u25B8`}else i.owned=!!e.equip[t.id],i.status=i.owned?"fitted":"";return i})},outfitInput(n,e){let t=this.outfitList(),i=130,r=36;this.rows(t.length,n,i,r);let s=t[this.row];if(s.laser){let o=Object.keys(Ft).filter(l=>Ft[l].tech<=it().tech).length;O.hit("left")&&(this.laserSel[s.laser]=(this.laserSel[s.laser]+o-1)%o,ye.sfx("menuMove")),O.hit("right")&&(this.laserSel[s.laser]=(this.laserSel[s.laser]+1)%o,ye.sfx("menuMove"))}let a=O.hit("confirm")||O.padHit(0);O.mouse.clicked&&jt(O.mouse,40,i+this.row*r,n-80,r)&&(a=!0),a&&this.buyEquip(s)},buyEquip(n){let e=K.cmdr;if(!n.ok){xe(`Needs tech level ${n.tech}`,"#ff9040",2),ye.sfx("deny");return}if(n.owned){xe("Already fitted","#9ad8ff",1.5),ye.sfx("deny");return}if(n.id==="fuel"){let t=Xt()-e.fuel,i=K.cheat?t:Math.min(t,e.credits/2);if(i<=.05){ye.sfx("deny"),xe("Not enough credits","#ff9040");return}Yr(i*2),e.fuel=Math.min(Xt(),e.fuel+i),ye.sfx("buy");return}if(!Vs(n.price)){xe("Not enough credits","#ff9040",1.5),ye.sfx("deny");return}if(Yr(n.price),n.id==="missile")e.missiles++;else if(n.laser){let t=e.lasers[n.laser];t&&Zr(Math.round(Ft[t].price*.5)),e.lasers[n.laser]=n.pick}else e.equip[n.id]=!0;ye.sfx("buy"),xe(`${n.laser?Ft[n.pick].name:n.name} fitted`,"#60ff90",2)},shipList(){return Qd.filter(n=>$s[n]<=it().tech+2)},shipyardInput(n,e){let t=this.shipList(),i=130,r=52;this.rows(t.length,n,i,r);let s=t[this.row],a=O.hit("confirm")||O.padHit(0);if(O.mouse.clicked&&jt(O.mouse,40,i+this.row*r,520,r)&&(a=!0),a){let o=K.cmdr,l=hi[s];if(s===o.ship){xe("That is your current ship","#9ad8ff"),ye.sfx("deny");return}if($s[s]>it().tech){xe(`Needs tech level ${$s[s]}`,"#ff9040"),ye.sfx("deny");return}let c=Math.max(0,l.price-js());if(!Vs(c)){xe("Not enough credits","#ff9040"),ye.sfx("deny");return}let h=Math.round(l.cargo*(o.equip.bay?1.5:1));if($n()>h){xe("Sell some cargo first \u2013 it would not fit","#ff9040"),ye.sfx("deny");return}this.confirm={text:`Buy the ${l.name} for ${Ze.fmt(c)} Cr (after trade-in)?`,yes:()=>{Yr(c),o.ship=s,o.missiles=Math.min(o.missiles,l.missiles),o.fuel=Math.min(o.fuel,l.fuel),ye.sfx("sell"),xe(`Welcome aboard your new ${l.name}!`,"#60ff90",3),Di("career")}}}},cmdrInput(n,e){O.mouse.clicked&&(jt(O.mouse,n-330,e-150,280,44)&&(Di("backup"),xe("Backup saved","#60ff90"),ye.sfx("menuOk")),jt(O.mouse,n-330,e-96,280,44)&&this.askRetire()),(O.key("KeyS")||O.padHit(2))&&(Di("backup"),xe("Backup saved","#60ff90"),ye.sfx("menuOk")),(O.key("KeyR")||O.padHit(3))&&this.askRetire()},askRetire(){this.confirm={text:"Retire and end this career? Your score goes to the highscore list.",yes:()=>Re.endCareer("retired")}},update(n){this.t+=n,S0(n,this.t+20),this.preview&&(this.preview.rotation.y+=n*.5)},draw(n,e,t){let i=K.cmdr,r=this.t,s=it();n.fillStyle="rgba(2,6,14,0.35)",n.fillRect(0,0,e,t);let a=Math.min(e-60,1220)/_i.length,o=(e-a*_i.length)/2;_i.forEach((c,h)=>{let u=o+h*a,d=h===this.tab;n.fillStyle=d?"rgba(58,160,255,0.5)":"rgba(6,14,30,0.75)",n.fillRect(u,20,a-6,40),n.strokeStyle=d?"#9ad8ff":"rgba(90,216,255,0.3)",n.strokeRect(u+.5,20.5,a-7,39),ce(n,c,u+(a-6)/2,41,14,d?"#ffffff":"#9ac8e8","center",Fe,700)}),ce(n,`${s.name.toUpperCase()} STATION`,30,82,16,"#ffffff","left",Fe,700),ce(n,`${Ze.cr(i.credits)} Cr \xB7 Cargo ${$n()}/${jr()} t \xB7 Fuel ${i.fuel.toFixed(1)} ly`,e-30,82,17,"#ffd060","right",Fe,700);let l=_i[this.tab];l==="LAUNCH"?this.drawLaunch(n,e,t):l==="MARKET"?this.drawMarket(n,e,t):l==="OUTFITTING"?this.drawOutfit(n,e,t):l==="SHIPYARD"?this.drawShipyard(n,e,t):l==="STAR MAP"?Kn.draw(n,e,t,r,100):l==="SYSTEM"?this.drawSystem(n,e,t):l==="COMMANDER"&&this.drawCmdr(n,e,t),l!=="STAR MAP"&&ce(n,"Q / E, Tab, 1\u20137, LB / RB or click: switch page",30,t-18,14,"#7aa8c8"),qo(n,e,t),this.confirm&&(n.fillStyle="rgba(0,0,0,0.6)",n.fillRect(0,0,e,t),ni(n,e/2-330,t/2-80,660,160,.95),Js(n,this.confirm.text,e/2-300,t/2-40,600,26,20,"#ffffff"),ce(n,"Y / Enter / A = yes      N / Esc / B = no",e/2,t/2+50,17,"#ffd060","center",Fe,700))},drawLaunch(n,e,t){let i=it(),r=K.cmdr;ni(n,e/2-360,130,720,400,.75),Tt(n,`Docked at ${i.name}`,e/2,180,34,"#9ad8ff"),ce(n,`${Bs[i.gov]} \xB7 ${Fs[i.econ]} \xB7 Tech ${i.tech}`,e/2,225,18,"#d8eeff","center"),n.fillStyle=`rgba(58,160,255,${.45+.15*Math.sin(this.t*4)})`,n.fillRect(e/2-160,300,320,70),n.strokeStyle="#9ad8ff",n.lineWidth=2,n.strokeRect(e/2-160,300,320,70),ce(n,"LAUNCH",e/2,336,30,"#ffffff","center",Fe,900),ce(n,"Enter / click / A",e/2,392,15,"#7aa8c8","center");let s=r.target>=0?Kt(r.gi)[r.target]:null;ce(n,s?`Destination: ${s.name} (${Li(i,s).toFixed(1)} ly)`:"No hyperspace destination selected \u2013 see STAR MAP",e/2,450,18,s?"#ffd060":"#7aa8c8","center"),Xs()>0&&ce(n,"Warning: you carry illegal goods. Customs will notice when you launch.",e/2,480,16,"#ff9040","center"),r.legal>0&&ce(n,`Legal status: ${Wr(r.legal)}`,e/2,506,16,r.legal>=50?"#ff4040":"#ff9040","center"),ce(n,"Esc: quit to title",e/2,t-50,14,"#7aa8c8","center")},drawMarket(n,e,t){let s=K.cmdr,a=e/2+330;ni(n,30,100,e-60,t-150);let o=[[60,"GOOD","left"],[e/2-160,"UNIT","center"],[e/2-60,"PRICE","right"],[e/2+60,"FOR SALE","right"],[e/2+180,"IN HOLD","right"],[e/2+290,"PAID","right"]];for(let[l,c,h]of o)ce(n,c,l,116,13,"#7aa8c8",h,Fe,700);Jt.forEach((l,c)=>{let h=K.market.list[c],u=130+c*28,d=c===this.row,p=s.cargo[l.id]||0;d&&(n.fillStyle="rgba(58,160,255,0.28)",n.fillRect(40,u,e-80,26));let m=l.legal?"#ff9a7a":"#ffffff";if(ce(n,l.name+(l.legal?" *":""),60,u+28/2,17,m),ce(n,l.unit,e/2-160,u+28/2,16,"#9ac8e8","center"),ce(n,Ze.cr(h.price),e/2-60,u+28/2,17,"#ffd060","right"),ce(n,h.qty?`${h.qty}`:"-",e/2+60,u+28/2,17,"#ffffff","right"),ce(n,p?`${p}`:"",e/2+180,u+28/2,17,"#60ff90","right"),p&&s.cost[l.id]){let x=h.price-s.cost[l.id];ce(n,Ze.cr(s.cost[l.id]),e/2+290,u+28/2,15,x>0?"#60ff90":"#ff8a7a","right")}if(d||jt(O.mouse,40,u,e-80,28))for(let[x,g,f]of[[0,"\u2212",34],[40,"+",34],[80,"MAX",50],[136,"ALL",50]])n.fillStyle="rgba(90,216,255,0.2)",n.fillRect(a+x,u+2,f,24),n.strokeStyle="rgba(90,216,255,0.6)",n.strokeRect(a+x+.5,u+2.5,f-1,23),ce(n,g,a+x+f/2,u+28/2,14,"#ffffff","center",Fe,700)}),ce(n,"\u2192 / + buy \xB7 \u2190 / \u2212 sell \xB7 hold Shift for 10 \xB7 Shift+A sells all \xB7 click the buttons \xB7 * = illegal",e/2,t-64,15,"#7aa8c8","center")},drawOutfit(n,e,t){let i=this.outfitList(),r=130,s=36;ni(n,30,100,e-60,t-150),i.forEach((a,o)=>{let l=r+o*s;o===this.row&&(n.fillStyle="rgba(58,160,255,0.28)",n.fillRect(40,l,e-80,s-2));let h=a.ok?a.owned?"#60ff90":"#ffffff":"rgba(255,255,255,0.3)";ce(n,a.name,60,l+s/2-6,18,h),ce(n,a.desc,60,l+s/2+10,13,"#7aa8c8"),ce(n,a.ok?a.price!==void 0?`${Ze.fmt(a.price)} Cr`:"":`tech ${a.tech} needed`,e-260,l+s/2,17,a.ok?"#ffd060":"#ff8a7a","right"),ce(n,a.status||"",e-70,l+s/2,15,"#60ff90","right")}),ce(n,"Enter / click / A buys \xB7 \u2190 \u2192 picks the laser type \xB7 replaced lasers are sold back at half price",e/2,t-64,15,"#7aa8c8","center")},drawShipyard(n,e,t){let i=this.shipList(),r=130,s=52,a=K.cmdr;ni(n,30,100,560,t-150),i.forEach((h,u)=>{let d=hi[h],p=r+u*s,m=u===this.row,x=$s[h]<=it().tech;m&&(n.fillStyle="rgba(58,160,255,0.28)",n.fillRect(40,p,540,s-4)),ce(n,d.name+(h===a.ship?"  (yours)":""),60,p+16,19,h===a.ship?"#60ff90":x?"#ffffff":"rgba(255,255,255,0.35)"),ce(n,x?`${Ze.fmt(Math.max(0,d.price-js()))} Cr after trade-in`:`tech ${$s[h]} needed`,60,p+36,14,x?"#ffd060":"#ff8a7a")}),ce(n,`Trade-in value of your ${Qt().name}: ${Ze.fmt(js())} Cr`,60,t-70,15,"#7aa8c8");let o=i[this.row],l=hi[o];ni(n,610,100,e-640,t-150),ce(n,l.name.toUpperCase(),630,130,22,"#ffffff","left",Fe,700),[["Cargo",`${l.cargo} t`,l.cargo/140],["Speed",`${l.speed} m/s`,l.speed/450],["Agility",`${l.roll.toFixed(1)}`,l.roll/3.4],["Shields",`${l.shields}`,l.shields/220],["Energy",`${l.energy}`,l.energy/270],["Missiles",`${l.missiles}`,l.missiles/6],["Hyperdrive",`${l.fuel} ly`,l.fuel/10]].forEach(([h,u,d],p)=>{let m=t-330+p*30;ce(n,h,630,m,16,"#7aa8c8"),ce(n,u,820,m,16,"#ffffff","right"),n.fillStyle="rgba(90,216,255,0.15)",n.fillRect(840,m-5,e-900,10),n.fillStyle="#5ad8ff",n.fillRect(840,m-5,(e-900)*Math.min(1,d),10)}),ce(n,"Enter / click / A buys \xB7 cargo, equipment and lasers move over",630,t-70,14,"#7aa8c8"),this.previewRect={x:610,y:140,w:e-640,h:t-500,id:o}},drawSystem(n,e,t){let i=it();ni(n,30,100,e-60,t-150),ce(n,i.name.toUpperCase(),60,140,34,"#ffffff","left",Fe,900),ce(n,`${Bo[i.gi]} \xB7 Galaxy ${i.gi+1}`,60,178,16,"#7aa8c8");let r=220;for(let[a,o]of[["Economy",Fs[i.econ]],["Government",Bs[i.gov]],["Tech level",i.tech],["Population",`${i.pop.toFixed(1)} billion ${i.species}`],["Gross productivity",`${Ze.fmt(i.prod)} MCr`],["Average radius",`${Ze.fmt(i.radius)} km`],["World type",`${i.ptype[0].toUpperCase()+i.ptype.slice(1)}${i.rings&&i.ptype!=="terran"?", ringed":""}${i.moons?`, ${i.moons} moon${i.moons>1?"s":""}`:""}`],["Star",`${i.star.cls}-class`]])ce(n,a,60,r,17,"#7aa8c8"),ce(n,String(o),300,r,17,"#ffffff"),r+=30;Js(n,i.desc,60,r+20,Math.min(700,e-520),26,19,"#d8eeff"),bp(n,e-260,330,130,i,this.t);let s=["very dangerous","dangerous","risky","moderate","safe","safe","very safe","very safe"][i.gov];ce(n,`Pirate activity: ${s}`,e-260,500,17,i.gov<=2?"#ff8a7a":"#60ff90","center")},drawCmdr(n,e,t){let i=K.cmdr;ni(n,30,100,e-60,t-150),ce(n,`COMMANDER ${i.name}`,60,140,28,"#ffffff","left",Fe,900);let r=190,s=Math.floor(i.time/60);for(let[l,c,h]of[["Rating",Ui(i.killPts)],["Legal status",Wr(i.legal),i.legal>=50?"#ff4040":i.legal>0?"#ff9040":"#60ff90"],["Credits",`${Ze.cr(i.credits)} Cr`],["Score",Ze.fmt(i.score)],["Ship",Qt().name],["Kills",i.kills],["Systems visited",i.visited.length],["Trading profit",`${Ze.cr(i.profit)} Cr`],["Flight time",`${Math.floor(s/60)} h ${s%60} min`]])ce(n,l,60,r,17,"#7aa8c8"),ce(n,String(c),290,r,17,h||"#ffffff"),r+=28;ce(n,"EQUIPMENT",e/2,190,15,"#7aa8c8","left",Fe,700);let a=[];i.lasers.front&&a.push(`Front: ${Ft[i.lasers.front].name}`),i.lasers.rear&&a.push(`Rear: ${Ft[i.lasers.rear].name}`),a.push(`${i.missiles} missile${i.missiles===1?"":"s"}`);for(let l of Bh)i.equip[l.id]&&a.push(l.name);a.forEach((l,c)=>ce(n,l,e/2,218+c*24,16,"#ffffff")),ce(n,"CARGO",e/2+280,190,15,"#7aa8c8","left",Fe,700);let o=Object.entries(i.cargo);o.length||ce(n,"empty",e/2+280,218,16,"rgba(255,255,255,0.5)"),o.forEach(([l,c],h)=>{let u=Jt.find(d=>d.id===l);ce(n,`${c} ${u.unit} ${u.name}`,e/2+280,218+h*24,16,u.legal?"#ff9a7a":"#ffffff")});for(let[l,c]of[["SAVE BACKUP (S)",t-150],["RETIRE (R)",t-96]])n.fillStyle=jt(O.mouse,e-330,c,280,44)?"rgba(58,160,255,0.5)":"rgba(58,160,255,0.22)",n.fillRect(e-330,c,280,44),n.strokeStyle="#9ad8ff",n.strokeRect(e-330+.5,c+.5,279,43),ce(n,l,e-190,c+22,16,"#ffffff","center",Fe,700);ce(n,"Your career is saved automatically every time you dock.",60,t-70,15,"#7aa8c8")},render3D(n,e,t,i){if(_i[this.tab]!=="SHIPYARD"||!this.previewRect)return;let r=this.previewRect;if(!this.pv||this.pv.id!==r.id){let p=new vn;p.environment=n.scene.environment,p.environmentIntensity=.8,p.add(new Br(8425648,1.2));let m=new qn(16777215,3);m.position.set(3,4,5),p.add(m);let x=new qn(6988031,1.5);x.position.set(-4,-1,-3),p.add(x);let g=Yn(r.id);p.add(g);let f=new It(35,1,1,5e3);this.pv={id:r.id,scene:p,cam:f,m:g}}let s=this.pv,a=hi[r.id].size;s.m.rotation.y=this.t*.6,s.m.rotation.x=.35,s.cam.aspect=r.w/r.h,s.cam.updateProjectionMatrix(),s.cam.position.set(0,a*.55,a*1.75),s.cam.lookAt(0,0,0);let o=n.renderer,l=o.getPixelRatio(),c=r.x*i,h=(t-r.y-r.h)*i,u=r.w*i,d=r.h*i;o.setScissorTest(!0),o.setScissor(c/l,h/l,u/l,d/l),o.setViewport(c/l,h/l,u/l,d/l),o.autoClear=!1,o.clearDepth(),o.render(s.scene,s.cam),o.setScissorTest(!1),o.setViewport(0,0,o.domElement.width/l,o.domElement.height/l),o.autoClear=!0},uses3D:!0};at.flight={t:0,paused:!1,map:!1,pauseMenu:Jo([{label:"RESUME",action:()=>{at.flight.paused=!1}},{label:"CONTROLS",action:()=>Re.setState("controls",{back:"flight"})},{label:()=>`SOUND: ${ye.muted?"OFF":"ON"}`,action:()=>ye.toggleMute()},{label:()=>`INVERT PITCH: ${O.invert?"ON":"OFF"}`,action:()=>{O.invert=!O.invert,$o.set("invert",O.invert)}},{label:"QUIT TO TITLE (unsaved progress is lost)",action:()=>{at.flight.paused=!1,Re.setState("title")}}],260,520),enter(n){if(n&&n.resume){this.paused=!0;return}this.t=0,this.paused=!1,this.map=!1,XA.Main.setCursor(!1)},pause(){!this.paused&&Re.flight.mode==="fly"&&!Re.flight.dead&&(this.paused=!0,this.pauseMenu.sel=0,XA.Main.setCursor(!0),ye.setEngine(-1))},input(n,e,t){if(this.paused){if((O.key("Escape")||O.key("KeyP")||O.padHit(9))&&this.t>.1){this.paused=!1,XA.Main.setCursor(!1);return}Ko(this.pauseMenu,e);return}if((O.key("Tab")||O.padHit(8))&&(this.map=!this.map,this.map&&Kn.reset(),ye.sfx("menuMove"),XA.Main.setCursor(this.map)),this.map){Kn.input(n,e,t),(O.key("Escape")||O.padHit(1))&&(this.map=!1,XA.Main.setCursor(!1));return}(O.key("Escape")||O.key("KeyP")||O.padHit(9))&&this.pause()},update(n){if(!this.paused){if(this.t+=n,K.cmdr.time+=n,this.map){let e=new Set(O.keys),t=new Set(O.pressed),i=O.pad.connected,r=O.lastDevice,s=new Set(O.pad.pressed),a=O.mouse.buttons;O.keys.clear(),O.pressed.clear(),O.pad.connected=!1,O.pad.pressed.clear(),O.lastDevice="keyboard",O.mouse.buttons=0;let o=[O.mouse.clicked,O.mouse.rclicked,O.mouse.mclicked,O.mouse.wheel];O.mouse.clicked=O.mouse.rclicked=O.mouse.mclicked=!1,O.mouse.wheel=0,Re.flight.update(n);for(let l of e)O.keys.add(l);for(let l of t)O.pressed.add(l);for(let l of s)O.pad.pressed.add(l);O.pad.connected=i,O.lastDevice=r,O.mouse.buttons=a,[O.mouse.clicked,O.mouse.rclicked,O.mouse.mclicked,O.mouse.wheel]=o}else Re.flight.update(n);Zo(n)}},draw(n,e,t){xp(n,e,t,Re.flight,this.t),this.map&&(n.fillStyle="rgba(2,6,14,0.6)",n.fillRect(0,0,e,t),Kn.draw(n,e,t,this.t,70),Tt(n,"STAR MAP \xB7 Tab closes \xB7 then press H to jump",e/2,36,18,"#9ad8ff")),this.paused&&(n.fillStyle="rgba(2,6,14,0.7)",n.fillRect(0,0,e,t),Tt(n,"PAUSED",e/2,180,50,"#9ad8ff"),Qo(n,this.pauseMenu,e,performance.now()/1e3))},uses3D:!0};at.gameover={t:0,reason:"",menu:Jo([{label:"RELOAD LAST DOCKING SAVE",hidden:()=>!Ys("career"),action:()=>{qs("career")&&Re.dockAt(!0)}},{label:"END CAREER (HIGHSCORE)",action:()=>Re.endCareer("died")}],470,460),enter(n){this.t=0,this.reason=n||"",XA.Main.setCursor(!0),ye.playSong("void")},input(n,e){this.t>1&&Ko(this.menu,e)},update(n){this.t+=n;let e=Re.world;e.camera.parent===e.scene&&e.camera.rotateY(n*.02)},draw(n,e,t){n.fillStyle="rgba(10,0,0,0.5)",n.fillRect(0,0,e,t),Tt(n,"GAME OVER",e/2,170,64,"#ff5050");let i=K.cmdr;ce(n,`Commander ${i.name} \xB7 ${Ui(i.killPts)} \xB7 Score ${Ze.fmt(i.score)}`,e/2,250,20,"#ffffff","center"),ce(n,`${i.kills} kills \xB7 ${i.visited.length} systems visited \xB7 ${Ze.cr(i.credits)} Cr`,e/2,285,18,"#d8eeff","center"),ce(n,"Reloading continues from the last time you docked (with the score you had then).",e/2,420,16,"#7aa8c8","center"),this.t>1&&Qo(n,this.menu,e,this.t)},uses3D:!0};at.highscores={t:0,mark:-1,enter(n){this.t=0,this.mark=n&&n.mark!==void 0?n.mark:-1,ye.playSong("title"),XA.Main.setCursor(!0)},input(){this.t>.4&&(O.hit("confirm")||O.hit("back")||O.mouse.clicked)&&(ye.sfx("menuBack"),Re.setState("title"))},update(n){this.t+=n,at.title.update(n)},draw(n,e,t){n.fillStyle="rgba(2,4,10,0.6)",n.fillRect(0,0,e,t),Tt(n,"HALL OF LEGENDS",e/2,80,44,"#9ad8ff"),ni(n,e/2-420,130,840,500),ce(n,"RANK",e/2-360,160,14,"#7aa8c8","center",Fe,700),ce(n,"COMMANDER",e/2-300,160,14,"#7aa8c8","left",Fe,700),ce(n,"RATING",e/2+90,160,14,"#7aa8c8","center",Fe,700),ce(n,"SCORE",e/2+380,160,14,"#7aa8c8","right",Fe,700),sn.list().forEach((i,r)=>{let s=200+r*42,a=r===this.mark&&Math.floor(this.t*4)%2===0,o=a?"#ffd040":r===0?"#9ad8ff":"#ffffff";ce(n,`${r+1}.`,e/2-360,s,20,o,"center",Fe,700),ce(n,i.name,e/2-300,s,22,o,"left",Fe,700),ce(n,i.rank||"",e/2+90,s,17,o,"center"),ce(n,Ze.fmt(i.score),e/2+380,s,22,o,"right",Fe,700)}),ce(n,"Press any button",e/2,t-40,16,"#7aa8c8","center")},uses3D:!0};var b0=["ABCDEFGHIJ","KLMNOPQRST","UVWXYZ0123","456789.-! "];at.nameentry={t:0,name:"",sel:0,rank:0,enter(){this.t=0,this.name=K.cmdr.name.slice(0,12),this.sel=0,this.rank=sn.rank(K.cmdr.score),XA.Main.setCursor(!0)},cells(n){let e=[];return b0.forEach((t,i)=>[...t].forEach((r,s)=>e.push({ch:r,x:n/2-330+s*66,y:320+i*62,w:58,h:52}))),e.push({ch:"DEL",x:n/2-330,y:568,w:190,h:52}),e.push({ch:"SAVE",x:n/2-124,y:568,w:250,h:52}),e.push({ch:"SKIP",x:n/2+142,y:568,w:190,h:52}),e},press(n){n==="DEL"?(this.name=this.name.slice(0,-1),ye.sfx("menuBack")):n==="SAVE"?this.save():n==="SKIP"?(ye.sfx("menuBack"),Re.setState("highscores")):this.name.length<12&&(this.name+=n,ye.sfx("menuMove"))},save(){let n=this.name.trim()||K.cmdr.name,e=sn.add({name:n,score:K.cmdr.score,rank:Ui(K.cmdr.killPts)});ye.sfx("menuOk"),Re.setState("highscores",{mark:e})},input(n,e){for(let l of O.typed){let c=l.toUpperCase();/^[A-Z0-9 .\-!]$/.test(c)&&this.name.length<12&&(this.name+=c,ye.sfx("menuMove"))}if(O.pressed.has("Backspace")&&(this.name=this.name.slice(0,-1),ye.sfx("menuBack")),O.pressed.has("Enter")||O.pressed.has("NumpadEnter")){this.save();return}if(O.pressed.has("Escape")){ye.sfx("menuBack"),Re.setState("highscores");return}let t=this.cells(e),i=l=>O.rep.has("Arrow"+l[0].toUpperCase()+l.slice(1))||O.pad.dir.has(l)||O.pad.pressed.has({up:12,down:13,left:14,right:15}[l]),r=l=>l>=40?4:Math.floor(l/10),s=l=>l>=40?l-40:l%10,a=this.sel;i("right")&&(a=a>=40?40+(a-40+1)%3:r(a)*10+(s(a)+1)%10),i("left")&&(a=a>=40?40+(a-40+2)%3:r(a)*10+(s(a)+9)%10),i("down")&&(a=a>=40?Math.min(9,(a-40)*4):a>=30?40+Math.min(2,Math.floor(s(a)/3.4)):a+10),i("up")&&(a=a>=40?30+(a-40)*4:a<10?40+Math.min(2,Math.floor(a/3.4)):a-10),a!==this.sel&&(this.sel=a,ye.sfx("menuMove"));let o=-1;t.forEach((l,c)=>{jt(O.mouse,l.x,l.y,l.w,l.h)&&(o=c)}),O.mouse.moved&&o>=0&&(this.sel=o),(O.pad.pressed.has(0)||O.mouse.clicked&&o>=0)&&this.press(t[this.sel].ch),O.pad.pressed.has(1)&&this.press("DEL"),O.pad.pressed.has(9)&&this.save()},update(n){this.t+=n},draw(n,e,t){n.fillStyle="rgba(2,4,10,0.75)",n.fillRect(0,0,e,t),Tt(n,"NEW HIGHSCORE",e/2,80,44,"#ffd040"),ce(n,`Rank ${this.rank+1} with ${Ze.fmt(K.cmdr.score)} points`,e/2,135,22,"#ffffff","center"),ce(n,"Enter your name for the Hall of Legends \u2013 or skip it.",e/2,168,18,"#9ac8e8","center"),ni(n,e/2-260,200,520,80),ce(n,this.name+(this.name.length<12&&Math.floor(this.t*2.5)%2?"_":" "),e/2,242,36,"#ffffff","center",Fe,700),this.cells(e).forEach((i,r)=>{let s=r===this.sel;n.fillStyle=s?"rgba(58,160,255,0.7)":i.ch.length>1?"rgba(58,160,255,0.3)":"rgba(6,14,30,0.85)",n.fillRect(i.x,i.y,i.w,i.h),n.strokeStyle=s?"#ffffff":"rgba(90,216,255,0.4)",n.strokeRect(i.x+.5,i.y+.5,i.w-1,i.h-1),ce(n,i.ch===" "?"\u2423":i.ch,i.x+i.w/2,i.y+i.h/2+1,i.ch.length>1?16:22,"#ffffff","center",Fe,700)}),ce(n,"Type with the keyboard \xB7 Enter saves \xB7 Esc skips \xB7 Gamepad: A types, B deletes, Start saves",e/2,t-30,16,"#7aa8c8","center")},uses3D:!0};at.options={t:0,back:"title",menu:Jo([{label:()=>`MUSIC  \u25C2 ${Math.round(ye.musicVol*10)} \u25B8`,adjust:n=>{ye.setMusicVol(Ze.clamp(Math.round(ye.musicVol*10+n)/10,0,1)),ye.sfx("menuMove")}},{label:()=>`SOUND  \u25C2 ${Math.round(ye.sfxVol*10)} \u25B8`,adjust:n=>{ye.setSfxVol(Ze.clamp(Math.round(ye.sfxVol*10+n)/10,0,1)),ye.sfx("pulse")}},{label:()=>`INVERT PITCH  \u25C2 ${O.invert?"ON":"OFF"} \u25B8`,adjust:()=>{O.invert=!O.invert,$o.set("invert",O.invert),ye.sfx("menuMove")}},{label:()=>`GRAPHICS  \u25C2 ${["FAST","NICE","ULTRA"][Re.quality]} \u25B8`,adjust:n=>{Re.setQuality((Re.quality+n+3)%3),ye.sfx("menuMove")}},{label:"TOGGLE FULLSCREEN",action:()=>XA.Main.toggleFullscreen()},{label:"BACK",action:()=>at.options.leave()}],200),enter(n){this.t=0,this.back=n&&n.back||"title",this.menu.sel=0},leave(){this.back==="flight"?Re.setState("flight",{resume:!0}):Re.setState(this.back)},input(n,e){if(O.hit("back")){ye.sfx("menuBack"),this.leave();return}Ko(this.menu,e)},update(n){this.t+=n,this.back==="title"&&at.title.update(n)},draw(n,e,t){n.fillStyle="rgba(2,4,10,0.65)",n.fillRect(0,0,e,t),Tt(n,"OPTIONS",e/2,120,44,"#9ad8ff"),Qo(n,this.menu,e,this.t),ce(n,"Left / right changes a value \xB7 Esc goes back",e/2,t-40,16,"#7aa8c8","center")},uses3D:!0};at.controls={t:0,back:"title",enter(n){this.t=0,this.back=n&&n.back||"title"},input(){this.t>.2&&(O.hit("back")||O.hit("confirm")||O.mouse.clicked||O.padHit(0))&&(ye.sfx("menuBack"),this.back==="flight"?Re.setState("flight",{resume:!0}):Re.setState(this.back))},update(n){this.t+=n,this.back==="title"&&at.title.update(n)},draw(n,e,t){n.fillStyle="rgba(2,4,10,0.82)",n.fillRect(0,0,e,t),Tt(n,"CONTROLS",e/2,50,36,"#9ad8ff");let i=Math.min(420,(e-80)/3),r=(e-i*3)/2;[["KEYBOARD",[["W / \u2191, S / \u2193","dive / climb"],["A / \u2190, D / \u2192","roll"],["Q / E","yaw"],["Shift / X","faster / slower"],["Space","fire laser"],["T / M","target lock / missile"],["Z","E.C.M."],["J","jump drive (in system)"],["Tab","star map"],["H / G","hyperspace / galactic jump"],["L","docking computer"],["B","energy bomb"],["Delete","escape pod"],["1\u20134, 5 / C","views, chase camera"],["Esc / P","pause"],["F / N","fullscreen / mute"]]],["MOUSE",[["cursor offset","steers (pitch, roll, yaw)"],["left button","fire laser"],["right button","lock + fire missile"],["middle button","cycle targets"],["wheel","throttle"],["",""],["IN MENUS",""],["click","select, buy, sell"],["wheel","zoom the star map"]]],["GAMEPAD",[["left stick","pitch and roll"],["right stick","yaw"],["RT / LT","faster / slower"],["A","fire laser"],["B / X","missile / target"],["Y","jump drive"],["LB","E.C.M."],["RB","chase camera"],["D-pad \u2191","hyperspace"],["D-pad \u2193","docking computer"],["D-pad \u2190","energy bomb"],["D-pad \u2192","rear view"],["Back","star map"],["Start","pause"]]]].forEach(([a,o],l)=>{let c=r+l*i;ni(n,c+8,85,i-16,t-175),ce(n,a,c+24,108,15,ui,"left",Fe,700),o.forEach(([h,u],d)=>{ce(n,h,c+24,140+d*27,16,"#ffd060"),ce(n,u,c+i-26,140+d*27,16,"#ffffff","right")})}),Js(n,"Docking by hand: fly to the station, line up with the glowing slot on the hub, roll with the station's spin and fly in slowly. Or buy a docking computer. Hyperspace: open the star map (Tab), pick a system in range, close the map and press H. Fly away from the station before using the jump drive (J).",40,t-72,e-80,22,16,"#bfe6ff")},uses3D:!0};var{U:w0,Store:$h}=window.XA,Wi=window.XA.Input,Jh=window.XA.Audio,E0=document.getElementById("gl"),ei=document.getElementById("hud"),nt=ei.getContext("2d"),He={W:1280,H:720,scale:1,ox:0,oy:0,dpr:1},At=window.XA.Main={state:"boot"},Ni=at.boot;function T0(n){let e=()=>{let t=ei.width=window.innerWidth,i=ei.height=window.innerHeight;nt.fillStyle="#02040a",nt.fillRect(0,0,t,i),nt.textAlign="center",nt.textBaseline="middle",nt.fillStyle="#9ad8ff",nt.font="700 34px Orbitron, Arial, sans-serif",nt.fillText("STARHAUL",t/2,i/2-120),nt.fillStyle="#ff8a7a",nt.font="600 24px Rajdhani, Arial, sans-serif",nt.fillText("Your browser could not start WebGL, which this 3D game needs.",t/2,i/2-60),nt.fillStyle="#d8eeff",nt.font="500 19px Rajdhani, Arial, sans-serif",["Chrome: open chrome://settings/system and switch on \u201CUse graphics acceleration when available\u201D, then restart Chrome.","Then check chrome://gpu \u2013 \u201CWebGL\u201D should say \u201CHardware accelerated\u201D.","If your graphics card is blocked on Linux, try chrome://flags/#ignore-gpu-blocklist (\u201COverride software rendering list\u201D).","Firefox usually works as well."].forEach((s,a)=>nt.fillText(s,t/2,i/2+a*30)),nt.fillStyle="#7aa8c8",nt.font="500 15px monospace",nt.fillText(String(n&&n.message||n).slice(0,140),t/2,i/2+160)};e(),window.addEventListener("resize",e)}var gt;try{gt=new Ho(E0)}catch(n){throw T0(n),n}var Bt=new Xo(gt),il={world:gt,flight:Bt,quality:$h.get("quality",1),setState:Xi,dockAt:C0,launch:I0,endCareer:L0,setQuality:A0};Mp(il);function Xi(n,e){At.state=n,Ni=at[n],Ni.enter&&Ni.enter(e)}At.setState=Xi;function Kh(){let n=window.innerWidth,e=window.innerHeight,t=il.quality,i=Math.min(window.devicePixelRatio||1,t===0?.75:t===1?1.5:2);gt.resize(n,e,i),gt.bloom.enabled=t>0;let r=Math.min(window.devicePixelRatio||1,2);ei.width=Math.round(n*r),ei.height=Math.round(e*r),ei.style.width=n+"px",ei.style.height=e+"px",He.H=720,He.W=Math.max(1120,Math.round(720*n/e)),He.scale=Math.min(ei.width/He.W,ei.height/He.H),He.ox=(ei.width-He.W*He.scale)/2,He.oy=(ei.height-He.H*He.scale)/2,He.dpr=r}function A0(n){il.quality=n,$h.set("quality",n),Kh()}window.addEventListener("resize",Kh);Kh();Wi.attachMouse(ei,(n,e)=>{let t=(n*He.dpr-He.ox)/He.scale,i=(e*He.dpr-He.oy)/He.scale;return{x:t,y:i,nx:(t-He.W/2)/(He.H/2),ny:(i-He.H/2)/(He.H/2)}});Wi.onGesture=()=>Jh.init();At.toggleFullscreen=function(){if(document.fullscreenElement)document.exitFullscreen&&document.exitFullscreen();else{let n=document.documentElement,e=n.requestFullscreen||n.webkitRequestFullscreen;if(e){let t=e.call(n,{navigationUI:"hide"});t&&t.catch&&t.catch(()=>{})}}};At.setCursor=n=>{ei.style.cursor=n?"default":"crosshair"};document.addEventListener("visibilitychange",()=>{document.hidden&&At.state==="flight"&&at.flight.pause()});window.addEventListener("blur",()=>{At.state==="flight"&&at.flight.pause()});var Qn=null;function R0(n){let e=it();if(gt.sys&&gt.sys.sys===e&&gt.sys.planet){n();return}Qn={t:0},gt.buildSystem(e).then(()=>{Qn=null,n()})}function C0(){P0&&void 0,R0(()=>{Bt.resetPlayer(),Bt.player.visible=!0,Bt.mode="docked",Bt.S=gt.sys,Ws(),Xi("docked",{tab:1})})}function P0(){}function I0(){let n=K.cmdr,e=Xs();e>0&&(n.legal=Math.min(255,n.legal+e),xe("Customs logged your illegal cargo","#ff9040",4)),Di("career"),Bt.resetPlayer(),Bt.S=gt.sys,Bt.setView(0),Bt.begin("launch"),Xi("flight")}Bt.cb.dock=()=>{let n=K.cmdr;if(n.legal>0&&n.legal<50){let e=n.legal*10;(K.cheat||n.credits>=e)&&(K.cheat||(n.credits=Math.round((n.credits-e)*10)/10),n.legal=0,xe(`Fine paid: ${e} Cr \u2013 your record is clean`,"#ffd060",4))}Bt.resetPlayer(),Ws(),Di("career"),Xi("docked",{tab:1})};Bt.cb.hyper=n=>{gt.buildSystem(it()).then(n)};Bt.cb.arrived=()=>{xe(`Welcome to ${it().name}`,"#9ad8ff",3)};Bt.cb.death=()=>{K.cmdr.deaths++,Xi("gameover")};Bt.cb.escape=()=>{let n=K.cmdr;n.ship="kestrel",n.cargo={},n.cost={},n.equip={},n.lasers={front:"pulse",rear:null},n.missiles=0,n.legal=0,n.fuel=7,xe("Your insurance replaced your ship with a Kestrel Mk II","#ffd060",5),Bt.resetPlayer(),Ws(),Di("career"),Xi("docked",{tab:6})};function L0(){let n=K.cmdr;$h.set("save.career",null),!n.cheated&&!K.cheat&&sn.rank(n.score)>=0?Xi("nameentry"):Xi("highscores")}var Ks="",U0=[77,73,76,75,89,87,65,89].map(n=>String.fromCharCode(n)).join(""),D0=["p12","p12","p13","p13","p14","p15","p14","p15","p1","p0"].join(",");function wp(){K.cheat=!K.cheat,K.cheat&&K.cmdr&&(K.cmdr.cheated=!0),Jh.sfx(K.cheat?"secret":"secretOff")}function N0(){if(At.state==="nameentry"||At.state==="newcareer"){Ks="";return}for(let n of Wi.typed)Ks=(Ks+n.toUpperCase()).slice(-12);Ks.endsWith(U0)&&(Ks="",wp()),Wi.seq.length>=10&&Wi.seq.slice(-10).join(",")===D0&&(Wi.seq.length=0,wp())}function O0(){At.state==="nameentry"||At.state==="newcareer"||At.state==="flight"&&at.flight.map||At.state==="docked"&&at.docked.tab===4||(Wi.pressed.has("KeyF")&&At.toggleFullscreen(),Wi.pressed.has("KeyN")&&Jh.toggleMute())}var Gi=null,el=!1,Ep=0,Tp=0;function k0(){if(!navigator.wakeLock||el)return;Gi&&Gi.released&&(Gi=null);let n=At.state==="flight"&&!at.flight.paused&&!document.hidden;if(n&&!Gi){if(performance.now()<Ep)return;el=!0,navigator.wakeLock.request("screen").then(e=>{Gi=e,el=!1,e.addEventListener("release",()=>{Gi===e&&(Gi=null)})}).catch(()=>{el=!1,Ep=performance.now()+3e3})}else if(!n&&Gi){let e=Gi;Gi=null,e.release().catch(()=>{})}}var Ap=performance.now(),tl=0;function Rp(n){if(Qn){Qn.t+=n;return}Ni.update&&Ni.update(n),At.state!=="flight"&&Zo(n)}function Cp(n){requestAnimationFrame(Cp);let e=(n-Ap)/1e3;Ap=n,e=w0.clamp(e,0,.05),tl+=e,(Tp-=e)<=0&&(Tp=.5,k0()),Wi.poll(e),N0(),O0();try{!Qn&&Ni.input&&Ni.input(e,He.W,He.H),Rp(e),F0(e)}finally{Wi.endFrame()}}function F0(n){Ni.uses3D&&(gt.sys&&gt.sys.planet||Bt.mode==="jump")?(gt.update(n,tl),gt.render(),Ni.render3D&&Ni.render3D(gt,He.W,He.H,He.scale)):(gt.renderer.setClearColor(132106),gt.renderer.clear()),nt.setTransform(1,0,0,1,0,0),nt.clearRect(0,0,ei.width,ei.height),nt.setTransform(He.scale,0,0,He.scale,He.ox,He.oy),Ni.draw(nt,He.W,He.H),Qn&&(nt.fillStyle="rgba(2,4,10,0.6)",nt.fillRect(0,0,He.W,He.H),nt.font="700 22px Orbitron, Arial",nt.textAlign="center",nt.fillStyle="#9ad8ff",nt.fillText("Charting the system"+".".repeat(1+Math.floor(Qn.t*3)%3),He.W/2,He.H/2))}At.simulate=function(n){let e=Math.round(n*60);for(let t=0;t<e;t++)Rp(1/60),tl+=1/60,gt.sys&&gt.sys.planet&&gt.update(1/60,tl)};At.ctx=il;At.ST=Yh;At.GX=Wh;function Zh(){Xi("boot"),requestAnimationFrame(Cp)}document.fonts&&document.fonts.load?Promise.race([Promise.all([document.fonts.load("700 20px Orbitron"),document.fonts.load("600 20px Rajdhani")]),new Promise(n=>setTimeout(n,1500))]).then(Zh,Zh):Zh();})();
/**
 * @license
 * Copyright 2010-2024 Three.js Authors
 * SPDX-License-Identifier: MIT
 */
