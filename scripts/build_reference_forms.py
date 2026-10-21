import json, re, copy, datetime, shutil
from pathlib import Path
books=json.loads(Path('reference-data/workbooks.json').read_text(encoding='utf-8'))
def norm(s): return re.sub(r'[^a-z0-9]+','',str(s).lower())
def cells(sheet): return {c['cell']:c['value'] for row in sheet['rows'] for c in row['cells']}
def rowmap(sheet): return {r['row']:{re.sub(r'\d','',c['cell']):c['value'] for c in r['cells']} for r in sheet['rows']}
def scalar(v):
    if v is None or str(v).strip()=='' or str(v).startswith('#'): return None
    s=str(v).strip()
    try: return float(s) if '.' in s or 'E' in s.upper() else int(s)
    except ValueError: return s
def col(id,label,type='text',src=None,**kwargs): return dict(id=id,label=label,type=type,src=src or id,**kwargs)
def spec(id,section,labelcol,columns,rows=None,header=None): return dict(id=id,section=section,labelcol=labelcol,columns=columns,rows=rows,header=header)
def pct(inputs=['actual'],den='target',multiple=1): return col('percent','Achievement %','computed',formula='percent',inputs=inputs,denominator=den,multiplier=multiple)
def daily(id,section,labels,days):
    return spec(id,section,'A',[col('target','Target / day','target','B',owner='member'),*[col(day,day.title(),'daily',chr(67+i)) for i,day in enumerate(days)],col('total','Week total','computed',formula='sum',inputs=days),pct(days,'target',6),col('remarks','Remarks','text','K')],labels)
