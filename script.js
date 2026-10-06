const crops={
  Rice:{base:12,category:"Food Crop",season:"Kharif",emoji:"🌾",image:"rice.jpg"},
  Sugarcane:{base:14,category:"Cash Crop",season:"Year-round",emoji:"🌿",image:"sugarcane.jpg"},
  Wheat:{base:8,category:"Food Crop",season:"Rabi",emoji:"🌾",image:"wheat.jpg"},
  Maize:{base:9,category:"Food Crop",season:"Kharif",emoji:"🌽",image:"maize.jpg"},
  Cotton:{base:10,category:"Cash Crop",season:"Kharif",emoji:"🌿",image:"cotton.jpg"},
  Banana:{base:11,category:"Fruit Crop",season:"Year-round",emoji:"🍌",image:"banana.jpg"},
  Potato:{base:6,category:"Vegetable",season:"Rabi",emoji:"🥔",image:"potato.jpg"},
  Tomato:{base:7,category:"Vegetable",season:"Year-round",emoji:"🍅",image:"tomato.jpg"},
  Jute:{base:10,category:"Cash Crop",season:"Kharif",emoji:"🌿",image:"jute.jpg"},
  Groundnut:{base:8,category:"Cash Crop",season:"Kharif",emoji:"🌰",image:"groundnut.jpg"},
  Carrot:{base:6,category:"Vegetable",season:"Rabi",emoji:"🥕",image:"carrot.jpg"},
  Pepper:{base:7,category:"Spice Crop",season:"Year-round",emoji:"🌶️",image:"pepper.jpg"},
  Capsicum:{base:7,category:"Vegetable",season:"Year-round",emoji:"🫑",image:"capsicum.jpg"},
  Apple:{base:8,category:"Fruit Crop",season:"Year-round",emoji:"🍎",image:"apple.jpg"},
  Pineapple:{base:10,category:"Fruit Crop",season:"Year-round",emoji:"🍍",image:"pineapple.jpg"},
  Coffee:{base:9,category:"Cash Crop",season:"Year-round",emoji:"☕",image:"coffee.jpg"},
  Lemon:{base:7,category:"Fruit Crop",season:"Year-round",emoji:"🍋",image:"lemon.jpg"},
  Mango:{base:9,category:"Fruit Crop",season:"Year-round",emoji:"🥭",image:"mango.jpg"},
  Guava:{base:7,category:"Fruit Crop",season:"Year-round",emoji:"🍈",image:"guava.jpg"},
  Strawberry:{base:6,category:"Fruit Crop",season:"Rabi",emoji:"🍓",image:"strawberry.jpg"}
};
let crop="Wheat", moisture="dry";
let liveWeather=null;
const $=id=>document.getElementById(id);

