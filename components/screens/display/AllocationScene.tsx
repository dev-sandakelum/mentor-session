"use client";
import React, { useEffect, useRef, useState } from "react";
import type { DisplayScene } from "@/lib/display-state";
import { FIRST, LAST, rand } from "./shared";
import { MentorLoadGrid, type MentorLoadEntry } from "./MentorLoadGrid";
import { RobotLogoMark, RoboStyles } from "./RobotLogoMark";

// ─── AllocationFlow — unified load + run component ───────────────────────────
// This is the single component rendered for BOTH allocation-load and allocation
// scene types. It never unmounts between the two states so there is zero flash,
// no remount, and the running animation starts directly from the assembled frame.

type AllocationFlowScene =
  | Extract<DisplayScene, { type: "allocation-load" }>
  | Extract<DisplayScene, { type: "allocation" }>;

export function AllocationFlow({ scene }: { scene: AllocationFlowScene }) {
  const isRunning = scene.type === "allocation";
  const runningScene = isRunning ? (scene as Extract<DisplayScene, { type: "allocation" }>) : null;
  const prevIsRunning = useRef(false);

  // When the scene type flips from load → allocation we just activate the
  // ticker — the DOM is already painted and assembled, nothing re-renders.
  useEffect(() => {
    if (isRunning && !prevIsRunning.current) {
      prevIsRunning.current = true;
      // fetchData is stable (wrapped in useCallback), calling it here kicks
      // off the first allocation fetch and starts the drip-feed ticker.
      void fetchDataRef.current?.();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning]);

  // ── ALL STATE (merged from both scenes) ────────────────────────────────────
  const [assembled,     setAssembled]     = useState(false);
  const [minDelayDone,  setMinDelayDone]  = useState(false);
  const [mentorLoad,    setMentorLoad]    = useState<MentorLoadEntry[]>([]);
  const [total,         setTotal]         = useState(runningScene?.total || 0);
  const [queueItems,    setQueueItems]    = useState<{ id:number;name:string;exiting?:boolean }[]>(() =>
    Array.from({ length:4 }, (_, i) => ({ id:i+1, name:`${rand(FIRST)} ${rand(LAST)}`, exiting:false }))
  );
  const [displayed,     setDisplayed]     = useState<{ mentee:string;mentor:string;method:"preference"|"fallback"|"manual";priority:number|null }[]>([]);
  const [fcfsCount,     setFcfsCount]     = useState(0);
  const [fbCount,       setFbCount]       = useState(0);
  const [revealedCount, setRevealedCount] = useState(0);
  const [masterPct,     setMasterPct]     = useState(0);
  const [fcfsPct,       setFcfsPct]       = useState(0);
  const [fbPct,         setFbPct]         = useState(0);
  const [activeEngine,  setActiveEngine]  = useState<"fcfs"|"fallback"|null>(null);
  const [isComplete,    setIsComplete]    = useState(false);
  const [hitMentorName, setHitMentorName] = useState<string | null>(null);

  // ── REFS ───────────────────────────────────────────────────────────────────
  const queueNodeRef    = useRef<HTMLDivElement>(null);
  const fcfsEngineRef   = useRef<HTMLDivElement>(null);
  const fbEngineRef     = useRef<HTMLDivElement>(null);
  const assignedNodeRef = useRef<HTMLDivElement>(null);
  const allDataRef      = useRef<{ mentee:string;mentor:string;method:"preference"|"fallback"|"manual";priority:number|null }[]>([]);
  const revealedRef     = useRef(0);
  const tickerRef       = useRef<ReturnType<typeof setTimeout>|null>(null);
  const pollRef         = useRef<ReturnType<typeof setInterval>|null>(null);
  const mentorLoadRef   = useRef<Map<string,MentorLoadEntry>>(new Map());
  const menteeTotalRef  = useRef(runningScene?.total || 83);
  const qIdRef          = useRef(4); // starts at 4 since queue pre-seeded
  const feedKeyRef      = useRef(0);
  const fetchDataRef    = useRef<(() => Promise<void>)|null>(null);

  // ── LOAD PHASE: robot face → 4s → assemble dashboard ─────────────────────
  useEffect(() => {
    const t = setTimeout(() => setMinDelayDone(true), 4000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!minDelayDone) return;
    let f2 = 0;
    const f1 = requestAnimationFrame(() => { f2 = requestAnimationFrame(() => setAssembled(true)); });
    return () => { cancelAnimationFrame(f1); if (f2) cancelAnimationFrame(f2); };
  }, [minDelayDone]);

  // Fetch mentors once on mount to seed the constellation grid
  useEffect(() => {
    fetch("/api/display/mentors")
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((d: { mentors?: { name:string; capacity?:number }[] }) => {
        const entries = (d.mentors ?? []).map(m => ({ name:m.name, allocated:0, capacity:m.capacity??0 }));
        setMentorLoad(entries);
        const map = new Map<string,MentorLoadEntry>();
        entries.forEach(m => map.set(m.name, m));
        mentorLoadRef.current = map;
      })
      .catch(() => undefined);
    fetch("/api/display/registrations")
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((d: Record<string,unknown>) => {
        const t = [d.menteeTotal,d.total,d.count].find(v => typeof v==="number") as number|undefined;
        if (t) { setTotal(t); menteeTotalRef.current = t; }
      })
      .catch(() => undefined);
  }, []);

  // ── RUN PHASE: flying chip + drip-feed ticker ─────────────────────────────
  const flyChip = React.useCallback((initials: string, method: "fcfs"|"fallback") => {
    const from = queueNodeRef.current?.getBoundingClientRect();
    const via  = (method==="fcfs" ? fcfsEngineRef : fbEngineRef).current?.getBoundingClientRect();
    const to   = assignedNodeRef.current?.getBoundingClientRect();
    if (!from||!via||!to) return;
    const isFb = method==="fallback";
    const chip = document.createElement("div");
    chip.textContent = initials;
    Object.assign(chip.style, {
      position:"fixed", zIndex:"999", pointerEvents:"none",
      border:"1px solid rgba(255,255,255,.2)",
      background: isFb?"#0f4a63":"#1b3d8a", color: isFb?"#e6fbff":"#e8f1ff",
      borderRadius:"999px", padding:"8px 13px", fontSize:"13px", fontWeight:"800",
      fontFamily:"Manrope,sans-serif",
      boxShadow:`0 8px 25px rgba(0,0,0,.4),0 0 22px ${isFb?"rgba(94,225,255,.3)":"rgba(79,157,255,.3)"}`,
      whiteSpace:"nowrap", left:`${from.right-60}px`, top:`${from.top+from.height*0.4}px`,
    });
    document.body.appendChild(chip);
    const y0=from.top+from.height*0.4;
    chip.animate([
      { transform:"translate(0,0) scale(.8)", opacity:"0" },
      { transform:`translate(${via.left-(from.right-60)+70}px,${via.top+via.height/2-y0}px) scale(1)`, opacity:"1", offset:0.46 },
      { transform:`translate(${to.left-(from.right-60)+90}px,${to.top+80-y0}px) scale(.7)`, opacity:"0" },
    ], { duration:1050, easing:"cubic-bezier(.2,.75,.2,1)" }).onfinish = () => chip.remove();
  }, []);

  const fireConfetti = React.useCallback(() => {
    const colors=["#4f9dff","#5ee1ff","#ffc766","#eef5ff","#22c55e"];
    const pick=(a:string[])=>a[Math.floor(Math.random()*a.length)];
    for(let i=0;i<50;i++){
      const c=document.createElement("div");
      Object.assign(c.style,{position:"fixed",zIndex:"9999",pointerEvents:"none",width:"6px",height:"13px",borderRadius:"3px",left:`${48+Math.random()*4}%`,top:"55%",background:pick(colors),animationDelay:`${Math.random()*0.18}s`,animation:"alloc-confetti 1.4s ease-out forwards"});
      c.style.setProperty("--x",`${(Math.random()-.5)*700}px`);c.style.setProperty("--y",`${-120+Math.random()*460}px`);c.style.setProperty("--r",`${Math.random()*700-350}deg`);
      document.body.appendChild(c);setTimeout(()=>c.remove(),1800);
    }
  },[]);

  const rebuildQueue = React.useCallback((revealed:number) => {
    const all=allDataRef.current;
    const names=all.slice(revealed,revealed+4).map(r=>r.mentee);
    while(names.length<4) names.push(`${rand(FIRST)} ${rand(LAST)}`);
    const next=names.map(name=>({id:++qIdRef.current,name,exiting:false}));
    setQueueItems(prev=>{
      if(prev.length>0){
        const withExit=[{...prev[0],exiting:true},...prev.slice(1)];
        setTimeout(()=>setQueueItems(next),300);
        return withExit;
      }
      return next;
    });
  },[]);

  const scheduleNext = React.useCallback(()=>{
    if(tickerRef.current) clearTimeout(tickerRef.current);
    tickerRef.current=setTimeout(()=>{
      const all=allDataRef.current;
      const idx=revealedRef.current;
      if(idx>=all.length) return;
      const row=all[idx]; const newIdx=idx+1; revealedRef.current=newIdx;
      const isFcfs=row.method==="preference";
      const eng=isFcfs?"fcfs":"fallback";
      const ini=row.mentee.split(/\s+/).slice(0,2).map((w:string)=>w[0]).join("").toUpperCase();
      setActiveEngine(eng); setTimeout(()=>setActiveEngine(null),500);
      flyChip(ini,eng);
      setTimeout(()=>{
        setDisplayed(prev=>[row,...prev].slice(0,9));
        const map=mentorLoadRef.current;
        const ex=map.get(row.mentor);
        if(ex){map.set(row.mentor,{...ex,allocated:ex.allocated+1});}
        else{map.set(row.mentor,{name:row.mentor,allocated:1,capacity:0});}
        setMentorLoad(Array.from(map.values()));
        setHitMentorName(row.mentor); setTimeout(()=>setHitMentorName(null),800);
      },510);
      setRevealedCount(newIdx);
      const t=menteeTotalRef.current;
      const nf=all.slice(0,newIdx).filter(r=>r.method==="preference").length;
      const nb=newIdx-nf; const tot=Math.max(nf+nb,1);
      setFcfsCount(nf); setFbCount(nb);
      setMasterPct((newIdx/t)*100); setFcfsPct(Math.min((nf/tot)*100,100)); setFbPct(Math.min((nb/tot)*100,100));
      rebuildQueue(newIdx);
      if(newIdx>=all.length&&all.length>=t){setTimeout(()=>{setIsComplete(true);fireConfetti();},600);}
      else{scheduleNext();}
    },620);
  },[rebuildQueue,flyChip,fireConfetti]);

  const fetchData = React.useCallback(async()=>{
    try{
      const res=await fetch("/api/display/allocations");
      if(!res.ok) return;
      const d=await res.json() as {allocations:{mentee:string;mentor:string;method:"preference"|"fallback"|"manual";priority:number|null}[];fcfsCount:number;fallbackCount:number;total:number;menteeTotal:number};
      const rt=d.menteeTotal||(runningScene?.total)||83;
      if(rt!==menteeTotalRef.current){menteeTotalRef.current=rt;setTotal(rt);}
      const prev=allDataRef.current.length;
      allDataRef.current=d.allocations;
      if(prev===0&&d.allocations.length>0){
        // Merge real mentor data into the already-loaded constellation map
        if(mentorLoadRef.current.size===0){
          try{
            const mr=await fetch("/api/display/mentors");
            if(mr.ok){
              const md=await mr.json() as {mentors:{name:string;allocatedCount:number;capacity:number}[]};
              const map=new Map<string,MentorLoadEntry>();
              md.mentors.forEach(m=>map.set(m.name,{name:m.name,allocated:0,capacity:m.capacity}));
              mentorLoadRef.current=map; setMentorLoad(Array.from(map.values()));
            }
          }catch{/* ignore */}
        }
        rebuildQueue(0);
      }
      if(d.allocations.length>prev&&revealedRef.current>=prev) scheduleNext();
    }catch{/* ignore */}
  },[runningScene?.total,scheduleNext,rebuildQueue]);

  // Keep fetchDataRef current so the isRunning effect can call it
  fetchDataRef.current = fetchData;

  // Start polling when running; clean up on unmount
  useEffect(()=>{
    if(!isRunning) return;
    fetchData();
    pollRef.current=setInterval(fetchData,5000);
    return ()=>{
      if(pollRef.current) clearInterval(pollRef.current);
      if(tickerRef.current) clearTimeout(tickerRef.current);
    };
  },[isRunning, fetchData]);

  // ── ASSEMBLY HELPERS ──────────────────────────────────────────────────────
  const assemblyStyle = (transform:string, delay:number, duration=.55): React.CSSProperties => ({
    opacity: assembled?1:0,
    transform: assembled?"none":transform,
    transition:`opacity ${duration}s ease ${delay}s,transform ${duration}s cubic-bezier(.16,1,.3,1) ${delay}s`,
  });
  const methodColor=(m:string,p:number|null)=>{
    if(m==="preference") return p===1?"#22c55e":p===2?"#f59e0b":"#a78bfa";
    return "#38bdf8";
  };
  const FcfsIcon=()=>(
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" style={{width:"clamp(14px,1.2vh,19px)",height:"clamp(14px,1.2vh,19px)"}}><path d="M5 7h14M5 12h10M5 17h6"/></svg>
  );
  const FallbackIcon=()=>(
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{width:"clamp(14px,1.2vh,19px)",height:"clamp(14px,1.2vh,19px)"}}><path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/></svg>
  );
  const PeopleIcon=()=>(
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{width:"clamp(22px,2.2vh,30px)",height:"clamp(22px,2.2vh,30px)"}}><circle cx="9" cy="7" r="3"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/><circle cx="17" cy="7" r="3" opacity=".5"/><path d="M21 21v-2a4 4 0 0 0-3-3.87" opacity=".5"/></svg>
  );

  const engines = [
    { key:"fcfs" as const, label:"FCFS allocation", sub:"First come, first served · queue order preserved", badge:"Primary", count:fcfsCount, pct:fcfsPct, color:"#4f9dff", rgb:"79,157,255", border:"rgba(79,157,255,.28)", bg:"rgba(79,157,255,.16)", Icon:FcfsIcon },
    { key:"fallback" as const, label:"Fallback allocation", sub:"Unmatched mentees · random available mentor", badge:"Random", count:fbCount, pct:fbPct, color:"#5ee1ff", rgb:"94,225,255", border:"rgba(94,225,255,.25)", bg:"rgba(94,225,255,.13)", Icon:FallbackIcon },
  ];

  const totalLabel = total > 0 ? total : "—";

  // ── ROBOT-FACE OPENING SCREEN (first 4 s) ─────────────────────────────────
  if (!minDelayDone) {
    return (
      <div style={{position:"fixed",inset:0,overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:'"DM Sans","Manrope",system-ui,sans-serif',WebkitFontSmoothing:"antialiased",color:"#eef5ff",background:"radial-gradient(circle at 10% 10%,rgba(45,108,240,.28),transparent 34rem),radial-gradient(circle at 90% 15%,rgba(18,182,221,.16),transparent 30rem),radial-gradient(circle at 50% 110%,rgba(79,157,255,.12),transparent 40rem),linear-gradient(150deg,#03081a 0%,#061131 55%,#04091c 100%)"}}>
        <div style={{position:"absolute",inset:0,pointerEvents:"none",opacity:.4,backgroundImage:"linear-gradient(rgba(140,190,255,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(140,190,255,.05) 1px,transparent 1px)",backgroundSize:"60px 60px",WebkitMaskImage:"linear-gradient(to bottom,#000,transparent 92%)",maskImage:"linear-gradient(to bottom,#000,transparent 92%)"}}/>
        <div style={{position:"fixed",width:520,height:520,borderRadius:"50%",filter:"blur(100px)",opacity:.18,left:-160,top:"20%",background:"#4f9dff",animation:"alloc-orb 9s ease-in-out infinite alternate",pointerEvents:"none"}}/>
        <div style={{position:"fixed",width:480,height:480,borderRadius:"50%",filter:"blur(100px)",opacity:.16,right:-160,bottom:"10%",background:"#5ee1ff",animation:"alloc-orb 11s ease-in-out infinite alternate",animationDelay:"-5s",pointerEvents:"none"}}/>
        <div style={{position:"relative",display:"flex",flexDirection:"column",alignItems:"center",gap:"clamp(18px,2.4vh,32px)",textAlign:"center",padding:"0 24px"}}>
          <RobotLogoMark size="clamp(120px,16vw,200px)" glow/>
          <div style={{display:"flex",flexDirection:"column",gap:6,fontFamily:"Manrope,sans-serif"}}>
            <span style={{fontSize:"clamp(24px,3vh,38px)",fontWeight:800,letterSpacing:"-.02em",background:"linear-gradient(90deg,#eef5ff 30%,#5ee1ff 100%)",WebkitBackgroundClip:"text",backgroundClip:"text",color:"transparent",lineHeight:1.15}}>MentorFlow</span>
            <span style={{fontSize:"clamp(11px,1.1vh,15px)",fontWeight:600,color:"rgba(140,190,255,.55)",letterSpacing:".22em",textTransform:"uppercase"}}>Allocation Engine</span>
          </div>
          <div style={{display:"flex",gap:10}}>
            {[0,1,2].map(i=><div key={i} style={{width:10,height:10,borderRadius:"50%",background:"#4f9dff",animation:"rf-dot 1.2s ease-in-out infinite",animationDelay:`${i*0.22}s`,boxShadow:"0 0 10px #4f9dff"}}/>)}
          </div>
          <div style={{fontSize:"clamp(13px,1.15vh,17px)",fontWeight:600,color:"#8aa3cc",letterSpacing:".04em"}}>Initialising MentorFlow engine…</div>
        </div>
        <RoboStyles/>
        <style>{`
          @keyframes rf-dot { 0%,80%,100%{transform:scale(.7);opacity:.4} 40%{transform:scale(1.3);opacity:1} }
        `}</style>
      </div>
    );
  }

  // ── MAIN DASHBOARD (assembled load state OR running state) ────────────────
  return (
    <div style={{position:"fixed",inset:0,overflow:"hidden",fontFamily:'"DM Sans","Manrope",system-ui,sans-serif',WebkitFontSmoothing:"antialiased",color:"#eef5ff",background:"radial-gradient(circle at 10% 10%,rgba(45,108,240,.28),transparent 34rem),radial-gradient(circle at 90% 15%,rgba(18,182,221,.16),transparent 30rem),radial-gradient(circle at 50% 110%,rgba(79,157,255,.12),transparent 40rem),linear-gradient(150deg,#03081a 0%,#061131 55%,#04091c 100%)"}}>
      <div style={{position:"absolute",inset:0,pointerEvents:"none",opacity:.4,backgroundImage:"linear-gradient(rgba(140,190,255,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(140,190,255,.05) 1px,transparent 1px)",backgroundSize:"60px 60px",WebkitMaskImage:"linear-gradient(to bottom,#000,transparent 92%)",maskImage:"linear-gradient(to bottom,#000,transparent 92%)"}}/>
      <div style={{position:"fixed",width:520,height:520,borderRadius:"50%",filter:"blur(100px)",opacity:.16,left:-200,top:"35%",background:"#4f9dff",animation:"alloc-orb 14s ease-in-out infinite alternate",pointerEvents:"none"}}/>
      <div style={{position:"fixed",width:520,height:520,borderRadius:"50%",filter:"blur(100px)",opacity:.16,right:-200,bottom:-160,background:"#5ee1ff",animation:"alloc-orb 14s ease-in-out infinite alternate",animationDelay:"-6s",pointerEvents:"none"}}/>

      <div style={{position:"relative",height:"100vh",width:"min(1720px,100%)",margin:"0 auto",padding:"clamp(10px,1.3vh,20px) clamp(20px,3vw,52px)",display:"flex",flexDirection:"column",gap:"clamp(8px,1vh,16px)"}}>

        {/* Header */}
        <header style={{...assemblyStyle("translateY(-16px)",0), display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",gap:14,fontFamily:"Manrope,sans-serif"}}>
            <RobotLogoMark size="clamp(36px,3vh,48px)"/>
            <div style={{display:"flex",flexDirection:"column",gap:1}}>
              <span style={{fontSize:"clamp(16px,1.5vh,22px)",fontWeight:800,letterSpacing:"-.02em",background:"linear-gradient(90deg,#eef5ff 30%,#5ee1ff 100%)",WebkitBackgroundClip:"text",backgroundClip:"text",color:"transparent",lineHeight:1.1}}>MentorFlow</span>
              <span style={{fontSize:"clamp(9px,.8vh,11px)",fontWeight:600,color:"rgba(140,190,255,.45)",letterSpacing:".16em",textTransform:"uppercase"}}>Allocation Engine</span>
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10,border:"1px solid rgba(140,190,255,.13)",background:"rgba(8,20,50,.7)",padding:"clamp(8px,.8vh,13px) clamp(14px,1.3vh,20px)",borderRadius:999,color:isComplete?"#86efac":isRunning?"#c3d6f5":"#fbbf24",fontSize:"clamp(13px,1.15vh,17px)",fontWeight:700,letterSpacing:".1em",textTransform:"uppercase"}}>
            <span style={{width:10,height:10,borderRadius:"50%",background:isComplete?"#22c55e":isRunning?"#4f9dff":"#fbbf24",boxShadow:isComplete?"0 0 8px rgba(34,197,94,.7)":isRunning?"0 0 0 0 rgba(79,157,255,.55)":"0 0 8px rgba(251,191,36,.7)",animation:isRunning&&!isComplete?"alloc-live 1.8s infinite":"none",flexShrink:0,display:"inline-block"}}/>
            {isComplete?"Allocation Complete":isRunning?"Allocation Live":"Engine Ready"}
          </div>
        </header>

        {/* Dashboard grid */}
        <div style={{flex:1,minHeight:0,display:"grid",gridTemplateColumns:"minmax(0,1fr) clamp(320px,24vw,420px)",gap:"clamp(8px,1vh,16px)"}}>

          {/* Main card */}
          <div style={{...assemblyStyle("scale(.98)",0.08), position:"relative",minHeight:0,border:"1px solid rgba(140,190,255,.13)",background:"linear-gradient(145deg,rgba(13,30,70,.82),rgba(6,14,38,.86))",boxShadow:"0 30px 90px rgba(0,0,0,.35),inset 0 1px 0 rgba(255,255,255,.04)",backdropFilter:"blur(20px)",borderRadius:28,padding:"clamp(14px,1.5vh,24px)",display:"flex",flexDirection:"column"}}>
            <div style={{position:"absolute",inset:0,pointerEvents:"none",borderRadius:28,background:"linear-gradient(115deg,rgba(255,255,255,.035),transparent 28%)"}}/>

            {/* Card head */}
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:14,paddingBottom:"clamp(10px,1.2vh,18px)",flexShrink:0}}>
              <div style={{display:"flex",alignItems:"center",gap:14}}>
                <h2 style={{font:`800 clamp(18px,1.7vh,26px) Manrope,sans-serif`,letterSpacing:"-.02em"}}>Allocation pipeline</h2>
                <span style={{color:"#6f89b3",fontSize:"clamp(13px,1.1vh,17px)"}}>Two strategies · one live process</span>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:9,color:isComplete?"#22c55e":isRunning?"#4f9dff":"#6f89b3",fontSize:"clamp(13px,1.1vh,16px)",fontWeight:700,padding:"clamp(6px,.65vh,10px) clamp(12px,1.2vh,18px)",border:`1px solid ${isComplete?"rgba(34,197,94,.3)":isRunning?"rgba(79,157,255,.25)":"rgba(140,190,255,.18)"}`,borderRadius:999,background:isComplete?"rgba(34,197,94,.1)":isRunning?"rgba(79,157,255,.12)":"rgba(140,190,255,.06)"}}>
                {isRunning&&!isComplete&&<div style={{width:13,height:13,border:"2px solid rgba(79,157,255,.25)",borderTopColor:"#4f9dff",borderRadius:"50%",animation:"alloc-spin .8s linear infinite",flexShrink:0}}/>}
                {isComplete?"Complete":isRunning?"Processing":"Standby"}
              </div>
            </div>

            {/* Flow */}
            <div style={{position:"relative",flex:1,minHeight:0,display:"grid",gridTemplateColumns:"minmax(180px,.78fr) 52px minmax(260px,1.4fr) 52px minmax(200px,.9fr)",alignItems:"stretch",gap:10}}>

              {/* Queue node */}
              <div ref={queueNodeRef} style={{...assemblyStyle("translateX(-20px)",0.18), position:"relative",border:"1px solid rgba(140,190,255,.1)",background:"rgba(3,10,30,.5)",borderRadius:22,padding:"clamp(14px,1.5vh,22px)",overflow:"hidden",display:"flex",flexDirection:"column",justifyContent:"space-between"}}>
                <div>
                  <div style={{color:"#7d97c2",font:`800 clamp(11px,1vh,14px) Manrope,sans-serif`,letterSpacing:".14em",textTransform:"uppercase",marginBottom:"clamp(12px,1.2vh,18px)",display:"flex",alignItems:"center",gap:8}}>
                    <span style={{width:"clamp(22px,2vh,28px)",height:"clamp(22px,2vh,28px)",borderRadius:8,background:"rgba(79,157,255,.12)",display:"grid",placeItems:"center",flexShrink:0}}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="#4f9dff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{width:"clamp(12px,1.1vh,16px)",height:"clamp(12px,1.1vh,16px)"}}><path d="M12 5v14M5 12l7 7 7-7"/></svg>
                    </span>
                    Incoming queue
                  </div>
                  <div style={{position:"relative",height:"clamp(140px,15vh,220px)",margin:"0 4px 4px"}}>
                    {queueItems.slice(0,4).map((item,qi)=>{
                      const scales=[1,.94,.88,.82],tops=["0%","25%","50%","75%"],ops=[1,.65,.38,.18];
                      return(
                        <div key={item.id} style={{position:"absolute",left:0,right:0,height:"clamp(50px,5.2vh,76px)",border:"1px solid rgba(140,190,255,.14)",background:"linear-gradient(145deg,#12275a,#0b1a40)",borderRadius:16,display:"flex",alignItems:"center",gap:12,padding:"clamp(8px,.9vh,13px)",boxShadow:"0 12px 26px rgba(0,0,0,.25)",top:tops[qi],zIndex:4-qi,transform:`scale(${scales[qi]})`,opacity:item.exiting?0:ops[qi],transformOrigin:"top center",transition:"all .45s cubic-bezier(.2,.8,.2,1)",animation:item.exiting?"alloc-queueExit .3s cubic-bezier(.4,0,1,1) forwards":qi===0?"alloc-queueEnter .35s cubic-bezier(.16,1,.3,1) both":"none"}}>
                          <div style={{width:"clamp(32px,3.2vh,46px)",height:"clamp(32px,3.2vh,46px)",borderRadius:12,display:"grid",placeItems:"center",background:"linear-gradient(145deg,#2a4f9a,#1a3570)",color:"#d8e8ff",fontSize:"clamp(12px,1.1vh,16px)",fontWeight:800,flexShrink:0}}>
                            {item.name.split(/\s+/).slice(0,2).map((w:string)=>w[0]).join("").toUpperCase()}
                          </div>
                          <span style={{minWidth:0}}>
                            <b style={{display:"block",fontSize:"clamp(14px,1.3vh,18px)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.name}</b>
                            <small style={{display:"block",color:"#7c95bf",fontSize:"clamp(11px,1vh,14px)",marginTop:3}}>Pending</small>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div style={{display:"flex",alignItems:"flex-end",gap:10}}>
                  <strong style={{font:`800 clamp(34px,3.8vh,58px)/.9 Manrope,sans-serif`,letterSpacing:"-.05em",color:"#fff"}}>{typeof totalLabel==="number"?totalLabel-revealedCount:totalLabel}</strong>
                  <span style={{fontSize:"clamp(14px,1.2vh,18px)",color:"#7d97c2",paddingBottom:6}}>waiting</span>
                </div>
              </div>

              {/* Left connector */}
              <div style={{...assemblyStyle("scaleX(0)",0.28), position:"relative",display:"flex",alignItems:"center",transformOrigin:"left center"}}>
                <div style={{height:2,width:"100%",background:"linear-gradient(90deg,rgba(79,157,255,.12),rgba(79,157,255,.7),rgba(79,157,255,.12))"}}/>
                <div style={{position:"absolute",right:0,width:9,height:9,borderTop:"2px solid #4f9dff",borderRight:"2px solid #4f9dff",transform:"rotate(45deg)"}}/>
                <div style={{position:"absolute",width:10,height:10,borderRadius:"50%",background:"#4f9dff",boxShadow:"0 0 14px #4f9dff",animation:isRunning?"alloc-travel 1.35s linear infinite":"none"}}/>
              </div>

              {/* Engines */}
              <div style={{display:"grid",gridTemplateRows:"1fr 1fr",gap:10,minHeight:0}}>
                {engines.map((eng,ei)=>(
                  <div key={eng.key} ref={eng.key==="fcfs"?fcfsEngineRef:fbEngineRef}
                    style={{...assemblyStyle("translateY(20px)",0.36+ei*0.1), position:"relative",border:`1px solid ${eng.border}`,background:`linear-gradient(115deg,${eng.bg},rgba(6,16,45,.4))`,borderRadius:20,padding:"clamp(12px,1.3vh,20px) clamp(14px,1.4vh,22px)",overflow:"hidden",display:"flex",flexDirection:"column",justifyContent:"space-between"}}>
                    {activeEngine===eng.key&&<div style={{position:"absolute",inset:0,background:"linear-gradient(100deg,transparent,rgba(255,255,255,.12),transparent)",animation:"alloc-sweep .55s cubic-bezier(.2,.8,.2,1) forwards",pointerEvents:"none"}}/>}
                    <div>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10}}>
                        <div style={{display:"flex",alignItems:"center",gap:12,font:`800 clamp(15px,1.4vh,20px) Manrope,sans-serif`}}>
                          <div style={{width:"clamp(30px,2.8vh,42px)",height:"clamp(30px,2.8vh,42px)",borderRadius:11,display:"grid",placeItems:"center",color:eng.color,background:`rgba(${eng.rgb},.15)`,flexShrink:0}}><eng.Icon/></div>
                          {eng.label}
                        </div>
                        <span style={{fontSize:"clamp(11px,1vh,14px)",fontWeight:800,letterSpacing:".08em",textTransform:"uppercase",borderRadius:99,padding:"6px 12px",color:eng.color,background:`rgba(${eng.rgb},.13)`,flexShrink:0}}>{eng.badge}</span>
                      </div>
                      <p style={{fontSize:"clamp(12px,1.1vh,15px)",color:"#8aa3cc",marginTop:"clamp(5px,.6vh,9px)"}}>{eng.sub}</p>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:12,marginTop:"clamp(8px,.9vh,14px)"}}>
                      <div style={{height:6,flex:1,background:"rgba(255,255,255,.07)",borderRadius:6,overflow:"hidden"}}>
                        <div style={{display:"block",height:"100%",width:`${eng.pct}%`,borderRadius:6,background:eng.color,boxShadow:`0 0 10px ${eng.color}`,transition:"width .45s cubic-bezier(.2,.8,.2,1)"}}/>
                      </div>
                      <strong style={{font:`800 clamp(15px,1.4vh,20px) Manrope,sans-serif`,minWidth:"clamp(46px,4.2vh,64px)",textAlign:"right",color:"#eef5ff"}}>
                        {eng.count}<span style={{color:"#6f89b3",fontWeight:600}}>/{typeof totalLabel==="number"?totalLabel:total||"—"}</span>
                      </strong>
                    </div>
                  </div>
                ))}
              </div>

              {/* Right connector */}
              <div style={{...assemblyStyle("scaleX(0)",0.54), position:"relative",display:"flex",alignItems:"center",transformOrigin:"left center"}}>
                <div style={{height:2,width:"100%",background:"linear-gradient(90deg,rgba(79,157,255,.12),rgba(79,157,255,.7),rgba(79,157,255,.12))"}}/>
                <div style={{position:"absolute",right:0,width:9,height:9,borderTop:"2px solid #4f9dff",borderRight:"2px solid #4f9dff",transform:"rotate(45deg)"}}/>
                <div style={{position:"absolute",width:10,height:10,borderRadius:"50%",background:"#4f9dff",boxShadow:"0 0 14px #4f9dff",animation:isRunning?"alloc-travel 1.35s linear infinite":"none",animationDelay:"-.7s"}}/>
              </div>

              {/* Latest matches */}
              <div ref={assignedNodeRef} style={{...assemblyStyle("translateX(20px)",0.62), border:"1px solid rgba(140,190,255,.1)",background:"rgba(3,10,30,.5)",borderRadius:22,padding:"clamp(14px,1.5vh,22px)",overflow:"hidden",display:"flex",flexDirection:"column",minHeight:0}}>
                <div style={{color:"#7d97c2",font:`800 clamp(10px,.9vh,13px) Manrope,sans-serif`,letterSpacing:".14em",textTransform:"uppercase",marginBottom:"clamp(8px,.9vh,13px)",flexShrink:0,display:"flex",alignItems:"center",gap:8}}>
                  <span style={{width:"clamp(22px,2vh,28px)",height:"clamp(22px,2vh,28px)",borderRadius:8,background:"rgba(79,157,255,.12)",display:"grid",placeItems:"center",flexShrink:0}}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="#4f9dff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{width:"clamp(12px,1.1vh,15px)",height:"clamp(12px,1.1vh,15px)"}}><circle cx="17" cy="7" r="3"/><circle cx="7" cy="17" r="3"/><path d="M14 7H7a5 5 0 0 0 0 10h3"/></svg>
                  </span>
                  Latest matches
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:6,overflow:"hidden",flex:1,minHeight:0}}>
                  {displayed.length===0 ? (
                    <div style={{height:"100%",display:"grid",placeItems:"center",color:"#4a6080",fontSize:"clamp(12px,1.1vh,15px)"}}>Waiting for first match…</div>
                  ) : displayed.map((row,i)=>(
                    <div key={i} style={{display:"flex",alignItems:"center",gap:10,border:"1px solid rgba(140,190,255,.1)",background:"rgba(14,30,72,.7)",padding:"clamp(6px,.65vh,9px) clamp(8px,.85vh,12px)",borderRadius:12,flexShrink:0,animation:"alloc-cardIn .55s cubic-bezier(.2,.8,.2,1) both"}}>
                      <div style={{width:"clamp(28px,2.6vh,38px)",height:"clamp(28px,2.6vh,38px)",borderRadius:9,flexShrink:0,display:"grid",placeItems:"center",background:"linear-gradient(145deg,#1e3a78,#152b5e)",color:"#c3d8ff",fontSize:"clamp(10px,.9vh,13px)",fontWeight:800,letterSpacing:".04em"}}>
                        {row.mentee.split(/\s+/).slice(0,2).map((w:string)=>w[0]).join("").toUpperCase()}
                      </div>
                      <span style={{minWidth:0,flex:1}}>
                        <b style={{display:"block",fontSize:"clamp(12px,1.15vh,16px)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{row.mentee}</b>
                        <small style={{display:"block",color:"#7c95bf",fontSize:"clamp(10px,1vh,13px)",marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{row.mentor}</small>
                      </span>
                      <div style={{width:10,height:10,borderRadius:"50%",background:methodColor(row.method,row.priority),boxShadow:`0 0 8px ${methodColor(row.method,row.priority)}`,flexShrink:0}}/>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Progress footer */}
            <div style={{flexShrink:0,display:"grid",gridTemplateColumns:"1fr auto",gap:18,alignItems:"center",borderTop:"1px solid rgba(140,190,255,.13)",padding:"clamp(10px,1.1vh,16px) 3px 2px",marginTop:"clamp(10px,1.1vh,16px)"}}>
              <div style={{height:8,borderRadius:10,background:"rgba(255,255,255,.07)",overflow:"hidden"}}>
                <div style={{display:"block",height:"100%",width:`${masterPct}%`,background:"linear-gradient(90deg,#2d6cf0,#4f9dff,#5ee1ff)",borderRadius:"inherit",boxShadow:"0 0 18px rgba(79,157,255,.55)",transition:"width .45s cubic-bezier(.2,.8,.2,1)"}}/>
              </div>
              <div style={{font:`700 clamp(15px,1.3vh,20px) Manrope,sans-serif`,color:"#8aa3cc",whiteSpace:"nowrap"}}>
                <strong style={{color:"#eef5ff",fontSize:"clamp(20px,1.8vh,28px)"}}>{revealedCount}</strong>/{typeof totalLabel==="number"?totalLabel:total||"—"}
                <span style={{marginLeft:6,color:"#6f89b3",fontSize:"clamp(12px,1vh,15px)",fontWeight:600,textTransform:"uppercase",letterSpacing:".06em"}}>assigned</span>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div style={{...assemblyStyle("translateX(20px)",0.32), display:"grid",gridTemplateRows:"auto minmax(0,1fr)",gap:"clamp(8px,1vh,16px)",minHeight:0}}>

            {/* Stats card */}
            <div style={{border:"1px solid rgba(140,190,255,.13)",background:"linear-gradient(145deg,rgba(13,30,70,.82),rgba(6,14,38,.86))",boxShadow:"0 30px 90px rgba(0,0,0,.35),inset 0 1px 0 rgba(255,255,255,.04)",backdropFilter:"blur(20px)",borderRadius:24,padding:"clamp(14px,1.4vh,22px)",display:"flex",flexDirection:"column",gap:12}}>
              <div style={{position:"relative",padding:"clamp(14px,1.4vh,20px) clamp(16px,1.5vh,24px)",borderRadius:18,background:"linear-gradient(135deg,rgba(79,157,255,.14),rgba(45,108,240,.1))",border:"1px solid rgba(79,157,255,.18)",overflow:"hidden"}}>
                <div style={{position:"absolute",width:90,height:90,borderRadius:"50%",right:-22,top:-22,background:"#4f9dff",filter:"blur(32px)",opacity:.2,pointerEvents:"none"}}/>
                <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between"}}>
                  <div>
                    <div style={{color:"#7d97c2",fontSize:"clamp(11px,1vh,14px)",fontWeight:800,letterSpacing:".12em",textTransform:"uppercase",marginBottom:"clamp(6px,.6vh,10px)"}}>Total allocated</div>
                    <div style={{font:`800 clamp(42px,4.2vh,66px)/1 Manrope,sans-serif`,letterSpacing:"-.05em"}}>
                      {revealedCount}<small style={{fontSize:"clamp(18px,1.6vh,24px)",color:"#6f89b3",fontWeight:600,letterSpacing:0}}>/{typeof totalLabel==="number"?totalLabel:total||"—"}</small>
                    </div>
                  </div>
                  <div style={{color:"#4f9dff",opacity:.7,flexShrink:0,marginTop:4}}><PeopleIcon/></div>
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                {[{label:"FCFS",count:fcfsCount,color:"#4f9dff",border:"rgba(79,157,255,.12)",bg:"#4f9dff",Icon:FcfsIcon},{label:"Fallback",count:fbCount,color:"#5ee1ff",border:"rgba(94,225,255,.12)",bg:"#5ee1ff",Icon:FallbackIcon}].map(s=>(
                  <div key={s.label} style={{position:"relative",padding:"clamp(12px,1.2vh,18px)",borderRadius:16,background:"rgba(255,255,255,.03)",border:`1px solid ${s.border}`,overflow:"hidden"}}>
                    <div style={{position:"absolute",width:70,height:70,borderRadius:"50%",right:-20,top:-20,background:s.bg,filter:"blur(26px)",opacity:.18,pointerEvents:"none"}}/>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"clamp(6px,.6vh,10px)"}}>
                      <div style={{color:"#7d97c2",fontSize:"clamp(11px,1vh,14px)",fontWeight:800,letterSpacing:".1em",textTransform:"uppercase"}}>{s.label}</div>
                      <div style={{color:s.color,opacity:.7}}><s.Icon/></div>
                    </div>
                    <div style={{font:`800 clamp(32px,3.2vh,50px)/1 Manrope,sans-serif`,letterSpacing:"-.04em",color:"#eef5ff"}}>{s.count}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mentor load constellation */}
            <div style={{border:"1px solid rgba(140,190,255,.13)",background:"linear-gradient(145deg,rgba(13,30,70,.82),rgba(6,14,38,.86))",boxShadow:"0 30px 90px rgba(0,0,0,.35),inset 0 1px 0 rgba(255,255,255,.04)",backdropFilter:"blur(20px)",borderRadius:24,padding:"clamp(14px,1.4vh,22px)",display:"flex",flexDirection:"column",minHeight:0,overflow:"hidden"}}>
              <div style={{flexShrink:0,display:"flex",alignItems:"center",justifyContent:"space-between",paddingBottom:"clamp(10px,1vh,15px)",borderBottom:"1px solid rgba(140,190,255,.13)",marginBottom:"clamp(8px,.8vh,12px)"}}>
                <div style={{font:`800 clamp(14px,1.3vh,18px) Manrope,sans-serif`}}>
                  Mentor load · <span style={{color:"#6f89b3",fontWeight:600}}>{mentorLoad.length} mentors</span>
                </div>
                <div style={{display:"flex",gap:8}}>
                  {[{label:"idle",bg:"rgba(140,190,255,.12)"},{label:"1",bg:"rgba(79,157,255,.45)"},{label:"2–3",bg:"rgba(94,225,255,.7)"},{label:"4+",bg:"#ffc766"}].map(l=>(
                    <div key={l.label} style={{display:"flex",alignItems:"center",gap:4,fontSize:"clamp(9px,.8vh,11px)",fontWeight:700,color:"#6f89b3"}}>
                      <span style={{width:9,height:9,borderRadius:3,background:l.bg,display:"inline-block",flexShrink:0}}/>{l.label}
                    </div>
                  ))}
                </div>
              </div>
              <div style={{flex:1,minHeight:0,overflow:"hidden"}}>
                {mentorLoad.length===0
                  ?<div style={{height:"100%",display:"grid",placeItems:"center",color:"#4a6080",fontSize:"clamp(12px,1.1vh,15px)"}}>Loading mentor data…</div>
                  :<MentorLoadGrid mentors={mentorLoad} hitName={hitMentorName}/>
                }
              </div>

              {/* Footer stats */}
              {mentorLoad.length>0&&(()=>{
                const asgn=mentorLoad.filter(m=>m.allocated>0);
                const idle=mentorLoad.length-asgn.length;
                const total_a=mentorLoad.reduce((s,m)=>s+m.allocated,0);
                const maxLoad=asgn.length>0?Math.max(...asgn.map(m=>m.allocated)):0;
                const avg=(total_a/mentorLoad.length).toFixed(1);
                const busiest=asgn.length>0?asgn.reduce((a,b)=>b.allocated>a.allocated?b:a):null;
                const bIni=busiest?.name.split(/\s+/).filter((w:string)=>w.length>1||/^[A-Z]$/.test(w)).slice(0,2).map((w:string)=>w[0]).join("").toUpperCase()??"";
                return(
                  <div style={{flexShrink:0,display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,borderTop:"1px solid rgba(140,190,255,.09)",paddingTop:"clamp(10px,1vh,14px)",marginTop:"clamp(8px,.8vh,12px)"}}>
                    {[{label:"Idle",val:idle},{label:"Avg",val:avg},{label:"Max",val:maxLoad}].map(s=>(
                      <div key={s.label} style={{background:"rgba(255,255,255,.03)",border:"1px solid rgba(140,190,255,.09)",borderRadius:12,padding:"clamp(8px,.8vh,12px)"}}>
                        <span style={{display:"block",color:"#7d97c2",fontSize:"clamp(9px,.8vh,11px)",fontWeight:800,letterSpacing:".12em",textTransform:"uppercase"}}>{s.label}</span>
                        <strong style={{display:"block",font:`800 clamp(20px,1.8vh,28px)/1 Manrope,sans-serif`,marginTop:4,letterSpacing:"-.03em"}}>{s.val}</strong>
                      </div>
                    ))}
                    {busiest&&(
                      <div style={{gridColumn:"1/-1",background:"rgba(255,255,255,.03)",border:"1px solid rgba(140,190,255,.09)",borderRadius:12,padding:"clamp(8px,.8vh,12px)",display:"flex",alignItems:"center",gap:10}}>
                        <div style={{width:"clamp(28px,2.5vh,36px)",height:"clamp(28px,2.5vh,36px)",borderRadius:9,display:"grid",placeItems:"center",fontSize:"clamp(10px,.9vh,13px)",fontWeight:800,color:"#fff",background:"linear-gradient(145deg,rgba(255,199,102,.7),rgba(94,225,255,.4))",flexShrink:0}}>{bIni}</div>
                        <div style={{minWidth:0}}>
                          <span style={{display:"block",color:"#7d97c2",fontSize:"clamp(9px,.8vh,11px)",fontWeight:800,letterSpacing:".12em",textTransform:"uppercase"}}>Busiest</span>
                          <strong style={{display:"block",fontSize:"clamp(12px,1.1vh,15px)",fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{busiest.name}</strong>
                        </div>
                        <div style={{marginLeft:"auto",flexShrink:0,fontSize:"clamp(16px,1.5vh,22px)",fontWeight:800,color:"#ffc766",letterSpacing:"-.02em"}}>{busiest.allocated}</div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </div>

      <RoboStyles/>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@500;600;700;800&display=swap');
        @keyframes alloc-orb      { to{transform:translate3d(46px,-38px,0) scale(1.12)} }
        @keyframes alloc-live     { 70%{box-shadow:0 0 0 12px rgba(79,157,255,0)} }
        @keyframes alloc-spin     { to{transform:rotate(360deg)} }
        @keyframes alloc-travel   { 0%{left:0;opacity:0}15%,80%{opacity:1}100%{left:calc(100% - 8px);opacity:0} }
        @keyframes alloc-cardIn   { from{opacity:0;transform:translateX(-14px) scale(.96)}to{opacity:1;transform:none} }
        @keyframes alloc-sweep    { 0%{transform:translateX(-100%)}100%{transform:translateX(200%)} }
        @keyframes alloc-confetti { to{transform:translate(var(--x),var(--y)) rotate(var(--r));opacity:0} }
        @keyframes alloc-queueExit  { 0%{opacity:1;transform:scale(1) translateY(0)}100%{opacity:0;transform:scale(.88) translateY(-20px)} }
        @keyframes alloc-queueEnter { 0%{opacity:0;transform:scale(.92) translateY(14px)}100%{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes alloc-tile-hit { 0%{transform:scale(1)}30%{transform:scale(1.22);box-shadow:0 0 0 3px rgba(255,255,255,.2),0 0 22px rgba(94,225,255,.5)}100%{transform:scale(1)} }
        @keyframes alloc-dot-in   { from{transform:scale(0)}to{transform:scale(1)} }
      `}</style>
    </div>
  );
}

// ─── AllocationScene — running state: drip-feed animation ─────────────────────

export function AllocationScene({ scene }: { scene: Extract<DisplayScene, { type: "allocation" }> }) {

  type AllocRow = { mentee: string; mentor: string; method: "preference" | "fallback" | "manual"; priority: number | null };
  type AllocData = { allocations: AllocRow[]; fcfsCount: number; fallbackCount: number; total: number; menteeTotal: number };

  // ── Refs ──────────────────────────────────────────────────────────────────
  const allDataRef     = useRef<AllocRow[]>([]);
  const revealedRef    = useRef(0);
  const tickerRef      = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollRef        = useRef<ReturnType<typeof setInterval> | null>(null);
  // Ref mirrors the state below so the drip-feed ticker (a setTimeout chain
  // outside React's render cycle) always reads the latest total without
  // needing to be re-created on every state change.
  const menteeTotalRef = useRef(scene.total || 83);

  const queueNodeRef    = useRef<HTMLDivElement>(null);
  const fcfsEngineRef   = useRef<HTMLDivElement>(null);
  const fbEngineRef     = useRef<HTMLDivElement>(null);
  const assignedNodeRef = useRef<HTMLDivElement>(null);

  const mentorLoadRef = useRef<Map<string, MentorLoadEntry>>(new Map());
  const feedKeyRef    = useRef(0);
  const qIdRef        = useRef(0);

  // ── State ─────────────────────────────────────────────────────────────────
  const [displayed,     setDisplayed]     = useState<AllocRow[]>([]);
  const [fcfsCount,     setFcfsCount]     = useState(0);
  const [fbCount,       setFbCount]       = useState(0);
  const [revealedCount, setRevealedCount] = useState(0);
  const [masterPct,     setMasterPct]     = useState(0);
  const [fcfsPct,       setFcfsPct]       = useState(0);
  const [fbPct,         setFbPct]         = useState(0);
  const [activeEngine,  setActiveEngine]  = useState<"fcfs"|"fallback"|null>(null);
  const [isComplete,    setIsComplete]    = useState(false);
  // Seeded from the nav-time estimate (`scene.total`) so the very first paint
  // already shows a sensible number; corrected to the authoritative
  // `menteeTotal` as soon as the first fetch resolves (see fetchData below).
  const [total,         setTotal]         = useState(scene.total || 83);
  const [queueItems,    setQueueItems]    = useState<{ id:number;name:string;exiting?:boolean }[]>([]);
  const [mentorLoad,    setMentorLoad]    = useState<MentorLoadEntry[]>([]);
  const [hitMentorName, setHitMentorName] = useState<string | null>(null);

  // ── Flying chip ───────────────────────────────────────────────────────────
  const flyChip = React.useCallback((initials: string, method: "fcfs" | "fallback") => {
    const from = queueNodeRef.current?.getBoundingClientRect();
    const via  = (method === "fcfs" ? fcfsEngineRef : fbEngineRef).current?.getBoundingClientRect();
    const to   = assignedNodeRef.current?.getBoundingClientRect();
    if (!from || !via || !to) return;

    const isFb = method === "fallback";
    const chip = document.createElement("div");
    chip.textContent = initials;
    Object.assign(chip.style, {
      position:"fixed", zIndex:"999", pointerEvents:"none",
      border:"1px solid rgba(255,255,255,.2)",
      background: isFb ? "#0f4a63" : "#1b3d8a",
      color: isFb ? "#e6fbff" : "#e8f1ff",
      borderRadius:"999px", padding:"8px 13px",
      fontSize:"13px", fontWeight:"800",
      fontFamily:"Manrope,sans-serif",
      boxShadow:`0 8px 25px rgba(0,0,0,.4),0 0 22px ${isFb ? "rgba(94,225,255,.3)" : "rgba(79,157,255,.3)"}`,
      whiteSpace:"nowrap",
      left:`${from.right - 60}px`,
      top:`${from.top + from.height * 0.4}px`,
    });
    document.body.appendChild(chip);

    const y0   = from.top + from.height * 0.4;
    const viaX = via.left - (from.right - 60) + 70;
    const viaY = via.top  + via.height / 2    - y0;
    const toX  = to.left  - (from.right - 60) + 90;
    const toY  = to.top   + 80                 - y0;

    chip.animate([
      { transform:"translate(0,0) scale(.8)",                      opacity:"0" },
      { transform:`translate(${viaX}px,${viaY}px) scale(1)`,      opacity:"1", offset:0.46 },
      { transform:`translate(${toX}px,${toY}px)   scale(.7)`,     opacity:"0" },
    ], { duration:1050, easing:"cubic-bezier(.2,.75,.2,1)" }).onfinish = () => chip.remove();
  }, []);

  // ── Confetti ──────────────────────────────────────────────────────────────
  const fireConfetti = React.useCallback(() => {
    const colors = ["#4f9dff","#5ee1ff","#ffc766","#eef5ff","#22c55e"];
    const pick = (a: string[]) => a[Math.floor(Math.random() * a.length)];
    for (let i = 0; i < 50; i++) {
      const c = document.createElement("div");
      const x = `${(Math.random() - 0.5) * 700}px`;
      const y = `${-120 + Math.random() * 460}px`;
      const r = `${Math.random() * 700 - 350}deg`;
      Object.assign(c.style, { position:"fixed", zIndex:"9999", pointerEvents:"none", width:"6px", height:"13px", borderRadius:"3px", left:`${48 + Math.random() * 4}%`, top:"55%", background:pick(colors), animationDelay:`${Math.random() * 0.18}s`, animation:"alloc-confetti 1.4s ease-out forwards" });
      c.style.setProperty("--x", x); c.style.setProperty("--y", y); c.style.setProperty("--r", r);
      document.body.appendChild(c);
      setTimeout(() => c.remove(), 1800);
    }
  }, []);

  // ── Rebuild queue ─────────────────────────────────────────────────────────
  const rebuildQueue = React.useCallback((revealed: number) => {
    const all    = allDataRef.current;
    const next4  = all.slice(revealed, revealed + 4);
    const names  = next4.map(r => r.mentee);
    while (names.length < 4) names.push(`${rand(FIRST)} ${rand(LAST)}`);
    const next = names.map(name => ({ id: ++qIdRef.current, name, exiting: false }));
    setQueueItems(prev => {
      if (prev.length > 0) {
        const withExit = [{ ...prev[0], exiting: true }, ...prev.slice(1)];
        setTimeout(() => setQueueItems(next), 300);
        return withExit;
      }
      return next;
    });
  }, []);

  // ── Drip-feed ticker ──────────────────────────────────────────────────────
  const TICK_MS = 620;

  const scheduleNext = React.useCallback(() => {
    if (tickerRef.current) clearTimeout(tickerRef.current);
    tickerRef.current = setTimeout(() => {
      const all = allDataRef.current;
      const idx = revealedRef.current;
      if (idx >= all.length) return;

      const row    = all[idx];
      const newIdx = idx + 1;
      revealedRef.current = newIdx;

      const isFcfs = row.method === "preference";
      const eng    = isFcfs ? "fcfs" : "fallback";
      const ini    = row.mentee.split(/\s+/).slice(0,2).map((w:string) => w[0]).join("").toUpperCase();

      setActiveEngine(eng);
      setTimeout(() => setActiveEngine(null), 500);
      flyChip(ini, eng);

      // Chip lands ~510ms — update matches + mentor tile
      setTimeout(() => {
        setDisplayed(prev => [row, ...prev].slice(0, 9));

        const mentorName = row.mentor;
        const map = mentorLoadRef.current;
        const existing = map.get(mentorName);
        if (existing) {
          map.set(mentorName, { ...existing, allocated: existing.allocated + 1 });
        } else {
          map.set(mentorName, { name: mentorName, allocated: 1, capacity: 0 });
        }
        setMentorLoad(Array.from(map.values()));
        setHitMentorName(mentorName);
        setTimeout(() => setHitMentorName(null), 800);
      }, 510);

      setRevealedCount(newIdx);
      const total   = menteeTotalRef.current;
      const newFcfs = all.slice(0, newIdx).filter(r => r.method === "preference").length;
      const newFb   = newIdx - newFcfs;
      const allTot  = Math.max(newFcfs + newFb, 1);
      setFcfsCount(newFcfs);
      setFbCount(newFb);
      setMasterPct((newIdx / total) * 100);
      setFcfsPct(Math.min((newFcfs / allTot) * 100, 100));
      setFbPct(Math.min((newFb   / allTot) * 100, 100));

      rebuildQueue(newIdx);

      if (newIdx >= all.length && all.length >= total) {
        setTimeout(() => { setIsComplete(true); fireConfetti(); }, 600);
      } else {
        scheduleNext();
      }
    }, TICK_MS);
  }, [rebuildQueue, flyChip, fireConfetti]);

  // ── Fetch allocations ─────────────────────────────────────────────────────
  const fetchData = React.useCallback(async () => {
    try {
      const res = await fetch("/api/display/allocations");
      if (!res.ok) return;
      const d = await res.json() as AllocData;
      const resolvedTotal = d.menteeTotal || scene.total || 83;
      if (resolvedTotal !== menteeTotalRef.current) {
        menteeTotalRef.current = resolvedTotal;
        setTotal(resolvedTotal);
      }

      const prev = allDataRef.current.length;
      allDataRef.current = d.allocations;

      if (prev === 0 && d.allocations.length > 0) {
        try {
          const mr = await fetch("/api/display/mentors");
          if (mr.ok) {
            const md = await mr.json() as { mentors: { name: string; allocatedCount: number; capacity: number }[] };
            const map = new Map<string, MentorLoadEntry>();
            md.mentors.forEach(m => map.set(m.name, { name: m.name, allocated: 0, capacity: m.capacity }));
            mentorLoadRef.current = map;
            setMentorLoad(Array.from(map.values()));
          }
        } catch { /* ignore */ }
        rebuildQueue(0);
      }

      if (d.allocations.length > prev && revealedRef.current >= prev) scheduleNext();
    } catch { /* ignore */ }
  }, [scene.total, scheduleNext, rebuildQueue]);

  useEffect(() => {
    fetchData();
    pollRef.current = setInterval(fetchData, 5000);
    return () => {
      if (pollRef.current)  clearInterval(pollRef.current);
      if (tickerRef.current) clearTimeout(tickerRef.current);
    };
  }, [fetchData]);

  // No loading guard here by design — see spec Change B. The dashboard shell
  // below renders immediately with all counts at zero; `total` is state (see
  // above) so it re-renders smoothly the moment the real total is known,
  // instead of silently drifting out of sync with what's on screen.

  const methodColor = (m: string, p: number | null) => {
    if (m === "preference") return p === 1 ? "#22c55e" : p === 2 ? "#f59e0b" : "#a78bfa";
    return "#38bdf8";
  };

  const FcfsIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" style={{ width:"clamp(14px,1.2vh,19px)", height:"clamp(14px,1.2vh,19px)" }}>
      <path d="M5 7h14M5 12h10M5 17h6"/>
    </svg>
  );
  const FallbackIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ width:"clamp(14px,1.2vh,19px)", height:"clamp(14px,1.2vh,19px)" }}>
      <path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>
    </svg>
  );
  const PeopleIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{ width:"clamp(22px,2.2vh,30px)", height:"clamp(22px,2.2vh,30px)" }}>
      <circle cx="9" cy="7" r="3"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/>
      <circle cx="17" cy="7" r="3" opacity=".5"/><path d="M21 21v-2a4 4 0 0 0-3-3.87" opacity=".5"/>
    </svg>
  );

  const engines = [
    { key:"fcfs"     as const, label:"FCFS allocation",    sub:"First come, first served · queue order preserved", badge:"Primary", count:fcfsCount, pct:fcfsPct, color:"#4f9dff", rgb:"79,157,255",  border:"rgba(79,157,255,.28)",  bg:"rgba(79,157,255,.16)",  Icon:FcfsIcon     },
    { key:"fallback" as const, label:"Fallback allocation", sub:"Unmatched mentees · random available mentor",       badge:"Random",  count:fbCount,  pct:fbPct,  color:"#5ee1ff", rgb:"94,225,255",  border:"rgba(94,225,255,.25)",  bg:"rgba(94,225,255,.13)",  Icon:FallbackIcon },
  ];

  return (
    <div style={{ position:"fixed", inset:0, overflow:"hidden", fontFamily:'"DM Sans","Manrope",system-ui,sans-serif', WebkitFontSmoothing:"antialiased", color:"#eef5ff", background:"radial-gradient(circle at 10% 10%,rgba(45,108,240,.28),transparent 34rem),radial-gradient(circle at 90% 15%,rgba(18,182,221,.16),transparent 30rem),radial-gradient(circle at 50% 110%,rgba(79,157,255,.12),transparent 40rem),linear-gradient(150deg,#03081a 0%,#061131 55%,#04091c 100%)" }}>

      {/* Grid overlay */}
      <div style={{ position:"absolute", inset:0, pointerEvents:"none", opacity:.4, backgroundImage:"linear-gradient(rgba(140,190,255,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(140,190,255,.05) 1px,transparent 1px)", backgroundSize:"60px 60px", WebkitMaskImage:"linear-gradient(to bottom,#000,transparent 92%)", maskImage:"linear-gradient(to bottom,#000,transparent 92%)" }} />

      {/* Orbs */}
      <div style={{ position:"fixed", width:520, height:520, borderRadius:"50%", filter:"blur(100px)", opacity:.16, left:-200, top:"35%", background:"#4f9dff", animation:"alloc-orb 14s ease-in-out infinite alternate", pointerEvents:"none" }} />
      <div style={{ position:"fixed", width:520, height:520, borderRadius:"50%", filter:"blur(100px)", opacity:.16, right:-200, bottom:-160, background:"#5ee1ff", animation:"alloc-orb 14s ease-in-out infinite alternate", animationDelay:"-6s", pointerEvents:"none" }} />

      {/* Shell */}
      <div style={{ position:"relative", height:"100vh", width:"min(1720px,100%)", margin:"0 auto", padding:"clamp(10px,1.3vh,20px) clamp(20px,3vw,52px)", display:"flex", flexDirection:"column", gap:"clamp(8px,1vh,16px)" }}>

        {/* Header */}
        <header style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:14, fontFamily:"Manrope,sans-serif" }}>
            <RobotLogoMark size="clamp(36px,3vh,48px)" />
            <div style={{ display:"flex", flexDirection:"column", gap:1 }}>
              <span style={{ fontSize:"clamp(16px,1.5vh,22px)", fontWeight:800, letterSpacing:"-.02em", background:"linear-gradient(90deg,#eef5ff 30%,#5ee1ff 100%)", WebkitBackgroundClip:"text", backgroundClip:"text", color:"transparent", lineHeight:1.1 }}>MentorFlow</span>
              <span style={{ fontSize:"clamp(9px,.8vh,11px)", fontWeight:600, color:"rgba(140,190,255,.45)", letterSpacing:".16em", textTransform:"uppercase" }}>Allocation Engine</span>
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:10, border:"1px solid rgba(140,190,255,.13)", background:"rgba(8,20,50,.7)", padding:"clamp(8px,.8vh,13px) clamp(14px,1.3vh,20px)", borderRadius:999, color: isComplete ? "#86efac" : "#c3d6f5", fontSize:"clamp(13px,1.15vh,17px)", fontWeight:700, letterSpacing:".1em", textTransform:"uppercase" }}>
            <span style={{ width:10, height:10, borderRadius:"50%", background: isComplete ? "#22c55e" : "#4f9dff", boxShadow: isComplete ? "0 0 8px rgba(34,197,94,.7)" : "0 0 0 0 rgba(79,157,255,.55)", animation: isComplete ? "none" : "alloc-live 1.8s infinite", flexShrink:0, display:"inline-block" }} />
            {isComplete ? "Allocation Complete" : "Allocation Live"}
          </div>
        </header>

        {/* Dashboard grid */}
        <div style={{ flex:1, minHeight:0, display:"grid", gridTemplateColumns:"minmax(0,1fr) clamp(320px,24vw,420px)", gap:"clamp(8px,1vh,16px)" }}>

          {/* Main card */}
          <div style={{ position:"relative", minHeight:0, border:"1px solid rgba(140,190,255,.13)", background:"linear-gradient(145deg,rgba(13,30,70,.82),rgba(6,14,38,.86))", boxShadow:"0 30px 90px rgba(0,0,0,.35),inset 0 1px 0 rgba(255,255,255,.04)", backdropFilter:"blur(20px)", borderRadius:28, padding:"clamp(14px,1.5vh,24px)", display:"flex", flexDirection:"column" }}>
            <div style={{ position:"absolute", inset:0, pointerEvents:"none", borderRadius:28, background:"linear-gradient(115deg,rgba(255,255,255,.035),transparent 28%)" }} />

            {/* Card head */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:14, paddingBottom:"clamp(10px,1.2vh,18px)", flexShrink:0 }}>
              <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                <h2 style={{ font:`800 clamp(18px,1.7vh,26px) Manrope,sans-serif`, letterSpacing:"-.02em" }}>Allocation pipeline</h2>
                <span style={{ color:"#6f89b3", fontSize:"clamp(13px,1.1vh,17px)" }}>Two strategies · one live process</span>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:9, color: isComplete ? "#22c55e" : "#4f9dff", fontSize:"clamp(13px,1.1vh,16px)", fontWeight:700, padding:"clamp(6px,.65vh,10px) clamp(12px,1.2vh,18px)", border:`1px solid ${isComplete ? "rgba(34,197,94,.3)" : "rgba(79,157,255,.25)"}`, borderRadius:999, background: isComplete ? "rgba(34,197,94,.1)" : "rgba(79,157,255,.12)" }}>
                {!isComplete && <div style={{ width:13, height:13, border:"2px solid rgba(79,157,255,.25)", borderTopColor:"#4f9dff", borderRadius:"50%", animation:"alloc-spin .8s linear infinite", flexShrink:0 }} />}
                {isComplete ? "Complete" : "Processing"}
              </div>
            </div>

            {/* Flow */}
            <div style={{ position:"relative", flex:1, minHeight:0, display:"grid", gridTemplateColumns:"minmax(180px,.78fr) 52px minmax(260px,1.4fr) 52px minmax(200px,.9fr)", alignItems:"stretch", gap:10 }}>

              {/* Queue node */}
              <div ref={queueNodeRef} style={{ position:"relative", border:"1px solid rgba(140,190,255,.1)", background:"rgba(3,10,30,.5)", borderRadius:22, padding:"clamp(14px,1.5vh,22px)", overflow:"hidden", display:"flex", flexDirection:"column", justifyContent:"space-between" }}>
                <div>
                  <div style={{ color:"#7d97c2", font:`800 clamp(11px,1vh,14px) Manrope,sans-serif`, letterSpacing:".14em", textTransform:"uppercase", marginBottom:"clamp(12px,1.2vh,18px)", display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ width:"clamp(22px,2vh,28px)", height:"clamp(22px,2vh,28px)", borderRadius:8, background:"rgba(79,157,255,.12)", display:"grid", placeItems:"center", flexShrink:0 }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="#4f9dff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ width:"clamp(12px,1.1vh,16px)", height:"clamp(12px,1.1vh,16px)" }}><path d="M12 5v14M5 12l7 7 7-7"/></svg>
                    </span>
                    Incoming queue
                  </div>
                  <div style={{ position:"relative", height:"clamp(140px,15vh,220px)", margin:"0 4px 4px" }}>
                    {queueItems.slice(0,4).map((item, qi) => {
                      const scales=[1,.94,.88,.82], tops=["0%","25%","50%","75%"], ops=[1,.65,.38,.18];
                      return (
                        <div key={item.id} style={{ position:"absolute", left:0, right:0, height:"clamp(50px,5.2vh,76px)", border:"1px solid rgba(140,190,255,.14)", background:"linear-gradient(145deg,#12275a,#0b1a40)", borderRadius:16, display:"flex", alignItems:"center", gap:12, padding:"clamp(8px,.9vh,13px)", boxShadow:"0 12px 26px rgba(0,0,0,.25)", top:tops[qi], zIndex:4-qi, transform:`scale(${scales[qi]})`, opacity: item.exiting?0:ops[qi], transformOrigin:"top center", transition:"all .45s cubic-bezier(.2,.8,.2,1)", animation: item.exiting ? "alloc-queueExit .3s cubic-bezier(.4,0,1,1) forwards" : qi===0 ? "alloc-queueEnter .35s cubic-bezier(.16,1,.3,1) both" : "none" }}>
                          <div style={{ width:"clamp(32px,3.2vh,46px)", height:"clamp(32px,3.2vh,46px)", borderRadius:12, display:"grid", placeItems:"center", background:"linear-gradient(145deg,#2a4f9a,#1a3570)", color:"#d8e8ff", fontSize:"clamp(12px,1.1vh,16px)", fontWeight:800, flexShrink:0 }}>
                            {item.name.split(/\s+/).slice(0,2).map((w:string)=>w[0]).join("").toUpperCase()}
                          </div>
                          <span style={{ minWidth:0 }}>
                            <b style={{ display:"block", fontSize:"clamp(14px,1.3vh,18px)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{item.name}</b>
                            <small style={{ display:"block", color:"#7c95bf", fontSize:"clamp(11px,1vh,14px)", marginTop:3 }}>Pending</small>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div style={{ display:"flex", alignItems:"flex-end", gap:10 }}>
                  <strong style={{ font:`800 clamp(34px,3.8vh,58px)/.9 Manrope,sans-serif`, letterSpacing:"-.05em", color:"#fff" }}>{total - revealedCount}</strong>
                  <span style={{ fontSize:"clamp(14px,1.2vh,18px)", color:"#7d97c2", paddingBottom:6 }}>waiting</span>
                </div>
              </div>

              {/* Connector */}
              <div style={{ position:"relative", display:"flex", alignItems:"center" }}>
                <div style={{ height:2, width:"100%", background:"linear-gradient(90deg,rgba(79,157,255,.12),rgba(79,157,255,.7),rgba(79,157,255,.12))" }} />
                <div style={{ position:"absolute", right:0, width:9, height:9, borderTop:"2px solid #4f9dff", borderRight:"2px solid #4f9dff", transform:"rotate(45deg)" }} />
                <div style={{ position:"absolute", width:10, height:10, borderRadius:"50%", background:"#4f9dff", boxShadow:"0 0 14px #4f9dff", animation:"alloc-travel 1.35s linear infinite" }} />
              </div>

              {/* Engines */}
              <div style={{ display:"grid", gridTemplateRows:"1fr 1fr", gap:10, minHeight:0 }}>
                {engines.map(eng => (
                  <div key={eng.key} ref={eng.key==="fcfs" ? fcfsEngineRef : fbEngineRef}
                    style={{ position:"relative", border:`1px solid ${eng.border}`, background:`linear-gradient(115deg,${eng.bg},rgba(6,16,45,.4))`, borderRadius:20, padding:"clamp(12px,1.3vh,20px) clamp(14px,1.4vh,22px)", overflow:"hidden", display:"flex", flexDirection:"column", justifyContent:"space-between" }}>
                    {activeEngine===eng.key && <div style={{ position:"absolute", inset:0, background:"linear-gradient(100deg,transparent,rgba(255,255,255,.12),transparent)", animation:"alloc-sweep .55s cubic-bezier(.2,.8,.2,1) forwards", pointerEvents:"none" }} />}
                    <div>
                      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:10 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:12, font:`800 clamp(15px,1.4vh,20px) Manrope,sans-serif` }}>
                          <div style={{ width:"clamp(30px,2.8vh,42px)", height:"clamp(30px,2.8vh,42px)", borderRadius:11, display:"grid", placeItems:"center", color:eng.color, background:`rgba(${eng.rgb},.15)`, flexShrink:0 }}><eng.Icon /></div>
                          {eng.label}
                        </div>
                        <span style={{ fontSize:"clamp(11px,1vh,14px)", fontWeight:800, letterSpacing:".08em", textTransform:"uppercase", borderRadius:99, padding:"6px 12px", color:eng.color, background:`rgba(${eng.rgb},.13)`, flexShrink:0 }}>{eng.badge}</span>
                      </div>
                      <p style={{ fontSize:"clamp(12px,1.1vh,15px)", color:"#8aa3cc", marginTop:"clamp(5px,.6vh,9px)" }}>{eng.sub}</p>
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:12, marginTop:"clamp(8px,.9vh,14px)" }}>
                      <div style={{ height:6, flex:1, background:"rgba(255,255,255,.07)", borderRadius:6, overflow:"hidden" }}>
                        <div style={{ display:"block", height:"100%", width:`${eng.pct}%`, borderRadius:6, background:eng.color, boxShadow:`0 0 10px ${eng.color}`, transition:"width .45s cubic-bezier(.2,.8,.2,1)" }} />
                      </div>
                      <strong style={{ font:`800 clamp(15px,1.4vh,20px) Manrope,sans-serif`, minWidth:"clamp(46px,4.2vh,64px)", textAlign:"right", color:"#eef5ff" }}>
                        {eng.count}<span style={{ color:"#6f89b3", fontWeight:600 }}>/{total}</span>
                      </strong>
                    </div>
                  </div>
                ))}
              </div>

              {/* Connector */}
              <div style={{ position:"relative", display:"flex", alignItems:"center" }}>
                <div style={{ height:2, width:"100%", background:"linear-gradient(90deg,rgba(79,157,255,.12),rgba(79,157,255,.7),rgba(79,157,255,.12))" }} />
                <div style={{ position:"absolute", right:0, width:9, height:9, borderTop:"2px solid #4f9dff", borderRight:"2px solid #4f9dff", transform:"rotate(45deg)" }} />
                <div style={{ position:"absolute", width:10, height:10, borderRadius:"50%", background:"#4f9dff", boxShadow:"0 0 14px #4f9dff", animation:"alloc-travel 1.35s linear infinite", animationDelay:"-.7s" }} />
              </div>

              {/* Latest matches */}
              <div ref={assignedNodeRef} style={{ border:"1px solid rgba(140,190,255,.1)", background:"rgba(3,10,30,.5)", borderRadius:22, padding:"clamp(14px,1.5vh,22px)", overflow:"hidden", display:"flex", flexDirection:"column", minHeight:0 }}>
                <div style={{ color:"#7d97c2", font:`800 clamp(10px,.9vh,13px) Manrope,sans-serif`, letterSpacing:".14em", textTransform:"uppercase", marginBottom:"clamp(8px,.9vh,13px)", flexShrink:0, display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ width:"clamp(22px,2vh,28px)", height:"clamp(22px,2vh,28px)", borderRadius:8, background:"rgba(79,157,255,.12)", display:"grid", placeItems:"center", flexShrink:0 }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="#4f9dff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ width:"clamp(12px,1.1vh,15px)", height:"clamp(12px,1.1vh,15px)" }}>
                      <circle cx="17" cy="7" r="3"/><circle cx="7" cy="17" r="3"/>
                      <path d="M14 7H7a5 5 0 0 0 0 10h3"/>
                    </svg>
                  </span>
                  Latest matches
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:6, overflow:"hidden", flex:1, minHeight:0 }}>
                  {displayed.map((row, i) => (
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:10, border:"1px solid rgba(140,190,255,.1)", background:"rgba(14,30,72,.7)", padding:"clamp(6px,.65vh,9px) clamp(8px,.85vh,12px)", borderRadius:12, flexShrink:0, animation:"alloc-cardIn .55s cubic-bezier(.2,.8,.2,1) both" }}>
                      <div style={{ width:"clamp(28px,2.6vh,38px)", height:"clamp(28px,2.6vh,38px)", borderRadius:9, flexShrink:0, display:"grid", placeItems:"center", background:"linear-gradient(145deg,#1e3a78,#152b5e)", color:"#c3d8ff", fontSize:"clamp(10px,.9vh,13px)", fontWeight:800, letterSpacing:".04em" }}>
                        {row.mentee.split(/\s+/).slice(0,2).map((w:string)=>w[0]).join("").toUpperCase()}
                      </div>
                      <span style={{ minWidth:0, flex:1 }}>
                        <b style={{ display:"block", fontSize:"clamp(12px,1.15vh,16px)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{row.mentee}</b>
                        <small style={{ display:"block", color:"#7c95bf", fontSize:"clamp(10px,1vh,13px)", marginTop:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{row.mentor}</small>
                      </span>
                      <div style={{ width:10, height:10, borderRadius:"50%", background:methodColor(row.method,row.priority), boxShadow:`0 0 8px ${methodColor(row.method,row.priority)}`, flexShrink:0 }} />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Progress footer */}
            <div style={{ flexShrink:0, display:"grid", gridTemplateColumns:"1fr auto", gap:18, alignItems:"center", borderTop:"1px solid rgba(140,190,255,.13)", padding:"clamp(10px,1.1vh,16px) 3px 2px", marginTop:"clamp(10px,1.1vh,16px)" }}>
              <div style={{ height:8, borderRadius:10, background:"rgba(255,255,255,.07)", overflow:"hidden" }}>
                <div style={{ display:"block", height:"100%", width:`${masterPct}%`, background:"linear-gradient(90deg,#2d6cf0,#4f9dff,#5ee1ff)", borderRadius:"inherit", boxShadow:"0 0 18px rgba(79,157,255,.55)", transition:"width .45s cubic-bezier(.2,.8,.2,1)" }} />
              </div>
              <div style={{ font:`700 clamp(15px,1.3vh,20px) Manrope,sans-serif`, color:"#8aa3cc", whiteSpace:"nowrap" }}>
                <strong style={{ color:"#eef5ff", fontSize:"clamp(20px,1.8vh,28px)" }}>{revealedCount}</strong>/{total}
                <span style={{ marginLeft:6, color:"#6f89b3", fontSize:"clamp(12px,1vh,15px)", fontWeight:600, textTransform:"uppercase", letterSpacing:".06em" }}>assigned</span>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div style={{ display:"grid", gridTemplateRows:"auto minmax(0,1fr)", gap:"clamp(8px,1vh,16px)", minHeight:0 }}>

            {/* Stats card */}
            <div style={{ border:"1px solid rgba(140,190,255,.13)", background:"linear-gradient(145deg,rgba(13,30,70,.82),rgba(6,14,38,.86))", boxShadow:"0 30px 90px rgba(0,0,0,.35),inset 0 1px 0 rgba(255,255,255,.04)", backdropFilter:"blur(20px)", borderRadius:24, padding:"clamp(14px,1.4vh,22px)", display:"flex", flexDirection:"column", gap:12 }}>
              <div style={{ position:"relative", padding:"clamp(14px,1.4vh,20px) clamp(16px,1.5vh,24px)", borderRadius:18, background:"linear-gradient(135deg,rgba(79,157,255,.14),rgba(45,108,240,.1))", border:"1px solid rgba(79,157,255,.18)", overflow:"hidden" }}>
                <div style={{ position:"absolute", width:90, height:90, borderRadius:"50%", right:-22, top:-22, background:"#4f9dff", filter:"blur(32px)", opacity:.2, pointerEvents:"none" }} />
                <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between" }}>
                  <div>
                    <div style={{ color:"#7d97c2", fontSize:"clamp(11px,1vh,14px)", fontWeight:800, letterSpacing:".12em", textTransform:"uppercase", marginBottom:"clamp(6px,.6vh,10px)" }}>Total allocated</div>
                    <div style={{ font:`800 clamp(42px,4.2vh,66px)/1 Manrope,sans-serif`, letterSpacing:"-.05em" }}>
                      {revealedCount}<small style={{ fontSize:"clamp(18px,1.6vh,24px)", color:"#6f89b3", fontWeight:600, letterSpacing:0 }}>/{total}</small>
                    </div>
                  </div>
                  <div style={{ color:"#4f9dff", opacity:.7, flexShrink:0, marginTop:4 }}><PeopleIcon /></div>
                </div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                {[
                  { label:"FCFS",     count:fcfsCount, color:"#4f9dff", Icon:FcfsIcon,     border:"rgba(79,157,255,.12)", bg:"#4f9dff" },
                  { label:"Fallback", count:fbCount,   color:"#5ee1ff", Icon:FallbackIcon, border:"rgba(94,225,255,.12)", bg:"#5ee1ff" },
                ].map(s => (
                  <div key={s.label} style={{ position:"relative", padding:"clamp(12px,1.2vh,18px)", borderRadius:16, background:"rgba(255,255,255,.03)", border:`1px solid ${s.border}`, overflow:"hidden" }}>
                    <div style={{ position:"absolute", width:70, height:70, borderRadius:"50%", right:-20, top:-20, background:s.bg, filter:"blur(26px)", opacity:.18, pointerEvents:"none" }} />
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"clamp(6px,.6vh,10px)" }}>
                      <div style={{ color:"#7d97c2", fontSize:"clamp(11px,1vh,14px)", fontWeight:800, letterSpacing:".1em", textTransform:"uppercase" }}>{s.label}</div>
                      <div style={{ color:s.color, opacity:.7 }}><s.Icon /></div>
                    </div>
                    <div style={{ font:`800 clamp(32px,3.2vh,50px)/1 Manrope,sans-serif`, letterSpacing:"-.04em", color:"#eef5ff" }}>{s.count}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mentor load constellation */}
            <div style={{ border:"1px solid rgba(140,190,255,.13)", background:"linear-gradient(145deg,rgba(13,30,70,.82),rgba(6,14,38,.86))", boxShadow:"0 30px 90px rgba(0,0,0,.35),inset 0 1px 0 rgba(255,255,255,.04)", backdropFilter:"blur(20px)", borderRadius:24, padding:"clamp(14px,1.4vh,22px)", display:"flex", flexDirection:"column", minHeight:0, overflow:"hidden" }}>

              <div style={{ flexShrink:0, display:"flex", alignItems:"center", justifyContent:"space-between", paddingBottom:"clamp(10px,1vh,15px)", borderBottom:"1px solid rgba(140,190,255,.13)", marginBottom:"clamp(8px,.8vh,12px)" }}>
                <div style={{ font:`800 clamp(14px,1.3vh,18px) Manrope,sans-serif` }}>
                  Mentor load · <span style={{ color:"#6f89b3", fontWeight:600 }}>{mentorLoad.length} mentors</span>
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  {[{label:"idle",bg:"rgba(140,190,255,.12)"},{label:"1",bg:"rgba(79,157,255,.45)"},{label:"2–3",bg:"rgba(94,225,255,.7)"},{label:"4+",bg:"#ffc766"}].map(l => (
                    <div key={l.label} style={{ display:"flex", alignItems:"center", gap:4, fontSize:"clamp(9px,.8vh,11px)", fontWeight:700, color:"#6f89b3" }}>
                      <span style={{ width:9, height:9, borderRadius:3, background:l.bg, display:"inline-block", flexShrink:0 }} />
                      {l.label}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ flex:1, minHeight:0, overflow:"hidden" }}>
                {mentorLoad.length === 0 ? (
                  <div style={{ height:"100%", display:"grid", placeItems:"center", color:"#4a6080", fontSize:"clamp(12px,1.1vh,15px)" }}>Loading mentor data…</div>
                ) : (
                  <MentorLoadGrid mentors={mentorLoad} hitName={hitMentorName} />
                )}
              </div>

              {/* Footer stats */}
              {mentorLoad.length > 0 && (() => {
                const assigned = mentorLoad.filter(m => m.allocated > 0);
                const idle     = mentorLoad.length - assigned.length;
                const total_a  = mentorLoad.reduce((s, m) => s + m.allocated, 0);
                const maxLoad  = assigned.length > 0 ? Math.max(...assigned.map(m => m.allocated)) : 0;
                const avg      = (total_a / mentorLoad.length).toFixed(1);
                const busiest  = assigned.length > 0 ? assigned.reduce((a,b) => b.allocated > a.allocated ? b : a) : null;
                const bIni     = busiest?.name.split(/\s+/).filter((w:string) => w.length > 1 || /^[A-Z]$/.test(w)).slice(0,2).map((w:string)=>w[0]).join("").toUpperCase() ?? "";
                return (
                  <div style={{ flexShrink:0, display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, borderTop:"1px solid rgba(140,190,255,.09)", paddingTop:"clamp(10px,1vh,14px)", marginTop:"clamp(8px,.8vh,12px)" }}>
                    {[{label:"Idle",val:idle},{label:"Avg",val:avg},{label:"Max",val:maxLoad}].map(s => (
                      <div key={s.label} style={{ background:"rgba(255,255,255,.03)", border:"1px solid rgba(140,190,255,.09)", borderRadius:12, padding:"clamp(8px,.8vh,12px)" }}>
                        <span style={{ display:"block", color:"#7d97c2", fontSize:"clamp(9px,.8vh,11px)", fontWeight:800, letterSpacing:".12em", textTransform:"uppercase" }}>{s.label}</span>
                        <strong style={{ display:"block", font:`800 clamp(20px,1.8vh,28px)/1 Manrope,sans-serif`, marginTop:4, letterSpacing:"-.03em" }}>{s.val}</strong>
                      </div>
                    ))}
                    {busiest && (
                      <div style={{ gridColumn:"1/-1", background:"rgba(255,255,255,.03)", border:"1px solid rgba(140,190,255,.09)", borderRadius:12, padding:"clamp(8px,.8vh,12px)", display:"flex", alignItems:"center", gap:10 }}>
                        <div style={{ width:"clamp(28px,2.5vh,36px)", height:"clamp(28px,2.5vh,36px)", borderRadius:9, display:"grid", placeItems:"center", fontSize:"clamp(10px,.9vh,13px)", fontWeight:800, color:"#fff", background:"linear-gradient(145deg,rgba(255,199,102,.7),rgba(94,225,255,.4))", flexShrink:0 }}>{bIni}</div>
                        <div style={{ minWidth:0 }}>
                          <span style={{ display:"block", color:"#7d97c2", fontSize:"clamp(9px,.8vh,11px)", fontWeight:800, letterSpacing:".12em", textTransform:"uppercase" }}>Busiest</span>
                          <strong style={{ display:"block", fontSize:"clamp(12px,1.1vh,15px)", fontWeight:700, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{busiest.name}</strong>
                        </div>
                        <div style={{ marginLeft:"auto", flexShrink:0, fontSize:"clamp(16px,1.5vh,22px)", fontWeight:800, color:"#ffc766", letterSpacing:"-.02em" }}>{busiest.allocated}</div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </div>

      <RoboStyles />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@500;600;700;800&display=swap');
        @keyframes alloc-orb      { to{transform:translate3d(46px,-38px,0) scale(1.12)} }
        @keyframes alloc-live     { 70%{box-shadow:0 0 0 12px rgba(79,157,255,0)} }
        @keyframes alloc-spin     { to{transform:rotate(360deg)} }
        @keyframes alloc-travel   { 0%{left:0;opacity:0}15%,80%{opacity:1}100%{left:calc(100% - 8px);opacity:0} }
        @keyframes alloc-cardIn   { from{opacity:0;transform:translateX(-14px) scale(.96)}to{opacity:1;transform:none} }
        @keyframes alloc-sweep    { 0%{transform:translateX(-100%)}100%{transform:translateX(200%)} }
        @keyframes alloc-confetti { to{transform:translate(var(--x),var(--y)) rotate(var(--r));opacity:0} }
        @keyframes alloc-queueExit  { 0%{opacity:1;transform:scale(1) translateY(0)}100%{opacity:0;transform:scale(.88) translateY(-20px)} }
        @keyframes alloc-queueEnter { 0%{opacity:0;transform:scale(.92) translateY(14px)}100%{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes alloc-tile-hit { 0%{transform:scale(1)}30%{transform:scale(1.22);box-shadow:0 0 0 3px rgba(255,255,255,.2),0 0 22px rgba(94,225,255,.5)}100%{transform:scale(1)} }
        @keyframes alloc-dot-in   { from{transform:scale(0)}to{transform:scale(1)} }
      `}</style>
    </div>
  );
}
