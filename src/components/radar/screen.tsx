import { useState, type ReactNode, type MouseEvent } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import parse, { domToReact, Element, attributesToProps, type DOMNode, type HTMLReactParserOptions } from 'html-react-parser';
import { Button } from '@/components/ui/button';
import screens from '@/data/screens.json';
import shell from '@/data/shell.json';
import leadData from '@/data/leads.json';

const paths = {'overview':'/','find-leads':'/find-leads','lead-inbox':'/lead-inbox','research-queue':'/research-queue','outreach':'/outreach','saved-searches':'/saved-searches','sources-and-platforms':'/sources-and-platforms','usage-and-limits':'/usage-and-limits','settings':'/settings'} as const;
type Page=keyof typeof paths;
const labels:Record<Page,string>={'overview':'Overview','find-leads':'Find Leads','lead-inbox':'Lead Inbox','research-queue':'Research Queue','outreach':'Outreach','saved-searches':'Saved Searches','sources-and-platforms':'Sources & Platforms','usage-and-limits':'Usage & Limits','settings':'Settings'};
const screenIds:Record<Page,number>={overview:10,'find-leads':11,'lead-inbox':2,'research-queue':3,outreach:9,'saved-searches':7,'sources-and-platforms':13,'usage-and-limits':5,settings:4};
const lightIds:Record<number,number>={10:6,11:12,2:1,8:14};
function nodeText(node:DOMNode):string {if(node.type==='text')return node.data;return 'children' in node?node.children.map(n=>nodeText(n as DOMNode)).join(' '):'';}
function download(name:string,text:string,type='text/csv'){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type}));a.download=name;a.click();URL.revokeObjectURL(a.href);}
export function pageHead(title:string,description:string){return {meta:[{title:`${title} | Opportunity Radar`},{name:'description',content:description},{property:'og:title',content:`${title} | Opportunity Radar`},{property:'og:description',content:description},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary_large_image'}]};}
export function RadarScreen({page,detail=false}:{page:Page;detail?:boolean}){
 const navigate=useNavigate(); const [theme,setTheme]=useState('dark'); const [query,setQuery]=useState(''); const [status,setStatus]=useState('All'); const [selected,setSelected]=useState('1'); const [drawer,setDrawer]=useState(true);const [empty,setEmpty]=useState(false);const [notice,setNotice]=useState('');const [modal,setModal]=useState('');const [name,setName]=useState('');const [savedNames,setSavedNames]=useState<string[]>([]);const [notes,setNotes]=useState<string[]>([]);const [updated,setUpdated]=useState<Record<string,string>>({});const [paused,setPaused]=useState<string[]>([]);const [toggles,setToggles]=useState<string[]>([]);const [filters,setFilters]=useState<Record<string,string>>({});const [busy,setBusy]=useState(false);const [threshold,setThreshold]=useState(75);
 const baseId=detail?8:screenIds[page];const id=theme==='light'?(lightIds[baseId]??baseId):baseId;
 const leads=leadData as Record<string,Record<string,string>>;const lead=leads[selected]??leads['1'];
 const alert=(text:string)=>{setNotice(text);window.setTimeout(()=>setNotice(''),4000);};
 const exportLeads=()=>download('radar-leads.csv','Company,Domain,Fit Score,Status\n'+Object.entries(leads).map(([key,l])=>`"${l.title}",${l.domain},${l.score},${updated[key]??'Qualified'}`).join('\n'));
 const run=()=>{if(busy)return;setBusy(true);alert('Running discovery preview…');window.setTimeout(()=>{setBusy(false);alert('Preview complete. Sample opportunities are ready in your Lead Inbox.');void navigate({to:'/lead-inbox'});},1200);};
 const act=(event:MouseEvent<HTMLElement>,node:Element,key:string)=>{
  const text=nodeText(node);const action=node.attribs['data-action']??'';const el=event.currentTarget;
  if(/toggleDashboardState|Preview Empty|Preview Demo|Restore Demo/.test(text+action)){setEmpty(!empty);return;}
  if(/New Search|Find New Leads|first discovery|Run Discovery Scan/.test(text)){void navigate({to:'/find-leads'});return;}
  if(/findOpportunitiesBtn/.test(node.attribs.id??'')||/Find Opportunities|Run Now|Run All Active|Run Batch/.test(text)){run();return;}
  if(/Export|file_download/.test(text)){exportLeads();return;}
  if(/Generate Outreach|Push to Outreach|sendQueueBtn/.test(text+(node.attribs.id??''))){void navigate({to:'/outreach'});return;}
  if(/Copy|copyBtn/.test(text+(node.attribs.id??''))){const draft=document.querySelector<HTMLTextAreaElement>('#draftBody')?.value??document.querySelector('[contenteditable]')?.textContent??lead?.pitchBody??'';void navigator.clipboard.writeText(draft).then(()=>alert('Draft copied to clipboard.')).catch(()=>alert('Clipboard unavailable. Select and copy the draft.'));return;}
  if(/addNoteBtn/.test(node.attribs.id??'')){const input=document.querySelector<HTMLInputElement>('#noteInput');if(input?.value.trim()){setNotes([...notes,input.value.trim()]);input.value='';}return;}
  if(/closeDrawerBtn/.test(node.attribs.id??'')){setDrawer(false);return;}
  if(/Mark Contacted|Mark as Contacted/.test(text)){setUpdated({...updated,[selected]:'Contacted'});alert('Lead marked contacted in this preview.');return;}
  if(/Qualify/.test(text)){const row=el.closest('tr');const rowKey=row?.getAttribute('data-lead-id')??selected;setUpdated({...updated,[rowKey]:'Qualified'});alert('Lead qualified.');return;}
  if(/Investigate|Open Research Brief|View Full|Full Brief/.test(text)){const row=el.closest('tr');const k=row?.getAttribute('data-lead-id');if(k){setSelected(k);setDrawer(true);}else void navigate({to:page==='research-queue'?'/lead-inbox':'/leads/meridian'});return;}
  if(/Draft|Review Ready/.test(text)&&page!=='outreach'){void navigate({to:'/outreach'});return;}
  if(/Save as Preset|Create Saved Search|Edit|Add Market|Add Term|Custom Country/.test(text)){setModal(text.includes('Edit')?'Edit saved search':text.includes('Market')||text.includes('Country')?'Add market':text.includes('Term')?'Add exclusion':'Save search');return;}
  if(/Light|Daylight/.test(text)){setTheme('light');return;}if(/Dark|System/.test(text)){setTheme('dark');return;}
  if(/Save Changes/.test(text)){alert('Settings applied to this preview session.');return;}if(/Discard/.test(text)){setThreshold(75);alert('Changes discarded.');return;}
  if(/Clear Demo Data/.test(text)){setEmpty(true);alert('Demo records hidden.');return;}if(/Reset Workspace/.test(text)){setEmpty(false);setFilters({});setToggles([]);return;}
  if(/Pause|Activate|Abort/.test(text)){setPaused(paused.includes(key)?paused.filter(k=>k!==key):[...paused,key]);alert(paused.includes(key)?'Monitor activated in preview.':'Monitor paused in preview.');return;}
  if(/Test Connection|testConnection|Re-sync|Ping/.test(text+action)){alert('Demo connection status only. No live API credentials are connected.');return;}
  if(/Configure|Update Key|openConfig/.test(text+action)){setModal('Connection details');return;}
  if(/Filter|Country:|Industry:|Signal:|Score:|Evidence:|Source:/.test(text)){setModal('Filter leads');return;}
  if(/Reset/.test(text)){setQuery('');setStatus('All');setFilters({});return;}
  if(/Highest Fit|Most Recent|Dense|Expanded|History|All Settings|Personalization|Scoring|API Integrations|Data Management|Appearance|Batch Actions|Direct Email|LinkedIn|Regenerate|regenBtn|Promote/.test(text+(node.attribs.id??''))){
   if(/Batch/.test(text)){document.querySelectorAll<HTMLInputElement>('.lead-row input[type="checkbox"]:checked').forEach(input=>{const rowKey=input.closest('tr')?.getAttribute('data-lead-id');if(rowKey)setUpdated(prev=>({...prev,[rowKey]:'Qualified'}));});alert('Selected leads qualified.');return;}
   if(/Promote/.test(text)){void navigate({to:'/lead-inbox'});return;}
   if(/Regenerate|regenBtn/.test(text+(node.attribs.id??''))){alert('Sample draft refreshed. Live AI generation is not connected.');return;}
   setToggles(toggles.includes(key)?toggles.filter(k=>k!==key):[...toggles,key]);return;
  }
  setToggles(toggles.includes(key)?toggles.filter(k=>k!==key):[...toggles,key]);
 };
 let counter=0;
 const options:HTMLReactParserOptions={replace:(dom)=>{
  if(!(dom instanceof Element))return;
  const node=dom;const key=node.attribs.id??`${node.name}-${counter++}`;const attrs=attributesToProps(node.attribs);const cls=node.attribs.class??'';const text=nodeText(node);const children=()=>domToReact(node.children as DOMNode[],options);
  if(node.name==='script')return <></>;
  if(node.name==='a'){
   let path:typeof paths[Page]|'/leads/meridian'|undefined;const p=node.attribs['data-path'] as Page;
   if(p in paths)path=paths[p];else if(/View all leads|Back to.*Inbox|Back to Lead/.test(text))path='/lead-inbox';else if(/Research Brief/.test(text))path='/leads/meridian';else if(/queue/.test(text))path='/research-queue';else if(/Configure.*Sources/.test(text))path='/sources-and-platforms';else if(/Saved|matches/.test(text))path='/saved-searches';
   if(path)return <Link to={path} className={cls+(p===page?' active-status':'')} aria-current={p===page?'page':undefined}>{children()}</Link>;
   if(node.attribs.href?.startsWith('http')&&!node.attribs.href.includes('contribution.usercontent'))return <a href={node.attribs.href} className={cls} target="_blank" rel="noreferrer">{children()}</a>;
   return <Button variant="reference" className={cls} onClick={()=>void navigate({to:'/leads/meridian'})}>{children()}</Button>;
  }
  if(node.name==='button'){
   if(node.parent instanceof Element&&node.parent.attribs.id==='statusTabs'){
    const tab=text.trim().replace(/\s*\d+\s*$/,'').trim();return <Button {...attrs} variant="reference" className={cls+(status===tab?' active-status':'')} onClick={()=>setStatus(tab)}>{children()}</Button>;
   }
   return <Button {...attrs} variant="reference" className={cls+(toggles.includes(key)?' selected-control':'')} onClick={e=>act(e,node,key)} disabled={busy&&node.attribs.id==='findOpportunitiesBtn'}>{paused.includes(key)?'Activate':children()}</Button>;
  }
  if(node.name==='input'){
   if(node.attribs.type==='text'&&/Search companies/.test(node.attribs.placeholder??''))return <input {...attrs} value={query} onChange={e=>setQuery(e.target.value)} />;
   if(node.attribs.type==='range')return <input {...attrs} defaultValue={node.attribs.value??75} onChange={e=>setThreshold(Number(e.target.value))}/>;
   if(node.attribs.id==='selectAllCheckbox')return <input {...attrs} onChange={e=>document.querySelectorAll<HTMLInputElement>('.lead-row input').forEach(c=>{c.checked=e.target.checked;})}/>;
   const {value,checked,...rest}=attrs;return <input {...rest} defaultValue={value as string|undefined} defaultChecked={checked as boolean|undefined} />;
  }
  if(node.name==='textarea')return <textarea {...attrs} defaultValue={text}/>;
  if(node.name==='select'){return <select {...attrs} defaultValue={node.attribs.value} onChange={()=>{}}>{children()}</select>;}
  if(node.name==='div'&&node.attribs.contenteditable)return <div {...attrs} contentEditable suppressContentEditableWarning>{children()}</div>;
  if(node.attribs.id==='view-mode-label')return <span {...attrs}>{empty?'Preview Demo Data':'Preview Empty State'}</span>;
  if(node.attribs.id==='populated-state')return <div {...attrs} className={cls+(empty?' hidden':'')}>{children()}</div>;
  if(node.attribs.id==='empty-state')return <div {...attrs} className={empty?cls.replace(/\bhidden\b/g,''):cls}>{children()}</div>;
  if(node.attribs.id==='leadDetailDrawer'){
   if(!drawer)return <></>;
   let html=domToReact(node.children as DOMNode[],options);if(selected!=='1'&&lead){let raw=screens[String(id) as keyof typeof screens];const match=raw.match(/<div[^>]*id="leadDetailDrawer"[\s\S]*$/);if(match){const old=leads['1'];let content=match[0];for(const k of ['title','domain','employees','location','budget','stack','score','source','observed','inferred','pitchTitle','pitchBody']){if(old?.[k]&&lead[k])content=content.split(old[k]).join(lead[k]);}html=parse(content.replace(/^<div[^>]*>/,'').replace(/<\/main>[\s\S]*$/,''),{...options,replace:dom=>dom instanceof Element&&dom.attribs.id==='leadDetailDrawer'?<></>:options.replace?.(dom,0)});}}
   return <div {...attrs}>{html}</div>;
  }
  if(node.name==='tr'&&cls.includes('lead-row')){
   const rowKey=node.attribs['data-lead-id']??node.attribs['data-id']??'1';const rowStatus=updated[rowKey]??(/Needs Research/.test(text)?'Needs Research':/Qualified/.test(text)?'Qualified':'New');
   if((query&&!text.toLowerCase().includes(query.toLowerCase()))||(status!=='All'&&rowStatus!==status)||(filters.country&&!text.includes(filters.country))||empty)return <></>;
   return <tr {...attrs} data-lead-id={rowKey} onClick={e=>{if((e.target as HTMLElement).closest('button,input'))return;setSelected(rowKey);setDrawer(true);}}>{children()}</tr>;
  }
  if(node.attribs.id==='notesContainer')return <div {...attrs}>{notes.map((n,i)=><div key={i} className="rounded-lg bg-surface-container-low p-space-sm mb-2">{n}</div>)}{children()}</div>;
  if(node.name==='span'&&text.trim()==='75'&&page==='settings')return <span {...attrs}>{threshold}</span>;
 }};
 return <div className="radar-app" data-theme={theme}>{parse(shell.aside,options)}{parse(shell.header,options)}<nav className="radar-mobile-nav">{Object.entries(paths).map(([p,to])=><Link key={p} to={to} data-active={p===page}>{labels[p as Page]}</Link>)}</nav><div className="radar-body"><div className="reference-screen" data-screen={id}>{parse(screens[String(id) as keyof typeof screens],options)}{savedNames.length>0&&page==='saved-searches'&&<div className="px-8 py-4">{savedNames.map(n=><div key={n} className="p-4 bg-surface-container mb-4 rounded-lg">{n} · Active · Preview</div>)}</div>}</div></div>{notice&&<div role="status" className="radar-notice">{notice}</div>}{modal&&<div className="radar-modal-backdrop" onClick={()=>setModal('')}><section className="radar-modal" role="dialog" aria-modal="true" aria-label={modal} onClick={e=>e.stopPropagation()}><h2>{modal}</h2>{modal==='Connection details'?<p className="mb-6">This is a demo workspace. Live discovery services are not connected.</p>:modal==='Filter leads'?<><label htmlFor="filter-country">Country</label><select id="filter-country" className="w-full bg-surface-container p-3 mb-6" onChange={e=>setFilters({...filters,country:e.target.value})}><option value="">All countries</option>{['US','UK','AU','CA','DE'].map(c=><option key={c}>{c}</option>)}</select></>:<><label htmlFor="saved-name">Name</label><input id="saved-name" value={name} onChange={e=>setName(e.target.value)} placeholder="Enter a name"/></>}<div className="radar-modal-actions"><Button variant="ghost" onClick={()=>setModal('')}>Cancel</Button><Button onClick={()=>{if(name){setSavedNames([...savedNames,name]);setName('');}setModal('');alert(modal==='Filter leads'?'Filters applied.':'Applied to this preview session.');}}>Apply</Button></div></section></div>}</div>;
}