def simple(id,section,labels,labelcol='A',valuecol='B'): return spec(id,section,labelcol,[col('response','Response','text',valuecol)],labels)
sales=spec('sales','SALES METRICS','A',[col('opCount','OP accounts','number','B'),col('opValue','OP value (₹)','number','C'),col('srCount','SR accounts','number','D'),col('srValue','SR value (₹)','number','E'),col('remarks','Remarks','text','F')],['New Inquiries','Renewal Calls','Personal Referrals (PR)'])
payments=spec('payments','RUNNING ACCOUNTS','A',[col('called','Deals called','number','B'),col('pending','Pending amount (₹)','number','C'),col('received','Received this week (₹)','number','E'),col('remarks','Remarks','text','G')],['Pending Accounts'])
client=spec('client','CLIENT FEEDBACK','A',[col('count','Number','number','B'),col('details','Details / link','text','C')],['Clients Reviews','Video Testimonials'])
achievements=simple('achievements','ACHIEVEMENTS',None)
roadblocks=spec('roadblocks','STUCK POINTS','A',[col('issue','Stuck point','text','B'),col('reason','Reason','text','E'),col('action','Corrective action','text','H')],None)
learning=simple('learning','LEARNING & IMPROVEMENT',None)
summary=simple('summary','WEEKLY SUMMARY',['Avg. Daily Task Completion:','Avg. Weekly Task Achievement:','Analysis  :'])
alka=[daily('daily','DAILY TASKS',['Commercial - New Inquiries','Renewals - Commercial Accounts','LD & Quotation Followup'],['tue','wed','thu','fri','sat','sun','mon']),spec('weekly','WEEKLY TASKS','B',[col('occurrence','Occurrence','text','A'),col('support','Support','text','C'),col('status','Status','status','D'),col('target','Target','target','E',owner='member'),col('actual','Actual','number','F'),pct(),col('remarks','Remarks','text','H')],['Payment Calling - Scanning','AI Sales','Inquiries Portals: IndiaMart / AdWords / BNI / Just Dial','Team Sales Target (Week)','Team Sales Target (Month)']),spec('bd','WEEKLY TASKS','B',[col('occurrence','Occurrence','text','A'),col('response','Update / status','text','D'),col('sales','Product sale value / notes','text','H'),col('pending','Old pending','text','J')],['Vendor Registration at Prospects & Clients','PC Product - Add New & Increase Sales','BD Team Review']),spec('monthly','MONTHLY / QUARTERLY','B',[col('occurrence','Occurrence','text','A'),col('status','Status','status','C'),col('remarks','Remarks','text','D')],['BD Training & Guidance','Associate Search & Addition','Promotional Material','BD SOPs - Videos & PPTs','Referral Partner Training']),sales,payments,spec('channels','OTHER SALES CHANNELS','A',[col('target','Target','target','B',owner='member'),col('actual','Achieved','number','C'),pct(),col('remarks','Remarks','text','F')],['Renewal Sales','Google Sales','BNI Sales','Apl Ref Sales']),spec('vendors','VENDOR REGISTRATION','A',[col('count','Count','number','E'),col('remarks','Remarks','text','G')],['# VR Final (Vendor Registrations completed)','# VRR Pipeline (Requests in pipeline)']),spec('recognition','RECOGNITION','A',[col('name','Name','text','B'),col('remarks','Remarks','text','E')],['Top Performer — SPR','Top Performer — OFC']),client,achievements,roadblocks,learning,summary]
deepika=[daily('daily','DAILY TASKS',['Renewals Calling','LD & Quotation Followup'],['mon','tue','wed','thu','fri','sat','sun']),spec('cc','DAILY TASKS','B',[col('training','CC staff training','text','C'),col('staff','CC staff issues','text','E'),col('complaints','Client complaints','text','G'),col('apl','APL issues','text','I')],['CC Tasks Overview']),spec('phone','DAILY TASKS','B',[col('whatsapp','All WhatsApp replied','text','C'),col('forwarded','Important calls / messages forwarded','text','D'),col('leads','Leads','number','E'),col('finalized','Finalized','number','F'),col('amount','Amount (₹)','number','G'),col('remarks','Remarks','text','H')],['Phone Handling (9810138587)']),spec('weekly','WEEKLY TASKS','B',[col('occurrence','Occurrence','text','A'),col('priority','Priority','text','C'),col('due','Due date','text','D'),col('status','Status','status','E'),col('followup','Next follow-up','text','F'),col('remarks','Remarks','text','G')],['Payment Calling - Scanning','Touchbase of Residential Key Clients','Gurgaon Office Visit','CC Training & Guidance']),spec('monthly','MONTHLY / QUARTERLY','B',[col('occurrence','Occurrence','text','A'),col('status','Status','status','E'),col('tat','TAT','text','F'),col('reason','Reason for pendency','text','G'),col('remarks','Remarks','text','I')],['Technicians Training','Technicians Reward & Recognition','CC - SOP Sheet - Videos','Technicians Review & Salary Appraisal','New Associate (Apl/CC) Hiring & Training']),spec('hiring','MONTHLY / QUARTERLY','B',[col('delhi','Hired at Delhi','number','C'),col('delhiSource','Delhi hiring source','text','D'),col('ggn','Hired at Gurgaon','number','F'),col('ggnSource','Gurgaon hiring source','text','G')],['Techinician Hiring']),spec('technician','MONTHLY / QUARTERLY','B',[col('status','Feedback status','status','C'),col('remarks','Feedback remarks','text','D'),col('referralStatus','Referral sheet status','status','H'),col('referralRemarks','Referral remarks','text','I')],['Technician Feedback']),sales,payments,simple('client','CLIENT FEEDBACK',['Clients Review / Testimonial']),achievements,{**roadblocks,'columns':[col('issue','Stuck point','text','B'),col('reason','Reason','text','D'),col('action','Corrective action','text','F')]},learning,summary]
kajal=[daily('tenderDaily','DAILY TENDER OPERATIONS',['Tender Search','Tender Filing','Tender Preparation, Submission & Pricing','Tender Documentation','LD & Quotation & Tender Follow-up'],['mon','tue','wed','thu','fri','sat','sun']),spec('weekly','WEEKLY TASKS / KRA','B',[col('occurrence','Occurrence','text','A'),col('status','Status','status','D'),col('remarks','Remarks','text','E')],['Payment Calling – Scanning']),spec('sites','WEEKLY TASKS / KRA','B',[col('occurrence','Occurrence','text','A'),col('status1','Status 1','status','D'),col('site1','Site 1','text','E'),col('status2','Status 2','status','F'),col('site2','Site 2','text','G'),col('status3','Status 3','status','H'),col('site3','Site 3','text','I'),col('status4','Status 4','status','J'),col('site4','Site 4','text','K')],['Service Feedbacks from Tender Clients','Site Pics','Extension at Tender Sites']),spec('associates','WEEKLY TASKS / KRA','B',[col('city1','State / city 1','text','D'),col('city2','State / city 2','text','F'),col('city3','State / city 3','text','H'),col('city4','State / city 4','text','J')],['Search New Associates & Register at PestCure']),spec('pipeline','TENDER PIPELINE','A',[col('target','Target','target','B',owner='member'),col('actual','Actual','number','C'),pct(),col('status','Status','status','E'),col('remarks','Remarks','text','F')],['Tender Search','Tender Filed','Tender Products','Tender Services','Tender Eligible','Tender Lost','Tender Pipeline','Tenders Finalised','Finalised Amount (₹)']),spec('compliance','BID STAGE','A',[col('open','Bid open','number','B'),col('final','Final','number','C'),col('lost','Lost','number','D'),col('status','L1 / L2 / L3','text','E'),col('remarks','Remarks','text','F')],['Technical','Financial']),payments,daily('salesDaily','DAILY TASKS',['Renewals','New Sales (As & When)','Personal Ref.'],['tue','wed','thu','fri','sat','sun','mon']),client,achievements,roadblocks,learning,summary]
SECTIONS=['EMPLOYEE & ATTENDANCE','DAILY TASKS','DAILY TENDER OPERATIONS','WEEKLY TASKS','MONTHLY / QUARTERLY','SALES METRICS','RUNNING ACCOUNTS','TARGETS & ACHIEVEMENT','OTHER SALES CHANNELS','VENDOR REGISTRATION','RECOGNITION','CLIENT FEEDBACK','ACHIEVEMENTS','STUCK POINTS','LEARNING & IMPROVEMENT','WEEKLY SUMMARY','TENDER PIPELINE','BID STAGE']
LABELS={'daily':'Daily activity','tenderDaily':'Daily tender operations','weekly':'Weekly tasks','bd':'Business development review','monthly':'Monthly & quarterly tasks','sales':'Sales metrics','payments':'Running accounts & payments','channels':'Other sales channels','vendors':'Vendor registration','recognition':'Recognition','client':'Client feedback','achievements':'Achievements','roadblocks':'Stuck points & corrective actions','learning':'Learning & improvement','summary':'Weekly summary','cc':'Customer care overview','phone':'Phone handling','hiring':'Technician hiring','technician':'Technician feedback & referrals','sites':'Tender sites & feedback','associates':'New associates','pipeline':'Tender pipeline & bid performance','compliance':'Bid stage & compliance','salesDaily':'Daily sales calling'}
def block(sheet,section):
    rows=rowmap(sheet); starts=[r for r,v in rows.items() if norm(v.get('A','')).startswith(norm(section))]
    if not starts: return {}
    start=starts[0]; end=min([r for r,v in rows.items() if r>start and any(norm(v.get('A','')).startswith(norm(s)) for s in SECTIONS)] or [10000])
    return {r:v for r,v in rows.items() if start<r<end}