function calculate(){
  const c=crops[crop];
  const w=liveWeather;

  // Calculation uses only the selected crop, live weather context and soil moisture.
  // Historical weather data and sensor streams are not used.
  let water=c.base;
  let temp=null, humidity=null, wind=null, code=null;

  if(w){
    temp=Number(w.temperature_2m);
    humidity=Number(w.relative_humidity_2m);
    wind=Number(w.wind_speed_10m);
    code=Number(w.weather_code);

    // Live weather adjustments.
    if(Number.isFinite(temp)) water += Math.max(-2,Math.min(2,(temp-28)*0.12));
    if(Number.isFinite(humidity)){
      if(humidity>=80) water-=1.0;
      else if(humidity>=65) water-=0.5;
      else if(humidity<40) water+=1.0;
    }
    if(Number.isFinite(wind) && wind>=20) water+=0.8;
    if([51,53,55,61,63,65,80,81,82,95,96,99].includes(code)) water-=2.5;
    if([65,82,95,96,99].includes(code)) water-=1.5;
  }

  // Soil moisture is a direct part of the calculation.
  // Dry soil increases irrigation demand, medium is neutral, wet soil reduces it.
  const soilFactor=moisture==="dry"?1.30:moisture==="medium"?1.00:0.65;
  water*=soilFactor;

  water=Math.max(2,Math.min(18,Math.round(water*10)/10));
  const level=water>=9?"HIGH":water>=6?"MEDIUM":"LOW";
  const badge=$("statusBadge");
  if(badge){ badge.textContent=level+" IRRIGATION"; badge.className="status "+level.toLowerCase(); }
  $("waterValue").textContent=Math.round(water);
  $("litres").textContent=`≈ ${Math.round(water)} L/m² per day`;
  $("resultTitle").textContent=level==="HIGH"?"High irrigation needed":level==="MEDIUM"?"Moderate irrigation needed":"Low irrigation needed";

  if(w){
    const rain=[51,53,55,61,63,65,80,81,82,95,96,99].includes(code);
    const soilLabel=moisture==="dry"?"dry":moisture==="medium"?"moderately moist":"wet";
    $("resultText").textContent=rain
      ?`Current live weather indicates rain or showers, and the soil is ${soilLabel}, so irrigation demand is reduced accordingly.`
      :`Live weather and the current ${soilLabel} soil-moisture condition are used together to estimate irrigation demand.`;
  }else{
    $("resultText").textContent="Waiting for live weather. The irrigation estimate will update when current weather data is available.";
  }

  $("frequency").textContent=level==="HIGH"?"Daily":level==="MEDIUM"?"Every 1–2 days":"As required";
  $("duration").textContent=Math.max(10,Math.round(water*2+5))+" minutes";
  $("waterValue").parentElement.style.background=`conic-gradient(#27975a 0 ${Math.min(88,water*7)}%,#e8efe9 ${Math.min(88,water*7)}% 100%)`;

  /*
   * Smart Suggestions
   * Show a small set of prioritized, actionable recommendations based on
   * crop + live weather + soil moisture. Avoid generic status messages.
   */
  const tips=[];
  const rainCodes=[51,53,55,56,57,61,63,65,66,67,80,81,82,95,96,99];
  const isRain=rainCodes.includes(code);
  const isHot=Number.isFinite(temp) && temp>=32;
  const isVeryHot=Number.isFinite(temp) && temp>=36;
  const isDryAir=Number.isFinite(humidity) && humidity<40;
  const isHumid=Number.isFinite(humidity) && humidity>=75;
  const isWindy=Number.isFinite(wind) && wind>=20;
  const cropInfo=crops[crop] || {base:8,category:"Crop"};
  const highDemandCrops=["Sugarcane","Rice","Banana","Pineapple"];
  const moderateDemandCrops=["Maize","Cotton","Jute","Groundnut","Coffee","Mango","Apple","Wheat"];
  const cropDemand=highDemandCrops.includes(crop)?"high":moderateDemandCrops.includes(crop)?"medium":"moderate";

  function addTip(text){ if(tips.length<3) tips.push(text); }

  if(isRain){
    if(moisture==="wet"){
      addTip(`Do not irrigate ${crop} now. Rain and wet soil already provide enough water.`);
      addTip(`Check the soil again after the rain before restarting irrigation.`);
    }else{
      addTip(`Delay irrigation for ${crop}. Current rain is reducing its immediate water need.`);
      addTip(`Recheck soil moisture after the rain and irrigate only if it remains dry.`);
    }
    if(isWindy) addTip(`Avoid exposed or windy irrigation periods because wind can increase water loss.`);
  }else if(moisture==="wet"){
    addTip(`Do not irrigate ${crop} now. Soil moisture is already high.`);
    addTip(`Allow the soil to drain and dry naturally before the next irrigation.`);
    if(isHumid) addTip(`Humid weather will slow evaporation, so wait longer before adding water.`);
    else addTip(`Recheck the soil before watering again rather than following a fixed schedule.`);
  }else if(moisture==="dry"){
    if(isVeryHot || (isHot && isDryAir)){
      addTip(`Irrigate ${crop} soon because dry soil and hot, dry conditions are increasing water demand.`);
      addTip(`Irrigate in the early morning or evening to reduce evaporation.`);
      if(isWindy) addTip(`Avoid windy midday irrigation because it can increase water loss.`);
      else addTip(`Apply the calculated water requirement gradually instead of overwatering at once.`);
    }else if(isWindy){
      addTip(`Irrigate ${crop} soon because the soil is dry and wind is increasing water loss.`);
      addTip(`Prefer early morning or evening irrigation.`);
      addTip(`Use the calculated irrigation amount rather than adding extra water for the wind.`);
    }else if(cropDemand==="high"){
      addTip(`${crop} needs priority irrigation because the soil is dry and this crop has a higher water demand.`);
      addTip(`Prefer early morning or evening irrigation for better water use.`);
      addTip(`Recheck soil moisture after irrigation before adding more water.`);
    }else{
      addTip(`Irrigate ${crop} soon because the soil is dry.`);
      addTip(`Prefer early morning or evening irrigation to reduce water loss.`);
      addTip(`Recheck soil moisture after irrigation before watering again.`);
    }
  }else{ // medium soil
    if(isVeryHot){
      addTip(`Monitor ${crop} closely because hot weather can dry the medium-moisture soil quickly.`);
      addTip(`Prepare for light irrigation if the soil begins to dry.`);
      addTip(`Prefer early morning or evening if irrigation becomes necessary.`);
    }else if(isHot || isDryAir){
      addTip(`Watch ${crop} for drying because current weather is increasing water demand.`);
      addTip(`Use light, controlled irrigation only when the soil starts to dry.`);
      if(isWindy) addTip(`Prefer early morning or evening because wind can increase water loss.`);
      else addTip(`Avoid unnecessary extra watering while the soil remains moderately moist.`);
    }else if(isHumid){
      addTip(`No heavy irrigation is needed for ${crop}. Soil moisture is moderate and humid weather slows water loss.`);
      addTip(`Wait and reassess the soil before the next irrigation.`);
      addTip(`Avoid keeping the soil continuously saturated.`);
    }else if(cropDemand==="high"){
      addTip(`Keep ${crop} at steady moisture because it has a higher water demand.`);
      addTip(`Use light irrigation when the soil begins to dry rather than waiting for severe dryness.`);
      addTip(`Recheck soil moisture before each irrigation cycle.`);
    }else{
      addTip(`No immediate heavy irrigation is needed for ${crop}. Soil moisture is moderate.`);
      addTip(`Recheck the soil before the next watering.`);
      addTip(`Avoid extra irrigation while the current moisture level is adequate.`);
    }
  }

  $("suggestions").innerHTML=tips.map((x,i)=>`<li class="smart-best-suggestion"><span class="suggestion-number">${i+1}</span><span>${x}</span></li>`).join("");


  $("cropStat").textContent=crop;
  $("cropStatImage").src=makeCropImage(crop);
  $("cropStatImage").alt=crop+" crop";
  const ms=$("moistureStat"); if(ms) ms.textContent=(moisture[0].toUpperCase()+moisture.slice(1))+` · ${getMoisturePercent()}%`;
  return water;
}

