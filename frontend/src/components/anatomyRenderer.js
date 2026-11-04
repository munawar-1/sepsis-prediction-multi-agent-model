// Interleaved triangle vertices: xyz signed shorts, surface normal signed bytes,
// and one byte identifying skin, bone, lung, vessel, myocardium or digestive tissue.
const vertexSource = `
attribute vec3 position, normal;
attribute float tissue;
uniform vec4 camera;
uniform mediump float bloomSize;
varying vec3 surface, direction;
varying float group;
void main() {
  float c=cos(camera.x), s=sin(camera.x), t=cos(camera.w), u=sin(camera.w);
  mat3 yaw=mat3(c,0.,-s, 0.,1.,0., s,0.,c);
  mat3 pitch=mat3(1.,0.,0., 0.,t,u, 0.,-u,t);
  vec3 center=bloomSize>0.?vec3(.034,.52,.06):position;
  vec3 p=pitch*yaw*center;
  gl_PointSize=max(1.,bloomSize);
  direction=pitch*yaw*normal; surface=position; group=tissue;
  gl_Position=vec4(p.x*camera.y*.94,p.y*.94+camera.z,-p.z*.4,1.-.16*p.z);
}`;
const fragmentSource = `
precision mediump float;
varying vec3 surface,direction;
varying float group;
uniform vec4 light;
uniform mediump float bloomSize;
void main(){
  if(bloomSize>0.){
    float r=length(gl_PointCoord-.5)*2.;
    float energy=exp(-5.*r*r)*max(0.,1.-r);
    gl_FragColor=vec4(1.,.25,.13,energy*(.32+.18*light.x+.12*light.y));
    return;
  }
  vec3 n=normalize(direction);
  float rim=pow(1.-abs(n.z),1.65);
  float key=.45+.55*abs(dot(n,normalize(vec3(-.56,.47,.68))));
  float contour=.5+.5*sin(surface.y*900.+surface.x*20.);
  vec3 color=mix(vec3(.035,.41,.68),vec3(.29,.95,1.),rim);
  float alpha=.052+.59*rim+.018*contour;
  if(group>.5 && group<1.5){color=vec3(.28,.77,.93);alpha=.06+.23*rim;}
  if(group>1.5 && group<2.5){color=mix(vec3(.04,.25,.63),vec3(.18,.83,1.),rim);alpha=.25+.52*rim+light.y*.12;}
  if(group>2.5 && group<3.5){color=vec3(.67,.22,.27);alpha=.36+.36*rim;}
  if(group>4.5){color=vec3(.12,.59,.76);alpha=.14+.33*rim;}
  if(group>3.5 && group<4.5){
    color=mix(vec3(.98,.10,.16),vec3(1.,.64,.4),rim+.13*light.x);
    alpha=.74+.18*rim;
    color*=.88+.19*light.x+.18*light.y;
  }
  color*=key+.19*rim+.12*light.z;
  gl_FragColor=vec4(color,alpha);
}`;

export async function createAtlas(host, signal) {
  const canvas = host.querySelector('canvas');
  const gl = canvas.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: true });
  if (!gl) return;
  const response = await fetch('/assets/anatomy-surfaces.bin.gz', { signal });
  if (!response.ok) return;
  let data = await response.arrayBuffer();
  const signature = new Uint8Array(data, 0, 2);
  if (signature[0] === 0x1f && signature[1] === 0x8b) {
    if (!window.DecompressionStream) return;
    const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream('gzip'));
    data = await new Response(stream).arrayBuffer();
  }
  if (!data.byteLength || data.byteLength % 30 !== 0) return;
  if (signal.aborted) return;
  const program = gl.createProgram();
  for (const [kind, source] of [[gl.VERTEX_SHADER, vertexSource], [gl.FRAGMENT_SHADER, fragmentSource]]) {
    const shader = gl.createShader(kind);
    gl.shaderSource(shader, source); gl.compileShader(shader);
    gl.attachShader(program, shader); gl.deleteShader(shader);
  }
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) { gl.deleteProgram(program); return; }
  gl.useProgram(program);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  for (const [name, size, type, normalized, offset] of [
    ['position',3,gl.SHORT,true,0], ['normal',3,gl.BYTE,true,6], ['tissue',1,gl.UNSIGNED_BYTE,false,9]
  ]) {
    const loc = gl.getAttribLocation(program,name);
    gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc,size,type,normalized,10,offset);
  }
  gl.enable(gl.BLEND); gl.blendFuncSeparate(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA,gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
  const camera = gl.getUniformLocation(program,'camera'), lighting = gl.getUniformLocation(program,'light');
  const bloom=gl.getUniformLocation(program,'bloomSize');
  let frame=0, pointer=0, vertical=0, organ=0, highlight=0, yaw=0, tilt=0, previous=0;
  const vertexCount = data.byteLength/10;
  function draw(time) {
    frame = requestAnimationFrame(draw);
    if (time - previous < 32) return;
    const follow=1-Math.exp(-Math.min(250,time-previous)/180);
    previous = time;
    const rect = host.getBoundingClientRect(), ratio = Math.min(devicePixelRatio,1.5);
    const width = Math.max(1,Math.round(rect.width*ratio)), height = Math.max(1,Math.round(rect.height*ratio));
    if (canvas.width !== width || canvas.height !== height) { canvas.width=width; canvas.height=height; }
    const progress = Math.max(-1,Math.min(1,(innerHeight/2-rect.top-rect.height/2)/innerHeight));
    yaw += (.13*Math.sin(time*.00032) + .32*progress + pointer*.80 - yaw)*follow;
    tilt += (vertical*.22-tilt)*follow;
    highlight += (organ-highlight)*follow;
    gl.viewport(0,0,width,height); gl.clearColor(0,0,0,0); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform4f(camera,yaw,height/width,.009*Math.sin(time*.0012),tilt);
    gl.uniform4f(lighting,Math.pow(Math.max(0,Math.sin(time*.005)),4),highlight,document.documentElement.dataset.theme==='light'?1:0,0);
    gl.uniform1f(bloom,0);
    gl.blendFuncSeparate(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA,gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
    gl.drawArrays(gl.TRIANGLES,0,vertexCount);
    gl.uniform1f(bloom,height*.14);
    gl.blendFuncSeparate(gl.SRC_ALPHA,gl.ONE,gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
    gl.drawArrays(gl.POINTS,0,1);
  }
  const move = e => {
    if(e.pointerType === 'touch')return;
    const r=host.getBoundingClientRect();
    pointer=(e.clientX-r.left)/r.width*2-1;
    vertical=(e.clientY-r.top)/r.height*2-1;
    organ=Math.exp(-pointer*pointer*18-(vertical+.42)*(vertical+.42)*24);
  };
  const leave = () => { pointer=vertical=organ=0; };
  const stop = () => { cancelAnimationFrame(frame); frame=0; };
  const lost = () => { stop(); host.dataset.ready='false'; };
  canvas.addEventListener('webglcontextlost',lost);
  host.addEventListener('pointermove',move); host.addEventListener('pointerleave',leave);
  return {
    available: () => !gl.isContextLost(),
    setActive(active) {
      if (active && !frame && !gl.isContextLost()) frame=requestAnimationFrame(draw);
      if (!active) stop();
    },
    dispose() {
      stop(); host.dataset.ready='false'; host.removeEventListener('pointermove',move);
      host.removeEventListener('pointerleave',leave); canvas.removeEventListener('webglcontextlost',lost);
      gl.deleteBuffer(buffer); gl.deleteProgram(program);
    }
  };
}