def make_field(prefix, sheet, s):
    candidates=block(sheet,s['section']); found=[]
    if s['rows'] is not None:
        for label in s['rows']:
            matches=[(r,v) for r,v in candidates.items() if norm(v.get(s['labelcol'],''))==norm(label)]
            found.append((label,matches[0][1] if matches else {}))
    else:
        for r,v in candidates.items():
            label=v.get(s['labelcol'],'').strip()
            if label and norm(label) not in ['field','description','date','reviewedby'] and not label.startswith('#'): found.append((label,v))
    rows=[]; values={}
    for i,(label,v) in enumerate(found):
        rid=f'{s["id"]}-r{i}'; defaults={}; rv={}
        for c in s['columns']:
            if c['type']=='computed': continue
            raw=scalar(v.get(c['src']))
            if raw is not None: rv[c['id']]=raw
            if c['type']=='target' or c['id'] in ['occurrence','support']:
                if raw is not None: defaults[c['id']]=raw
        rows.append(dict(id=rid,label=label,defaults=defaults,scored=norm(label)!='tenderlost'))
        values[rid]=rv
    columns=[{k:v for k,v in c.items() if k!='src'} for c in s['columns']]
    field=dict(id=f'{prefix}-{s["id"]}',kra=LABELS[s['id']],label=LABELS[s['id']],type='table',unit='',target=1,owner='member',direction='higher',required=False,table=dict(columns=columns,rows=rows,showTotals=s['id'] in ['sales','payments','client'],source=sheet['name']))
    return field,values
