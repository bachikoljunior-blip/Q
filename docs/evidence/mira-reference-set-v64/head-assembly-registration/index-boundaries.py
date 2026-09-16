from pathlib import Path
import json
r=Path(__file__).resolve().parent
P=json.loads((r/'instances.json').read_text())['instances'];B=json.loads((r/'existing-boundaries.json').read_text());E=json.loads((r/'interfaces.json').read_text())['interfaces']
openedges=[]
for b in B:
 id=b['id'];s='L' if id.endswith('-L') else 'R' if id.endswith('-R') else None
 for e in ['u0','u1']+(['v0'] if id=='F05-R' else ['v1'] if id=='F05-L' else []):
  if e=='u0':
   if id.startswith('F05'):targets=['F18-'+s,'F19-'+s];trim='one ordered subdivision parameter needed; not fixed'
   elif id.startswith('F07'):targets=['F19-'+s,'F20-'+s];trim='one ordered subdivision parameter needed; not fixed'
   elif id.startswith('F09'):targets=['F20-'+s];trim='full edge candidate; compatibility not proven'
   else:targets=['F17'];trim='full curve known only on F11 side; F17 side unresolved'
  elif e=='u1':
   if id.startswith(('F05','F07')):targets=[];trim='blocked F21 preauricular ownership; no current type stretched to fill'
   else:targets=['N01'];trim='subsequence of upper N01 boundary; parameter/order/weight fit pending'
  else:targets=['F18-'+s,'F03-'+s];trim='inner-to-outer ordered split needed, not a direct forehead join'
  openedges.append({'owner':id,'nativeEdge':e,'controlsM':b['edges'][e],'parameter':'v increasing for u0/u1, u increasing for v0/v1','targets':targets,'status':trim,'registeredOtherSide':False})
(r/'open-native-boundaries.json').write_text(json.dumps(openedges,indent=2)+'\n')
rows=['# Exact instance correspondence — design ledger only','','80 instance IDs have explicit counterparts. Only six existing seam records have numeric bilateral geometry. All other directions are declared conventions, not validated surface winding.','', '| Instance | Type / layer | Named interface IDs | Open ports |','|---|---|---|---|']
for p in P:rows.append('| '+p['id']+' | '+p['type']+' / '+p['layer']+' | '+', '.join(p['interfaces'])+' | '+', '.join(p['openPorts'])+' |')
(r/'INSTANCE_TABLE.md').write_text('\n'.join(rows)+'\n')
rows=['# Interface IDs','','Read interfaces.json for each source and unresolved metric. +t/-t are a proposed shared traversal convention except for existing-v63 records with explicit u/v correspondence.','', '| ID | A | B | Kind | Boundary region |','|---|---|---|---|---|']
for e in E:rows.append('| '+e['id']+' | '+e['a']+' | '+e['b']+' | '+e['kind']+' | '+e['region']+' |')
(r/'INTERFACE_TABLE.md').write_text('\n'.join(rows)+'\n')
