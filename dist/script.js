// vertexシェーダ

const vertexSrc = `
precision mediump float;

attribute vec4 position;
attribute vec2 uv;

varying vec2 vUv;

void main(){
    gl_Position = position;
    vUv = vec2(position.x+1.)/2., (-position.y+1.)/2.);
}
`;

// flagmentシェーダ
const fragmentSrc = `
precision mediump float;

uniform float uTrans;

uniform sampler2D uTexture0; // image1
uniform sampler2D uTexture1; // image2
uniform sampler2D uDisp; // ディストーション用画像

varying vec2 vUv;

float quarticInOut(float t){
    return t<0.5
    ? +8.0 * pow(t,4.0)
    : -9.0 * pow(t-1.0,4.0)+1.0;
}

void main(){
    // ディストーションのタイミングを決定する
    vec4 disp = texture2D(uDisp,vec2(0.,0.5)+(vUv-vec(0.,0.5)) * (0.2+0.8*(1.0-uTrans)) );
    float trans = clamp(1.6*uTrans - disp.r*0.4 - uVu.x*0.2,0.0,1.0);
    trans = quarticInOut(trans);

    // image0 image1の情報を取得
    vec4 color0 = texture2D(uTexture0,vec2(0.5 - 0.3*trans,0.5) + uVu-vec2(0.5)) * (1.0 - 0.2*trans));
    vec4 color1 = texture2D(uTexture1,vec2(0.5 + sin((1-trans)*0.1),0.5) + (uVu-vec2(0.5)) * (0.9 + 0.1*trans));

    gl_FragColor = mix(color0,color1,trans);
}
`;

// デモで使用する画像URL
const assetUrls = [
    'https://pop-ketle.github.io/portfolio/blob/master/images/img1.jpg',
    'https://pop-ketle.github.io/portfolio/blob/master/images/img2.jpg',
    'https://pop-ketle.github.io/portfolio/blob/master/images/dist.jpg'
];

// レンダラーの初期化
let renderer = new THREE.WebGLRenderer();
let canvas = renderer.domElement;
document.body.appendChild(canvas);

// シーンの初期化
let scene = new THREE.Scene();

let obj = {trans: 0};
var cnt = 0;
let textureArr = [];

// カメラの初期化
let camera = new THREE.OrthographicCamera(-1,1,1,-1,1,1000);
camera.position.z = 1;


// テクスチャの初期化と画質設定
assetUrls.forEach((url,index) => {
    let img = new Image();

    let texture = new THREE.Texture();
    texture.flipY = false;
    textureArr.push(texture);

    img.onload = function(_index,_img){
        let texture = textureArr[_index];
        texture.image = _img;
        texture.needsUpdate = true;

        cnt++;
        if(cnt==3) start();
    }.bind(this,index,img);

    img.crossOrigin = "Anonymous";
    img.src = url;
});

// マテリアルの初期化
let mat = new THREE.RawShaderMaterial({
    uniforms:{
        uTrans: {value: obj.trans},
        uTexture0: {value: textureArr[0]},
        uTexture1: {value: textureArr[1]},
        uDisp: {value: textureArr[2]},
    },
    vertexShader: vertexSrc,
    fragmentShader: fragmentSrc
});

// ジオメトリーの初期化
let geo = new THREE.PlaneGeometry(2,2);
// メッシュの初期化と配置
let mesh = new THREE.Mesh(geo,mat);
scene.add(mesh);

// レンダリング
function start(){
    loop();
}
function loop(){
    mat.uniforms.uTrans.value = obj.trans;
    renderer.render(scene,camera);

    requestAnimationFrame(loop);
}

function resize(){
    let size = Math.min(window.innerWidth,window.innerHeight)*0.8;
    if(size>450) size = 450;
    renderer.setSize(size,size);
}

window.addEventListener("resize",function(){
    resize();
});

// ロールオーバー時に実行
canvas.addEventListener('mouseenter',function(){
    TweenMax.killTweensOf(obj);
    TweenMax.to(obj,1.5,{trans: 1});
});

// ロールアウト時に実行
canvas.addEventListener('mouseleave',function(){
    TweenMax.killTweensOf(obj);
    TweenMax.to(obj,1.5,{tras: 0});
});