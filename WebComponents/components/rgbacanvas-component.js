class RgbaCanvas extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({mode:'open'});
    this.shadowRoot.innerHTML = `
      <style>
        :host { display:block; border:1px solid #888; }
        canvas { width:100%; height:100%; display:block; cursor:crosshair; }
      </style>
      <canvas></canvas>
    `;

    this.canvas = this.shadowRoot.querySelector('canvas');
    this.ctx = this.canvas.getContext('2d');

    // Default settings
    this.settings = {
      width: 256,
      height: 256,
      undoDepth: 10,
      name: 'image'
    };

    this.active = { r:true, g:false, b:false, a:false };
    this.visible = { r:true, g:true, b:true, a:false };
    this.layerNames = { r:'R', g:'G', b:'B', a:'A' };
    this.undoStack = [];
    this.redoStack = [];
  }

  connectedCallback() {
    this.init();
  }

  init(options={}) {
    Object.assign(this.settings, options);
    this.width = parseInt(this.getAttribute('width')||this.settings.width);
    this.height = parseInt(this.getAttribute('height')||this.settings.height);

    this.canvas.width = this.width;
    this.canvas.height = this.height;

    this.initLayers();
    this.bindEvents();
    this.render();
  }

  initLayers() {
    const size = this.width * this.height;
    this.layers = {
      r: new Uint8Array(size),
      g: new Uint8Array(size),
      b: new Uint8Array(size),
      a: new Uint8Array(size)
    };
  }

  bindEvents() {
    let drawing = false, last = null;
    const toXY = e=>{
      const rect = this.canvas.getBoundingClientRect();
      return [
        Math.floor((e.clientX-rect.left)*this.width/rect.width),
        Math.floor((e.clientY-rect.top)*this.height/rect.height)
      ];
    };

    this.canvas.addEventListener('mousedown', e=>{
      drawing = true;
      last = toXY(e);
      this.saveState();
      this.setPixel(...last);
      this.render();
    });

    this.canvas.addEventListener('mousemove', e=>{
      if(!drawing) return;
      const now = toXY(e);
      this.drawLine(last, now);
      last = now;
      this.render();
    });

    window.addEventListener('mouseup', ()=>drawing=false);
  }

  saveState() {
    this.undoStack.push(structuredClone(this.layers));
    if(this.undoStack.length>this.settings.undoDepth) this.undoStack.shift();
    this.redoStack = [];
  }

  undo() {
    const prev = this.undoStack.pop();
    if(prev){
      this.redoStack.push(structuredClone(this.layers));
      this.layers = prev;
      this.render();
    }
  }

  redo() {
    const next = this.redoStack.pop();
    if(next){
      this.undoStack.push(structuredClone(this.layers));
      this.layers = next;
      this.render();
    }
  }

  drawLine(p1,p2){
    const [x1,y1]=p1, [x2,y2]=p2;
    const dx = Math.abs(x2-x1), dy = Math.abs(y2-y1);
    const sx = x1<x2?1:-1, sy=y1<y2?1:-1;
    let err = dx-dy, x=x1, y=y1;
    while(true){
      this.setPixel(x,y);
      if(x===x2 && y===y2) break;
      const e2=2*err;
      if(e2>-dy){ err-=dy; x+=sx;}
      if(e2<dx){ err+=dx; y+=sy;}
    }
  }

  setPixel(x,y){
    if(x<0 || y<0 || x>=this.width || y>=this.height) return;
    const i=y*this.width+x;
    for(const c of ['r','g','b','a']){
      if(this.active[c]) this.layers[c][i]=255;
    }
  }

  render(){
    const img = this.ctx.createImageData(this.width,this.height);
    const data = img.data;
    let i=0;
    for(let p=0;p<this.width*this.height;p++){
      data[i++] = (this.visible.r && this.layers.r)?this.layers.r[p]:0;
      data[i++] = (this.visible.g && this.layers.g)?this.layers.g[p]:0;
      data[i++] = (this.visible.b && this.layers.b)?this.layers.b[p]:0;
      data[i++] = (this.visible.a && this.layers.a)?this.layers.a[p]:255;
    }
    this.ctx.putImageData(img,0,0);
  }

  setActive(channels){ for(const c in this.active)this.active[c]=channels.includes(c); }
  setVisible(channels){ for(const c in this.visible)this.visible[c]=channels.includes(c); this.render(); }

  getLayerDataText(){
    return ['r','g','b','a'].map(c=>Array.from(this.layers[c]).join(',')).join('|');
  }

  // Laden / Speichern
  saveImage(filename=null){
    const name = filename || this.settings.name;
    const link=document.createElement('a');
    link.download = name+'.png';
    link.href = this.canvas.toDataURL('image/png');
    link.click();
  }

  loadImage(file){
    const img = new Image();
    const reader = new FileReader();
    reader.onload = e=>{
      img.onload = ()=>{
        this.saveState();
        this.ctx.clearRect(0,0,this.width,this.height);
        this.ctx.drawImage(img,0,0,this.width,this.height);
        // Übernehme Pixel in layers
        const imgData=this.ctx.getImageData(0,0,this.width,this.height).data;
        for(let i=0;i<this.width*this.height;i++){
          this.layers.r[i]=imgData[i*4];
          this.layers.g[i]=imgData[i*4+1];
          this.layers.b[i]=imgData[i*4+2];
          this.layers.a[i]=imgData[i*4+3];
        }
        this.render();
      };
      img.src=e.target.result;
    };
    reader.readAsDataURL(file);
  }
}

customElements.define('rgba-canvas',RgbaCanvas);