def date_value(raw):
    s=str(raw or '').strip()
    if re.fullmatch(r'\d{5}',s): return (datetime.date(1899,12,30)+datetime.timedelta(days=int(s)))
    nums=re.findall(r'\d+',s)
    if len(nums)==3:
        try: return datetime.date(int(nums[2])+(2000 if len(nums[2])==2 else 0),int(nums[1]),int(nums[0]))
        except ValueError: pass
    return None
def member_fields(prefix,sheet,specs):
    fields=[]; tables={}
    attendance_cols=[col('value','Details')]; attendance=[]; av={}; c=cells(sheet)
    attendance_items=[('Name',c.get('B5','')),('Role',str(c.get('C5','')).replace('Role :','').strip()),('Team',' '.join(str(c.get(f'{letter}5','')) for letter in 'FGHI' if c.get(f'{letter}5'))),('Review date',c.get('B6','')),('Leaves',c.get('H6','')),('Lates',c.get('I6','')),('Short / half days',c.get('J6',''))]
    for i,(label,value) in enumerate(attendance_items):
        rid=f'att-{i}'; attendance.append(dict(id=rid,label=label,defaults={},scored=False)); av[rid]={'value':value}
    fields.append(dict(id=f'{prefix}-attendance',kra='Employee & attendance',label='Employee & attendance',type='table',unit='',target=1,owner='member',direction='higher',required=False,table=dict(columns=[{k:v for k,v in cc.items() if k!='src'} for cc in attendance_cols],rows=attendance)))
    tables[fields[-1]['id']]=av
    for s in specs:
        f,v=make_field(prefix,sheet,s); fields.append(f);tables[f['id']]=v
    # OP and SR targets are a two-row target/result table for each period.
    tb=block(sheet,'TARGETS & ACHIEVEMENT'); rr=list(tb.items()); rv={}; rows=[]
    for period in ['Monthly','Weekly']:
        targetrow=next(((r,v) for r,v in rr if norm(v.get('A','')).startswith(norm(period+' Target')) or norm(v.get('E','')).startswith(norm(period+' Target'))),None)
        actualrow=next(((r,v) for r,v in rr if norm(v.get('A','')).startswith(norm(period+' Achieved')) or norm(v.get('E','')).startswith(norm(period+' Achieved'))),None)
        letters=['B','C'] if prefix=='alka' else ['C','D'] if period=='Monthly' else ['G','H']
        for kind,letter in zip(['OP','SR'],letters):
            rid=period.lower()+'-'+kind.lower(); value={}
            for key,entry in [('target',targetrow),('actual',actualrow)]:
                v=scalar(entry[1].get(letter)) if entry else None
                if v is not None: value[key]=v
            rows.append(dict(id=rid,label=f'{period} {kind}',defaults={'target':value['target']} if 'target' in value else {},scored=True)); rv[rid]=value
    targetfield=dict(id=f'{prefix}-targets',kra='Targets & achievement (OV)',label='Individual sales — OP & SR',type='table',unit='INR',target=1,owner='admin',direction='higher',required=False,table=dict(columns=[{k:v for k,v in cc.items() if k!='src'} for cc in [col('target','Target (₹)','target',owner='admin'),col('actual','Achieved (₹)','number'),pct(),col('remarks','Remarks')]],rows=rows))
    insert=next((i+1 for i,f in enumerate(fields) if f['id']==f'{prefix}-payments'),len(fields)-1); fields.insert(insert,targetfield);tables[targetfield['id']]=rv
    # Preserve additional BD prompts in their own editable responses.
    if prefix=='alka':
        extra={'id':'bd-notes','section':'WEEKLY TASKS','labelcol':'D','columns':[col('response','Response','text','D')],'rows':['Major Issue :','Suggestion :']}
        f,v=make_field(prefix,sheet,extra) if False else (None,None)
        field=dict(id='alka-bd-notes',kra='Business development review',label='BD team issues & suggestions',type='table',unit='',target=1,owner='member',direction='higher',required=False,table=dict(columns=[dict(id='response',label='Response',type='text')],rows=[dict(id='issue',label='Major issue',defaults={}),dict(id='suggestion',label='Suggestion',defaults={})])); vals={}
        for key,label in [('issue','Major Issue'),('suggestion','Suggestion')]:
            match=next((str(v.get('D','')).split(':',1)[-1].strip() for v in block(sheet,'WEEKLY TASKS').values() if norm(v.get('D','')).startswith(norm(label))), '')
            vals[key]={'response':match} if match else {}
        fields.insert(4,field);tables[field['id']]=vals
    return fields,tables