function getMoisturePercent(){
  return moisture==="dry"?32:moisture==="medium"?50:76;
}

function renderHistory(){
  const data=JSON.parse(localStorage.getItem("irrigationHistory")||"[]");
  $("historyBody").innerHTML=data.length
    ?data.map(r=>`<tr><td>${r.date}</td><td>${r.crop}</td><td>${r.moisture}</td><td>${r.recommendation}</td><td>${r.water} L/m²</td></tr>`).join("")
    :`<tr><td colspan="5">No saved analyses yet. Click Analysis to add a result.</td></tr>`;
}

function saveHistory(){
  const water=calculate();
  const moisturePercent=getMoisturePercent();
  const level=water>=9?"High":water>=6?"Medium":"Low";
  const recommendation=level==="High"?"High irrigation needed":level==="Medium"?"Moderate irrigation needed":"Low irrigation needed";
  const data=JSON.parse(localStorage.getItem("irrigationHistory")||"[]");
  data.unshift({
    date:new Date().toLocaleDateString("en-IN"),
    crop,
    moisture:`${moisture[0].toUpperCase()+moisture.slice(1)} · ${moisturePercent}%`,
    moisturePercent,
    recommendation,
    level,
    water:Math.round(water)
  });
  localStorage.setItem("irrigationHistory",JSON.stringify(data.slice(0,12)));
  renderHistory();
  if($("analysisStatus")){
    $("analysisStatus").textContent="Saved to history";
    setTimeout(()=>{ if($("analysisStatus")) $("analysisStatus").textContent="Ready"; },2200);
  }
}

