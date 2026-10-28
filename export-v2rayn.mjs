import {createHash} from 'node:crypto';
// Convert ordered rules; only adjacent equal-policy domain rules may be merged.
export function exportV2rayN(lines){
 const out=[];const tags={DIRECT:'direct',PROXY:'proxy',AdBlock:'block',REJECT:'block'};
 for(const line of lines){
  const [type,value,policy]=line.split(',');
  if(type==='FINAL'){out.push({Remarks:'未匹配流量代理',OutboundTag:'proxy',Enabled:true,Port:'0-65535'});continue;}
  const tag=tags[policy];if(!tag)throw Error(`Unknown policy ${policy}`);
  if(['DOMAIN','DOMAIN-SUFFIX','DOMAIN-KEYWORD'].includes(type)){
   const domain=({DOMAIN:'full:','DOMAIN-SUFFIX':'domain:','DOMAIN-KEYWORD':'keyword:'})[type]+value;
   const last=out.at(-1);
   if(last?.Domain&&last.OutboundTag===tag)last.Domain.push(domain);
   else out.push({Remarks:tag==='block'?'广告/阻断规则（可禁用）':tag==='direct'?'域名直连':'域名代理',OutboundTag:tag,Enabled:true,Domain:[domain]});
  }else if(type==='IP-CIDR'||type==='GEOIP')out.push({Remarks:type==='GEOIP'?'中国 IP 直连':'局域网地址直连',OutboundTag:tag,Enabled:true,Ip:[type==='GEOIP'?'geoip:'+value.toLowerCase():value]});
  else throw Error(`Unsupported rule ${type}`);
 }
 return out.map((r,i)=>({...r,Id:createHash('sha256').update(`${i}:${r.OutboundTag}:${r.Remarks}`).digest('hex').slice(0,32)}));
}
export function domainPolicy(rules,host){
 for(const r of rules){if(!r.Enabled)continue;
  if(r.Domain?.some(d=>d.startsWith('full:')?host===d.slice(5):d.startsWith('domain:')?(host===d.slice(7)||host.endsWith('.'+d.slice(7))):d.startsWith('keyword:')?host.includes(d.slice(8)):false))return r.OutboundTag;
  if(r.Port==='0-65535')return r.OutboundTag;
 }return 'proxy';
}