out=[]
for book,prefix,name,role_id,role_name,specs in zip(books,['alka','deepika','kajal'],['Alka Ghai','Deepika Gulia','Kajal Gaur'],['role-commercial-bd','role-customer-care','role-tender-ops'],['Commercial & Business Development','Customer Care & Operations','Tender Operations & Bidding'],[alka,deepika,kajal]):
    fmt=next(s for s in book['sheets'] if s['name'].strip()=='Format'); latest=book['sheets'][-1]; fields,_=member_fields(prefix,fmt,specs); latest_fields,latest_values=member_fields(prefix,latest,specs)
    for f in fields:
        for row in f['table']['rows']:
            for column in f['table']['columns']:
                if column['type']=='target':
                    v=latest_values.get(f['id'],{}).get(row['id'],{}).get(column['id'])
                    if v is not None: row['defaults'][column['id']]=v
    history=[]
    for index,sheet in enumerate(s for s in book['sheets'] if not any(x in s['name'].lower() for x in ['format','kra','old'])):
        fs,tables=member_fields(prefix,sheet,specs); c=cells(sheet); start_raw=c.get('E6',c.get('F6',''));end_raw=c.get('G6',c.get('I6',''));start=date_value(start_raw);end=date_value(end_raw);notes=[]
        if not start or not end or not 0<=(end-start).days<=8:
            notes.append('The original review period contains inconsistent dates. Check the source workbook; displayed dates are preserved.')
            digits=re.sub(r'\D','',sheet['name'])
            try: review_date=datetime.datetime.strptime(digits,'%d%m%Y' if len(digits)==8 else '%d%m%y').date()
            except ValueError: review_date=datetime.date(2026,8,4)+datetime.timedelta(weeks=index)
            group=review_date-datetime.timedelta(days=7)
        else: group=start
        week=(group-datetime.timedelta(days=group.weekday())).isoformat()
        if any(str(cell['value']).startswith('#') for r in sheet['rows'] for cell in r['cells']): notes.append('Excel formula errors are omitted from results; totals and percentages recalculate from available numeric inputs.')
        if any('+' in str(val) and re.fullmatch(r'[\d\s+.]+',str(val)) for table in tables.values() for row in table.values() for val in row.values()): notes.append('Amounts entered as arithmetic text are preserved as text. Enter the confirmed numeric amount to include them in calculations.')
        history.append(dict(id=f'reference-{prefix}-{index}',week=week,originalPeriod=f'{start_raw} – {end_raw}',fields=fs,tables=tables,source=dict(file=book['file'],sheet=sheet['name'],notes=notes)))
    out.append(dict(prefix=prefix,name=name,roleId=role_id,roleName=role_name,file=book['file'],fields=fields,history=history))
    target=Path('public/reference-sheets');target.mkdir(parents=True,exist_ok=True);shutil.copyfile(Path('C:/Users/DELL/Downloads')/book['file'],target/book['file'])
Path('src/data/referenceForms.json').write_text(json.dumps(out,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps([{'name':r['name'],'sections':len(r['fields']),'rows':sum(len(f['table']['rows']) for f in r['fields']),'history':len(r['history'])} for r in out],indent=2))