document.querySelectorAll(".choice").forEach(btn=>btn.addEventListener("click",()=>{
  document.querySelectorAll(".choice").forEach(b=>b.classList.remove("selected"));
  btn.classList.add("selected"); moisture=btn.dataset.moisture;
  // Kept as a UI reference, but deliberately excluded from the calculation.
  calculate();
}));

function makeCropImage(name){
  const c=crops[name];
  return "assets/crops/"+c.image;
}

function updateCropSelection(selected){
  if(!crops[selected]) return;
  crop=selected;
  const c=crops[crop];
  $("cropPickerName").textContent=crop;
  $("cropPickerImage").src=makeCropImage(crop);
  $("cropPickerImage").alt=crop;
  $("selectedCropName").textContent=crop;
  $("cropCategory").textContent=c.category;
  $("cropSeason").textContent=c.season;
  $("cropDisplayImage").src=makeCropImage(crop);
  $("cropDisplayImage").alt=crop+" crop image";
  document.querySelectorAll(".crop-option").forEach(btn=>btn.classList.toggle("selected",btn.dataset.crop===crop));
  calculate();
}

function buildCropPicker(){
  const panel=$("cropPickerPanel");
  panel.innerHTML=Object.keys(crops).map(name=>{
    const c=crops[name];
    return `<button type="button" class="crop-option${name===crop?" selected":""}" data-crop="${name}" role="option" aria-selected="${name===crop}">
      <img src="${makeCropImage(name)}" alt="${name}">
      <span>${c.emoji} ${name}</span>
    </button>`;
  }).join("");
  panel.querySelectorAll(".crop-option").forEach(btn=>btn.addEventListener("click",()=>{
    updateCropSelection(btn.dataset.crop);
    closeCropPicker();
  }));
}

function closeCropPicker(){
  $("cropPicker").classList.remove("open");
  $("cropPickerTrigger").setAttribute("aria-expanded","false");
}

$("cropPickerTrigger").addEventListener("click",()=>{
  const picker=$("cropPicker");
  const open=picker.classList.toggle("open");
  $("cropPickerTrigger").setAttribute("aria-expanded",String(open));
});
document.addEventListener("click",e=>{
  if(!$("cropPicker").contains(e.target)) closeCropPicker();
});

$("explainBtn").onclick=()=>$("formula").classList.toggle("show");
$("analysisBtn").onclick=()=>{saveHistory(); document.getElementById("irrigation").scrollIntoView({behavior:"smooth",block:"start"});};
$("newAnalysis").onclick=()=>{
  moisture="dry";
  updateCropSelection("Wheat");
  document.querySelectorAll(".choice").forEach(b=>b.classList.toggle("selected",b.dataset.moisture==="dry"));
  calculate();
  window.scrollTo({top:0,behavior:"smooth"});
};
$("clearHistory").onclick=()=>{localStorage.removeItem("irrigationHistory");renderHistory()};

