javascript:(function(){
  if(window.__btnBookmarkletActive)return;window.__btnBookmarkletActive=true;
  const SVG_NS="http://www.w3.org/2000/svg";
  // Overlay erstellen
  const overlay=document.createElement("div");
  Object.assign(overlay.style,{
    position:"fixed",top:"10px",right:"10px",width:"50px",height:"50px",
    background:"transparent",cursor:"pointer",zIndex:9999999,
    display:"flex",alignItems:"center",justifyContent:"center",
  });
  // Hand SVG erstellen
  const svg=document.createElementNS(SVG_NS,"svg");
  svg.setAttribute("viewBox","0 0 24 24");
  svg.setAttribute("width","40");
  svg.setAttribute("height","40");
  const path=document.createElementNS(SVG_NS,"path");
  path.setAttribute("fill","black");
  path.setAttribute("d","M6 2c-1.1 0-2 .9-2 2v9.5c0 .8.7 1.5 1.5 1.5S7 14.3 7 13.5V8h1v6.5c0 .8.7 1.5 1.5 1.5S11 15.3 11 14.5V5h1v7.5c0 .8.7 1.5 1.5 1.5S15 13.3 15 12.5V4h1v7.5c0 .8.7 1.5 1.5 1.5S19 12.3 19 11.5V4c0-1.1-.9-2-2-2H6z");
  svg.appendChild(path);
  overlay.appendChild(svg);
  document.body.appendChild(overlay);

  // WebAudio Setup
  const audioCtx=new (window.AudioContext||window.webkitAudioContext)();
  function playTone(freq,duration){
    const oscillator=audioCtx.createOscillator();
    oscillator.type="sine";
    oscillator.frequency.setValueAtTime(freq,audioCtx.currentTime);
    oscillator.connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime+duration);
  }

  let blinkTimeout;
  function blinkHand(){
    path.setAttribute("fill","white");
    blinkTimeout=setTimeout(()=>path.setAttribute("fill","black"),1000);
  }

  function removeBookmarklet(){
    clearInterval(interval);
    clearTimeout(blinkTimeout);
    document.body.removeChild(overlay);
    window.__btnBookmarkletActive=false;
  }
  overlay.addEventListener("click",removeBookmarklet);

  // Suche und Klick-Intervall
  const interval=setInterval(()=>{
    const buttons=document.querySelectorAll("button.btn.relative.btn-secondary.btn-small.py-2.whitespace-nowrap");
    for(const btn of buttons){
      if(btn.textContent.trim()==="Generierung fortsetzen"){
        btn.click();
        blinkHand();
        playTone(220,0.5);
        break;
      }
    }
  },500);
})();

