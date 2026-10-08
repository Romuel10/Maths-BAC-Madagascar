const paths:Record<string,string>={
 home:'M3 10 12 3l9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z',
 solve:'M4 4h16v16H4z M8 8h8 M8 12h2 M14 12h2 M8 16h2 M14 16h2',
 book:'M12 5c-3-2-6-2-9-1v15c3-1 6-1 9 1 3-2 6-2 9-1V4c-3-1-6-1-9 1z M12 5v15',
 practice:'M9 3h6v3H9z M6 5H4v16h16V5h-2 M8 12l2 2 5-5 M8 18h8',
 note:'M6 3h13v18H6z M3 7h5 M3 12h5 M3 17h5 M11 8h5 M11 12h5',
 arrow:'M4 12h16 M14 6l6 6-6 6',back:'M20 12H4 M10 6l-6 6 6 6',chevron:'m9 5 7 7-7 7',
 settings:'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8 M12 2v3 M12 19v3 M2 12h3 M19 12h3 M5 5l2 2 M17 17l2 2 M5 19l2-2 M17 7l2-2',
 moon:'M20 15A8 8 0 0 1 9 4a8 8 0 1 0 11 11z',sun:'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8 M12 2v2 M12 20v2 M2 12h2 M20 12h2',
 check:'m5 12 4 4L19 6',close:'m6 6 12 12 M6 18 18 6',bookmark:'M6 3h12v18l-6-4-6 4z',
 download:'M12 3v12 m-5-5 5 5 5-5 M4 17v4h16v-4',upload:'M12 16V4 m-5 5 5-5 5 5 M4 17v4h16v-4',
 clock:'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18 M12 7v5l3 2',
 search:'M10 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14 m5 12 6 6',
 trash:'M3 6h18 M9 6V3h6v3 M5 6l1 15h12l1-15 M10 10v7 M14 10v7',
 external:'M14 3h7v7 M21 3 10 14 M10 3H3v18h18v-7',graph:'M4 3v17h17 M6 15l4-6 4 3 6-8',
 shield:'m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6z M8 12l3 3 5-6',
 menu:'M4 6h16 M4 12h16 M4 18h16',copy:'M8 8h13v13H8z M16 8V3H3v13h5'
};
export function Icon({name,size=20}:{name:string;size?:number}){return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]??paths.solve}/></svg>;}