function setText(id,value){ const el=$(id); if(el) el.textContent=value; }
function nowTime(){
  return new Date().toLocaleTimeString([], {hour:"2-digit",minute:"2-digit",second:"2-digit"});
}
function weatherLabel(code){
  const labels={0:"Clear sky",1:"Mainly clear",2:"Partly cloudy",3:"Overcast",45:"Fog",48:"Rime fog",
    51:"Light drizzle",53:"Drizzle",55:"Heavy drizzle",61:"Light rain",63:"Rain",65:"Heavy rain",
    71:"Light snow",73:"Snow",75:"Heavy snow",80:"Rain showers",81:"Rain showers",82:"Heavy showers",
    95:"Thunderstorm",96:"Thunderstorm + hail",99:"Thunderstorm + hail"};
  return labels[Number(code)]||"Current conditions";
}

async function fetchLiveWeather(){
  const status=$("weatherStatus");
  try{
    if(!navigator.geolocation) throw new Error("Geolocation unavailable");
    const pos=await new Promise((resolve,reject)=>{
      navigator.geolocation.getCurrentPosition(resolve,reject,{enableHighAccuracy:false,timeout:7000,maximumAge:300000});
    });
    const lat=pos.coords.latitude, lon=pos.coords.longitude;
    const url=`https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lon)}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&timezone=auto`;
    const response=await fetch(url,{cache:"no-store"});
    if(!response.ok) throw new Error("Weather request failed");
    const data=await response.json();
    liveWeather=data.current||null;

    let placeName="";
    try{
      const geoUrl=`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lon)}&localityLanguage=en`;
      const geoResponse=await fetch(geoUrl,{cache:"no-store"});
      if(geoResponse.ok){
        const geo=await geoResponse.json();
        const locality=geo.locality||geo.city||geo.principalSubdivision||"";
        const state=geo.principalSubdivision||"";
        const country=geo.countryName||"";
        placeName=[locality,state,country].filter((v,i,a)=>v && a.indexOf(v)===i).slice(0,3).join(", ");
      }
    }catch(_){}

    setText("liveTemp",Number(data.current?.temperature_2m).toFixed(1)+"°C");
    setText("liveHumidity",Math.round(Number(data.current?.relative_humidity_2m))+"%");
    setText("topLiveTemp",Number(data.current?.temperature_2m).toFixed(1)+"°C");
    setText("topLiveHumidity",Math.round(Number(data.current?.relative_humidity_2m))+"%");
    setText("liveWind",Number(data.current?.wind_speed_10m).toFixed(1)+" km/h");
    setText("liveWeatherText",weatherLabel(data.current?.weather_code));
    setText("weatherLocation",placeName?`Live Weather · ${placeName}`:`Live Weather · ${lat.toFixed(2)}, ${lon.toFixed(2)}`);
    setText("weatherUpdated","Updated "+nowTime());
    setText("connectionText","WEATHER");
    setText("lastSync","Live · "+nowTime());
    const dot=$("connectionDot"); if(dot) dot.style.background="#6cdb8c";
    if(status){status.textContent="LIVE WEATHER";status.classList.add("live");status.classList.remove("demo");}
    calculate();
  }catch(err){
    liveWeather=null;
    setText("liveTemp","—");
    setText("liveHumidity","—");
    setText("topLiveTemp","—");
    setText("topLiveHumidity","—");
    setText("liveWind","—");
    setText("liveWeatherText","Live weather unavailable");
    setText("weatherLocation","Live weather unavailable");
    setText("weatherUpdated","Waiting for live weather");
    setText("connectionText","WEATHER");
    setText("lastSync","Unavailable");
    const dot=$("connectionDot"); if(dot) dot.style.background="";
    if(status){status.textContent="WEATHER UNAVAILABLE";status.classList.add("demo");status.classList.remove("live");}
    calculate();
  }
}

function startWeather(){
  fetchLiveWeather();
  setInterval(fetchLiveWeather,10*60*1000);
}

buildCropPicker();
updateCropSelection("Wheat");
renderHistory();
startWeather();
