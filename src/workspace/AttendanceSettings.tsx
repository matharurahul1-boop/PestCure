import React,{useState}from'react';
import type{Workspace}from'./model';
import{DEFAULT_ATTENDANCE_POLICY,type AttendancePolicy}from'./attendance';

export function AttendanceSettings({data,save}:{data:Workspace;save:(patch:Partial<Workspace>)=>void}){
 const[policy,setPolicy]=useState<AttendancePolicy>(data.attendancePolicy??DEFAULT_ATTENDANCE_POLICY);const[error,setError]=useState('');
 const fields:Array<[keyof AttendancePolicy,string]>=[['present','Present'],['absent','Absent'],['halfDay','Half day'],['shortDay','Short day'],['paidLeave','Approved leave'],['holiday','Holiday'],['latePenalty','Late arrival penalty'],['maxDaily','Maximum daily points']];
 return <section className="panel settings-panel"><h2>Attendance marking scheme</h2><div className="attendance-policy">{fields.map(([key,label])=><label key={key}>{label}<input aria-label={`${label} points`} type="number" min="0" max="100" value={policy[key]} onChange={e=>setPolicy({...policy,[key]:Number(e.target.value)})}/></label>)}</div><button className="button primary" onClick={()=>{if(policy.maxDaily<=0||Object.values(policy).some(n=>!Number.isFinite(n)||n<0)){setError('Use valid non-negative points and a maximum above zero.');return;}save({attendancePolicy:policy});setError('');}}>Save marking scheme</button>{error&&<p className="form-error">{error}</p>}</section>;
}

// Engage API settings are intentionally disabled until the production adapter is ready.
